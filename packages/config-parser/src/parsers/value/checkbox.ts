import { dom, tuple } from "@web-art/core";
import { isOneOf } from "deep-guards";

import { valueParser } from "../../create.ts";

import type { ValueConfig } from "../../types.ts";

export const checkboxParser = (cfg: ValueConfig<boolean>) => {
  const defaultValue = cfg.default ?? false;
  return valueParser<boolean>(
    (onChange, getValue, externalCfg) => ({
      default: defaultValue,
      serialise: shortUrl =>
        getValue() !==
        (externalCfg != null ? externalCfg.default : defaultValue)
          ? `${shortUrl ? +getValue() : getValue()}`
          : null,
      updateValue: el => {
        if (getValue()) {
          el.setAttribute("checked", "");
        } else {
          el.removeAttribute("checked");
        }
      },
      getValue: el => el.hasAttribute("checked"),
      html: (id, query) => {
        const initial =
          query != null
            ? isOneOf("1", "true")(query)
            : (externalCfg?.initial ?? externalCfg?.default ?? defaultValue);

        const attrs = dom.toAttrs(
          Object.entries<string | null>(cfg.attrs ?? {}).concat([
            ...(initial ? [tuple("checked", null)] : []),
            ...(id != null ? [tuple("id", id)] : []),
          ])
        );

        const el = dom.toHtml<HTMLInputElement>(
          `<input type="checkbox"${attrs} />`
        );
        el.onchange = () => {
          onChange(el.checked);
        };
        return el;
      },
    }),
    cfg.label,
    cfg.title
  );
};
