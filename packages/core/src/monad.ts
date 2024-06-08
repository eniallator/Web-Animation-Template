type UnpackTupledMonads<M extends readonly Monad<unknown>[]> = {
  [K in keyof M]: M[K] extends Monad<infer T> ? T : M[K];
};

export class Monad<A> {
  private readonly _value: A;

  /**
   * Monad class
   * @param {A} value Initial value for the Monad to have
   */
  private constructor(value: A) {
    this._value = value;
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
    return new Monad(
      monads.map(monad => monad._value) as UnpackTupledMonads<M>
    );
  }

  /**
   *  Maps the Monad's value to a new value
   * @param {function(A): B} callback Mapping function
   * @returns {Monad} Monad with the changed value
   */
  map<B>(callback: (value: A) => B): Monad<B> {
    return new Monad(callback(this._value));
  }

  /**
   *  Flat maps the Monad's value to a new value
   * @param {function(A): Monad<B>} callback Mapping function
   * @returns {Monad} Monad with the changed value
   */
  flatMap<B>(callback: (value: A) => Monad<B>): Monad<B> {
    return callback(this._value);
  }

  /**
   *  Call a given function with the current value
   * @param {function(A): void} callback Function to call
   * @returns {this} this
   */
  tap(callback: (value: A) => void): ThisType<A> {
    callback(this._value);
    return this;
  }

  /**
   * Get the current value of this monad
   * @returns {A} The current value
   */
  value(): A {
    return this._value;
  }
}
