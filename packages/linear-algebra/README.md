# Linear Algebra — Vector utilities

Lightweight, TypeScript-first vector utilities used across the repo. The package provides a robust `Vector` class with common linear-algebra operations, helpers, and strict runtime guards for safe usage.

## Markdown style (applies to this README)

- **Headers:** Use clear, Title Case headings and only add hierarchy where it helps the flow.
- **Bullets:** Start with `- **Keyword**:` followed by a short description. If mentioning code/identifiers, wrap them in inline code (`` `...` ``).
- **Examples:** Use fenced code blocks with the language marker (`typescript` or `html`).
- **Links & files:** Refer to files or code paths using inline code where needed.
- **Keep it DRY:** Remove duplicate examples and consolidate API descriptions.

## Overview

- **Purpose:** Provide a small, well-tested `Vector` abstraction with arithmetic, geometric, and utility operations for N-dimensional vectors.
- **Key features:** Creation helpers, element-wise arithmetic, magnitude/normalisation, dot/cross products, rotation (2D), conversion to/from strings, and useful static presets (`RIGHT`, `LEFT`, `UP`, `DOWN`).

## Quick example

```typescript
import { Vector } from "./src/Vector/index.ts";

const v = Vector.create(1, 2); // Vector<2>
v.add(3).multiply(0.5); // in-place arithmetic
const copy = v.copy(); // duplicate
const norm = v.getNorm(); // returns a normalized vector
console.log(v.toString(2)); // Vector<2>[...]
```

## API Summary

- **Creation & presets**
  - `Vector.create(...components)` — create a vector of any size.
  - `Vector.fill(size, value)`, `Vector.zero(size)`, `Vector.one(size)`, `Vector.randomNormalised(size)` — convenience factories.
  - `Vector.RIGHT|LEFT|UP|DOWN` — common 2D unit vectors.

- **Arithmetic (mutating)**
  - `add(...)`, `sub(...)`, `multiply(...)`, `divide(...)`, `pow(...)`, `mod(...)`, `positiveMod(...)` — support numbers or another `Vector` for component-wise ops.

- **Geometry & metrics**
  - `getMagnitude()`, `getSquaredMagnitude()`, `getNorm()`, `normalise()`, `dot(arg)`, `crossProduct(other)` (3D), `distTo(arg)`, `sqrDistTo(arg)`.

- **Access & utilities**
  - `x(), y(), z(), w(), valueOf(i)`, `size()`, `toArray()`, `toString(digits?)`.
  - `map`, `reduce`, `forEach`, `every`, `some`, `includes` for functional-style access.
  - `concat(other)`, `with(index, value)` (returns new vector with value replaced).

## Type safety

- The class is TypeScript-first. `Vector.create` infers the vector size in the type system (e.g., `Vector<2>`), and many instance helpers narrow sizes where applicable (e.g., `getAngle`, `rotate` require 2D vectors; `crossProduct` requires 3D).

Example:

```typescript
const p = Vector.create(3, 4); // Vector<2>
type P = typeof p; // preserves dimensional info in TypeScript
```

## Error handling & guards

- The implementation uses runtime guards (`deep-guards`) and throws descriptive errors for incompatible operations (mismatched sizes, out-of-bounds access, or operations requiring a specific dimensionality).

## Files of interest

- `src/Vector/index.ts` — primary implementation of `Vector` and exported helpers.
- `src/Vector/helpers.ts` — internal helpers and size checks.
- `src/Vector/error.ts` — factory helpers for thrown errors.
- `src/Vector/types.ts` — TypeScript types used by the vector implementation.

## Tests

- Unit tests live in `src/Vector/index.test.ts` and exercise arithmetic, guards, and edge cases. Run the package tests with the workspace test script (see the repo root `package.json`).

## License

- See repository `LICENSE`.
