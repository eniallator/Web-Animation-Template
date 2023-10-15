import Vector from ".";

export type Components = [number, ...Array<number>];
export type Components2D = [number, number];
export type Components3D = [...Components2D, number];
export type Components4D = [...Components3D, number];

export type MinSize<C extends Components> = [...C, ...Array<number>];

export type VectorArg<C extends Components> = Vector<C> | number;

export type MinValidatedReturnType<
  C extends Components,
  R extends Components,
  O
> = C extends [...R, ...Array<number>] ? O : never;

export type ValidatedReturnType<
  C extends Components,
  R extends Components,
  O
> = C extends R ? O : never;
