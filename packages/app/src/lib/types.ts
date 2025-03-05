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

export interface AppContext<O extends InitParserObject> {
  paramConfig: ParamConfig<InitParserValues<O>>;
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
  O extends InitParserObject,
  S extends object,
> {
  type: "stateful";
  init: (this: StatefulAppMethods<O, S>, appContext: AppContext<O>) => S;
  animationFrame?: (
    this: StatefulAppMethods<O, S>,
    appContext: AppContextWithState<O, S>
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ) => S | null | undefined | void;
  onResize?: (
    this: StatefulAppMethods<O, S>,
    evt: UIEvent,
    appContext: AppContextWithState<O, S>
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ) => S | null | undefined | void;
}

export interface StatelessAppMethods<O extends InitParserObject> {
  type: "stateless";
  init?: (this: StatelessAppMethods<O>, appContext: AppContext<O>) => void;
  animationFrame?: (
    this: StatelessAppMethods<O>,
    appContext: AppContext<O>
  ) => void;
  onResize?: (
    this: StatelessAppMethods<O>,
    evt: UIEvent,
    appContext: AppContext<O>
  ) => void;
}

export type AppMethods<O extends InitParserObject, S extends object = never> =
  | StatefulAppMethods<O, S>
  | StatelessAppMethods<O>;

export const appMethods = {
  stateful: <O extends InitParserObject, const S extends object>(
    methods: Omit<StatefulAppMethods<O, S>, "type">
  ): AppMethods<O, S> => ({ type: "stateful", ...methods }),
  stateless: <O extends InitParserObject>(
    methods: Omit<StatelessAppMethods<O>, "type">
  ): AppMethods<O> => ({ type: "stateless", ...methods }),
};
