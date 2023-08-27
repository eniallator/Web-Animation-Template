export type Guard<T> = (value: unknown) => value is T;

export function checkExhausted(value: never): never {
  throw new Error(`Value not exhausted: ${JSON.stringify(value)}`);
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

export function hasKey<K extends string, V>(
  value: unknown,
  key: K,
  guard: Guard<V>
): value is { [k in K]: V } {
  return isObject(value) && key in value && guard(value[key]);
}
