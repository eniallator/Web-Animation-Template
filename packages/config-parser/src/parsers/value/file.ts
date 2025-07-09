import { dom, tuple } from "@web-art/core";
import { isString } from "deep-guards";

import { valueParser } from "../../create.ts";

import type { ValueConfig } from "../../types.ts";

export const fileParser = (cfg: ValueConfig<string> & { text?: string }) => {
  const defaultValue = cfg.default ?? "";
  let currentValue = defaultValue;
  return valueParser<string>(
    (onChange, getValue, externalCfg) => ({
      default: defaultValue,
      serialise: () =>
        getValue() !==
        (externalCfg != null ? externalCfg.default : defaultValue)
          ? currentValue
          : null,
      getValue: () => currentValue,
      updateValue: () => {
        currentValue = getValue();
      },
      html: (id, query) => {
        const attrs = dom.toAttrs(
          ...(id != null ? [tuple("id", id)] : []),
          ...Object.entries(cfg.attrs ?? {}),
          tuple("style", "display: none;")
        );

        const el = dom.toHtml(`<div class="file">
          <input type="file" ${attrs} />
          <button class="secondary wrap-text">${cfg.text ?? ""}</button>
        </div>`);

        currentValue =
          query ?? externalCfg?.initial ?? externalCfg?.default ?? defaultValue;
        const inp = dom.get<HTMLInputElement>("input", el);
        inp.onchange = () => {
          if (inp.files?.[0] != null) {
            const reader = new FileReader();
            reader.onload = evt => {
              if (isString(evt.target?.result)) {
                onChange((currentValue = evt.target.result));
              }
            };
            reader.readAsDataURL(inp.files[0]);
          }
        };

        dom.get<HTMLButtonElement>("button", el).onclick = () => {
          inp.click();
        };

        return el;
      },
    }),
    cfg.label,
    cfg.title
  );
};
