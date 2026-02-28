# Linear Algebra - Vector Utilities

Lightweight, TypeScript-first vector utilities oriented for web art. The package provides a robust `Vector` class with common vector operations, helpers, and strict runtime guards for safe usage.

## Overview

- **Purpose:** Provide a small, well-tested `Vector` abstraction with arithmetic, geometric, and utility operations for N-dimensional vectors.
- **Key features:** Creation helpers, element-wise arithmetic, magnitude/normalization, dot/cross products, rotation (2D), conversion to/from strings, and useful static presets (`RIGHT`, `LEFT`, `UP`, `DOWN`).

## Quick example

```typescript
import { Vector } from "./src/Vector/index.ts";

const v = Vector.create(1, 2); // Vector<2>
v.add(3).multiply(0.5); // in-place arithmetic
const copy = v.copy(); // duplicate
const norm = v.getNorm(); // returns a normalized vector
console.log(v.toString(2)); // Vector<2>[...]
```

## API

- **Creation & presets**
  - `Vector.create(...components)` — create a vector of any size.
  - `Vector.fill(size, value)`, `Vector.zero(size)`, `Vector.one(size)`, `Vector.randomNormalised(size)` — convenience methods.
  - `Vector.(RIGHT|LEFT|UP|DOWN)` — common 2D unit vectors.
  - `Vector.parseString(str)` — parse a `Vector<N>[...]` formatted string.

- **Arithmetic & component-wise ops (mutating)**
  - `add(...)`, `sub(...)`, `multiply(...)`, `divide(...)`, `pow(...)`, `mod(...)`, `positiveMod(...)` — accept a number or another `Vector` for component-wise operations.
  - `min(arg)`, `max(arg)` — component-wise min/max with a number or `Vector`.

- **Interpolation & sums**
  - `lerp(t, arg)` — linear interpolation towards a number or `Vector`.
  - `sum()` — sum of all components.

- **Rounding & sign helpers (mutating)**
  - `abs()`, `floor()`, `ceil()`, `round(digits?)` — per-component numeric helpers.
  - `getSign()` — returns a new vector of component signs.

- **Component min/max**
  - `getMin()`, `getMax()` — scalar min/max across components.

- **Geometry & metrics**
  - `getSquaredMagnitude()`, `getMagnitude()` — squared and Euclidean magnitude.
  - `getNorm()`, `normalise()` — return a normalised vector or normalise in-place.
  - `setMagnitude(magnitude)` — scale vector to a specific magnitude.
  - `dot(arg)` — dot product with a number or `Vector`.
  - `sqrDistTo(arg)`, `distTo(arg)` — squared distance and Euclidean distance to another vector/number.

- **2D-specific operations**
  - `getAngle()` — returns angle in radians for 2D vectors.
  - `setAngle(angle)` — set vector angle (keeps magnitude).
  - `rotate(pivot, angle)` — rotate this 2D vector about `pivot` by `angle`.

- **3D-specific operations**
  - `crossProduct(other)` — cross product for 3D vectors.

- **Copying & mutation helpers**
  - `copy()` — duplicate this vector.
  - `setHead(...components | [vector])` — overwrite all components from an array or another `Vector` (size must match).
  - `with(index, value)` — return a new vector with the value at `index` replaced.
  - `concat(other)` — concatenate components with another `Vector`.

- **Accessors & indexing**
  - `size()` — number of components.
  - `x(), y(), z(), w()` — positional accessors (throw if the vector is too small).
  - `valueOf(i)` — indexed access with bounds guard.
  - `toArray()` — return components as an array.
  - `toString(digits?)` — formatted `Vector<N>[...]` string.

- **Functional & iteration**
  - `forEach(fn)`, `map(fn)`, `reduce(fn, initial?)` — array-style helpers; `map` returns a new `Vector`.
  - `every(fn)`, `some(fn)`, `includes(value)` — predicates and membership.
  - `Symbol.iterator`, `Symbol.isConcatSpreadable`, and `Symbol.toStringTag` — native iteration and concat behaviour.

- **Guards, comparisons & bounds**
  - `isSize(size)` — runtime size guard.
  - `equals(other | components...)` — deep equality by size and component values.
  - `inBounds(dimensions, positions = 0)` — inclusive start / exclusive end bounds check.
