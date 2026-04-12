import { describe, expect, it } from "vitest";

import { AuditError } from "./error";
import { TimeAudit } from "./timeAudit";
import { TimeProfile } from "./timeProfile";

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

describe("TimeProfile", () => {
  // --- patchObject ---
  it("patchObject registers methods for analysis", () => {
    const obj = createDummy();
    expect(() => {
      TimeProfile.patchObject(obj);
    }).not.toThrow();
    // No direct observable effect, but should not throw
  });

  it("registerMethod wraps a standalone function and records stats", () => {
    const addOne = (x: number) => x + 1;
    const wrapped = TimeProfile.registerMethod(addOne, 2);

    expect(wrapped).not.toBe(addOne);
    expect(wrapped(4)).toBe(5);

    const profile = new TimeProfile(3);
    const audit = profile.auditSync(() => {
      wrapped(4);
    });

    const stats = audit.getStats(null, "addOne");
    expect(stats.calls).toBe(1);
  });

  it("registerMethod returns the original function when re-registering the same name", () => {
    const addOne = (x: number) => x + 1;
    const first = TimeProfile.registerMethod(addOne, 1);
    const second = TimeProfile.registerMethod(addOne, 10);

    expect(second).toBe(addOne);
    expect(first(2)).toBe(3);

    const profile = new TimeProfile(5);
    const audit = profile.auditSync(() => {
      first(2);
    });

    expect(() => audit.getStats(null, "addOne")).toThrow();
  });

  // --- startAudit / endAudit ---
  it("startAudit and endAudit record stats between calls", () => {
    const obj = createDummy();
    TimeProfile.patchObject(obj, { methodNames: ["foo"] });

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
    const obj = createDummy();
    TimeProfile.patchObject(obj, { methodNames: ["foo"] });
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
    const obj = createDummy();
    TimeProfile.patchObject(obj, { methodNames: ["bar"] });
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
