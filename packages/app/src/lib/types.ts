import {
  AnyStringObject,
  ParamConfig,
  InitParserObject,
  InitParserValues,
} from "@web-art/config-parser";
import Mouse from "./mouse";

export interface AppContext<R extends InitParserObject<AnyStringObject>> {
  paramConfig: ParamConfig<InitParserValues<R>>;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  mouse: Mouse;
  time: {
    lastFrame: number;
    delta: number;
    animationStart: number;
    now: number;
  };
}

export interface AppContextWithState<
  R extends InitParserObject<AnyStringObject>,
  S extends object,
> extends AppContext<R> {
  state: S;
}

export interface StatefulAppMethods<
  R extends InitParserObject<AnyStringObject>,
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

export interface StatelessAppMethods<
  R extends InitParserObject<AnyStringObject>,
> {
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

export type AppMethods<
  R extends InitParserObject<AnyStringObject>,
  S extends object = never,
> = StatefulAppMethods<R, S> | StatelessAppMethods<R>;

export const appMethods = {
  stateful: <
    R extends InitParserObject<AnyStringObject>,
    const S extends object,
  >(
    methods: Omit<StatefulAppMethods<R, S>, "type">
  ): AppMethods<R, S> => ({ type: "stateful", ...methods }),
  stateless: <R extends InitParserObject<AnyStringObject>>(
    methods: Omit<StatelessAppMethods<R>, "type">
  ): AppMethods<R> => ({ type: "stateless", ...methods }),
};
