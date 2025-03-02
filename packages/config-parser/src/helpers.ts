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

// https://stackoverflow.com/a/7616484
export const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash &= hash; // Convert to 32bit integer
  }
  return hash;
};

export const parseQuery = (
  query: string,
  shortUrl: boolean,
  hashKeyLength: number
): Record<string, string> => {
  const queryRegex = shortUrl
    ? new RegExp(`[?&]?([^&]{${hashKeyLength}})([^&]*)`, "g")
    : /[?&]?([^=&]+)=?([^&]*)/g;

  const queryEntries: [string, string][] = [];
  let tokens;
  while ((tokens = queryRegex.exec(query)) != null) {
    const [_, key, value] = tokens;
    if (key != null && value != null)
      queryEntries.push([key, decodeURIComponent(value)]);
  }

  return Object.fromEntries(queryEntries);
};
