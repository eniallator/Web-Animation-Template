import {
  base64ToPosInt,
  formatDate,
  intToBase64,
  Option,
  tuple,
} from "@web-art/core";
import { isOneOf } from "deep-guards";
import { stringToHTML, toAttrs, valueParser } from "../helpers.js";
import { ValueConfig, ValueParser } from "../types.js";

export const checkboxParser = (cfg: ValueConfig<boolean>) =>
  valueParser({
    label: cfg.label,
    default: cfg.default ?? false,
    serialise: (value, shortUrl) => `${shortUrl ? +value : value}`,
    deserialise: (str, shortUrl) => (shortUrl ? str === "1" : str === "true"),
    setValue: (el, value) => {
      if (value) {
        el.setAttribute("checked", "");
      } else {
        el.removeAttribute("checked");
      }
    },
    getValue: el => el.hasAttribute("checked"),
    hasChanged: value => value !== cfg.default,
    html: (id, _initial, onChange) => {
      const initial = _initial ?? cfg.default;

      const attrs = [
        Option.some(id).map(id => [tuple("id", id)]),
        Option.some([tuple("checked", null)]).filter(() => initial != null),
        Option.some(cfg.attrs).map<[string, string][]>(Object.entries),
      ]
        .map(opt => opt.map(toAttrs).getOrElse(() => ""))
        .join("");

      const el = stringToHTML(
        `<input type="checkbox"${attrs} />`
      ) as HTMLInputElement;
      el.onchange = () => {
        onChange(el.checked);
      };
      return el;
    },
  });

export const numberParser = (cfg: ValueConfig<number>) =>
  valueParser({
    label: cfg.label,
    default: cfg.default ?? Number(cfg.attrs?.["min"] ?? 0),
    serialise: String,
    deserialise: Number,
    setValue: (el, value) => {
      (el as HTMLInputElement).value = String(value);
    },
    getValue: el => Number((el as HTMLInputElement).value),
    hasChanged: value => value !== cfg.default,
    html: (id, _initial, onChange) => {
      const initial = _initial ?? cfg.default;

      const attrs = [
        Option.some(id).map(id => [tuple("id", id)]),
        Option.some(initial).map(initial => [tuple("value", `${initial}`)]),
        Option.some(cfg.attrs).map<[string, string][]>(Object.entries),
      ]
        .map(opt => opt.map(toAttrs).getOrElse(() => ""))
        .join("");

      const el = stringToHTML(
        `<input type="number"${attrs} />`
      ) as HTMLInputElement;
      el.onchange = () => {
        onChange(Number(el.value));
      };
      return el;
    },
  });

export const rangeParser = (cfg: ValueConfig<number>) => {
  return valueParser({
    label: cfg.label,
    // Calc ceil(middle of range) instead of 0
    default: cfg.default ?? 0,
    serialise: String,
    deserialise: Number,
    setValue: (el, value) => {
      (el as HTMLInputElement).value = String(value);
    },
    getValue: el => Number((el as HTMLInputElement).value),
    hasChanged: value => value !== cfg.default,
    html: (id, _initial, onChange) => {
      const initial = _initial ?? cfg.default;

      const attrs = [
        Option.some(id).map(id => [tuple("id", id)]),
        Option.some(initial).map(initial => [tuple("value", `${initial}`)]),
        Option.some(cfg.attrs).map<[string, string][]>(Object.entries),
      ]
        .map(opt => opt.map(toAttrs).getOrElse(() => ""))
        .join("");

      const el = stringToHTML(
        `<input type="range"${attrs} />`
      ) as HTMLInputElement;
      el.onchange = () => {
        onChange(Number(el.value));
      };
      return el;
    },
  });
};

export const colorParser = (cfg: ValueConfig<string>) =>
  valueParser({
    label: cfg.label,
    default: cfg.default ?? "000000",
    serialise: (value, shortUrl) =>
      shortUrl ? intToBase64(parseInt(value, 16)) : value,
    deserialise: (str, shortUrl) =>
      shortUrl ? base64ToPosInt(str).toString(16) : str.toUpperCase(),
    setValue: (el, value) => {
      (el as HTMLInputElement).value = `#${value}`;
    },
    getValue: el => (el as HTMLInputElement).value.slice(1).toUpperCase(),
    hasChanged: value => value !== cfg.default,
    html: (id, _initial, onChange) => {
      const initial = _initial ?? cfg.default;

      const attrs = [
        Option.some(id).map(id => [tuple("id", id)]),
        Option.some(initial).map(initial => [tuple("value", `#${initial}`)]),
        Option.some(cfg.attrs).map<[string, string][]>(Object.entries),
      ]
        .map(opt => opt.map(toAttrs).getOrElse(() => ""))
        .join("");

      const el = stringToHTML(
        `<input type="color"${attrs} />`
      ) as HTMLInputElement;
      el.oninput = () => {
        onChange(el.value.slice(1).toUpperCase());
      };
      return el;
    },
  });

export const textParser = (cfg: ValueConfig<string> & { area?: boolean }) =>
  valueParser({
    label: cfg.label,
    default: cfg.default ?? "",
    serialise: value => encodeURIComponent(value),
    deserialise: str => decodeURIComponent(str),
    setValue: (el, value) => {
      (el as HTMLInputElement | HTMLTextAreaElement).value = value;
    },
    getValue: el => (el as HTMLInputElement | HTMLTextAreaElement).value,
    hasChanged: value => value !== cfg.default,
    html: (id, _initial, onChange) => {
      const initial = _initial ?? cfg.default;

      const attrs = [
        Option.some(id).map(id => [tuple("id", id)]),
        Option.some(cfg.attrs).map<[string, string][]>(Object.entries),
      ]
        .map(opt => opt.map(toAttrs).getOrElse(() => ""))
        .join("");

      const valueAttr = initial != null ? toAttrs([["value", initial]]) : "";
      const el = stringToHTML(
        cfg.area
          ? `<textarea ${attrs}>${initial ?? ""}</textarea>`
          : `<input type="text"${valueAttr}${attrs} />`
      ) as HTMLInputElement | HTMLTextAreaElement;
      el.onchange = () => {
        onChange(el.value);
      };
      return el;
    },
  });

export const datetimeParser = (cfg: ValueConfig<Date>) =>
  valueParser({
    label: cfg.label,
    default: cfg.default ?? new Date(0),
    serialise: (value, shortUrl) =>
      shortUrl
        ? intToBase64(value.getTime() / 60000 - new Date().getTimezoneOffset())
        : encodeURIComponent(formatDate(value)),
    deserialise: (str, shortUrl) =>
      new Date(
        shortUrl
          ? formatDate(new Date(base64ToPosInt(str) * 60000))
          : decodeURIComponent(str)
      ),
    setValue: (el, value) => {
      (el as HTMLInputElement).value = formatDate(value);
    },
    getValue: el => new Date((el as HTMLInputElement).value),
    hasChanged: value =>
      cfg.default == null
        ? !Number.isNaN(value.getTime())
        : value.getTime() !== cfg.default.getTime(),
    html: (id, _initial, onChange) => {
      const initial = _initial ?? cfg.default;

      const attrs = [
        Option.some(id).map(id => [tuple("id", id)]),
        Option.some(initial).map(initial => [
          tuple("value", formatDate(initial)),
        ]),
        Option.some(cfg.attrs).map<[string, string][]>(Object.entries),
      ]
        .map(opt => opt.map(toAttrs).getOrElse(() => ""))
        .join("");

      const el = stringToHTML(
        `<input type="datetime-local"${attrs} />`
      ) as HTMLInputElement;
      el.onchange = () => {
        onChange(new Date(el.value));
      };
      return el;
    },
  });

export const selectParser = <const A extends readonly [string, ...string[]]>(
  cfg: ValueConfig<A[number]> & { options: A }
): ValueParser<A[number]> => {
  const isOption = isOneOf(...cfg.options);
  return {
    type: "Value",
    label: cfg.label,
    default: cfg.default ?? cfg.options[0],
    serialise: value => encodeURIComponent(value),
    deserialise: str =>
      decodeURIComponent(isOption(str) ? str : (cfg.default ?? cfg.options[0])),
    setValue: (el, value) => {
      (el as HTMLSelectElement).value = value;
    },
    getValue: el => (el as HTMLSelectElement).value,
    hasChanged: value => value !== (cfg.default ?? cfg.options[0]),
    html: (id, _initial, onChange) => {
      const initial = _initial ?? cfg.default ?? cfg.options[0];

      const attrs = [
        Option.some(id).map(id => [tuple("id", id)]),
        Option.some(cfg.attrs).map<[string, string][]>(Object.entries),
      ]
        .map(opt => opt.map(toAttrs).getOrElse(() => ""))
        .join("");

      const el = stringToHTML(
        `<select${attrs}>${cfg.options
          .map(opt => `<option value="${opt}">${opt}</option>`)
          .join("")}</select>`
      ) as HTMLInputElement;
      el.value = initial;
      el.onchange = () => {
        onChange(el.value);
      };
      return el;
    },
  };
};
