import { raise } from "./utils";

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

export function isObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isNullable<T>(guard: Guard<T>): Guard<T | undefined | null> {
  return (value: unknown): value is T | null => value == null || guard(value);
}

export function isOneOf<const T>(...values: T[]) {
  return (value: unknown): value is T => values.includes(value as T);
}

export function isArrayOf<T>(guard: Guard<T>): Guard<Array<T>> {
  return (value): value is Array<T> =>
    Array.isArray(value) && value.every(guard);
}

export function guardOrThrow<T>(
  value: unknown,
  guard: Guard<T>,
  hint?: string
): T {
  return guard(value) ? value : raise<T>(new Error(hint ?? "Guard error"));
}
