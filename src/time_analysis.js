class TimeAnalysis {
  static #methods = [];
  static #methodTimes = {};
  static #mode = document.currentScript.getAttribute("mode");

  #recordedStats;
  #debugLevel;
  #auditting;

  /**
   * Registers a class for analyzing execution time
   * @param {class} target The class/object to analyze
   * @param {string[]} [methodNames] The method names of the class/object to analyze. Defaults to all except the constructor.
   * @param {number} [minDebugLevel=1] The minimum debug level of these methods, where the lower it is, the higher priority it is to be included.
   *  If called multiple times with the same method, the lower of the two debug levels is taken.
   */
  static registerClassMethods(target, methodNames = null, minDebugLevel = 1) {
    if (!methodNames) {
      methodNames = Object.getOwnPropertyNames(target.prototype).filter(
        (name) => name !== "constructor"
      );
    }
    this.#methods.push({ target, methodNames, minDebugLevel });
  }

  /**
   * TimeAnalysis class constructor
   * @param {number} [debugLevel=Infinity] Debug level to analyze at
   */
  constructor(debugLevel) {
    if (TimeAnalysis.#mode !== "debug") {
      throw Error(
        `TimeAnalysis script tag's mode is set to "${
          TimeAnalysis.#mode
        }"! Please add a mode="debug" attribute to its script tag`
      );
    }
    if (debugLevel === undefined) {
      debugLevel = Infinity;
    }
    this.#debugLevel = debugLevel;
    TimeAnalysis.#methods
      .filter((item) => item.minDebugLevel < debugLevel)
      .forEach((item) =>
        item.methodNames.forEach((methodName) => {
          const patchedMethod = this.#timeMethod(
            item.target,
            methodName,
            item.minDebugLevel
          );
          if (patchedMethod) {
            item.target.prototype[methodName] = patchedMethod;
          }
        })
      );
  }

  #timeMethod(target, methodName, minDebugLevel) {
    const oldMethod = target.prototype[methodName];
    if (!TimeAnalysis.#methodTimes[target.name]) {
      TimeAnalysis.#methodTimes[target.name] = {};
    }
    if (!TimeAnalysis.#methodTimes[target.name][methodName]) {
      TimeAnalysis.#methodTimes[target.name][methodName] = {
        calls: 0,
        totalExecutionTime: 0,
        minDebugLevel: minDebugLevel,
      };
    } else if (
      minDebugLevel <
      TimeAnalysis.#methodTimes[target.name][methodName].minDebugLevel
    ) {
      TimeAnalysis.#methodTimes[target.name][methodName].minDebugLevel =
        minDebugLevel;
    }

    if (TimeAnalysis.#methodTimes[target.name][methodName].setup) return;
    TimeAnalysis.#methodTimes[target.name][methodName].setup = true;

    const currTimes = TimeAnalysis.#methodTimes[target.name][methodName];
    return function () {
      const startTime = performance.now();
      const ret = oldMethod.apply(this, arguments);
      currTimes.totalExecutionTime += performance.now() - startTime;
      currTimes.calls++;
      return ret;
    };
  }

  #recordCurrentStats() {
    this.#recordedStats = {};
    for (let target of Object.keys(TimeAnalysis.#methodTimes)) {
      this.#recordedStats[target] = {};
      for (let methodName of Object.keys(TimeAnalysis.#methodTimes[target])) {
        if (
          TimeAnalysis.#methodTimes[target][methodName].minDebugLevel <
          this.#debugLevel
        ) {
          this.#recordedStats[target][methodName] = {
            calls: TimeAnalysis.#methodTimes[target][methodName].calls,
            totalExecutionTime:
              TimeAnalysis.#methodTimes[target][methodName].totalExecutionTime,
          };
        }
      }
    }
  }

  get #stats() {
    const stats = {};
    for (let target of Object.keys(this.#recordedStats)) {
      stats[target] = {};
      for (let methodName of Object.keys(this.#recordedStats[target])) {
        stats[target][methodName] = {
          calls:
            TimeAnalysis.#methodTimes[target][methodName].calls -
            this.#recordedStats[target][methodName].calls,
          totalExecutionTime:
            TimeAnalysis.#methodTimes[target][methodName].totalExecutionTime -
            this.#recordedStats[target][methodName].totalExecutionTime,
          minDebugLevel:
            TimeAnalysis.#methodTimes[target][methodName].minDebugLevel,
        };
      }
    }
    return stats;
  }

  /**
   * Perform an audit for a given length of time
   * @param {number} timeToWait Measured in milliseconds
   * @returns {Promise<TimeAudit>} Resolved when the time is up
   */
  audit(timeToWait) {
    if (this.#auditting) {
      throw Error(
        "Cannot do two audits with the same instance! Wait until the first is finished or create another instance"
      );
    }
    this.#auditting = true;
    this.#recordCurrentStats();
    return new Promise((resolve, reject) =>
      setTimeout(() => {
        const stats = this.#stats;
        this.#auditting = false;
        return resolve(new this.#TimeAudit(stats));
      }, timeToWait)
    );
  }

  /**
   * Performs an audit on a given function
   * @param {function} func Runs the function and then gets the stats for the function
   * @returns {TimeAudit} Result of the audit
   */
  auditFunc(func) {
    if (this.#auditting) {
      throw Error(
        "Cannot do two audits with the same instance! Wait until the first is finished or create another instance"
      );
    }
    this.#auditting = true;
    this.#recordCurrentStats();
    func();
    const stats = this.#stats;
    this.#auditting = false;
    return new this.#TimeAudit(stats);
  }

  get #TimeAudit() {
    return class TimeAudit {
      #stats;
      constructor(stats) {
        this.#stats = stats;
      }

      /**
       * Get a specific call count for a given target/methodName pair
       * @param {String} target
       * @param {String} methodName
       * @returns {number}
       */
      calls(target, methodName) {
        return this.#stats[target][methodName].calls;
      }

      /**
       * Get a specific totalExecutionTime for a given target/methodName pair
       * @param {String} target
       * @param {String} methodName
       * @returns {number}
       */
      totalExecutionTime(target, methodName) {
        return this.#stats[target][methodName].totalExecutionTime;
      }

      /**
       * Get a specific minDebugLevel for a given target/methodName pair
       * @param {String} target
       * @param {String} methodName
       * @returns {number}
       */
      minDebugLevel(target, methodName) {
        return this.#stats[target][methodName].minDebugLevel;
      }

      /**
       * Generator which iterates over all the targets inside the stats
       */
      *targets() {
        for (let target of Object.keys(this.#stats)) {
          yield target;
        }
      }

      /**
       * Generator which iterates over the target's methodNames
       * @param {String} target
       */
      *methodNames(target) {
        for (let methodName of Object.keys(this.#stats[target])) {
          yield methodName;
        }
      }

      /**
       * Iterates over the auditted stats
       * @param {function({calls: number, totalExecutionTime: number, minDebugLevel: number}, String, String)} callbackFn
       */
      forEach(callbackFn) {
        for (let target of this.targets()) {
          for (let methodName of this.methodNames(target)) {
            callbackFn(
              Object.assign(this.#stats[target][methodName], {}),
              target,
              methodName
            );
          }
        }
      }

      /**
       * Prettifies the time audit so you can log it out
       * @returns {String}
       */
      toString() {
        let auditString = "";
        for (let target of this.targets()) {
          let targetAudit = `===== ${target} =====\n`;
          if (auditString !== "") {
            targetAudit = "\n\n" + targetAudit;
          }
          let hasValues = false;
          for (let methodName of this.methodNames(target)) {
            const currStats = this.#stats[target][methodName];
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
    };
  }
}
