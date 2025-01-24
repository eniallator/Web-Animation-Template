export type ObjectKey = string | number | symbol;
export type Entry<O extends Record<ObjectKey, unknown>> = [keyof O, O[keyof O]];

export const typedToEntries = <R extends Record<ObjectKey, unknown>>(
  obj: R
): Entry<R>[] => Object.entries(obj) as Entry<R>[];

export const typedFromEntries = <R extends Record<ObjectKey, unknown>>(
  entries: Entry<R>[]
): R => Object.fromEntries(entries) as R;

export const mapObject = <
  A extends Record<ObjectKey, unknown>,
  B extends Record<ObjectKey, unknown>,
>(
  obj: A,
  mapper: (entry: Entry<A>) => Entry<B>
): B => typedFromEntries(typedToEntries(obj).map(mapper));
