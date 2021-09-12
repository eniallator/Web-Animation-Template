class TimeAudit {
  #times = {};
  constructor(times) {
    for (let target of Object.keys(times)) {
      this.#times[target] = {};
      for (let method of Object.keys(times[target])) {
        this.#times[target][method] = {};
        for (let attribute of Object.keys(times[target][method])) {
          this.#times[target][method][attribute] =
            times[target][method][attribute];
        }
      }
    }
  }

  calls(target, method) {
    return this.#times[target][method].calls;
  }

  totalExecutionTime(target, method) {
    return this.#times[target][method].accTime;
  }

  toString() {
    let auditString = "";
    for (let target of Object.keys(this.#times)) {
      if (auditString !== "") {
        auditString += "\n\n";
      }
      auditString += `===== ${target} =====\n`;
      for (let method of Object.keys(this.#times[target])) {
        const currTimes = this.#times[target][method];
        if (currTimes.calls === 0) continue;

        auditString += `  - ${method} Calls: ${
          currTimes.calls
        } Total Execution Time: ${currTimes.accTime} Average Execution Time ${
          currTimes.accTime / currTimes.calls
        }\n`;
      }
    }
    return auditString;
  }
}

class TimeAnalysis {
  static #methods = [];
  static #mode = document.currentScript.getAttribute("mode");
  #methodTimes = {};

  static registerClassMethods(target, methodNames = null, minDebugLevel = 1) {
    if (!methodNames) {
      methodNames = Object.getOwnPropertyNames(target.prototype).filter(
        (name) => name !== "constructor"
      );
    }
    this.#methods.push({ target, methodNames, minDebugLevel });
  }

  constructor(debugLevel = Infinity) {
    if (TimeAnalysis.#mode !== "debug") {
      throw Error(
        `TimeAnalysis script tag's mode is set to "${
          TimeAnalysis.#mode
        }"! Please add a mode="debug" attribute to its script tag`
      );
    }
    TimeAnalysis.#methods
      .filter((item) => item.minDebugLevel < debugLevel)
      .forEach((item) =>
        item.methodNames.forEach((methodName) => {
          item.target.prototype[methodName] = this.#timeMethod(
            item.target,
            methodName
          );
        })
      );
  }

  #timeMethod(target, methodName) {
    const oldMethod = target.prototype[methodName];
    if (!this.#methodTimes[target.name]) {
      this.#methodTimes[target.name] = {};
    }
    if (!this.#methodTimes[target.name][methodName]) {
      this.#methodTimes[target.name][methodName] = { calls: 0, accTime: 0 };
    }

    const currTimes = this.#methodTimes[target.name][methodName];
    return function () {
      const startTime = performance.now();
      const ret = oldMethod.apply(this, arguments);
      currTimes.accTime += performance.now() - startTime;
      currTimes.calls++;
      return ret;
    };
  }

  #resetTimes() {
    for (let key of Object.keys(this.#methodTimes)) {
      for (let item of Object.values(this.#methodTimes[key])) {
        item.calls = 0;
        item.accTime = 0;
      }
    }
  }

  audit(timeToWait) {
    this.#resetTimes();
    return new Promise((resolve, reject) =>
      setTimeout(() => resolve(new TimeAudit(this.#methodTimes)), timeToWait)
    );
  }
}
