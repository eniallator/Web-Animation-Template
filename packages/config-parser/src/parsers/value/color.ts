import { b64ToUint, dom, tuple, uintToB64 } from "@web-art/core";

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
            ? uintToB64(Math.abs(parseInt(getValue(), 16)))
            : getValue(),
      updateValue: el => {
        (el as HTMLInputElement).value = `#${getValue()}`;
      },
      getValue: el => (el as HTMLInputElement).value.slice(1).toUpperCase(),
      html: (id, query, shortUrl) => {
        const initial =
          query != null
            ? shortUrl
              ? b64ToUint(query).toString(16)
              : query.toUpperCase()
            : (externalCfg?.initial ?? externalCfg?.default ?? defaultValue);

        const attrs = dom.toAttrs(
          Object.entries<string | null>(cfg.attrs ?? {}).concat([
            ...(id != null ? [tuple("id", id)] : []),
            tuple("value", `#${initial}`),
          ])
        );

        const el = dom.toHtml<HTMLInputElement>(
          `<input type="color"${attrs} />`
        );
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
