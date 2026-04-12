import { isFunction, isString } from "deep-guards";
import { mapFilter, tuple, typedKeys } from "niall-utils";

import type {
  AnyFunction,
  MethodName,
  RecordableStats,
  Stats,
  TargetMap,
} from "./types.ts";

const emptyStats: Readonly<Stats> = { calls: 0, executionTime: 0 };

const METHOD_NAME_DENY_SET = new Set(["constructor"]);

export type RegisterParams = {
  // The human readable name to show in audits
  targetName?: string;
  // A debugging level filter
  minDebugLevel?: number;
} & (
  | {
      // Should methods with symbol keys be included?
      includeSymbols?: boolean;
    }
  | {
      // A subset of the target's methods
      methodNames: MethodName[];
    }
);

export class MethodWatcher {
  private readonly allStats: TargetMap<RecordableStats> = new Map();

  private patchMethod<M extends MethodName>(
    target: Record<M, AnyFunction>,
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

  registerMethod<F extends AnyFunction>(
    method: F,
    minDebugLevel: number = 0
  ): F {
    const { methods: orphanedMethods } = this.allStats.getOrInsert(null, {
      methods: {},
    });

    const orphanedStats = orphanedMethods[method.name];

    if (orphanedStats != null) {
      orphanedStats.minDebugLevel = minDebugLevel;
      return method;
    } else {
      const stats = (orphanedMethods[method.name] = {
        ...emptyStats,
        minDebugLevel,
      });

      return function (
        this: ThisParameterType<F>,
        ...args: Parameters<F>
      ): unknown {
        const startTime = performance.now();
        const ret = method.call(this, ...args);
        stats.executionTime += performance.now() - startTime;
        stats.calls++;
        return ret;
      } as F;
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
        this.patchMethod(target, targetName, name, minDebugLevel);
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
