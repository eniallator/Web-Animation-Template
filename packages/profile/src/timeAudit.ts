import { raise } from "@web-art/core";

import { methodError, targetError } from "./error.ts";

import type { Stats } from "./types.ts";

export class TimeAudit {
  private readonly allStats: Record<string, Record<string, Stats>>;

  constructor(stats: Record<string, Record<string, Stats>>) {
    this.allStats = stats;
  }

  private safeAccessStats(target: string, methodName: string): Stats {
    return (
      (this.allStats[target] ?? raise(targetError))[methodName] ??
      raise(methodError)
    );
  }

  /**
   * Get the stats of a given target/methodName pair
   * @param {string} target
   * @param {string} methodName
   * @returns {Stats}
   */
  getStats(target: string, methodName: string): Stats {
    return this.safeAccessStats(target, methodName);
  }

  /**
   * Generator which iterates over all the targets inside the stats
   * @yields {string} Current target
   */
  *targets(): Generator<string> {
    for (const target of Object.keys(this.allStats)) {
      yield target;
    }
  }

  /**
   * Generator which iterates over the target's methodNames
   * @param {string} target
   * @yields {string} Current methodName
   */
  *methodNames(target: string): Generator<string> {
    const methods = this.allStats[target] ?? raise(targetError);
    for (const methodName of Object.keys(methods)) {
      yield methodName;
    }
  }

  /**
   * Iterates over the audited stats
   * @param {function({calls: number, totalExecutionTime: number, minDebugLevel: number}, string, string):void} callbackFn
   */
  forEach(
    callbackFn: (stats: Stats, target: string, methodName: string) => void
  ): void {
    for (const target of this.targets()) {
      for (const methodName of this.methodNames(target)) {
        callbackFn(
          { ...this.safeAccessStats(target, methodName) },
          target,
          methodName
        );
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
