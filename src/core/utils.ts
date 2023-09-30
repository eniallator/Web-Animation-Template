export type Guard<T> = (value: unknown) => value is T;

export function checkExhausted(value: never): never {
  throw new Error(`Value not exhausted: ${JSON.stringify(value)}`);
}

export function replaceItem<T>(
  arr: Array<T>,
  index: number,
  item?: T
): Array<T> {
  const copy = [...arr];

  if (item != null) {
    copy.splice(index, 1, item);
  } else {
    copy.splice(index, 1);
  }

  return copy;
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

export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export function isArrayOf<T>(guard: Guard<T>): Guard<Array<T>> {
  return (value): value is Array<T> =>
    Array.isArray(value) && value.every(guard);
}

export function hasKey<K extends string, V>(
  value: unknown,
  key: K,
  guard: Guard<V>
): value is { [k in K]: V } {
  return isObject(value) && key in value && guard(value[key]);
}

export function isEqual<T>(a: T, b: T): boolean {
  return Array.isArray(a)
    ? Array.isArray(b) &&
        a.length === b.length &&
        a.every((v, i) => isEqual(v, b[i]))
    : a === b;
}

export function formatDate(date: Date): string {
  return date
    .toLocaleString()
    .replace(
      /(?<d>\d+)\/(?<m>\d+)\/(?<y>\d+)[^\d]*(?<t>\d+:\d+).*/,
      "$<y>-$<m>-$<d>T$<t>"
    );
}
