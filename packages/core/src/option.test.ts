import { describe, expect, it, vi } from "vitest";

import { Option } from "./option";

import type { OptionType } from "./option";

describe("Option", () => {
  // --- Static constructors ---
  it("Option.some creates a Some", () => {
    const opt = Option.some(42);
    expect(opt.getOrNull()).toBe(42);
    expect(opt.getOrUndefined()).toBe(42);
    expect(opt.getOrElse(() => 99)).toBe(42);
    expect(opt.getOrThrow()).toBe(42);
    expect(opt.toArray()).toEqual([42]);
  });

  it("Option.none creates a None", () => {
    const opt = Option.none<number>();
    expect(opt.getOrNull()).toBeNull();
    expect(
      (opt as Option<number, OptionType>).getOrUndefined()
    ).toBeUndefined();
    expect(opt.getOrElse(() => 99)).toBe(99);
    expect(() => opt.getOrThrow()).toThrow();
    expect(opt.toArray()).toEqual([]);
  });

  it("Option.from returns Some for non-null/undefined, None otherwise", () => {
    expect(Option.from(5).getOrNull()).toBe(5);
    expect(Option.from(null).getOrNull()).toBeNull();
    expect(Option.from(undefined).getOrNull()).toBeNull();
  });

  it("Option.tupled returns Some if all are Some, None otherwise", () => {
    const a = Option.some(1);
    const b = Option.some("x");
    const c = Option.some(true);
    expect(Option.tupled([a, b, c]).getOrNull()).toEqual([1, "x", true]);
    expect(Option.tupled([a, Option.none(), c]).getOrNull()).toBeNull();
  });

  // --- map ---
  it("map transforms value if Some", () => {
    expect(
      Option.some(2)
        .map(x => x * 3)
        .getOrNull()
    ).toBe(6);
  });
  it("map returns None if None", () => {
    expect(
      Option.none<number>()
        .map(x => x * 2)
        .getOrNull()
    ).toBeNull();
  });

  // --- flatMap ---
  it("flatMap chains Option if Some", () => {
    expect(
      Option.some(2)
        .flatMap(x => Option.some(x + 1))
        .getOrNull()
    ).toBe(3);
  });
  it("flatMap returns None if None", () => {
    expect(
      Option.none<number>()
        .flatMap(x => Option.some(x + 1))
        .getOrNull()
    ).toBeNull();
  });

  // --- filter ---
  it("filter keeps value if predicate true", () => {
    expect(
      Option.some(5)
        .filter(x => x > 3)
        .getOrNull()
    ).toBe(5);
  });
  it("filter returns None if predicate false", () => {
    expect(
      Option.some(2)
        .filter(x => x > 3)
        .getOrNull()
    ).toBeNull();
  });
  it("filter on None stays None", () => {
    expect(
      Option.none<number>()
        .filter(() => true)
        .getOrNull()
    ).toBeNull();
  });

  // --- guard ---
  it("guard narrows type if predicate true", () => {
    const opt = Option.some<NonNullable<unknown>>("hello").guard(
      (x): x is string => typeof x === "string"
    );
    expect(opt.getOrNull()).toBe("hello");
  });
  it("guard returns None if predicate false", () => {
    const opt = Option.some<NonNullable<unknown>>(123).guard(
      (x): x is string => typeof x === "string"
    );
    expect(opt.getOrNull()).toBeNull();
  });

  // --- tap ---
  it("tap calls function if Some", () => {
    const cb = vi.fn();
    Option.some(7).tap(cb);
    expect(cb).toBeCalledWith(7);
  });
  it("tap does not call function if None", () => {
    const cb = vi.fn();
    Option.none<number>().tap(cb);
    expect(cb).not.toBeCalled();
  });

  // --- fold ---
  it("fold returns ifSome for Some", () => {
    expect(
      Option.some(10).fold<string | number>(
        () => "none",
        x => x * 2
      )
    ).toBe(20);
  });
  it("fold returns ifNone for None", () => {
    expect(
      Option.none<number>().fold<string | number>(
        () => "none",
        x => x
      )
    ).toBe("none");
  });

  // --- toMonad ---
  it("toMonad returns Monad with value or null", () => {
    expect(Option.some(5).toMonad().get()).toBe(5);
    expect(Option.none<number>().toMonad().get()).toBeNull();
  });

  // --- toArray ---
  it("toArray returns array with value if Some, empty if None", () => {
    expect(Option.some(1).toArray()).toEqual([1]);
    expect(Option.none<number>().toArray()).toEqual([]);
  });

  // --- Negative tests ---
  it("Option.some with null/undefined is not allowed (compile-time)", () => {
    // @ts-expect-error
    Option.some(null);
    // @ts-expect-error
    Option.some(undefined);
    expect(true).toBe(true); // just to keep test runner happy
  });

  it("Option.fromExact and Option.someExact behave like Option.some", () => {
    expect(Option.fromExact(123).getOrNull()).toBe(123);
    expect(Option.someExact("abc").getOrNull()).toBe("abc");
  });
});
