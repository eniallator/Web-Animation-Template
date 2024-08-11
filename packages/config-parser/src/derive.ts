import {
  BaseInputConfig,
  ConfigCollection,
  ConfigCollectionFields,
  ConfigPart,
  SerialisableConfig,
} from "./types.js";

export type DeriveDefaults<R extends ConfigCollectionFields> = {
  [K in keyof R]: R[K] extends BaseInputConfig<string, infer T>
    ? unknown extends T
      ? null
      : T
    : never;
};

export type DeriveStateType<C extends ConfigPart<string>> =
  C extends SerialisableConfig<string>
    ? C extends ConfigCollection<string, infer F>
      ? DeriveDefaults<F>[]
      : Exclude<C["default"], undefined>
    : null;

export type PassedState<C extends ConfigPart<string>> = {
  [P in C as P["id"]]: DeriveStateType<P>;
};

export type NarrowedPart<I extends C["id"], C extends ConfigPart<string>> = {
  [P in C as P extends ConfigPart<I> ? "part" : never]: P;
};

export type DeriveId<C extends ConfigPart<string>> = C["id"];

export type DeriveParts<A extends ConfigPart<string>[]> = A extends (infer C)[]
  ? C
  : never;
