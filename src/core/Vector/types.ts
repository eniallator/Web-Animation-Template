import Vector from ".";

export type AnyComponents = [number, ...Array<number>];

export type Components1D = [number];
export type Components2D = [...Components1D, number];
export type Components3D = [...Components2D, number];
export type Components4D = [...Components3D, number];

export type ComponentsND<
  N extends number,
  A extends Array<number> = Components1D
> = A["length"] extends 20
  ? AnyComponents
  : A["length"] extends N
  ? A
  : ComponentsND<N, [...A, number]>;

export type MinSize<C extends AnyComponents> = [...C, ...Array<number>];

export type VectorArg<C extends AnyComponents> = Vector<C> | number;

export type ArrayToNumber<A extends Array<unknown>> = A extends [
  unknown,
  ...infer R
]
  ? [number, ...ArrayToNumber<R>]
  : [];
