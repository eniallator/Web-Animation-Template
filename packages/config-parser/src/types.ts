export interface Config {
  label?: string;
  title?: string;
  attrs?: Record<string, string>;
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

export type InitParser<P extends Parser<unknown>> = {
  label?: string;
  title?: string;
  methods: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (value: any) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getValue: () => any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initial: any
  ) => P;
};

export type ParserValue<P extends Parser<unknown>> =
  P extends ValueParser<infer T> ? T : P extends ContentParser ? null : never;

export type AnyStringObject = { [K in string]: unknown };

export type AnyParserConfig = { [K in string]: Parser<unknown> };

export type InitParserObject<O extends AnyStringObject> = {
  [K in keyof O]: InitParser<Parser<O[K]>>;
};

export type ValueParserTuple<O extends readonly unknown[]> = {
  [K in keyof O]: ValueParser<O[K]>;
};

export type InitValueParserTuple<O extends readonly unknown[]> = {
  [K in keyof O]: InitParser<ValueParser<O[K]>>;
};

export type InitParserValues<R extends InitParserObject<AnyStringObject>> =
  R extends InitParserObject<infer T> ? T : never;

export interface StateItem<T> {
  parser: Parser<T>;
  value: T;
  el: HTMLElement;
}

export type State<R extends AnyStringObject> = {
  [K in keyof R]: StateItem<R[K]>;
};
