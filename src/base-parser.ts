import { CONSTANTS, STRING_BUFFER_SIZE } from "./constants"; // Import constants
import { alloc } from "./utils"; // Import alloc function

export abstract class BaseParser {
  protected tState: number;
  protected value: any;

  protected string: string | undefined;
  protected stringBuffer: Uint8Array;
  protected stringBufferOffset: number;
  protected unicode: string | undefined;
  protected highSurrogate: number | undefined;

  protected key: string | undefined | number;
  protected mode: number | undefined;
  protected stack: Array<{ value: any; key?: string | number; mode?: number }>;
  protected state: number;

  protected bytes_remaining: number; // Bytes left for multi-byte UTF-8 char
  protected bytes_in_sequence: number; // Total bytes in multi-byte char
  protected temp_buffs: Record<string, Uint8Array>; // Buffers for multi-byte chars

  protected offset: number; // Stream offset

  constructor() {
    this.tState = CONSTANTS.START;
    this.value = undefined;

    this.string = undefined;
    this.stringBuffer = alloc(STRING_BUFFER_SIZE);
    this.stringBufferOffset = 0;
    this.unicode = undefined;
    this.highSurrogate = undefined;

    this.key = undefined;
    this.mode = undefined;
    this.stack = [];
    this.state = CONSTANTS.VALUE;

    this.bytes_remaining = 0;
    this.bytes_in_sequence = 0;
    this.temp_buffs = {
      "2": alloc(2),
      "3": alloc(3),
      "4": alloc(4),
    };

    this.offset = -1;
  }

  private valueHandlers: ((value: any) => void)[] = [];

  /**
   * Subscribes a value event callback.
   */
  public onValue(callback: (value: any) => void): void {
    this.valueHandlers.push(callback);
  }

  /**
   * Emits a parsed value event.
   */
  protected emit(value: any): void {
    if (this.mode) {
      this.state = CONSTANTS.COMMA;
    }

    this.valueHandlers.forEach((callback) => callback(value));
  }

  private tokenHandlers: ((token: number, value: any) => void)[] = [];

  /**
   * Subscribes a callback to token events.
   * @param callback - Function to handle tokens.
   */
  public onToken(callback: (token: number, value: any) => void): void {
    this.tokenHandlers.push(callback);
  }

  /**
   * Emits a token event to all subscribers.
   * @param token - The token type.
   * @param value - The associated value.
   */
  protected emitToken(token: number, value: any): void {
    if (this.tokenHandlers.length > 0) {
      this.tokenHandlers.forEach((callback) => callback(token, value));
    }
  }

  private errorHandlers: ((err: Error) => void)[] = [];

  /**
   * Subscribes an error handler callback.
   * @param callback - A function to handle errors.
   */
  public onError(callback: (err: Error) => void): void {
    this.errorHandlers.push(callback);
  }

  /**
   * Handles errors by either notifying subscribers or throwing the error.
   * @param err - The error to handle.
   */
  protected handleError(err: Error): void {
    if (this.errorHandlers.length > 0) {
      this.errorHandlers.forEach((callback) => callback(err));
    } else {
      throw err; // Default behavior if no handlers are set
    }
  }

  /**
   * Handles character-related errors.
   */
  protected charError(buffer: Uint8Array, i: number) {
    this.tState = CONSTANTS.STOP;
    this.handleError(
      new Error(
        `Unexpected ${JSON.stringify(
          String.fromCharCode(buffer[i])
        )} at position ${i} in state ${BaseParser.toknam(this.tState)}`
      )
    );
  }

  /**
   * Appends a portion of a buffer to the internal string buffer.
   * @param buf - The source Uint8Array buffer.
   * @param start - The starting index (optional, defaults to 0).
   * @param end - The ending index (optional, defaults to `buf.length`).
   */
  protected appendStringBuf(
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
   * Appends a character to the string buffer.
   */
  protected appendStringChar(char: number): void {
    if (this.stringBufferOffset >= STRING_BUFFER_SIZE) {
      if (this.string === undefined) this.string = "";
      this.string += new TextDecoder().decode(
        this.stringBuffer.subarray(0, this.stringBufferOffset)
      );
      this.stringBufferOffset = 0;
    }
    this.stringBuffer[this.stringBufferOffset++] = char;
  }

  /**
   * Converts a token code to its string representation.
   * @param code The token code (numeric).
   * @returns The string representation of the token or hex value.
   */
  protected static toknam(code: number): string {
    for (const key of Object.keys(CONSTANTS)) {
      if ((CONSTANTS as any)[key] === code) {
        return key;
      }
    }
    return code ? `0x${code.toString(16)}` : "";
  }

  /**
   * Handles unexpected token errors.
   */
  protected parseError(token: number, value?: any): void {
    this.tState = CONSTANTS.STOP;
    const error = new Error(
      `Unexpected ${BaseParser.toknam(token)}${
        value ? ` (${JSON.stringify(value)})` : ""
      } in state ${BaseParser.toknam(this.state)}`
    );
    this.handleError(error);
  }

  /**
   * Pushes the current parsing context onto the stack.
   */
  protected push(): void {
    this.stack.push({ value: this.value, key: this.key, mode: this.mode });
  }

  /**
   * Pops the last parsing context from the stack and emits a value.
   */
  protected pop(): void {
    const value = this.value;
    const parent = this.stack.pop();

    if (parent) {
      this.value = parent.value;
      this.key = parent.key;
      this.mode = parent.mode;
    } else {
      this.value = undefined;
      this.key = undefined;
      this.mode = undefined;
    }

    this.emit(value);

    if (!this.mode) {
      this.state = CONSTANTS.VALUE;
    }
  }

  /**
   * Parses and processes numeric values.
   * Can be overridden for custom number handling.
   * @param text - The numeric text to parse.
   */
  protected numberReviver(text: string): void {
    const result = Number(text);

    if (isNaN(result)) {
      this.handleError(new Error(`Invalid number: ${text}`));
      return;
    }

    // Check if text is a long numeric string (likely an ID) rather than a safe number
    if (/^[0-9]+$/.test(text) && result.toString() !== text) {
      this.emitToken(CONSTANTS.STRING, text); // Emit as a string instead of a number
    } else {
      this.emitToken(CONSTANTS.NUMBER, result); // Emit as a valid number
    }
  }
}
