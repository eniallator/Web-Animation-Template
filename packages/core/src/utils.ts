import { Guard } from "deep-guards";

import { Option } from "./option.js";

export const tuple = <const T extends unknown[]>(...tuple: T): T => tuple;

export const positiveMod = (a: number, b: number): number => ((a % b) + b) % b;

export const raise = (error: Error): never => {
  throw error;
};

export const checkExhausted = (value: never): never => {
  throw new Error(`Value not exhausted: ${JSON.stringify(value)}`);
};

export const iterable = <T>(value: T): Iterable<T> =>
  (function* () {
    yield value;
  })();

export const formatDate = (date: Date) =>
  date.toISOString().replace(/z.*$/i, "");

const isOption: Guard<Option<unknown>> = value => value instanceof Option;
export const filterAndMap = <I, O>(
  arr: readonly I[],
  mapper: (
    val: I,
    index: number,
    arr: readonly I[]
  ) => Option<O> | O | null | undefined
): O[] =>
  arr.reduce((acc: O[], item, i, arr) => {
    const mappedOrOpt = mapper(item, i, arr);
    const mapped = isOption(mappedOrOpt)
      ? mappedOrOpt.getOrNull()
      : mappedOrOpt;
    return mapped != null ? [...acc, mapped] : acc;
  }, []);

export const findAndMap = <I, O>(
  arr: readonly I[],
  mapper: (
    val: I,
    index: number,
    arr: readonly I[]
  ) => Option<O> | O | null | undefined
): O | null => {
  for (let i = 0; i < arr.length; i++) {
    const mappedOrOpt = mapper(arr[i] as I, i, arr);
    const mapped = isOption(mappedOrOpt)
      ? mappedOrOpt.getOrNull()
      : mappedOrOpt;
    if (mapped != null) return mapped;
  }
  return null;
};
