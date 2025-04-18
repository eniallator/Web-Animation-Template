import { Option } from "./option.ts";

import type { Guard } from "deep-guards";

export const tuple = <const T extends unknown[]>(...tuple: T) => tuple;

export const positiveMod = (a: number, b: number) => ((a % b) + b) % b;

export const raise = (error: Error): never => {
  throw error;
};

export const checkExhausted = (value: never) =>
  raise(new Error(`Value not exhausted: ${JSON.stringify(value)}`));

export const formatIsoDate = (date: Date) =>
  date.toISOString().replace(/z.*$/i, "");

export const formatDate = (date: Date) =>
  date
    .toLocaleString()
    .replace(
      /(?<d>\d+)\/(?<m>\d+)\/(?<y>\d+)[^\d]*(?<t>[:\d]+).*/,
      "$<y>-$<m>-$<d>T$<t>"
    );

export const calculateAngle = (x: number, y: number): number => {
  if (x === 0 && y === 0) return 0;
  else if (y === 0) return x > 0 ? 0 : Math.PI;
  else if (x === 0) return y > 0 ? Math.PI / 2 : (Math.PI * 3) / 2;
  else if (x > 0 && y > 0) return Math.PI / 2 - Math.atan(x / y);
  else if (x > 0) return (Math.PI * 3) / 2 + Math.atan(x / -y);
  else if (y > 0) return Math.PI - Math.atan(y / -x);
  else return (Math.PI * 3) / 2 - Math.atan(x / y);
};

export const cartesianToPolar = (x: number, y: number) =>
  tuple(Math.hypot(x, y), calculateAngle(x, y));

export const polarToCartesian = (magnitude: number, angle: number) =>
  tuple(magnitude * Math.cos(angle), magnitude * Math.sin(angle));

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
    const outOrOpt = mapper(item, i, arr);
    const out = isOption(outOrOpt) ? outOrOpt.getOrNull() : outOrOpt;
    return out != null ? [...acc, out] : acc;
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
    const outOrOpt = mapper(arr[i] as I, i, arr);
    const out = isOption(outOrOpt) ? outOrOpt.getOrNull() : outOrOpt;
    if (out != null) return out;
  }
  return null;
};
