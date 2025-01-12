import { Vector } from "@web-art/linear-algebra";

function isMouseEvent(evt: MouseEvent | TouchEvent): evt is MouseEvent {
  return evt.type.startsWith("mouse");
}

type MouseCallback = (
  this: ThisParameterType<Mouse>,
  evt: MouseEvent | TouchEvent
) => void;

interface MouseListeners {
  onDown?: MouseCallback;
  onMove?: MouseCallback;
  onUp?: MouseCallback;
}

export default class Mouse {
  private readonly _pos: Vector<2>;
  private readonly _relativePos: Vector<2>;
  private _down: boolean;

  private readonly listeners: MouseListeners;
  private elementBounds: DOMRect;

  /**
   * Tracks mouse events for a given DOM element
   * @param {HTMLElement} element Element to track
   */
  constructor(element: HTMLElement, listeners?: MouseListeners) {
    this._down = false;
    this._relativePos = Vector.zero(2);
    this._pos = Vector.zero(2);

    this.listeners = listeners ?? {};
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
        this._pos.setHead(pos.clientX, pos.clientY);
        this._relativePos.setHead(
          this._pos.x() / this.elementBounds.width,
          this._pos.y() / this.elementBounds.height
        );
      }
      callback?.call(this, evt);
    };
    element.onmousemove = element.ontouchmove = (
      evt: MouseEvent | TouchEvent
    ) => {
      handleChange(
        this.listeners.onMove,
        evt,
        !isMouseEvent(evt) ? evt.touches[0] : undefined
      );
    };
    element.onmousedown = element.ontouchstart = (
      evt: MouseEvent | TouchEvent
    ) => {
      this._down = true;
      handleChange(this.listeners.onDown, evt);
    };
    element.onmouseup = element.ontouchend = (evt: MouseEvent | TouchEvent) => {
      this._down = false;
      handleChange(this.listeners.onUp, evt);
    };

    element.onresize = () => {
      this.elementBounds = element.getBoundingClientRect();
    };
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
