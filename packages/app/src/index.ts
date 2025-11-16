import { Vector } from "@web-art/linear-algebra";
import { TimeProfile } from "@web-art/profile";

import { appMethods } from "./lib/index.ts";

import type { Config } from "./config.ts";
import type { AppContext } from "./lib/index.ts";

const init = ({ canvas, ctx, paramConfig }: AppContext<Config>) => {
  ctx.fillStyle = "black";
  ctx.strokeStyle = "white";

  paramConfig.addListener(() => {
    console.log("Button clicked!");
  }, ["example-button"]);

  TimeProfile.registerMethods(Vector);

  const profiler = new TimeProfile();

  const audit = profiler.auditSync(() => {
    const result = Vector.zero(2);

    for (let i = 0; i < 1e5; i++) {
      const vec = Vector.randomNormalised(2);
      vec.getAngle();
      vec.getMagnitude();
      result.add(vec);
      result.normalise();
    }

    console.log("RESULT", result.toString());
  });

  console.log(audit.toString());

  // Art code

  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

export const app = appMethods<Config>({
  init,
  onResize: (_evt, appContext) => {
    init(appContext);
  },
});
