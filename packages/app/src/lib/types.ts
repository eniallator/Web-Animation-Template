import type { AnyStringRecord, SerialisableForm } from "seriform";
import type { Mouse } from "./mouse.ts";

export interface Time {
  lastFrame: number;
  delta: number;
  start: number;
  now: number;
}

export interface AppContext<R extends AnyStringRecord> {
  seriform: SerialisableForm<R>;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  mouse: Mouse;
  time: Time;
}

export interface StatefulAppContext<
  R extends AnyStringRecord,
  S extends object | null,
> extends AppContext<R> {
  getState: () => S;
  setState: (state: S) => void;
}

export interface AppMethods<
  R extends AnyStringRecord,
  S extends object | null,
> {
  init: S extends null
    ? (this: AppMethods<R, S>, appContext: AppContext<R>) => void
    : (this: AppMethods<R, S>, appContext: AppContext<R>) => S;
  animationFrame?: (
    this: AppMethods<R, S>,
    appContext: StatefulAppContext<R, S>
  ) => void;
  onResize?: (
    this: AppMethods<R, S>,
    evt: UIEvent,
    appContext: StatefulAppContext<R, S>
  ) => void;
}

export const appMethods = <
  R extends AnyStringRecord,
  const S extends object | null = null,
>(
  methods: AppMethods<R, S>
): AppMethods<R, S> => methods;
