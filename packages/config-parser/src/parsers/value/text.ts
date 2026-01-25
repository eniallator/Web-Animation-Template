import { dom } from "@web-art/core";

import { valueParser } from "../../create.ts";

import type { ValueConfig } from "../../types.ts";

export const textParser = (cfg: ValueConfig<string> & { area?: boolean }) => {
  const defaultValue = cfg.default ?? "";
  return valueParser<string>(
    (onChange, getValue, externalCfg) => ({
      default: defaultValue,
      serialise: () =>
        getValue() !==
        (externalCfg != null ? externalCfg.default : defaultValue)
          ? getValue()
          : null,
      updateValue: el => {
        (el as HTMLInputElement | HTMLTextAreaElement).value = getValue();
      },
      getValue: el => (el as HTMLInputElement | HTMLTextAreaElement).value,
      html: (id, query) => {
        const initial =
          query ?? externalCfg?.initial ?? externalCfg?.default ?? defaultValue;

        const attrs = dom.toAttrs({
          ...(id != null ? { id } : {}),
          ...cfg.attrs,
        });

        const el = dom.toHtml(
          cfg.area
            ? `<textarea ${attrs}>${initial}</textarea>`
            : `<input type="text" value="${initial}" ${attrs} />`
        );

        el.onchange = () => {
          onChange(el.value);
        };
        return el;
      },
    }),
    cfg.label,
    cfg.title
  );
};
