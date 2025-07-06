import { dom, tuple } from "@web-art/core";

import { contentParser } from "../../create.ts";

import type { Config } from "../../types.ts";

export const buttonParser = (cfg: Config & { text?: string }) =>
  contentParser(onChange => id => {
    const { class: passedClass, ...rest } = cfg.attrs ?? {};
    const classValue =
      "primary wrap-text" + (passedClass != null ? " " + passedClass : "");
    const attrs = dom.toAttrs(
      Object.entries<string | null>(rest).concat([
        ...(id != null ? [tuple("id", id)] : []),
        tuple("class", classValue),
      ])
    );

    const el = dom.toHtml(`<button${attrs}>${cfg.text ?? ""}</button>`);
    el.onclick = onChange;
    return el;
  });
