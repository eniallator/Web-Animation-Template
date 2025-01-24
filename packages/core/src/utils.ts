import { isFunction, isObjectOf } from "deep-guards";

import { Option } from "./option.js";

export const tuple = <const T extends unknown[]>(...tuple: T): T => tuple;

export const posMod = (a: number, b: number): number => ((a % b) + b) % b;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export const raise = <T = never>(err: Error): T => {
  throw err;
};

export const checkExhausted = (value: never): never => {
  throw new Error(`Value not exhausted: ${JSON.stringify(value)}`);
};

export const iterable = <T>(fn: () => T): Iterable<T> =>
  (function* () {
    yield fn();
  })();

export const formatDate = (date: Date): string =>
  date
    .toLocaleString()
    .replace(
      /(?<d>\d+)\/(?<m>\d+)\/(?<y>\d+)[^\d]*(?<t>\d+:\d+).*/,
      "$<y>-$<m>-$<d>T$<t>"
    );

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
    const mapped = isObjectOf({ getOrNull: isFunction })(mappedOrOpt)
      ? mappedOrOpt.getOrNull()
      : mappedOrOpt;
    return mapped != null ? [...acc, mapped] : acc;
  }, []);

export const findAndMap = <I, O>(
  arr: readonly I[],
  mapper: (val: I, index: number, arr: readonly I[]) => O | null | undefined
): O | null => {
  for (let i = 0; i < arr.length; i++) {
    const output = mapper(arr[i] as I, i, arr);

    if (output != null) {
      return output;
    }
  }
  return null;
};
