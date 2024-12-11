export interface Config {
  label?: string;
  tooltip?: string;
  attrs?: Record<string, string>;
}

export interface ValueConfig<T> extends Config {
  default?: T;
}

export interface ContentParser<T = unknown> {
  type: "Content";
  html: (id: string, onChange: (value: T) => void) => HTMLElement;
}

export interface ValueParser<T> {
  type: "Value";
  label?: string;
  default: T;
  html: (
    id: string | null,
    initialValue: T | null,
    onChange: (value: T) => void
  ) => HTMLElement;
  serialise: (value: T, shortUrl: boolean) => string;
  deserialise: (value: string, shortUrl: boolean) => T;
  setValue: (
    el: HTMLElement,
    value: T,
    onChange: ((value: T) => void) | null
  ) => void;
  getValue: (el: HTMLElement) => T;
  hasChanged: (value: T) => boolean;
}

export type Parser<T> = ContentParser<T> | ValueParser<T>;

export type ParserValue<P extends Parser<unknown>> =
  P extends ValueParser<infer T>
    ? T
    : P extends ContentParser<infer T>
      ? T | null
      : never;

export type AnyStringObject = { [K in string]: unknown };

export type AnyParserConfig = { [K in string]: Parser<unknown> };

export type ParserObject<O extends AnyStringObject> = {
  [K in keyof O]: Parser<O[K]>;
};

export type ValueParserTuple<O extends readonly unknown[]> = {
  [K in keyof O]: ValueParser<O[K]>;
};

export type ParserValues<R extends AnyParserConfig> = {
  [K in keyof R]: ParserValue<R[K]>;
};

export interface StateItem<P extends Parser<unknown>> {
  parser: P;
  value: ParserValue<P>;
  el: HTMLElement;
}

export type State<R extends AnyParserConfig> = {
  [K in keyof R]: StateItem<R[K]>;
};
