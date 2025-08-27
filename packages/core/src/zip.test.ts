import { describe, expect, it } from "vitest";

import { zip } from "./zip.ts";

describe("zip", () => {
  it("zips arrays of equal length", () => {
    const a = [1, 2];
    const b = ["x", "y"];
    const c = [true, false];
    expect(zip(a, b, c)).toEqual([
      [1, "x", true],
      [2, "y", false],
    ]);
  });

  it("zips empty arrays", () => {
    expect(zip([], [])).toEqual([]);
    expect(zip([], [], [])).toEqual([]);
  });

  it("throws if arrays are of different lengths", () => {
    expect(() => zip([1, 2], ["a"])).toThrow("Zip index out of bounds");
    expect(() => zip([1], ["a", "b"], [true])).toThrow(
      "Zip index out of bounds"
    );
  });
});
