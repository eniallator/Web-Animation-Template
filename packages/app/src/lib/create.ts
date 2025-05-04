import type { InitParserObject } from "@web-art/config-parser";
import type { AppMethods } from "./types.ts";

export const appMethods = <
  O extends InitParserObject,
  const S extends object | null = null,
>(
  methods: AppMethods<O, S>
): AppMethods<O, S> => methods;
