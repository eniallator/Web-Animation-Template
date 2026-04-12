import { AuditError } from "./error.ts";
import { MethodWatcher } from "./methodWatcher.ts";
import { Audit } from "./audit.ts";

import type { RegisterParams } from "./methodWatcher.ts";
import type { AnyFunction, FunctionKeys, Stats, TargetMap } from "./types.ts";

export class MethodMonitor {
  private static readonly methodWatcher: MethodWatcher = new MethodWatcher();

  private readonly debugLevel: number;
  private snapshot: TargetMap<Stats> | null = null;

  /**
   * Patch an object for analyzing execution time
   *  If called multiple times with the same property/methodNames, the lower of the two debug levels is taken.
   * @param {NonNullable<unknown>} target The class/object to analyze
   * @param {RegisterParams} params All registering parameters
   */
  static patchObject<T extends NonNullable<unknown>>(
    target: T,
    params: RegisterParams<FunctionKeys<T>> = {}
  ): void {
    this.methodWatcher.patchObject(target, params);
  }

  /**
   * Registers a function for analyzing the execution time
   *  If called multiple times with the same methodName, the lower of the two debug levels is applied.
   * @param {AnyFunction} method The method to analyze
   * @param {number} minDebugLevel A debugging level filter. Included if the monitored debug level is greater than this. Defaults to 0
   * @returns {AnyFunction} The patched method
   */
  static registerMethod<F extends AnyFunction>(
    method: F,
    minDebugLevel: number = 0
  ): F {
    return this.methodWatcher.registerMethod(
      method,
      null,
      "Orphaned Methods",
      method.name,
      minDebugLevel
    );
  }

  /**
   * MethodMonitor class constructor
   * @param {number} debugLevel Debug level to analyze at. Defaults to Infinity
   */
  constructor(debugLevel: number = Infinity) {
    this.debugLevel = debugLevel;
  }

  /**
   * Starts auditing, later to be retrieved with endAudit
   */
  startAudit(): void {
    if (this.snapshot != null) {
      throw new AuditError(
        "Cannot do two audits at the same time with the same instance! Wait until the first is finished or create another instance"
      );
    }

    this.snapshot = MethodMonitor.methodWatcher.getStats(this.debugLevel);
  }

  /**
   * Ends auditing, which was started with startAudit.
   * @returns {Audit} Stats generated between the startAudit and endAudit calls
   */
  endAudit(): Audit {
    if (this.snapshot == null) {
      throw new AuditError(
        "You must call startAudit before endAudit is called."
      );
    }

    const stats = MethodMonitor.methodWatcher.getStats(
      this.debugLevel,
      this.snapshot
    );
    this.snapshot = null;

    return new Audit(stats);
  }

  /**
   * Performs an audit on a given function
   * @param {function(): Promise<void>} func Runs the function and then gets the stats for the function
   * @returns {Audit} Result of the audit
   * @throws {AuditError} If there is an audit already going on
   */
  async auditAsync(func: () => Promise<void>): Promise<Audit> {
    this.startAudit();
    await func();
    return this.endAudit();
  }

  /**
   * Performs an audit on a given function
   * @param {function(): void} func Runs the function and then gets the stats for the function
   * @returns {Audit} Result of the audit
   * @throws {AuditError} If there is an audit already going on
   */
  auditSync(func: () => void): Audit {
    this.startAudit();
    func();
    return this.endAudit();
  }
}
