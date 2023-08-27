import { checkExhausted, hasKey, isString } from "../core/utils";
import { InputConfig, ConfigAtom } from "./types";

export function serialise(
  el: HTMLInputElement,
  shortUrl: boolean,
  config: InputConfig
): string {
  switch (config.type) {
    case "Checkbox":
      return `${
        shortUrl ? +el.hasAttribute("checked") : el.hasAttribute("checked")
      }`;
    case "Color": {
      const col = String(el.value.slice(1).toUpperCase());
      if (shortUrl) return intToBase64(parseInt(col, 16));
      return col;
    }
    case "Datetime": {
      return shortUrl
        ? intToBase64(
            Date.parse(el.value) / 60000 - new Date().getTimezoneOffset()
          )
        : encodeURIComponent(el.value);
    }
    case "Number":
    case "Range":
      return el.value;
    case "Select":
    case "Text":
      return el.value;
    default:
      return checkExhausted(config);
  }
}

export function deserialise<C extends InputConfig>(
  value: string,
  shortUrl: boolean,
  config: C
): C["default"] {
  switch (config.type) {
    case "Checkbox":
      return shortUrl ? value === "1" : value.toLowerCase() === "true";
    case "Color":
      return shortUrl
        ? base64ToPosInt(value).toString(16)
        : value.toUpperCase();
    case "Datetime":
      return shortUrl
        ? new Date(base64ToPosInt(value) * 60000)
            .toLocaleString()
            .replace(
              /(?<d>\d+)\/(?<m>\d+)\/(?<y>\d+)[^\d]*(?<t>\d+:\d+).*/,
              "$<y>-$<m>-$<d>T$<t>"
            )
        : decodeURIComponent(value);
    case "Number":
    case "Range":
      return Number(value);
    case "Select":
    case "Text":
      return decodeURIComponent(value);
    default:
      return checkExhausted(config);
  }
}

export function setVal<C extends InputConfig>(
  el: HTMLInputElement,
  value: unknown,
  config: C
): void {
  switch (config.type) {
    case "Checkbox": {
      if (value === true) {
        el.setAttribute("checked", "");
      } else {
        el.removeAttribute("checked");
      }
      break;
    }
    case "Color":
      el.value = `#${value}`;
      break;
    case "Datetime":
    case "Number":
    case "Range":
    case "Select":
    case "Text":
      el.value = `${value}`;
      break;
    default:
      return checkExhausted(config);
  }
}

export function isSerialisable(config: ConfigAtom): config is InputConfig {
  switch (config.type) {
    case "Checkbox":
    case "Color":
    case "Datetime":
    case "Number":
    case "Range":
    case "Select":
    case "Text":
      return true;
    case "Button":
    case "File":
      return false;
    default:
      return checkExhausted(config);
  }
}

export function clickable(config: ConfigAtom): boolean {
  return config.type === "Button";
}

export function inputCallback(
  setValue: (newVal: unknown) => void,
  config: ConfigAtom
): ((evt: InputEvent) => void) | null {
  switch (config.type) {
    case "Button":
    case "Checkbox":
    case "Datetime":
    case "File":
    case "Number":
    case "Range":
    case "Select":
    case "Text":
      return null;
    case "Color":
      return (evt) =>
        hasKey(evt.target, "value", isString)
          ? setValue(evt.target.value.slice(1).toUpperCase())
          : null;
    default:
      return checkExhausted(config);
  }
}

export function changeCallback(
  setValue: (newVal: unknown) => void,
  config: ConfigAtom
): ((evt: InputEvent) => void) | null {
  switch (config.type) {
    case "Button":
    case "Color":
      return null;
    case "Checkbox":
      return (evt) =>
        setValue((evt.target as HTMLElement).hasAttribute("checked"));
    case "Datetime":
    case "Select":
    case "Text":
      return (evt) =>
        hasKey(evt.target, "value", isString)
          ? setValue(evt.target.value)
          : null;
    case "File":
      return (evt) =>
        new Promise<void>(() => {
          const target = evt.target as HTMLInputElement;
          if (target.files?.[0] != null) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              setValue(evt.target?.result);
            };
            reader.readAsDataURL(target.files[0]);
          }
        });

    case "Number":
    case "Range":
      return (evt) =>
        hasKey(evt.target, "value", isString)
          ? setValue(+evt.target.value)
          : null;
    default:
      return checkExhausted(config);
  }
}

const BASE64CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
export function intToBase64(n: number, length?: number): string {
  let base64Str = "";
  while (n) {
    base64Str = BASE64CHARS[((n % 64) + 64) % 64] + base64Str;
    n = n > 0 ? Math.floor(n / 64) : Math.ceil(n / 64);
  }
  return length != null
    ? base64Str
        .padStart(length, "0")
        .slice(Math.max(base64Str.length - length, 0))
    : base64Str;
}

export function base64ToPosInt(str: string): number {
  let n = 0;
  for (let char of str) {
    n = n * 64 + BASE64CHARS.indexOf(char);
  }
  return n;
}
