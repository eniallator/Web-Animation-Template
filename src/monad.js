class Monad {
  #value;

  /**
   * Monad class for cleaner code
   * @param {*} value Initial value for the Monad to have
   */
  constructor(value) {
    this.#value = value;
  }

  /**
   *  Maps the Monad's value to a new value
   * @param {function(*): *} callback Mapping function
   * @returns {Monad} Monad with the changed value
   */
  map(callback) {
    return new Monad(callback(this.#value));
  }

  /**
   *  Call a given function with the current value
   * @param {function(*): void} callback Function to call
   * @returns {this} this
   */
  tap(callback) {
    callback(this.#value);
    return this;
  }

  /**
   * Get the current value of this monad
   * @returns The current value
   */
  value() {
    return this.#value;
  }
}
