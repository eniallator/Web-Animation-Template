import { ConfigPart, Parser, DefaultType } from "../types.js";
import { buttonParser } from "./button.js";
import { collectionParser } from "./collection.js";
import { inputParser } from "./input.js";

export function configParser<C extends ConfigPart>(
  part: C
): Parser<DefaultType<C>> {
  switch (part.type) {
    case "Button":
      return buttonParser(part) as Parser<DefaultType<C>>;
    case "Collection":
      return collectionParser(part) as Parser<DefaultType<C>>;
    default:
      return inputParser(part) as Parser<DefaultType<C>>;
  }
}
