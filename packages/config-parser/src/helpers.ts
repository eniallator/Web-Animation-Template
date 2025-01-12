import { raise } from "@web-art/core";

export const toAttrs = (attrs: [string, string | null][]): string =>
  attrs
    .map(([name, value]) =>
      value != null ? ` ${name}="${value}"` : ` ${name}`
    )
    .join("");

export const stringToHTML = (str: string): HTMLElement => {
  const el = document.createElement("template");
  el.innerHTML = str;
  return (el.content.children.item(0) ??
    raise(Error("No nodes found"))) as HTMLElement;
};

export const configItem = (
  id: string,
  el: HTMLElement,
  label?: string,
  title?: string
): HTMLElement => {
  const labelStr =
    label != null
      ? `<label for="${id}" class="wrap-text">${label}</label>`
      : "";
  const itemEl = stringToHTML(
    `<div class="config-item" title="${title ?? label ?? ""}">${labelStr}</div>`
  );
  itemEl.appendChild(el);
  return itemEl;
};
