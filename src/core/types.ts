import ParamConfig from "../configParser";
import { DeriveParts } from "../configParser/derive";
import { ConfigPart } from "../configParser/types";
import Mouse from "./mouse";

export interface AppContext<A extends Array<ConfigPart<string>>> {
  paramConfig: ParamConfig<DeriveParts<A>>;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  mouse: Mouse;
}

export type OptReturnType<T extends ((...args: any) => any) | undefined> =
  T extends (...args: any) => any ? ReturnType<T> : null;

type AppInitMethod<
  A extends Array<ConfigPart<string>>,
  S extends object | null = null
> = (appContext: AppContext<A>) => S | void;

export interface AppMethods<
  A extends Array<ConfigPart<string>>,
  S extends object | null = null,
  I extends AppInitMethod<A, S> | undefined = undefined
> {
  init?: I;
  animationFrame?: (
    appContext: AppContext<A>,
    state: OptReturnType<I>
  ) => S | void;
  onResize?: (
    evt: UIEvent,
    appContext: AppContext<A>,
    state: OptReturnType<I>
  ) => S | void;
}

export type DeriveAppState<
  A extends AppMethods<
    Array<ConfigPart<string>>,
    object | null,
    AppInitMethod<Array<ConfigPart<string>>, object | null>
  >
> = A extends AppMethods<Array<ConfigPart<string>>, infer S, any> ? S : null;

export function appMethods<
  A extends Array<ConfigPart<string>>,
  S extends object | null = null,
  I extends AppInitMethod<A, S> | undefined = undefined
>(methods: AppMethods<A, S, I>): AppMethods<A, S, I> {
  return methods;
}
