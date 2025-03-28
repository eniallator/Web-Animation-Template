import { Vector } from "@web-art/linear-algebra";

const isMouseEvent = (evt: MouseEvent | TouchEvent): evt is MouseEvent =>
  evt.type.startsWith("mouse");

type MouseCallback = (this: Mouse, evt: MouseEvent | TouchEvent) => void;

interface MouseListeners {
  onDown?: MouseCallback;
  onMove?: MouseCallback;
  onUp?: MouseCallback;
}

export default class Mouse {
  private readonly listeners: MouseListeners;
  private readonly _pos: Vector<2>;
  private readonly _relativePos: Vector<2>;
  private _down: boolean;

  /**
   * Tracks mouse events for a given DOM element
   * @param {HTMLElement} element Element to track
   */
  constructor(element: HTMLElement, listeners?: MouseListeners) {
    this.listeners = listeners ?? {};
    this._down = false;
    this._relativePos = Vector.zero(2);
    this._pos = Vector.zero(2);

    this.initListeners(element);
  }

  private initListeners(element: HTMLElement) {
    const onChange = (cb?: MouseCallback) => (evt: MouseEvent | TouchEvent) => {
      if (isMouseEvent(evt)) {
        this._pos.setHead(evt.clientX, evt.clientY);
      } else if (evt.touches[0] != null) {
        this._pos.setHead(evt.touches[0].clientX, evt.touches[0].clientY);
      }

      const { width, height } = element.getBoundingClientRect();
      this._relativePos.setHead(this._pos.x() / width, this._pos.y() / height);
      cb?.call(this, evt);
    };

    element.onmousemove = element.ontouchmove = onChange(evt => {
      this.listeners.onMove?.call(this, evt);
    });
    element.onmousedown = element.ontouchstart = onChange(evt => {
      this._down = true;
      this.listeners.onDown?.call(this, evt);
    });
    element.onmouseup = element.ontouchend = onChange(evt => {
      this._down = false;
      this.listeners.onUp?.call(this, evt);
    });
  }

  /**
   * Triggered when the mouse down or touch down event is fired on the element
   *
   * @param {MouseCallback} onDown
   */
  setOnDown(onDown: MouseCallback) {
    this.listeners.onDown = onDown;
  }

  /**
   * Triggered when the mouse move or touch move event is fired on the element
   *
   * @param {MouseCallback} onMove
   */
  setOnMove(onMove: MouseCallback) {
    this.listeners.onMove = onMove;
  }

  /**
   * Triggered when the mouse down or touch down event is fired on the element
   *
   * @param {MouseCallback} onUp
   */
  setOnUp(onUp: MouseCallback) {
    this.listeners.onUp = onUp;
  }

  get down(): boolean {
    return this._down;
  }
  get pos(): Vector<2> {
    return this._pos;
  }
  get relativePos(): Vector<2> {
    return this._relativePos;
  }
}
