import { describe, expect, it } from "vitest";

import { b64 } from "./b64.ts";

describe("b64.fromUint", () => {
  it("encodes 0 correctly", () => {
    expect(b64.fromUint(0)).toBe("");
  });

  it("encodes positive integers correctly", () => {
    expect(b64.fromUint(1)).toBe("B");
    expect(b64.fromUint(63)).toBe("/");
    expect(b64.fromUint(64)).toBe("BA");
    expect(b64.fromUint(12345)).toBe("DA5");
  });

  it("pads to length if specified", () => {
    expect(b64.fromUint(1, 4)).toBe("AAAB");
    expect(b64.fromUint(0, 3)).toBe("AAA");
    expect(b64.fromUint(63, 2)).toBe("A/");
  });

  it("returns empty string for negative numbers", () => {
    expect(() => b64.fromUint(-1)).toThrowError("Expected uint but got -1");
  });

  it("returns empty string for NaN", () => {
    expect(() => b64.fromUint(Number.NaN)).toThrowError(
      "Expected uint but got NaN"
    );
  });
});

describe("b64.toUint", () => {
  it("decodes base64 strings correctly", () => {
    expect(b64.toUint("")).toBe(0);
    expect(b64.toUint("B")).toBe(1);
    expect(b64.toUint("/")).toBe(63);
    expect(b64.toUint("BA")).toBe(64);
    expect(b64.toUint("DA5")).toBe(12345);
  });

  it("decodes padded strings correctly", () => {
    expect(b64.toUint("AAAB")).toBe(1);
    expect(b64.toUint("AAA")).toBe(0);
    expect(b64.toUint("A/")).toBe(63);
  });

  it("returns -1 for invalid characters", () => {
    expect(b64.toUint("!")).toBe(-1);
    expect(b64.toUint("A!")).toBe(-1);
  });

  it("returns 0 for empty string", () => {
    expect(b64.toUint("")).toBe(0);
  });
});
