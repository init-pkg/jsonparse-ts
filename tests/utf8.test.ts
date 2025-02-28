import { describe, it, expect } from "vitest";
import { Parser } from "../src/parser";

describe("UTF-8 Handling in Parser", () => {
  it("should correctly parse 3-byte UTF-8 characters", () => {
    const parser = new Parser();
    let result: string | undefined;

    parser.onValue((value) => {
      result = value;
    });

    parser.write('"├──"');

    expect(result).toBe("├──");
  });

  it("should correctly parse UTF-8 snowman character", () => {
    const parser = new Parser();
    let result: string | undefined;

    parser.onValue((value) => {
      result = value;
    });

    parser.write('"☃"');

    expect(result).toBe("☃");
  });

   it("should correctly parse UTF-8 mixed with ASCII", () => {
     const parser = new Parser();
     const expected = ["snow: ☃!", "xyz", "¡que!"];
     let receivedValues: any[] = [];

     parser.onValue((value) => {
      console.log(value);

       receivedValues.push(value);
     });

     parser.write('{"value": ["snow: ☃!","xyz","¡qu');

     expect(receivedValues).toEqual(expected);
   });
});
