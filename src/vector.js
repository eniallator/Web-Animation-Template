class Vector {
  /**
   * Robust 2D Vector class which has many available operations
   * @param {(number|Vector)} xOrVec X component of the given coordinates. Or a vector to copy if supplied instead.
   * @param {number} [y] Y component of the given coordinates
   */
  constructor(xOrVec, y) {
    if (xOrVec > 0 || xOrVec <= 0 || y > 0 || y <= 0) {
      this.x = xOrVec;
      this.y = y;
    } else {
      this.x = xOrVec.x;
      this.y = xOrVec.y;
    }
  }

  /**
   * Raises the current x and y to given power(s)
   * @param  {...(number|Vector)} args If given a number, both components are raised to this. If given a Vector, the power operation is component-wise
   * @returns {this} this
   */
  pow(...args) {
    for (let arg of args) {
      if (arg > 0 || arg <= 0) {
        this.x = this.x ** arg;
        this.y = this.y ** arg;
      } else {
        this.x = this.x ** arg.x;
        this.y = this.y ** arg.y;
      }
    }
    return this;
  }

  /**
   * Adds the current x and y with given operand(s)
   * @param  {...(number|Vector)} args If given a number, both components are added with this. If given a Vector, the add operation is component-wise
   * @returns {this} this
   */
  add(...args) {
    for (let arg of args) {
      if (arg > 0 || arg <= 0) {
        this.x = this.x + arg;
        this.y = this.y + arg;
      } else {
        this.x = this.x + arg.x;
        this.y = this.y + arg.y;
      }
    }
    return this;
  }

  /**
   * Subtracts given operand(s) from the current x and y
   * @param  {...(number|Vector)} args If given a number, both components have the number taken away from them. If given a Vector, the subtract operation is component-wise
   * @returns {this} this
   */
  sub(...args) {
    for (let arg of args) {
      if (arg > 0 || arg <= 0) {
        this.x = this.x - arg;
        this.y = this.y - arg;
      } else {
        this.x = this.x - arg.x;
        this.y = this.y - arg.y;
      }
    }
    return this;
  }

  /**
   * Multiplies the current x and y with given operand(s)
   * @param  {...(number|Vector)} args If given a number, both components are multiplied by this. If given a Vector, the multiply operation is component-wise
   * @returns {this} this
   */
  multiply(...args) {
    for (let arg of args) {
      if (arg > 0 || arg <= 0) {
        this.x = this.x * arg;
        this.y = this.y * arg;
      } else {
        this.x = this.x * arg.x;
        this.y = this.y * arg.y;
      }
    }
    return this;
  }

  /**
   * Divides the current x and y by the given operand(s)
   * @param  {...(number|Vector)} args If given a number, both components are divided by this. If given a Vector, the divide operation is component-wise
   * @returns {this} this
   */
  divide(...args) {
    for (let arg of args) {
      if (arg > 0 || arg <= 0) {
        this.x = this.x / arg;
        this.y = this.y / arg;
      } else {
        this.x = this.x / arg.x;
        this.y = this.y / arg.y;
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
  lerp(other, t) {
    return new Vector(
      this.x - (this.x - other.x) * t,
      this.y - (this.y - other.y) * t
    );
  }

  /**
   * Computes the dot product with a supplied vector
   * @param {Vector} other Vector to dot product with
   * @returns {number} Dot product
   */
  dot(other) {
    return this.x * other.x + this.y * other.y;
  }

  /**
   * Returns the max of x or y, whichever component is bigger
   * @returns {number} the value of the bigger component
   */
  getMax() {
    return Math.max(this.x, this.y);
  }
  /**
   * Returns the min of x or y, whichever component is smaller
   * @returns {number} the value of the smaller component
   */
  getMin() {
    return Math.min(this.x, this.y);
  }

  /**
   * Sets the "head" of the current vector to a given value
   * @param {(number|Vector)} xOrVec X component of the given coordinates. Or a vector to copy if supplied instead.
   * @param {number} [y] Y component of the given coordinates
   * @returns {this} this
   */
  setHead(xOrVec, y) {
    if (xOrVec > 0 || xOrVec <= 0 || y > 0 || y <= 0) {
      this.x = xOrVec;
      this.y = y;
    } else {
      this.x = xOrVec.x;
      this.y = xOrVec.y;
    }

    return this;
  }

  /**
   * Computes the squared magnitude of this vector
   * @returns {number} Squared magnitude of this vector
   */
  getSquaredMagnitude() {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * Computes the magnitude of this vector
   * @returns {number} Magnitude of this vector
   */
  getMagnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Sets the magnitude of this vector
   * @param {number} mag New magnitude to set to
   * @returns {this} this
   */
  setMagnitude(mag) {
    const magRatio = mag / Math.sqrt(this.x * this.x + this.y * this.y);
    this.x *= magRatio;
    this.y *= magRatio;

    return this;
  }

  /**
   * Returns a new normalised version of this vector
   * @returns {Vector} Normalised vector
   */
  getNorm() {
    const magnitude = Math.sqrt(this.x * this.x + this.y * this.y);
    return new Vector(this.x / magnitude, this.y / magnitude);
  }

  /**
   * Normalises this vector
   * @returns {this} this
   */
  normalise() {
    const magnitude = Math.sqrt(this.x * this.x + this.y * this.y);
    this.x /= magnitude;
    this.y /= magnitude;
    return this;
  }

  /**
   * Sets each component of this vector to it's absolute value
   * @returns {this} this
   */
  abs() {
    this.x = Math.abs(this.x);
    this.y = Math.abs(this.y);
    return this;
  }

  /**
   * Get the sign of each component in this vector
   * @returns {Vector} The signs of this vector where 1 >= 0 and -1 < 0
   */
  getSign() {
    const x = this.x >= 0 ? 1 : -1;
    const y = this.y >= 0 ? 1 : -1;
    return new Vector(x, y);
  }

  /**
   * Gets the angle of this vector
   * @returns {number} Angle between 0 and 2 * PI
   */
  getAngle() {
    const x = this.x ? this.x : 0;
    const y = this.y ? this.y : 0;
    if (x >= 0 && y >= 0) return Math.atan(y / x);
    else if (x >= 0) return (Math.PI * 3) / 2 + Math.atan(x / -y);
    else if (y >= 0) return Math.PI - Math.atan(y / -x);
    else return (Math.PI * 3) / 2 - Math.atan(x / y);
  }

  /**
   * Sets the angle of this vector
   * @param {number} angle Angle to set to
   * @returns {this} this
   */
  setAngle(angle) {
    const magnitude = Math.sqrt(this.x * this.x + this.y * this.y);
    this.x = magnitude * Math.cos(angle);
    this.y = magnitude * Math.sin(angle);

    return this;
  }

  /**
   * Copies this vector into a dupelicate
   * @returns {Vector} Dupelicated version of this vector
   */
  copy() {
    return new Vector(this);
  }

  /**
   * Tests if this vector and another have equal components
   * @param {Vector} other
   * @returns {boolean} If they are equal
   */
  equals(other) {
    return this.x === other.x && this.y === other.y;
  }

  toString() {
    return `x:${this.x},y:${this.y}`;
  }

  /**
   * Parses a string and tries to make a vector out of it
   * @param {string} str Vector string in the format of "x:NUMBER,y:NUMBER"
   * @returns {(Vector|void)} A vector if the x and y components have been found, else void
   */
  static parseString(str) {
    const tokens = /^x:([^,]+),y:(.+)$/.exec(str);
    if (tokens) {
      return new Vector(Number(tokens[1]), Number(tokens[2]));
    }
  }

  static get ZERO() {
    return new Vector(0, 0);
  }
  static get ONE() {
    return new Vector(1, 1);
  }

  static get RIGHT() {
    return new Vector(1, 0);
  }
  static get LEFT() {
    return new Vector(-1, 0);
  }
  static get DOWN() {
    return new Vector(0, 1);
  }
  static get UP() {
    return new Vector(0, -1);
  }
}

TimeAnalysis.registerMethods(Vector);
