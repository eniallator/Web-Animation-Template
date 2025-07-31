import { dom } from "@web-art/core";

import { contentParser } from "../../create.ts";

import type { Config } from "../../types.ts";

export const buttonParser = (cfg: Config & { text?: string }) =>
  contentParser(onChange => id => {
    const { class: passedClass, ...rest } = cfg.attrs ?? {};
    const classValue =
      "primary wrap-text" + (passedClass != null ? " " + passedClass : "");

    const attrs = dom.toAttrs({
      ...(id != null ? { id } : {}),
      class: classValue,
      ...rest,
    });

    const el = dom.toHtml(`<button ${attrs}>${cfg.text ?? ""}</button>`);
    el.onclick = onChange;
    return el;
  });
