import { ParamConfig } from "@web-art/config-parser";
import { dom, raise } from "@web-art/core";

import { config, options } from "./config.ts";
import { app } from "./index.ts";
import { Mouse } from "./lib/index.ts";

import type { AppContext, StatefulAppContext } from "./lib/index.ts";

dom.addListener(dom.get("#download-btn"), "click", () => {
  const title = document
    .getElementsByTagName("title")[0]
    ?.innerText.trim()
    .toLocaleLowerCase()
    .replace(/\s+/, "-");

  const anchor = document.createElement("a");
  anchor.href = canvas.toDataURL();
  anchor.download = `${
    title != null && title.length > 0 ? title : "download"
  }.png`;

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
});

dom.addListener(dom.get("#fullscreen-btn"), "click", () => {
  const fullscreen = document.fullscreenElement != null;
  void (
    fullscreen ? document.exitFullscreen() : dom.get("main").requestFullscreen()
  ).then(() => document.body.classList.toggle("fullscreen", !fullscreen));
});

const updateCanvasBounds = (canvas: HTMLCanvasElement) => {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;
};

const canvas = dom.get<HTMLCanvasElement>("canvas");
updateCanvasBounds(canvas);

const noCtxError = new Error(
  `Could not get a 2D rendering context for element ${JSON.stringify(canvas)}`
);
const ctx = canvas.getContext("2d") ?? raise(noCtxError);

const modal = dom.get<HTMLDialogElement>("#config-modal");
dom.addListener(dom.get("#config-dropdown-btn"), "click", () => {
  modal.showModal();
});
dom.addListener(modal, "click", evt => {
  if (evt.target === modal) modal.close();
});

const paramConfig = new ParamConfig(config, dom.get("#cfg-outer"), options);
paramConfig.addCopyToClipboardHandler("#share-btn");
const now = Date.now() / 1000;
const appCtx: AppContext<typeof config> = {
  time: { now, start: now, lastFrame: now, delta: 0 },
  mouse: new Mouse(canvas),
  paramConfig,
  canvas,
  ctx,
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-confusing-void-expression
let state = app.init(appCtx) ?? null;
const statefulCtx: StatefulAppContext<typeof config, typeof state> = {
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
