import { Option, tuple } from "@web-art/core";
import { contentParser, stringToHTML, toAttrs } from "../helpers.js";
import { Config } from "../types.js";

export const buttonParser = (cfg: Config & { text?: string }) =>
  contentParser((onChange: (value: null) => void) => ({
    default: null,
    html: id => {
      const attrs = toAttrs([
        tuple("id", id),
        tuple("class", "primary wrap-text"),
        ...Option.from(cfg.attrs)
          .map<[string, string][]>(Object.entries)
          .getOrElse((): [string, string][] => []),
      ]);

      const el = stringToHTML(
        `<button${attrs}>${cfg.text ?? ""}</button>`
      ) as HTMLButtonElement;
      el.onclick = () => {
        onChange(null);
      };
      return el;
    },
  }));
