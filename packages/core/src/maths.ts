import { tuple } from "./tuple.ts";

import type { FillTuple } from "./tuple.ts";

export const cartesianToPolar = (x: number, y: number) =>
  tuple(Math.hypot(x, y), Math.atan2(y, x));

export const polarToCartesian = (magnitude: number, angle: number) =>
  tuple(magnitude * Math.cos(angle), magnitude * Math.sin(angle));

export const positiveMod = (a: number, b: number) => ((a % b) + b) % b;

export type RecursionLimit = 1001;

export type Decrement<N extends number> =
  FillTuple<unknown, N> extends [unknown, ...infer R] ? R["length"] : 0;

export type Increment<N extends number> = Extract<
  [...FillTuple<unknown, N>, unknown]["length"],
  number
>;

export type Add<A extends number, B extends number> = [
  ...FillTuple<unknown, A>,
  ...FillTuple<unknown, B>,
]["length"];

export type Subtract<
  A extends number,
  B extends number,
  I extends number = 0,
> = I extends RecursionLimit
  ? number
  : I extends B
    ? A
    : A extends 0
      ? number
      : Subtract<Decrement<A>, B, Increment<I>>;
