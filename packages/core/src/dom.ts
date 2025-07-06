import { raise } from "./utils.ts";

import type {
  Alphabet,
  StringEat,
  StringExtract,
  StringGet,
  Whitespace,
} from "./stringInfer.ts";

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
  attrs.map(([key, val]) => (val != null ? `${key}="${val}"` : key)).join(" ");

type ExtractElement<S extends string> = StringExtract<
  S,
  [
    StringEat<Whitespace>,
    StringEat<"<", 1>,
    StringEat<Whitespace>,
    StringGet<Alphabet>,
  ]
>;

type ToElement<S extends string> = S extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[S]
  : HTMLElement;
type InferElement<S extends string> = ToElement<Lowercase<ExtractElement<S>>>;

const toHtml = <const S extends string>(str: S): InferElement<S> => {
  const el = document.createElement("template");
  el.innerHTML = str;
  return (el.content.children.item(0) ??
    raise(Error("No nodes found"))) as InferElement<S>;
};

export const dom = { addListener, get, toHtml, toAttrs };
