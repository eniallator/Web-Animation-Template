import {
  base64ToPosInt,
  checkExhausted,
  dom,
  formatDate,
  intToBase64,
} from "@web-art/core";
import { isOneOf, isString } from "deep-guards";
import { stringToHTML } from "../helpers.js";
import {
  CheckboxConfig,
  ColorConfig,
  CreateParser,
  DatetimeConfig,
  FileConfig,
  InputConfig,
  NumberConfig,
  Parser,
  RangeConfig,
  SelectConfig,
  TextConfig,
} from "../types.js";

export const checkboxParser: CreateParser<CheckboxConfig> = cfg => ({
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
  html: (id, initial, onChange) => {
    const defaultAttrs = [
      id != null ? ` id="${id}"` : "",
      (initial ?? cfg.default) ? " checked" : "",
    ].join("");
    const el = stringToHTML(
      `<input type="checkbox"${defaultAttrs} />`
    ) as HTMLInputElement;
    el.onchange = () => {
      onChange(el.checked);
    };
    return el;
  },
});

export const numberParser: CreateParser<NumberConfig> = cfg => ({
  serialise: String,
  deserialise: Number,
  setValue: (el, value) => {
    (el as HTMLInputElement).value = String(value);
  },
  getValue: el => Number((el as HTMLInputElement).value),
  hasChanged: value => value !== cfg.default,
  html: (id, _initial, onChange) => {
    const initial = _initial ?? cfg.default;
    const defaultAttrs = [
      id != null ? ` id="${id}"` : "",
      initial ? ` value="${initial}"` : "",
    ].join("");
    const el = stringToHTML(
      `<input type="number"${defaultAttrs} />`
    ) as HTMLInputElement;
    el.onchange = () => {
      onChange(Number(el.value));
    };
    return el;
  },
});

export const rangeParser: CreateParser<RangeConfig> = cfg => ({
  serialise: String,
  deserialise: Number,
  setValue: (el, value) => {
    (el as HTMLInputElement).value = String(value);
  },
  getValue: el => Number((el as HTMLInputElement).value),
  hasChanged: value => value !== cfg.default,
  html: (id, _initial, onChange) => {
    const initial = _initial ?? cfg.default;
    const defaultAttrs = [
      id != null ? ` id="${id}"` : "",
      initial ? ` value="${initial}"` : "",
    ].join("");
    const el = stringToHTML(
      `<input type="range"${defaultAttrs} />`
    ) as HTMLInputElement;
    el.onchange = () => {
      onChange(Number(el.value));
    };
    return el;
  },
});

export const colorParser: CreateParser<ColorConfig> = cfg => ({
  serialise: (value, shortUrl) =>
    shortUrl ? intToBase64(parseInt(value, 16)) : value,
  deserialise: (str, shortUrl) =>
    shortUrl ? base64ToPosInt(str).toString(16) : str.toUpperCase(),
  setValue: (el, value) => {
    (el as HTMLInputElement).value = value;
  },
  getValue: el => (el as HTMLInputElement).value.slice(1).toUpperCase(),
  hasChanged: value => value !== cfg.default,
  html: (id, _initial, onChange) => {
    const initial = _initial ?? cfg.default;
    const defaultAttrs = [
      id != null ? ` id="${id}"` : "",
      initial ? ` value="${initial}"` : "",
    ].join("");
    const el = stringToHTML(
      `<input type="color"${defaultAttrs} />`
    ) as HTMLInputElement;
    el.oninput = () => {
      onChange(el.value.slice(1).toUpperCase());
    };
    return el;
  },
});

export const textParser: CreateParser<TextConfig> = cfg => ({
  serialise: value => encodeURIComponent(value),
  deserialise: str => decodeURIComponent(str),
  setValue: (el, value) => {
    (el as HTMLInputElement | HTMLTextAreaElement).value = value;
  },
  getValue: el => (el as HTMLInputElement | HTMLTextAreaElement).value,
  hasChanged: value => value !== cfg.default,
  html: (id, _initial, onChange) => {
    const initial = _initial ?? cfg.default;
    const idAttr = id != null ? ` id="${id}"` : "";
    const valueAttr = initial ? ` value="${initial}"` : "";
    const el = stringToHTML(
      cfg.area
        ? `<textarea>${initial ?? ""}</textarea>`
        : `<input type="text"${idAttr}${valueAttr} />`
    ) as HTMLInputElement | HTMLTextAreaElement;
    el.onchange = () => {
      onChange(el.value);
    };
    return el;
  },
});

export const datetimeParser: CreateParser<DatetimeConfig> = cfg => ({
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
    const defaultAttrs = [
      id != null ? ` id="${id}"` : "",
      initial ? ` value="${formatDate(initial)}"` : "",
    ].join("");
    const el = stringToHTML(
      `<input type="datetime-local"${defaultAttrs}`
    ) as HTMLInputElement;
    el.onchange = () => {
      onChange(new Date(el.value));
    };
    return el;
  },
});

export const selectParser = <const A extends readonly [string, ...string[]]>(
  cfg: SelectConfig<A>
): Parser<A[number]> => {
  const isOption = isOneOf(...cfg.options);
  return {
    serialise: value => encodeURIComponent(value),
    deserialise: str =>
      decodeURIComponent(isOption(str) ? str : (cfg.default ?? cfg.options[0])),
    setValue: (el, value) => {
      (el as HTMLSelectElement).value = value;
    },
    getValue: el => (el as HTMLSelectElement).value,
    hasChanged: value => value !== (cfg.default ?? cfg.options[0]),
    html: (id, _initial, onChange) => {
      const initial = _initial ?? cfg.default;
      const defaultAttrs = [
        id != null ? ` id="${id}"` : "",
        ` value="${initial ?? cfg.options[0]}"`,
      ].join("");
      const optsStr = cfg.options.map(
        opt => `<option value="${opt}">${opt}</option>`
      );
      const el = stringToHTML(
        `<select${defaultAttrs}>${optsStr}</select>`
      ) as HTMLInputElement;
      el.onchange = () => {
        onChange(el.value);
      };
      return el;
    },
  };
};

export const fileParser: CreateParser<FileConfig> = cfg => ({
  html: (id, _initial, onChange) => {
    const idAttr = id != null ? ` id="${id}"` : "";
    const el = stringToHTML(`<div>
      <input type="file"${idAttr} style="display: none;" />
      <button class="secondary wrap-text">${cfg.text ?? ""}</button>
    </div>`);

    const inp = dom.get<HTMLInputElement>("input", el);
    const btn = dom.get<HTMLButtonElement>("button", el);

    btn.onclick = () => {
      inp.click();
    };
    inp.onchange = () => {
      if (inp.files?.[0] != null) {
        const reader = new FileReader();
        reader.onload = evt => {
          const res = evt.target?.result;
          if (isString(res)) {
            onChange(res);
          }
        };
        reader.readAsDataURL(inp.files[0]);
      }
    };

    return el;
  },
});

export const inputParser = <const C extends InputConfig>(
  cfg: C
): Parser<Required<C>["default"]> => {
  switch (cfg.type) {
    case "Checkbox":
      return checkboxParser(cfg) as Parser<Required<C>["default"]>;
    case "File":
      return fileParser(cfg) as Parser<Required<C>["default"]>;
    case "Number":
      return numberParser(cfg) as Parser<Required<C>["default"]>;
    case "Range":
      return rangeParser(cfg) as Parser<Required<C>["default"]>;
    case "Color":
      return colorParser(cfg) as Parser<Required<C>["default"]>;
    case "Text":
      return textParser(cfg) as Parser<Required<C>["default"]>;
    case "Datetime":
      return datetimeParser(cfg) as Parser<Required<C>["default"]>;
    case "Select":
      return selectParser(cfg) as Parser<Required<C>["default"]>;
    default:
      return checkExhausted(cfg);
  }
};

inputParser({} as CheckboxConfig);
