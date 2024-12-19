import { AnyStringObject, InitParserObject } from "./types.js";

export const createParsers = <O extends AnyStringObject>(
  parsers: InitParserObject<O>
) => parsers;
