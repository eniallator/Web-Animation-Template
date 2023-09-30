export default class Monad<A> {
  private _value: A;

  /**
   * Monad class for cleaner code
   * @param {A} value Initial value for the Monad to have
   */
  constructor(value: A) {
    this._value = value;
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
