import Vector from ".";

type RecursionLimit = 501;

export type AnyComponents = [number, ...Array<number>];

export type Components<
  N extends number | undefined,
  A extends Array<number> = [number],
> = undefined extends N
  ? AnyComponents
  : A["length"] extends RecursionLimit
    ? AnyComponents
    : A["length"] extends N
      ? A
      : Components<N, [...A, number]>;

export type MinSize<S extends number, N extends number | undefined> =
  Components<N> extends [...Components<S>, ...Array<number>] ? N : never;

export type VectorArg<N extends number | undefined> = Vector<N> | number;
