import { raise } from "./utils.js";

function addListener<
  E extends HTMLElement,
  const K extends keyof HTMLElementEventMap,
>(
  element: E,
  event: K,
  listener: (this: E, evt: HTMLElementEventMap[K]) => void
) {
  element.addEventListener<K>(
    event,
    listener as (this: HTMLElement, evt: HTMLElementEventMap[K]) => void
  );
}

function get<E extends HTMLElement>(
  selector: string,
  baseEl: ParentNode = document
): E {
  return (
    baseEl.querySelector<E>(selector) ??
    raise(new Error(`Could not find element with selector "${selector}"`))
  );
}

export const dom = { addListener, get };
