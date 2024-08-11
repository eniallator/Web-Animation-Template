import { hasKey, raise } from "./utils.js";

export type Guard<T> = (value: unknown) => value is T;

export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function isInteger(value: unknown): value is number {
  return Number.isInteger(value);
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isFunction(value: unknown): value is () => unknown {
  return typeof value === "function";
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export function isBoolean(value: unknown): value is boolean {
  return value === true || value === false;
}

export function isNullable<T>(guard: Guard<T>): Guard<T | null | undefined> {
  return (value: unknown): value is T | null | undefined =>
    value == null || guard(value);
}

export function isNonNullable<T>(value: T | null | undefined): value is T {
  return value != null;
}

export function isOneOf<
  const T extends string | number | boolean | null | undefined,
>(...values: T[]): Guard<T> {
  return (value: unknown): value is T => values.includes(value as T);
}

export function isArrayOf<T>(guard: Guard<T>): Guard<T[]> {
  return (value): value is T[] => Array.isArray(value) && value.every(guard);
}

export function isRecordOf<K extends string | number | symbol, V>(
  keyGuard: Guard<K>,
  valueGuard: Guard<V>
): Guard<Record<K, V>> {
  return (value): value is Record<K, V> =>
    isObject(value) &&
    Object.entries(value).every(
      ([key, value]) => keyGuard(key) && valueGuard(value)
    );
}

export function guardOrThrow<T>(
  value: unknown,
  guard: Guard<T>,
  hint?: string
): T {
  return guard(value) ? value : raise<T>(new Error(hint ?? "Guard error"));
}

export function hasType<const S extends string>(name: S): Guard<{ type: S }> {
  return val => hasKey(val, "type", (type): type is S => type === name);
}
