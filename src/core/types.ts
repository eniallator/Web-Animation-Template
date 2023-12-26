import ParamConfig from "../configParser";
import { DeriveParts } from "../configParser/derive";
import { ConfigPart } from "../configParser/types";
import Mouse from "./mouse";

export interface AppContext<A extends Array<ConfigPart<string>>> {
  paramConfig: ParamConfig<DeriveParts<A>>;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  mouse: Mouse;
  time: {
    lastFrame: number;
    delta: number;
    animationStart: number;
  };
}

export interface AppContextWithState<
  A extends Array<ConfigPart<string>>,
  S extends object
> extends AppContext<A> {
  state: S;
}

export interface StatefulAppMethods<
  A extends Array<ConfigPart<string>>,
  S extends object
> {
  type: "stateful";
  init: (this: StatefulAppMethods<A, S>, appContext: AppContext<A>) => S;
  animationFrame?: (
    this: StatefulAppMethods<A, S>,
    appContext: AppContextWithState<A, S>
  ) => S | null;
  onResize?: (
    this: StatefulAppMethods<A, S>,
    evt: UIEvent,
    appContext: AppContextWithState<A, S>
  ) => S | null;
}

export interface StatelessAppMethods<A extends Array<ConfigPart<string>>> {
  type: "stateless";
  init?: (this: StatelessAppMethods<A>, appContext: AppContext<A>) => void;
  animationFrame?: (
    this: StatelessAppMethods<A>,
    appContext: AppContext<A>
  ) => void;
  onResize?: (
    this: StatelessAppMethods<A>,
    evt: UIEvent,
    appContext: AppContext<A>
  ) => void;
}

export type AppMethods<
  A extends Array<ConfigPart<string>>,
  S extends object = never
> = StatefulAppMethods<A, S> | StatelessAppMethods<A>;

export const appMethods = {
  stateful: <A extends Array<ConfigPart<string>>, const S extends object>(
    methods: Omit<StatefulAppMethods<A, S>, "type">
  ): AppMethods<A, S> => ({ type: "stateful", ...methods }),
  stateless: <A extends Array<ConfigPart<string>>>(
    methods: Omit<StatelessAppMethods<A>, "type">
  ): AppMethods<A> => ({ type: "stateless", ...methods }),
};
