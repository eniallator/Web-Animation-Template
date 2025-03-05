import { raise } from "@web-art/core";
import { isArrayOf, isNumber } from "deep-guards";

import {
  IncompatibleOperation,
  IncompatibleVector,
  OutOfBounds,
} from "./error.ts";
import {
  isAnyVector,
  isAnyComponents,
  isSameSize,
  isSize,
  toAnyComponents,
  vectorArgAccessor,
} from "./helpers.ts";
import {
  AnyComponents,
  Components,
  MinSize,
  VectorArg,
  VectorCallback,
  VectorReduceCallback,
} from "./types.ts";

export class Vector<const N extends number | undefined = undefined> {
  type = "Vector" as const;
  private cmps: Components<N>;

  private constructor(cmps: Components<N>) {
    this.cmps = cmps;
  }

  /**
   * Robust Vector class which has many available operations
   * @param {readonly number[]} components The components of the vector, can be any size.
   */
  static create<A extends AnyComponents>(...cmps: A): Vector<A["length"]> {
    return isAnyComponents(cmps)
      ? new Vector(cmps as Components<A["length"]>)
      : raise(new Error(`Unknown vector components ${cmps}`));
  }

  private applyOperation(
    operation: (a: number, b: number) => number,
    ...args: VectorArg<N>[]
  ): this {
    for (const arg of args) {
      if (isAnyVector(arg) && !isSameSize(this, arg)) {
        throw new IncompatibleVector(
          `Received an incompatible vector of size ${arg.cmps.length}`
        );
      }
      const cmps = toAnyComponents(this.cmps);
      const accessor = vectorArgAccessor(arg, cmps.length as N);
      this.cmps = cmps.map((n, i) =>
        operation(n, accessor(i))
      ) as Components<N>;
    }
    return this;
  }

  /**
   * Raises the current components to given power(s)
   * @param  {...VectorArg<N>} args If given a number, all components are raised to this. If given a Vector, the power operation is component-wise
   * @returns {this} this
   */
  pow(...args: VectorArg<N>[]): this {
    return this.applyOperation((a, b) => a ** b, ...args);
  }

  /**
   * Adds the current components with given operand(s)
   * @param  {...VectorArg<N>} args If given a number, all components are added with this. If given a Vector, the add operation is component-wise
   * @returns {this} this
   */
  add(...args: VectorArg<N>[]): this {
    return this.applyOperation((a, b) => a + b, ...args);
  }

  /**
   * Subtracts given operand(s) from the current components
   * @param  {...VectorArg<N>} args If given a number, all components have the number taken away from them. If given a Vector, the subtract operation is component-wise
   * @returns {this} this
   */
  sub(...args: VectorArg<N>[]): this {
    return this.applyOperation((a, b) => a - b, ...args);
  }

  /**
   * Multiplies the current components with given operand(s)
   * @param  {...VectorArg<N>} args If given a number, all components are multiplied by this. If given a Vector, the multiply operation is component-wise
   * @returns {this} this
   */
  multiply(...args: VectorArg<N>[]): this {
    return this.applyOperation((a, b) => a * b, ...args);
  }

  /**
   * Divides the current components by the given operand(s)
   * @param  {...VectorArg<N>} args If given a number, all components are divided by this. If given a Vector, the divide operation is component-wise
   * @returns {this} this
   */
  divide(...args: VectorArg<N>[]): this {
    return this.applyOperation((a, b) => a / b, ...args);
  }

  /**
   * Computes the signed modulus of the current components and the given operand(s)
   * @param  {...VectorArg<N>} args If given a number it's used for all components. If given a Vector, the signed modulo operation is component-wise
   * @returns {this} this
   */
  mod(...args: VectorArg<N>[]): this {
    return this.applyOperation((a, b) => a % b, ...args);
  }

  /**
   * Computes the positive modulus of the current components and the given operand(s)
   * @param  {...VectorArg<N>} args If given a number it's used for all components. If given a Vector, the positive modulo operation is component-wise
   * @returns {this} this
   */
  positiveMod(...args: VectorArg<N>[]): this {
    return this.applyOperation((a, b) => ((a % b) + b) % b, ...args);
  }

  /**
   * Linear interpolation between this vector and a given other vector
   * @param {number} t Between 0 and 1, where 0 is this current vector and 1 is the supplied other vector
   * @param {VectorArg<N>} arg Vector/number to interpolate to
   * @returns {Vector<N>} Interpolated vector
   */
  lerp(t: number, arg: VectorArg<N>): this {
    return this.applyOperation((a, b) => a - (a - b) * t, arg);
  }

  /**
   * Sets this vector's components to the the min between the incoming arg and this vector's components
   * @param {VectorArg<N>} arg If given a number, it's used for all min operations. If given a Vector, the min operation is component-wise
   * @returns {this} this
   */
  min(arg: VectorArg<N>): this {
    return this.applyOperation(Math.min, arg);
  }

  /**
   * Sets this vector's components to the the max between the incoming arg and this vector's components
   * @param {VectorArg<N>} arg If given a number, it's used for all max operations. If given a Vector, the max operation is component-wise
   * @returns {this} this
   */
  max(arg: VectorArg<N>): this {
    return this.applyOperation(Math.max, arg);
  }

  /**
   * Compute sum of all components
   * @returns {number}
   */
  sum(): number {
    return toAnyComponents(this.cmps).reduce((acc, cmp) => acc + cmp, 0);
  }

  /**
   * Sets each component of this vector to it's absolute value
   * @returns {this} this
   */
  abs(): this {
    this.cmps = toAnyComponents(this.cmps).map(Math.abs) as Components<N>;
    return this;
  }

  /**
   * Returns the min of the components, whichever component is smaller
   * @returns {number} the value of the smaller component
   */
  getMin(): number {
    return Math.min(...toAnyComponents(this.cmps));
  }

  /**
   * Returns the max of the components, whichever component is bigger
   * @returns {number} the value of the bigger component
   */
  getMax(): number {
    return Math.max(...toAnyComponents(this.cmps));
  }

  /**
   * Get the sign of each component in this vector
   * @returns {Vector<N>} The signs of this vector where the component will be 1 if >= 0, otherwise -1
   */
  getSign(): Vector<N> {
    return new Vector(
      toAnyComponents(this.cmps).map(Math.sign) as Components<N>
    );
  }

  /**
   * Computes the dot product with a supplied vector
   * @param {Vector<N>} other Vector to dot product with
   * @returns {number} Dot product
   */
  dot(other: Vector<N>): number {
    const otherCmps = toAnyComponents(other.cmps);
    if (isSameSize(this, other)) {
      return toAnyComponents(this.cmps).reduce(
        (acc, cmp, i) => acc + cmp * (otherCmps[i] as number),
        0
      );
    } else {
      throw new IncompatibleVector(
        `Received an incompatible vector of size ${otherCmps.length}`
      );
    }
  }

  /**
   * Sets the "head" of the current vector to a given set of components or copies a given vector
   * @param {Vector<N> | ...Components<N>} xOrVec New components to use, or the vector to copy
   * @returns {this} this
   */
  setHead(...params: Components<N> | readonly [Vector<N>]): this {
    const newCmps = isArrayOf(isNumber)(params)
      ? params
      : ([...params[0].cmps] as Components<N>);
    const newSize = toAnyComponents(newCmps).length;
    if (newSize !== toAnyComponents(this.cmps).length) {
      throw new IncompatibleVector(
        `Received an incompatible vector of size ${newSize}`
      );
    }
    this.cmps = newCmps;
    return this;
  }

  /**
   * Computes the squared magnitude of this vector
   * @returns {number} Squared magnitude of this vector
   */
  getSquaredMagnitude(): number {
    return toAnyComponents(this.cmps).reduce((acc, cmp) => acc + cmp * cmp, 0);
  }

  /**
   * Computes the magnitude of this vector
   * @returns {number} Magnitude of this vector
   */
  getMagnitude(): number {
    return Math.sqrt(
      toAnyComponents(this.cmps).reduce((acc, cmp) => acc + cmp * cmp, 0)
    );
  }

  /**
   * Computes the squared magnitude of the difference between this vector and another vector
   * @param {Vector<N>} other vector to difference with
   * @returns {number} squared magnitude
   */
  sqrDistTo(other: Vector<N>): number {
    const otherCmps = toAnyComponents(other.cmps);
    if (isSameSize(this, other)) {
      return toAnyComponents(this.cmps).reduce(
        (acc, cmp, i) => acc + (cmp - (otherCmps[i] as number)) ** 2,
        0
      );
    } else {
      throw new IncompatibleVector(
        `Received an incompatible vector of size ${otherCmps.length}`
      );
    }
  }

  /**
   * Computes the magnitude of the difference between this vector and another vector
   * @param {Vector<N>} other vector to difference with
   * @returns {number} magnitude
   */
  distTo(other: Vector<N>): number {
    const otherCmps = toAnyComponents(other.cmps);
    if (isSameSize(this, other)) {
      return Math.sqrt(
        toAnyComponents(this.cmps).reduce(
          (acc, cmp, i) => acc + (cmp - (otherCmps[i] as number)) ** 2,
          0
        )
      );
    } else {
      throw new IncompatibleVector(
        `Received an incompatible vector of size ${otherCmps.length}`
      );
    }
  }

  /**
   * Sets the magnitude of this vector
   * @param {number} mag New magnitude to set to
   * @returns {this} this
   */
  setMagnitude(magnitude: number): this {
    const cmps = toAnyComponents(this.cmps);
    const prev = Math.sqrt(cmps.reduce((acc, cmp) => acc + cmp * cmp, 0));
    this.cmps = cmps.map(cmp => cmp * (magnitude / prev)) as Components<N>;
    return this;
  }

  /**
   * Returns a new normalised version of this vector
   * @returns {Vector<N>} Normalised vector
   */
  getNorm(): Vector<N> {
    const cmps = toAnyComponents(this.cmps);
    const magnitude = Math.sqrt(cmps.reduce((acc, cmp) => acc + cmp * cmp, 0));
    return new Vector(cmps.map(cmp => cmp / magnitude) as Components<N>);
  }

  /**
   * Normalises this vector
   * @returns {this} this
   */
  normalise(): this {
    const cmps = toAnyComponents(this.cmps);
    const magnitude = Math.sqrt(cmps.reduce((acc, cmp) => acc + cmp * cmp, 0));
    this.cmps = cmps.map(cmp => cmp / magnitude) as Components<N>;
    return this;
  }

  /**
   * Gets the angle of this vector
   * @type {Vector<2>}
   * @returns {number} Angle between 0 and 2 * PI
   */
  getAngle(this: Vector<2>): number {
    if (isSize(2)(this.cmps)) {
      const [x, y] = this.cmps;

      let out: number;
      if (x === 0 && y === 0) out = 0;
      else if (y === 0) out = x > 0 ? 0 : Math.PI;
      else if (x === 0) out = y > 0 ? Math.PI / 2 : (Math.PI * 3) / 2;
      else if (x > 0 && y > 0) out = Math.PI / 2 - Math.atan(x / y);
      else if (y > 0) out = Math.PI - Math.atan(y / -x);
      else if (x > 0) out = (Math.PI * 3) / 2 + Math.atan(x / -y);
      else out = (Math.PI * 3) / 2 - Math.atan(x / y);

      return out;
    } else {
      throw new IncompatibleOperation("Requires a 2D vector");
    }
  }

  /**
   * Sets the angle of this vector
   * @type {Vector<2>}
   * @param {number} angle Angle to set to
   * @returns {this} this
   */
  setAngle(this: Vector<2>, angle: number): Vector<2> {
    if (isSize(2)(this.cmps)) {
      const [x, y] = this.cmps;

      const magnitude = Math.sqrt(x ** 2 + y ** 2);
      this.cmps[0] = magnitude * Math.cos(angle);
      this.cmps[1] = magnitude * Math.sin(angle);

      return this;
    } else {
      throw new IncompatibleOperation("Requires a 2D vector");
    }
  }

  /**
   * Rotates this vector about a pivot
   * @type {Vector<2>}
   * @param {Vector<2>} pivot Pivot to rotate around
   * @param {number} angle Angle to rotate by
   * @returns {this} this
   */
  rotate(this: Vector<2>, pivot: Vector<2>, angle: number): Vector<2> {
    if (isSize(2)(this.cmps)) {
      if (isSameSize(this, pivot)) {
        const [x, y] = this.cmps;
        const [px, py] = pivot.cmps;
        const dx = x - px;
        const dy = y - py;
        const dMag = Math.sqrt(dx * dx + dy * dy);

        let currAngle: number;
        if (x === 0 && y === 0) currAngle = 0;
        else if (y === 0) currAngle = x > 0 ? 0 : Math.PI;
        else if (x === 0) currAngle = y > 0 ? Math.PI / 2 : (Math.PI * 3) / 2;
        else if (x > 0 && y > 0) currAngle = Math.PI / 2 - Math.atan(x / y);
        else if (y > 0) currAngle = Math.PI - Math.atan(y / -x);
        else if (x > 0) currAngle = (Math.PI * 3) / 2 + Math.atan(x / -y);
        else currAngle = (Math.PI * 3) / 2 - Math.atan(x / y);

        const oX = dMag * Math.cos(currAngle + angle);
        const oY = dMag * Math.sin(currAngle + angle);

        this.cmps[0] = oX + px;
        this.cmps[1] = oY + py;

        return this;
      } else {
        throw new IncompatibleVector(
          `Received an incompatible vector of size ${pivot.cmps.length}`
        );
      }
    } else {
      throw new IncompatibleOperation("Requires a 2D vector");
    }
  }

  /**
   * Cross product of this vector and another
   * @type {Vector<3>}
   * @param {Vector<3>} other
   * @returns {Vector<3>} The resulting cross product vector of this and the other vector
   */
  crossProduct(this: Vector<3>, other: Vector<3>): Vector<3> {
    if (isSize(3)(this.cmps)) {
      if (isSameSize(this, other)) {
        const [ax, ay, az] = this.cmps;
        const [bx, by, bz] = other.cmps;

        return new Vector([
          ay * bz - az * by,
          az * bx - ax * bz,
          ax * by - ay * bx,
        ]);
      } else {
        throw new IncompatibleVector(
          `Received an incompatible vector of size ${other.cmps.length}`
        );
      }
    } else {
      throw new IncompatibleOperation("Requires a 3D vector");
    }
  }

  /**
   * Copies this vector into a duplicate
   * @returns {Vector<N>} Duplicated version of this vector
   */
  copy(): Vector<N> {
    return new Vector([...this.cmps] as Components<N>);
  }

  /**
   * The size of this vector
   * @returns {number}
   */
  size(): number {
    return toAnyComponents(this.cmps).length;
  }

  /**
   * Get the value of the first component in this vector
   * @returns {number}
   */
  x(): number {
    return toAnyComponents(this.cmps)[0];
  }

  /**
   * Get the value of the second component in this vector
   * @returns {number}
   */
  y(this: Vector<MinSize<2, N>>): number {
    return (
      toAnyComponents(this.cmps)[1] ??
      raise(new IncompatibleOperation("Requires at least a 2D vector"))
    );
  }

  /**
   * Get the value of the third component in this vector
   * @returns {number}
   */
  z(this: Vector<MinSize<3, N>>): number {
    return (
      toAnyComponents(this.cmps)[2] ??
      raise(new IncompatibleOperation("Requires at least a 3D vector"))
    );
  }

  /**
   * Get the value of the fourth component in this vector
   * @returns {number}
   */
  w(this: Vector<MinSize<4, N>>): number {
    return (
      toAnyComponents(this.cmps)[3] ??
      raise(new IncompatibleOperation("Requires at least a 4D vector"))
    );
  }

  /**
   * Get the value of a component at a specified index
   * @param {number} index
   * @returns {number}
   */
  valueOf(index: number): number {
    const cmps = toAnyComponents(this.cmps);
    return (
      cmps[index] ??
      raise(
        new OutOfBounds(
          `Index ${index} out of bounds for vector of size ${cmps.length}`
        )
      )
    );
  }

  /**
   * Calls array.forEach on the components of this vector
   * @param {Function} callback Function to run for each component
   * @param {ThisType<unknown>} thisArg Optional this argument
   */
  forEach(
    callback: VectorCallback<number, Components<N>>,
    thisArg?: ThisType<unknown>
  ): void {
    const fn = callback as VectorCallback<number>;
    toAnyComponents(this.cmps).forEach(fn, thisArg);
  }

  /**
   * Calls array.map on the components of this vector
   * @param {Function} mapper Function to run for each component
   * @param {ThisType<unknown>} thisArg Optional this argument
   */
  map(
    mapper: VectorCallback<number, Components<N>>,
    thisArg?: ThisType<unknown>
  ): Vector<N> {
    const fn = mapper as VectorCallback<number>;
    return new Vector(
      toAnyComponents(this.cmps).map(fn, thisArg) as Components<N>
    );
  }

  /**
   * Calls array.reduce on the components of this vector
   * @param {Function} reductionFn Function to run for each component
   * @param {number} initialValue Optional initial value
   */
  reduce(
    reductionFn: VectorReduceCallback<number, Components<N>>,
    initialValue?: number
  ): number {
    const fn = reductionFn as VectorReduceCallback<number>;
    return initialValue != null
      ? toAnyComponents(this.cmps).reduce(fn, initialValue)
      : toAnyComponents(this.cmps).reduce(fn);
  }

  /**
   * Determines whether all components of this vector pass a specified test
   * @param {Function} predicate function to run for each component
   * @returns {boolean} true if all components pass, false otherwise
   */
  every(predicate: VectorCallback<boolean, Components<N>>): boolean {
    const fn = predicate as VectorCallback<boolean>;
    return toAnyComponents(this.cmps).every(fn);
  }

  /**
   * Determines whether any of the components in this vector pass a specified test
   * @param {Function} predicate function to run for each component
   * @returns {boolean} true if some of the components pass, false otherwise
   */
  some(predicate: VectorCallback<boolean, Components<N>>): boolean {
    const fn = predicate as VectorCallback<boolean>;
    return toAnyComponents(this.cmps).some(fn);
  }

  /**
   * Converts this vector to an array
   * @returns {Components<N>} This vector's components as an array
   */
  toArray(): Components<N> {
    return [...this.cmps] as Components<N>;
  }

  /**
   * Copies this vector, and overwrites the value at the provided index, with the given value
   * @param {number} index Index to overwrite at
   * @param {number} value New value to set
   * @returns {Vector<N>} The new Vector
   */
  with(index: number, value: number): Vector<N> {
    return new Vector<N>(
      toAnyComponents(this.cmps).with(index, value) as Components<N>
    );
  }

  /**
   * Guard function used to narrow a parsed Vector
   * @param {number} size the size to narrow to
   * @returns {boolean} true if the size of the parsed vector is the given size, false otherwise
   */
  isSize<const S extends number>(this: Vector, size: S): this is Vector<S> {
    return toAnyComponents(this.cmps).length === size;
  }

  /**
   * Tests if this vector and another have equal size and components
   * @param {...[Vector] | AnyComponents} other Vector or components given as arguments
   * @returns {boolean} If they are equal
   */
  equals(
    ...other: readonly [Vector<undefined | number>] | AnyComponents
  ): boolean {
    const cmps = toAnyComponents(this.cmps);
    const otherCmps = isAnyVector(other[0])
      ? toAnyComponents(other[0].cmps)
      : other;
    return (
      cmps.length === otherCmps.length &&
      cmps.every((_, i) => cmps[i] === otherCmps[i])
    );
  }

  /** Checks if this vector is within the given bounds, where the position is inclusive
   * and the dimensions are exclusive
   *
   * @param dimensions Dimensions of the bounds
   * @param positions Starting positions of the bounds. Defaults to zero
   * @returns if this vector is within the given bounds
   */
  inBounds(dimensions: Vector<N>, positions?: Vector<N>): boolean {
    const cmps = toAnyComponents(this.cmps);
    const dimCmps = toAnyComponents(dimensions.cmps);
    const posCmps = positions != null ? toAnyComponents(positions.cmps) : null;
    if (cmps.length === dimCmps.length) {
      if (posCmps == null || cmps.length === posCmps.length) {
        return cmps.every(
          (cmp, i) =>
            cmp >= (posCmps?.[i] ?? 0) &&
            cmp < (posCmps?.[i] ?? 0) + (dimCmps[i] as number)
        );
      } else {
        throw new IncompatibleVector(
          `Received an incompatible positions vector of size ${posCmps.length}`
        );
      }
    } else {
      throw new IncompatibleVector(
        `Received an incompatible dimensions vector of size ${dimCmps.length}`
      );
    }
  }

  /**
   * Converts this vector to a string in the format: "Vector<N>[component1, component2, ...]"
   * @param {number} fractionDigits optional precision to format the components to
   * @returns {string} the formatted string
   */
  toString(fractionDigits?: number): string {
    const cmps = toAnyComponents(this.cmps);
    const cmpsStr = cmps.reduce(
      (acc: string | null, cmp) =>
        (acc == null ? "" : acc + ", ") +
        (fractionDigits != null ? cmp.toFixed(fractionDigits) : cmp.toString()),
      null
    );
    return `Vector<${cmps.length}>[${cmpsStr}]`;
  }

  [Symbol.isConcatSpreadable] = true;

  [Symbol.iterator] = (): Iterator<number> => {
    const cmps = toAnyComponents(this.cmps);
    return (function* () {
      for (const cmp of cmps) {
        yield cmp;
      }
    })();
  };

  get [Symbol.toStringTag]() {
    return `Vector<${toAnyComponents(this.cmps).length}>`;
  }

  /**
   * Parses a string and tries to make a vector out of it
   * @param {string} str Vector string in the format of "VectorND[component1, component2, ...]"
   * @returns {(Vector | undefined)} The parsed vector if it's valid, otherwise undefined.
   */
  static parseString(str: string): Vector | undefined {
    const match = /^Vector\d+D\[(?<cmps>[^\]]+)\]$/.exec(str);
    const cmps = match?.groups?.cmps?.split(",").map(Number);
    if (isAnyComponents(cmps)) {
      return new Vector(cmps);
    } else {
      return undefined;
    }
  }

  /**
   * Returns a random normalised vector with N number of components
   * @param {number} size Number of components to return
   * @returns {Vector<N>} Random normalised vector.
   */
  static randomNormalised<N extends number>(size: N): Vector<N> {
    const cmps = [...new Array<undefined>(size)].map(() => Math.random() - 0.5);
    const magnitude = Math.sqrt(cmps.reduce((acc, cmp) => acc + cmp * cmp, 0));
    return new Vector(cmps.map(cmp => cmp / magnitude) as Components<N>);
  }

  /**
   * Creates a new vector filled with 0s
   * @param {number} size How many components the vector should have
   * @returns {Vector<N>} The created vector
   */
  static zero<N extends number>(size: N): Vector<N> {
    return new Vector(new Array(size).fill(0) as Components<N>);
  }

  /**
   * Creates a new vector filled with 1s
   * @param {number} size How many components the vector should have
   * @returns {Vector<N>} The created vector
   */
  static one<N extends number>(size: N): Vector<N> {
    return new Vector(new Array(size).fill(1) as Components<N>);
  }

  /**
   * Creates a new vector filled with a given value
   * @param {number} size How many components the vector should have
   * @param {number} value Value to fill the vector with
   * @returns {Vector<N>} The created vector
   */
  static fill<N extends number>(size: N, value: number): Vector<N> {
    return new Vector(new Array(size).fill(value) as Components<N>);
  }

  /**
   * Shorthand for creating a vector with [1, 0] as it's components. Useful for doing things with the canvas
   */
  static get RIGHT(): Vector<2> {
    return new Vector([1, 0]);
  }

  /**
   * Shorthand for creating a vector with [-1, 0] as it's components. Useful for doing things with the canvas
   */
  static get LEFT(): Vector<2> {
    return new Vector([-1, 0]);
  }

  /**
   * Shorthand for creating a vector with [0, 1] as it's components. Useful for doing things with the canvas
   */
  static get DOWN(): Vector<2> {
    return new Vector([0, 1]);
  }

  /**
   * Shorthand for creating a vector with [0, -1] as it's components. Useful for doing things with the canvas
   */
  static get UP(): Vector<2> {
    return new Vector([0, -1]);
  }
}
