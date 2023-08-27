import Vector from "./vector";

function isMouseEvent(evt: unknown): evt is MouseEvent {
  return (
    evt != null &&
    typeof evt === "object" &&
    "type" in evt &&
    typeof evt.type === "string" &&
    evt.type.startsWith("mouse")
  );
}

type MouseCallback = (
  this: ThisParameterType<Mouse>,
  evt: MouseEvent | TouchEvent
) => void;

export default class Mouse {
  private _down: boolean;
  private _clicked: boolean;
  private _pos: Vector;
  private _relativePos: Vector;
  private elementBounds: DOMRect;
  private downCallback?: MouseCallback;
  private moveCallback?: MouseCallback;
  private upCallback?: MouseCallback;

  /**
   * Tracks mouse events for a given DOM element
   * @param {HTMLElement} element Element to track
   */
  constructor(element: HTMLElement) {
    this._down = false;
    this._clicked = false;
    this._relativePos = Vector.ZERO;
    this._pos = Vector.ZERO;

    this.elementBounds = element.getBoundingClientRect();

    this.initListeners(element);
  }

  private initListeners(element: HTMLElement) {
    const handleChange = (
      callback: MouseCallback | undefined,
      evt: MouseEvent | TouchEvent,
      pos?: Touch
    ) => {
      if (pos != null) {
        this.pos.setHead(pos.clientX, pos.clientY);
        this.relativePos.setHead(
          this.pos.x / this.elementBounds.width,
          this.pos.y / this.elementBounds.height
        );
      }
      callback?.call(this, evt);
    };
    element.onmousemove = (evt: MouseEvent | TouchEvent) =>
      handleChange.call(this, this.moveCallback, evt);
    element.ontouchmove = (evt: MouseEvent | TouchEvent) =>
      handleChange.call(
        this,
        this.moveCallback,
        evt,
        !isMouseEvent(evt) ? evt.touches[0] : undefined
      );
    element.onmousedown = element.ontouchstart = (
      evt: MouseEvent | TouchEvent
    ) => {
      this._clicked = this._down === false;
      this._down = true;
      handleChange.call(this, this.downCallback, evt);
    };
    element.onmouseup = element.ontouchend = (evt: MouseEvent | TouchEvent) => {
      this._clicked = this._down = false;
      this.upCallback?.call(this, evt);
    };

    element.onresize = () => {
      this.elementBounds = element.getBoundingClientRect();
    };
  }

  /**
   * Triggered when the mouse down or touch down event is fired on the element
   *
   * @param {MouseCallback} callback
   */
  setDownCallback(callback: MouseCallback) {
    this.downCallback = callback;
  }

  /**
   * Triggered when the mouse move or touch move event is fired on the element
   *
   * @param {MouseCallback} callback
   */
  setMoveCallback(callback: MouseCallback) {
    this.moveCallback = callback;
  }

  /**
   * Triggered when the mouse down or touch down event is fired on the element
   *
   * @param {MouseCallback} callback
   */
  setUpCallback(callback: MouseCallback) {
    this.upCallback = callback;
  }

  get down(): boolean {
    return this._down;
  }
  get clicked(): boolean {
    return this._clicked;
  }
  get pos(): Vector {
    return this._pos;
  }
  get relativePos(): Vector {
    return this._relativePos;
  }
}
