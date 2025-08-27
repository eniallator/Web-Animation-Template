import { Option } from "./option.ts";

type UnpackTupledMonads<M extends readonly Monad<unknown>[]> = {
  [K in keyof M]: M[K] extends Monad<infer T> ? T : M[K];
};

export class Monad<A> {
  private readonly value: A;

  /**
   * Monad class
   * @param {A} value Initial value for the Monad to have
   */
  private constructor(value: A) {
    this.value = value;
  }

  static from<A>(value: A): Monad<A> {
    return new Monad(value);
  }

  static fromExact<const A>(value: A): Monad<A> {
    return new Monad(value);
  }

  static tupled<const M extends readonly Monad<unknown>[]>(
    monads: M
  ): Monad<UnpackTupledMonads<M>> {
    return new Monad(monads.map(({ value }) => value) as UnpackTupledMonads<M>);
  }

  /**
   *  Maps the Monad's value to a new value
   * @param {function(A): B} fn Mapping function
   * @returns {Monad} Monad with the changed value
   */
  map<B>(fn: (value: A) => B): Monad<B> {
    return new Monad(fn(this.value));
  }

  /**
   *  Flat maps the Monad's value to a new value
   * @param {function(A): Monad<B>} fn Mapping function
   * @returns {Monad} Monad with the changed value
   */
  flatMap<B>(fn: (value: A) => Monad<B>): Monad<B> {
    return fn(this.value);
  }

  /**
   *  Call a given function with the current value
   * @param {function(A): void} fn Function to call
   * @returns {this} this
   */
  tap(fn: (value: A) => void): this {
    fn(this.value);
    return this;
  }

  /**
   * Get the current value of this monad
   * @returns {A} The current value
   */
  get(): A {
    return this.value;
  }

  toOption(): Option<NonNullable<A>> {
    return Option.from<NonNullable<A>>(this.value as NonNullable<A>);
  }

  toArray(): A[] {
    return [this.value];
  }
}
