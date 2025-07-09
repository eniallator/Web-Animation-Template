import { dom, tuple } from "@web-art/core";

import { valueParser } from "../../create.ts";

import type { ValueConfig } from "../../types.ts";

export const defaultNumber = (attrs?: Record<string, string>) => {
  const min = Number(attrs?.["min"] ?? 0);
  const max = Number(attrs?.["max"] ?? 100);
  const step = Number(attrs?.["step"] ?? 1);

  return Math.ceil((max - min) / step) * step + min;
};

export const numToStr = (n: number) =>
  [`${n}`, encodeURIComponent(n.toExponential())].reduce((a, b) =>
    a.length < b.length ? a : b
  );

export const numberParser = (cfg: ValueConfig<number>) => {
  const defaultValue =
    cfg.default ?? (cfg.attrs != null ? defaultNumber(cfg.attrs) : 0);
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

        const el = dom.toHtml(`<input type="number" ${attrs} />`);
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
