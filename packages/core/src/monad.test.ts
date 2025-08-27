import { describe, expect, it, vi } from "vitest";
import { Monad } from "./monad";

describe("Monad", () => {
  // --- Static constructors ---
  it("Monad.from creates a Monad with the value", () => {
    const m = Monad.from(42);
    expect(m.get()).toBe(42);
  });

  it("Monad.fromExact creates a Monad with the exact value", () => {
    const m = Monad.fromExact({ a: 1 });
    expect(m.get()).toEqual({ a: 1 });
  });

  it("Monad.tupled returns a Monad of tupled values", () => {
    const m1 = Monad.from(1);
    const m2 = Monad.from("a");
    const m3 = Monad.from(true);
    const tupled = Monad.tupled([m1, m2, m3]);
    expect(tupled.get()).toEqual([1, "a", true]);
  });

  it("Monad.tupled with empty array returns Monad of empty array", () => {
    const tupled = Monad.tupled([]);
    expect(tupled.get()).toEqual([]);
  });

  // --- map ---
  it("map transforms the value", () => {
    const m = Monad.from(2).map(x => x * 3);
    expect(m.get()).toBe(6);
  });

  it("map can change the value type", () => {
    const m = Monad.from(2).map(x => x.toString());
    expect(m.get()).toBe("2");
  });

  it("map with function returning undefined works", () => {
    const m = Monad.from(1).map(() => undefined);
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    expect(m.get()).toBeUndefined();
  });

  // --- flatMap ---
  it("flatMap chains Monads", () => {
    const m = Monad.from(2).flatMap(x => Monad.from(x + 1));
    expect(m.get()).toBe(3);
  });

  it("flatMap can change the value type", () => {
    const m = Monad.from(2).flatMap(x => Monad.from(x.toString()));
    expect(m.get()).toBe("2");
  });

  it("flatMap with function returning Monad of undefined works", () => {
    const m = Monad.from(1).flatMap(() => Monad.from(undefined));
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    expect(m.get()).toBeUndefined();
  });

  // --- tap ---
  it("tap calls the function with the value and returns this", () => {
    const cb = vi.fn();
    const m = Monad.from(5);
    const result = m.tap(cb);
    expect(cb).toHaveBeenCalledWith(5);
    expect(result).toBe(m);
  });

  // --- get ---
  it("get returns the value", () => {
    expect(Monad.from("hello").get()).toBe("hello");
  });

  // --- toOption ---
  it("toOption returns Option.some for non-null/undefined", () => {
    const m = Monad.from(123);
    const opt = m.toOption();
    expect(opt.getOrNull()).toBe(123);
  });

  it("toOption returns Option.none for null/undefined", () => {
    const m1 = Monad.from<number | null>(null);
    const m2 = Monad.from<number | undefined>(undefined);
    expect(m1.toOption().getOrNull()).toBeNull();
    expect(m2.toOption().getOrNull()).toBeNull();
  });

  // --- toArray ---
  it("toArray returns an array with the value", () => {
    expect(Monad.from(7).toArray()).toEqual([7]);
  });
});
