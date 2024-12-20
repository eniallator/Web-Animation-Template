import {
  base64ToPosInt,
  dom,
  formatDate,
  intToBase64,
  Option,
  tuple,
} from "@web-art/core";
import { isOneOf, isString } from "deep-guards";
import { stringToHTML, toAttrs, valueParser } from "../helpers.js";
import { ValueConfig } from "../types.js";

export const checkboxParser = (cfg: ValueConfig<boolean>) => {
  const defaultValue = cfg.default ?? false;
  return valueParser(
    (
      onChange: (value: boolean) => void,
      getValue: () => boolean,
      _initial: boolean | null
    ) => ({
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
      html: (id, query, shortUrl) => {
        const initial = Option.from(query)
          .map(q => (shortUrl ? q === "1" : q === "true"))
          .getOrElse(() => _initial ?? defaultValue);

        const attrs = [
          Option.from(id).map(id => [tuple("id", id)]),
          Option.from([tuple("checked", null)]).filter(() => initial),
          Option.from(cfg.attrs).map<[string, string][]>(Object.entries),
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

export const numberParser = (cfg: ValueConfig<number>) => {
  const defaultValue =
    cfg.default ?? (cfg.attrs != null ? defaultNumber(cfg.attrs) : 0);
  return valueParser(
    (
      onChange: (value: number) => void,
      getValue: () => number,
      _initial: number | null
    ) => ({
      default: defaultValue,
      serialise: () =>
        getValue() !== defaultValue ? String(getValue()) : null,
      updateValue: el => {
        (el as HTMLInputElement).value = String(getValue());
      },
      getValue: el => Number((el as HTMLInputElement).value),
      html: (id, query) => {
        const initial =
          query != null ? Number(query) : (_initial ?? defaultValue);

        const attrs = [
          Option.from(id).map(id => [tuple("id", id)]),
          Option.from([tuple("value", `${initial}`)]),
          Option.from(cfg.attrs).map<[string, string][]>(Object.entries),
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
    }),
    cfg.label,
    cfg.title
  );
};

export const rangeParser = (cfg: ValueConfig<number>) => {
  const defaultValue = cfg.default ?? defaultNumber(cfg.attrs);
  return valueParser(
    (
      onChange: (value: number) => void,
      getValue: () => number,
      _initial: number | null
    ) => ({
      default: defaultValue,
      serialise: () =>
        getValue() !== defaultValue ? String(getValue()) : null,
      updateValue: el => {
        (el as HTMLInputElement).value = String(getValue());
      },
      getValue: el => Number((el as HTMLInputElement).value),
      html: (id, query) => {
        const initial =
          query != null ? Number(query) : (_initial ?? defaultValue);

        const attrs = [
          Option.from(id).map(id => [tuple("id", id)]),
          Option.from([tuple("value", `${initial}`)]),
          Option.from(cfg.attrs).map<[string, string][]>(Object.entries),
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
    }),
    cfg.label,
    cfg.title
  );
};

export const colorParser = (cfg: ValueConfig<string>) => {
  const defaultValue = cfg.default ?? "000000";
  return valueParser(
    (
      onChange: (value: string) => void,
      getValue: () => string,
      _initial: string | null
    ) => ({
      default: defaultValue,
      serialise: shortUrl =>
        getValue() === defaultValue
          ? null
          : shortUrl
            ? intToBase64(parseInt(getValue(), 16))
            : getValue(),
      updateValue: el => {
        (el as HTMLInputElement).value = `#${getValue()}`;
      },
      getValue: el => (el as HTMLInputElement).value.slice(1).toUpperCase(),
      html: (id, query, shortUrl) => {
        const initial = Option.from(query)
          .map(q =>
            shortUrl ? base64ToPosInt(q).toString(16) : q.toUpperCase()
          )
          .getOrElse(() => _initial ?? defaultValue);

        const attrs = [
          Option.from(id).map(id => [tuple("id", id)]),
          Option.from([tuple("value", `#${initial}`)]),
          Option.from(cfg.attrs).map<[string, string][]>(Object.entries),
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
    }),
    cfg.label,
    cfg.title
  );
};

export const textParser = (cfg: ValueConfig<string> & { area?: boolean }) => {
  const defaultValue = cfg.default ?? "";
  return valueParser(
    (
      onChange: (value: string) => void,
      getValue: () => string,
      _initial: string | null
    ) => ({
      default: defaultValue,
      serialise: () =>
        getValue() !== defaultValue ? encodeURIComponent(getValue()) : null,
      updateValue: el => {
        (el as HTMLInputElement | HTMLTextAreaElement).value = getValue();
      },
      getValue: el => (el as HTMLInputElement | HTMLTextAreaElement).value,
      html: (id, query) => {
        const initial = Option.from(query)
          .map(decodeURIComponent)
          .getOrElse(() => _initial ?? defaultValue);

        const attrs = [
          Option.from(id).map(id => [tuple("id", id)]),
          Option.from(cfg.attrs).map<[string, string][]>(Object.entries),
        ]
          .map(opt => opt.map(toAttrs).getOrElse(() => ""))
          .join("");

        const valueAttr = toAttrs([["value", initial]]);
        const el = stringToHTML(
          cfg.area
            ? `<textarea ${attrs}>${initial}</textarea>`
            : `<input type="text"${valueAttr}${attrs} />`
        ) as HTMLInputElement | HTMLTextAreaElement;
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
  return valueParser(
    (
      onChange: (value: Date) => void,
      getValue: () => Date,
      _initial: Date | null
    ) => ({
      default: defaultValue,
      serialise: shortUrl =>
        getValue().getTime() === defaultValue.getTime()
          ? null
          : shortUrl
            ? intToBase64(
                getValue().getTime() / 60000 - new Date().getTimezoneOffset()
              )
            : encodeURIComponent(formatDate(getValue())),
      updateValue: el => {
        (el as HTMLInputElement).value = formatDate(getValue());
      },
      getValue: el => new Date((el as HTMLInputElement).value),
      html: (id, query, shortUrl) => {
        const initial =
          query != null
            ? new Date(
                shortUrl
                  ? formatDate(new Date(base64ToPosInt(query) * 60000))
                  : decodeURIComponent(query)
              )
            : (_initial ?? defaultValue);

        const attrs = [
          Option.from(id).map(id => [tuple("id", id)]),
          Option.from(initial).map(initial => [
            tuple("value", formatDate(initial)),
          ]),
          Option.from(cfg.attrs).map<[string, string][]>(Object.entries),
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
    (
      onChange: (value: SelectValue<A>) => void,
      getValue: () => SelectValue<A>,
      _initial: SelectValue<A> | null
    ) => ({
      default: defaultValue,
      serialise: () =>
        getValue() !== defaultValue ? encodeURIComponent(getValue()) : null,
      updateValue: el => {
        (el as HTMLSelectElement).value = getValue();
      },
      getValue: el => (el as HTMLSelectElement).value as SelectValue<A>,
      html: (id, query) => {
        const initial = Option.from(query)
          .guard(isOption)
          .getOrElse(() => _initial ?? defaultValue);

        const attrs = [
          Option.from(id).map(id => [tuple("id", id)]),
          Option.from(cfg.attrs).map<[string, string][]>(Object.entries),
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
    (
      onChange: (value: string) => void,
      getValue: () => string,
      _initial: string | null
    ) => ({
      default: defaultValue,
      serialise: () =>
        getValue() !== defaultValue ? encodeURIComponent(getValue()) : null,
      getValue: () => currentValue,
      updateValue: () => {
        currentValue = getValue();
      },
      html: (id, query) => {
        const attrs = toAttrs([
          ...Option.from(id)
            .map(id => [tuple("id", id)])
            .getOrElse((): [string, string][] => []),
          tuple("style", "display: none;"),
          ...Option.from(cfg.attrs)
            .map<[string, string][]>(Object.entries)
            .getOrElse((): [string, string][] => []),
        ]);

        currentValue =
          query != null
            ? decodeURIComponent(query)
            : (_initial ?? defaultValue);

        const el = stringToHTML(`<div>
          <input type="file"${attrs} />
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
              Option.from(evt.target?.result)
                .guard(isString)
                .tap(value => {
                  onChange(value);
                  currentValue = value;
                });
            };
            reader.readAsDataURL(inp.files[0]);
          }
        };

        return el as HTMLElement;
      },
    }),
    cfg.label,
    cfg.title
  );
};
