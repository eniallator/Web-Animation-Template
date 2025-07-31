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
): Entry<O>[] =>
  typedKeys(obj, includeSymbols).map(key => tuple(key, obj[key])) as Entry<O>[];

export const typedFromEntries = <O extends object>(entries: Entry<O>[]): O =>
  Object.fromEntries(entries) as O;

export const mapObject = <I extends object, O extends object>(
  obj: I,
  mapper: (entry: Entry<I>, index: number, array: Entry<I>[]) => Entry<O>,
  includeSymbols: boolean = false
): O => typedFromEntries(typedToEntries(obj, includeSymbols).map(mapper));

export const filterObject = <O extends object>(
  obj: O,
  predicate: (value: Entry<O>, index: number, array: Entry<O>[]) => boolean,
  includeSymbols: boolean = false
) => typedFromEntries(typedToEntries(obj, includeSymbols).filter(predicate));

export const pick = <O extends object, K extends keyof O>(
  obj: O,
  keys: K[],
  includeSymbols: boolean = false
): Pick<O, K> =>
  filterObject(obj, ([key]) => keys.includes(key as K), includeSymbols);

export const omit = <O extends object, K extends keyof O>(
  obj: O,
  keys: K[],
  includeSymbols: boolean = false
): Omit<O, K> =>
  filterObject(obj, ([key]) => !keys.includes(key as K), includeSymbols);
