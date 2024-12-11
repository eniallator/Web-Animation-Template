import { raise } from "@web-art/core";
import { ContentParser, ValueParser } from "./types";

export const toAttrs = (attrs: [string, string | null][]): string =>
  attrs
    .map(([name, value]) =>
      value != null ? ` ${name}="${value}"` : ` ${name}`
    )
    .join("");

export const stringToHTML = (str: string): Element => {
  const el = document.createElement("template");
  el.innerHTML = str;
  return el.content.children.item(0) ?? raise(Error("No nodes found"));
};

export const configItem = (
  id: string,
  label: string | null,
  el: HTMLElement
): HTMLElement => {
  const labelStr =
    label != null
      ? `<label for="${id}" title="${label}" class="wrap-text">${label}</label>`
      : "";
  const itemEl = stringToHTML(`<div class="config-item">${labelStr}</div>`);
  itemEl.appendChild(el);
  return itemEl as HTMLElement;
};

export const valueParser = <T>(
  parser: Omit<ValueParser<T>, "type">
): ValueParser<T> => ({ ...parser, type: "Value" });

export const contentParser = <T>(
  html: ContentParser<T>["html"]
): ContentParser<T> => ({ html, type: "Content" });
