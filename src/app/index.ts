import { AppContext, appMethods } from "../core/types";
import config from "./config";

// function init({ canvas, ctx }: AppContext<typeof config>) {
//   ctx.fillStyle = "black";
//   ctx.strokeStyle = "white";

//   // Art code

//   ctx.fillRect(0, 0, canvas.width, canvas.height);
//   return { foo: "bar" };
// }

// export default appMethods.stateful({
//   init,
//   onResize: function (_evt, appContext) {
//     appContext.state;
//     return null;
//   },
// });

function init({ canvas, ctx }: AppContext<typeof config>) {
  ctx.fillStyle = "black";
  ctx.strokeStyle = "white";

  // Art code

  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export default appMethods.stateless({
  init,
  onResize: (_evt, appContext) => init(appContext),
});
