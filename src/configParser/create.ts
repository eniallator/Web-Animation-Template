import uuid from "uuid-random";
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

type OptionalId<T extends { id: string }> = Omit<T, "id"> & { id?: T["id"] };

function insertOptionalId<T extends { id?: string }>(
  value: T
): T & { id: string } {
  return { ...value, id: value.id ?? uuid() };
}

export function checkboxConfig(
  config: OptionalId<Omit<CheckboxConfig, "type">>
): CheckboxConfig {
  return insertOptionalId({ type: "Checkbox", ...config });
}

export function numberConfig(
  config: OptionalId<Omit<NumberConfig, "type">>
): NumberConfig {
  return insertOptionalId({ type: "Number", ...config });
}

export function rangeConfig(
  config: OptionalId<Omit<RangeConfig, "type">>
): RangeConfig {
  return insertOptionalId({ type: "Range", ...config });
}

export function colorConfig(
  config: OptionalId<Omit<ColorConfig, "type">>
): ColorConfig {
  return insertOptionalId({ type: "Color", ...config });
}

export function textConfig(
  config: OptionalId<Omit<TextConfig, "type">>
): TextConfig {
  return insertOptionalId({ type: "Text", ...config });
}

export function datetimeConfig(
  config: OptionalId<Omit<DatetimeConfig, "type">>
): DatetimeConfig {
  return insertOptionalId({ type: "Datetime", ...config });
}

export function selectConfig<
  T extends string,
  A extends ReadonlyArray<T> = ReadonlyArray<T>
>(config: OptionalId<Omit<SelectConfig<T, A>, "type">>): SelectConfig<T, A> {
  return insertOptionalId({ type: "Select", ...config });
}

export function fileConfig(
  config: OptionalId<Omit<FileConfig, "type">>
): FileConfig {
  return insertOptionalId({ type: "File", ...config });
}

export function buttonConfig(
  config: OptionalId<Omit<ButtonConfig, "type">>
): ButtonConfig {
  return insertOptionalId({ type: "Button", ...config });
}

export function configCollection<R extends ReadonlyArray<ConfigAtom>>(
  config: OptionalId<Omit<ConfigCollection<R>, "type">>
): ConfigCollection<R> {
  return insertOptionalId({ type: "Collection", ...config });
}

export function config(
  ...parts: ReadonlyArray<ConfigPart>
): ReadonlyArray<ConfigPart> {
  return parts;
}
