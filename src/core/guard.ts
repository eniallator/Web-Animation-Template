export type Guard<T> = (value: unknown) => value is T;

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
