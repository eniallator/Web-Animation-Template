import {
  dom,
  filterAndMap,
  intToBase64,
  mapObject,
  tuple,
  typedToEntries,
} from "@web-art/core";
import { configItem } from "./helpers.js";
import { AnyStringObject, InitParserObject, State } from "./types.js";

type ParamConfigOptions = {
  query?: string;
} & ({ shortUrl?: false } | { shortUrl: true; hashKeyLength?: number });

export class ParamConfig<const R extends AnyStringObject> {
  private readonly state: State<R>;
  private readonly shortUrl: boolean;
  private readonly listeners: {
    cb: (values: R, updates: (keyof R)[]) => void;
    subscriptions: Set<keyof R> | null;
  }[];
  private readonly extraValue: string | undefined;
  private readonly hashKeyLength: number;

  private updates: (keyof R)[];

  constructor(
    parsers: InitParserObject<R>,
    baseEl: HTMLElement,
    options: ParamConfigOptions = {}
  ) {
    const { query = location.search, shortUrl = false } = options;
    const hashKeyLength =
      (options.shortUrl ? options.hashKeyLength : null) ?? 6;
    const initialValues = this.parseQuery(query, shortUrl);

    this.state = mapObject<InitParserObject<R>, State<R>>(
      parsers,
      ([id, { label, title, methods }]) => {
        const parser = methods(
          value => {
            if (value != null) {
              this.state[id].value = value as R[typeof id];
            }
            this.updates.push(id);
            this.tellListeners();
          },
          () => this.state[id].value,
          null
        );
        if (parser.type === "Value") {
          const el = parser.html(
            id as string,
            initialValues[this.queryKey(id as string)] ?? null,
            shortUrl
          );
          baseEl.appendChild(configItem(id as string, el, label, title));
          return tuple(id, {
            parser,
            el,
            value: parser.getValue(el),
          });
        } else {
          const el = parser.html(id as string);
          baseEl.appendChild(configItem(id as string, el, label, title));
          return tuple(id, {
            parser,
            el,
            value: null as R[typeof id],
          });
        }
      }
    );
    this.extraValue = initialValues[this.queryKey("extra")];
    this.shortUrl = shortUrl;
    this.hashKeyLength = hashKeyLength;
    this.listeners = [];

    this.updates = [];
  }

  getValue<I extends keyof R>(id: I): R[I] {
    return this.state[id].value;
  }

  setValue<I extends keyof R>(id: I, value: R[I]): void {
    this.state[id].value = value;
    if (this.state[id].parser.type === "Value") {
      this.state[id].parser.updateValue(this.state[id].el, this.shortUrl);
    }
  }

  get extra() {
    return this.extraValue;
  }

  addListener(
    cb: (values: R, updates: (keyof R)[]) => void,
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

  getAllValues(): R {
    return mapObject<State<R>, R>(this.state, ([id, stateItem]) =>
      tuple(id, structuredClone(stateItem.value))
    );
  }

  serialiseToUrlParams(extra?: string): string {
    const urlPart = (key: string, value: string) =>
      this.shortUrl
        ? `${this.queryKey(key)}${value}`
        : `${this.queryKey(key)}=${value}`;
    return filterAndMap(typedToEntries(this.state), ([id, { parser }]) => {
      if (parser.type === "Value") {
        const serialised = parser.serialise(this.shortUrl);
        return serialised != null ? urlPart(id as string, serialised) : null;
      } else {
        return null;
      }
    })
      .concat(
        ...(extra != null ? [urlPart("extra", encodeURIComponent(extra))] : [])
      )
      .join("&");
  }

  addCopyToClipboardHandler(
    selector: string,
    extra?: ((state: R) => string) | string
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
