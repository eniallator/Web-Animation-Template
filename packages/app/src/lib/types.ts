import type {
  InitParserObject,
  InitParserValues,
  ParamConfig,
} from "@web-art/config-parser";
import type Mouse from "./mouse";

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

export interface AppContextWithState<
  O extends InitParserObject,
  S extends object | null,
> extends AppContext<O> {
  getState: () => S;
  setState: (state: S) => void;
}

export type AppMethods<
  O extends InitParserObject,
  S extends object | null,
> = (S extends null
  ? { init: (this: AppMethods<O, S>, appContext: AppContext<O>) => void }
  : { init: (this: AppMethods<O, S>, appContext: AppContext<O>) => S }) & {
  animationFrame?: (
    this: AppMethods<O, S>,
    appContext: AppContextWithState<O, S>
  ) => void;
  onResize?: (
    this: AppMethods<O, S>,
    evt: UIEvent,
    appContext: AppContextWithState<O, S>
  ) => void;
};

export const appMethods = <
  O extends InitParserObject,
  const S extends object | null = null,
>(
  methods: AppMethods<O, S>
): AppMethods<O, S> => methods;
