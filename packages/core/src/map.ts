import { Option } from "./option.ts";

import type { Guard } from "deep-guards";

type MapFn<I, O> = (
  val: I,
  index: number,
  arr: readonly I[]
) => Option<O> | O | null | undefined;

const isOption: Guard<Option<unknown>> = value => value instanceof Option;

export const filterAndMap = <I, O>(
  arr: readonly I[],
  callback: MapFn<I, O>
): O[] =>
  arr.reduce((acc: O[], item, i, arr) => {
    const outOrOpt = callback(item, i, arr);
    const out = isOption(outOrOpt) ? outOrOpt.getOrNull() : outOrOpt;
    return out != null ? [...acc, out] : acc;
  }, []);

export const findAndMap = <I, O>(
  arr: readonly I[],
  callback: MapFn<I, O>
): O | null => {
  for (let i = 0; i < arr.length; i++) {
    const outOrOpt = callback(arr[i] as I, i, arr);
    const out = isOption(outOrOpt) ? outOrOpt.getOrNull() : outOrOpt;
    if (out != null) return out;
  }
  return null;
};
