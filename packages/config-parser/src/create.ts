import { AnyStringObject, ParserObject } from "./types.js";

export const createParsers = <O extends AnyStringObject>(
  parsers: ParserObject<O>
) => parsers;
