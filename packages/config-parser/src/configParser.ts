import {
  dom,
  Entry,
  filterAndMap,
  intToB64,
  mapObject,
  Option,
  tuple,
  typedToEntries,
} from "@web-art/core";

import { configItem, hashString, parseQuery } from "./helpers.js";
import {
  AnyStringRecord,
  InitParserObject,
  State,
  ValueParser,
} from "./types.js";

export type ParamConfigOptions = {
  query?: string;
} & ({ shortUrl?: false } | { shortUrl: true; hashKeyLength?: number });

export class ParamConfig<const R extends AnyStringRecord> {
  private readonly state: State<R>;
  private readonly shortUrl: boolean;
  private readonly updates: (keyof R)[];
  private readonly listeners: {
    callback: (values: R, updates: (keyof R)[]) => void;
    subscriptions: Set<keyof R>;
  }[];
  private readonly extraValue: string | undefined;
  private readonly hashKeyLength: number;

  constructor(
    initParsers: InitParserObject<R>,
    baseEl: HTMLElement,
    options: ParamConfigOptions = {}
  ) {
    const { query = location.search, shortUrl = false } = options;
    this.shortUrl = shortUrl;
    this.hashKeyLength = (options.shortUrl ? options.hashKeyLength : null) ?? 6;
    this.listeners = [];
    this.updates = [];

    const initialValues = parseQuery(query, this.shortUrl, this.hashKeyLength);
    this.extraValue = initialValues[this.queryKey("extra")];

    this.state = mapObject(initParsers, ([id, initParser]): Entry<State<R>> => {
      const { label, title, methods } = initParser;
      const parser = methods(
        value => {
          if (value != null) this.state[id].value = value as R[keyof R];
          this.updates.push(id);
          this.tellListeners();
        },
        () => this.state[id].value,
        null
      );

      const query = initialValues[this.queryKey(id as string)] ?? null;
      const el = parser.html(id as string, query, this.shortUrl);
      baseEl.appendChild(configItem(id as string, el, label, title));
      const value =
        parser.type === "Value" ? parser.getValue(el) : (null as R[keyof R]);

      return tuple(id, { parser, el, value });
    });
  }

  getValue<I extends keyof R>(id: I): R[I] {
    return structuredClone(this.state[id].value);
  }

  setValue<I extends keyof R>(id: I, value: R[I]): void {
    this.state[id].value = value;
    const { parser, el } = this.state[id];
    if (parser.type === "Value") parser.updateValue(el, this.shortUrl);
  }

  get extra() {
    return this.extraValue;
  }

  addListener(
    callback: (values: R, updates: (keyof R)[]) => void,
    subscriptions: (keyof R)[] = []
  ): void {
    this.listeners.push({ callback, subscriptions: new Set(subscriptions) });
  }

  tellListeners(force: boolean = false): void {
    if (force || this.updates.length > 0) {
      const { updates } = this;
      this.updates.length = 0;
      (force
        ? this.listeners
        : this.listeners.filter(
            ({ subscriptions }) =>
              subscriptions.size === 0 ||
              updates.some(update => subscriptions.has(update))
          )
      ).forEach(({ callback }) => {
        callback(this.getAllValues(), [...updates]);
      });
    }
  }

  getAllValues(): R {
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
        .guard((p): p is ValueParser<R[keyof R]> => p.type === "Value")
        .map(p => p.serialise(this.shortUrl))
        .map(serialised => urlPart(id as string, serialised))
    )
      .concat(...(extra != null ? [urlPart("extra", extra)] : []))
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
      const { protocol, host, pathname } = location;
      const shareUrl = `${protocol}//${host}${pathname}${query.length > 0 ? "?" + query : ""}`;
      void navigator.clipboard.writeText(shareUrl);
    });
  }

  private queryKey(key: string): string {
    return this.shortUrl
      ? intToB64(hashString(key), this.hashKeyLength)
      : encodeURIComponent(key);
  }
}
