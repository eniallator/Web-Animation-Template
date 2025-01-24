import {
  InitParserObject,
  InitParserValues,
  ParamConfig,
} from "@web-art/config-parser";

import Mouse from "./mouse";

export interface Time {
  lastFrame: number;
  delta: number;
  start: number;
  now: number;
}

export interface AppContext<R extends InitParserObject> {
  paramConfig: ParamConfig<InitParserValues<R>>;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  mouse: Mouse;
  time: Time;
}

export interface AppContextWithState<
  R extends InitParserObject,
  S extends object,
> extends AppContext<R> {
  state: S;
}

export interface StatefulAppMethods<
  R extends InitParserObject,
  S extends object,
> {
  type: "stateful";
  init: (this: StatefulAppMethods<R, S>, appContext: AppContext<R>) => S;
  animationFrame?: (
    this: StatefulAppMethods<R, S>,
    appContext: AppContextWithState<R, S>
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ) => S | null | undefined | void;
  onResize?: (
    this: StatefulAppMethods<R, S>,
    evt: UIEvent,
    appContext: AppContextWithState<R, S>
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ) => S | null | undefined | void;
}

export interface StatelessAppMethods<R extends InitParserObject> {
  type: "stateless";
  init?: (this: StatelessAppMethods<R>, appContext: AppContext<R>) => void;
  animationFrame?: (
    this: StatelessAppMethods<R>,
    appContext: AppContext<R>
  ) => void;
  onResize?: (
    this: StatelessAppMethods<R>,
    evt: UIEvent,
    appContext: AppContext<R>
  ) => void;
}

export type AppMethods<R extends InitParserObject, S extends object = never> =
  | StatefulAppMethods<R, S>
  | StatelessAppMethods<R>;

export const appMethods = {
  stateful: <R extends InitParserObject, const S extends object>(
    methods: Omit<StatefulAppMethods<R, S>, "type">
  ): AppMethods<R, S> => ({ type: "stateful", ...methods }),
  stateless: <R extends InitParserObject>(
    methods: Omit<StatelessAppMethods<R>, "type">
  ): AppMethods<R> => ({ type: "stateless", ...methods }),
};
