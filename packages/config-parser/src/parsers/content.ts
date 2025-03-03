import { dom, Option, tuple } from "@web-art/core";

import { contentParser } from "../create.js";
import { Config } from "../types.js";

export const buttonParser = (cfg: Config & { text?: string }) =>
  contentParser(onChange => ({
    default: null,
    html: id => {
      const attrs = dom.toAttrs(
        Option.from(id)
          .map<[string, string | null]>(id => tuple("id", id))
          .toArray()
          .concat(Object.entries(cfg.attrs ?? {}), [
            tuple("class", "primary wrap-text"),
          ])
      );

      const el = dom.toHtml(`<button${attrs}>${cfg.text ?? ""}</button>`);
      el.onclick = () => {
        onChange(null);
      };
      return el;
    },
  }));
