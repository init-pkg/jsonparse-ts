import { STRING_BUFFER_SIZE } from "@/constants/constants";
import { alloc } from "@/utils/utils";

export class StringHandler {
    /** Current string being parsed */
    protected string: string | undefined = undefined;

    /** Buffer to store string data */
    protected stringBuffer: Uint8Array;

    /** Offset within the string buffer */
    protected stringBufferOffset: number = 0;

    /** Unicode processing variables */
    protected unicode: string | undefined = undefined;
    protected highSurrogate: number | undefined = undefined;

    constructor() {
        this.stringBuffer = alloc(STRING_BUFFER_SIZE);
    }

    /**
     * Appends a character to the string buffer.
     */
    public appendStringChar(char: number): void {
        if (this.stringBufferOffset >= STRING_BUFFER_SIZE) {
            if (this.string === undefined) this.string = "";
            this.string += new TextDecoder().decode(
                this.stringBuffer.subarray(0, this.stringBufferOffset),
            );
            this.stringBufferOffset = 0;
        }

        this.stringBuffer[this.stringBufferOffset++] = char;
    }

    /**
     * Appends a portion of a buffer to the internal string buffer.
     * @param buf - The source Uint8Array buffer.
     * @param start - The starting index (optional, defaults to 0).
     * @param end - The ending index (optional, defaults to `buf.length`).
     */
    public appendStringBuf(
        buf: Uint8Array,
        start: number = 0,
        end?: number
    ): void {
        let size = buf.length;

        if (typeof start === "number") {
            if (typeof end === "number") {
                if (end < 0) {
                    // Handling negative `end` value
                    size = buf.length - start + end;
                } else {
                    size = end - start;
                }
            } else {
                size = buf.length - start;
            }
        }

        // Prevent negative size values
        if (size < 0) size = 0;

        // If adding this buffer would overflow the stringBuffer, flush it
        if (this.stringBufferOffset + size > STRING_BUFFER_SIZE) {
            if (this.string === undefined) this.string = "";
            this.string += new TextDecoder().decode(
                this.stringBuffer.subarray(0, this.stringBufferOffset)
            );
            this.stringBufferOffset = 0;
        }

        // Copy buffer content to `stringBuffer`
        this.stringBuffer.set(
            buf.subarray(start, start + size),
            this.stringBufferOffset
        );

        this.stringBufferOffset += size;
    }

    /**
     * Flushes the current buffer into the string.
     */
    public flushBuffer() {
        if (this.stringBufferOffset > 0) {
            if (this.string === undefined) {
                this.string = "";
            }

            this.string += new TextDecoder().decode(
                this.stringBuffer.subarray(0, this.stringBufferOffset)
            );

            this.stringBufferOffset = 0;
        }

        return this;
    }

    /**
  * Gets the final string value.
  * Ensures that if no string has been accumulated, it returns an empty string.
  * @returns {string} The current accumulated string.
  */
    public getString(): string {
        return this.string || "";
    }

    /**
     * Resets the string buffer and optionally sets a new initial string value.
     * This is useful when starting a new string parsing session.
     * @param {string} [stringValue] - Optional initial string value after reset.
     */
    public reset(stringValue?: string) {
        this.stringBufferOffset = 0;
        this.string = stringValue;
    }

    /**
     * Resets only the stored string without affecting the buffer offset.
     * This can be useful when clearing the current string but keeping buffer state.
     * @param {string} [stringValue] - Optional new string value.
     */
    public resetString(stringValue?: string) {
        this.string = stringValue;
    }

    /**
     * Sets the string value from a single character's char code.
     * Useful when initializing a string with a character (e.g., starting a number or string).
     * @param {number} n - The character code to set as the string.
     */
    public setFromCharcode(n: number) {
        this.string = String.fromCharCode(n);
    }

    /**
     * Appends a single character (from its char code) to the existing string.
     * Useful for dynamically building strings one character at a time.
     * @param {number} n - The character code to append to the string.
     */
    public addFromCharCode(n: number) {
        if (this.string === undefined) {
            this.string = "";
        }
        this.string += String.fromCharCode(n);
        return this;
    }

    public setUnicode(unicode?: string) {
        this.unicode = unicode
        return this;
    }

    public getUnicode() {
        return this.unicode || "";
    }

    public setHighSurrogate(n?: number) {
        this.highSurrogate = n
        return this;
    }

    public getHighSurrogate() {
        return this.highSurrogate
    }

    public addUnicodeFromCharCode(n: number) {
        if (this.unicode === undefined) {
            this.unicode = "";
        }

        this.unicode += String.fromCharCode(n);
        return this;
    }
}
