import Vector from ".";
import { isNumber } from "../guard";
import { VectorArg, MinSizeVector, Components, AnyComponents } from "./types";

export function narrowArg<N extends number | undefined>(
  param: VectorArg<N>
): [number, null] | [null, Vector<N>] {
  return isNumber(param) ? [param, null] : [null, param];
}

export function isComponents(value: unknown): value is AnyComponents {
  return Array.isArray(value) && value.length >= 1 && value.every(isNumber);
}

export function isMin2D(
  components: AnyComponents
): components is MinSizeVector<2, (typeof components)["length"]> {
  return components.length >= 2;
}

export function isMin3D(
  components: AnyComponents
): components is MinSizeVector<3, (typeof components)["length"]> {
  return components.length >= 3;
}

export function isMin4D(
  components: AnyComponents
): components is MinSizeVector<4, (typeof components)["length"]> {
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
