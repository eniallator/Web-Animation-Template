class Mouse {
  #down;
  #clicked;
  #pos;
  #relativePos;
  #downCallback;
  #moveCallback;
  #upCallback;

  /**
   * Tracks mouse events for a given DOM element
   * @param {HTMLElement} element Element to track
   */
  constructor(element) {
    this.#down = false;
    this.#clicked = false;
    this.#relativePos = Vector.ZERO;
    this.#pos = Vector.ZERO;

    this.#initListeners(element);
  }

  #initListeners(element) {
    const handleChange = (callback, posOrEvt, evt) => {
      if (!isNaN(posOrEvt.clientX) && !isNaN(posOrEvt.clientY)) {
        this.#pos.setHead(posOrEvt.clientX, posOrEvt.clientY);
        this.#relativePos.setHead(
          this.#pos.x / element.width,
          this.#pos.y / element.height
        );
      }
      callback?.call(this, evt ?? posOrEvt);
    };
    element.onmousemove = (evt) =>
      handleChange.call(this, this.#moveCallback, evt);
    element.ontouchmove = (evt) =>
      handleChange.call(this, this.#moveCallback, evt.touches[0], evt);
    element.onmousedown = element.ontouchstart = (evt) => {
      this.#clicked = this.#down === false;
      this.#down = true;
      handleChange.call(this, this.#downCallback, evt);
    };
    element.onmouseup = element.ontouchend = (evt) => {
      this.#clicked = this.#down = false;
      this.#upCallback?.call(this, evt);
    };
  }

  /**
   * Triggered when the mouse down or touch down event is fired on the element
   *
   * @param {function(this, (MouseEvent | TouchEvent)):void} callback
   */
  setDownCallback(callback) {
    this.#downCallback = callback;
  }

  /**
   * Triggered when the mouse move or touch move event is fired on the element
   *
   * @param {function(this, (MouseEvent | TouchEvent)):void} callback
   */
  setMoveCallback(callback) {
    this.#moveCallback = callback;
  }

  /**
   * Triggered when the mouse down or touch down event is fired on the element
   *
   * @param {function(this, (MouseEvent | TouchEvent)):void} callback
   */
  setUpCallback(callback) {
    this.#upCallback = callback;
  }

  get down() {
    return this.#down;
  }
  get clicked() {
    return this.#clicked;
  }
  get pos() {
    return this.#pos;
  }
  get relativePos() {
    return this.#relativePos;
  }
}
