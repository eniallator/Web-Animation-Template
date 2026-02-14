import { describe, expect, it } from "vitest";

import { generator } from "./generate.ts";

describe("generator", () => {
  it("yields values until callback returns undefined", () => {
    const values = [1, 2, 3];
    let calls = 0;
    const gen = generator(() => {
      calls++;
      return values.shift();
    });

    expect([...gen]).toEqual([1, 2, 3]);
    // callback is called one extra time which returns undefined
    expect(calls).toBe(4);
  });

  it("yields nothing when first call returns undefined or null", () => {
    expect([...generator(() => undefined)]).toEqual([]);
    expect([...generator(() => null)]).toEqual([]);
  });

  it("yields falsy values like 0, empty string and false", () => {
    const arr = [0, "", false];
    const gen = generator(() => arr.shift());
    expect([...gen]).toEqual([0, "", false]);
  });
});
