import { Monad } from "./monad.ts";
import { raise } from "./utils.ts";

export type OptionType = "some" | "none" | undefined;
type FoldOptionType<T extends OptionType, S, N, D = S | N> = T extends "some"
  ? S
  : T extends "none"
    ? N
    : D;

type UnpackTupledOptions<O extends readonly Option<NonNullable<unknown>>[]> = {
  [K in keyof O]: O[K] extends Option<infer T> ? T : O[K];
};

export class Option<
  A extends NonNullable<unknown>,
  T extends OptionType = undefined,
> {
  private readonly value: A | null | undefined;

  private constructor(value: A | null | undefined) {
    this.value = value;
  }

  static none<A extends NonNullable<unknown>>(): Option<A, "none"> {
    return new Option<A, "none">(null);
  }

  static some<A extends NonNullable<unknown>>(value: A): Option<A, "some"> {
    return new Option(value);
  }

  static someExact<const A extends NonNullable<unknown>>(
    value: A
  ): Option<A, "some"> {
    return new Option(value);
  }

  static from<A extends NonNullable<unknown>>(
    value: A | null | undefined
  ): Option<A> {
    return new Option(value);
  }

  static fromExact<const A extends NonNullable<unknown>>(
    value: A | null | undefined
  ): Option<A> {
    return new Option(value);
  }

  static tupled<
    const A extends readonly Option<NonNullable<unknown>, OptionType>[],
  >(tup: A): Option<UnpackTupledOptions<A>> {
    const values: unknown[] = [];
    for (const opt of tup) {
      const value = opt.getOrNull();
      if (value != null) values.push(value);
      else return new Option<UnpackTupledOptions<A>>(null);
    }
    return new Option(values) as Option<UnpackTupledOptions<A>>;
  }

  map<B extends NonNullable<unknown>>(
    fn: (value: A) => B | null | undefined
  ): Option<B> {
    return new Option(this.value != null ? fn(this.value) : null);
  }

  flatMap<B extends NonNullable<unknown>>(
    fn: (value: A) => Option<B, OptionType>
  ): Option<B> {
    return this.value != null ? fn(this.value) : new Option<B>(null);
  }

  filter(fn: (value: A) => boolean): Option<A> {
    return this.value != null && fn(this.value)
      ? (this as Option<A>)
      : new Option<A>(null);
  }

  guard<B extends A>(guard: (value: A) => value is B): Option<B> {
    return new Option<B>(
      this.value != null && guard(this.value) ? this.value : null
    );
  }

  tap(fn: (value: A) => void): this {
    if (this.value != null) fn(this.value);
    return this;
  }

  fold<R>(ifNone: () => R, ifSome: (a: A) => R): R {
    return this.value == null ? ifNone() : ifSome(this.value);
  }

  getOrNull(): FoldOptionType<T, A, null> {
    return (this.value ?? null) as FoldOptionType<T, A, null>;
  }

  getOrUndefined(): FoldOptionType<T, A, undefined> {
    return (this.value ?? undefined) as FoldOptionType<T, A, undefined>;
  }

  getOrThrow(
    err: Error = new Error("Option value is nullable")
  ): FoldOptionType<T, A, never, A> {
    return (this.value ?? raise(err)) as FoldOptionType<T, A, never, never>;
  }

  getOrElse<R>(orElse: () => R): FoldOptionType<T, A, R> {
    return (this.value ?? orElse()) as FoldOptionType<T, A, R>;
  }

  toMonad(): FoldOptionType<T, Monad<A>, Monad<null>, Monad<A | null>> {
    return Monad.from(this.value ?? null) as FoldOptionType<
      T,
      Monad<A>,
      Monad<null>,
      Monad<A | null>
    >;
  }

  toArray(): A[] {
    return this.value != null ? [this.value] : [];
  }
}
