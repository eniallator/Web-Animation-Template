import { typedKeys, typedProperties, typedToEntries } from "@web-art/core";
import {
  isAnyRecord,
  isFunction,
  isObjectOf,
  isString,
  isUnionOf,
} from "deep-guards";

import { AuditError } from "./error.ts";
import { unsafeTargetName } from "./tagged.ts";
import { TimeAudit } from "./timeAudit.ts";

import type { MethodName, TargetName } from "./tagged.ts";
import type { Stats, TimeableStats, TimeableTarget } from "./types.ts";

const hasName = isUnionOf(isFunction, isObjectOf({ name: isString }));
const hasPrototype = isUnionOf(
  isFunction,
  isObjectOf({ prototype: isAnyRecord })
);

export class TimeProfile {
  private static readonly methodTimes: Record<
    TargetName,
    Record<MethodName, TimeableStats>
  > = {};

  private static getStats(
    debugLevel: number,
    recordedStats?: Record<TargetName, Record<MethodName, Stats>>
  ) {
    const stats: Record<TargetName, Record<MethodName, Stats>> = {};

    for (const [targetName, targetStats] of typedToEntries(this.methodTimes)) {
      if (recordedStats != null && recordedStats[targetName] == null) continue;

      for (const [methodName, methodStats] of typedToEntries(targetStats)) {
        if (methodStats.minDebugLevel < debugLevel) {
          stats[targetName] ??= {};
          stats[targetName][methodName] = {
            calls:
              methodStats.calls -
              (recordedStats?.[targetName]?.[methodName]?.calls ?? 0),
            executionTime:
              methodStats.executionTime -
              (recordedStats?.[targetName]?.[methodName]?.executionTime ?? 0),
          };
        }
      }
    }

    return stats;
  }

  private static tryPatchMethod(
    target: TimeableTarget,
    targetName: TargetName,
    methodName: MethodName,
    minDebugLevel: number
  ): void {
    this.methodTimes[targetName] ??= {};
    this.methodTimes[targetName][methodName] ??= {
      calls: 0,
      executionTime: 0,
      minDebugLevel,
      setup: false,
    };
    const stats = this.methodTimes[targetName][methodName];

    if (minDebugLevel < stats.minDebugLevel) {
      stats.minDebugLevel = minDebugLevel;
    }

    if (!stats.setup) {
      stats.setup = true;

      const origMethod = target[methodName] as (...args: unknown[]) => unknown;

      target[methodName] = function (...args: unknown[]): unknown {
        const startTime = performance.now();
        const ret = origMethod.apply(this, args);
        stats.executionTime += performance.now() - startTime;
        stats.calls++;
        return ret;
      };
    }
  }

  /**
   * Registers a class for analyzing execution time
   *  If called multiple times with the same method, the lower of the two debug levels is taken.
   * @param {unknown} _target The class/object to analyze
   * @param {string[]} methodNames The method names of the class/object to analyze. Defaults to all except the constructor.
   * @param {number} [minDebugLevel] The minimum debug level of these methods, where the lower it is, the higher priority it is to be included. Defaults to 1
   * @param {boolean} [addPrototype] Recursively call the prototype of the target. Defaults to true if the methodNames aren't given
   */
  static registerMethods(
    _target: NonNullable<unknown>,
    params: {
      targetName?: TargetName;
      minDebugLevel?: number;
      includePrototype?: boolean;
    } & ({ includeSymbols?: boolean } | { methodNames: MethodName[] }) = {}
  ): void {
    const target = _target as TimeableTarget;
    const {
      targetName = unsafeTargetName(
        hasName(_target) ? _target.name : "Anonymous"
      ),
      minDebugLevel = 1,
      includePrototype = !("methodNames" in params),
    } = params;

    const methodNames = (
      "includeSymbols" in params && params.includeSymbols
        ? typedProperties(target)
        : typedKeys(target)
    ).filter(name => name !== "constructor" && isFunction(target[name]));

    methodNames.forEach(methodName => {
      if (isFunction(target[methodName])) {
        this.tryPatchMethod(target, targetName, methodName, minDebugLevel);
      }
    });

    if (includePrototype && hasPrototype(target)) {
      TimeProfile.registerMethods(target.prototype, {
        ...params,
        targetName: unsafeTargetName(`${targetName}.prototype`),
        includePrototype: false,
      });
    }
  }

  private readonly debugLevel: number;
  private recordedStats: Record<TargetName, Record<MethodName, Stats>> | null =
    null;

  /**
   * TimeAnalysis class constructor
   * @param {number} debugLevel Debug level to analyze at. Defaults to Infinity
   */
  constructor(debugLevel: number = Infinity) {
    this.debugLevel = debugLevel;
  }

  /**
   * Starts auditing, later to be retrieved with endAudit
   */
  startAudit(): void {
    if (this.recordedStats != null) {
      throw new AuditError(
        "Cannot do two audits at the same time with the same instance! Wait until the first is finished or create another instance"
      );
    }

    this.recordedStats = TimeProfile.getStats(this.debugLevel);
  }

  /**
   * Ends auditing, which was started with startAudit.
   * @returns {TimeAudit} Stats generated between the startAudit and endAudit calls
   */
  endAudit(): TimeAudit {
    if (this.recordedStats == null) {
      throw new AuditError(
        "You must call startAudit before endAudit is called."
      );
    }

    const stats = TimeProfile.getStats(this.debugLevel, this.recordedStats);
    this.recordedStats = null;

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
