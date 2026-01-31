import { describe, expect, it } from "vitest";

import { mapFilter, mapFind } from "./map";
import { Option } from "./option";

describe("mapFilter", () => {
  it("maps and filters out null/undefined", () => {
    const arr = [1, 2, 3, 4];
    const result = mapFilter(arr, n => (n % 2 === 0 ? n * 2 : null));
    expect(result).toEqual([4, 8]);
  });

  it("accepts Option.some and Option.none", () => {
    const arr = [1, 2, 3];
    const result = mapFilter(arr, n =>
      n > 1 ? Option.some(n * 10) : Option.none()
    );
    expect(result).toEqual([20, 30]);
  });

  it("returns empty array if all results are nullish", () => {
    const arr = [1, 2, 3];
    const result = mapFilter(arr, () => null);
    expect(result).toEqual([]);
  });

  it("returns empty array for empty input array", () => {
    expect(mapFilter([], n => n)).toEqual([]);
  });
});

describe("mapFind", () => {
  it("returns first mapped value that is not null/undefined", () => {
    const arr = [1, 2, 3, 4];
    const result = mapFind(arr, n => (n > 2 ? n * 2 : null));
    expect(result).toBe(6);
  });

  it("returns first Option.some value", () => {
    const arr = [1, 2, 3];
    const result = mapFind(arr, n =>
      n === 2 ? Option.some(42) : Option.none()
    );
    expect(result).toBe(42);
  });

  it("returns null if no value is found", () => {
    const arr = [1, 2, 3];
    const result = mapFind(arr, () => null);
    expect(result).toBeNull();
  });

  it("returns null for empty input array", () => {
    expect(mapFind([], n => n)).toBeNull();
  });
});
