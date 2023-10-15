import Vector from ".";
import { isNumber } from "../utils";
import {
  Components,
  VectorArg,
  MinSize,
  Components2D,
  Components3D,
  Components4D,
} from "./types";

export function narrowArg<C extends Components>(
  param: VectorArg<C>
): [number, null] | [null, Vector<C>] {
  return isNumber(param) ? [param, null] : [null, param];
}

export function isComponents(value: unknown): value is Components {
  return Array.isArray(value) && value.length >= 1 && value.every(isNumber);
}

export function isMin2D(
  components: Components
): components is MinSize<Components2D> {
  return components.length >= 2;
}

export function isMin3D(
  components: Components
): components is MinSize<Components3D> {
  return components.length >= 3;
}

export function isMin4D(
  components: Components
): components is MinSize<Components4D> {
  return components.length >= 4;
}

export function is2D(components: Components): components is Components2D {
  return components.length === 2;
}

export function is3D(components: Components): components is Components2D {
  return components.length === 2;
}

export function isSameSize<C extends Components>(
  a: Vector<C>,
  b: Vector<Components>
): boolean {
  return a.size === b.size;
}