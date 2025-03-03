import { raise } from "./utils.js";

const addListener = <
  E extends HTMLElement,
  const K extends keyof HTMLElementEventMap,
>(
  element: E,
  event: K,
  listener: (this: E, evt: HTMLElementEventMap[K]) => void
): void => {
  element.addEventListener<K>(
    event,
    listener as (this: HTMLElement, evt: HTMLElementEventMap[K]) => void
  );
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
const get = <E extends HTMLElement>(
  selector: string,
  baseEl: ParentNode = document
): E =>
  baseEl.querySelector<E>(selector) ??
  raise(new Error(`Could not find element with selector "${selector}"`));

const toAttrs = (attrs: [string, string | null][]): string =>
  attrs.reduce(
    (acc, [key, val]) => acc + (val != null ? ` ${key}="${val}"` : ` ${key}`),
    ""
  );

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
const toHtml = <E extends HTMLElement>(str: string): E => {
  const el = document.createElement("template");
  el.innerHTML = str;
  return (el.content.children.item(0) ?? raise(Error("No nodes found"))) as E;
};

export const dom = { addListener, get, toHtml, toAttrs };
