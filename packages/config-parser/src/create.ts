import type {
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
    initial?: { initial: T | null; default: T }
  ) => Omit<ValueParser<T>, "type">,
  label?: string,
  title?: string
): InitParser<ValueParser<T>> => ({
  label,
  title,
  methods: (...args) => ({ ...init(...args), type: "Value" }),
});

export const contentParser = (
  initHtml: (onChange: () => void) => ContentParser["html"],
  label?: string,
  title?: string
): InitParser<ContentParser> => ({
  label,
  title,
  methods: onChange => ({
    html: initHtml(() => {
      onChange(null);
    }),
    type: "Content",
  }),
});
