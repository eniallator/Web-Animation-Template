import { ParamConfig } from "@web-art/config-parser";
import { dom, raise } from "@web-art/core";
import app from ".";
import { config } from "./config";
import Mouse from "./lib/mouse";
import {
  AppContext,
  AppContextWithState,
  StatefulAppMethods,
  StatelessAppMethods,
  Time,
} from "./lib/types";

function updateCanvasBounds(canvas: HTMLCanvasElement) {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;
}

function updateTime(time: Time): void {
  time.lastFrame = time.now;
  time.now = Date.now() / 1000;
  time.delta = time.now - time.lastFrame;
}

const canvas = dom.get<HTMLCanvasElement>("canvas");
updateCanvasBounds(canvas);

const ctx =
  canvas.getContext("2d") ??
  raise<CanvasRenderingContext2D>(
    new Error(
      `Could not get a 2D rendering context for element ${JSON.stringify(canvas)}`
    )
  );

const paramConfig = new ParamConfig(config, dom.get("#cfg-outer"));

paramConfig.addCopyToClipboardHandler("#share-btn");

dom.addListener(dom.get("#download-btn"), "click", () => {
  const anchor = document.createElement("a");
  anchor.href = canvas.toDataURL();
  anchor.download = `${
    document.getElementsByTagName("title")[0]?.innerText ?? "download"
  }.png`;

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
});

dom.addListener(dom.get("#fullscreen-btn"), "click", () => {
  if (document.fullscreenElement != null) {
    void document
      .exitFullscreen()
      .then(() => document.body.classList.toggle("fullscreen", false));
  } else {
    void dom
      .get("main")
      .requestFullscreen()
      .then(() => document.body.classList.toggle("fullscreen", true));
  }
});

const modal = dom.get<HTMLDialogElement>("#config-modal");
dom.addListener(dom.get("#config-dropdown-btn"), "click", () => {
  modal.showModal();
});
dom.addListener(modal, "click", evt => {
  if (evt.target === modal) modal.close();
});

const now = Date.now() / 1000;
const appContext: AppContext<typeof config> = {
  time: { now, animationStart: now, lastFrame: now, delta: 0 },
  mouse: new Mouse(canvas),
  paramConfig,
  canvas,
  ctx,
};

function initStateful<S extends object>(
  app: StatefulAppMethods<typeof config, S>
) {
  const statefulContext: AppContextWithState<typeof config, S> = {
    ...appContext,
    state: app.init(appContext),
  };

  window.onresize = evt => {
    updateCanvasBounds(canvas);
    statefulContext.state =
      app.onResize?.(evt, statefulContext) ?? statefulContext.state;
  };

  const animate = () => {
    if (app.animationFrame != null) {
      updateTime(statefulContext.time);
      statefulContext.state =
        app.animationFrame(statefulContext) ?? statefulContext.state;
      requestAnimationFrame(animate);
    }
  };
  animate();
}

function initStateLess(app: StatelessAppMethods<typeof config>) {
  app.init?.(appContext);

  window.onresize = evt => {
    updateCanvasBounds(canvas);
    app.onResize?.(evt, appContext);
  };

  const animate = () => {
    if (app.animationFrame != null) {
      updateTime(appContext.time);
      app.animationFrame(appContext);
      requestAnimationFrame(animate);
    }
  };
  animate();
}

if (app.type === "stateful") initStateful(app);
else initStateLess(app);
