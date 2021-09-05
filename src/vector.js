class Vector {
  constructor(xOrVec, y) {
    this.setHead(xOrVec, y);
  }

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

  lerp(other, t) {
    return new Vector(
      this.x + (this.x - other.x) * t,
      this.y + (this.y - other.y) * t
    );
  }

  dot(other) {
    return this.x * other.x + this.y * other.y;
  }

  getMax() {
    return Math.max(this.x, this.y);
  }
  getMin() {
    return Math.min(this.x, this.y);
  }

  setHead(xOrVec, y) {
    if (y > 0 || y <= 0) {
      this.x = xOrVec;
      this.y = y;
    } else {
      this.x = xOrVec.x;
      this.y = xOrVec.y;
    }

    return this;
  }

  getSquaredMagnitude() {
    return this.x * this.x + this.y * this.y;
  }

  getMagnitude() {
    return Math.sqrt(this.getSquaredMagnitude());
  }

  setMagnitude(mag) {
    const magRatio = mag / this.getMagnitude();
    this.x *= magRatio;
    this.y *= magRatio;

    return this;
  }

  getNorm() {
    const magnitude = this.getMagnitude();
    return new Vector(this.x / magnitude, this.y / magnitude);
  }

  normalise() {
    const magnitude = this.getMagnitude();
    this.setHead(this.x / magnitude, this.y / magnitude);
    return this;
  }

  abs() {
    this.x = Math.abs(this.x);
    this.y = Math.abs(this.y);
    return this;
  }

  getSign() {
    const x = this.x >= 0 ? 1 : -1;
    const y = this.y >= 0 ? 1 : -1;
    return new Vector(x, y);
  }

  getAngle() {
    const x = this.x ? this.x : 0;
    const y = this.y ? this.y : 0;
    const quadrants = {
      "x:1,y:1": () => (!y ? 0 : Math.atan(y / x)),
      "x:-1,y:1": () => (!x ? Math.PI / 2 : Math.PI - Math.atan(y / -x)),
      "x:-1,y:-1": () => (!y ? Math.PI : (Math.PI * 3) / 2 - Math.atan(x / y)),
      "x:1,y:-1": () => (!y ? 0 : (Math.PI * 3) / 2 + Math.atan(x / -y)),
    };
    return quadrants[this.getSign().toString()]();
  }

  setAngle(angle) {
    const magnitude = this.getMagnitude();
    this.x = magnitude * Math.cos(angle);
    this.y = magnitude * Math.sin(angle);

    return this;
  }

  copy() {
    return new Vector(this);
  }

  equals(other) {
    return this.x === other.x && this.y === other.y;
  }

  toString() {
    return `x:${this.x},y:${this.y}`;
  }
}

Vector.ZERO = new Vector(0, 0);
Vector.ONE = new Vector(1, 1);

Vector.RIGHT = new Vector(1, 0);
Vector.LEFT = new Vector(-1, 0);
Vector.DOWN = new Vector(0, 1);
Vector.UP = new Vector(0, -1);
