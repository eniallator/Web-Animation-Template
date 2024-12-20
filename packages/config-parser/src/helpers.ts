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
  return itemEl as HTMLElement;
};

export const valueParser = <T>(
  init: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (value: any) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getValue: () => any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initial: any
  ) => Omit<ValueParser<T>, "type">,
  label?: string,
  title?: string
): InitParser<ValueParser<T>> => ({
  label,
  title,
  methods: (...args) => ({ ...init(...args), type: "Value" }),
});

export const contentParser = (
  init: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (value: any) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getValue: () => any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initial: any
  ) => Omit<ContentParser, "type">,
  label?: string,
  title?: string
): InitParser<ContentParser> => ({
  label,
  title,
  methods: (...args) => ({ ...init(...args), type: "Content" }),
});
