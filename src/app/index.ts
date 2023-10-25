import { AppContext, appMethods } from "../core/types";
import config from "./config";

// function init({ paramConfig, ctx, canvas, mouse }: AppContext<typeof config>) {
//   ctx.fillStyle = "black";
//   ctx.strokeStyle = "white";

//   // Art code

//   ctx.fillRect(0, 0, canvas.width, canvas.height);
//   return { foo: "bar" };
// }

// export default appMethods.stateful({
//   init,
//   onResize: function (evt, appContext) {
//     appContext.state;
//     return null;
//   },
// });

function init({ paramConfig, ctx, canvas, mouse }: AppContext<typeof config>) {
  ctx.fillStyle = "black";
  ctx.strokeStyle = "white";

  // Art code

  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export default appMethods.stateless({
  init,
  onResize: function (evt, appContext) {
    this.init?.(appContext);
  },
});
