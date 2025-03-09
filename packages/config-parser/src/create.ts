import {
  AnyStringRecord,
  ContentParser,
  InitParser,
  InitParserObject,
  ValueParser,
} from "./types.ts";

export const createParsers = <O extends AnyStringRecord>(
  parsers: InitParserObject<O>
) => parsers;

export const valueParser = <T>(
  init: (
    onChange: (value: T) => void,
    getValue: () => T,
    initial?: { default: T; initial: T | null }
  ) => Omit<ValueParser<T>, "type">,
  label?: string,
  title?: string
): InitParser<ValueParser<T>> => ({
  label,
  title,
  methods: (...args) => ({ ...init(...args), type: "Value" }),
});

export const contentParser = (
  init: (onChange: () => void) => Omit<ContentParser, "type">,
  label?: string,
  title?: string
): InitParser<ContentParser> => ({
  label,
  title,
  methods: onChange => ({
    ...init(() => {
      onChange(null);
    }),
    type: "Content",
  }),
});
