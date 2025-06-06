import { tuple } from "./tuple.ts";

export const typedKeys = <O extends object>(
  obj: O,
  includeSymbols: boolean = false
): (keyof O)[] =>
  includeSymbols
    ? (Object.getOwnPropertyNames(obj) as (keyof O)[]).concat(
        Object.getOwnPropertySymbols(obj) as (keyof O)[]
      )
    : (Object.getOwnPropertyNames(obj) as (keyof O)[]);

export type Entry<O extends object> = [keyof O, O[keyof O]];

export const typedToEntries = <O extends object>(
  obj: O,
  includeSymbols: boolean = false
): [keyof O, O[keyof O]][] =>
  typedKeys(obj, includeSymbols).map(key => tuple(key, obj[key])) as [
    keyof O,
    O[keyof O],
  ][];

export const typedFromEntries = <O extends object>(
  entries: [keyof O, O[keyof O]][]
): O => Object.fromEntries(entries) as O;

export const mapObject = <I extends object, O extends object>(
  obj: I,
  mapper: (entry: Entry<I>, index: number, array: Entry<I>[]) => Entry<O>,
  includeSymbols: boolean = false
): O => typedFromEntries(typedToEntries(obj, includeSymbols).map(mapper));
