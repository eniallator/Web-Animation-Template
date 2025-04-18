import { Monad } from "./monad.ts";
import { raise } from "./utils.ts";

export class Option<A> {
  private readonly value: A | null | undefined;

  private constructor(value: A | null | undefined) {
    this.value = value;
  }

  static none<A>(): Option<A> {
    return new Option<A>(null);
  }

  static from<A>(value: A | null | undefined): Option<A> {
    return new Option(value);
  }

  static fromExact<const A>(value: A | null | undefined): Option<A> {
    return new Option(value);
  }

  isSome(): boolean {
    return this.value != null;
  }

  isNone(): boolean {
    return this.value == null;
  }

  map<B>(fn: (value: A) => B | null | undefined): Option<B> {
    return new Option(this.value != null ? fn(this.value) : null);
  }

  flatMap<B>(fn: (value: A) => Option<B>): Option<B> {
    return this.value != null ? fn(this.value) : new Option<B>(null);
  }

  filter(fn: (value: A) => boolean): Option<A> {
    return this.value != null && fn(this.value) ? this : new Option<A>(null);
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

  getOrNull(): A | null {
    return this.value ?? null;
  }

  getOrUndefined(): A | undefined {
    return this.value ?? undefined;
  }

  getOrThrow(err: Error): A {
    return this.value ?? raise(err);
  }

  getOrElse<R>(orElse: () => R): A | R {
    return this.value ?? orElse();
  }

  toMonad(): Monad<A | null> {
    return Monad.from(this.value ?? null);
  }

  toArray(): A[] {
    return this.value != null ? [this.value] : [];
  }
}
