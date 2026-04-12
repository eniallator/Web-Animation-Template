# Profile — runtime method profiling

Utilities for lightweight runtime profiling of object methods and standalone functions. The package provides `MethodMonitor` to instrument targets, `Audit` to inspect results, and `AuditError` for invalid audit flows.

## Overview

- **Purpose:** Collect call counts and execution times for functions/methods during runtime.
- **Key features:** Patch object methods, wrap standalone functions, take audit snapshots, compute diffs against previous snapshots, and pretty-print results.

## Quick example

```typescript
import { MethodMonitor } from "@web-art/profile";

// Register methods (optional global step)
MethodMonitor.patchObject(MyClass.prototype);

const monitor = new MethodMonitor();
monitor.startAudit();
// run code under test
const audit = monitor.endAudit();
console.log(audit.toString(3));
```

## API Summary

- **`MethodMonitor`**
  - `static patchObject(target, params?)` — instrument object methods for timing.
    - `params` may include `methodNames`, `includeSymbols`, `targetName`, and `minDebugLevel`.
  - `static registerMethod(method, minDebugLevel?)` — wrap a standalone function and include it in future audits.
  - `new MethodMonitor(debugLevel?)` — create a scoped monitor with an optional debug level.
  - `startAudit()` / `endAudit()` — take a snapshot and compute an `Audit` for the work done in between.
  - `auditSync(fn)` / `auditAsync(fn)` — convenience helpers for auditing synchronous or async functions.

- **`Audit`**
  - `getStats(target, methodName)` — retrieve the recorded `Stats` for a specific target or orphaned function.
  - `targets()` — iterate all audited targets.
  - `properties(target)` — iterate method names for a given target.
  - `forEach(callback)` — iterate every recorded method stat.
  - `toString(digits?)` — pretty-print audit results.

- **`AuditError`**
  - Thrown when an audit flow is invalid, such as calling `endAudit()` before `startAudit()`.

## Usage notes

- **Standalone functions:** `registerMethod()` lets you profile a function without an object target. The function is tracked by its `name` and appears as an orphaned target.
- **Debug level:** `minDebugLevel` controls whether a registered method appears in audits. A lower value means higher priority.
- **Patching behavior:** `patchObject()` mutates the target methods in place, so use a copy if you need to preserve originals.
- **Snapshot diffs:** `endAudit()` automatically computes a diff against the snapshot taken by `startAudit()`.

## Error handling

- `AuditError` is thrown for invalid audit flow.
- `IndexError` is thrown when requesting stats for a missing target or method.

## Files of interest

- `src/methodMonitor.ts` — `MethodMonitor` class and public audit API.
- `src/methodWatcher.ts` — internal instrumentation and stats tracking.
- `src/audit.ts` — `Audit` result formatting and iteration utilities.
- `src/types.ts` — shared types for `Stats`, `Target`, and `TargetMap`.

## Tests

- Unit tests live alongside implementation in `src/*.test.ts` and cover patched objects, standalone function registration, audit lifecycle, and debug-level filtering.
- Run tests from the workspace root with the root test script.

## License

- See repository `LICENSE`.
