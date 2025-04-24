export type Tagged<T, N extends string> = T & { _tag_: N };

export const unsafeTag =
  <T, N extends string>() =>
  (value: T): Tagged<T, N> =>
    value as Tagged<T, N>;
