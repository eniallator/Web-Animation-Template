import { DeriveDefaults, DeriveStateType } from "./derive";

export interface BaseConfig<I extends string> {
  id: I;
  tooltip?: string;
  attrs?: Record<string, string>;
}

export interface BaseInputConfig<I extends string, T> extends BaseConfig<I> {
  label?: string;
  default?: T;
}

export interface CheckboxConfig<I extends string>
  extends BaseInputConfig<I, boolean> {
  type: "Checkbox";
}

export interface NumberConfig<I extends string>
  extends BaseInputConfig<I, number> {
  type: "Number";
}

export interface RangeConfig<I extends string>
  extends BaseInputConfig<I, number> {
  type: "Range";
}

export interface ColorConfig<I extends string>
  extends BaseInputConfig<I, string> {
  type: "Color";
}

export interface TextConfig<I extends string>
  extends BaseInputConfig<I, string> {
  type: "Text";
}

export interface DatetimeConfig<I extends string>
  extends BaseInputConfig<I, Date> {
  type: "Datetime";
}

type ArrayItems<A extends ReadonlyArray<unknown>> = A extends ReadonlyArray<
  infer I
>
  ? I
  : never;

export interface SelectConfig<
  I extends string,
  T extends string = string,
  A extends readonly [T, ...T[]] = readonly [T, ...T[]]
> extends BaseInputConfig<I, ArrayItems<A>> {
  type: "Select";
  options: A;
}

export interface FileConfig<I extends string>
  extends BaseInputConfig<I, string> {
  type: "File";
  text?: string;
}

export interface ButtonConfig<I extends string> extends BaseConfig<I> {
  type: "Button";
  text?: string;
}

export type InputConfig<I extends string> =
  | CheckboxConfig<I>
  | FileConfig<I>
  | NumberConfig<I>
  | RangeConfig<I>
  | ColorConfig<I>
  | TextConfig<I>
  | DatetimeConfig<I>
  | SelectConfig<I, string>;

export type ConfigCollectionFields = ReadonlyArray<InputConfig<string>>;
export interface ConfigCollection<
  I extends string,
  F extends ConfigCollectionFields
> {
  type: "Collection";
  id: I;
  label?: string;
  expandable?: boolean;
  fields: F;
  default?: ReadonlyArray<DeriveDefaults<F>>;
}

export type ConfigPart<
  I extends string,
  F extends ConfigCollectionFields = ConfigCollectionFields
> = InputConfig<I> | ButtonConfig<I> | ConfigCollection<I, F>;

export type SerialisableConfig<I extends string> =
  | InputConfig<I>
  | ConfigCollection<I, ConfigCollectionFields>;

export interface StateItem<C extends ConfigPart<string>> {
  value: DeriveStateType<C>;
  config: C;
  clicked: boolean;
}

export type OnUpdate<C extends ConfigPart<string>> = (
  newValue: DeriveStateType<C>
) => void;
