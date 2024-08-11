import { checkExhausted, hasType, isNumber } from "@web-art/core";
import { Vector } from "./index.js";
import { AnyComponents, Components, MinSize, VectorArg } from "./types.js";

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

export function isComponents(value: unknown): value is AnyComponents {
  return Array.isArray(value) && value.length >= 1 && value.every(isNumber);
}

export function isSize<const N extends number>(size: N) {
  return (components: AnyComponents): components is Components<N> =>
    components.length === size;
}

export function isMinSize<const N extends number>(size: N) {
  return (
    components: AnyComponents
  ): components is Components<MinSize<N, (typeof components)["length"]>> =>
    components.length >= size;
}

export function isSameSize<
  A extends number | undefined,
  B extends number | undefined,
>(a: Vector<A>, b: Vector<B>): boolean {
  return a.size === b.size;
}

export function toAnyComponents<N extends number | undefined>(
  c: Components<N>
): AnyComponents {
  return c;
}

export const isAnyVector = (value: unknown): value is Vector =>
  hasType("Vector")(value);

export function isVector<N extends number | undefined>(n: N) {
  return (value: unknown): value is Vector<N> =>
    isAnyVector(value) && (n == null || value.size === n);
}
