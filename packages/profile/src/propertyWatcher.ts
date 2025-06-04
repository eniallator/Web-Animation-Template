import { filterAndMap, tuple, typedKeys } from "@web-art/core";
import {
  isAnyRecord,
  isFunction,
  isObjectOf,
  isString,
  isUnionOf,
} from "deep-guards";

import type { UnionWithAllKeys } from "@web-art/core";
import type {
  AllStats,
  Property,
  RecordableStats,
  Stats,
  TimeableTarget,
} from "./types.ts";

const emptyStats: Readonly<Stats> = { calls: 0, executionTime: 0 };
const hasPrototype = isUnionOf(
  isFunction,
  isObjectOf({ prototype: isAnyRecord })
);

export class PropertyWatcher {
  private readonly allStats: AllStats<RecordableStats> = new Map();

  private registerMethod(
    target: TimeableTarget,
    targetName: string,
    property: Property,
    minDebugLevel: number
  ): void {
    const existing = this.allStats.get(target)?.properties;
    if (existing?.[property] != null) {
      existing[property].minDebugLevel = minDebugLevel;
    } else {
      const stats: RecordableStats = { ...emptyStats, minDebugLevel };
      this.allStats.set(target, {
        targetName,
        properties: {
          ...(existing ?? {}),
          [property]: stats,
        },
      });

      const origMethod = target[property] as (...args: unknown[]) => unknown;

      target[property] = function (...args: unknown[]): unknown {
        const startTime = performance.now();
        const ret = origMethod.call(this, ...args);
        stats.executionTime += performance.now() - startTime;
        stats.calls++;
        return ret;
      };
    }
  }

  registerMethods(
    _target: NonNullable<unknown>,
    params: {
      targetName?: string;
      minDebugLevel?: number;
      includePrototype?: boolean;
    } & UnionWithAllKeys<
      [{ includeSymbols?: boolean }, { properties: Property[] }]
    > = {}
  ): void {
    const target = _target as TimeableTarget;
    const {
      targetName = "name" in target && isString(target.name)
        ? target.name
        : "Unknown",
      minDebugLevel = 1,
      includePrototype = params.properties == null,
      properties = typedKeys(target, params.includeSymbols).filter(
        name => name !== "constructor" && isFunction(target[name])
      ),
    } = params;

    properties.forEach(property => {
      if (isFunction(target[property])) {
        this.registerMethod(target, targetName, property, minDebugLevel);
      }
    });

    if (includePrototype && hasPrototype(target)) {
      this.registerMethods(target.prototype as TimeableTarget, {
        ...params,
        targetName: `${targetName}.prototype`,
        includePrototype: false,
      });
    }
  }

  getStats(debugLevel: number, snapshot?: AllStats<Stats>): AllStats<Stats> {
    return new Map(
      this.allStats.entries().map(([target, { targetName, properties }]) => {
        const entries = filterAndMap(typedKeys(properties, true), property => {
          const propStats = properties[property] as RecordableStats;
          const snapStats =
            snapshot?.get(target)?.properties[property] ?? emptyStats;

          return propStats.minDebugLevel < debugLevel
            ? tuple(property, {
                calls: propStats.calls - snapStats.calls,
                executionTime:
                  propStats.executionTime - snapStats.executionTime,
              })
            : null;
        });

        return tuple(target, {
          targetName,
          properties: Object.fromEntries(entries),
        });
      })
    );
  }
}
