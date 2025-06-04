export const tuple = <const T extends unknown[]>(...tuple: T) => tuple;

type RecursionLimit = 1001;

export type FillTuple<
  T,
  N extends number,
  A extends T[] = [T],
> = A["length"] extends RecursionLimit
  ? [T, ...T[]]
  : A["length"] extends N
    ? A
    : FillTuple<T, N, [...A, T]>;
