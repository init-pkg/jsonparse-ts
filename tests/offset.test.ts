import { describe, it, expect } from "vitest";
import { Parser } from "@/parsers/parser";
import { TOKENS } from "@/constants/constants";
import { tokenName } from "@/utils/utils";

describe("Offset Tracking", () => {
    const input1 = '{\n  "string": "value",\n  "number": 3,\n  "object"';
    const input2 = ': {\n  "key": "vд"\n  },\n  "array": [\n  -1,\n  12\n  ], \n  ';
    const input3 = '"null": null, "true": true, "false": false, "frac": 3.14 }';

    const offsets: [number, number][] = [
        [0, TOKENS.LEFT_BRACE],
        [4, TOKENS.STRING],
        [12, TOKENS.COLON],
        [14, TOKENS.STRING],
        [21, TOKENS.COMMA],
        [25, TOKENS.STRING],
        [33, TOKENS.COLON],
        [35, TOKENS.NUMBER],
        [36, TOKENS.COMMA],
        [40, TOKENS.STRING],
        [48, TOKENS.COLON],
        [50, TOKENS.LEFT_BRACE],
        [54, TOKENS.STRING],
        [59, TOKENS.COLON],
        [61, TOKENS.STRING],
        [69, TOKENS.RIGHT_BRACE],
        [70, TOKENS.COMMA],
        [74, TOKENS.STRING],
        [81, TOKENS.COLON],
        [83, TOKENS.LEFT_BRACKET],
        [87, TOKENS.NUMBER],
        [89, TOKENS.COMMA],
        [93, TOKENS.NUMBER],
        [98, TOKENS.RIGHT_BRACKET],
        [99, TOKENS.COMMA],
        [104, TOKENS.STRING],
        [110, TOKENS.COLON],
        [112, TOKENS.NULL],
        [116, TOKENS.COMMA],
        [118, TOKENS.STRING],
        [124, TOKENS.COLON],
        [126, TOKENS.TRUE],
        [130, TOKENS.COMMA],
        [132, TOKENS.STRING],
        [139, TOKENS.COLON],
        [141, TOKENS.FALSE],
        [146, TOKENS.COMMA],
        [148, TOKENS.STRING],
        [154, TOKENS.COLON],
        [156, TOKENS.NUMBER],
        [161, TOKENS.RIGHT_BRACE],
    ];

    it("should correctly track offsets and token types", async () => {
        const parser = new Parser();
        let index = 0;

        parser.onToken((token: number) => {
            expect(parser.getOffset()).toBe(offsets[index][0]);
            expect(token).toBe(offsets[index][1]);
            index++;
        })

        parser.write(input1);
        parser.write(input2);
        parser.write(input3);

        expect(index).toBe(offsets.length);
    });
});
