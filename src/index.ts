import { Vector } from "vectyped";

import { appMethods } from "./lib/index.ts";

import type { Config } from "./config.ts";
import type { AppContext, StatefulAppContext } from "./lib/index.ts";
import { dom } from "niall-utils";

const randomHue = () => Math.round(Math.random() * 360);

interface State {
  pos: Vector<2>;
  dir: Vector<2>;
  hue: number;
}

const init = (_appCtx: AppContext<Config>): State => ({
  pos: Vector.zero(2),
  dir: Vector.fill(2, 0.1),
  hue: randomHue(),
});

const bounds = Vector.create(4, 3).normalise();
const logo = dom.get<HTMLImageElement>("#credit img");
const logoDim = Vector.create(logo.width, logo.height)
  .normalise()
  .multiply(100);
const logoPadding = 8;

const animationFrame = (appCtx: StatefulAppContext<Config, State>) => {
  const { canvas, ctx, time, getState, setState } = appCtx;

  const { pos, dir } = getState();

  // Update logo position
  const delta = Math.min(time.delta, 0.1);
  const dirCorrection = pos
    .copy()
    .add(dir.copy().multiply(delta))
    .map((n, i) => (n < 0 || n > bounds.valueOf(i) ? -1 : 1));

  if (dirCorrection.includes(-1)) {
    dir.multiply(dirCorrection);
    setState({ pos, dir, hue: randomHue() });
  }
  pos.add(dir.copy().multiply(delta));

  // Draw background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw logo
  const { hue } = getState();
  ctx.fillStyle = `hsl(${hue}deg 100% 85%)`;

  const scale = Vector.create(canvas.width, canvas.height)
    .sub(logoDim)
    .divide(bounds);
  const screenPos = pos.copy().multiply(scale);

  ctx.beginPath();
  ctx.roundRect(...screenPos.toArray(), ...logoDim.toArray(), logoPadding);
  ctx.fill();

  ctx.drawImage(
    logo,
    ...screenPos.copy().add(logoPadding).toArray(),
    ...logoDim
      .copy()
      .sub(logoPadding * 2)
      .toArray()
  );
};

export const app = appMethods<Config, State>({
  init,
  animationFrame,
});
