import { raise, typedKeys, typedToEntries } from "@web-art/core";

import { targetError } from "./error.ts";
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
  *methodNames(target: TargetName): Generator<MethodName> {
    const methods = this.allStats[target] ?? raise(targetError);
    for (const methodName of typedKeys(methods)) {
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
      target: TargetName,
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
   * @param {number} digits Number length in digits. Defaults to 5
   * @returns {string}
   */
  toString(digits: number = 5): string {
    return Object.entries(this.allStats).reduce(
      (fullStr, [target, methodStats]) => {
        const targetStats = Object.entries(methodStats).reduce(
          (acc, [methodName, stats]) =>
            stats.calls > 0
              ? acc +
                `  - ${methodName} Calls:` +
                stats.calls.toExponential(digits) +
                " Total Execution Time: " +
                stats.totalExecutionTime.toExponential(digits) +
                "ms Average Execution Time " +
                (stats.totalExecutionTime / stats.calls).toExponential(digits) +
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
