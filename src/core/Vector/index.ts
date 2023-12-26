import { isArrayOf, isNumber } from "../guard";
import TimeAnalysis from "../time_analysis";
import {
  IncompatibleOperation,
  IncompatibleVector,
  OutOfBounds,
} from "./error";
import {
  is2D,
  is3D,
  isAnyVector,
  isComponents,
  isMin2D,
  isMin3D,
  isMin4D,
  isSameSize,
  toAnyComponents,
  vectorArgAccessor,
} from "./helpers";
import {
  VectorArg,
  MinSizeComponents,
  Components,
  AnyComponents,
} from "./types";

export default class Vector<const N extends number | undefined> {
  type = "Vector" as const;
  private components: Components<N>;

  private constructor(params: Components<N>) {
    this.components = params;
  }

  /**
   * Robust Vector class which has many available operations
   * @param {ReadonlyArray<number>} components The components of the vector, can be any size.
   */
  static create<A extends AnyComponents>(
    ...components: A
  ): Vector<A["length"]> {
    return new Vector([...components] as Components<A["length"]>);
  }

  /**
   * Raises the current components to given power(s)
   * @param  {...VectorArg} args If given a number, all components are raised to this. If given a Vector, the power operation is component-wise
   * @returns {this} this
   */
  pow(...args: Array<VectorArg<N>>): this {
    for (let arg of args) {
      if (isAnyVector(arg) && !isSameSize(this, arg)) {
        throw new IncompatibleVector(
          `Received an incompatible vector of size ${arg.size}`
        );
      }
      const components = toAnyComponents(this.components);
      const argAccessor = vectorArgAccessor(arg, components.length as N);
      for (let i = 0; i < components.length; i++) {
        components[i] **= argAccessor(i);
      }
    }
    return this;
  }

  /**
   * Adds the current components with given operand(s)
   * @param  {...VectorArg} args If given a number, all components are added with this. If given a Vector, the add operation is component-wise
   * @returns {this} this
   */
  add(...args: Array<VectorArg<N>>): this {
    for (let arg of args) {
      if (isAnyVector(arg) && !isSameSize(this, arg)) {
        throw new IncompatibleVector(
          `Received an incompatible vector of size ${arg.size}`
        );
      }
      const components = toAnyComponents(this.components);
      const argAccessor = vectorArgAccessor(arg, components.length as N);
      for (let i = 0; i < components.length; i++) {
        components[i] += argAccessor(i);
      }
    }
    return this;
  }

  /**
   * Subtracts given operand(s) from the current components
   * @param  {...VectorArg} args If given a number, all components have the number taken away from them. If given a Vector, the subtract operation is component-wise
   * @returns {this} this
   */
  sub(...args: Array<VectorArg<N>>): this {
    for (let arg of args) {
      if (isAnyVector(arg) && !isSameSize(this, arg)) {
        throw new IncompatibleVector(
          `Received an incompatible vector of size ${arg.size}`
        );
      }
      const components = toAnyComponents(this.components);
      const argAccessor = vectorArgAccessor(arg, components.length as N);
      for (let i = 0; i < components.length; i++) {
        components[i] -= argAccessor(i);
      }
    }
    return this;
  }

  /**
   * Multiplies the current components with given operand(s)
   * @param  {...VectorArg} args If given a number, all components are multiplied by this. If given a Vector, the multiply operation is component-wise
   * @returns {this} this
   */
  multiply(...args: Array<VectorArg<N>>): this {
    for (let arg of args) {
      if (isAnyVector(arg) && !isSameSize(this, arg)) {
        throw new IncompatibleVector(
          `Received an incompatible vector of size ${arg.size}`
        );
      }
      const components = toAnyComponents(this.components);
      const argAccessor = vectorArgAccessor(arg, components.length as N);
      for (let i = 0; i < components.length; i++) {
        components[i] *= argAccessor(i);
      }
    }
    return this;
  }

  /**
   * Divides the current components by the given operand(s)
   * @param  {...VectorArg} args If given a number, all components are divided by this. If given a Vector, the divide operation is component-wise
   * @returns {this} this
   */
  divide(...args: Array<VectorArg<N>>): this {
    for (let arg of args) {
      if (isAnyVector(arg) && !isSameSize(this, arg)) {
        throw new IncompatibleVector(
          `Received an incompatible vector of size ${arg.size}`
        );
      }
      const components = toAnyComponents(this.components);
      const argAccessor = vectorArgAccessor(arg, components.length as N);
      for (let i = 0; i < components.length; i++) {
        components[i] /= argAccessor(i);
      }
    }
    return this;
  }

  /**
   * Linear interpolation between this vector and a given other vector
   * @param {Vector} other Vector to interpolate to
   * @param {number} t Between 0 and 1, where 0 is this current vector and 1 is the supplied other vector
   * @returns {Vector} Interpolated vector
   */
  lerp(other: Vector<N>, t: number): Vector<N> {
    if (isSameSize(this, other)) {
      return new Vector(
        toAnyComponents(this.components).map(
          (component, i) =>
            component - (component - toAnyComponents(other.components)[i]) * t
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
   * @param {Vector} other Vector to dot product with
   * @returns {number} Dot product
   */
  dot(other: Vector<N>): number {
    if (isSameSize(this, other)) {
      return toAnyComponents(this.components).reduce(
        (acc, component, i) =>
          acc + component * toAnyComponents(other.components)[i],
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
    return toAnyComponents(this.components).reduce((acc, n) => acc + n);
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
    if (isAnyVector(arg) && !isSameSize(this, arg)) {
      throw new IncompatibleVector(
        `Received an incompatible vector of size ${arg.size}`
      );
    }
    const components = toAnyComponents(this.components);
    const argAccessor = vectorArgAccessor(arg, components.length as N);
    for (let i = 0; i < components.length; i++) {
      components[i] = Math.min(components[i], argAccessor(i));
    }
    return this;
  }

  /**
   * Sets this vector's components to the the max between the incoming arg and this vector's components
   * @param {VectorArg<N>} arg If given a number, it's used for all max operations. If given a Vector, the max operation is component-wise
   * @returns {this} this
   */
  max(arg: VectorArg<N>): this {
    if (isAnyVector(arg) && !isSameSize(this, arg)) {
      throw new IncompatibleVector(
        `Received an incompatible vector of size ${arg.size}`
      );
    }
    const components = toAnyComponents(this.components);
    const argAccessor = vectorArgAccessor(arg, components.length as N);
    for (let i = 0; i < components.length; i++) {
      components[i] = Math.max(components[i], argAccessor(i));
    }
    return this;
  }

  /**
   * Sets the "head" of the current vector to a given value
   * @param {VectorArg} xOrVec X component of the given coordinates. Or a vector to copy if supplied instead.
   * @param {number} [y] Y component of the given coordinates
   * @returns {this} this
   */
  setHead(...params: AnyComponents | readonly [Vector<N>]): this {
    const newComponents: AnyComponents = isArrayOf(isNumber)(params)
      ? params
      : toAnyComponents(params[0].components);
    if (newComponents.length !== toAnyComponents(this.components).length) {
      throw new IncompatibleVector(
        `Received an incompatible vector of size ${newComponents.length}`
      );
    }
    this.components = newComponents as Components<N>;
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
    for (const i in components) {
      components[i] *= magnitudeRatio;
    }

    return this;
  }

  /**
   * Returns a new normalised version of this vector
   * @returns {Vector} Normalised vector
   */
  getNorm(): Vector<N> {
    const components = toAnyComponents(this.components);
    const magnitude = Math.sqrt(
      components.reduce((acc, component) => acc + component * component, 0)
    );
    return new Vector(
      components.map((component) => component / magnitude) as Components<N>
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
    for (const i in components) {
      components[i] /= magnitude;
    }
    return this;
  }

  /**
   * Sets each component of this vector to it's absolute value
   * @returns {this} this
   */
  abs(): this {
    const components = toAnyComponents(this.components);
    for (const i in components) {
      components[i] = Math.abs(components[i]);
    }
    return this;
  }

  /**
   * Get the sign of each component in this vector
   * @returns {Vector} The signs of this vector where 1 >= 0 and -1 < 0
   */
  getSign(): Vector<N> {
    return new Vector(
      toAnyComponents(this.components).map((component) =>
        component >= 0 ? 1 : -1
      ) as Components<N>
    );
  }

  /**
   * Gets the angle of this vector
   * @type {Vector<Components<2>>}
   * @returns {number} Angle between 0 and 2 * PI
   */
  getAngle(this: Vector<2>): number {
    if (is2D(this.components)) {
      const [x, y] = this.components;

      let out: number;
      if (x === 0 && y === 0) out = 0;
      else if (y === 0) out = x > 0 ? 0 : Math.PI;
      else if (x === 0) out = y > 0 ? Math.PI / 2 : (Math.PI * 3) / 2;
      else if (x > 0 && y > 0) out = Math.atan(y / x);
      else if (x > 0) out = (Math.PI * 3) / 2 + Math.atan(x / -y);
      else if (y > 0) out = Math.PI - Math.atan(y / -x);
      else out = (Math.PI * 3) / 2 - Math.atan(x / y);

      return out;
    } else {
      throw new IncompatibleOperation("Requires a 2D vector");
    }
  }

  /**
   * Sets the angle of this vector
   * @type {Vector<Components2D>}
   * @param {number} angle Angle to set to
   * @returns {this} this
   */
  setAngle(this: Vector<2>, angle: number): ThisType<Vector<2>> {
    if (is2D(this.components)) {
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
   * @param {Vector} pivot Pivot to rotate around
   * @param {number} angle Angle to rotate by
   * @returns {this} this
   */
  rotate(
    this: Vector<2>,
    pivot: Vector<2>,
    angle: number
  ): ThisType<Vector<2>> {
    if (is2D(this.components)) {
      if (isSameSize(this, pivot)) {
        const [x, y] = this.components;
        const [px, py] = pivot.components;
        const dx = x - px;
        const dy = y - py;
        const dMag = Math.sqrt(dx * dx + dy * dy);

        let currAngle;
        if (dx === 0 && dy === 0) currAngle = 0;
        else if (dy === 0) currAngle = dx > 0 ? 0 : Math.PI;
        else if (dx === 0) currAngle = dy > 0 ? Math.PI / 2 : (Math.PI * 3) / 2;
        else if (dx > 0 && dy > 0) currAngle = Math.atan(dy / dx);
        else if (dx > 0) currAngle = (Math.PI * 3) / 2 + Math.atan(dx / -dy);
        else if (dy > 0) currAngle = Math.PI - Math.atan(dy / -dx);
        else currAngle = (Math.PI * 3) / 2 - Math.atan(dx / dy);

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
   * @param {Vector<3>} this
   * @param {Vector<3>} other
   * @returns {Vector<3>} The resulting cross product vector of this and the other vector
   */
  crossProduct(this: Vector<3>, other: Vector<3>): Vector<3> {
    if (is3D(this.components)) {
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
   * @returns {Vector} Duplicated version of this vector
   */
  copy(): Vector<N> {
    return new Vector([...this.components] as Components<N>);
  }

  /**
   * The size of this vector
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
  y(this: MinSizeComponents<2, N>): number {
    if (isMin2D(this.components)) {
      return toAnyComponents(this.components)[1];
    } else {
      throw new IncompatibleOperation("Requires at least a 2D vector");
    }
  }

  /**
   * Get the value of the third component in this vector
   * @returns {number}
   */
  z(this: MinSizeComponents<3, N>): number {
    if (isMin3D(this.components)) {
      return toAnyComponents(this.components)[2];
    } else {
      throw new IncompatibleOperation("Requires at least a 3D vector");
    }
  }

  /**
   * Get the value of the fourth component in this vector
   * @returns {number}
   */
  w(this: MinSizeComponents<4, N>): number {
    if (isMin4D(this.components)) {
      return toAnyComponents(this.components)[3];
    } else {
      throw new IncompatibleOperation("Requires at least a 4D vector");
    }
  }

  /**
   * Get the value of a component at a specified index
   * @param index
   * @returns {number}
   */
  valueOf(index: number): number {
    const components = toAnyComponents(this.components);
    const value = components[index];
    if (value != null) {
      return value;
    } else {
      throw new OutOfBounds(
        `Index ${index} out of bounds for vector of size ${components.length}`
      );
    }
  }

  /**
   * Calls array.forEach on the components of this vector
   * @param {Function} callback Function to run for each component
   * @param {any} thisArg Optional this argument
   */
  forEach(
    callback: (value: number, index: number, array: number[]) => number,
    thisArg: any
  ): void {
    toAnyComponents(this.components).forEach(callback, thisArg);
  }

  /**
   * Calls array.map on the components of this vector
   * @param {Function} mapper Function to run for each component
   * @param {any} thisArg Optional this argument
   */
  map(
    mapper: (value: number, index: number, array: number[]) => number,
    thisArg?: any
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
   * Converts this vector to an array
   * @returns The vector's components as an array
   */
  toArray(): Components<N> {
    return [...toAnyComponents(this.components)] as Components<N>;
  }

  /**
   * Tests if this vector and another have equal components
   * @param {Vector} other
   * @returns {boolean} If they are equal
   */
  equals(other: Vector<number>): boolean {
    return (
      isSameSize(this, other) &&
      toAnyComponents(this.components).every(
        (component, i) => component === other.components[i]
      )
    );
  }

  /**
   * Converts this vector to a string in the format: "VectorND[component1, component2, ...]"
   * @returns the formatted string
   */
  toString(): string {
    const components = toAnyComponents(this.components);
    return `Vector${components.length}D[${components.join(", ")}]`;
  }

  /**
   * Parses a string and tries to make a vector out of it
   * @param {string} str Vector string in the format of "VectorND[component1, component2, ...]"
   * @returns {(Vector|undefined)} The parsed vector if it's valid, otherwise undefined.
   */
  static parseString(str: string): Vector<undefined> | undefined {
    const match = /^Vector\d+D\[(?<components>[^\]]+)\]$/.exec(str);
    const components = match?.groups?.components.split(", ").map(Number);
    if (isComponents(components)) {
      return new Vector(components);
    } else {
      return undefined;
    }
  }

  /**
   * Guard function used to narrow a parsed Vector
   * @param size the size to narrow to
   * @returns true if the size of the parsed vector is the given size, false otherwise
   */
  isSize<const S extends number>(
    this: Vector<undefined>,
    size: S
  ): this is Vector<S> {
    return toAnyComponents(this.components).length === size;
  }

  /**
   * Returns a vector with N number of components, all mapped on a unit circle (or the N dimensional equivalent).
   * @param size Number of components to return
   * @returns Random normalised vector.
   */
  static randomPointOnUnitCircle<N extends number>(size: N): Vector<N> {
    const components = new Array(size)
      .fill(undefined)
      .map(() => Math.random() - 0.5);
    const magnitude = Math.sqrt(
      components.reduce((acc, component) => acc + component * component, 0)
    );
    return new Vector(
      components.map((component) => component / magnitude) as Components<N>
    );
  }

  /**
   * Creates a new vector filled with 0s
   * @param size How many components the vector should have
   * @returns The created vector
   */
  static ZERO<N extends number>(size: N): Vector<N> {
    return new Vector(new Array(size).fill(0) as Components<N>);
  }

  /**
   * Creates a new vector filled with 1s
   * @param size How many components the vector should have
   * @returns The created vector
   */
  static ONE<N extends number>(size: N): Vector<N> {
    return new Vector(new Array(size).fill(1) as Components<N>);
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
} catch {}
