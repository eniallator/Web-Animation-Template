import { isArrayOf, isNumber } from "deep-guards";

import { Vector } from "./index.ts";

import type { Guard } from "deep-guards";
import type { AnyComponents, Components } from "./types.ts";

export const isAnyComponents = (value: unknown): value is AnyComponents =>
  isArrayOf(isNumber)(value) && value.length >= 1;

export const toAnyComponents = (components: AnyComponents) => components;

export const isAnyVector: Guard<Vector> = value => value instanceof Vector;

export const isVector =
  <N extends number | undefined>(size: N) =>
  (value: unknown): value is Vector<N> =>
    isAnyVector(value) && (size === undefined || value.size() === size);

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
