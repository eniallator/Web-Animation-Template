import {
  CheckboxConfig,
  NumberConfig,
  RangeConfig,
  ColorConfig,
  DatetimeConfig,
  SelectConfig,
  FileConfig,
  ButtonConfig,
  ConfigCollection,
  ConfigPart,
  TextConfig,
  CompleteConfig,
  ConfigCollectionFields,
} from "./types";

export function checkboxConfig<I extends string>(
  config: Omit<CheckboxConfig<I>, "type">
): CheckboxConfig<I> {
  return { type: "Checkbox", ...config };
}

export function numberConfig<I extends string>(
  config: Omit<NumberConfig<I>, "type">
): NumberConfig<I> {
  return { type: "Number", ...config };
}

export function rangeConfig<I extends string>(
  config: Omit<RangeConfig<I>, "type">
): RangeConfig<I> {
  return { type: "Range", ...config };
}

export function colorConfig<I extends string>(
  config: Omit<ColorConfig<I>, "type">
): ColorConfig<I> {
  return { type: "Color", ...config };
}

export function textConfig<I extends string>(
  config: Omit<TextConfig<I>, "type">
): TextConfig<I> {
  return { type: "Text", ...config };
}

export function datetimeConfig<I extends string>(
  config: Omit<DatetimeConfig<I>, "type">
): DatetimeConfig<I> {
  return { type: "Datetime", ...config };
}

export function selectConfig<
  I extends string,
  T extends string,
  A extends readonly [T, ...T[]] = readonly [T, ...T[]]
>(config: Omit<SelectConfig<I, T, A>, "type">): SelectConfig<I, T, A> {
  return { type: "Select", ...config };
}

export function fileConfig<I extends string>(
  config: Omit<FileConfig<I>, "type">
): FileConfig<I> {
  return { type: "File", ...config };
}

export function buttonConfig<I extends string>(
  config: Omit<ButtonConfig<I>, "type">
): ButtonConfig<I> {
  return { type: "Button", ...config };
}

export function configCollection<
  I extends string,
  F extends ConfigCollectionFields
>(config: Omit<ConfigCollection<I, F>, "type">): ConfigCollection<I, F> {
  return { type: "Collection", ...config };
}

export function config<C extends CompleteConfig<ConfigPart<string>>>(
  ...parts: C
): C {
  return parts;
}
