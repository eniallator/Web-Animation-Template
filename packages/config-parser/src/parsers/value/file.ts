import { dom } from "@web-art/core";
import { isString } from "deep-guards";

import { valueParser } from "../../create.ts";

import type { ValueConfig } from "../../types.ts";

const readFile = (file: File): Promise<string | null> =>
  new Promise(res => {
    const reader = new FileReader();
    reader.onload = evt => {
      res(isString(evt.target?.result) ? evt.target.result : null);
    };
    reader.readAsText(file);
  });

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
          const contents =
            inp.files?.[0] != null ? await readFile(inp.files[0]) : null;
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
