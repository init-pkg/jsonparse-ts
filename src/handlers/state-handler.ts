import { PARSER_STATES, TOKENIZER_STATES } from "@/constants/constants";
import { EventEmitter } from "@/handlers/event-emitter";
import { omitEmptyArrayOrObject, tokenName } from "@/utils/utils";
import { StringHandler } from "./string-handler";

export class StateHandler {
    protected eventEmitter: EventEmitter;
    protected stringHandler: StringHandler;

    /** Tokenizer State - Tracks the current state of the tokenizer */
    protected tState: number = TOKENIZER_STATES.START;

    /** Current Parsed Value */
    protected value: any = undefined;
    protected lastValue: any = undefined;

    /** Parser Mode (OBJECT, ARRAY) */
    protected mode: number | undefined = undefined;

    /** Stack to maintain parsing context */
    protected stack: Array<{ value: any; key?: string | number; mode?: number }>;

    /** Current Parsing State (VALUE, KEY) */
    protected state: number = PARSER_STATES.VALUE;

    /** Current byte offset in the stream */
    protected offset: number = -1;

    /** Current key being processed (for objects) */
    protected key: string | undefined | number = undefined;

    constructor(eventEmitter: EventEmitter, stringHandler: StringHandler) {
        this.eventEmitter = eventEmitter;
        this.stringHandler = stringHandler;
        this.stack = [];
    }

    public getTokenizerState() {
        return this.tState
    }

    public incTokenizerState() {
        this.tState++;
        return this;
    }

    public setOffset(n: number) {
        this.offset = n
        return this;
    }

    public getOffset() {
        return this.offset;
    }

    public addOffset(n: number) {
        this.offset += n;
        return this;
    }

    public setTokenizerState(n: number) {
        this.tState = n;
        return this
    }

    public getParsingState() {
        return this.state;
    }

    public getStack() {
        return this.stack
    }

    /**
     * Pushes the current parsing context onto the stack.
     */
    public push(): void {
        this.stack.push({ value: this.value, key: this.key, mode: this.mode });
    }

    /**
     * Pops the last parsing context from the stack and emits a value.
     */
    public pop(): void {
        const value = this.value;
        const parent = this.stack.pop();

        this.value = parent?.value;
        this.key = parent?.key;
        this.mode = parent?.mode;

        if (typeof parent?.value !== undefined) {
            this.lastValue = value;
        }

        if (this.mode) {
            this.state = PARSER_STATES.COMMA;
        }

        this.eventEmitter.emitValue(value);

        if (!this.mode) {
            this.state = PARSER_STATES.VALUE;
        }
    }

    public incOffset() {
        this.offset++
        return this;
    }

    public getValue() {
        return this.value;
    }

    public getLastIncompleteValue(omitEmpty = false) {
        if (typeof this.lastValue === "undefined" || this.stack.length > 0) {
            let currentValue: any = undefined;
            let settedCurrentValue = false;

            if (this.mode) {
                switch (this.tState) {
                    case TOKENIZER_STATES.NULL1:
                    case TOKENIZER_STATES.NULL2:
                    case TOKENIZER_STATES.NULL3:
                        currentValue = null;
                        break;
                    case TOKENIZER_STATES.TRUE1:
                    case TOKENIZER_STATES.TRUE2:
                    case TOKENIZER_STATES.TRUE3:
                        currentValue = true;
                        break;
                    case TOKENIZER_STATES.FALSE1:
                    case TOKENIZER_STATES.FALSE2:
                    case TOKENIZER_STATES.FALSE3:
                    case TOKENIZER_STATES.FALSE4:
                        currentValue = false;
                        break;
                    case TOKENIZER_STATES.STRING1:
                    case TOKENIZER_STATES.STRING2:
                    case TOKENIZER_STATES.STRING3:
                    case TOKENIZER_STATES.STRING4:
                    case TOKENIZER_STATES.STRING5:
                    case TOKENIZER_STATES.STRING6:
                        currentValue = this.stringHandler.flushBuffer().getString();
                        break;
                }
                if (typeof currentValue !== "undefined" && typeof this.key !== "undefined" && typeof this.value[this.key as string] === "undefined") {
                    this.value[this.key as string] = currentValue
                    settedCurrentValue = true;
                }
            }

            const newStack = [...this.stack, { value: this.value, key: this.key, mode: this.mode }]
            let parent: any = null;

            for (let i = newStack.length - 1; i >= 0; i--) {
                const currentStack = newStack[i];

                if (typeof currentStack?.value !== "undefined") {
                    parent = currentStack?.value
                }
            }

            if (parent) {
                parent = JSON.parse(JSON.stringify(parent))
            }

            if (typeof currentValue !== "undefined" && typeof this.key !== "undefined" && settedCurrentValue) delete this.value[this.key as string];

            if (parent) return omitEmpty ? omitEmptyArrayOrObject(parent) : parent;
        }

        return this.lastValue ?? null;
    }

    public getLastValue() {
        if (typeof this.lastValue === "undefined" || this.stack.length > 0) {
            const newStack = [...this.stack, { value: this.value, key: this.key, mode: this.mode }]

            let parent: any = null;

            for (let i = newStack.length - 1; i >= 0; i--) {
                const currentStack = newStack[i];

                if (typeof currentStack?.value !== "undefined") {
                    parent = currentStack?.value
                }
            }

            if (parent) {
                return JSON.parse(JSON.stringify(parent))
            }
        }

        return this.lastValue ?? null;
    }

    public getKey() {
        return this.key;
    }

    public getTokenizerStateName() {
        return tokenName(this.getTokenizerState())
    }

    public getMode() {
        return this.mode;
    }


    public setValue(value: any) {
        this.value = value;
        return this;
    }

    public setKey(value: any) {
        this.key = value;
        return this;
    }

    public setKeyValue(value: any) {
        if (this.value && (this.key || this.key === 0)) {
            this.value[this.key] = value;
        }
    }

    public setState(n: number) {
        this.state = n;
        return this;
    }

    public setMode(n: number) {
        this.mode = n;
        return this;
    }
}
