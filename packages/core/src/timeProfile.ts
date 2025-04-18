import {
  isAnyRecord,
  isFunction,
  isObjectOf,
  isString,
  isUnionOf,
} from "deep-guards";

import { raise } from "./utils.ts";

class IndexError extends Error {
  name = "IndexError" as const;
}

const targetError = new IndexError("Target does not exist");
const methodError = new IndexError("Method name does not exist on target");

class AuditError extends Error {
  name = "AuditError" as const;
}

interface Timeable {
  name: string;
  target: { prototype: Record<string, () => unknown> } & Record<
    string,
    () => unknown
  >;
  methodNames: string[];
  minDebugLevel: number;
}

interface TimeableStats {
  calls: number;
  totalExecutionTime: number;
  minDebugLevel: number;
  setup: boolean;
}

interface Stats {
  calls: number;
  totalExecutionTime: number;
  minDebugLevel: number;
}

const hasName = isUnionOf(isFunction, isObjectOf({ name: isString }));
const hasPrototype = isUnionOf(
  isFunction,
  isObjectOf({ prototype: isAnyRecord })
);

export class TimeProfile {
  private static readonly methods: Timeable[] = [];
  private static readonly methodTimes: Record<
    string,
    Record<string, TimeableStats>
  > = {};

  private readonly debugLevel: number;
  private recordedStats: Record<string, Record<string, Stats>> | null = null;
  private auditing: boolean = false;

  private static safeMethodTimes(
    target: string,
    methodName: string
  ): TimeableStats {
    return (
      (this.methodTimes[target] ?? raise(targetError))[methodName] ??
      raise(methodError)
    );
  }

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
    name: string = hasName(target) ? target.name : "Anonymous",
    methodNames: string[] | undefined = undefined,
    minDebugLevel: number = 1,
    addPrototype: boolean = methodNames == null
  ): void {
    if (methodNames == null) {
      const properties = Object.getOwnPropertyNames(target);
      const ignoreSet = new Set(["constructor", "prototype"]);

      methodNames = properties.filter(
        name =>
          !ignoreSet.has(name) &&
          isFunction((target as Record<string, unknown>)[name])
      );
    }
    this.methods.push({
      name,
      target: target as Timeable["target"],
      methodNames,
      minDebugLevel,
    });
    if (addPrototype && hasPrototype(target)) {
      TimeProfile.registerMethods(
        target.prototype,
        `${name}.prototype`,
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
    methodName: string,
    minDebugLevel: number,
    targetName: string
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
    for (const [targetName, targetStats] of Object.entries(
      TimeProfile.methodTimes
    )) {
      for (const [methodName, methodStats] of Object.entries(targetStats)) {
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

  generateStats(): Record<string, Record<string, Stats>> {
    const stats: Record<string, Record<string, Stats>> = {};
    if (this.recordedStats != null) {
      for (const [targetName, targetStats] of Object.entries(
        this.recordedStats
      )) {
        for (const [methodName, methodStats] of Object.entries(targetStats)) {
          stats[targetName] = {
            ...(stats[targetName] ?? {}),
            [methodName]: {
              ...methodStats,
              calls:
                TimeProfile.safeMethodTimes(targetName, methodName).calls -
                methodStats.calls,
              totalExecutionTime:
                TimeProfile.safeMethodTimes(targetName, methodName)
                  .totalExecutionTime - methodStats.totalExecutionTime,
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
   * @param {function():Promise<void>} func Runs the function and then gets the stats for the function
   * @returns {TimeAudit} Result of the audit
   * @throws {AuditError} If there is an audit already going on
   */
  async audit(func: () => Promise<void>): Promise<TimeAudit> {
    this.startAudit();
    await func();
    return this.endAudit();
  }

  /**
   * Performs an audit on a given function
   * @param {function():void} func Runs the function and then gets the stats for the function
   * @returns {TimeAudit} Result of the audit
   * @throws {AuditError} If there is an audit already going on
   */
  auditSync(func: () => void): TimeAudit {
    this.startAudit();
    func();
    return this.endAudit();
  }
}

class TimeAudit {
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
