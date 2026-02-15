import type { Decrement } from "./maths.ts";

export type Whitespace = " " | "\t" | "\n" | "\r";
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

interface BaseOperation<C extends string, N extends number | null> {
  charset: C;
  count: N;
}

export interface StringGet<
  C extends string,
  N extends number | null = null,
> extends BaseOperation<C, N> {
  type: "get";
}

export interface StringEat<
  C extends string,
  N extends number | null = null,
> extends BaseOperation<C, N> {
  type: "eat";
}

export type StringOperation<C extends string, N extends number | null> =
  | StringGet<C, N>
  | StringEat<C, N>;

interface OutputData<
  O extends string,
  R extends string,
  N extends boolean = false,
> {
  out: O;
  rest: R;
  noMatch: N;
}

type CombineOperationOutput<
  O extends string,
  R extends OutputData<string, string, boolean>,
> = OutputData<`${O}${R["out"]}`, R["rest"], R["noMatch"]>;

type ApplyStringOperation<
  S extends string,
  O extends StringOperation<string, number | null>,
  N extends number | null = O["count"],
> = S extends `${infer C}${infer R}`
  ? C extends O["charset"]
    ? N extends 0
      ? OutputData<"", S>
      : CombineOperationOutput<
          O["type"] extends "get" ? C : "",
          ApplyStringOperation<R, O, N extends number ? Decrement<N> : N>
        >
    : OutputData<"", S, N extends null | 0 ? false : true>
  : OutputData<"", "">;

type RecurseExtract<
  C extends OutputData<string, string, boolean>,
  A extends StringOperation<string, number | null>[],
> = C["noMatch"] extends true
  ? ""
  : `${C["out"]}${StringExtract<C["rest"], A>}`;

export type StringExtract<
  S extends string,
  A extends StringOperation<string, number | null>[],
> = A extends [infer O, ...infer R]
  ? O extends StringOperation<string, number | null>
    ? RecurseExtract<
        ApplyStringOperation<S, O>,
        Extract<R, StringOperation<string, number | null>[]>
      >
    : ""
  : "";
