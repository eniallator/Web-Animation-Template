import { Vector } from "./index.js";

type RecursionLimit = 501;

export type AnyComponents = [number, ...number[]];

export type Components<
  N extends number | undefined,
  A extends number[] = [number],
> = undefined extends N
  ? AnyComponents
  : A["length"] extends RecursionLimit
    ? AnyComponents
    : A["length"] extends N
      ? A
      : Components<N, [...A, number]>;

export type MinSize<S extends number, N extends number | undefined> =
  Components<N> extends [...Components<S>, ...number[]] ? N : never;

export type VectorArg<N extends number | undefined> = Vector<N> | number;
