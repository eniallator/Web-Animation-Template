import { appMethods } from "./lib/index.ts";

import type { Config } from "./config.ts";
import type { AppContext } from "./lib/index.ts";

const init = ({ canvas, ctx }: AppContext<Config>) => {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "white";

  // Art code
};

export const app = appMethods<Config>({
  init,
  onResize: (_evt, appContext) => {
    init(appContext);
  },
});
