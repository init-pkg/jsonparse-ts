import { describe, it, expect } from "vitest";
import { Parser } from "../src/parser";

describe("Parser", () => {
  it("should parse a simple JSON object", () => {
    const parser = new Parser();
    let result: any;

    parser.onValue((value) => {
      result = value;
    });

    parser.write(`{"name": "John"}`);

    expect(result).toEqual({ name: "John" });
  });

  it("should handle incomplete JSON gracefully", () => {
    const parser = new Parser();
    let result: any;

    parser.onValue((value) => {
      result = value;
    });

    parser.write(`{"name": "John`);

    expect(result).toBeUndefined(); // JSON is incomplete
  });

  it("should correctly parse numbers", () => {
    const parser = new Parser();
    let result: any;

    parser.onValue((value) => {
      result = value;
    });

    parser.write(`{"age": 30}`);

    expect(result).toEqual({ age: 30 });
  });

  it("should handle arrays correctly", () => {
    const parser = new Parser();
    let result: any;

    parser.onValue((value) => {
      result = value;
    });

    parser.write(`[1, 2, 3]`);

    expect(result).toEqual([1, 2, 3]);
  });

  it("should throw an error for invalid JSON", () => {
    const parser = new Parser();

    expect(() => {
      parser.write(`{name: "John"}`); // Invalid JSON
    }).toThrow();
  });
});
