import { raise } from "@web-art/core";
import { Guard, isArrayOf, isNumber } from "deep-guards";

import { Vector } from "./index.ts";
import { AnyComponents, Components, VectorArg } from "./types.ts";

export const isAnyComponents = (value: unknown): value is AnyComponents =>
  isArrayOf(isNumber)(value) && value.length >= 1;

export const toAnyComponents = (components: AnyComponents) => components;

export const isAnyVector: Guard<Vector> = value => value instanceof Vector;

export const isVector =
  <N extends number | undefined>(n: N) =>
  (value: unknown): value is Vector<N> =>
    isAnyVector(value) && (n === undefined || value.size() === n);

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

export const vectorArgAccessor = <N extends number | undefined>(
  arg: VectorArg<N>,
  size: N
): ((i: number) => number) =>
  isNumber(arg)
    ? () => arg
    : isVector(size)(arg)
      ? i => arg.valueOf(i)
      : raise(new Error(`Unknown vector argument ${arg}`));
