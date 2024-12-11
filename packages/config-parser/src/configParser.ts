import {
  dom,
  filterAndMap,
  intToBase64,
  mapObject,
  tuple,
  typedToEntries,
} from "@web-art/core";
import { configItem } from "./helpers.js";
import { AnyParserConfig, ParserValue, ParserValues, State } from "./types.js";

type ParamConfigOptions = {
  query?: string;
} & ({ shortUrl?: false } | { shortUrl: true; hashKeyLength?: number });

export class ParamConfig<const R extends AnyParserConfig> {
  private readonly state: State<R>;
  private readonly shortUrl: boolean;
  private readonly listeners: {
    cb: (values: ParserValues<R>, updates: (keyof R)[]) => void;
    subscriptions: Set<keyof R> | null;
  }[];
  private readonly extraValue: string | undefined;
  private readonly hashKeyLength: number;

  private updates: (keyof R)[];

  constructor(
    parsers: R,
    baseEl: HTMLElement,
    options: ParamConfigOptions = {}
  ) {
    const { query = location.search, shortUrl = false } = options;
    const hashKeyLength =
      (options.shortUrl ? options.hashKeyLength : null) ?? 6;
    const initialValues = this.parseQuery(query, shortUrl);

    this.state = mapObject<R, State<R>>(parsers, ([id, parser]) => {
      if (parser.type === "Value") {
        const initialStr = initialValues[this.queryKey(id as string)];
        const initial =
          initialStr != null ? parser.deserialise(initialStr, shortUrl) : null;
        const el = parser.html(id as string, initial, value => {
          if (value != null) {
            this.state[id].value = value as ParserValue<typeof parser>;
          }
          this.updates.push(id);
          this.tellListeners();
        });
        baseEl.appendChild(configItem(id as string, parser.label ?? null, el));
        return tuple(id, {
          parser,
          el,
          value: parser.getValue(el) as ParserValue<typeof parser>,
        });
      } else {
        const el = parser.html(id as string, value => {
          if (value != null) {
            this.state[id].value = value as ParserValue<typeof parser>;
          }
          this.updates.push(id);
          this.tellListeners();
        });
        baseEl.appendChild(configItem(id as string, null, el));
        return tuple(id, {
          parser,
          el,
          value: null as ParserValue<typeof parser>,
        });
      }
    });
    this.extraValue = initialValues[this.queryKey("extra")];
    this.shortUrl = shortUrl;
    this.hashKeyLength = hashKeyLength;
    this.listeners = [];

    this.updates = [];
  }

  getValue<I extends keyof R>(id: I): ParserValues<R>[I] {
    return this.state[id].value;
  }

  setValue<I extends keyof R>(id: I, value: ParserValues<R>[I]): void {
    this.state[id].value = value;
  }

  get extra() {
    return this.extraValue;
  }

  addListener(
    cb: (values: ParserValues<R>, updates: (keyof R)[]) => void,
    subscriptions: (keyof R)[] | null = null
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

  getAllValues(): ParserValues<R> {
    return mapObject<State<R>, ParserValues<R>>(this.state, ([id, stateItem]) =>
      tuple(id, structuredClone(stateItem.value))
    );
  }

  serialiseToUrlParams(extra?: string): string {
    const urlPart = (key: string, value: string) =>
      this.shortUrl
        ? `${this.queryKey(key)}${value}`
        : `${this.queryKey(key)}=${value}`;
    return filterAndMap(
      typedToEntries(this.state),
      ([id, { value, parser }]) => {
        if ("serialise" in parser && "hasChanged" in parser) {
          const serialised = parser.serialise(value, this.shortUrl);
          return parser.hasChanged(value)
            ? urlPart(id as string, serialised)
            : null;
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
    extra?: ((state: ParserValues<R>) => string) | string
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
      : encodeURIComponent(key);
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
