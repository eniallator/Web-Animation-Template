export class IncompatibleVector extends Error {
  name = "IncompatibleVector" as const;
}

export const incompatibleVector = (size: number): IncompatibleVector =>
  new IncompatibleVector(`Incompatible vector of size ${size}`);

export class IncompatibleOperation extends Error {
  name = "IncompatibleOperation" as const;
}

export const incompatibleOperation = (
  size: number,
  isMin: boolean = false
): IncompatibleOperation =>
  new IncompatibleOperation(
    `Requires ${isMin ? "at least " : ""}a ${size}D vector`
  );

export class OutOfBounds extends Error {
  name = "OutOfBounds" as const;
}

export const outOfBounds = (index: number, size: number): OutOfBounds =>
  new OutOfBounds(`Index ${index} out of bounds for vector of size ${size}`);
