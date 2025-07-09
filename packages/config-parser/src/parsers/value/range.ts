import { dom, tuple } from "@web-art/core";

import { valueParser } from "../../create.ts";
import { defaultNumber, numToStr } from "./number.ts";

import type { ValueConfig } from "../../types.ts";

export const rangeParser = (cfg: ValueConfig<number>) => {
  const defaultValue = cfg.default ?? defaultNumber(cfg.attrs);
  return valueParser<number>(
    (onChange, getValue, externalCfg) => ({
      default: defaultValue,
      serialise: () =>
        getValue() !==
        (externalCfg != null ? externalCfg.default : defaultValue)
          ? numToStr(getValue())
          : null,
      updateValue: el => {
        (el as HTMLInputElement).value = `${getValue()}`;
      },
      getValue: el => Number((el as HTMLInputElement).value),
      html: (id, query) => {
        const initial =
          query != null
            ? Number(query)
            : (externalCfg?.initial ?? externalCfg?.default ?? defaultValue);

        const attrs = dom.toAttrs(
          ...(id != null ? [tuple("id", id)] : []),
          tuple("value", `${initial}`),
          ...Object.entries(cfg.attrs ?? {})
        );

        const el = dom.toHtml(`<input type="range" ${attrs} />`);
        el.onchange = () => {
          onChange(Number(el.value));
        };
        return el;
      },
    }),
    cfg.label,
    cfg.title
  );
};
