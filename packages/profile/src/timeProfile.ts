import { AuditError } from "./error.ts";
import { MethodWatcher } from "./MethodWatcher.ts";
import { TimeAudit } from "./timeAudit.ts";

import type { TargetMap, MethodName, Stats } from "./types.ts";

export class TimeProfile {
  private static readonly methodWatcher: MethodWatcher = new MethodWatcher();

  private readonly debugLevel: number;
  private snapshot: TargetMap<Stats> | null = null;

  /**
   * Registers a class for analyzing execution time
   *  If called multiple times with the same property/methodNames, the lower of the two debug levels is taken.
   * @param {unknown} target The class/object to analyze
   * @param {string[]} methodNames The methodNames of the class/object to analyze. Defaults to all except the constructor.
   * @param {number} [minDebugLevel] The minimum debug level of these methodNames, where the lower it is, the higher priority it is to be included. Defaults to 1
   * @param {boolean} [addPrototype] Recursively call the prototype of the target. Defaults to true if the methodNames aren't given
   */
  static registerMethods(
    target: NonNullable<unknown>,
    params: {
      targetName?: string;
      minDebugLevel?: number;
      includePrototype?: boolean;
    } & ({ includeSymbols?: boolean } | { methodNames: MethodName[] }) = {}
  ): void {
    this.methodWatcher.registerMethods(target, params);
  }

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
    if (this.snapshot != null) {
      throw new AuditError(
        "Cannot do two audits at the same time with the same instance! Wait until the first is finished or create another instance"
      );
    }

    this.snapshot = TimeProfile.methodWatcher.getStats(this.debugLevel);
  }

  /**
   * Ends auditing, which was started with startAudit.
   * @returns {TimeAudit} Stats generated between the startAudit and endAudit calls
   */
  endAudit(): TimeAudit {
    if (this.snapshot == null) {
      throw new AuditError(
        "You must call startAudit before endAudit is called."
      );
    }

    const stats = TimeProfile.methodWatcher.getStats(
      this.debugLevel,
      this.snapshot
    );
    this.snapshot = null;

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
