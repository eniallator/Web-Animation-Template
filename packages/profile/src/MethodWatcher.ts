import { isFunction, isString } from "deep-guards";
import { mapFilter, tuple, typedKeys } from "niall-utils";

import type { TypeFromGuard } from "deep-guards";
import type { MethodName, RecordableStats, Stats, TargetMap } from "./types.ts";

const emptyStats: Readonly<Stats> = { calls: 0, executionTime: 0 };

const METHOD_NAME_DENY_SET = new Set(["constructor"]);

export type RegisterParams = {
  // The human readable name to show in audits
  targetName?: string;
  minDebugLevel?: number;
} & ({ includeSymbols?: boolean } | { methodNames: MethodName[] });

export class MethodWatcher {
  private readonly allStats: TargetMap<RecordableStats> = new Map();

  private registerMethod<M extends MethodName>(
    target: Record<M, TypeFromGuard<typeof isFunction>>,
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

      const origMethod = target[methodName];

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
    params: RegisterParams = {}
  ): void {
    const {
      targetName = "name" in target && isString(target.name)
        ? target.name
        : "Unknown",
      minDebugLevel = 0,
    } = params;

    const methodNames =
      "methodNames" in params
        ? params.methodNames
        : typedKeys(target, params.includeSymbols).filter(
            name => !METHOD_NAME_DENY_SET.has(name) && isFunction(target[name])
          );

    for (const name of methodNames) {
      if (isFunction((target as Record<MethodName, unknown>)[name])) {
        this.registerMethod(target, targetName, name, minDebugLevel);
      }
    }
  }

  getStats(
    debugLevel: number = 1,
    snapshot?: TargetMap<Stats>
  ): TargetMap<Stats> {
    return new Map(
      this.allStats.entries().map(([target, { targetName, methods }]) => {
        const entries = mapFilter(typedKeys(methods, true), methodName => {
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
