import { ConfigPart, ParamConfig, WithId } from "@web-art/config-parser";
import Mouse from "./mouse";

export interface AppContext<A extends readonly WithId<ConfigPart, string>[]> {
  paramConfig: ParamConfig<A>;
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
  A extends readonly WithId<ConfigPart, string>[],
  S extends object,
> extends AppContext<A> {
  state: S;
}

export interface StatefulAppMethods<
  A extends readonly WithId<ConfigPart, string>[],
  S extends object,
> {
  type: "stateful";
  init: (this: StatefulAppMethods<A, S>, appContext: AppContext<A>) => S;
  animationFrame?: (
    this: StatefulAppMethods<A, S>,
    appContext: AppContextWithState<A, S>
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ) => S | null | undefined | void;
  onResize?: (
    this: StatefulAppMethods<A, S>,
    evt: UIEvent,
    appContext: AppContextWithState<A, S>
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ) => S | null | undefined | void;
}

export interface StatelessAppMethods<
  A extends readonly WithId<ConfigPart, string>[],
> {
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
  A extends readonly WithId<ConfigPart, string>[],
  S extends object = never,
> = StatefulAppMethods<A, S> | StatelessAppMethods<A>;

export const appMethods = {
  stateful: <
    A extends readonly WithId<ConfigPart, string>[],
    const S extends object,
  >(
    methods: Omit<StatefulAppMethods<A, S>, "type">
  ): AppMethods<A, S> => ({ type: "stateful", ...methods }),
  stateless: <A extends readonly WithId<ConfigPart, string>[]>(
    methods: Omit<StatelessAppMethods<A>, "type">
  ): AppMethods<A> => ({ type: "stateless", ...methods }),
};
