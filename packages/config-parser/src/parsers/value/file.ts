import { dom } from "@web-art/core";

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
        const attrs = dom.toAttrs({
          ...(id != null ? { id } : {}),
          ...cfg.attrs,
          style: "display: none;",
        });

        const el = dom.toHtml(`
          <div class="file">
            <input type="file" ${attrs} />
            <button>${cfg.text ?? ""}</button>
          </div>
        `);

        currentValue =
          query ?? externalCfg?.initial ?? externalCfg?.default ?? defaultValue;

        const inp = dom.get<HTMLInputElement>("input", el);

        inp.onchange = async () => {
          const contents = (await inp.files?.[0]?.text()) ?? null;
          if (contents != null) onChange((currentValue = contents));
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
