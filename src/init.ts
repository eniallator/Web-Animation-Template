import {
  addListener,
  getElement,
  raise,
  toAttrs,
  toElement,
} from "niall-utils";
import { SeriForm } from "seriform";

import { config, options, type Config } from "./config.ts";
import { app } from "./index.ts";
import {
  Mouse,
  type AppContext,
  type StatefulAppContext,
} from "./lib/index.ts";

const updateCanvasBounds = (canvas: HTMLCanvasElement) => {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;
};

const canvas = getElement<HTMLCanvasElement>("canvas");
updateCanvasBounds(canvas);

addListener(getElement("#download-btn"), "click", () => {
  const title = document
    .getElementsByTagName("title")[0]
    ?.innerText.trim()
    .toLocaleLowerCase()
    .replace(/\s+/, "-");
  const download = `${title != null && title.length > 0 ? title : "download"}.png`;

  const attrs = toAttrs({ href: canvas.toDataURL(), download });
  const anchor = toElement(`<a ${attrs}></a>`);

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
});

addListener(getElement("#fullscreen-btn"), "click", () => {
  void (document.fullscreenElement != null
    ? document.exitFullscreen()
    : getElement("main").requestFullscreen());
});

const ctx =
  canvas.getContext("2d") ??
  raise(
    new Error(
      `Could not get a 2D rendering context for element ${JSON.stringify(canvas)}`
    )
  );

const modal = getElement<HTMLDialogElement>("#config-modal");
addListener(getElement("#config-dropdown-btn"), "click", () => {
  modal.showModal();
});
addListener(modal, "click", evt => {
  if (evt.target === modal) modal.close();
});

const now = Date.now() / 1000;
const seriform = new SeriForm(config, getElement("#cfg-outer"), options);
seriform.addCopyToClipboardHandler("#share-btn");
const appCtx: AppContext<Config> = {
  time: { now, start: now, lastFrame: now, delta: 0 },
  mouse: new Mouse(canvas),
  seriform,
  canvas,
  ctx,
};

// oxlint-disable-next-line typescript/no-unnecessary-condition, typescript/no-confusing-void-expression
let state = app.init(appCtx) ?? null;
const statefulCtx: StatefulAppContext<Config, typeof state> = {
  ...appCtx,
  getState: () => state,
  setState: newState => {
    state = newState;
  },
};

window.onresize = evt => {
  updateCanvasBounds(canvas);
  app.onResize?.(evt, statefulCtx);
};

const animate = () => {
  if (app.animationFrame != null) {
    const { time } = statefulCtx;
    time.lastFrame = time.now;
    time.now = Date.now() / 1000;
    time.delta = time.now - time.lastFrame;

    app.animationFrame(statefulCtx);
    requestAnimationFrame(animate);
  }
};
animate();
