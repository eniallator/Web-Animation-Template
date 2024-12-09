import {
  ButtonConfig,
  CheckboxConfig,
  ColorConfig,
  ConfigCollection,
  ConfigPart,
  DatetimeConfig,
  FileConfig,
  InputConfig,
  NumberConfig,
  RangeConfig,
  SelectConfig,
  TextConfig,
  WithId,
} from "./types.js";

function simpleCreateFn<const P extends ConfigPart>(type: P["type"]) {
  function createPart<const I extends string>(
    cfg: Omit<WithId<P, I>, "type">
  ): WithId<P, I>;
  function createPart(cfg: Omit<P, "type">): P;
  function createPart(cfg: object) {
    return { ...cfg, type };
  }

  return createPart;
}

export const checkboxConfig = simpleCreateFn<CheckboxConfig>("Checkbox");
export const numberConfig = simpleCreateFn<NumberConfig>("Number");
export const rangeConfig = simpleCreateFn<RangeConfig>("Range");
export const colorConfig = simpleCreateFn<ColorConfig>("Color");
export const textConfig = simpleCreateFn<TextConfig>("Text");
export const datetimeConfig = simpleCreateFn<DatetimeConfig>("Datetime");

export function selectConfig<
  const A extends readonly [string, ...string[]],
  const I extends string,
>(cfg: Omit<WithId<SelectConfig<A>, I>, "type">): WithId<SelectConfig<A>, I>;
export function selectConfig<const A extends readonly [string, ...string[]]>(
  cfg: Omit<SelectConfig<A>, "type">
): SelectConfig<A>;
export function selectConfig<const A extends readonly [string, ...string[]]>(
  cfg: Omit<SelectConfig<A>, "type">
): SelectConfig<A> {
  return { ...cfg, type: "Select" };
}

export const fileConfig = simpleCreateFn<FileConfig>("File");
export const buttonConfig = simpleCreateFn<ButtonConfig>("Button");

export function configCollection<
  const F extends readonly [InputConfig, ...InputConfig[]],
  const I extends string,
>(
  cfg: Omit<WithId<ConfigCollection<F>, I>, "type">
): WithId<ConfigCollection<F>, I>;
export function configCollection<
  const F extends readonly [InputConfig, ...InputConfig[]],
>(cfg: Omit<ConfigCollection<F>, "type">): ConfigCollection<F>;
export function configCollection<
  const F extends readonly [InputConfig, ...InputConfig[]],
>(cfg: Omit<ConfigCollection<F>, "type">): ConfigCollection<F> {
  return { ...cfg, type: "Collection" };
}

export function config<const C extends readonly WithId<ConfigPart, string>[]>(
  ...parts: C
): C {
  return parts;
}

config(
  checkboxConfig({ id: "maybe" }),
  selectConfig({ id: "selecty", options: ["Hello", "world!"] })
);
