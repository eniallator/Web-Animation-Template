import Vector from ".";
import { hasKey, isNumber } from "../guard";
import { checkExhausted } from "../utils";
import {
  VectorArg,
  MinSizeComponents,
  Components,
  AnyComponents,
} from "./types";

export function vectorArgAccessor<N extends number | undefined>(
  arg: VectorArg<N>,
  size: N
): (i: number) => number {
  switch (true) {
    case isNumber(arg):
      return () => arg;

    case isVector(size)(arg):
      return (i) => arg.valueOf(i);

    default:
      return checkExhausted(arg);
  }
}

export function isComponents(value: unknown): value is AnyComponents {
  return Array.isArray(value) && value.length >= 1 && value.every(isNumber);
}

export function isMin2D(
  components: AnyComponents
): components is MinSizeComponents<2, (typeof components)["length"]> {
  return components.length >= 2;
}

export function isMin3D(
  components: AnyComponents
): components is MinSizeComponents<3, (typeof components)["length"]> {
  return components.length >= 3;
}

export function isMin4D(
  components: AnyComponents
): components is MinSizeComponents<4, (typeof components)["length"]> {
  return components.length >= 4;
}

export function is2D(components: AnyComponents): components is Components<2> {
  return components.length === 2;
}

export function is3D(components: AnyComponents): components is Components<3> {
  return components.length === 3;
}

export function isSameSize<
  A extends number | undefined,
  B extends number | undefined
>(a: Vector<A>, b: Vector<B>): boolean {
  return a.size === b.size;
}

export function toAnyComponents<N extends number | undefined>(
  c: Components<N>
): AnyComponents {
  return c;
}

export function isAnyVector(
  value: unknown
): value is Vector<number | undefined> {
  return hasKey(value, "type", (type): type is "Vector" => type === "Vector");
}

export function isVector<N extends number | undefined>(n: N) {
  return (value: unknown): value is Vector<N> =>
    isAnyVector(value) && (n == null || value.size === n);
}
