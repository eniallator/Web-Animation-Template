import {
  AnyStringRecord,
  ContentParser,
  InitParser,
  InitParserObject,
  ValueParser,
} from "./types.js";

export const createParsers = <O extends AnyStringRecord>(
  parsers: InitParserObject<O>
) => parsers;

export const valueParser = <T>(
  init: (
    onChange: (value: T) => void,
    getValue: () => T,
    initial: T | null
  ) => Omit<ValueParser<T>, "type">,
  label?: string,
  title?: string
): InitParser<ValueParser<T>> => ({
  label,
  title,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  methods: (...args) => ({ ...init(...args), type: "Value" }),
});

export const contentParser = (
  init: (
    onChange: (value: null) => void,
    getValue: () => null,
    initial: null
  ) => Omit<ContentParser, "type">,
  label?: string,
  title?: string
): InitParser<ContentParser> => ({
  label,
  title,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  methods: (...args) => ({ ...init(...args), type: "Content" }),
});
