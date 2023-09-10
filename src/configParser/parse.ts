import { base64ToPosInt, intToBase64 } from "../core/b64";
import { checkExhausted, hasKey, isString } from "../core/utils";
import { DeriveDefaults, DeriveStateType } from "./derive";
import {
  CheckboxConfig,
  ColorConfig,
  ConfigCollection,
  ConfigCollectionFields,
  ConfigPart,
  DatetimeConfig,
  FileConfig,
  InputConfig,
  NumberConfig,
  OnUpdate,
  RangeConfig,
  SelectConfig,
  SerialisableConfig,
  StateItem,
  TextConfig,
} from "./types";

export const MAX_SERIALISED_VALUE_SIZE = 100;

function serialiseRaw(
  state: StateItem<string, SerialisableConfig<string>>,
  shortUrl: boolean
): string {
  const { config } = state;
  switch (config.type) {
    case "Checkbox": {
      const { value } = state as StateItem<string, CheckboxConfig<string>>;
      return `${shortUrl ? +value : value}`;
    }

    case "Collection": {
      const { value } = state as StateItem<
        string,
        ConfigCollection<string, ConfigCollectionFields>
      >;
      return value
        .map((row) =>
          row
            .map((value, i) =>
              serialise(
                { config: config.fields[i], value, clicked: false },
                shortUrl
              )
            )
            .join(",")
        )
        .join(",");
    }

    case "Color": {
      const { value } = state as StateItem<string, ColorConfig<string>>;
      const col = String(value.slice(1).toUpperCase());
      if (shortUrl) return intToBase64(parseInt(col, 16));
      return col;
    }

    case "Datetime": {
      const narrowed = state as StateItem<string, DatetimeConfig<string>>;
      return shortUrl
        ? intToBase64(
            narrowed.value.getTime() / 60000 - new Date().getTimezoneOffset()
          )
        : encodeURIComponent(
            narrowed.value
              .toLocaleString()
              .replace(
                /(?<d>\d+)\/(?<m>\d+)\/(?<y>\d+)[^\d]*(?<t>\d+:\d+).*/,
                "$<y>-$<m>-$<d>T$<t>"
              )
          );
    }

    case "File": {
      const { value } = state as StateItem<string, FileConfig<string>>;
      return encodeURIComponent(value);
    }

    case "Number": {
      const narrowed = state as StateItem<string, NumberConfig<string>>;
      return `${narrowed.value}`;
    }

    case "Range": {
      const narrowed = state as StateItem<string, RangeConfig<string>>;
      return `${narrowed.value}`;
    }

    case "Select": {
      const narrowed = state as StateItem<string, SelectConfig<string>>;
      return encodeURIComponent(narrowed.value);
    }

    case "Text": {
      const narrowed = state as StateItem<string, TextConfig<string>>;
      return encodeURIComponent(narrowed.value);
    }

    default:
      return checkExhausted(config);
  }
}

export function serialise(
  state: StateItem<string, SerialisableConfig<string>>,
  shortUrl: boolean
): string | null {
  const raw = serialiseRaw(state, shortUrl);
  return raw.length <= MAX_SERIALISED_VALUE_SIZE ? raw : null;
}

export function deserialise<C extends SerialisableConfig<string>>(
  config: C,
  value: string,
  shortUrl: boolean
): DeriveStateType<C> {
  switch (config.type) {
    case "Checkbox":
      return (
        shortUrl ? value === "1" : value.toLowerCase() === "true"
      ) as DeriveStateType<C>;
    case "Color":
      return (
        shortUrl ? base64ToPosInt(value).toString(16) : value.toUpperCase()
      ) as DeriveStateType<C>;
    case "Collection": {
      const flat = value === "" ? [] : value.split(",");
      return new Array(Math.ceil(flat.length / config.fields.length))
        .fill(null)
        .map(
          (_, rowIndex) =>
            new Array(config.fields.length).fill(null).map((_, colIndex) => {
              const childConfig = config.fields[colIndex];
              return deserialise(
                childConfig,
                flat[rowIndex * config.fields.length + colIndex],
                shortUrl
              );
            }) as DeriveDefaults<typeof config.fields>
        ) as DeriveStateType<C>;
    }
    case "Datetime":
      return (
        shortUrl
          ? new Date(base64ToPosInt(value) * 60000)
              .toLocaleString()
              .replace(
                /(?<d>\d+)\/(?<m>\d+)\/(?<y>\d+)[^\d]*(?<t>\d+:\d+).*/,
                "$<y>-$<m>-$<d>T$<t>"
              )
          : decodeURIComponent(value)
      ) as DeriveStateType<C>;
    case "Number":
    case "Range":
      return Number(value) as DeriveStateType<C>;
    case "File":
    case "Select":
    case "Text":
      return decodeURIComponent(value) as DeriveStateType<C>;
    default:
      return checkExhausted(config);
  }
}

export function inputType(type: InputConfig<string>["type"]): string {
  switch (type) {
    case "Checkbox":
      return "checkbox";
    case "Color":
      return "color";
    case "Datetime":
      return "datetime-local";
    case "File":
      return "file";
    case "Number":
      return "number";
    case "Range":
      return "range";
    case "Select":
      return "select";
    case "Text":
      return "text";
    default:
      return checkExhausted(type);
  }
}

export function isSerialisable(
  config: ConfigPart<string>
): config is SerialisableConfig<string> {
  switch (config.type) {
    case "Checkbox":
    case "Collection":
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

export function inputValue<C extends InputConfig<string>>(
  config: C,
  el: HTMLInputElement
): DeriveStateType<C> {
  switch (config.type) {
    case "Checkbox":
      return el.hasAttribute("checked") as DeriveStateType<C>;
    case "Color":
      return el.value.slice(1).toUpperCase() as DeriveStateType<C>;
    case "File":
      return "" as DeriveStateType<C>;
    case "Number":
    case "Range":
      return Number(el.value) as DeriveStateType<C>;
    case "Datetime":
    case "Select":
    case "Text":
      return el.value as DeriveStateType<C>;
    default:
      return checkExhausted(config);
  }
}

export function inputCallback<C extends InputConfig<string>>(
  config: C,
  onUpdate: OnUpdate<C>
): ((evt: Event) => void) | null {
  switch (config.type) {
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
          ? onUpdate(
              evt.target.value.slice(1).toUpperCase() as DeriveStateType<C>
            )
          : null;
    default:
      return checkExhausted(config);
  }
}

export function changeCallback<C extends InputConfig<string>>(
  config: C,
  onUpdate: OnUpdate<C>
): ((evt: Event) => void) | null {
  switch (config.type) {
    case "Color":
      return null;
    case "Checkbox":
      return (evt) =>
        onUpdate(
          (evt.target as HTMLElement).hasAttribute(
            "checked"
          ) as DeriveStateType<C>
        );
    case "Datetime":
    case "Select":
    case "Text":
      return (evt) =>
        hasKey(evt.target, "value", isString)
          ? onUpdate(evt.target.value as DeriveStateType<C>)
          : null;
    case "File":
      return (evt) =>
        new Promise<void>(() => {
          const target = evt.target as HTMLInputElement;
          if (target.files?.[0] != null) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              onUpdate(evt.target?.result as DeriveStateType<C>);
            };
            reader.readAsDataURL(target.files[0]);
          }
        });

    case "Number":
    case "Range":
      return (evt) =>
        hasKey(evt.target, "value", isString)
          ? onUpdate(+evt.target.value as DeriveStateType<C>)
          : null;
    default:
      return checkExhausted(config);
  }
}
