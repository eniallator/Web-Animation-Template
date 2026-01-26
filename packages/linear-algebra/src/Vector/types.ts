import type { Add, FillTuple } from "@web-art/core";
import type { Vector } from "./index.ts";

export type AnyComponents = [number, ...number[]];

export type Components<N extends number | undefined> = undefined extends N
  ? AnyComponents
  : FillTuple<number, NonNullable<N>>;

export type MinSize<S extends number, N extends number | undefined> =
  Components<N> extends [...Components<S>, ...number[]] ? N : never;

export type VectorArg<N extends number | undefined> = Vector<N> | number;

export type VectorCallback<R, A extends number[] = number[]> = (
  value: number,
  index: number,
  array: A
) => R;

export type VectorReduceCallback<R, A extends number[] = number[]> = (
  accumulator: number,
  value: number,
  index: number,
  array: A
) => R;

export type AddOpts<
  A extends number | undefined,
  B extends number | undefined,
> = A extends number ? (B extends number ? Add<A, B> : undefined) : undefined;
