import { b64, dom } from "@web-art/core";

export const configItem = (
  id: string,
  el: HTMLElement,
  label?: string,
  title: string | undefined = label
): HTMLDivElement => {
  const itemEl = dom.toHtml(`
    <div class="config-item"${title ? ` title="${title}"` : ""}>
      ${label ? `<label for="${id}" class="wrap-text">${label}</label>` : ""}
    </div>
  `);

  itemEl.appendChild(el);
  return itemEl;
};

// https://stackoverflow.com/a/7616484
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash &= hash; // Convert to 32bit integer
  }
  return hash;
};

export const queryKey = (key: string, hashLength: number | null): string =>
  hashLength != null
    ? b64.fromUint(Math.abs(hashString(key)), hashLength)
    : encodeURIComponent(key);

export const parseQuery = (
  query: string,
  hashLength: number | null
): Record<string, string> => {
  const queryRegex =
    hashLength != null
      ? new RegExp(`[?&]?([^&]{${hashLength}})([^&]*)`, "g")
      : /[?&]?([^=&]+)=?([^&]*)/g;

  const queryEntries: [string, string][] = [];
  let tokens: ReturnType<RegExp["exec"]>;
  while ((tokens = queryRegex.exec(query)) != null) {
    const [_, key, value] = tokens;
    if (key != null && value != null) {
      queryEntries.push([key, decodeURIComponent(value)]);
    }
  }

  return Object.fromEntries(queryEntries);
};
