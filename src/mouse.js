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
    element.onmousemove = (evt) => {
      this.#pos.setHead(evt.clientX, evt.clientY);
      this.#relativePos.setHead(
        evt.clientX / element.width,
        evt.clientY / element.height
      );
      if (this.#moveCallback) {
        this.#moveCallback(this, evt);
      }
    };
    element.ontouchmove = (evt) => {
      this.#pos.setHead(evt.touches[0].clientX, evt.touches[0].clientY);
      this.#relativePos.setHead(
        evt.touches[0].clientX / element.width,
        evt.touches[0].clientY / element.height
      );
      if (this.#moveCallback) {
        this.#moveCallback(this, evt);
      }
    };
    element.onmousedown = element.ontouchstart = (evt) => {
      this.#clicked = this.#down === false;
      this.#down = true;
      if (!isNaN(evt.clientX) && !isNaN(evt.clientY)) {
        this.#pos.setHead(evt.clientX, evt.clientY);
        this.#relativePos.setHead(
          evt.clientX / element.width,
          evt.clientY / element.height
        );
      }
      if (this.#downCallback) {
        this.#downCallback(this, evt);
      }
    };
    element.onmouseup = element.ontouchend = (evt) => {
      this.#clicked = this.#down = false;
      if (this.#upCallback) {
        this.#upCallback(this, evt);
      }
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
