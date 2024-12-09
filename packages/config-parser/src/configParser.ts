import {
  dom,
  filterAndMap,
  intToBase64,
  mapObject,
  tuple,
} from "@web-art/core";
import { configParser } from "./parsers/index.js";
import {
  ConfigPart,
  DefaultType,
  ExtractIds,
  State,
  StateItem,
  StateValues,
  WithId,
} from "./types.js";

type ParamConfigOptions = {
  query?: string;
} & ({ shortUrl?: false } | { shortUrl: true; hashKeyLength?: number });

export class ParamConfig<
  const C extends readonly WithId<ConfigPart, string>[],
> {
  private readonly state: State<C>;
  private readonly shortUrl: boolean;
  private readonly listeners: {
    cb: (values: StateValues<C>, updates: ExtractIds<C>[]) => void;
    subscriptions: Set<ExtractIds<C>> | null;
  }[];
  private readonly extraValue: string | undefined;
  private readonly hashKeyLength: number;

  private updates: ExtractIds<C>[];

  constructor(
    configs: C,
    baseEl: HTMLElement,
    options: ParamConfigOptions = {}
  ) {
    const { query = location.search, shortUrl = false } = options;
    const hashKeyLength =
      (options.shortUrl ? options.hashKeyLength : null) ?? 6;
    const initialValues = this.parseQuery(query, shortUrl);
    const stateEntries = configs.map(({ id, ...cfg }) => {
      const parser = configParser(cfg);
      const initialStr = initialValues[this.queryKey(id)];
      const initial =
        initialStr != null && "deserialise" in parser
          ? parser.deserialise(initialStr, shortUrl)
          : null;
      const el = parser.html(id, initial, value => {
        if (value != null) {
          (
            (this.state as Record<string, unknown>)[id] as StateItem<typeof cfg>
          ).value = value;
        }
        this.updates.push(id);
        this.tellListeners();
      });
      baseEl.appendChild(el);
      const value = "getValue" in parser ? parser.getValue(el) : null;
      return tuple(id, { parser, el, value });
    });

    this.state = Object.fromEntries(stateEntries) as State<C>;
    this.extraValue = initialValues[this.queryKey("extra")];
    this.shortUrl = shortUrl;
    this.hashKeyLength = hashKeyLength;
    this.listeners = [];

    this.updates = [];
  }

  getValue<I extends ExtractIds<C>>(id: I): StateValues<C>[I] {
    return ((this.state as Record<string, StateItem<C[number]>>)[id]?.value ??
      null) as StateValues<C>[I];
  }

  setValue<I extends ExtractIds<C>>(id: I, value: StateValues<C>[I]): void {
    const stateItem = (this.state as Record<string, StateItem<C[number]>>)[id];
    if (stateItem != null) {
      stateItem.value = value as DefaultType<C[number]>;
    }
  }

  get extra() {
    return this.extraValue;
  }

  addListener(
    cb: (values: StateValues<C>, updates: ExtractIds<C>[]) => void,
    subscriptions: ExtractIds<C>[] | null = null
  ): void {
    this.listeners.push({
      cb,
      subscriptions: subscriptions != null ? new Set(subscriptions) : null,
    });
  }

  tellListeners(force: boolean = false): void {
    if (force || this.updates.length > 0) {
      this.listeners
        .filter(
          ({ subscriptions }) =>
            subscriptions == null ||
            this.updates.some(update => subscriptions.has(update))
        )
        .forEach(({ cb }) => {
          cb(this.getAllValues(), [...this.updates]);
        });
      this.updates = [];
    }
  }

  getAllValues(): StateValues<C> {
    return mapObject(this.state as object, ([id, stateItem]) =>
      tuple(
        id,
        structuredClone(
          (stateItem as StateItem<C[number]>)
            .value as StateValues<C>[keyof StateValues<C>]
        )
      )
    );
  }

  serialiseToUrlParams(extra?: string): string {
    const urlPart = (key: string, value: string) =>
      this.shortUrl ? `${key}${value}` : `${key}=${value}`;
    return filterAndMap(
      Object.entries(this.state as Record<string, StateItem<C[number]>>),
      ([id, { value, parser }]) => {
        if ("serialise" in parser) {
          const serialised = parser.serialise(value, this.shortUrl);
          return parser.hasChanged(value) ? urlPart(id, serialised) : null;
        } else {
          return null;
        }
      }
    )
      .concat(
        ...(extra != null ? [urlPart("extra", encodeURIComponent(extra))] : [])
      )
      .join("&");
  }

  addCopyToClipboardHandler(
    selector: string,
    extra?: ((state: StateValues<C>) => string) | string
  ) {
    const query = this.serialiseToUrlParams(
      typeof extra === "function" ? extra(this.getAllValues()) : extra
    );
    dom.addListener(dom.get(selector), "click", () => {
      const shareUrl = `${location.protocol}//${location.host}${location.pathname}${query.length > 0 ? "?" + query : ""}`;
      void navigator.clipboard.writeText(shareUrl);
    });
  }

  // https://stackoverflow.com/a/7616484
  private hashString(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  private queryKey(key: string): string {
    return this.shortUrl
      ? intToBase64(this.hashString(key), this.hashKeyLength)
      : key;
  }

  private parseQuery(query: string, shortUrl: boolean): Record<string, string> {
    const queryRegex = shortUrl
      ? new RegExp(`[?&]?([^=&]{${this.hashKeyLength}})([^&]*)`, "g")
      : /[?&]?([^=&]+)=?([^&]*)/g;
    const parsed: Record<string, string> = {};
    let tokens;
    while ((tokens = queryRegex.exec(query))) {
      if (tokens[1] != null && tokens[2] != null) {
        parsed[tokens[1]] = decodeURIComponent(tokens[2]);
      }
    }
    return parsed;
  }
}
