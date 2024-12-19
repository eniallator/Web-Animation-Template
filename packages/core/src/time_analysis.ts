import {
  isFunction,
  isObjectOf,
  isRecordOf,
  isString,
  isUnknown,
} from "deep-guards";
import { Option } from "./option.js";
import { raise } from "./utils.js";

class IndexError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IndexError";
  }
}

class AuditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuditError";
  }
}

interface Timeable {
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

interface Analytics {
  calls: number;
  totalExecutionTime: number;
  minDebugLevel: number;
}

const isObjectWithPrototype = isObjectOf({
  prototype: isRecordOf(isString, isUnknown),
});

export class TimeAnalysis {
  private static readonly methods: Timeable[] = [];
  private static methodTimes: Record<string, Record<string, TimeableStats>> =
    {};

  private recordedStats: Record<string, Record<string, Analytics>> | null =
    null;
  private readonly debugLevel: number;
  private auditing: boolean = false;

  /**
   * Registers a class for analyzing execution time
   * @param {class} target The class/object to analyze
   * @param {string[]} [methodNames] The method names of the class/object to analyze. Defaults to all except the constructor.
   * @param {number} [minDebugLevel=1] The minimum debug level of these methods, where the lower it is, the higher priority it is to be included.
   *  If called multiple times with the same method, the lower of the two debug levels is taken.
   */
  static registerMethods(
    target: unknown,
    methodNames: string[] | undefined = undefined,
    minDebugLevel: number = 1
  ): void {
    if (methodNames == null) {
      methodNames = Object.getOwnPropertyNames(
        isObjectWithPrototype(target) ? target.prototype : target
      ).filter(
        name =>
          name !== "constructor" &&
          isFunction((target as Record<string, unknown>)[name])
      );
    }
    this.methods.push({
      target: target as { prototype: Record<string, () => unknown> } & Record<
        string,
        () => unknown
      >,
      methodNames,
      minDebugLevel,
    });
  }

  /**
   * TimeAnalysis class constructor
   * @param {number} [debugLevel=Infinity] Debug level to analyze at
   */
  constructor(debugLevel: number = Infinity) {
    this.debugLevel = debugLevel;
    TimeAnalysis.methods
      .filter(item => item.minDebugLevel < debugLevel)
      .forEach(item => {
        item.methodNames.forEach(methodName => {
          const method = isFunction(item.target[methodName])
            ? item.target[methodName]
            : isFunction(item.target.prototype[methodName])
              ? item.target.prototype[methodName]
              : null;
          if (method != null) {
            const isObjectWithName = isObjectOf({ name: isString });
            const patchedMethod = this.timeMethod(
              method,
              methodName,
              item.minDebugLevel,
              isObjectWithName(item.target) ? item.target.name : undefined
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
    targetName: string = "Anonymous"
  ): F | null {
    const stats: TimeableStats = TimeAnalysis.methodTimes[targetName]?.[
      methodName
    ] ?? {
      calls: 0,
      totalExecutionTime: 0,
      minDebugLevel: minDebugLevel,
      setup: false,
    };

    TimeAnalysis.methodTimes[targetName] = {
      ...(TimeAnalysis.methodTimes[targetName] ?? {}),
      [methodName]: stats,
    };

    if (minDebugLevel < stats.minDebugLevel) {
      stats.minDebugLevel = minDebugLevel;
    }

    return Option.from(!stats.setup || null)
      .map(() => {
        stats.setup = true;

        return function (this: ThisType<T>, ...args: unknown[]): unknown {
          const startTime = performance.now();
          const ret = method.apply(this, args);
          stats.totalExecutionTime += performance.now() - startTime;
          stats.calls++;
          return ret;
        } as F;
      })
      .getOrNull();
  }

  private recordCurrentStats() {
    this.recordedStats = {};
    for (const [targetName, targetStats] of Object.entries(
      TimeAnalysis.methodTimes
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

  generateStats(): Record<string, Record<string, Analytics>> {
    const stats: Record<string, Record<string, Analytics>> = {};
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
                (
                  TimeAnalysis.methodTimes[targetName]?.[methodName] ??
                  raise<TimeableStats>(new Error("Something went wrong"))
                ).calls - methodStats.calls,
              totalExecutionTime:
                (
                  TimeAnalysis.methodTimes[targetName]?.[methodName] ??
                  raise<TimeableStats>(new Error("Something went wrong"))
                ).totalExecutionTime - methodStats.totalExecutionTime,
            },
          };
        }
      }
    }
    return stats;
  }

  /**
   * Perform an audit for a given length of time
   * @param {number} timeToWait Measured in milliseconds
   * @returns {Promise<TimeAudit>} Resolved when the time is up
   * @throws {AuditError} If there is an audit already going on
   */
  audit(timeToWait: number): Promise<TimeAudit> {
    if (this.auditing) {
      throw new AuditError(
        "Cannot do two audits at the same time with the same instance! Wait until the first is finished or create another instance"
      );
    }
    this.auditing = true;
    this.recordCurrentStats();
    return new Promise(resolve =>
      setTimeout(() => {
        const stats = this.generateStats();
        this.auditing = false;
        resolve(new TimeAudit(stats));
      }, timeToWait)
    );
  }

  /**
   * Performs an audit on a given function
   * @param {function():void} func Runs the function and then gets the stats for the function
   * @returns {TimeAudit} Result of the audit
   * @throws {AuditError} If there is an audit already going on
   */
  auditFunc(func: () => void): TimeAudit {
    if (this.auditing) {
      throw new AuditError(
        "Cannot do two audits at the same time with the same instance! Wait until the first is finished or create another instance"
      );
    }
    this.auditing = true;
    this.recordCurrentStats();
    func();
    const stats = this.generateStats();
    this.auditing = false;
    return new TimeAudit(stats);
  }
}

class TimeAudit {
  private readonly stats: Record<string, Record<string, Analytics>>;

  constructor(stats: Record<string, Record<string, Analytics>>) {
    this.stats = stats;
  }

  private safeAccessStats(target: string, methodName: string): Analytics {
    return (
      (this.stats[target] ??
        raise<Record<string, Analytics>>(
          new IndexError("Target does not exist")
        ))[methodName] ??
      raise<Analytics>(new IndexError("Method name does not exist on target"))
    );
  }

  /**
   * Get a specific call count for a given target/methodName pair
   * @param {string} target
   * @param {string} methodName
   * @returns {number}
   */
  calls(target: string, methodName: string): number {
    return this.safeAccessStats(target, methodName).calls;
  }

  /**
   * Get a specific totalExecutionTime for a given target/methodName pair
   * @param {string} target
   * @param {string} methodName
   * @returns {number}
   */
  totalExecutionTime(target: string, methodName: string): number {
    return this.safeAccessStats(target, methodName).totalExecutionTime;
  }

  /**
   * Get a specific minDebugLevel for a given target/methodName pair
   * @param {string} target
   * @param {string} methodName
   * @returns {number}
   */
  minDebugLevel(target: string, methodName: string): number {
    return this.safeAccessStats(target, methodName).minDebugLevel;
  }

  /**
   * Generator which iterates over all the targets inside the stats
   * @yields {string} Current target
   */
  *targets(): Generator<string> {
    for (const target of Object.keys(this.stats)) {
      yield target;
    }
  }

  /**
   * Generator which iterates over the target's methodNames
   * @param {string} target
   * @yields {string} Current methodName
   */
  *methodNames(target: string): Generator<string> {
    for (const methodName of Object.keys(
      this.stats[target] ??
        raise<Record<string, Analytics>>(
          new IndexError("Target does not exist")
        )
    )) {
      yield methodName;
    }
  }

  /**
   * Iterates over the audited stats
   * @param {function({calls: number, totalExecutionTime: number, minDebugLevel: number}, string, string):void} callbackFn
   */
  forEach(
    callbackFn: (
      analytics: Analytics,
      target: string,
      methodName: string
    ) => void
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
   * @returns {string}
   */
  toString(): string {
    let auditString = "";
    for (const target of this.targets()) {
      let targetAudit = `===== ${target} =====\n`;
      if (auditString !== "") {
        targetAudit = "\n\n" + targetAudit;
      }
      let hasValues = false;
      for (const methodName of this.methodNames(target)) {
        const currStats = this.safeAccessStats(target, methodName);
        if (currStats.calls === 0) continue;

        hasValues = true;
        targetAudit += `  - ${methodName} Calls: ${
          currStats.calls
        } Total Execution Time: ${
          currStats.totalExecutionTime
        }ms Average Execution Time ${
          currStats.totalExecutionTime / currStats.calls
        }ms\n`;
      }
      if (hasValues) {
        auditString += targetAudit;
      }
    }
    return auditString;
  }
}
