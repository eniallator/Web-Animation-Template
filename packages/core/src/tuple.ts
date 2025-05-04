export const tuple = <const T extends unknown[]>(...tuple: T) => tuple;

type RecursionLimit = 1001;

export type FixedLengthTuple<
  T,
  N extends number,
  A extends T[] = [T],
> = A["length"] extends RecursionLimit
  ? [T, ...T[]]
  : A["length"] extends N
    ? A
    : FixedLengthTuple<T, N, [...A, T]>;
