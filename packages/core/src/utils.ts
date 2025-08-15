// https://www.hacklewayne.com/typescript-convert-union-to-tuple-array-yes-but-how
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Contra<T> = T extends any ? (arg: T) => void : never;

type InferContra<T> = [T] extends [(arg: infer I) => void] ? I : never;

type PickOne<T> = InferContra<InferContra<Contra<Contra<T>>>>;

type Union2Tuple<T> =
  PickOne<T> extends infer U
    ? Exclude<T, U> extends never
      ? [T]
      : [...Union2Tuple<Exclude<T, U>>, U]
    : never;

type DeepKeys<T extends readonly unknown[]> = {
  [K in keyof T]: keyof T[K];
}[Extract<keyof T, number>];

type UnionToPartialRecurse<
  T extends readonly unknown[],
  K extends string | number | symbol = DeepKeys<T>,
> = T extends [infer A, ...infer B]
  ?
      | (Partial<Record<Exclude<K, keyof A>, undefined>> & A)
      | UnionToPartialRecurse<B, K>
  : never;

/**
 * Lets you destructure types where keys only appear in _some_ of the cases.
 *
 * For example for the following:
 * type Test = { a: string } | { b: number }
 * const obj = {a: "foo"} as Test;
 *
 * Normally the following will type error saying that the properties aren't defined:
 * const {a, b} = obj;
 *
 * However this will not, as it will make Test equivalent to ({ a: string; b: undefined } | { a: undefined; b: number }):
 * const {a, b} = obj as UnionToPartial<Test>
 */
export type UnionToPartial<T> = UnionToPartialRecurse<Union2Tuple<T>>;

export type DiscriminatedParams<D, U> = {
  external: D & U;
  internal: D & UnionToPartial<U>;
};

export const raise = (error: Error): never => {
  throw error;
};

export const checkExhausted = (value: never) =>
  raise(new Error(`Value not exhausted: ${JSON.stringify(value)}`));
