import { TOKENS } from "@/constants/constants";
import { ErrorHandler } from "@/handlers/error-handler";
import { EventEmitter } from "@/handlers/event-emitter";
import { StateHandler } from "@/handlers/state-handler";
import { StringHandler } from "@/handlers/string-handler";
import { TokenHandler } from "@/handlers/token-handler";
import { UTF8Handler } from "@/handlers/utf8-handler";

export abstract class BaseParser {
    /** Event Emitter */
    protected eventEmitter: EventEmitter;

    /** Handler for current state */
    protected stateHandler: StateHandler;

    /** Handler for strings, including multybytes */
    protected stringHandler: StringHandler;

    /** Handler for utf8 symbols */
    protected utf8Handler: UTF8Handler;

    protected errorHandler: ErrorHandler;

    protected tokenHandler: TokenHandler;

    protected encoder: TextEncoder;

    constructor() {
        this.eventEmitter = new EventEmitter();
        this.stringHandler = new StringHandler();
        this.stateHandler = new StateHandler(this.eventEmitter, this.stringHandler);
        this.errorHandler = new ErrorHandler(this.eventEmitter, this.stateHandler)
        this.utf8Handler = new UTF8Handler();
        this.tokenHandler = new TokenHandler(this.eventEmitter, this.stateHandler, this.errorHandler)
        this.encoder = new TextEncoder();
    }

    /**
     * Parses and processes numeric values.
     * Can be overridden for custom number handling.
     * @param text - The numeric text to parse.
     */
    protected numberReviver(text: string): Error | undefined {
        const result = Number(text);

        if (isNaN(result)) {
            const error = new Error(`Invalid number: ${text}`);
            this.eventEmitter.handleError(error);
            return error;
        }

        // Check if text is a long numeric string (likely an ID) rather than a safe number
        if (/^[0-9]+$/.test(text) && result.toString() !== text) {
            this.tokenHandler.handleToken(TOKENS.STRING, text) // Emit as a string instead of a number
        } else {
            this.tokenHandler.handleToken(TOKENS.NUMBER, result); // Emit as a valid number
        }
    }
}
