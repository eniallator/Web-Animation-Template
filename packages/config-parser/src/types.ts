export interface Config {
  label?: string;
  title?: string;
  attrs?: Record<string, string | null>;
}

export interface ValueConfig<T> extends Config {
  default?: T;
}

export interface ContentParser {
  type: "Content";
  html: (id: string | null) => HTMLElement;
}

export interface ValueParser<T> {
  type: "Value";
  html: (
    id: string | null,
    query: string | null,
    shortUrl: boolean
  ) => HTMLElement;
  serialise: (shortUrl: boolean) => string | null;
  updateValue: (el: HTMLElement, shortUrl: boolean) => void;
  getValue: (el: HTMLElement) => T;
}

export type Parser<T> = ContentParser | ValueParser<T>;

export type ParserValue<P extends Parser<unknown>> =
  P extends ValueParser<infer T> ? T : P extends ContentParser ? null : never;

export type InitParser<P extends Parser<unknown>> = {
  label?: string;
  title?: string;
  methods: (
    onChange: (value: ParserValue<P>) => void,
    getValue: () => ParserValue<P>,
    initial?: { initial: ParserValue<P> | null; default: ParserValue<P> }
  ) => P;
};

export type AnyStringRecord = Record<string, unknown>;

export type AnyParserRecord = Record<string, Parser<unknown>>;

export type InitParserObject<O extends AnyStringRecord = AnyStringRecord> = {
  [K in keyof O]: InitParser<Parser<O[K]>>;
};

export type ValueParsers<O extends readonly unknown[]> = {
  [K in keyof O]: ValueParser<O[K]>;
};

export type InitValueParsers<O extends readonly unknown[]> = {
  [K in keyof O]: InitParser<ValueParser<O[K]>>;
};

export interface StateItem<T> {
  parser: Parser<T>;
  value: T;
  el: HTMLElement;
}

export type State<R extends AnyStringRecord> = {
  [K in keyof R]: StateItem<R[K]>;
};
