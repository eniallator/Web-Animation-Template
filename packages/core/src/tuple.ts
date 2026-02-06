import type { RecursionLimit } from "./maths.ts";

export const tuple = <const T extends unknown[]>(...tuple: T) => tuple;

export type FillTuple<
  T,
  N extends number,
  A extends T[] = [],
> = A["length"] extends RecursionLimit
  ? [T, ...T[]]
  : A["length"] extends N
    ? A
    : FillTuple<T, N, [...A, T]>;
