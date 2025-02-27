import { raise } from "@web-art/core";

export const toAttrs = (attrs: [string, string | null][]): string =>
  attrs.reduce(
    (acc, [key, val]) => acc + (val != null ? ` ${key}="${val}"` : ` ${key}`),
    ""
  );

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
  const labelAttr =
    (title ?? label) != null ? ` title="${title ?? label}"` : "";
  const itemEl = stringToHTML(
    `<div class="config-item"${labelAttr}>${labelStr}</div>`
  );
  itemEl.appendChild(el);
  return itemEl;
};
