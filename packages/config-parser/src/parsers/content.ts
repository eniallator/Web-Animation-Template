import { Option, tuple } from "@web-art/core";
import { stringToHTML, toAttrs } from "../helpers.js";
import { Config } from "../types.js";
import { contentParser } from "../create.js";

export const buttonParser = (cfg: Config & { text?: string }) =>
  contentParser((onChange: (value: null) => void) => ({
    default: null,
    html: id => {
      const attrs = toAttrs(
        Option.from(id)
          .map<[string, string | null]>(id => tuple("id", id))
          .toArray()
          .concat(
            Object.entries(cfg.attrs ?? []),
            tuple("class", "primary wrap-text")
          )
      );

      const el = stringToHTML(`<button${attrs}>${cfg.text ?? ""}</button>`);
      el.onclick = () => {
        onChange(null);
      };
      return el;
    },
  }));
