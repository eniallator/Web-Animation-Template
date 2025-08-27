import { describe, expect, it } from "vitest";

import {
  filterObject,
  mapObject,
  omit,
  pick,
  typedFromEntries,
  typedKeys,
  typedToEntries,
} from "./entries";

describe("typedKeys", () => {
  it("returns string keys by default", () => {
    expect(typedKeys({ a: 1, b: 2 }).sort()).toEqual(["a", "b"]);
  });

  it("includes symbol keys if requested", () => {
    const sym = Symbol("s");
    const obj = { a: 1, [sym]: 2 };
    const keys = typedKeys(obj, true);
    expect(keys).toHaveLength(2);
    expect(keys).toContain("a");
    expect(keys).toContain(sym);
  });

  it("returns empty array for empty object", () => {
    expect(typedKeys({})).toEqual([]);
  });
});

describe("typedToEntries", () => {
  it("returns entries for object", () => {
    expect(typedToEntries({ a: 1, b: 2 }).sort()).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });

  it("includes symbol entries if requested", () => {
    const sym = Symbol("s");
    const obj = { a: 1, [sym]: 2 };
    const entries = typedToEntries(obj, true);
    expect(entries).toHaveLength(2);
    expect(entries).toContainEqual(["a", 1]);
    expect(entries).toContainEqual([sym, 2]);
  });

  it("returns empty array for empty object", () => {
    expect(typedToEntries({})).toEqual([]);
  });
});

describe("typedFromEntries", () => {
  it("creates object from entries", () => {
    expect(
      typedFromEntries([
        ["a", 1],
        ["b", 2],
      ])
    ).toEqual({ a: 1, b: 2 });
  });

  it("handles symbol keys", () => {
    const sym = Symbol("s");
    const obj = typedFromEntries<Record<"a" | typeof sym, number>>([
      [sym, 42],
      ["a", 1],
    ]);
    expect(obj[sym]).toBe(42);
    expect(obj["a"]).toBe(1);
  });

  it("returns empty object for empty entries", () => {
    expect(typedFromEntries([])).toEqual({});
  });
});

describe("mapObject", () => {
  it("maps values and keys", () => {
    const result = mapObject({ a: 1, b: 2 }, ([k, v]) => [k, v * 2]);
    expect(result).toEqual({ a: 2, b: 4 });
  });

  it("can change keys", () => {
    const result = mapObject({ a: 1 }, () => ["b", 5]);
    expect(result).toEqual({ b: 5 });
  });

  it("returns empty object for empty input", () => {
    expect(mapObject({}, ([k, v]) => [k, v])).toEqual({});
  });
});

describe("filterObject", () => {
  it("filters entries by value", () => {
    const result = filterObject({ a: 1, b: 2 }, ([, v]) => v > 1);
    expect(result).toEqual({ b: 2 });
  });

  it("filters entries by key", () => {
    const result = filterObject({ a: 1, b: 2 }, ([k]) => k === "a");
    expect(result).toEqual({ a: 1 });
  });

  it("returns empty object if all filtered out", () => {
    expect(filterObject({ a: 1 }, () => false)).toEqual({});
  });
});

describe("pick", () => {
  it("picks specified keys", () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ["a", "c"])).toEqual({ a: 1, c: 3 });
  });

  it("returns empty object if no keys match", () => {
    expect(pick({ a: 1 }, ["b" as "a"])).toEqual({});
  });

  it("returns empty object for empty keys array", () => {
    expect(pick({ a: 1 }, [])).toEqual({});
  });
});

describe("omit", () => {
  it("omits specified keys", () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ["b"])).toEqual({ a: 1, c: 3 });
  });

  it("returns original object if no keys match", () => {
    expect(omit({ a: 1 }, ["b" as "a"])).toEqual({ a: 1 });
  });

  it("returns original object for empty keys array", () => {
    expect(omit({ a: 1 }, [])).toEqual({ a: 1 });
  });
});
