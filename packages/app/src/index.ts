import { appMethods } from "./lib/index.ts";

import type { Config } from "./config.ts";
import type { AppContext } from "./lib/index.ts";

const init = ({ canvas, ctx }: AppContext<Config>) => {
  ctx.fillStyle = "black";
  ctx.strokeStyle = "white";

  // Art code

  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

export const app = appMethods<Config>({
  init,
  onResize: (_evt, appContext) => {
    init(appContext);
  },
});
