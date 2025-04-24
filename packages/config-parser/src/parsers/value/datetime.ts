import {
  b64ToUint,
  dom,
  formatDate,
  formatIsoDate,
  tuple,
  uintToB64,
} from "@web-art/core";

import { valueParser } from "../../create.ts";

import type { ValueConfig } from "../../types.ts";

export const datetimeParser = (cfg: ValueConfig<Date>) => {
  const defaultValue = cfg.default ?? new Date(0);
  return valueParser<Date>(
    (onChange, getValue, externalCfg) => ({
      default: defaultValue,
      serialise: shortUrl =>
        getValue().getTime() ===
        (externalCfg != null
          ? externalCfg.default.getTime()
          : defaultValue.getTime())
          ? null
          : shortUrl
            ? uintToB64(getValue().getTime())
            : formatIsoDate(getValue()),
      updateValue: el => {
        (el as HTMLInputElement).value = formatDate(getValue());
      },
      getValue: el => new Date((el as HTMLInputElement).value),
      html: (id, query, shortUrl) => {
        const initial =
          query != null
            ? new Date(shortUrl ? b64ToUint(query) : query)
            : (externalCfg?.initial ?? externalCfg?.default ?? defaultValue);

        const attrs = dom.toAttrs(
          Object.entries<string | null>(cfg.attrs ?? {}).concat([
            ...(id != null ? [tuple("id", id)] : []),
            tuple("value", formatDate(initial)),
          ])
        );

        const el = dom.toHtml<HTMLInputElement>(
          `<input type="datetime-local"${attrs} />`
        );
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
