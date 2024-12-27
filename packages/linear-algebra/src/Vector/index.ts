import { raise, TimeAnalysis } from "@web-art/core";
import {
  IncompatibleOperation,
  IncompatibleVector,
  OutOfBounds,
} from "./error.js";
import {
  isAnyVector,
  isComponents,
  isMinSize,
  isSameSize,
  isSize,
  toAnyComponents,
  vectorArgAccessor,
} from "./helpers.js";
import { AnyComponents, Components, MinSize, VectorArg } from "./types.js";
import { isArrayOf, isNumber } from "deep-guards";

export class Vector<const N extends number | undefined = undefined> {
  type = "Vector" as const;
  private components: Components<N>;

  private constructor(params: Components<N>) {
    this.components = params;
  }

  /**
   * Robust Vector class which has many available operations
   * @param {readonly number[]} components The components of the vector, can be any size.
   */
  static create<A extends AnyComponents>(
    ...components: A
  ): Vector<A["length"]> {
    return new Vector([...components] as Components<A["length"]>);
  }

  private applyOperation(
    operation: (a: number, b: number) => number,
    ...args: VectorArg<N>[]
  ): this {
    for (const arg of args) {
      if (isAnyVector(arg) && !isSameSize(this, arg)) {
        throw new IncompatibleVector(
          `Received an incompatible vector of size ${arg.size}`
        );
      }
      const components = toAnyComponents(this.components);
      const accessor = vectorArgAccessor(arg, components.length as N);
      this.components = components.map((n, i) =>
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
   * Linear interpolation between this vector and a given other vector
   * @param {Vector<N>} other Vector to interpolate to
   * @param {number} t Between 0 and 1, where 0 is this current vector and 1 is the supplied other vector
   * @returns {Vector<N>} Interpolated vector
   */
  lerp(other: Vector<N>, t: number): Vector<N> {
    if (isSameSize(this, other)) {
      const otherComponents = toAnyComponents(other.components);
      return new Vector(
        toAnyComponents(this.components).map(
          (component, i) =>
            component - (component - (otherComponents[i] as number)) * t
        ) as Components<N>
      );
    } else {
      throw new IncompatibleVector(
        `Received an incompatible vector of size ${other.size}`
      );
    }
  }

  /**
   * Computes the dot product with a supplied vector
   * @param {Vector<N>} other Vector to dot product with
   * @returns {number} Dot product
   */
  dot(other: Vector<N>): number {
    if (isSameSize(this, other)) {
      const otherComponents = toAnyComponents(other.components);
      return toAnyComponents(this.components).reduce(
        (acc, component, i) => acc + component * (otherComponents[i] as number),
        0
      );
    } else {
      throw new IncompatibleVector(
        `Received an incompatible vector of size ${other.size}`
      );
    }
  }

  /**
   * Compute sum of all components
   * @returns {number}
   */
  sum(): number {
    return toAnyComponents(this.components).reduce((acc, n) => acc + n, 0);
  }

  /**
   * Returns the min of the components, whichever component is smaller
   * @returns {number} the value of the smaller component
   */
  getMin(): number {
    return Math.min(...toAnyComponents(this.components));
  }

  /**
   * Returns the max of the components, whichever component is bigger
   * @returns {number} the value of the bigger component
   */
  getMax(): number {
    return Math.max(...toAnyComponents(this.components));
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
   * Sets the "head" of the current vector to a given set of components or copies a given vector
   * @param {Vector<N> | ...Components<N>} xOrVec New components to use, or the vector to copy
   * @param {number} [y] Y component of the given coordinates
   * @returns {this} this
   */
  setHead(...params: Components<N> | readonly [Vector<N>]): this {
    const newComponents = isArrayOf(isNumber)(params)
      ? params
      : ([...params[0].components] as Components<N>);
    const newSize = toAnyComponents(newComponents).length;
    if (newSize !== toAnyComponents(this.components).length) {
      throw new IncompatibleVector(
        `Received an incompatible vector of size ${newSize}`
      );
    }
    this.components = newComponents;
    return this;
  }

  /**
   * Computes the squared magnitude of this vector
   * @returns {number} Squared magnitude of this vector
   */
  getSquaredMagnitude(): number {
    return toAnyComponents(this.components).reduce(
      (acc, component) => acc + component * component,
      0
    );
  }

  /**
   * Computes the magnitude of this vector
   * @returns {number} Magnitude of this vector
   */
  getMagnitude(): number {
    return Math.sqrt(
      toAnyComponents(this.components).reduce(
        (acc, component) => acc + component * component,
        0
      )
    );
  }

  /**
   * Computes the squared magnitude of the difference between this vector and another vector
   * @param {Vector<N>} other vector to difference with
   * @returns {number} squared magnitude
   */
  sqrDistTo(other: Vector<N>): number {
    if (isSameSize(this, other)) {
      const otherComponents = toAnyComponents(other.components);
      return toAnyComponents(this.components).reduce(
        (acc, n, i) => acc + (n - (otherComponents[i] as number)) ** 2,
        0
      );
    } else {
      throw new IncompatibleVector(
        `Received an incompatible vector of size ${other.size}`
      );
    }
  }

  /**
   * Computes the magnitude of the difference between this vector and another vector
   * @param {Vector<N>} other vector to difference with
   * @returns {number} magnitude
   */
  distTo(other: Vector<N>): number {
    if (isSameSize(this, other)) {
      const otherComponents = toAnyComponents(other.components);
      return Math.sqrt(
        toAnyComponents(this.components).reduce(
          (acc, n, i) => acc + (n - (otherComponents[i] as number)) ** 2,
          0
        )
      );
    } else {
      throw new IncompatibleVector(
        `Received an incompatible vector of size ${other.size}`
      );
    }
  }

  /**
   * Sets the magnitude of this vector
   * @param {number} mag New magnitude to set to
   * @returns {this} this
   */
  setMagnitude(magnitude: number): this {
    const components = toAnyComponents(this.components);
    const magnitudeRatio =
      magnitude /
      Math.sqrt(
        components.reduce((acc, component) => acc + component * component, 0)
      );
    this.components = components.map(n => n * magnitudeRatio) as Components<N>;
    return this;
  }

  /**
   * Returns a new normalised version of this vector
   * @returns {Vector<N>} Normalised vector
   */
  getNorm(): Vector<N> {
    const components = toAnyComponents(this.components);
    const magnitude = Math.sqrt(
      components.reduce((acc, component) => acc + component * component, 0)
    );
    return new Vector(
      components.map(component => component / magnitude) as Components<N>
    );
  }

  /**
   * Normalises this vector
   * @returns {this} this
   */
  normalise(): this {
    const components = toAnyComponents(this.components);
    const magnitude = Math.sqrt(
      components.reduce((acc, component) => acc + component * component, 0)
    );
    this.components = components.map(n => n / magnitude) as Components<N>;
    return this;
  }

  /**
   * Sets each component of this vector to it's absolute value
   * @returns {this} this
   */
  abs(): this {
    this.components = toAnyComponents(this.components).map(
      Math.abs
    ) as Components<N>;
    return this;
  }

  /**
   * Get the sign of each component in this vector
   * @returns {Vector<N>} The signs of this vector where the component will be 1 if >= 0, otherwise -1
   */
  getSign(): Vector<N> {
    return new Vector(
      toAnyComponents(this.components).map(component =>
        component >= 0 ? 1 : -1
      ) as Components<N>
    );
  }

  /**
   * Gets the angle of this vector
   * @type {Vector<2>}
   * @returns {number} Angle between 0 and 2 * PI
   */
  getAngle(this: Vector<2>): number {
    if (isSize(2)(this.components)) {
      const [x, y] = this.components;

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
    if (isSize(2)(this.components)) {
      const [x, y] = this.components;

      const magnitude = Math.sqrt(x ** 2 + y ** 2);
      this.components[0] = magnitude * Math.cos(angle);
      this.components[1] = magnitude * Math.sin(angle);

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
    if (isSize(2)(this.components)) {
      if (isSameSize(this, pivot)) {
        const [x, y] = this.components;
        const [px, py] = pivot.components;
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

        this.components[0] = oX + px;
        this.components[1] = oY + py;

        return this;
      } else {
        throw new IncompatibleVector(
          `Received an incompatible vector of size ${pivot.size}`
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
    if (isSize(3)(this.components)) {
      if (isSameSize(this, other)) {
        const a = this.components;
        const b = other.components;
        return new Vector([
          a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0],
        ]);
      } else {
        throw new IncompatibleVector(
          `Received an incompatible vector of size ${other.size}`
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
    return new Vector([...this.components] as Components<N>);
  }

  /**
   * The size of this vector
   * @returns {number}
   */
  get size(): number {
    return toAnyComponents(this.components).length;
  }

  /**
   * Get the value of the first component in this vector
   * @returns {number}
   */
  x(): number {
    return toAnyComponents(this.components)[0];
  }

  /**
   * Get the value of the second component in this vector
   * @returns {number}
   */
  y(this: Vector<MinSize<2, N>>): number {
    if (isMinSize(2)(this.components)) {
      return toAnyComponents(this.components)[1] as number;
    } else {
      throw new IncompatibleOperation("Requires at least a 2D vector");
    }
  }

  /**
   * Get the value of the third component in this vector
   * @returns {number}
   */
  z(this: Vector<MinSize<3, N>>): number {
    if (isMinSize(3)(this.components)) {
      return toAnyComponents(this.components)[2] as number;
    } else {
      throw new IncompatibleOperation("Requires at least a 3D vector");
    }
  }

  /**
   * Get the value of the fourth component in this vector
   * @returns {number}
   */
  w(this: Vector<MinSize<4, N>>): number {
    if (isMinSize(4)(this.components)) {
      return toAnyComponents(this.components)[3] as number;
    } else {
      throw new IncompatibleOperation("Requires at least a 4D vector");
    }
  }

  /**
   * Get the value of a component at a specified index
   * @param {number} index
   * @returns {number}
   */
  valueOf(index: number): number {
    const components = toAnyComponents(this.components);
    return (
      components[index] ??
      raise(
        new OutOfBounds(
          `Index ${index} out of bounds for vector of size ${components.length}`
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
    callback: (value: number, index: number, array: number[]) => number,
    thisArg?: ThisType<unknown>
  ): void {
    toAnyComponents(this.components).forEach(callback, thisArg);
  }

  /**
   * Calls array.map on the components of this vector
   * @param {Function} mapper Function to run for each component
   * @param {ThisType<unknown>} thisArg Optional this argument
   */
  map(
    mapper: (value: number, index: number, array: number[]) => number,
    thisArg?: ThisType<unknown>
  ): Vector<N> {
    return new Vector(
      toAnyComponents(this.components).map(mapper, thisArg) as Components<N>
    );
  }

  /**
   * Calls array.reduce on the components of this vector
   * @param {Function} reductionFn Function to run for each component
   * @param {number} initialValue Optional initial value
   */
  reduce(
    reductionFn: (
      accumulator: number,
      value: number,
      index: number,
      array: number[]
    ) => number,
    initialValue?: number
  ): number {
    return initialValue != null
      ? toAnyComponents(this.components).reduce(reductionFn, initialValue)
      : toAnyComponents(this.components).reduce(reductionFn);
  }

  /**
   * Determines whether all components of this vector pass a specified test
   * @param {Function} predicate function to run for each component
   * @returns {boolean} true if all components pass, false otherwise
   */
  every(
    predicate: (n: number, index: number, components: Components<N>) => boolean
  ): boolean {
    return toAnyComponents(this.components).every(
      predicate as (n: number, index: number, arr: number[]) => boolean
    );
  }

  /**
   * Determines whether any of the components in this vector pass a specified test
   * @param {Function} predicate function to run for each component
   * @returns {boolean} true if some of the components pass, false otherwise
   */
  some(
    predicate: (n: number, index: number, components: Components<N>) => boolean
  ): boolean {
    return toAnyComponents(this.components).some(
      predicate as (n: number, index: number, arr: number[]) => boolean
    );
  }

  /**
   * Converts this vector to an array
   * @returns {Components<N>} This vector's components as an array
   */
  toArray(): Components<N> {
    return [...toAnyComponents(this.components)] as Components<N>;
  }

  /**
   * Copies this vector, and overwrites the value at the provided index, with the given value
   * @param {number} index Index to overwrite at
   * @param {number} value New value to set
   * @returns {Vector<N>} The new Vector
   */
  with(index: number, value: number): Vector<N> {
    return new Vector<N>(
      toAnyComponents(this.components).with(index, value) as Components<N>
    );
  }

  /**
   * Guard function used to narrow a parsed Vector
   * @param {number} size the size to narrow to
   * @returns {boolean} true if the size of the parsed vector is the given size, false otherwise
   */
  isSize<const S extends number>(this: Vector, size: S): this is Vector<S> {
    return toAnyComponents(this.components).length === size;
  }

  /**
   * Tests if this vector and another have equal size and components
   * @param {...[Vector] | AnyComponents} other Vector or components given as arguments
   * @returns {boolean} If they are equal
   */
  equals(
    ...other: readonly [Vector<undefined | number>] | AnyComponents
  ): boolean {
    const components = toAnyComponents(this.components);
    const otherComponents = isComponents(other)
      ? other
      : toAnyComponents(other[0].components);
    return (
      components.length === otherComponents.length &&
      components.every((_, i) => components[i] === otherComponents[i])
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
    return toAnyComponents(this.components).every(
      (n, i) =>
        n > (positions?.valueOf(i) ?? 0) &&
        n - (positions?.valueOf(i) ?? 0) < dimensions.valueOf(i)
    );
  }

  /**
   * Converts this vector to a string in the format: "VectorND[component1, component2, ...]"
   * @param {number} fractionDigits optional precision to format the components to
   * @returns {string} the formatted string
   */
  toString(fractionDigits?: number): string {
    const components = toAnyComponents(this.components);
    return `Vector${components.length}D[${(fractionDigits != null
      ? components.map(n => n.toFixed(fractionDigits))
      : components
    ).join(", ")}]`;
  }

  /**
   * Parses a string and tries to make a vector out of it
   * @param {string} str Vector string in the format of "VectorND[component1, component2, ...]"
   * @returns {(Vector | undefined)} The parsed vector if it's valid, otherwise undefined.
   */
  static parseString(str: string): Vector | undefined {
    const match = /^Vector\d+D\[(?<components>[^\]]+)\]$/.exec(str);
    const components = match?.groups?.components?.split(", ").map(Number);
    if (isComponents(components)) {
      return new Vector(components);
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
    const components = new Array(size)
      .fill(undefined)
      .map(() => Math.random() - 0.5);
    const magnitude = Math.sqrt(
      components.reduce((acc, component) => acc + component * component, 0)
    );
    return new Vector(
      components.map(component => component / magnitude) as Components<N>
    );
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

try {
  TimeAnalysis.registerMethods(Vector);
} catch (ex) {
  console.error(ex);
}
