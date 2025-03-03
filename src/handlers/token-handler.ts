import { CHARS, PARSER_MODES, PARSER_STATES, TOKENS } from "@/constants/constants";
import { ErrorHandler } from "@/handlers/error-handler";
import { EventEmitter } from "@/handlers/event-emitter";
import { StateHandler } from "@/handlers/state-handler";
import { isPrimitive } from "@/utils/utils";

export class TokenHandler {
    constructor(
        protected eventEmitter: EventEmitter,
        protected stateHandler: StateHandler,
        protected errorHandler: ErrorHandler,
    ) {
    }

    /**
     * Handles incoming tokens and builds the JSON structure.
     */
    public handleToken(token: number, value: any): void {
        switch (this.stateHandler.getParsingState()) {
            case PARSER_STATES.VALUE:
                this.handleValueToken(token, value);
                break;
            case PARSER_STATES.KEY:
                this.handleKeyToken(token, value);
                break;
            case PARSER_STATES.COLON:
                this.handleColonToken(token);
                break;
            case PARSER_STATES.COMMA:
                this.handleCommaToken(token);
                break;
            default:
                this.errorHandler.parseError(token, value);
        }

        this.eventEmitter.emitToken(token, value);
    }

    /**
       * Handles tokens when in VALUE state.
       */
    private handleValueToken(token: number, value: any): void {
        if (isPrimitive(token)) {
            this.stateHandler.setKeyValue(value);

            if (this.stateHandler.getMode()) {
                this.stateHandler.setState(PARSER_STATES.COMMA)
            }

            this.eventEmitter.emitValue(value);
        } else if (token === TOKENS.LEFT_BRACE) {
            this.startObject();
        } else if (token === TOKENS.LEFT_BRACKET) {
            this.startArray();
        } else if (
            (token === TOKENS.RIGHT_BRACE && this.stateHandler.getMode() === PARSER_MODES.OBJECT) ||
            (token === TOKENS.RIGHT_BRACKET && this.stateHandler.getMode() === PARSER_MODES.ARRAY)
        ) {
            this.stateHandler.pop();
        } else {
            this.errorHandler.parseError(token, value);
        }
    }

    /**
     * Handles tokens when in KEY state.
     */
    private handleKeyToken(token: number, value: any): void {
        if (token === TOKENS.STRING) {
            this.stateHandler.setKey(value);
            this.stateHandler.setState(PARSER_STATES.COLON)
        } else if (token === TOKENS.RIGHT_BRACE) {
            this.stateHandler.pop();
        } else {
            this.errorHandler.parseError(token, value);
        }
    }

    /**
     * Handles tokens when in COLON state.
     */
    private handleColonToken(token: number): void {
        if (token === TOKENS.COLON) {
            this.stateHandler.setState(PARSER_STATES.VALUE);
        } else {
            this.errorHandler.parseError(token);
        }
    }

    /**
     * Handles tokens when in COMMA state.
     */
    private handleCommaToken(token: number): void {
        if (token === TOKENS.COMMA) {
            const mode = this.stateHandler.getMode();

            if (mode === PARSER_MODES.ARRAY) {
                const key = this.stateHandler.getKey() as number || 0;
                this.stateHandler.setKey(key + 1);
                this.stateHandler.setState(PARSER_STATES.VALUE)
             } else if(mode === PARSER_MODES.OBJECT) {
                this.stateHandler.setState(PARSER_STATES.KEY)
             }
        } else if (
            (token === TOKENS.RIGHT_BRACKET && this.stateHandler.getMode() === PARSER_MODES.ARRAY) ||
            (token === TOKENS.RIGHT_BRACE && this.stateHandler.getMode() === PARSER_MODES.OBJECT)
        ) {
            this.stateHandler.pop();
        } else {
            this.errorHandler.parseError(token);
        }
    }

    /**
    * Starts a new object `{}`.
    */
    private startObject(): void {
        this.stateHandler.push();

        let value = this.stateHandler.getValue();
        if(value) {
            value = value[this.stateHandler.getKey() as string] = {}
        } else {
            value = {};
        }

        this.stateHandler
            .setValue(value)
            .setKey(undefined)
            .setState(PARSER_STATES.KEY)
            .setMode(PARSER_MODES.OBJECT)
    }

    /**
     * Starts a new array `[]`.
     */
    private startArray(): void {
        this.stateHandler.push();

        let value = this.stateHandler.getValue();
        if(value) {
            value = value[this.stateHandler.getKey() as string] = []
        } else {
            value = [];
        }

        this.stateHandler
            .setValue(value)
            .setKey(0)
            .setMode(PARSER_MODES.ARRAY)
            .setState(PARSER_STATES.VALUE)
    }
}
