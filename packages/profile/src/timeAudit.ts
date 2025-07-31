import { raise, typedKeys, typedToEntries } from "@web-art/core";

import { IndexError } from "./error.ts";

import type { TargetMap, MethodName, Stats } from "./types.ts";

export class TimeAudit {
  private readonly allStats: TargetMap<Stats>;

  constructor(stats: TargetMap<Stats>) {
    this.allStats = stats;
  }

  /**
   * Get the stats of a given target/methodName pair
   * @param {string} target
   * @param {string | Symbol} methodName
   * @returns {Stats}
   */
  getStats(target: NonNullable<unknown>, methodName: MethodName): Stats {
    return (
      this.allStats.get(target)?.methods[methodName] ??
      raise(new IndexError("Method name does not exist on target"))
    );
  }

  /**
   * Generator which iterates over all the targets inside the stats
   * @yields {string} Current target
   */
  *targets(): Generator<NonNullable<unknown>> {
    for (const target of this.allStats.keys()) yield target;
  }

  /**
   * Generator which iterates over the target's methodNames
   * @param {string} target
   * @yields {string | symbol} Current methodName
   */
  *properties(target: NonNullable<unknown>): Generator<MethodName> {
    const methodNames =
      this.allStats.get(target) ??
      raise(new IndexError("Target does not exist"));

    for (const methodName of typedKeys(methodNames, true)) yield methodName;
  }

  /**
   * Iterates over the audited stats
   * @param {function({calls: number, executionTime: number, minDebugLevel: number}, NonNullable<unknown>, string | symbol): void} callbackFn
   */
  forEach(
    callbackFn: (
      this: TimeAudit,
      stats: Stats,
      target: NonNullable<unknown>,
      methodName: MethodName
    ) => void
  ): void {
    this.allStats.entries().forEach(([target, methodStats]) => {
      typedToEntries(methodStats.methods, true).forEach(
        ([methodName, stats]) => {
          callbackFn.call(this, stats, target, methodName);
        }
      );
    });
  }

  /**
   * Prettifies the time audit so you can log it out
   * @param {number | undefined} digits Number length in digits
   * @returns {string}
   */
  toString(digits?: number): string {
    const formatNumber = (n: number): string =>
      digits != null || n < 1 ? n.toExponential(digits) : `${n}`;

    return this.allStats.entries().reduce((auditStr, [_, targetStats]) => {
      const targetStr = typedToEntries(targetStats.methods, true).reduce(
        (acc, [methodName, { calls, executionTime }]) =>
          calls > 0
            ? `${acc}\n  - ${methodName.toString()} Calls:${formatNumber(
                calls
              )} Execution Time: ${formatNumber(
                executionTime
              )}ms Average Execution Time: ${formatNumber(
                executionTime / calls
              )}ms`
            : acc,
        ""
      );

      return targetStr !== ""
        ? `${auditStr}${auditStr !== "" ? "\n\n" : ""}===== ${
            targetStats.targetName
          } =====${targetStr}`
        : auditStr;
    }, "");
  }
}
