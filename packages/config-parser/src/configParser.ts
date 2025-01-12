import {
  dom,
  filterAndMap,
  intToB64,
  iterable,
  mapObject,
  Option,
  tuple,
  typedToEntries,
} from "@web-art/core";
import { configItem } from "./helpers.js";
import {
  AnyStringObject,
  InitParserObject,
  State,
  ValueParser,
} from "./types.js";

type ParamConfigOptions = {
  query?: string;
} & ({ shortUrl?: false } | { shortUrl: true; hashKeyLength?: number });

export class ParamConfig<const O extends AnyStringObject> {
  private readonly state: State<O>;
  private readonly shortUrl: boolean;
  private readonly listeners: {
    cb: (values: O, updates: (keyof O)[]) => void;
    subscriptions: Set<keyof O>;
  }[];
  private readonly extraValue: string | undefined;
  private readonly hashKeyLength: number;

  private updates: (keyof O)[];

  constructor(
    parsers: InitParserObject<O>,
    baseEl: HTMLElement,
    options: ParamConfigOptions = {}
  ) {
    const { query = location.search, shortUrl = false } = options;
    const hashKeyLength =
      (options.shortUrl ? options.hashKeyLength : null) ?? 6;
    const initialValues = this.parseQuery(query, shortUrl);

    this.state = mapObject<InitParserObject<O>, State<O>>(
      parsers,
      ([id, { label, title, methods }]) => {
        const parser = methods(
          value => {
            if (value != null) this.state[id].value = value as O[typeof id];
            this.updates.push(id);
            this.tellListeners();
          },
          () => this.state[id].value,
          null
        );

        const query = initialValues[this.queryKey(id as string)] ?? null;
        const el = parser.html(id as string, query, shortUrl);
        baseEl.appendChild(configItem(id as string, el, label, title));
        const value =
          parser.type === "Value" ? parser.getValue(el) : (null as O[keyof O]);

        return tuple(id, { parser, el, value });
      }
    );
    this.extraValue = initialValues[this.queryKey("extra")];
    this.shortUrl = shortUrl;
    this.hashKeyLength = hashKeyLength;
    this.listeners = [];

    this.updates = [];
  }

  getValue<I extends keyof O>(id: I): O[I] {
    return this.state[id].value;
  }

  setValue<I extends keyof O>(id: I, value: O[I]): void {
    this.state[id].value = value;
    const { parser, el } = this.state[id];
    if (parser.type === "Value") parser.updateValue(el, this.shortUrl);
  }

  get extra() {
    return this.extraValue;
  }

  addListener(
    cb: (values: O, updates: (keyof O)[]) => void,
    subscriptions: (keyof O)[] = []
  ): void {
    this.listeners.push({ cb, subscriptions: new Set(subscriptions) });
  }

  tellListeners(force: boolean = false): void {
    if (force || this.updates.length > 0) {
      this.listeners
        .filter(
          ({ subscriptions }) =>
            subscriptions.size === 0 ||
            this.updates.some(update => subscriptions.has(update))
        )
        .forEach(({ cb }) => {
          cb(this.getAllValues(), [...this.updates]);
        });
      this.updates = [];
    }
  }

  getAllValues(): O {
    return mapObject(this.state, ([id, { value }]) =>
      tuple(id, structuredClone(value))
    );
  }

  serialiseToUrlParams(extra?: string): string {
    const urlPart = (key: string, value: string) =>
      [this.queryKey(key), encodeURIComponent(value)].join(
        this.shortUrl ? "" : "="
      );
    return filterAndMap(typedToEntries(this.state), ([id, { parser }]) =>
      Option.from(parser)
        .guard((p): p is ValueParser<O[keyof O]> => p.type === "Value")
        .map(p => p.serialise(this.shortUrl))
        .map(serialised => urlPart(id as string, serialised))
    )
      .concat(
        ...(extra != null ? [urlPart("extra", encodeURIComponent(extra))] : [])
      )
      .join("&");
  }

  addCopyToClipboardHandler(
    selector: string,
    extra?: ((state: O) => string) | string
  ) {
    dom.addListener(dom.get(selector), "click", () => {
      const query = this.serialiseToUrlParams(
        typeof extra === "function" ? extra(this.getAllValues()) : extra
      );
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
      ? intToB64(this.hashString(key), this.hashKeyLength)
      : encodeURIComponent(key);
  }

  private parseQuery(query: string, shortUrl: boolean): Record<string, string> {
    const queryRegex = shortUrl
      ? new RegExp(`[?&]?([^=&]{${this.hashKeyLength}})([^&]*)`, "g")
      : /[?&]?([^=&]+)=?([^&]*)/g;

    return Object.fromEntries(
      Array.from(iterable(() => queryRegex.exec(query)))
        .map(tokens =>
          tokens?.[1] != null && tokens[2] != null
            ? tuple(tokens[1], decodeURIComponent(tokens[2]))
            : null
        )
        .filter(v => v != null)
    );
  }
}
