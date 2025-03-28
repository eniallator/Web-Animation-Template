import { Guard } from "deep-guards";

import { Option } from "./option.ts";

export const tuple = <const T extends unknown[]>(...tuple: T): T => tuple;

export const positiveMod = (a: number, b: number): number => ((a % b) + b) % b;

export const raise = (error: Error): never => {
  throw error;
};

export const checkExhausted = (value: never): never => {
  throw new Error(`Value not exhausted: ${JSON.stringify(value)}`);
};

export const formatIsoDate = (date: Date) =>
  date.toISOString().replace(/z.*$/i, "");

export const formatDate = (date: Date): string =>
  date
    .toLocaleString()
    .replace(
      /(?<d>\d+)\/(?<m>\d+)\/(?<y>\d+)[^\d]*(?<t>\d+:\d+:\d+).*/,
      "$<y>-$<m>-$<d>T$<t>"
    );

export const calculateAngle = (x: number, y: number) => {
  if (x === 0 && y === 0) return 0;
  else if (y === 0) return x > 0 ? 0 : Math.PI;
  else if (x === 0) return y > 0 ? Math.PI / 2 : (Math.PI * 3) / 2;
  else if (x > 0 && y > 0) return Math.PI / 2 - Math.atan(x / y);
  else if (y > 0) return Math.PI - Math.atan(y / -x);
  else if (x > 0) return (Math.PI * 3) / 2 + Math.atan(x / -y);
  else return (Math.PI * 3) / 2 - Math.atan(x / y);
};

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
