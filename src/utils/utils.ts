import { PARSER_MODES, PARSER_STATES, TOKENIZER_STATES, TOKENS } from "@/constants/constants";

export function alloc(size: number): Uint8Array {
    if (typeof Buffer !== "undefined" && Buffer.alloc) {
        return Buffer.alloc(size); // Node.js
    }

    return new Uint8Array(size); // Browser-safe alternative
}

/**
 * Checks if the token is a primitive value (`string`, `number`, `true`, `false`, `null`).
 */
export function isPrimitive(token: number): boolean {
    return (
        token === TOKENS.STRING ||
        token === TOKENS.NUMBER ||
        token === TOKENS.TRUE ||
        token === TOKENS.FALSE ||
        token === TOKENS.NULL
    );
}

/**
* Converts a token code to its string representation.
* @param code The token code (numeric).
* @returns The string representation of the token or hex value.
*/
export function tokenName(code: number): string {
    const _constants = {
        ...TOKENS,
        ...TOKENIZER_STATES,
        ...PARSER_STATES,
        ...PARSER_MODES,
    };

    for (const key of Object.keys(_constants)) {
        if ((_constants as any)[key] === code) {
            return key;
        }
    }

    return code ? `0x${code.toString(16)}` : "";
}

export function omitEmptyArrayOrObject<T>(value: T): T {
    if (Array.isArray(value)) {
        return value
            .map(omitEmptyArrayOrObject)
            .filter(item => !(Array.isArray(item) && item.length === 0) &&
                            !(typeof item === "object" && item !== null && Object.keys(item).length === 0)) as T;
    } else if (typeof value === "object" && value !== null) {
        return Object.fromEntries(
            Object.entries(value)
                .map(([key, val]) => [key, omitEmptyArrayOrObject(val)])
                .filter(([, val]) => !(Array.isArray(val) && val.length === 0) &&
                                     !(typeof val === "object" && val !== null && Object.keys(val).length === 0))
        ) as T;
    }

    return value;
}
