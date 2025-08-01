import { b64, dom } from "@web-art/core";

import { valueParser } from "../../create.ts";

import type { ValueConfig } from "../../types.ts";

export const colorParser = (cfg: ValueConfig<string>) => {
  const defaultValue = cfg.default ?? "000000";
  return valueParser<string>(
    (onChange, getValue, externalCfg) => ({
      default: defaultValue,
      serialise: shortUrl =>
        getValue() ===
        (externalCfg != null ? externalCfg.default : defaultValue)
          ? null
          : shortUrl
            ? b64.fromUint(Math.abs(parseInt(getValue(), 16)))
            : getValue(),
      updateValue: el => {
        (el as HTMLInputElement).value = `#${getValue()}`;
      },
      getValue: el => (el as HTMLInputElement).value.slice(1).toUpperCase(),
      html: (id, query, shortUrl) => {
        const initial =
          query != null
            ? shortUrl
              ? b64.toUint(query).toString(16)
              : query.toUpperCase()
            : (externalCfg?.initial ?? externalCfg?.default ?? defaultValue);

        const attrs = dom.toAttrs({
          ...(id != null ? { id } : {}),
          value: `#${initial}`,
          ...cfg.attrs,
        });

        const el = dom.toHtml(`<input type="color" ${attrs} />`);
        el.oninput = () => {
          onChange(el.value.slice(1).toUpperCase());
        };
        return el;
      },
    }),
    cfg.label,
    cfg.title
  );
};
