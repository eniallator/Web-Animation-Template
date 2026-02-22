# Profile — runtime method profiling

Utilities for lightweight runtime profiling of methods and functions. The package provides `TimeProfile` for scoped audits, `MethodWatcher` for registering methods to track, and `TimeAudit` for inspecting results.

## Markdown style (applies to this README)

- **Headers:** Use clear, Title Case headings and only add hierarchy where it helps the flow.
- **Bullets:** Start with `- **Keyword**:` followed by a short description. If mentioning code/identifiers, wrap them in inline code (`` `...` ``).
- **Examples:** Use fenced code blocks with the language marker (`typescript` or `html`).
- **Links & files:** Refer to files or code paths using inline code where needed.
- **Keep it DRY:** Remove duplicate examples and consolidate API descriptions.

## Overview

- **Purpose:** Measure method execution counts and timings for debugging and performance analysis.
- **Key features:** Register classes/objects for instrumentation, take snapshots, compute diffs between snapshots, and present readable audits.

## Quick example

```typescript
import { TimeProfile } from "@web-art/profile";

// Register methods (optional global step)
TimeProfile.registerMethods(MyClass);

const profiler = new TimeProfile();
profiler.startAudit();
// run code under test
const audit = profiler.endAudit();
console.log(audit.toString(3));
```

## API Summary

- **`TimeProfile`**
  - `static registerMethods(target, params?)` — instrument methods on a class/object (includes prototype traversal by default).
  - `startAudit()` / `endAudit()` — take a snapshot and compute a `TimeAudit` of work done between calls.
  - `auditSync(fn)` / `auditAsync(fn)` — helpers to audit a synchronous or async function call.

- **`MethodWatcher`** (internal)
  - Registers method wrappers that collect `calls` and `executionTime` per target/method.
  - `getStats(debugLevel?, snapshot?)` — retrieve stats, optionally diffing against a prior snapshot.

- **`TimeAudit`**
  - `getStats(target, methodName)` — get `Stats` for specific target/method.
  - `targets()` / `properties(target)` — iterate over recorded targets and properties.
  - `forEach(callback)` — iterate all recorded stats with a callback.
  - `toString(digits?)` — pretty-print the audit results.

## Usage notes

- **Debug level:** `registerMethods` accepts a `minDebugLevel` per registration. `TimeProfile` instances accept a `debugLevel` to control which methods are included in an audit (lower `minDebugLevel` means higher priority).
- **Prototype traversal:** By default, `registerMethods` includes prototype methods; supply explicit `methodNames` or set `includePrototype: false` to restrict registration.
- **Thread safety:** The watcher mutates target methods to collect timings — restore originals if you need to remove instrumentation.

## Error handling

- `AuditError` and `IndexError` are thrown for invalid audit flows (e.g., calling `endAudit` before `startAudit` or requesting non-existent method stats).

## Files of interest

- `src/MethodWatcher.ts` — core instrumentation and stats collection.
- `src/timeProfile.ts` — `TimeProfile` class for scoped audits and convenience helpers.
- `src/timeAudit.ts` — reporting and iteration utilities for audit results.
- `src/types.ts` — types for `Stats`, `TargetMap`, and method names.

## Tests

- Unit tests live alongside the implementation (`src/*.test.ts`) and cover registration, timing accumulation, snapshot diffs, and edge cases. Run the workspace tests with the root test script.

## License

- See repository `LICENSE`.
