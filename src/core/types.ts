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

export interface AppMethods<A extends Array<ConfigPart<string>>> {
  init: (appContext: AppContext<A>) => void;
  animationFrame?: (appContext: AppContext<A>) => void;
  onResize?: (evt: UIEvent, appContext: AppContext<A>) => void;
}

export function appMethods<A extends Array<ConfigPart<string>>>(
  methods: AppMethods<A>
): AppMethods<A> {
  return methods;
}
