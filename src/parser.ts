import { BaseParser } from "./base-parser";
import { CONSTANTS } from "./constants";

export class Parser extends BaseParser {
  public static CONSTANTS = CONSTANTS;

  constructor() {
    super();
    this.onToken(this.handleToken.bind(this)); // Register token handler
  }

  /**
   * Handles incoming tokens and builds the JSON structure.
   */
  private handleToken(token: number, value: any): void {
    switch (this.state) {
      case CONSTANTS.VALUE:
        this.handleValueToken(token, value);
        break;
      case CONSTANTS.KEY:
        this.handleKeyToken(token, value);
        break;
      case CONSTANTS.COLON:
        this.handleColonToken(token);
        break;
      case CONSTANTS.COMMA:
        this.handleCommaToken(token);
        break;
      default:
        this.parseError(token, value);
    }
  }

  /**
   * Handles tokens when in VALUE state.
   */
  private handleValueToken(token: number, value: any): void {
    if (this.isPrimitive(token)) {
      if (this.value) this.value[this.key as string] = value;
      this.emit(value);
    } else if (token === CONSTANTS.LEFT_BRACE) {
      this.startObject();
    } else if (token === CONSTANTS.LEFT_BRACKET) {
      this.startArray();
    } else if (
      (token === CONSTANTS.RIGHT_BRACE && this.mode === CONSTANTS.OBJECT) ||
      (token === CONSTANTS.RIGHT_BRACKET && this.mode === CONSTANTS.ARRAY)
    ) {
      this.pop();
    } else {
      this.parseError(token, value);
    }
  }

  /**
   * Handles tokens when in KEY state.
   */
  private handleKeyToken(token: number, value: any): void {
    if (token === CONSTANTS.STRING) {
      this.key = value;
      this.state = CONSTANTS.COLON;
    } else if (token === CONSTANTS.RIGHT_BRACE) {
      this.pop();
    } else {
      this.parseError(token, value);
    }
  }

  /**
   * Handles tokens when in COLON state.
   */
  private handleColonToken(token: number): void {
    if (token === CONSTANTS.COLON) {
      this.state = CONSTANTS.VALUE;
    } else {
      this.parseError(token);
    }
  }

  /**
   * Handles tokens when in COMMA state.
   */
  private handleCommaToken(token: number): void {
    if (token === CONSTANTS.COMMA) {
      this.state =
        this.mode === CONSTANTS.ARRAY ? CONSTANTS.VALUE : CONSTANTS.KEY;
      if (this.mode === CONSTANTS.ARRAY) this.key = (this.key as number) + 1;
    } else if (
      (token === CONSTANTS.RIGHT_BRACKET && this.mode === CONSTANTS.ARRAY) ||
      (token === CONSTANTS.RIGHT_BRACE && this.mode === CONSTANTS.OBJECT)
    ) {
      this.pop();
    } else {
      this.parseError(token);
    }
  }

  /**
   * Starts a new object `{}`.
   */
  private startObject(): void {
    this.push();
    this.value = this.value ? (this.value[this.key as string] = {}) : {};
    this.key = undefined;
    this.state = CONSTANTS.KEY;
    this.mode = CONSTANTS.OBJECT;
  }

  /**
   * Starts a new array `[]`.
   */
  private startArray(): void {
    this.push();
    this.value = this.value ? (this.value[this.key as string] = []) : [];
    this.key = 0;
    this.mode = CONSTANTS.ARRAY;
    this.state = CONSTANTS.VALUE;
  }

  /**
   * Checks if the token is a primitive value (`string`, `number`, `true`, `false`, `null`).
   */
  private isPrimitive(token: number): boolean {
    return (
      token === CONSTANTS.STRING ||
      token === CONSTANTS.NUMBER ||
      token === CONSTANTS.TRUE ||
      token === CONSTANTS.FALSE ||
      token === CONSTANTS.NULL
    );
  }

  /**
   * Processes an incoming buffer of JSON data.
   * @param buffer - The input JSON chunk.
   */
  public write(buffer: Uint8Array | string): void {
    if (typeof buffer === "string") {
      buffer = new TextEncoder().encode(buffer); // Convert to Uint8Array
    }

    let n: number;
    for (let i = 0; i < buffer.length; i++) {
      n = buffer[i];
      this.offset++;

      switch (this.tState) {
        case CONSTANTS.START:
          this.processStartState(n, buffer, i);
          break;
        case CONSTANTS.STRING1:
          i = this.processStringState(buffer, i);
          break;
        case CONSTANTS.NUMBER1:
        case CONSTANTS.NUMBER3:
          i = this.processNumberState(buffer, i);
          break;
        case CONSTANTS.TRUE1:
        case CONSTANTS.TRUE2:
        case CONSTANTS.TRUE3:
          this.processBooleanState(n, "true", CONSTANTS.TRUE, buffer, i);
          break;
        case CONSTANTS.FALSE1:
        case CONSTANTS.FALSE2:
        case CONSTANTS.FALSE3:
        case CONSTANTS.FALSE4:
          this.processBooleanState(n, "false", CONSTANTS.FALSE, buffer, i);
          break;
        case CONSTANTS.NULL1:
        case CONSTANTS.NULL2:
        case CONSTANTS.NULL3:
          this.processNullState(n, buffer, i);
          break;
        default:
          this.charError(buffer, i);
      }
    }
  }

  /**
   * Processes tokens at the root level (e.g. `{`, `[`, `:`, `,`).
   */
  private processStartState(n: number, buffer: Uint8Array, i: number): void {
    if (n === 0x7b) this.emitToken(CONSTANTS.LEFT_BRACE, "{");
    else if (n === 0x7d) this.emitToken(CONSTANTS.RIGHT_BRACE, "}");
    else if (n === 0x5b) this.emitToken(CONSTANTS.LEFT_BRACKET, "[");
    else if (n === 0x5d) this.emitToken(CONSTANTS.RIGHT_BRACKET, "]");
    else if (n === 0x3a) this.emitToken(CONSTANTS.COLON, ":");
    else if (n === 0x2c) this.emitToken(CONSTANTS.COMMA, ",");
    else if (n === 0x74) this.tState = CONSTANTS.TRUE1;
    else if (n === 0x66) this.tState = CONSTANTS.FALSE1;
    else if (n === 0x6e) this.tState = CONSTANTS.NULL1;
    else if (n === 0x22) {
      this.string = "";
      this.stringBufferOffset = 0;
      this.tState = CONSTANTS.STRING1;
    } else if (n === 0x2d || (n >= 0x30 && n <= 0x39)) {
      this.string = String.fromCharCode(n);
      this.tState = CONSTANTS.NUMBER1;
    } else if (![0x20, 0x09, 0x0a, 0x0d].includes(n)) {
      this.charError(buffer, i);
    }
  }

  /**
   * Parses string values, including escape sequences.
   */
  private processStringState(buffer: Uint8Array, i: number): number {
    let n = buffer[i];

    if (n === 0x22) {
      this.tState = CONSTANTS.START;
      this.string += new TextDecoder().decode(
        this.stringBuffer.subarray(0, this.stringBufferOffset)
      );
      this.stringBufferOffset = 0;
      this.emitToken(CONSTANTS.STRING, this.string);
      this.string = undefined;
    } else if (n === 0x5c) {
      this.tState = CONSTANTS.STRING2;
    } else if (n >= 0x20) {
      this.appendStringChar(n);
    } else {
      this.charError(buffer, i);
    }

    return i;
  }

  /**
   * Parses numeric values.
   */
  private processNumberState(buffer: Uint8Array, i: number): number {
    let n = buffer[i];

    if (
      (n >= 0x30 && n <= 0x39) ||
      n === 0x2e ||
      n === 0x65 ||
      n === 0x45 ||
      n === 0x2b ||
      n === 0x2d
    ) {
      this.string += String.fromCharCode(n);
    } else {
      this.tState = CONSTANTS.START;
      if (isNaN(Number(this.string))) {
        this.charError(buffer, i);
      } else {
        this.numberReviver(this.string || "");
      }
      this.string = undefined;
      i--;
    }

    return i;
  }

  /**
   * Processes boolean values (`true`, `false`).
   */
  private processBooleanState(
    n: number,
    expected: string,
    tokenType: number,
    buffer: Uint8Array,
    i: number
  ): void {
    let stateIndex =
      this.tState -
      (tokenType === CONSTANTS.TRUE ? CONSTANTS.TRUE1 : CONSTANTS.FALSE1);
    if (String.fromCharCode(n) === expected[stateIndex + 1]) {
      this.tState++;
    } else if (stateIndex === expected.length - 2) {
      this.tState = CONSTANTS.START;
      this.emitToken(tokenType, tokenType === CONSTANTS.TRUE);
    } else {
      this.charError(buffer, i);
    }
  }

  /**
   * Processes `null` value.
   */
  private processNullState(n: number, buffer: Uint8Array, i: number): void {
    let stateIndex = this.tState - CONSTANTS.NULL1;
    if (String.fromCharCode(n) === "null"[stateIndex + 1]) {
      this.tState++;
    } else if (stateIndex === 2) {
      this.tState = CONSTANTS.START;
      this.emitToken(CONSTANTS.NULL, null);
    } else {
      this.charError(buffer, i);
    }
  }
}
