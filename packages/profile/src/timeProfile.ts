import { typedToEntries } from "@web-art/core";
import {
  isAnyRecord,
  isFunction,
  isObjectOf,
  isString,
  isUnionOf,
} from "deep-guards";

import { AuditError } from "./error.ts";
import { safeAccess } from "./safeAccess.ts";
import { unsafeTargetName } from "./tagged.ts";
import { TimeAudit } from "./timeAudit.ts";

import type { MethodName, TargetName } from "./tagged.ts";
import type { Stats, Timeable, TimeableStats } from "./types.ts";

const hasName = isUnionOf(isFunction, isObjectOf({ name: isString }));
const hasPrototype = isUnionOf(
  isFunction,
  isObjectOf({ prototype: isAnyRecord })
);

export class TimeProfile {
  private static readonly methods: Timeable[] = [];
  private static readonly methodTimes: Record<
    TargetName,
    Record<MethodName, TimeableStats>
  > = {};

  private readonly debugLevel: number;
  private recordedStats: Record<TargetName, Record<MethodName, Stats>> | null =
    null;
  private auditing: boolean = false;

  /**
   * Registers a class for analyzing execution time
   *  If called multiple times with the same method, the lower of the two debug levels is taken.
   * @param {class} target The class/object to analyze
   * @param {string[]} [methodNames] The method names of the class/object to analyze. Defaults to all except the constructor.
   * @param {number} [minDebugLevel] The minimum debug level of these methods, where the lower it is, the higher priority it is to be included. Defaults to 1
   * @param {boolean} [addPrototype] Recursively call the prototype of the target. Defaults to true if the methodNames aren't given
   */
  static registerMethods(
    target: unknown,
    name: TargetName = unsafeTargetName(
      hasName(target) ? target.name : "Anonymous"
    ),
    methodNames: MethodName[] | undefined = undefined,
    minDebugLevel: number = 1,
    addPrototype: boolean = methodNames == null
  ): void {
    if (methodNames == null) {
      const properties = Object.getOwnPropertyNames(target) as MethodName[];
      const ignoreSet = new Set(["constructor", "prototype"] as MethodName[]);

      methodNames = properties.filter(
        name =>
          !ignoreSet.has(name) &&
          isFunction((target as Record<string, unknown>)[name])
      );
    }
    this.methods.push({
      name: unsafeTargetName(name),
      target: target as Timeable["target"],
      methodNames,
      minDebugLevel,
    });
    if (addPrototype && hasPrototype(target)) {
      TimeProfile.registerMethods(
        target.prototype,
        unsafeTargetName(`${name}.prototype`),
        undefined,
        minDebugLevel,
        false
      );
    }
  }

  /**
   * TimeAnalysis class constructor
   * @param {number} debugLevel Debug level to analyze at. Defaults to Infinity
   */
  constructor(debugLevel: number = Infinity) {
    this.debugLevel = debugLevel;
    TimeProfile.methods
      .filter(item => item.minDebugLevel < debugLevel)
      .forEach(item => {
        item.methodNames.forEach(methodName => {
          const method = isFunction(item.target[methodName])
            ? item.target[methodName]
            : isFunction(item.target.prototype[methodName])
              ? item.target.prototype[methodName]
              : null;
          if (method != null) {
            const patchedMethod = this.timeMethod(
              method,
              methodName,
              item.minDebugLevel,
              item.name
            );
            if (patchedMethod != null) {
              if (isFunction(item.target[methodName])) {
                item.target[methodName] = patchedMethod;
              } else {
                item.target.prototype[methodName] = patchedMethod;
              }
            }
          }
        });
      });
  }

  private timeMethod<
    T,
    F extends (this: ThisType<T>, ...args: unknown[]) => unknown,
  >(
    method: F,
    methodName: MethodName,
    minDebugLevel: number,
    targetName: TargetName
  ): F | null {
    TimeProfile.methodTimes[targetName] ??= {};
    TimeProfile.methodTimes[targetName][methodName] ??= {
      minDebugLevel,
      calls: 0,
      totalExecutionTime: 0,
      setup: false,
    };
    const stats = TimeProfile.methodTimes[targetName][methodName];

    if (minDebugLevel < stats.minDebugLevel) {
      stats.minDebugLevel = minDebugLevel;
    }

    if (!stats.setup) {
      stats.setup = true;

      return function (this: ThisType<T>, ...args: unknown[]): unknown {
        const startTime = performance.now();
        const ret = method.apply(this, args);
        stats.totalExecutionTime += performance.now() - startTime;
        stats.calls++;
        return ret;
      } as F;
    }
    return null;
  }

  private recordCurrentStats() {
    this.recordedStats = {};
    for (const [targetName, targetStats] of typedToEntries(
      TimeProfile.methodTimes
    )) {
      for (const [methodName, methodStats] of typedToEntries(targetStats)) {
        if (methodStats.minDebugLevel < this.debugLevel) {
          this.recordedStats[targetName] = {
            ...(this.recordedStats[targetName] ?? {}),
            [methodName]: {
              calls: methodStats.calls,
              totalExecutionTime: methodStats.totalExecutionTime,
              minDebugLevel: methodStats.minDebugLevel,
            },
          };
        }
      }
    }
  }

  private generateStats(): Record<TargetName, Record<MethodName, Stats>> {
    const stats: Record<TargetName, Record<MethodName, Stats>> = {};
    if (this.recordedStats != null) {
      for (const [targetName, targetStats] of typedToEntries(
        this.recordedStats
      )) {
        for (const [methodName, methodStats] of typedToEntries(targetStats)) {
          const methodTimes = safeAccess(
            TimeProfile.methodTimes,
            targetName,
            methodName
          );
          stats[targetName] = {
            ...(stats[targetName] ?? {}),
            [methodName]: {
              ...methodStats,
              calls: methodTimes.calls - methodStats.calls,
              totalExecutionTime:
                methodTimes.totalExecutionTime - methodStats.totalExecutionTime,
            },
          };
        }
      }
    }
    return stats;
  }

  /**
   * Starts auditing, later to be retrieved with endAudit
   */
  startAudit(): void {
    if (this.auditing) {
      throw new AuditError(
        "Cannot do two audits at the same time with the same instance! Wait until the first is finished or create another instance"
      );
    }
    this.auditing = true;
    this.recordCurrentStats();
  }

  /**
   * Ends auditing, which was started with startAudit.
   * @returns {TimeAudit} Stats generated between the startAudit and endAudit calls
   */
  endAudit(): TimeAudit {
    if (!this.auditing) {
      throw new AuditError(
        "You must call startAudit before endAudit is called."
      );
    }
    const stats = this.generateStats();
    this.auditing = false;

    return new TimeAudit(stats);
  }

  /**
   * Performs an audit on a given function
   * @param {function(): Promise<void>} func Runs the function and then gets the stats for the function
   * @returns {TimeAudit} Result of the audit
   * @throws {AuditError} If there is an audit already going on
   */
  async auditAsync(func: () => Promise<void>): Promise<TimeAudit> {
    this.startAudit();
    await func();
    return this.endAudit();
  }

  /**
   * Performs an audit on a given function
   * @param {function(): void} func Runs the function and then gets the stats for the function
   * @returns {TimeAudit} Result of the audit
   * @throws {AuditError} If there is an audit already going on
   */
  auditSync(func: () => void): TimeAudit {
    this.startAudit();
    func();
    return this.endAudit();
  }
}
