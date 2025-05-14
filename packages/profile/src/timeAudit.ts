import { typedKeys, typedToEntries } from "@web-art/core";

import { safeAccess } from "./safeAccess.ts";

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
    return safeAccess(this.allStats, targetName, methodName);
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
    for (const methodName of typedKeys(safeAccess(this.allStats, targetName))) {
      yield methodName;
    }
  }

  /**
   * Iterates over the audited stats
   * @param {function({calls: number, totalExecutionTime: number, minDebugLevel: number}, string, string): void} callbackFn
   */
  forEach(
    callbackFn: (
      stats: Stats,
      targetName: TargetName,
      methodName: MethodName
    ) => void
  ): void {
    for (const [targetName, methodStats] of typedToEntries(this.allStats)) {
      for (const [methodName, stats] of typedToEntries(methodStats)) {
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

    return Object.entries(this.allStats).reduce(
      (fullStr, [target, methodStats]) => {
        const targetStats = Object.entries(methodStats).reduce(
          (acc, [methodName, stats]) =>
            stats.calls > 0
              ? acc +
                `  - ${methodName} Calls:` +
                formatNumber(stats.calls) +
                " Total Execution Time: " +
                formatNumber(stats.totalExecutionTime) +
                "ms Average Execution Time " +
                formatNumber(stats.totalExecutionTime / stats.calls) +
                "ms\n"
              : acc,
          ""
        );

        return targetStats !== ""
          ? fullStr +
              (fullStr !== "" ? "\n\n" : "") +
              `===== ${target} =====\n${targetStats}`
          : fullStr;
      },
      ""
    );
  }
}
