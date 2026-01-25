import { beforeEach, describe, expect, it } from "vitest";

import { MethodWatcher } from "./MethodWatcher";

import type { RecordableStats } from "./types";

// Helper to get stats from watcher
const getMethodStats = (
  watcher: MethodWatcher,
  target: object,
  method: string
): RecordableStats | undefined => {
  return watcher["allStats"].get(target)?.methods[method];
};

describe("MethodWatcher", () => {
  let watcher: MethodWatcher;

  beforeEach(() => {
    watcher = new MethodWatcher();
  });

  // --- registerMethods & registerMethod ---
  it("registers and wraps a method, tracks calls and execution time", () => {
    const obj = {
      foo() {
        for (let i = 0; i < 10000; i++) {
          // busy loop for measurable time
        }
      },
    };
    watcher.registerMethods(obj);
    const before = getMethodStats(watcher, obj, "foo");
    expect(before?.calls).toBe(0);
    expect(before?.executionTime).toBe(0);

    obj.foo();

    const after = getMethodStats(watcher, obj, "foo");
    expect(after?.calls).toBe(1);
    expect(after?.executionTime).toBeGreaterThan(0);
  });

  it("registers only specified method names", () => {
    const obj = {
      foo() {
        // Do things
      },
      bar() {
        // Do things
      },
    };

    watcher.registerMethods(obj, { methodNames: ["bar"] });

    expect(getMethodStats(watcher, obj, "foo")).toBeUndefined();
    expect(getMethodStats(watcher, obj, "bar")).toBeDefined();
  });

  it("updates minDebugLevel if method already registered", () => {
    const obj = {
      foo() {
        // Do things
      },
    };
    watcher.registerMethods(obj, { methodNames: ["foo"], minDebugLevel: 2 });
    watcher.registerMethods(obj, { methodNames: ["foo"], minDebugLevel: 5 });

    const stats = getMethodStats(watcher, obj, "foo");

    expect(stats?.minDebugLevel).toBe(5);
  });

  it("registers prototype methods if includePrototype is true", () => {
    function C() {
      // Do things
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    C.prototype.bar = function () {
      return 42;
    };

    watcher.registerMethods(C, { includePrototype: true });
    const stats = watcher.getStats();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(stats.get(C.prototype)?.methods.bar).toBeDefined();
  });

  // --- getStats ---
  it("getStats returns correct stats for debugLevel", () => {
    const obj = {
      foo() {
        // Do things
      },
      bar() {
        // Do things
      },
    };
    watcher.registerMethods(obj, { minDebugLevel: 2, methodNames: ["foo"] });
    watcher.registerMethods(obj, { minDebugLevel: 4, methodNames: ["bar"] });

    obj.foo();
    obj.bar();

    // Only methods with minDebugLevel < debugLevel are included
    const stats = watcher.getStats(3);
    const entry = stats.get(obj);

    expect(entry?.methods.foo.calls).toBe(1);
    expect(entry?.methods.bar).toBeUndefined();
  });

  it("getStats subtracts snapshot stats", () => {
    const obj = {
      foo() {
        // Do things
      },
    };
    watcher.registerMethods(obj);

    obj.foo();
    const snap = watcher.getStats();

    obj.foo();
    const diff = watcher.getStats(1, snap);

    expect(diff.get(obj)?.methods.foo.calls).toBe(1);
  });

  it("does not wrap non-function properties", () => {
    const obj = {
      foo: 123,
      bar() {
        // Do things
      },
    };
    watcher.registerMethods(obj);

    obj.bar();

    const stats = watcher.getStats();

    expect(stats.get(obj)?.methods.foo).toBeUndefined();
    expect(stats.get(obj)?.methods.bar).toBeDefined();
  });

  it("getStats returns empty map if no methods match debugLevel", () => {
    const obj = {
      foo() {
        // Do things
      },
    };
    watcher.registerMethods(obj, { minDebugLevel: 10 });
    obj.foo();
    const stats = watcher.getStats(1);
    expect(stats.get(obj)?.methods).toEqual({});
  });
});
