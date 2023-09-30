import { checkExhausted } from "../core/utils";
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
  ConfigCollectionFields,
  InputConfig,
} from "./types";

export function checkboxConfig<const I extends string>(
  config: Omit<CheckboxConfig<I>, "type">
): CheckboxConfig<I> {
  return { type: "Checkbox", ...config };
}

export function numberConfig<const I extends string>(
  config: Omit<NumberConfig<I>, "type">
): NumberConfig<I> {
  return { type: "Number", ...config };
}

export function rangeConfig<const I extends string>(
  config: Omit<RangeConfig<I>, "type">
): RangeConfig<I> {
  return { type: "Range", ...config };
}

export function colorConfig<const I extends string>(
  config: Omit<ColorConfig<I>, "type">
): ColorConfig<I> {
  return { type: "Color", ...config };
}

export function textConfig<const I extends string>(
  config: Omit<TextConfig<I>, "type">
): TextConfig<I> {
  return { type: "Text", ...config };
}

export function datetimeConfig<const I extends string>(
  config: Omit<DatetimeConfig<I>, "type">
): DatetimeConfig<I> {
  return { type: "Datetime", ...config };
}

export function selectConfig<
  const I extends string,
  const T extends string,
  const A extends readonly [T, ...T[]] = readonly [T, ...T[]]
>(config: Omit<SelectConfig<I, T, A>, "type">): SelectConfig<I, T, A> {
  return { type: "Select", ...config };
}

export function fileConfig<const I extends string>(
  config: Omit<FileConfig<I>, "type">
): FileConfig<I> {
  return { type: "File", ...config };
}

export function buttonConfig<const I extends string>(
  config: Omit<ButtonConfig<I>, "type">
): ButtonConfig<I> {
  return { type: "Button", ...config };
}

export function configCollection<
  const I extends string,
  const F extends ConfigCollectionFields
>(config: Omit<ConfigCollection<I, F>, "type">): ConfigCollection<I, F> {
  return { type: "Collection", ...config };
}

export function config<C extends ReadonlyArray<ConfigPart<string>>>(
  ...parts: C
): C {
  return parts;
}

export function inputType(type: InputConfig<string>["type"]): string {
  switch (type) {
    case "Checkbox":
      return "checkbox";
    case "Color":
      return "color";
    case "Datetime":
      return "datetime-local";
    case "File":
      return "file";
    case "Number":
      return "number";
    case "Range":
      return "range";
    case "Select":
      return "select";
    case "Text":
      return "text";
    default:
      return checkExhausted(type);
  }
}
