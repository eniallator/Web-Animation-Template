import type { FillTuple } from "./tuple.ts";

export type Whitespace = " " | "\t" | "\n";
export type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
export type AlphabetLower =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z";
export type AlphabetUpper = Uppercase<AlphabetLower>;
export type Alphabet = AlphabetLower | AlphabetUpper;

interface BaseOperation<C extends string, L extends number | null> {
  charset: C;
  length: L;
}

export interface StringGet<C extends string, L extends number | null = null>
  extends BaseOperation<C, L> {
  type: "get";
}

export interface StringEat<C extends string, L extends number | null = null>
  extends BaseOperation<C, L> {
  type: "eat";
}

export type StringOperation<C extends string, L extends number | null> =
  | StringGet<C, L>
  | StringEat<C, L>;

type OperationOutput<
  O extends StringOperation<string, number | null>,
  S extends string,
> = O["type"] extends "get" ? S : "";

type CombineOperationOutput<
  O extends string,
  R extends { out: string; rest: string },
> = { out: `${O}${R["out"]}`; rest: R["rest"] };

type Decrement<N extends number> =
  FillTuple<unknown, N> extends [unknown, ...infer R]
    ? R extends unknown[]
      ? R["length"]
      : never
    : 0;

type ApplyStringOperation<
  S extends string,
  O extends StringOperation<string, number | null>,
  L extends number | null = O["length"],
> = S extends `${infer C}${infer R}`
  ? C extends O["charset"]
    ? R extends string
      ? L extends 0
        ? { out: ""; rest: S }
        : CombineOperationOutput<
            OperationOutput<O, C>,
            ApplyStringOperation<R, O, L extends number ? Decrement<L> : L>
          >
      : never
    : { out: ""; rest: S }
  : { out: ""; rest: "" };

type RecurseExtract<
  C extends { out: string; rest: string },
  R extends readonly StringOperation<string, number | null>[],
> = `${C["out"]}${StringExtract<C["rest"], R>}`;

export type StringExtract<
  S extends string,
  A extends readonly StringOperation<string, number | null>[],
> = A extends [infer O, ...infer R]
  ? O extends StringOperation<string, number | null>
    ? R extends readonly StringOperation<string, number | null>[]
      ? RecurseExtract<ApplyStringOperation<S, O>, R>
      : never
    : ""
  : "";
