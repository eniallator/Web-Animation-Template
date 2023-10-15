export class IncompatibleVectors extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IncompatibleVectors";
  }
}

export class IncompatibleOperation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IncompatibleOperation";
  }
}
