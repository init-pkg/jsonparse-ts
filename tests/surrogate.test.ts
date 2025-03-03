import { describe, test, expect } from 'vitest';
import { Parser } from '../src'; // Убедись, что путь правильный

describe('Surrogate pair parsing', () => {
    test('should parse full surrogate pair', () => {
        const p = new Parser();

        p.onValue((value) => {
            expect(value).toBe('😋');
        });

        p.write('"\\uD83D\\uDE0B"');
    });

    test('should parse chunked surrogate pair', () => {
        const p = new Parser();

        p.onValue((value) => {
            expect(value).toBe('😋');
        });

        p.write('"\\uD83D');
        p.write('\\uDE0B"');
    });
});
