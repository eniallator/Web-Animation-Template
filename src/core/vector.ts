import TimeAnalysis from "./time_analysis";
import { isNumber } from "./utils";

type Components = [number, ...Array<number>];
export type Components2D = [number, number];
export type Components3D = [...Components2D, number];
export type Components4D = [...Components3D, number];

type MinSize<C extends Components> = [...C, ...Array<number>];

type VectorArg<C extends Components> = Vector<C> | number;

function narrowArg<C extends Components>(
  param: VectorArg<C>
): [number, null] | [null, Vector<C>] {
  return isNumber(param) ? [param, null] : [null, param];
}

class IncompatibleVectors extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IncompatibleVectors";
  }
}

class IncompatibleOperation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IncompatibleOperation";
  }
}

function isSameSize<C extends Components>(
  a: Vector<C>,
  b: Vector<Components>
): b is Vector<C> {
  if (a.size !== b.size) {
    throw new IncompatibleVectors(
      `Received an incompatible vector of size ${b.size}`
    );
  }
  return true;
}

function isComponents(value: unknown): value is Components {
  return Array.isArray(value) && value.length >= 1 && value.every(isNumber);
}

function isMin2D(components: Components): components is MinSize<Components2D> {
  return components.length >= 2;
}

function isMin3D(components: Components): components is MinSize<Components3D> {
  return components.length >= 3;
}

function isMin4D(components: Components): components is MinSize<Components4D> {
  return components.length >= 4;
}

function is2D(components: Components): components is Components2D {
  return components.length === 2;
}

type MinValidatedReturnType<
  C extends Components,
  R extends Components,
  O
> = C extends [...R, ...Array<number>] ? O : never;

type ValidatedReturnType<
  C extends Components,
  R extends Components,
  O
> = C extends R ? O : never;

export default class Vector<const C extends Components> {
  private components: C;

  /**
   * Robust Vector class which has many available operations
   * @param {C | readonly [Vector<C>]} ...params Either a vector, or the literal components of the vector
   */
  constructor(...params: C | readonly [Vector<C>]) {
    this.components = (
      isNumber(params[0]) ? params : [...params[0].components]
    ) as C;
  }

  /**
   * Raises the current x and y to given power(s)
   * @param  {...VectorArg} args If given a number, all components are raised to this. If given a Vector, the power operation is component-wise
   * @returns {this} this
   */
  pow(...args: Array<VectorArg<C>>): ThisType<Vector<C>> {
    for (let arg of args) {
      const [num, vec] = narrowArg(arg);
      if (vec != null) isSameSize(this, vec);
      for (const i in this.components) {
        this.components[i] **= num ?? vec.components[i];
      }
    }
    return this;
  }

  /**
   * Adds the current x and y with given operand(s)
   * @param  {...VectorArg} args If given a number, both components are added with this. If given a Vector, the add operation is component-wise
   * @returns {this} this
   */
  add(...args: Array<VectorArg<C>>): ThisType<Vector<C>> {
    for (let arg of args) {
      const [num, vec] = narrowArg(arg);
      if (vec != null) isSameSize(this, vec);
      for (const i in this.components) {
        this.components[i] += num ?? vec.components[i];
      }
    }
    return this;
  }

  /**
   * Subtracts given operand(s) from the current x and y
   * @param  {...VectorArg} args If given a number, both components have the number taken away from them. If given a Vector, the subtract operation is component-wise
   * @returns {this} this
   */
  sub(...args: Array<VectorArg<C>>): ThisType<Vector<C>> {
    for (let arg of args) {
      const [num, vec] = narrowArg(arg);
      if (vec != null) isSameSize(this, vec);
      for (const i in this.components) {
        this.components[i] -= num ?? vec.components[i];
      }
    }
    return this;
  }

  /**
   * Multiplies the current x and y with given operand(s)
   * @param  {...VectorArg} args If given a number, both components are multiplied by this. If given a Vector, the multiply operation is component-wise
   * @returns {this} this
   */
  multiply(...args: Array<VectorArg<C>>): ThisType<Vector<C>> {
    for (let arg of args) {
      const [num, vec] = narrowArg(arg);
      if (vec != null) isSameSize(this, vec);
      for (const i in this.components) {
        this.components[i] *= num ?? vec.components[i];
      }
    }
    return this;
  }

  /**
   * Divides the current x and y by the given operand(s)
   * @param  {...VectorArg} args If given a number, both components are divided by this. If given a Vector, the divide operation is component-wise
   * @returns {this} this
   */
  divide(...args: Array<VectorArg<C>>): ThisType<Vector<C>> {
    for (let arg of args) {
      const [num, vec] = narrowArg(arg);
      if (vec != null) isSameSize(this, vec);
      for (const i in this.components) {
        this.components[i] /= num ?? vec.components[i];
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
  lerp(other: Vector<C>, t: number): Vector<C> {
    isSameSize(this, other);
    return new Vector(
      ...(this.components.map(
        (component, i) => component - (component - other.components[i]) * t
      ) as C)
    );
  }

  /**
   * Computes the dot product with a supplied vector
   * @param {Vector} other Vector to dot product with
   * @returns {number} Dot product
   */
  dot(other: Vector<C>): number {
    isSameSize(this, other);
    return this.components.reduce(
      (acc, component, i) => acc + component * other.components[i],
      0
    );
  }

  /**
   * Returns the max of the components, whichever component is bigger
   * @returns {number} the value of the bigger component
   */
  getMax(): number {
    return Math.max(...this.components);
  }
  /**
   * Returns the min of the components, whichever component is smaller
   * @returns {number} the value of the smaller component
   */
  getMin(): number {
    return Math.min(...this.components);
  }

  /**
   * Sets the "head" of the current vector to a given value
   * @param {VectorArg} xOrVec X component of the given coordinates. Or a vector to copy if supplied instead.
   * @param {number} [y] Y component of the given coordinates
   * @returns {this} this
   */
  setHead(...params: C | readonly [Vector<C>]): ThisType<Vector<C>> {
    if (!isNumber(params[0])) {
      isSameSize(this, params[0]);
      this.components = [...params[0].components] as C;
    } else {
      this.components = params as C;
    }
    return this;
  }

  /**
   * Computes the squared magnitude of this vector
   * @returns {number} Squared magnitude of this vector
   */
  getSquaredMagnitude(): number {
    return this.components.reduce(
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
      this.components.reduce((acc, component) => acc + component * component, 0)
    );
  }

  /**
   * Sets the magnitude of this vector
   * @param {number} mag New magnitude to set to
   * @returns {this} this
   */
  setMagnitude(magnitude: number): ThisType<Vector<C>> {
    const magnitudeRatio =
      magnitude /
      Math.sqrt(
        this.components.reduce(
          (acc, component) => acc + component * component,
          0
        )
      );
    for (const i in this.components) {
      this.components[i] *= magnitudeRatio;
    }

    return this;
  }

  /**
   * Returns a new normalised version of this vector
   * @returns {Vector} Normalised vector
   */
  getNorm(): Vector<C> {
    const magnitude = Math.sqrt(
      this.components.reduce((acc, component) => acc + component * component, 0)
    );
    return new Vector(
      ...(this.components.map((component) => component / magnitude) as C)
    );
  }

  /**
   * Normalises this vector
   * @returns {this} this
   */
  normalise(): ThisType<Vector<C>> {
    const magnitude = Math.sqrt(
      this.components.reduce((acc, component) => acc + component * component, 0)
    );
    for (const i in this.components) {
      this.components[i] /= magnitude;
    }
    return this;
  }

  /**
   * Sets each component of this vector to it's absolute value
   * @returns {this} this
   */
  abs(): ThisType<Vector<C>> {
    for (const i in this.components) {
      this.components[i] = Math.abs(this.components[i]);
    }
    return this;
  }

  /**
   * Get the sign of each component in this vector
   * @returns {Vector} The signs of this vector where 1 >= 0 and -1 < 0
   */
  getSign(): Vector<C> {
    return new Vector(
      ...(this.components.map((component) => (component >= 0 ? 1 : -1)) as C)
    );
  }

  /**
   * Gets the angle of this vector
   * @type {Vector<Components2D>}
   * @returns {number} Angle between 0 and 2 * PI
   */
  getAngle(): ValidatedReturnType<C, Components2D, number> {
    const { components } = this;
    if (is2D(components)) {
      const [x, y] = components;

      let out: number;
      if (x === 0 && y === 0) out = 0;
      else if (y === 0) out = x > 0 ? 0 : Math.PI;
      else if (x === 0) out = y > 0 ? Math.PI / 2 : (Math.PI * 3) / 2;
      else if (x > 0 && y > 0) out = Math.atan(y / x);
      else if (x > 0) out = (Math.PI * 3) / 2 + Math.atan(x / -y);
      else if (y > 0) out = Math.PI - Math.atan(y / -x);
      else out = (Math.PI * 3) / 2 - Math.atan(x / y);

      return out as ValidatedReturnType<C, Components2D, number>;
    } else {
      throw new IncompatibleOperation(`Requires at a 2D vector`);
    }
  }

  /**
   * Sets the angle of this vector
   * @type {Vector<Components2D>}
   * @param {number} angle Angle to set to
   * @returns {this} this
   */
  setAngle(
    this: Vector<Components2D>,
    angle: number
  ): ValidatedReturnType<C, Components2D, Vector<Components2D>> {
    const { components } = this;
    if (is2D(components)) {
      const [x, y] = components;

      const magnitude = Math.sqrt(x ** 2 + y ** 2);
      this.components[0] = magnitude * Math.cos(angle);
      this.components[1] = magnitude * Math.sin(angle);

      return this as ValidatedReturnType<C, Components2D, Vector<Components2D>>;
    } else {
      throw new IncompatibleOperation(`Requires at a 2D vector`);
    }
  }

  /**
   * Rotates this vector about a pivot
   * @type {Vector<Components2D>}
   * @param {Vector} pivot Pivot to rotate around
   * @param {number} angle Angle to rotate by
   * @returns {this} this
   */
  rotate(
    this: Vector<Components2D>,
    pivot: Vector<Components2D>,
    angle: number
  ): ValidatedReturnType<C, Components2D, Vector<Components2D>> {
    const { components } = this;
    if (is2D(components)) {
      const [x, y] = components;
      const dx = x - pivot.x;
      const dy = y - pivot.y;
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

      this.components[0] = oX + pivot.x;
      this.components[1] = oY + pivot.y;

      return this as ValidatedReturnType<C, Components2D, Vector<Components2D>>;
    } else {
      throw new IncompatibleOperation(`Requires at a 2D vector`);
    }
  }

  /**
   * Copies this vector into a duplicate
   * @returns {Vector} Duplicated version of this vector
   */
  copy(): Vector<C> {
    return new Vector(this);
  }

  get size(): number {
    return this.components.length;
  }

  get x(): number {
    return this.components[0];
  }

  get y(): MinValidatedReturnType<C, Components2D, number> {
    const { components } = this;
    if (isMin2D(components)) {
      return components[1] as MinValidatedReturnType<C, Components2D, number>;
    } else {
      throw new IncompatibleOperation(`Requires at least a 2D vector`);
    }
  }

  get z(): MinValidatedReturnType<C, Components3D, number> {
    const components = this.components;
    if (isMin3D(components)) {
      return components[1] as MinValidatedReturnType<C, Components3D, number>;
    } else {
      throw new IncompatibleOperation(`Requires at least a 3D vector`);
    }
  }

  get w(): MinValidatedReturnType<C, Components4D, number> {
    const components = this.components;
    if (isMin4D(components)) {
      return components[1] as MinValidatedReturnType<C, Components4D, number>;
    } else {
      throw new IncompatibleOperation(`Requires at least a 4D vector`);
    }
  }

  toArray(): C {
    return [...this.components] as C;
  }

  /**
   * Tests if this vector and another have equal components
   * @param {Vector} other
   * @returns {boolean} If they are equal
   */
  equals(other: Vector<Components>): boolean {
    return (
      isSameSize(this, other) &&
      this.components.every((component, i) => component === other.components[i])
    );
  }

  toString(): string {
    return `Vector${this.size}D[${this.components.join(", ")}]`;
  }

  /**
   * Parses a string and tries to make a vector out of it
   * @param {string} str Vector string in the format of "x:NUMBER,y:NUMBER"
   * @returns {(Vector|undefined)} A vector if the x and y components have been found, else void
   */
  static parseString(str: string): Vector<Components> | undefined {
    const match = /^Vector\d+D\[([^\]]+)\]$/.exec(str);
    const components = match != null ? match[1].split(", ").map(Number) : null;
    if (isComponents(components)) {
      return new Vector(...components);
    } else {
      return undefined;
    }
  }

  static get ZERO(): Vector<Components2D> {
    return new Vector<Components2D>(0, 0);
  }
  static get ONE(): Vector<Components2D> {
    return new Vector<Components2D>(1, 1);
  }

  static get RIGHT(): Vector<Components2D> {
    return new Vector<Components2D>(1, 0);
  }
  static get LEFT(): Vector<Components2D> {
    return new Vector<Components2D>(-1, 0);
  }
  static get DOWN(): Vector<Components2D> {
    return new Vector<Components2D>(0, 1);
  }
  static get UP(): Vector<Components2D> {
    return new Vector<Components2D>(0, -1);
  }
}

try {
  TimeAnalysis.registerMethods(Vector);
} catch {}
