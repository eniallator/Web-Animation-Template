import {
  BaseInputConfig,
  ConfigCollection,
  ConfigCollectionFields,
  ConfigPart,
  SerialisableConfig,
  StateItem,
} from "./types";

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
      ? Array<DeriveDefaults<F>>
      : Exclude<C["default"], undefined>
    : null;

// export type State<C extends ConfigPart<string>> = {
//   [P in C as P extends ConfigPart<infer I> ? I : never]: P extends ConfigPart<
//     infer I
//   >
//     ? StateItem<I, P>
//     : never;
// };
export type State<C extends ConfigPart<string>> = {
  [P in C as P["id"]]: StateItem<P>;
};

export type PassedState<C extends ConfigPart<string>> = {
  [P in C as P["id"]]: DeriveStateType<P>;
};
