class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisError";
  }
}

class AuditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuditError";
  }
}

interface Timeable {
  target: any;
  methodNames: Array<string>;
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

export default class TimeAnalysis {
  private static methods: Array<Timeable> = [];
  private static methodTimes: Record<string, Record<string, TimeableStats>> =
    {};

  private recordedStats: Record<string, Record<string, Analytics>> | null =
    null;
  private debugLevel: number;
  private auditing: boolean = false;

  /**
   * Registers a class for analyzing execution time
   * @param {class} target The class/object to analyze
   * @param {Array<string>} [methodNames] The method names of the class/object to analyze. Defaults to all except the constructor.
   * @param {number} [minDebugLevel=1] The minimum debug level of these methods, where the lower it is, the higher priority it is to be included.
   *  If called multiple times with the same method, the lower of the two debug levels is taken.
   */
  static registerMethods(
    target: any,
    methodNames: Array<string> | undefined = undefined,
    minDebugLevel: number = 1
  ): void {
    if (methodNames == null) {
      methodNames = Object.getOwnPropertyNames(
        target.prototype || target
      ).filter(
        (name) => name !== "constructor" && typeof target[name] !== "function"
      );
    }
    this.methods.push({ target, methodNames, minDebugLevel });
  }

  /**
   * TimeAnalysis class constructor
   * @param {number} [debugLevel=Infinity] Debug level to analyze at
   */
  constructor(debugLevel: number = Infinity) {
    this.debugLevel = debugLevel;
    TimeAnalysis.methods
      .filter((item) => item.minDebugLevel < debugLevel)
      .forEach((item) =>
        item.methodNames.forEach((methodName) => {
          const patchedMethod = this.timeMethod(
            item.target.prototype
              ? item.target.prototype[methodName]
              : item.target[methodName],
            methodName,
            item.minDebugLevel,
            item.target?.name
          );
          if (patchedMethod != null) {
            try {
              if (item.target.prototype) {
                item.target.prototype[methodName] = patchedMethod;
              } else {
                item.target[methodName] = patchedMethod;
              }
            } catch (e) {
              return;
            }
          }
        })
      );
  }

  private timeMethod<
    T,
    F extends (this: ThisType<T>, ...args: Array<any>) => any
  >(
    method: F,
    methodName: string,
    minDebugLevel: number,
    targetName: string = "Anonymous"
  ): F | null {
    if (TimeAnalysis.methodTimes[targetName] == null) {
      TimeAnalysis.methodTimes[targetName] = {};
    }
    if (TimeAnalysis.methodTimes[targetName][methodName] == null) {
      TimeAnalysis.methodTimes[targetName][methodName] = {
        calls: 0,
        totalExecutionTime: 0,
        minDebugLevel: minDebugLevel,
        setup: false,
      };
    } else if (
      minDebugLevel <
      TimeAnalysis.methodTimes[targetName][methodName].minDebugLevel
    ) {
      TimeAnalysis.methodTimes[targetName][methodName].minDebugLevel =
        minDebugLevel;
    }

    if (TimeAnalysis.methodTimes[targetName][methodName].setup) return null;
    TimeAnalysis.methodTimes[targetName][methodName].setup = true;

    const currTimes = TimeAnalysis.methodTimes[targetName][methodName];
    return function (this: ThisType<T>, ...args: Array<any>): any {
      const startTime = performance.now();
      const ret = method.apply(this, args);
      currTimes.totalExecutionTime += performance.now() - startTime;
      currTimes.calls++;
      return ret;
    } as F;
  }

  private recordCurrentStats() {
    this.recordedStats = {};
    for (const target of Object.keys(TimeAnalysis.methodTimes)) {
      this.recordedStats[target] = {};
      for (const methodName of Object.keys(TimeAnalysis.methodTimes[target])) {
        if (
          TimeAnalysis.methodTimes[target][methodName].minDebugLevel <
          this.debugLevel
        ) {
          this.recordedStats[target][methodName] = {
            calls: TimeAnalysis.methodTimes[target][methodName].calls,
            totalExecutionTime:
              TimeAnalysis.methodTimes[target][methodName].totalExecutionTime,
            minDebugLevel:
              TimeAnalysis.methodTimes[target][methodName].minDebugLevel,
          };
        }
      }
    }
  }

  generateStats(): Record<string, Record<string, Analytics>> {
    const stats: Record<string, Record<string, Analytics>> = {};
    if (this.recordedStats != null) {
      for (let target of Object.keys(this.recordedStats)) {
        stats[target] = {};
        for (let methodName of Object.keys(this.recordedStats[target])) {
          stats[target][methodName] = {
            ...this.recordedStats[target][methodName],
            calls:
              TimeAnalysis.methodTimes[target][methodName].calls -
              this.recordedStats[target][methodName].calls,
            totalExecutionTime:
              TimeAnalysis.methodTimes[target][methodName].totalExecutionTime -
              this.recordedStats[target][methodName].totalExecutionTime,
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
    return new Promise((resolve) =>
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
  private stats: Record<string, Record<string, Analytics>>;

  constructor(stats: Record<string, Record<string, Analytics>>) {
    this.stats = stats;
  }

  /**
   * Get a specific call count for a given target/methodName pair
   * @param {string} target
   * @param {string} methodName
   * @returns {number}
   */
  calls(target: string, methodName: string): number {
    return this.stats[target][methodName].calls;
  }

  /**
   * Get a specific totalExecutionTime for a given target/methodName pair
   * @param {string} target
   * @param {string} methodName
   * @returns {number}
   */
  totalExecutionTime(target: string, methodName: string): number {
    return this.stats[target][methodName].totalExecutionTime;
  }

  /**
   * Get a specific minDebugLevel for a given target/methodName pair
   * @param {string} target
   * @param {string} methodName
   * @returns {number}
   */
  minDebugLevel(target: string, methodName: string): number {
    return this.stats[target][methodName].minDebugLevel;
  }

  /**
   * Generator which iterates over all the targets inside the stats
   * @yields {string} Current target
   */
  *targets(): Generator<string> {
    for (let target of Object.keys(this.stats)) {
      yield target;
    }
  }

  /**
   * Generator which iterates over the target's methodNames
   * @param {string} target
   * @yields {string} Current methodName
   */
  *methodNames(target: string): Generator<string> {
    for (let methodName of Object.keys(this.stats[target])) {
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
    for (let target of this.targets()) {
      for (let methodName of this.methodNames(target)) {
        callbackFn({ ...this.stats[target][methodName] }, target, methodName);
      }
    }
  }

  /**
   * Prettifies the time audit so you can log it out
   * @returns {string}
   */
  toString(): string {
    let auditString = "";
    for (let target of this.targets()) {
      let targetAudit = `===== ${target} =====\n`;
      if (auditString !== "") {
        targetAudit = "\n\n" + targetAudit;
      }
      let hasValues = false;
      for (let methodName of this.methodNames(target)) {
        const currStats = this.stats[target][methodName];
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
