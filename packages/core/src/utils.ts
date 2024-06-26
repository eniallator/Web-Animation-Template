import { Guard, isObject } from "./guard.js";

export function checkExhausted(value: never): never {
  throw new Error(`Value not exhausted: ${JSON.stringify(value)}`);
}

export function filterAndMap<I, O>(
  arr: I[],
  mapper: (val: I, index: number, arr: I[]) => O | null | undefined
): O[] {
  return arr.reduce((acc: O[], item, i, arr) => {
    const mapped = mapper(item, i, arr);
    return mapped != null ? [...acc, mapped] : acc;
  }, []);
}

export function findAndMap<I, O>(
  arr: I[],
  mapper: (val: I, index: number, arr: I[]) => O | null | undefined
): O | null {
  for (let i = 0; i < arr.length; i++) {
    const output = mapper(arr[i], i, arr);

    if (output != null) {
      return output;
    }
  }
  return null;
}

export function formatDate(date: Date): string {
  return date
    .toLocaleString()
    .replace(
      /(?<d>\d+)\/(?<m>\d+)\/(?<y>\d+)[^\d]*(?<t>\d+:\d+).*/,
      "$<y>-$<m>-$<d>T$<t>"
    );
}

export function hasKey<K extends string>(
  value: unknown,
  key: K
): value is { [k in K]: unknown };
export function hasKey<K extends string, V>(
  value: unknown,
  key: K,
  guard: Guard<V>
): value is { [k in K]: V };
export function hasKey<K extends string, V>(
  value: unknown,
  key: K,
  guard?: Guard<V>
): value is { [k in K]: unknown } {
  return (
    isObject(value) && key in value && (guard == null || guard(value[key]))
  );
}

export function isEqual<T>(a: T, b: T): boolean {
  return (
    a === b ||
    (a != null &&
      b != null &&
      typeof a === "object" &&
      typeof b === "object" &&
      (Array.isArray(a)
        ? Array.isArray(b) &&
          a.length === b.length &&
          a.every((v, i) => isEqual(v, b[i]))
        : Object.keys(a).length === Object.keys(b).length &&
          Object.entries(a).every(
            ([k, v]) => k in b && isEqual(v, (b as Record<string, unknown>)[k])
          )))
  );
}

export function tuple<const T extends unknown[]>(...tuple: T): T {
  return tuple;
}

export function raise<T = never>(err: Error): T {
  throw err;
}

export type RemainingKeys<O extends object, T extends object> = Exclude<
  keyof O,
  keyof T
>;
