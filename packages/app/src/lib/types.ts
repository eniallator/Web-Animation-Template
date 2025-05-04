import type {
  InitParserObject,
  InitParserValues,
  ParamConfig,
} from "@web-art/config-parser";
import type { Mouse } from "./mouse.ts";

export interface Time {
  lastFrame: number;
  delta: number;
  start: number;
  now: number;
}

export interface AppContext<O extends InitParserObject> {
  paramConfig: ParamConfig<InitParserValues<O>>;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  mouse: Mouse;
  time: Time;
}

export interface StatefulAppContext<
  O extends InitParserObject,
  S extends object | null,
> extends AppContext<O> {
  getState: () => S;
  setState: (state: S) => void;
}

export interface AppMethods<
  O extends InitParserObject,
  S extends object | null,
> {
  init: S extends null
    ? (this: AppMethods<O, S>, appContext: AppContext<O>) => void
    : (this: AppMethods<O, S>, appContext: AppContext<O>) => S;
  animationFrame?: (
    this: AppMethods<O, S>,
    appContext: StatefulAppContext<O, S>
  ) => void;
  onResize?: (
    this: AppMethods<O, S>,
    evt: UIEvent,
    appContext: StatefulAppContext<O, S>
  ) => void;
}
