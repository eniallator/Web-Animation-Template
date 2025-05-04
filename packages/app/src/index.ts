import { appMethods } from "./lib/index.ts";

import type { config } from "./config.ts";
import type { AppContext } from "./lib/index.ts";

const init = ({ canvas, ctx }: AppContext<typeof config>) => {
  ctx.fillStyle = "black";
  ctx.strokeStyle = "white";

  // Art code

  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

export const app = appMethods<typeof config>({
  init,
  onResize: (_evt, appContext) => {
    init(appContext);
  },
});
