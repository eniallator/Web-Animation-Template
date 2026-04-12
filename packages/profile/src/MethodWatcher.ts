import { isFunction, isString } from "deep-guards";
import { mapFilter, tuple, typedKeys } from "niall-utils";

import type {
  AnyFunction,
  FunctionKeys,
  RecordableStats,
  Stats,
  Target,
  TargetMap,
} from "./types.ts";

const emptyStats: Readonly<Stats> = { calls: 0, executionTime: 0 };

const METHOD_NAME_DENY_SET = new Set<PropertyKey>(["constructor"]);

export type RegisterParams<M extends PropertyKey> = {
  targetName?: string;
  minDebugLevel?: number;
} & ({ includeSymbols?: boolean } | { methodNames: M[] });

export class MethodWatcher {
  private readonly allStats: TargetMap<RecordableStats> = new Map();

  /**
   * Registers a method to time. It will return the new monitored method.
   * @param {AnyFunction} method The method to register
   * @param {Target} target The original object
   * @param {string} targetName Human-readable target name
   * @param {PropertyKey} methodName Human-readable method name.
   * @param {number} minDebugLevel A debugging level filter. Included if the monitored debug level is greater than this.
   * @returns {AnyFunction} the patched method.
   */
  registerMethod<F extends AnyFunction>(
    method: F,
    target: Target,
    targetName: string,
    methodName: PropertyKey,
    minDebugLevel: number
  ): F {
    let methods = this.allStats.get(target)?.methods;
    if (methods == null) {
      methods = {};
      this.allStats.set(target, { targetName, methods });
    }

    const orphanedStats = methods[methodName];

    if (orphanedStats != null) {
      orphanedStats.minDebugLevel = minDebugLevel;
      return method;
    } else {
      const stats = (methods[methodName] = {
        ...emptyStats,
        minDebugLevel,
      });

      return function (...args: Parameters<F>): unknown {
        const startTime = performance.now();
        const output = method.call(this, ...args);
        stats.executionTime += performance.now() - startTime;
        stats.calls++;
        return output;
      } as F;
    }
  }

  patchObject<T extends NonNullable<unknown>>(
    target: T,
    params: RegisterParams<FunctionKeys<T>> = {}
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
      target[name] = this.registerMethod(
        target[name] as AnyFunction,
        target,
        targetName,
        name,
        minDebugLevel
      ) as T[keyof T];
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
