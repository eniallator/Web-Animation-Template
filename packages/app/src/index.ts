import { appMethods } from "./lib/types";

import type { config } from "./config";
import type { AppContext } from "./lib/types";

const init = ({ canvas, ctx }: AppContext<typeof config>) => {
  ctx.fillStyle = "black";
  ctx.strokeStyle = "white";

  // Art code

  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

export default appMethods<typeof config>({
  init,
  onResize: (_evt, appContext) => {
    init(appContext);
  },
});
