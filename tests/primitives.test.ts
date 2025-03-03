import { describe, it, expect } from "vitest";
import { Parser } from "../src/index";

describe("Primitives Parsing", () => {
    it("should correctly parse various primitive values", () => {
        const expected: [any[], any][] = [
            [[], ""],
            [[], "Hello"],
            [[], 'This"is'],
            [[], "\r\n\f\t\\/\""],
            [[], "Λάμβδα"],
            [[], "\\"],
            [[], "/"],
            [[], '"'],
            [[0], 0],
            [[1], 1],
            [[2], -1],
            [[], [0, 1, -1]],
            [[0], 1],
            [[1], 1.1],
            [[2], -1.1],
            [[3], -1],
            [[], [1, 1.1, -1.1, -1]],
            [[0], -1],
            [[], [-1]],
            [[0], -0.1],
            [[], [-0.1]],
            [[0], 6.02e23],
            [[], [6.02e23]],
            [[0], "7161093205057351174"],
            [[], ["7161093205057351174"]],
        ];

        const p = new Parser();
        let currentIndex = 0;

        p.onValue((value) => {
            const keys = p.getStack()
                .slice(1)
                .map((item) => item.key)
                .concat(p.getCurrentKey() !== undefined ? p.getCurrentKey() : []);

            expect([keys, value]).toEqual(expected[currentIndex]);
            currentIndex++;
        });

        p.write('"""Hello""This\\"is""\\r\\n\\f\\t\\\\\\/\\""');
        p.write('"\\u039b\\u03ac\\u03bc\\u03b2\\u03b4\\u03b1"');
        p.write('"\\\\"');
        p.write('"\\/"');
        p.write('"\\""');
        p.write("[0,1,-1]");
        p.write("[1.0,1.1,-1.1,-1.0][-1][-0.1]");
        p.write("[6.02e23]");
        p.write("[7161093205057351174]");

        expect(currentIndex).toBe(expected.length);
    });
});
