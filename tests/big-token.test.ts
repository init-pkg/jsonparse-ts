import { Parser } from "@/index";
import { expect, describe, it } from "vitest";

describe("Big Tokens test", () => {
    it('can handle large tokens without running out of memory', () => {
        const parser = new Parser();
        const chunkSize = 1024;
        const chunks = 1024 * 20; // 200; // 200MB
        const quote = new Uint8Array([0x22]); // "

        parser.onToken((type: number, value: string) => {
            expect(value.length).toBe(chunkSize * chunks);
        });

        parser.write(quote);
        for (let i = 0; i < chunks; ++i) {
            const buf = new Uint8Array(chunkSize).fill(0x61); // 'a'
            parser.write(buf);
        }
        parser.write(quote);
    }, 60000);
})
