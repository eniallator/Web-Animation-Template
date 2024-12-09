export type WithId<T, I extends string> = T & { id: I };

export type DefaultType<C> = C extends { default?: infer T } ? T : null;

export type TupledStateType<C extends readonly unknown[]> = {
  [K in keyof C]: DefaultType<C[K]>;
};
export interface BaseConfig {
  tooltip?: string;
  attrs?: Record<string, string>;
}

export interface BaseInputConfig<T> extends BaseConfig {
  label?: string;
  default?: T;
}

export interface CheckboxConfig extends BaseInputConfig<boolean> {
  type: "Checkbox";
}

export interface NumberConfig extends BaseInputConfig<number> {
  type: "Number";
}

export interface RangeConfig extends BaseInputConfig<number> {
  type: "Range";
}

export interface ColorConfig extends BaseInputConfig<string> {
  type: "Color";
}

export interface TextConfig extends BaseInputConfig<string> {
  type: "Text";
  area?: boolean;
}

export interface DatetimeConfig extends BaseInputConfig<Date> {
  type: "Datetime";
}

export interface SelectConfig<
  A extends readonly [string, ...string[]] = readonly [string, ...string[]],
> extends BaseInputConfig<A[number]> {
  type: "Select";
  options: A;
}

export interface FileConfig extends BaseInputConfig<string | null> {
  type: "File";
  text?: string;
}

export interface ButtonConfig extends BaseConfig {
  type: "Button";
  text?: string;
}

export type InputConfig =
  | CheckboxConfig
  | FileConfig
  | NumberConfig
  | RangeConfig
  | ColorConfig
  | TextConfig
  | DatetimeConfig
  | SelectConfig;

export interface ConfigCollection<
  F extends readonly [InputConfig, ...InputConfig[]] = readonly [
    InputConfig,
    ...InputConfig[],
  ],
> {
  type: "Collection";
  label?: string;
  expandable?: boolean;
  fields: F;
  default?: readonly TupledStateType<F>[];
}

export type ConfigPart<
  F extends readonly [InputConfig, ...InputConfig[]] = readonly [
    InputConfig,
    ...InputConfig[],
  ],
> = InputConfig | ButtonConfig | ConfigCollection<F>;

export type Parser<T> = {
  html: (
    id: string | null,
    initialValue: T | null,
    onChange: (value: T) => void
  ) => HTMLElement;
} & (
  | {
      serialise: (value: T, shortUrl: boolean) => string;
      deserialise: (value: string, shortUrl: boolean) => T;
      setValue: (
        el: HTMLElement,
        value: T,
        onChange: ((value: T) => void) | null
      ) => void;
      getValue: (el: HTMLElement) => T;
      hasChanged: (value: T) => boolean;
    }
  | object
);

export type CreateParser<C extends BaseConfig> = (
  cfg: C
) => Parser<DefaultType<C>>;

export interface StateItem<C> {
  cfg: C;
  parser: Parser<DefaultType<C>>;
  value: DefaultType<C>;
  el: HTMLElement;
}

export type State<A extends readonly WithId<ConfigPart, string>[]> =
  A extends readonly [WithId<infer C, infer I>, ...infer Rest]
    ? { [S in I]: StateItem<C> } & (Rest extends readonly WithId<
        ConfigPart,
        string
      >[]
        ? State<Rest>
        : unknown)
    : unknown;

export type ExtractIds<C extends readonly WithId<unknown, string>[]> = {
  [K in keyof C]: C[K]["id"];
}[number];

export type StateValues<C extends readonly WithId<unknown, string>[]> = {
  [P in C[number] as P["id"]]: DefaultType<P>;
};
