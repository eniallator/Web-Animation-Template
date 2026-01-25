import { b64, dom, formatDate } from "@web-art/core";

import { valueParser } from "../../create.ts";

import type { ValueConfig } from "../../types.ts";

export const datetimeParser = (cfg: ValueConfig<Date>) => {
  const defaultValue = cfg.default ?? new Date(0);
  return valueParser<Date>(
    (onChange, getValue, externalCfg) => ({
      default: defaultValue,
      serialise: shortUrl =>
        getValue().getTime() ===
        (externalCfg?.default.getTime() ?? defaultValue.getTime())
          ? null
          : shortUrl
            ? b64.fromUint(getValue().getTime())
            : getValue().toISOString(),
      updateValue: el => {
        (el as HTMLInputElement).value = formatDate(getValue());
      },
      getValue: el => new Date((el as HTMLInputElement).value),
      html: (id, query, shortUrl) => {
        const initial =
          query != null
            ? new Date(shortUrl ? b64.toUint(query) : query)
            : (externalCfg?.initial ?? externalCfg?.default ?? defaultValue);

        const attrs = dom.toAttrs({
          ...(id != null ? { id } : {}),
          value: formatDate(initial),
          ...cfg.attrs,
        });

        const el = dom.toHtml(`<input type="datetime-local" ${attrs} />`);

        el.onchange = () => {
          onChange(new Date(el.value));
        };

        return el;
      },
    }),
    cfg.label,
    cfg.title
  );
};
