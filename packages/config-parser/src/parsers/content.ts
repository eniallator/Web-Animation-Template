import { dom, Option, tuple } from "@web-art/core";
import { isString } from "deep-guards";
import { contentParser, stringToHTML, toAttrs } from "../helpers.js";
import { Config, ValueConfig } from "../types.js";

export const fileParser = (cfg: ValueConfig<string> & { text?: string }) =>
  contentParser((id, onChange) => {
    const attrs = toAttrs([
      tuple("id", id),
      tuple("style", "display: none;"),
      ...Option.some(cfg.attrs)
        .map<[string, string][]>(Object.entries)
        .getOrElse((): [string, string][] => []),
    ]);

    const el = stringToHTML(`<div>
      <input type="file"${attrs} />
      <button class="secondary wrap-text">${cfg.text ?? ""}</button>
    </div>`);

    const inp = dom.get<HTMLInputElement>("input", el);
    const btn = dom.get<HTMLButtonElement>("button", el);

    btn.onclick = () => {
      inp.click();
    };
    inp.onchange = () => {
      if (inp.files?.[0] != null) {
        const reader = new FileReader();
        reader.onload = evt => {
          Option.some(evt.target?.result).guard(isString).tap(onChange);
        };
        reader.readAsDataURL(inp.files[0]);
      }
    };

    return el as HTMLElement;
  });

export const buttonParser = (cfg: Config & { text?: string }) =>
  contentParser((id, onChange) => {
    const attrs = toAttrs([
      tuple("id", id),
      tuple("class", "primary wrap-text"),
      ...Option.some(cfg.attrs)
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
  });
