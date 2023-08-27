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
  ConfigAtom,
  ConfigPart,
  TextConfig,
} from "./types";

export function checkboxConfig(
  config: Omit<CheckboxConfig, "type">
): CheckboxConfig {
  return { type: "Checkbox", ...config };
}

export function numberConfig(config: Omit<NumberConfig, "type">): NumberConfig {
  return { type: "Number", ...config };
}

export function rangeConfig(config: Omit<RangeConfig, "type">): RangeConfig {
  return { type: "Range", ...config };
}

export function colorConfig(config: Omit<ColorConfig, "type">): ColorConfig {
  return { type: "Color", ...config };
}

export function textConfig(config: Omit<TextConfig, "type">): TextConfig {
  return { type: "Text", ...config };
}

export function datetimeConfig(
  config: Omit<DatetimeConfig, "type">
): DatetimeConfig {
  return { type: "Datetime", ...config };
}

export function selectConfig<
  T extends string,
  A extends ReadonlyArray<T> = ReadonlyArray<T>
>(config: Omit<SelectConfig<T, A>, "type">): SelectConfig<T, A> {
  return { type: "Select", ...config };
}

export function fileConfig(config: Omit<FileConfig, "type">): FileConfig {
  return { type: "File", ...config };
}

export function buttonConfig(config: Omit<ButtonConfig, "type">): ButtonConfig {
  return { type: "Button", ...config };
}

export function configCollection<R extends ReadonlyArray<ConfigAtom>>(
  config: Omit<ConfigCollection<R>, "type">
): ConfigCollection<R> {
  return { type: "Collection", ...config };
}

export function config(...parts: Array<ConfigPart>): Array<ConfigPart> {
  return parts;
}
