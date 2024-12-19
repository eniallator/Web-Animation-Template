import { raise } from "@web-art/core";
import { ContentParser, InitParser, ValueParser } from "./types";

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
  label: string | undefined,
  init: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (value: any) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getValue: () => any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initial: any
  ) => Omit<ValueParser<T>, "type">
): InitParser<ValueParser<T>> => ({
  label,
  methods: (...args) => ({ ...init(...args), type: "Value" }),
});

export const contentParser = (
  label: string | undefined,
  init: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (value: any) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getValue: () => any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initial: any
  ) => Omit<ContentParser, "type">
): InitParser<ContentParser> => ({
  label,
  methods: (...args) => ({ ...init(...args), type: "Content" }),
});
