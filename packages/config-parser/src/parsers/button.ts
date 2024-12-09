import { stringToHTML } from "../helpers.js";
import { CreateParser, ButtonConfig } from "../types.js";

export const buttonParser: CreateParser<ButtonConfig> = cfg => ({
  html: (id, initial, onChange) => {
    const idAttr = id != null ? ` id="${id}"` : "";
    const el = stringToHTML(
      `<button${idAttr} class="primary wrap-text">${cfg.text ?? ""}</button>`
    ) as HTMLButtonElement;
    el.onclick = () => {
      onChange(null);
    };
    return el;
  },
});
