export type Tagged<T, N extends string> = T & { _tag_: N };
export type Untag<T extends Tagged<unknown, string>> = Omit<T, "_tag_">;

export const unsafeTag =
  <T extends Tagged<unknown, string>>() =>
  (value: Untag<T>): T =>
    value as T;
