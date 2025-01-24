import { config } from "./config";
import { AppContext, appMethods } from "./lib/types";

// const init = ({ canvas, ctx }: AppContext<typeof config>) => {
//   ctx.fillStyle = "black";
//   ctx.strokeStyle = "white";

//   // Art code

//   ctx.fillRect(0, 0, canvas.width, canvas.height);
//   return { foo: "bar" };
// };

// export default appMethods.stateful({
//   init,
//   onResize: (_evt, appContext) => {
//     appContext.state;
//     return null;
//   },
// });

const init = ({ canvas, ctx }: AppContext<typeof config>) => {
  ctx.fillStyle = "black";
  ctx.strokeStyle = "white";

  // Art code

  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

export default appMethods.stateless({
  init,
  onResize: (_evt, appContext) => {
    init(appContext);
  },
});
