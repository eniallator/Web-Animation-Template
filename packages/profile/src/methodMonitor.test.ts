import { describe, expect, it } from "vitest";

import { AuditError } from "./error";
import { Audit } from "./audit";
import { MethodMonitor } from "./methodMonitor";

const createDummy = () => ({
  calls: 0,
  foo(x: number) {
    this.calls++;
    return x + 1;
  },
  bar() {
    this.calls++;
    return 42;
  },
});

describe("MethodMonitor", () => {
  // --- patchObject ---
  it("patchObject registers methods for analysis", () => {
    const obj = createDummy();
    expect(() => {
      MethodMonitor.patchObject(obj);
    }).not.toThrow();
    // No direct observable effect, but should not throw
  });

  it("registerMethod wraps a standalone function and records stats", () => {
    const addOne = (x: number) => x + 1;
    const wrapped = MethodMonitor.registerMethod(addOne, 2);

    expect(wrapped).not.toBe(addOne);
    expect(wrapped(4)).toBe(5);

    const monitor = new MethodMonitor(3);
    const audit = monitor.auditSync(() => {
      wrapped(4);
    });

    const stats = audit.getStats(null, "addOne");
    expect(stats.calls).toBe(1);
  });

  it("registerMethod returns the original function when re-registering the same name", () => {
    const addOne = (x: number) => x + 1;
    const first = MethodMonitor.registerMethod(addOne, 1);
    const second = MethodMonitor.registerMethod(addOne, 10);

    expect(second).toBe(addOne);
    expect(first(2)).toBe(3);

    const monitor = new MethodMonitor(5);
    const audit = monitor.auditSync(() => {
      first(2);
    });

    expect(() => audit.getStats(null, "addOne")).toThrow();
  });

  // --- startAudit / endAudit ---
  it("startAudit and endAudit record stats between calls", () => {
    const obj = createDummy();
    MethodMonitor.patchObject(obj, { methodNames: ["foo"] });

    const monitor = new MethodMonitor(1);
    monitor.startAudit();
    obj.foo(5);
    const audit = monitor.endAudit();
    const stats = audit.getStats(obj, "foo");
    expect(stats.calls).toBe(1);
  });

  it("startAudit throws if already auditing", () => {
    const monitor = new MethodMonitor();
    monitor.startAudit();
    expect(() => {
      monitor.startAudit();
    }).toThrow(AuditError);
  });

  it("endAudit throws if audit was not started", () => {
    const monitor = new MethodMonitor();
    expect(() => monitor.endAudit()).toThrow(AuditError);
  });

  // --- auditSync ---
  it("auditSync audits a synchronous function", () => {
    const obj = createDummy();
    MethodMonitor.patchObject(obj, { methodNames: ["foo"] });
    const monitor = new MethodMonitor();
    const audit = monitor.auditSync(() => {
      obj.foo(1);
      obj.foo(2);
    });
    expect(audit).toBeInstanceOf(Audit);
    const stats = audit.getStats(obj, "foo");
    expect(stats.calls).toBe(2);
  });

  it("auditSync throws if already auditing", () => {
    const monitor = new MethodMonitor();
    monitor.startAudit();
    expect(() =>
      monitor.auditSync(() => {
        // Do things
      })
    ).toThrow(AuditError);
  });

  // --- auditAsync ---
  it("auditAsync audits an async function", async () => {
    const obj = createDummy();
    MethodMonitor.patchObject(obj, { methodNames: ["bar"] });
    const monitor = new MethodMonitor();
    const audit = await monitor.auditAsync(async () => {
      obj.bar();
      await new Promise(res => setTimeout(res, 10));
      obj.bar();
    });
    expect(audit).toBeInstanceOf(Audit);
    const stats = audit.getStats(obj, "bar");
    expect(stats.calls).toBe(2);
  });

  it("auditAsync throws if already auditing", async () => {
    const monitor = new MethodMonitor();
    monitor.startAudit();
    await expect(
      monitor.auditAsync(async () => {
        // Do things
      })
    ).rejects.toThrow(AuditError);
  });
});
