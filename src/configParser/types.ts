interface BaseConfig {
  id: string;
  tooltip?: string;
  attrs?: Record<string, string>;
}

interface InputConfig<T> extends BaseConfig {
  label?: string;
  default?: T;
}

export interface CheckboxConfig extends InputConfig<boolean> {
  type: "Checkbox";
}

export interface NumberConfig extends InputConfig<number> {
  type: "Number";
}

export interface RangeConfig extends InputConfig<number> {
  type: "Range";
}

export interface ColorConfig extends InputConfig<string> {
  type: "Color";
}

export interface TextConfig extends InputConfig<string> {
  type: "Text";
}

export interface DatetimeConfig extends InputConfig<string> {
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
> extends InputConfig<ArrayItems<A>> {
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

export type ConfigAtom =
  | CheckboxConfig
  | NumberConfig
  | RangeConfig
  | ColorConfig
  | TextConfig
  | FileConfig
  | DatetimeConfig
  | SelectConfig<string>
  | ButtonConfig;

type DeriveDefaults<R extends ReadonlyArray<ConfigAtom>> = {
  [K in keyof R]: R[K] extends InputConfig<infer T> ? T : null;
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
