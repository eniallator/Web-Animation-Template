import { describe, expect, it } from "vitest";

import { AuditError } from "./error";
import { TimeAudit } from "./timeAudit";
import { TimeProfile } from "./timeProfile";

// Dummy class for method registration and auditing
class Dummy {
  calls = 0;

  foo(x: number) {
    this.calls++;
    return x + 1;
  }

  bar() {
    this.calls++;
    return 42;
  }
}

describe("TimeProfile", () => {
  // --- registerMethods ---
  it("registerMethods registers methods for analysis", () => {
    const obj = new Dummy();
    expect(() => {
      TimeProfile.registerMethods(obj, { methodNames: ["foo", "bar"] });
    }).not.toThrow();
    // No direct observable effect, but should not throw
  });

  // --- startAudit / endAudit ---
  it("startAudit and endAudit record stats between calls", () => {
    const obj = new Dummy();
    TimeProfile.registerMethods(obj, { methodNames: ["foo"] });

    const profile = new TimeProfile(1);
    profile.startAudit();
    obj.foo(5);
    const audit = profile.endAudit();
    const stats = audit.getStats(obj, "foo");
    expect(stats.calls).toBe(1);
  });

  it("startAudit throws if already auditing", () => {
    const profile = new TimeProfile();
    profile.startAudit();
    expect(() => {
      profile.startAudit();
    }).toThrow(AuditError);
  });

  it("endAudit throws if audit was not started", () => {
    const profile = new TimeProfile();
    expect(() => profile.endAudit()).toThrow(AuditError);
  });

  // --- auditSync ---
  it("auditSync audits a synchronous function", () => {
    const obj = new Dummy();
    TimeProfile.registerMethods(obj, { methodNames: ["foo"] });
    const profile = new TimeProfile();
    const audit = profile.auditSync(() => {
      obj.foo(1);
      obj.foo(2);
    });
    expect(audit).toBeInstanceOf(TimeAudit);
    const stats = audit.getStats(obj, "foo");
    expect(stats.calls).toBe(2);
  });

  it("auditSync throws if already auditing", () => {
    const profile = new TimeProfile();
    profile.startAudit();
    expect(() =>
      profile.auditSync(() => {
        // Do things
      })
    ).toThrow(AuditError);
  });

  // --- auditAsync ---
  it("auditAsync audits an async function", async () => {
    const obj = new Dummy();
    TimeProfile.registerMethods(obj, { methodNames: ["bar"] });
    const profile = new TimeProfile();
    const audit = await profile.auditAsync(async () => {
      obj.bar();
      await new Promise(res => setTimeout(res, 10));
      obj.bar();
    });
    expect(audit).toBeInstanceOf(TimeAudit);
    const stats = audit.getStats(obj, "bar");
    expect(stats.calls).toBe(2);
  });

  it("auditAsync throws if already auditing", async () => {
    const profile = new TimeProfile();
    profile.startAudit();
    await expect(
      profile.auditAsync(async () => {
        // Do things
      })
    ).rejects.toThrow(AuditError);
  });
});
