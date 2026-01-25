import { filterAndMap, tuple, typedKeys } from "@web-art/core";
import {
  isAnyRecord,
  isFunction,
  isObjectOf,
  isString,
  isUnionOf,
} from "deep-guards";

import type { DiscriminatedParams } from "@web-art/core";
import type { TypeFromGuard } from "deep-guards";
import type { MethodName, RecordableStats, Stats, TargetMap } from "./types.ts";

const emptyStats: Readonly<Stats> = { calls: 0, executionTime: 0 };
const hasPrototype = isUnionOf(
  isFunction,
  isObjectOf({ prototype: isAnyRecord })
);

export type RegisterMethodsParams = DiscriminatedParams<
  {
    targetName?: string;
    minDebugLevel?: number;
    includePrototype?: boolean;
  },
  { includeSymbols?: boolean } | { methodNames: MethodName[] }
>;

export class MethodWatcher {
  private readonly allStats: TargetMap<RecordableStats> = new Map();

  private registerMethod<M extends MethodName>(
    target: { [I in M]: TypeFromGuard<typeof isFunction> },
    targetName: string,
    methodName: M,
    minDebugLevel: number
  ): void {
    const existing = this.allStats.get(target)?.methods;
    if (existing?.[methodName] != null) {
      existing[methodName].minDebugLevel = minDebugLevel;
    } else {
      const stats: RecordableStats = { ...emptyStats, minDebugLevel };
      this.allStats.set(target, {
        targetName,
        methods: { ...existing, [methodName]: stats },
      });

      const origMethod = target[methodName] as (...args: unknown[]) => unknown;

      target[methodName] = function (...args: unknown[]): unknown {
        const startTime = performance.now();
        const ret = origMethod.call(this, ...args);
        stats.executionTime += performance.now() - startTime;
        stats.calls++;
        return ret;
      };
    }
  }

  registerMethods(
    target: NonNullable<unknown>,
    params: RegisterMethodsParams["internal"] = {}
  ): void {
    const {
      targetName = "name" in target && isString(target.name)
        ? target.name
        : "Unknown",
      minDebugLevel = 0,
      includePrototype = params.methodNames == null,
      methodNames = typedKeys(target, params.includeSymbols).filter(
        name => name !== "constructor" && isFunction(target[name])
      ),
    } = params;

    methodNames.forEach(methodName => {
      if (isFunction((target as Record<MethodName, unknown>)[methodName])) {
        this.registerMethod(target, targetName, methodName, minDebugLevel);
      }
    });

    if (includePrototype && hasPrototype(target)) {
      this.registerMethods(target.prototype as NonNullable<unknown>, {
        ...params,
        targetName: `${targetName}.prototype`,
        includePrototype: false,
      });
    }
  }

  getStats(
    debugLevel: number = 1,
    snapshot?: TargetMap<Stats>
  ): TargetMap<Stats> {
    return new Map(
      this.allStats.entries().map(([target, { targetName, methods }]) => {
        const entries = filterAndMap(typedKeys(methods, true), methodName => {
          const methodStats = methods[methodName] as RecordableStats;
          const snapStats =
            snapshot?.get(target)?.methods[methodName] ?? emptyStats;

          return methodStats.minDebugLevel < debugLevel
            ? tuple(methodName, {
                calls: methodStats.calls - snapStats.calls,
                executionTime:
                  methodStats.executionTime - snapStats.executionTime,
              })
            : null;
        });

        return tuple(target, {
          targetName,
          methods: Object.fromEntries(entries),
        });
      })
    );
  }
}
