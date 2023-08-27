export interface BaseConfig {
  id: string;
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
}

export interface DatetimeConfig extends BaseInputConfig<string> {
  type: "Datetime";
}

type ArrayItems<A extends ReadonlyArray<unknown>> = A extends ReadonlyArray<
  infer I
>
  ? I
  : never;

export interface SelectConfig<
  T extends string = string,
  A extends ReadonlyArray<T> = ReadonlyArray<T>
> extends BaseInputConfig<ArrayItems<A>> {
  type: "Select";
  options: A;
}

export interface FileConfig extends BaseConfig {
  type: "File";
  text?: string;
}

export interface ButtonConfig extends BaseConfig {
  type: "Button";
  text?: string;
}

export type InputConfig =
  | CheckboxConfig
  | NumberConfig
  | RangeConfig
  | ColorConfig
  | TextConfig
  | DatetimeConfig
  | SelectConfig<string>;

export type ConfigAtom = InputConfig | FileConfig | ButtonConfig;

type DeriveDefaults<R extends ReadonlyArray<ConfigAtom>> = {
  [K in keyof R]: R[K] extends BaseInputConfig<infer T> ? T : null;
};

export interface ConfigCollection<R extends ReadonlyArray<ConfigAtom>> {
  type: "Collection";
  id: string;
  label?: string;
  expandable?: boolean;
  fields: R;
  defaults?: ReadonlyArray<DeriveDefaults<R>>;
}

export type ConfigPart =
  | ConfigAtom
  | ConfigCollection<ReadonlyArray<ConfigAtom>>;
