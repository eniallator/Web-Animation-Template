export class IncompatibleVector extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IncompatibleVector";
  }
}

export class IncompatibleOperation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IncompatibleOperation";
  }
}

export class OutOfBounds extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OutOfBounds";
  }
}
