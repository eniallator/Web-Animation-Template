import {
  raise,
  typedKeys,
  typedProperties,
  typedToEntries,
} from "@web-art/core";

import { IndexError } from "./error.ts";

import type { MethodName, TargetName } from "./tagged.ts";
import type { Stats } from "./types.ts";

export class TimeAudit {
  private readonly allStats: Record<TargetName, Record<MethodName, Stats>>;

  constructor(stats: Record<TargetName, Record<MethodName, Stats>>) {
    this.allStats = stats;
  }

  /**
   * Get the stats of a given targetName/methodName pair
   * @param {string} targetName
   * @param {string} methodName
   * @returns {Stats}
   */
  getStats(targetName: TargetName, methodName: MethodName): Stats {
    return (
      this.allStats[targetName]?.[methodName] ??
      raise(new IndexError("Method name does not exist on target"))
    );
  }

  /**
   * Generator which iterates over all the targets inside the stats
   * @yields {string} Current target
   */
  *targets(): Generator<TargetName> {
    for (const target of typedKeys(this.allStats)) {
      yield target;
    }
  }

  /**
   * Generator which iterates over the target's methodNames
   * @param {string} target
   * @yields {string} Current methodName
   */
  *methodNames(targetName: TargetName): Generator<MethodName> {
    for (const methodName of typedProperties(
      this.allStats[targetName] ??
        raise(new IndexError("Target does not exist"))
    )) {
      yield methodName;
    }
  }

  /**
   * Iterates over the audited stats
   * @param {function({calls: number, executionTime: number, minDebugLevel: number}, string, string): void} callbackFn
   */
  forEach(
    callbackFn: (
      stats: Stats,
      targetName: TargetName,
      methodName: MethodName
    ) => void
  ): void {
    for (const [targetName, methodStats] of typedToEntries(this.allStats)) {
      for (const [methodName, stats] of typedToEntries(methodStats, true)) {
        callbackFn(stats, targetName, methodName);
      }
    }
  }

  /**
   * Prettifies the time audit so you can log it out
   * @param {number | undefined} digits Number length in digits
   * @returns {string}
   */
  toString(digits?: number): string {
    const formatNumber = (n: number): string =>
      digits != null || n < 1 ? n.toExponential(digits) : `${n}`;

    return typedToEntries(this.allStats).reduce(
      (fullStr, [target, methodStats]) => {
        const targetStats = typedToEntries(methodStats, true).reduce(
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

        return targetStats !== ""
          ? `${fullStr}${
              fullStr !== "" ? "\n\n" : ""
            }===== ${target} =====${targetStats}`
          : fullStr;
      },
      ""
    );
  }
}
