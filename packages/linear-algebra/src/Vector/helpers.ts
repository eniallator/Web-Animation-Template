import { checkExhausted } from "@web-art/core";
import { Guard, isArrayOf, isExact, isNumber, isObjectOf } from "deep-guards";

import { Vector } from "./index.js";
import { AnyComponents, Components, VectorArg } from "./types.js";

export function vectorArgAccessor<N extends number | undefined>(
  arg: VectorArg<N>,
  size: N
): (i: number) => number {
  switch (true) {
    case isNumber(arg):
      return () => arg;

    case isVector(size)(arg):
      return i => arg.valueOf(i);

    default:
      return checkExhausted(arg);
  }
}

export const isComponents = (value: unknown): value is AnyComponents =>
  isArrayOf(isNumber)(value) && value.length >= 1;

export const isSize =
  <const N extends number>(size: N) =>
  (components: AnyComponents): components is Components<N> =>
    components.length === size;

export const isSameSize = <
  A extends number | undefined,
  B extends number | undefined,
>(
  a: Vector<A>,
  b: Vector<B>
): boolean => a.size() === b.size();

export const toAnyComponents = (components: AnyComponents) => components;

export const isAnyVector = isObjectOf({
  type: isExact("Vector", false),
}) as unknown as Guard<Vector>;

export const isVector =
  <N extends number | undefined>(n: N) =>
  (value: unknown): value is Vector<N> =>
    isAnyVector(value) && (n == null || value.size() === n);
