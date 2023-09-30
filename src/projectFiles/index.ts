import { AppContext } from "../configParser/types";
import config from "./config";

export function onResize(evt: UIEvent, appContext: AppContext<typeof config>) {}

export function init({
  paramConfig,
  ctx,
  canvas,
  mouse,
}: AppContext<typeof config>) {
  ctx.fillStyle = "black";
  ctx.strokeStyle = "white";

  paramConfig.addListener(
    (state) => console.log(JSON.stringify(state["example-collection"])),
    ["example-collection"]
  );

  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
