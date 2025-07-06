import {
  dom,
  filterAndMap,
  mapObject,
  Option,
  tuple,
  typedToEntries,
} from "@web-art/core";

import { configItem, parseQuery, queryKey } from "./helpers.ts";

import type { Entry } from "@web-art/core";
import type {
  AnyStringRecord,
  InitParserObject,
  ParamConfigOptions,
  State,
  ValueParser,
} from "./types.ts";

export class ParamConfig<const R extends AnyStringRecord> {
  private readonly state: State<R>;
  private readonly listeners: {
    callback: (values: R, updatedId?: keyof R) => void;
    subscriptions: Set<keyof R>;
  }[];
  private readonly extraValue: string | undefined;
  private readonly hashLength: number | null;

  constructor(
    initParsers: InitParserObject<R>,
    baseEl: HTMLElement,
    options: ParamConfigOptions = {}
  ) {
    const { query = location.search } = options;
    this.hashLength = options.shortUrl ? (options.hashLength ?? 6) : null;
    this.listeners = [];

    const initialValues = parseQuery(query, this.hashLength);
    this.extraValue = initialValues[queryKey("extra", this.hashLength)];

    this.state = mapObject(initParsers, ([id, initParser]): Entry<State<R>> => {
      const { label, title, methods } = initParser;
      const parser = methods(
        value => {
          if (value != null) this.state[id].value = value as R[keyof R];
          this.tellListeners(id);
        },
        () => this.state[id].value
      );

      const key = queryKey(id as string, this.hashLength);
      const query = initialValues[key] ?? null;
      const el = parser.html(id as string, query, options.shortUrl ?? false);
      baseEl.appendChild(configItem(id as string, el, label, title));
      const value =
        parser.type === "Value" ? parser.getValue(el) : (null as R[keyof R]);

      return tuple(id, { parser, el, value });
    });
  }

  getAllValues(): R {
    return mapObject(this.state, ([id, { value }]) =>
      tuple(id, structuredClone(value))
    );
  }

  getValue<I extends keyof R>(id: I): R[I] {
    return structuredClone(this.state[id].value);
  }

  setValue<I extends keyof R>(id: I, value: R[I]): void {
    this.state[id].value = value;
    const { parser, el } = this.state[id];
    if (parser.type === "Value") {
      parser.updateValue(el, this.hashLength != null);
    }
  }

  get extra() {
    return this.extraValue;
  }

  addListener(
    callback: (values: R, updatedId?: keyof R) => void,
    subscriptions: (keyof R)[] = []
  ): void {
    this.listeners.push({ callback, subscriptions: new Set(subscriptions) });
  }

  tellListeners(id?: keyof R): void {
    this.listeners.forEach(({ subscriptions, callback }) => {
      if (id == null || subscriptions.size === 0 || subscriptions.has(id)) {
        callback(this.getAllValues(), id);
      }
    });
  }

  serialiseToUrlParams(extra?: string): string {
    const urlPart = (key: string, value: string) =>
      [queryKey(key, this.hashLength), encodeURIComponent(value)].join(
        this.hashLength != null ? "" : "="
      );

    return filterAndMap(typedToEntries(this.state), ([id, { parser }]) =>
      Option.some(parser)
        .guard((p): p is ValueParser<R[keyof R]> => p.type === "Value")
        .map(p => p.serialise(this.hashLength != null))
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
      const shareUrl = `${protocol}//${host}${pathname}${
        query.length > 0 ? "?" + query : ""
      }`;
      void navigator.clipboard.writeText(shareUrl);
    });
  }
}
