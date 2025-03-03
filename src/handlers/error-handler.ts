import { TOKENIZER_STATES } from "@/constants/constants";
import { EventEmitter } from "@/handlers/event-emitter";
import { StateHandler } from "@/handlers/state-handler";
import { tokenName } from "@/utils/utils";

export class ErrorHandler {
    constructor(
        protected eventEmitter: EventEmitter,
        protected stateHandler: StateHandler
    ) {
    }

    /**
     * Handles unexpected token errors.
     */
    public parseError(token: number, value?: any): Error {
        this.stateHandler.setTokenizerState(TOKENIZER_STATES.STOP);

        const error = new Error(
            `Unexpected ${tokenName(token)}${value ? ` (${JSON.stringify(value)})` : ""
            } in state ${tokenName(this.stateHandler.getParsingState())}`
        );

        this.eventEmitter.handleError(error);

        return error
    }

    /**
     * Handles character-related errors.
     */
    public charError(buffer: Uint8Array, i: number): Error {
        this.stateHandler.setTokenizerState(TOKENIZER_STATES.STOP)
        const error = new Error(
            `Unexpected ${JSON.stringify(
                String.fromCharCode(buffer[i])
            )} at position ${i} in state ${tokenName(this.stateHandler.getTokenizerState())}`
        );

        this.eventEmitter.handleError(
            error
        );

        return error;
    }
}
