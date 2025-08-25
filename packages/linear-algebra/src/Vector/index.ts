import {
  cartesianToPolar,
  polarToCartesian,
  positiveMod,
  raise,
} from "@web-art/core";
import { isArrayOf, isNumber } from "deep-guards";

import {
  incompatibleOperation,
  incompatibleVector,
  outOfBounds,
} from "./error.ts";
import {
  isAnyComponents,
  isSameSize,
  isSize,
  toAnyComponents,
} from "./helpers.ts";

import type {
  AnyComponents,
  Components,
  MinSize,
  VectorArg,
  VectorCallback,
  VectorReduceCallback,
} from "./types.ts";

export class Vector<N extends number | undefined = undefined> {
  private cmps: Components<N>;

  private constructor(cmps: Components<N>) {
    this.cmps = cmps;
  }

  private _argAccessor(arg: VectorArg<N>): (i: number) => number {
    if (isNumber(arg)) {
      return () => arg;
    } else {
      const argCmps = toAnyComponents(arg.cmps);
      return isSameSize(this, arg)
        ? i => argCmps[i] ?? raise(incompatibleVector(argCmps.length))
        : raise(incompatibleVector(argCmps.length));
    }
  }

  private _applyOperation(
    operation: (cmp: number, arg: number) => number,
    args: VectorArg<N>[]
  ): this {
    this.cmps = args.reduce((cmps, arg) => {
      const argAt = this._argAccessor(arg);
      return cmps.map((cmp, i) => operation(cmp, argAt(i))) as AnyComponents;
    }, toAnyComponents(this.cmps)) as Components<N>;
    return this;
  }

  /**
   * Robust Vector class which has many available operations
   * @param {AnyComponents} cmps The components of the vector, can be any size.
   */
  static create<A extends AnyComponents>(...cmps: A): Vector<A["length"]> {
    return isAnyComponents(cmps)
      ? new Vector(cmps as Components<A["length"]>)
      : raise(new Error(`Unknown vector components ${cmps}`));
  }

  /**
   * Shorthand for creating a vector with [1, 0] as it's components.
   * Useful for doing things with the canvas
   */
  static get RIGHT(): Vector<2> {
    return new Vector([1, 0]);
  }

  /**
   * Shorthand for creating a vector with [-1, 0] as it's components.
   * Useful for doing things with the canvas
   */
  static get LEFT(): Vector<2> {
    return new Vector([-1, 0]);
  }

  /**
   * Shorthand for creating a vector with [0, 1] as it's components.
   * Useful for doing things with the canvas
   */
  static get DOWN(): Vector<2> {
    return new Vector([0, 1]);
  }

  /**
   * Shorthand for creating a vector with [0, -1] as it's components.
   * Useful for doing things with the canvas
   */
  static get UP(): Vector<2> {
    return new Vector([0, -1]);
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
   * Returns a random normalised vector with N number of components
   * @param {number} size Number of components to return
   * @returns {Vector<N>} Random normalised vector.
   */
  static randomNormalised<N extends number>(size: N): Vector<N> {
    const cmps = [...new Array<undefined>(size)].map(() => Math.random() - 0.5);
    const magnitude = Math.hypot(...cmps);
    return new Vector(cmps.map(cmp => cmp / magnitude) as Components<N>);
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
   * Converts this vector to a string in the format: "Vector<N>[component1, component2, ...]"
   * @param {number} digits optional precision to format the components to
   * @returns {string} the formatted string
   */
  toString(digits?: number): string {
    const cmps = toAnyComponents(this.cmps);
    const cmpsStr = cmps.reduce(
      (acc, cmp) =>
        acc +
        (acc.length > 0 ? ", " : "") +
        (digits != null ? cmp.toFixed(digits) : cmp.toString()),
      ""
    );
    return `Vector<${cmps.length}>[${cmpsStr}]`;
  }

  /**
   * Raises the current components to given power(s)
   * @param  {...VectorArg<N>} args If given a number, all components are raised to this. If given a Vector, the power operation is component-wise
   * @returns {this} this
   */
  pow(...args: VectorArg<N>[]): this {
    return this._applyOperation((cmp, arg) => cmp ** arg, args);
  }

  /**
   * Adds the current components with given operand(s)
   * @param  {...VectorArg<N>} args If given a number, all components are added with this. If given a Vector, the add operation is component-wise
   * @returns {this} this
   */
  add(...args: VectorArg<N>[]): this {
    return this._applyOperation((cmp, arg) => cmp + arg, args);
  }

  /**
   * Subtracts given operand(s) from the current components
   * @param  {...VectorArg<N>} args If given a number, all components have the number taken away from them. If given a Vector, the subtract operation is component-wise
   * @returns {this} this
   */
  sub(...args: VectorArg<N>[]): this {
    return this._applyOperation((cmp, arg) => cmp - arg, args);
  }

  /**
   * Multiplies the current components with given operand(s)
   * @param  {...VectorArg<N>} args If given a number, all components are multiplied by this. If given a Vector, the multiply operation is component-wise
   * @returns {this} this
   */
  multiply(...args: VectorArg<N>[]): this {
    return this._applyOperation((cmp, arg) => cmp * arg, args);
  }

  /**
   * Divides the current components by the given operand(s)
   * @param  {...VectorArg<N>} args If given a number, all components are divided by this. If given a Vector, the divide operation is component-wise
   * @returns {this} this
   */
  divide(...args: VectorArg<N>[]): this {
    return this._applyOperation((cmp, arg) => cmp / arg, args);
  }

  /**
   * Computes the signed modulus of the current components and the given operand(s)
   * @param  {...VectorArg<N>} args If given a number it's used for all components. If given a Vector, the signed modulo operation is component-wise
   * @returns {this} this
   */
  mod(...args: VectorArg<N>[]): this {
    return this._applyOperation((cmp, arg) => cmp % arg, args);
  }

  /**
   * Computes the positive modulus of the current components and the given operand(s)
   * @param  {...VectorArg<N>} args If given a number it's used for all components. If given a Vector, the positive modulo operation is component-wise
   * @returns {this} this
   */
  positiveMod(...args: VectorArg<N>[]): this {
    return this._applyOperation(positiveMod, args);
  }

  /**
   * Linear interpolation between this vector and a given other vector
   * @param {number} t Between 0 and 1, where 0 is this current vector and 1 is the supplied other vector
   * @param {VectorArg<N>} arg Vector/number to interpolate to
   * @returns {Vector<N>} Interpolated vector
   */
  lerp(t: number, arg: VectorArg<N>): this {
    return this._applyOperation((cmp, arg) => cmp - (cmp - arg) * t, [arg]);
  }

  /**
   * Sets this vector's components to the the min between the incoming arg and this vector's components
   * @param {VectorArg<N>} arg If given a number, it's used for all min operations. If given a Vector, the min operation is component-wise
   * @returns {this} this
   */
  min(arg: VectorArg<N>): this {
    return this._applyOperation(Math.min, [arg]);
  }

  /**
   * Sets this vector's components to the the max between the incoming arg and this vector's components
   * @param {VectorArg<N>} arg If given a number, it's used for all max operations. If given a Vector, the max operation is component-wise
   * @returns {this} this
   */
  max(arg: VectorArg<N>): this {
    return this._applyOperation(Math.max, [arg]);
  }

  /**
   * Compute sum of all components
   * @returns {number}
   */
  sum(): number {
    return toAnyComponents(this.cmps).reduce((cmp, arg) => cmp + arg);
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
   * Floors each component
   * @returns {this} this
   */
  floor(): this {
    this.cmps = toAnyComponents(this.cmps).map(Math.floor) as Components<N>;
    return this;
  }

  /**
   * Ceils each component
   * @returns {this} this
   */
  ceil(): this {
    this.cmps = toAnyComponents(this.cmps).map(Math.ceil) as Components<N>;
    return this;
  }

  /**
   * Rounds each component
   * @param {number} numDigits Digits to round to
   * @returns {this} this
   */
  round(numDigits: number = 0): this {
    const cmps = toAnyComponents(this.cmps);
    const base = 10 ** numDigits;
    this.cmps = cmps.map(cmp => Math.round(cmp * base) / base) as Components<N>;
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
    const cmps = toAnyComponents(this.cmps);
    return new Vector(cmps.map(Math.sign) as Components<N>);
  }

  /**
   * Computes the dot product with a supplied vector
   * @param {VectorArg<N>} arg Vector to dot product with
   * @returns {number} Dot product
   */
  dot(arg: VectorArg<N>): number {
    const cmps = toAnyComponents(this.cmps);
    const argAt = this._argAccessor(arg);
    return cmps.reduce((acc, cmp, i) => acc + cmp * argAt(i), 0);
  }

  /**
   * Sets the "head" of the current vector to a given set of components or copies a given vector
   * @param {...Components<N> | Vector<N>} params New components to use, or the vector to copy
   * @returns {this} this
   */
  setHead(...params: Components<N> | readonly [Vector<N>]): this {
    const newCmps = isArrayOf(isNumber)(params)
      ? params
      : ([...params[0].cmps] as Components<N>);
    const newSize = toAnyComponents(newCmps).length;
    if (newSize !== toAnyComponents(this.cmps).length) {
      throw incompatibleVector(newSize);
    }
    this.cmps = newCmps;
    return this;
  }

  /**
   * Computes the squared magnitude of this vector
   * @returns {number} Squared magnitude of this vector
   */
  getSquaredMagnitude(): number {
    return toAnyComponents(this.cmps).reduce((acc, cmp) => acc + cmp ** 2, 0);
  }

  /**
   * Computes the magnitude of this vector
   * @returns {number} Magnitude of this vector
   */
  getMagnitude(): number {
    return Math.hypot(...toAnyComponents(this.cmps));
  }

  /**
   * Computes the squared magnitude of the difference between this vector and another vector
   * @param {VectorArg<N>} arg vector to difference with
   * @returns {number} squared magnitude
   */
  sqrDistTo(arg: VectorArg<N>): number {
    const cmps = toAnyComponents(this.cmps);
    const argAt = this._argAccessor(arg);
    return cmps.reduce((acc, cmp, i) => acc + (cmp - argAt(i)) ** 2, 0);
  }

  /**
   * Computes the magnitude of the difference between this vector and another vector
   * @param {VectorArg<N>} arg vector to difference with
   * @returns {number} magnitude
   */
  distTo(arg: VectorArg<N>): number {
    const argAt = this._argAccessor(arg);
    const cmps = toAnyComponents(this.cmps);
    return Math.hypot(...cmps.map((cmp, i) => cmp - argAt(i)));
  }

  /**
   * Sets the magnitude of this vector
   * @param {number} magnitude New magnitude to set to
   * @returns {this} this
   */
  setMagnitude(magnitude: number): this {
    const cmps = toAnyComponents(this.cmps);
    const magRatio = magnitude / Math.hypot(...cmps);
    this.cmps = cmps.map(cmp => cmp * magRatio) as Components<N>;
    return this;
  }

  /**
   * Returns a new normalised version of this vector
   * @returns {Vector<N>} Normalised vector
   */
  getNorm(): Vector<N> {
    const cmps = toAnyComponents(this.cmps);
    const mag = Math.hypot(...cmps);
    return new Vector(cmps.map(cmp => cmp / mag) as Components<N>);
  }

  /**
   * Normalises this vector
   * @returns {this} this
   */
  normalise(): this {
    const cmps = toAnyComponents(this.cmps);
    const mag = Math.hypot(...cmps);
    this.cmps = cmps.map(cmp => cmp / mag) as Components<N>;
    return this;
  }

  /**
   * Gets the angle of this vector
   * @type {Vector<2>}
   * @returns {number} Angle between -PI and +PI
   */
  getAngle(this: Vector<2>): number {
    return isSize(2)(this.cmps)
      ? Math.atan2(this.cmps[1], this.cmps[0])
      : raise(incompatibleOperation(2));
  }

  /**
   * Sets the angle of this vector
   * @type {Vector<2>}
   * @param {number} angle Angle to set to
   * @returns {this} this
   */
  setAngle(this: Vector<2>, angle: number): Vector<2> {
    if (isSize(2)(this.cmps)) {
      this.cmps = polarToCartesian(Math.hypot(...this.cmps), angle);

      return this;
    } else {
      throw incompatibleOperation(2);
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

        const [dMag, dAngle] = cartesianToPolar(x - px, y - py);
        const [ox, oy] = polarToCartesian(dMag, dAngle + angle);

        this.cmps = [ox + px, oy + py];

        return this;
      } else {
        throw incompatibleVector(pivot.cmps.length);
      }
    } else {
      throw incompatibleOperation(2);
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
        throw incompatibleVector(other.cmps.length);
      }
    } else {
      throw incompatibleOperation(3);
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
    const cmps = toAnyComponents(this.cmps);
    return cmps[1] ?? raise(incompatibleOperation(2, true));
  }

  /**
   * Get the value of the third component in this vector
   * @returns {number}
   */
  z(this: Vector<MinSize<3, N>>): number {
    const cmps = toAnyComponents(this.cmps);
    return cmps[2] ?? raise(incompatibleOperation(3, true));
  }

  /**
   * Get the value of the fourth component in this vector
   * @returns {number}
   */
  w(this: Vector<MinSize<4, N>>): number {
    const cmps = toAnyComponents(this.cmps);
    return cmps[3] ?? raise(incompatibleOperation(4, true));
  }

  /**
   * Get the value of a component at a specified index
   * @param {number} index
   * @returns {number}
   */
  valueOf(index: number): number {
    const cmps = toAnyComponents(this.cmps);
    return cmps[index] ?? raise(outOfBounds(index, cmps.length));
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
    const cmps = toAnyComponents(this.cmps);
    return new Vector(cmps.map(fn, thisArg) as Components<N>);
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
    const cmps = toAnyComponents(this.cmps);
    return new Vector(cmps.with(index, value) as Components<N>);
  }

  /**
   * Guard function used to narrow a parsed Vector
   * @param {number} size the size to narrow to
   * @returns {boolean} true if the size of the parsed vector is the given size, false otherwise
   */
  isSize(size: number): boolean {
    return toAnyComponents(this.cmps).length === size;
  }

  /**
   * Tests if this vector and another have equal size and components
   * @param {...[Vector] | AnyComponents} other Vector or components given as arguments
   * @returns {boolean} If they are equal
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equals(...other: readonly [Vector<any>] | AnyComponents): boolean {
    const cmps = toAnyComponents(this.cmps);
    const otherCmps = isNumber(other[0])
      ? other
      : toAnyComponents(other[0].cmps);
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
  inBounds(dimensions: VectorArg<N>, positions: VectorArg<N> = 0): boolean {
    const cmps = toAnyComponents(this.cmps);
    const dimAt = this._argAccessor(dimensions);
    const posAt = this._argAccessor(positions);
    return cmps.every((cmp, i) => cmp >= posAt(i) && cmp < posAt(i) + dimAt(i));
  }

  [Symbol.isConcatSpreadable] = true;

  [Symbol.iterator] = (): Iterator<number> => {
    const cmps = toAnyComponents(this.cmps);
    return (function* () {
      for (const cmp of cmps) yield cmp;
    })();
  };

  get [Symbol.toStringTag]() {
    return `Vector<${toAnyComponents(this.cmps).length}>`;
  }
}
