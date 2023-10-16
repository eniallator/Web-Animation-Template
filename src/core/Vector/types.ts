import Vector from ".";

export type Components = [number, ...Array<number>];
export type Components2D = [number, number];
export type Components3D = [...Components2D, number];
export type Components4D = [...Components3D, number];

export type ComponentsND<
  N extends number,
  A extends Array<number> = [number]
> = A["length"] extends 20
  ? [...A, ...Array<number>]
  : A["length"] extends N
  ? A
  : ComponentsND<N, [...A, number]>;

export type MinSize<C extends Components> = [...C, ...Array<number>];

export type VectorArg<C extends Components> = Vector<C> | number;

export type ArrayToNumber<A extends Array<unknown>> = A extends [
  unknown,
  ...infer R
]
  ? [number, ...ArrayToNumber<R>]
  : [];
