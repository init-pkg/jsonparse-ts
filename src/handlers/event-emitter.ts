export class EventEmitter {
    private valueHandlers: ((value: any) => void)[] = [];
    private tokenHandlers: ((token: number, value: any) => void)[] = [];
    private errorHandlers: ((err: Error) => void)[] = [];

    /**
     * Subscribes a value event callback.
     */
    public onValue(callback: (value: any) => void): void {
        this.valueHandlers.push(callback);
    }

    /**
     * Emits a parsed value event.
     */
    public emitValue(value: any): boolean {
        this.valueHandlers.forEach((callback) => callback(value));

        return this.valueHandlers.length > 0;
    }

    /**
     * Unsubscribes a value event callback.
     */
    public offValue(callback: (value: any) => void): void {
        this.valueHandlers = this.valueHandlers.filter(cb => cb !== callback);
    }

    /**
     * Returns true if length of value subscribers more than zero
     */
    public hasValueHandler() {
        return this.valueHandlers.length > 0;
    }

    /**
     * Subscribes a callback to token events.
     * @param callback - Function to handle tokens.
     */
    public onToken(callback: (token: number, value: any) => void): void {
        this.tokenHandlers.push(callback);
    }

    /**
     * Subscribes a callback to token events.
     * @param callback - Function to handle tokens.
     */
    public offToken(callback: (token: number, value: any) => void): void {
        this.tokenHandlers = this.tokenHandlers.filter(cb => cb !== callback);
    }

    /**
     * Emits a token event to all subscribers.
     * @param token - The token type.
     * @param value - The associated value.
     */
    public emitToken(token: number, value: any): boolean {
        if (this.tokenHandlers.length > 0) {
            this.tokenHandlers.forEach((callback) => callback(token, value));
        }

        return this.tokenHandlers.length > 0;
    }

    /**
     * Subscribes an error handler callback.
     * @param callback - A function to handle errors.
     */
    public onError(callback: (err: Error) => void): void {
        this.errorHandlers.push(callback);
    }

    /**
     * Subscribes an error handler callback.
     * @param callback - A function to handle errors.
     */
    public offError(callback: (err: Error) => void): void {
        this.errorHandlers = this.errorHandlers.filter(cb => cb !== callback);
    }

    /**
     * Handles errors by either notifying subscribers or throwing the error.
     * @param err - The error to handle.
     */
    public handleError(err: Error): void {
        if (this.errorHandlers.length > 0) {
            this.errorHandlers.forEach((callback) => callback(err));
        } else {
            throw err; // Default behavior if no handlers are set
        }
    }
}
