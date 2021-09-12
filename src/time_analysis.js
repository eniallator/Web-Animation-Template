class TimeAudit {
  #stats;
  constructor(stats) {
    this.#stats = stats;
  }

  calls(target, method) {
    return this.#stats[target][method].calls;
  }

  totalExecutionTime(target, method) {
    return this.#stats[target][method].accTime;
  }

  minDebugLevel(target, method) {
    return this.#stats[target][method].minDebugLevel;
  }

  toString() {
    let auditString = "";
    for (let target of Object.keys(this.#stats)) {
      if (auditString !== "") {
        auditString += "\n\n";
      }
      auditString += `===== ${target} =====\n`;
      for (let method of Object.keys(this.#stats[target])) {
        const currStats = this.#stats[target][method];
        if (currStats.calls === 0) continue;

        auditString += `  - ${method} Calls: ${
          currStats.calls
        } Total Execution Time: ${currStats.accTime}ms Average Execution Time ${
          currStats.accTime / currStats.calls
        }ms\n`;
      }
    }
    return auditString;
  }
}

class TimeAnalysis {
  static #methods = [];
  static #methodTimes = {};
  static #mode = document.currentScript.getAttribute("mode");
  static #defaultDebugLevel = Number(
    document.currentScript.getAttribute("default-debug-level") || NaN
  );

  #recordedStats;
  #debugLevel;

  static registerClassMethods(target, methodNames = null, minDebugLevel = 1) {
    if (!methodNames) {
      methodNames = Object.getOwnPropertyNames(target.prototype).filter(
        (name) => name !== "constructor"
      );
    }
    this.#methods.push({ target, methodNames, minDebugLevel });
  }

  constructor(debugLevel) {
    if (TimeAnalysis.#mode !== "debug") {
      throw Error(
        `TimeAnalysis script tag's mode is set to "${
          TimeAnalysis.#mode
        }"! Please add a mode="debug" attribute to its script tag`
      );
    }
    if (debugLevel === undefined) {
      debugLevel = isNaN(TimeAnalysis.#defaultDebugLevel)
        ? Infinity
        : TimeAnalysis.#defaultDebugLevel;
    }
    this.#debugLevel = debugLevel;
    TimeAnalysis.#methods
      .filter((item) => item.minDebugLevel < debugLevel)
      .forEach((item) =>
        item.methodNames.forEach((methodName) => {
          item.target.prototype[methodName] = this.#timeMethod(
            item.target,
            methodName,
            item.minDebugLevel
          );
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
        accTime: 0,
        minDebugLevel: minDebugLevel,
      };
    } else if (
      minDebugLevel >
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
      currTimes.accTime += performance.now() - startTime;
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
            accTime: TimeAnalysis.#methodTimes[target][methodName].accTime,
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
          accTime:
            TimeAnalysis.#methodTimes[target][methodName].accTime -
            this.#recordedStats[target][methodName].accTime,
          minDebugLevel:
            TimeAnalysis.#methodTimes[target][methodName].minDebugLevel,
        };
      }
    }
    return stats;
  }

  audit(timeToWait) {
    this.#recordCurrentStats();
    return new Promise((resolve, reject) =>
      setTimeout(() => resolve(new TimeAudit(this.#stats)), timeToWait)
    );
  }
}
