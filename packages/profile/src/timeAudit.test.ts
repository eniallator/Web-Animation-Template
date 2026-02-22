import { tuple } from "niall-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { IndexError } from "./error";
import { TimeAudit } from "./timeAudit";

import type { MethodName, Stats, TargetMap } from "./types.ts";

// Mock helpers
const makeStats = (calls: number, executionTime: number): Stats => ({
  calls,
  executionTime,
});

interface Target {
  name: string;
  methods: Record<string, Stats>;
}

const makeTargetMap = (targets: Target[]): TargetMap<Stats> =>
  new Map(
    targets.map(target =>
      tuple(target, { targetName: target.name, methods: target.methods })
    )
  );

describe("TimeAudit", () => {
  let targetA: Target,
    targetB: Target,
    statsMap: TargetMap<Stats>,
    audit: TimeAudit;

  beforeEach(() => {
    targetA = {
      name: "A",
      methods: { foo: makeStats(2, 10), bar: makeStats(0, 0) },
    };
    targetB = { name: "B", methods: { baz: makeStats(3, 30) } };
    statsMap = makeTargetMap([targetA, targetB]);
    audit = new TimeAudit(statsMap);
  });

  // --- getStats ---
  it("getStats returns stats for valid target and method", () => {
    expect(audit.getStats(targetA, "foo")).toEqual({
      calls: 2,
      executionTime: 10,
    });
    expect(audit.getStats(targetB, "baz")).toEqual({
      calls: 3,
      executionTime: 30,
    });
  });

  it("getStats throws if method does not exist", () => {
    expect(() => audit.getStats(targetA, "baz")).toThrow(IndexError);
    expect(() => audit.getStats(targetB, "foo")).toThrow(IndexError);
  });

  it("getStats throws if target does not exist", () => {
    expect(() => audit.getStats({}, "foo")).toThrow(IndexError);
  });

  // --- targets ---
  it("targets yields all targets", () => {
    const targets = Array.from(audit.targets());
    expect(targets).toEqual([targetA, targetB]);
  });

  // --- properties ---
  it("properties yields all method names for a target", () => {
    const propsA = Array.from(audit.properties(targetA));
    expect(propsA).toEqual(["foo", "bar"]);

    const propsB = Array.from(audit.properties(targetB));
    expect(propsB).toEqual(["baz"]);
  });

  it("properties throws if target does not exist", () => {
    expect(() => Array.from(audit.properties({}))).toThrow(IndexError);
  });

  // --- forEach ---
  it("forEach calls callback for each method with calls > 0", () => {
    const calls: [Stats, NonNullable<unknown>, MethodName][] = [];
    audit.forEach((...args) => calls.push(args));

    expect(calls).toStrictEqual([
      [{ calls: 2, executionTime: 10 }, targetA, "foo"],
      [{ calls: 0, executionTime: 0 }, targetA, "bar"],
      [{ calls: 3, executionTime: 30 }, targetB, "baz"],
    ]);
  });

  it("forEach does nothing if no targets", () => {
    const emptyAudit = new TimeAudit(new Map());
    const cb = vi.fn();
    emptyAudit.forEach(cb);
    expect(cb).not.toBeCalled();
  });

  // --- toString ---
  it("toString formats output with digits", () => {
    const str = audit.toString(2);
    expect(str).toContain("===== A =====");
    expect(str).toContain(
      "foo Calls:2.00e+0 Execution Time: 1.00e+1ms Average Execution Time: 5.00e+0ms"
    );
    expect(str).not.toContain("bar");
    expect(str).toContain("===== B =====");
    expect(str).toContain(
      "baz Calls:3.00e+0 Execution Time: 3.00e+1ms Average Execution Time: 1.00e+1ms"
    );
  });

  it("toString omits methods with 0 calls", () => {
    const str = audit.toString();
    expect(str).toContain("foo");
    expect(str).not.toContain("bar");
    expect(str).toContain("baz");
  });

  it("toString returns empty string if no methods have calls", () => {
    const emptyStatsMap = makeTargetMap([
      { name: "C", methods: { x: makeStats(0, 0) } },
    ]);
    const emptyAudit = new TimeAudit(emptyStatsMap);
    expect(emptyAudit.toString()).toBe("");
  });
});
