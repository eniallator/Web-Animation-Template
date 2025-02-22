export type ObjectKey = string | number | symbol;
export type Entry<R extends Record<ObjectKey, unknown>> = [keyof R, R[keyof R]];

export const typedToEntries = <R extends Record<ObjectKey, unknown>>(
  obj: R
): Entry<R>[] => Object.entries(obj) as Entry<R>[];

export const typedFromEntries = <R extends Record<ObjectKey, unknown>>(
  entries: Entry<R>[]
): R => Object.fromEntries(entries) as R;

export const mapObject = <
  I extends Record<ObjectKey, unknown>,
  O extends Record<ObjectKey, unknown>,
>(
  obj: I,
  mapper: (entry: Entry<I>, index: number, array: Entry<I>[]) => Entry<O>
): O => typedFromEntries(typedToEntries(obj).map(mapper));
