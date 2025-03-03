import { CHARS, TOKENIZER_STATES, TOKENS, UTF8_BOUNDS } from "@/constants/constants";
import { BaseParser } from "@/parsers/base-parser";

export class Parser extends BaseParser {
    public getEmitter() {
        return this.eventEmitter
    }

    public onToken(callback: (token: number, value: any) => void) {
        this.eventEmitter.onToken(callback)
    }

    public onValue(callback: (value: any) => void) {
        this.eventEmitter.onValue(callback)
    }

    public onError(callback: (err: Error) => void) {
        this.eventEmitter.onError(callback)
    }

    public getLastValue() {
        return this.stateHandler.getLastValue();
    }

    public getLastIncompleteValue(omitEmpty = false) {
        return this.stateHandler.getLastIncompleteValue(omitEmpty);
    }

    public getCurrentKey() {
        return this.stateHandler.getKey();
    }

    public getStack() {
        return this.stateHandler.getStack()
    }

    public getOffset() {
        return this.stateHandler.getOffset()
    }

    /**
     * Processes an incoming buffer of JSON data.
     * @param buffer - The input JSON chunk.
     */
    public write(buffer: Uint8Array | string): Error | undefined {
        if (typeof buffer === "string") {
            buffer = this.encoder.encode(buffer); // Convert to Uint8Array
        }

        let n: number;
        let res: number | Error = 0;
        let hasError: Error | undefined;
        for (let i = 0; i < buffer.length; i++) {
            n = buffer[i];

            switch (this.stateHandler.getTokenizerState()) {
                case TOKENIZER_STATES.START:
                    hasError = this.processStartState(n, buffer, i);
                    if (typeof hasError !== "undefined") return hasError;
                    break;
                case TOKENIZER_STATES.STRING1:
                    res = this.processStringStartingState(n, buffer, i);
                    if (typeof res !== "number") return res;
                    i = res;
                    break;
                case TOKENIZER_STATES.STRING2:
                    res = this.processStringBackslashState(n, buffer, i);
                    if (typeof res !== "number") return res;
                    i = res;
                    break;
                case TOKENIZER_STATES.STRING3:
                case TOKENIZER_STATES.STRING4:
                case TOKENIZER_STATES.STRING5:
                case TOKENIZER_STATES.STRING6:
                    // unicode hex codes
                    res = this.processStringUnicodeState(n, buffer, i);
                    if (typeof res !== "number") return res;
                    i = res;
                    break;
                case TOKENIZER_STATES.NUMBER1:
                case TOKENIZER_STATES.NUMBER3:
                    res = this.processNumberState(n, i);
                    if (typeof res !== "number") return res;
                    i = res;
                    break;
                case TOKENIZER_STATES.TRUE1:
                case TOKENIZER_STATES.TRUE2:
                case TOKENIZER_STATES.TRUE3:
                    hasError = this.processTrueState(n, buffer, i);
                    if (typeof hasError !== "undefined") return hasError;
                    break;
                case TOKENIZER_STATES.FALSE1:
                case TOKENIZER_STATES.FALSE2:
                case TOKENIZER_STATES.FALSE3:
                case TOKENIZER_STATES.FALSE4:
                    hasError = this.processFalseState(n, buffer, i);
                    if (typeof hasError !== "undefined") return hasError;
                    break;
                case TOKENIZER_STATES.NULL1:
                case TOKENIZER_STATES.NULL2:
                case TOKENIZER_STATES.NULL3:
                    this.processNullState(n, buffer, i);
                    break;
                default:
                    this.errorHandler.charError(buffer, i);
            }
        }
    }

    /**
     * Processes tokens at the root level (e.g. `{`, `[`, `:`, `,`).
     */
    private processStartState(n: number, buffer: Uint8Array, i: number): Error | undefined {
        this.stateHandler.incOffset();

        if (n === CHARS.LEFT_BRACE) this.tokenHandler.handleToken(TOKENS.LEFT_BRACE, "{");
        else if (n === CHARS.RIGHT_BRACE) this.tokenHandler.handleToken(TOKENS.RIGHT_BRACE, "}");
        else if (n === CHARS.LEFT_BRACKET) this.tokenHandler.handleToken(TOKENS.LEFT_BRACKET, "[");
        else if (n === CHARS.RIGHT_BRACKET) this.tokenHandler.handleToken(TOKENS.RIGHT_BRACKET, "]");
        else if (n === CHARS.COLON) this.tokenHandler.handleToken(TOKENS.COLON, ":");
        else if (n === CHARS.COMMA) this.tokenHandler.handleToken(TOKENS.COMMA, ",");
        else if (n === CHARS.T) this.stateHandler.setTokenizerState(TOKENIZER_STATES.TRUE1);
        else if (n === CHARS.F) this.stateHandler.setTokenizerState(TOKENIZER_STATES.FALSE1);
        else if (n === CHARS.N) this.stateHandler.setTokenizerState(TOKENIZER_STATES.NULL1);
        else if (n === CHARS.QUOTE) {
            this.stringHandler.reset("")
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.STRING1);
        } else if (n === CHARS.MINUS) {
            this.stringHandler.resetString("-")
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.NUMBER1);
        } else if (n >= CHARS.ZERO && n <= CHARS.NINE) {
            this.stringHandler.setFromCharcode(n)
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.NUMBER3);
        } else if (!CHARS.WHITESPACES.includes(n)) {
            return this.errorHandler.charError(buffer, i);
        }
    }

    private processStringUnicodeState(n: number, buffer: Uint8Array, i: number): Error | number {
        const isNumber = n >= CHARS.ZERO && n <= CHARS.NINE
        const isBigHexLetter = n >= CHARS.BIG_A && n <= CHARS.BIG_F
        const isHexLetter = n >= CHARS.A && n <= CHARS.F

        if (isNumber || isBigHexLetter || isHexLetter) {
            this.stringHandler.addUnicodeFromCharCode(n);
            const currentState = this.stateHandler.getTokenizerState();
            this.stateHandler.incTokenizerState()

            if (currentState === TOKENIZER_STATES.STRING6) {
                const intVal = parseInt(this.stringHandler.getUnicode(), 16);
                this.stringHandler.setUnicode(undefined)

                //<56320,57343> - lowSurrogate
                if (
                    this.stringHandler.getHighSurrogate() !== undefined &&
                    intVal >= UTF8_BOUNDS.LOW_SURROGATE_START &&
                    intVal <= UTF8_BOUNDS.LOW_SURROGATE_END
                ) {
                    this.stringHandler.appendStringBuf(this.encoder.encode(String.fromCharCode(this.stringHandler.getHighSurrogate() || 0, intVal)));
                    this.stringHandler.setHighSurrogate(undefined);
                } else if (
                    this.stringHandler.getHighSurrogate() === undefined &&
                    intVal >= UTF8_BOUNDS.HIGH_SURROGATE_START &&
                    intVal <= UTF8_BOUNDS.HIGH_SURROGATE_END
                ) {
                    //<55296,56319> - highSurrogate
                    this.stringHandler.setHighSurrogate(intVal);
                } else {
                    if (this.stringHandler.getHighSurrogate() !== undefined) {
                        this.stringHandler.appendStringBuf(this.encoder.encode(String.fromCharCode(this.stringHandler.getHighSurrogate() || 0)));
                        this.stringHandler.setHighSurrogate(undefined);
                    }

                    this.stringHandler.appendStringBuf(this.encoder.encode(String.fromCharCode(intVal)));
                }

                this.stateHandler.setTokenizerState(TOKENIZER_STATES.STRING1);
            }
        } else {
            return this.errorHandler.charError(buffer, i);
        }

        return i;
    }

    private processStringBackslashState(n: number, buffer: Uint8Array, i: number): Error | number {
        n = buffer[i];

        if (n === CHARS.QUOTE) {
            this.stringHandler.appendStringChar(n); this.stateHandler.setTokenizerState(TOKENIZER_STATES.STRING1);
        } else if (n === CHARS.BACKSLASH) {
            this.stringHandler.appendStringChar(CHARS.BACKSLASH); this.stateHandler.setTokenizerState(TOKENIZER_STATES.STRING1);
        } else if (n === CHARS.FORWARD_SLASH) {
            this.stringHandler.appendStringChar(CHARS.FORWARD_SLASH);
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.STRING1);
        } else if (n === CHARS.B) {
            this.stringHandler.appendStringChar(CHARS.BACKSPACE);
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.STRING1);
        } else if (n === CHARS.F) {
            this.stringHandler.appendStringChar(CHARS.FORM_FEED);
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.STRING1);
        } else if (n === CHARS.N) {
            this.stringHandler.appendStringChar(CHARS.NEWLINE);
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.STRING1);
        } else if (n === CHARS.R) {
            this.stringHandler.appendStringChar(CHARS.CARRIAGE_RETURN);
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.STRING1);
        } else if (n === CHARS.T) {
            this.stringHandler.appendStringChar(CHARS.TAB);
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.STRING1);
        } else if (n === CHARS.U) {
            this.stringHandler.setUnicode("");
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.STRING3)
        } else {
            return this.errorHandler.charError(buffer, i);
        }

        return i;
    }

    private processStringStartingState(n: number, buffer: Uint8Array, i: number): Error | number {
        // check for carry over of a multi byte char split between data chunks
        // & fill temp buffer it with start of this data chunk up to the boundary limit set in the last iteration
        if (this.utf8Handler.hasBytesRemaining()) {
            const remainingBytes = this.utf8Handler.getBytesRemaining();

            this.stringHandler.appendStringBuf(
                this.utf8Handler.getRemainingBytesInBuff(buffer)
            )

            i = i + remainingBytes - 1;
            // else if no remainder bytes carried over, parse multi byte (>=128) chars one at a time
        } else if (!this.utf8Handler.hasBytesRemaining() && n >= UTF8_BOUNDS.MIN_MULTI_BYTE) {
            if (n <= UTF8_BOUNDS.INVALID_LOWER || n > UTF8_BOUNDS.BYTE_4_MAX) {
                const error = new Error(
                    "Invalid UTF-8 character at position " +
                    i + " in state " +
                    this.stateHandler.getTokenizerStateName() +
                    " with value: " + n
                );

                this.eventEmitter.handleError(error);
                return error;
            }

            if ((n >= UTF8_BOUNDS.BYTE_2_MIN) && (n <= UTF8_BOUNDS.BYTE_2_MAX)) this.utf8Handler.setBytesInSequence(2);
            if ((n >= UTF8_BOUNDS.BYTE_3_MIN) && (n <= UTF8_BOUNDS.BYTE_3_MAX)) this.utf8Handler.setBytesInSequence(3);
            if ((n >= UTF8_BOUNDS.BYTE_4_MIN) && (n <= UTF8_BOUNDS.BYTE_4_MAX)) this.utf8Handler.setBytesInSequence(4);

            // if bytes needed to complete char fall outside buffer length, we have a boundary split
            if ((this.utf8Handler.getBytesInSequence() + i) > buffer.length) {
                this.utf8Handler.handleBoundarySplit(i, buffer)
                i = buffer.length - 1;
            } else {
                this.stringHandler.appendStringBuf(buffer, i, i + this.utf8Handler.getBytesInSequence())
                i = i + this.utf8Handler.getBytesInSequence() - 1;
            }
        } else if (n === CHARS.QUOTE) {
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.START)
            this.stringHandler.flushBuffer()
            this.tokenHandler.handleToken(TOKENS.STRING, this.stringHandler.getString())
            this.stateHandler.addOffset(this.encoder.encode(this.stringHandler.getString()).length + 1)
            this.stringHandler.resetString()
        } else if (n === CHARS.BACKSLASH) {
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.STRING2)
        } else if (n >= CHARS.SPACE) {
            this.stringHandler.appendStringChar(n)
        } else {
            return this.errorHandler.charError(buffer, i)
        }

        return i;
    }

    /**
     * Parses numeric values.
     */
    private processNumberState(n: number, i: number): Error | number {
        if (
            (n >= CHARS.ZERO && n <= CHARS.NINE) ||
            n === CHARS.DOT ||
            n === CHARS.E ||
            n === CHARS.BIG_E ||
            n === CHARS.PLUS ||
            n === CHARS.MINUS
        ) {
            this.stringHandler.addFromCharCode(n);
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.NUMBER3)
        } else {
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.START);

            const error = this.numberReviver(this.stringHandler.getString())

            if (error) {
                return error;
            }

            this.stateHandler.addOffset(this.stringHandler.getString().length - 1)
            this.stringHandler.resetString()
            i--;
        }

        return i;
    }

    private processFalseState(n: number, buffer: Uint8Array, i: number) {
        const tokenizerState = this.stateHandler.getTokenizerState();

        if (tokenizerState === TOKENIZER_STATES.FALSE1 && n === CHARS.A) {
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.FALSE2)
            return
        }

        if (tokenizerState === TOKENIZER_STATES.FALSE2 && n === CHARS.L) {
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.FALSE3)
            return
        }

        if (tokenizerState === TOKENIZER_STATES.FALSE3 && n === CHARS.S) {
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.FALSE4)
            return
        }

        if (tokenizerState === TOKENIZER_STATES.FALSE4 && n === CHARS.E) {
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.START)
            this.tokenHandler.handleToken(TOKENS.FALSE, false)
            this.stateHandler.addOffset(4)
            return
        }

        return this.errorHandler.charError(buffer, i);
    }

    private processTrueState(n: number, buffer: Uint8Array, i: number) {
        const tokenizerState = this.stateHandler.getTokenizerState();

        if (tokenizerState === TOKENIZER_STATES.TRUE1 && n === CHARS.R) {
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.TRUE2)
            return
        }

        if (tokenizerState === TOKENIZER_STATES.TRUE2 && n === CHARS.U) {
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.TRUE3)
            return
        }

        if (tokenizerState === TOKENIZER_STATES.TRUE3 && n === CHARS.E) {
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.START)
            this.tokenHandler.handleToken(TOKENS.TRUE, true)
            this.stateHandler.addOffset(3)
            return
        }

        return this.errorHandler.charError(buffer, i);
    }

    /**
     * Processes `null` value.
     */
    private processNullState(n: number, buffer: Uint8Array, i: number) {
        const tokenizerState = this.stateHandler.getTokenizerState();

        if (tokenizerState === TOKENIZER_STATES.NULL1 && n === CHARS.U) {
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.NULL2)
            return
        }

        if (tokenizerState === TOKENIZER_STATES.NULL2 && n === CHARS.L) {
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.NULL3)
            return
        }

        if (tokenizerState === TOKENIZER_STATES.NULL3 && n === CHARS.L) {
            this.stateHandler.setTokenizerState(TOKENIZER_STATES.START)
            this.tokenHandler.handleToken(TOKENS.NULL, null)
            this.stateHandler.addOffset(3)
            return
        }

        return this.errorHandler.charError(buffer, i);
    }
}
