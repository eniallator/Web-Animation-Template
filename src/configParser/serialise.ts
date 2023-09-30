import { base64ToPosInt, intToBase64 } from "../core/b64";
import { checkExhausted, formatDate } from "../core/utils";
import { DeriveDefaults, DeriveStateType } from "./derive";
import {
  CheckboxConfig,
  ColorConfig,
  ConfigCollection,
  ConfigCollectionFields,
  ConfigPart,
  DatetimeConfig,
  FileConfig,
  NumberConfig,
  RangeConfig,
  SelectConfig,
  SerialisableConfig,
  StateItem,
  TextConfig,
} from "./types";

export const MAX_SERIALISED_VALUE_SIZE = 250;

function serialiseRaw(
  state: StateItem<SerialisableConfig<string>>,
  shortUrl: boolean
): string {
  const { config } = state;
  switch (config.type) {
    case "Checkbox": {
      const { value } = state as StateItem<CheckboxConfig<string>>;
      return `${shortUrl ? +value : value}`;
    }

    case "Collection": {
      const { value } = state as StateItem<
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
      const { value } = state as StateItem<ColorConfig<string>>;
      const col = String(value.slice(1).toUpperCase());
      if (shortUrl) return intToBase64(parseInt(col, 16));
      return col;
    }

    case "Datetime": {
      const narrowed = state as StateItem<DatetimeConfig<string>>;
      return shortUrl
        ? intToBase64(
            narrowed.value.getTime() / 60000 - new Date().getTimezoneOffset()
          )
        : encodeURIComponent(formatDate(narrowed.value));
    }

    case "File": {
      const { value } = state as StateItem<FileConfig<string>>;
      return encodeURIComponent(value);
    }

    case "Number": {
      const narrowed = state as StateItem<NumberConfig<string>>;
      return `${narrowed.value}`;
    }

    case "Range": {
      const narrowed = state as StateItem<RangeConfig<string>>;
      return `${narrowed.value}`;
    }

    case "Select": {
      const narrowed = state as StateItem<SelectConfig<string>>;
      return encodeURIComponent(narrowed.value);
    }

    case "Text": {
      const narrowed = state as StateItem<TextConfig<string>>;
      return encodeURIComponent(narrowed.value);
    }

    default:
      return checkExhausted(config);
  }
}

export function serialise(
  state: StateItem<SerialisableConfig<string>>,
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
      return new Date(
        shortUrl
          ? formatDate(new Date(base64ToPosInt(value) * 60000))
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

export function isSerialisableStateItem(
  item: StateItem<ConfigPart<string>>
): item is StateItem<SerialisableConfig<string>> {
  return isSerialisable(item.config);
}
