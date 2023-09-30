import { AppContext, appMethods } from "../core/types";
import config from "./config";

function onResize(evt: UIEvent, appContext: AppContext<typeof config>) {
  init(appContext);
}

function init({ paramConfig, ctx, canvas, mouse }: AppContext<typeof config>) {
  ctx.fillStyle = "black";
  ctx.strokeStyle = "white";

  // Art code

  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export default appMethods({
  init,
  onResize,
});
