import { raise, typedKeys, typedToEntries } from "@web-art/core";

import { IndexError } from "./error.ts";

import type { AllStats, Property, Stats, TimeableTarget } from "./types.ts";

export class TimeAudit {
  private readonly allStats: AllStats<Stats>;

  constructor(stats: AllStats<Stats>) {
    this.allStats = stats;
  }

  /**
   * Get the stats of a given target/property pair
   * @param {string} target
   * @param {string | Symbol} property
   * @returns {Stats}
   */
  getStats(target: TimeableTarget, property: Property): Stats {
    return (
      this.allStats.get(target)?.properties[property] ??
      raise(new IndexError("Method name does not exist on target"))
    );
  }

  /**
   * Generator which iterates over all the targets inside the stats
   * @yields {string} Current target
   */
  *targets(): Generator<TimeableTarget> {
    for (const target of this.allStats.keys()) {
      yield target;
    }
  }

  /**
   * Generator which iterates over the target's properties
   * @param {string} target
   * @yields {string | symbol} Current property
   */
  *properties(target: TimeableTarget): Generator<Property> {
    const allPropertyStats =
      this.allStats.get(target) ??
      raise(new IndexError("Target does not exist"));
    for (const property of typedKeys(allPropertyStats, true)) {
      yield property;
    }
  }

  /**
   * Iterates over the audited stats
   * @param {function({calls: number, executionTime: number, minDebugLevel: number}, TimeableTarget, string | symbol): void} callbackFn
   */
  forEach(
    callbackFn: (
      this: TimeAudit,
      stats: Stats,
      target: TimeableTarget,
      property: Property
    ) => void
  ): void {
    this.allStats.entries().forEach(([target, propertyStats]) => {
      typedToEntries(propertyStats.properties, true).forEach(
        ([property, stats]) => {
          callbackFn.call(this, stats, target, property);
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

    return this.allStats.entries().reduce((fullStr, [_, targetStats]) => {
      const targetStr = typedToEntries(targetStats.properties, true).reduce(
        (acc, [property, { calls, executionTime }]) =>
          calls > 0
            ? `${acc}\n  - ${property.toString()} Calls:${formatNumber(
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
        ? `${fullStr}${fullStr !== "" ? "\n\n" : ""}===== ${
            targetStats.targetName
          } =====${targetStr}`
        : fullStr;
    }, "");
  }
}
