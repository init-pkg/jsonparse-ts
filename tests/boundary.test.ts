import { describe, it, expect } from 'vitest';
import { Parser } from '../src';

const utf8TestCases = [
    { name: "2 byte utf8 'De' character", input: [0xd0, 0xb4], expected: 'д' },
    { name: "3 byte utf8 'Han' character", input: [0xe6, 0x88, 0x91], expected: '我' },
    { name: "4 byte utf8 character (U+2070E)", input: [0xf0, 0xa0, 0x9c, 0x8e], expected: '𠜎' },
    {
        name: "3 byte utf8 'Han' character chunked",
        chunks: [[0xe6, 0x88], [0x91]],
        expected: '我'
    },
    {
        name: "4 byte utf8 character (U+2070E) chunked",
        chunks: [[0xf0, 0xa0], [0x9c, 0x8e]],
        expected: '𠜎'
    },
    {
        name: "1-4 byte utf8 character string chunked randomly",
        input: [
            0x41, // A
            0xd0, 0xb6, // ж
            0xe6, 0x96, 0x87, // 文
            0xf0, 0xa0, 0x9c, 0xb1, // 𠜱
            0x42 // B
        ],
        expected: 'Aж文𠜱B',
        randomChunking: true
    }
];

describe('UTF-8 Parsing Tests', () => {
    utf8TestCases.forEach(({ name, input, chunks, expected, randomChunking }) => {
        it(name, () => {
            const parser = new Parser();

            return new Promise<void>((resolve) => {
                parser.onValue((value: string) => {
                    expect(value).toBe(expected);
                    resolve();
                })

                if (randomChunking && input) {
                    const uint8Array = new Uint8Array(input);
                    const splitIndex = Math.floor(Math.random() * uint8Array.length);
                    parser.write('"');
                    parser.write(uint8Array.slice(0, splitIndex));
                    parser.write(uint8Array.slice(splitIndex));
                    parser.write('"');
                } else if (chunks) {
                    parser.write('"');
                    chunks.forEach(chunk => parser.write(new Uint8Array(chunk)));
                    parser.write('"');
                } else if (input) {
                    parser.write('"');
                    parser.write(new Uint8Array(input));
                    parser.write('"');
                }
            });
        });
    });
});
