type DeepKeys<T extends readonly unknown[]> = {
  [K in keyof T]: keyof T[K];
}[Extract<keyof T, number>];

export type UnionWithAllKeys<
  T extends readonly unknown[],
  K extends string | number | symbol = DeepKeys<T>,
> = T extends [infer A, ...infer B]
  ?
      | (Partial<Record<Exclude<K, keyof A>, undefined>> & A)
      | UnionWithAllKeys<B, K>
  : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any) => unknown;

export const raise = (error: Error): never => {
  throw error;
};

export const checkExhausted = (value: never) =>
  raise(new Error(`Value not exhausted: ${JSON.stringify(value)}`));
