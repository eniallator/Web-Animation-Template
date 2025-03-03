import {
  b64ToInt,
  dom,
  formatDate,
  formatIsoDate,
  intToB64,
  Option,
  tuple,
} from "@web-art/core";
import { isOneOf, isString } from "deep-guards";

import { valueParser } from "../create.js";
import { ValueConfig } from "../types.js";

export const checkboxParser = (cfg: ValueConfig<boolean>) => {
  const defaultValue = cfg.default ?? false;
  return valueParser<boolean>(
    (onChange, getValue, _initial) => ({
      default: defaultValue,
      serialise: shortUrl =>
        getValue() !== defaultValue
          ? `${shortUrl ? +getValue() : getValue()}`
          : null,
      updateValue: el => {
        if (getValue()) {
          el.setAttribute("checked", "");
        } else {
          el.removeAttribute("checked");
        }
      },
      getValue: el => el.hasAttribute("checked"),
      html: (id, query) => {
        const initial =
          query != null
            ? isOneOf("1", "true")(query)
            : (_initial ?? defaultValue);

        const attrs = dom.toAttrs(
          Option.from(id)
            .map(id => tuple<[string, string | null]>("id", id))
            .toArray()
            .concat(
              Object.entries(cfg.attrs ?? {}),
              initial ? [tuple("checked", null)] : []
            )
        );

        const el = dom.toHtml<HTMLInputElement>(
          `<input type="checkbox"${attrs} />`
        );
        el.onchange = () => {
          onChange(el.checked);
        };
        return el;
      },
    }),
    cfg.label,
    cfg.title
  );
};

const defaultNumber = (attrs?: Record<string, string>) => {
  const min = Number(attrs?.["min"] ?? 0);
  const max = Number(attrs?.["max"] ?? 100);
  const step = Number(attrs?.["step"] ?? 1);

  return Math.ceil((max - min) / (2 * step)) * step + min;
};

const numToStr = (n: number) =>
  [`${n}`, encodeURIComponent(n.toExponential())].reduce((a, b) =>
    a.length < b.length ? a : b
  );

export const numberParser = (cfg: ValueConfig<number>) => {
  const defaultValue =
    cfg.default ?? (cfg.attrs != null ? defaultNumber(cfg.attrs) : 0);
  return valueParser<number>(
    (onChange, getValue, _initial) => ({
      default: defaultValue,
      serialise: () =>
        getValue() !== defaultValue ? numToStr(getValue()) : null,
      updateValue: el => {
        (el as HTMLInputElement).value = `${getValue()}`;
      },
      getValue: el => Number((el as HTMLInputElement).value),
      html: (id, query) => {
        const initial =
          query != null ? Number(query) : (_initial ?? defaultValue);

        const attrs = dom.toAttrs(
          Option.from(id)
            .map(id => tuple<[string, string | null]>("id", id))
            .toArray()
            .concat(Object.entries(cfg.attrs ?? {}), [
              tuple("value", `${initial}`),
            ])
        );

        const el = dom.toHtml<HTMLInputElement>(
          `<input type="number"${attrs} />`
        );
        el.onchange = () => {
          onChange(Number(el.value));
        };
        return el;
      },
    }),
    cfg.label,
    cfg.title
  );
};

export const rangeParser = (cfg: ValueConfig<number>) => {
  const defaultValue = cfg.default ?? defaultNumber(cfg.attrs);
  return valueParser<number>(
    (onChange, getValue, _initial) => ({
      default: defaultValue,
      serialise: () =>
        getValue() !== defaultValue ? numToStr(getValue()) : null,
      updateValue: el => {
        (el as HTMLInputElement).value = `${getValue()}`;
      },
      getValue: el => Number((el as HTMLInputElement).value),
      html: (id, query) => {
        const initial =
          query != null ? Number(query) : (_initial ?? defaultValue);

        const attrs = dom.toAttrs(
          Option.from(id)
            .map(id => tuple<[string, string | null]>("id", id))
            .toArray()
            .concat(Object.entries(cfg.attrs ?? {}), [
              tuple("value", `${initial}`),
            ])
        );

        const el = dom.toHtml<HTMLInputElement>(
          `<input type="range"${attrs} />`
        );
        el.onchange = () => {
          onChange(Number(el.value));
        };
        return el;
      },
    }),
    cfg.label,
    cfg.title
  );
};

export const colorParser = (cfg: ValueConfig<string>) => {
  const defaultValue = cfg.default ?? "000000";
  return valueParser<string>(
    (onChange, getValue, _initial) => ({
      default: defaultValue,
      serialise: shortUrl =>
        getValue() === defaultValue
          ? null
          : shortUrl
            ? intToB64(parseInt(getValue(), 16))
            : getValue(),
      updateValue: el => {
        (el as HTMLInputElement).value = `#${getValue()}`;
      },
      getValue: el => (el as HTMLInputElement).value.slice(1).toUpperCase(),
      html: (id, query, shortUrl) => {
        const initial =
          query != null
            ? shortUrl
              ? b64ToInt(query).toString(16)
              : query.toUpperCase()
            : (_initial ?? defaultValue);

        const attrs = dom.toAttrs(
          Option.from(id)
            .map(id => tuple<[string, string | null]>("id", id))
            .toArray()
            .concat(Object.entries(cfg.attrs ?? {}), [
              tuple("value", `#${initial}`),
            ])
        );

        const el = dom.toHtml<HTMLInputElement>(
          `<input type="color"${attrs} />`
        );
        el.oninput = () => {
          onChange(el.value.slice(1).toUpperCase());
        };
        return el;
      },
    }),
    cfg.label,
    cfg.title
  );
};

export const textParser = (cfg: ValueConfig<string> & { area?: boolean }) => {
  const defaultValue = cfg.default ?? "";
  return valueParser<string>(
    (onChange, getValue, _initial) => ({
      default: defaultValue,
      serialise: () => (getValue() !== defaultValue ? getValue() : null),
      updateValue: el => {
        (el as HTMLInputElement | HTMLTextAreaElement).value = getValue();
      },
      getValue: el => (el as HTMLInputElement | HTMLTextAreaElement).value,
      html: (id, query) => {
        const attrs = dom.toAttrs(
          Option.from(id)
            .map(id => tuple<[string, string | null]>("id", id))
            .toArray()
            .concat(Object.entries(cfg.attrs ?? {}))
        );

        const initial = query ?? _initial ?? defaultValue;
        const el = dom.toHtml<HTMLInputElement | HTMLTextAreaElement>(
          cfg.area
            ? `<textarea ${attrs}>${initial}</textarea>`
            : `<input type="text"${dom.toAttrs([["value", initial]])}${attrs} />`
        );
        el.onchange = () => {
          onChange(el.value);
        };
        return el;
      },
    }),
    cfg.label,
    cfg.title
  );
};

export const datetimeParser = (cfg: ValueConfig<Date>) => {
  const defaultValue = cfg.default ?? new Date(0);
  return valueParser<Date>(
    (onChange, getValue, _initial) => ({
      default: defaultValue,
      serialise: shortUrl =>
        getValue().getTime() === defaultValue.getTime()
          ? null
          : shortUrl
            ? intToB64(getValue().getTime())
            : formatIsoDate(getValue()),
      updateValue: el => {
        (el as HTMLInputElement).value = formatDate(getValue());
      },
      getValue: el => new Date((el as HTMLInputElement).value),
      html: (id, query, shortUrl) => {
        const initial =
          query != null
            ? new Date(shortUrl ? b64ToInt(query) : query)
            : (_initial ?? defaultValue);

        const attrs = dom.toAttrs(
          Option.from(id)
            .map(id => tuple<[string, string | null]>("id", id))
            .toArray()
            .concat(Object.entries(cfg.attrs ?? {}), [
              tuple("value", formatDate(initial)),
            ])
        );

        const el = dom.toHtml<HTMLInputElement>(
          `<input type="datetime-local"${attrs} />`
        );
        el.onchange = () => {
          onChange(new Date(el.value));
        };
        return el;
      },
    }),
    cfg.label,
    cfg.title
  );
};

type SelectValue<A extends readonly [string, ...string[]]> =
  A extends readonly (infer T)[] ? T : never;

export const selectParser = <const A extends readonly [string, ...string[]]>(
  cfg: ValueConfig<SelectValue<A>> & { options: A }
) => {
  const isOption = isOneOf(...cfg.options);
  const defaultValue = cfg.default ?? (cfg.options[0] as SelectValue<A>);

  return valueParser<SelectValue<A>>(
    (onChange, getValue, _initial) => ({
      default: defaultValue,
      serialise: () => (getValue() !== defaultValue ? getValue() : null),
      updateValue: el => {
        (el as HTMLSelectElement).value = getValue();
      },
      getValue: el => (el as HTMLSelectElement).value as SelectValue<A>,
      html: (id, query) => {
        const initial = isOption(query) ? query : (_initial ?? defaultValue);

        const attrs = dom.toAttrs(
          Option.from(id)
            .map(id => tuple<[string, string | null]>("id", id))
            .toArray()
            .concat(Object.entries(cfg.attrs ?? {}))
        );

        const el = dom.toHtml<HTMLSelectElement>(
          `<select${attrs}>${cfg.options
            .map(opt => `<option value="${opt}">${opt}</option>`)
            .join("")}</select>`
        );
        el.value = initial;
        el.onchange = () => {
          onChange(el.value as SelectValue<A>);
        };
        return el;
      },
    }),
    cfg.label,
    cfg.title
  );
};

export const fileParser = (cfg: ValueConfig<string> & { text?: string }) => {
  const defaultValue = cfg.default ?? "";
  let currentValue = defaultValue;
  return valueParser<string>(
    (onChange, getValue, _initial) => ({
      default: defaultValue,
      serialise: () => (getValue() !== defaultValue ? currentValue : null),
      getValue: () => currentValue,
      updateValue: () => {
        currentValue = getValue();
      },
      html: (id, query) => {
        const attrs = dom.toAttrs(
          Option.from(id)
            .map(id => tuple<[string, string | null]>("id", id))
            .toArray()
            .concat(Object.entries(cfg.attrs ?? {}), [
              tuple("style", "display: none;"),
            ])
        );

        const el = dom.toHtml(`<div>
          <input type="file"${attrs} />
          <button class="secondary wrap-text">${cfg.text ?? ""}</button>
        </div>`);

        currentValue = query ?? _initial ?? currentValue;
        const inp = dom.get<HTMLInputElement>("input", el);
        inp.onchange = () => {
          if (inp.files?.[0] != null) {
            const reader = new FileReader();
            reader.onload = evt => {
              if (isString(evt.target?.result)) {
                currentValue = evt.target.result;
                onChange(evt.target.result);
              }
            };
            reader.readAsDataURL(inp.files[0]);
          }
        };

        dom.get<HTMLButtonElement>("button", el).onclick = () => {
          inp.click();
        };

        return el;
      },
    }),
    cfg.label,
    cfg.title
  );
};
