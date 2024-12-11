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
} from "./lib/types";

function updateCanvasBounds(canvas: HTMLCanvasElement) {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;
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
  const url = canvas.toDataURL();
  const anchor = document.createElement("a");
  anchor.href = url;
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

dom.addListener(dom.get("#config-dropdown-btn"), "click", () => {
  dom.get<HTMLDialogElement>("#config-modal").showModal();
});

dom.addListener(
  dom.get<HTMLDialogElement>("#config-modal"),
  "click",
  function (evt) {
    if (evt.target === this) {
      this.close();
    }
  }
);

const appContext: AppContext<typeof config> = {
  paramConfig,
  canvas,
  ctx,
  mouse: new Mouse(canvas),
  time: {
    animationStart: Date.now() / 1000,
    lastFrame: Date.now() / 1000,
    now: Date.now() / 1000,
    delta: 0,
  },
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
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    statefulContext.state =
      app.onResize?.(evt, statefulContext) ?? statefulContext.state;
  };

  const animate = () => {
    const { time } = statefulContext;
    time.lastFrame = time.now;
    const now = Date.now() / 1000;
    time.delta = now - time.lastFrame;
    time.now = now;
    statefulContext.state =
      app.animationFrame?.(statefulContext) ?? statefulContext.state;

    if (app.animationFrame != null) {
      requestAnimationFrame(animate);
    }
  };

  if (app.animationFrame != null) {
    requestAnimationFrame(animate);
  }
}

function initStateLess(app: StatelessAppMethods<typeof config>) {
  app.init?.(appContext);

  window.onresize = evt => {
    updateCanvasBounds(canvas);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    app.onResize?.(evt, appContext);
  };

  const animate = () => {
    const { time } = appContext;
    time.lastFrame = time.now;
    const now = Date.now() / 1000;
    time.delta = now - time.lastFrame;
    time.now = now;
    if (app.animationFrame != null) {
      app.animationFrame({ ...appContext, time });
      requestAnimationFrame(animate);
    }
  };

  if (app.animationFrame != null) {
    requestAnimationFrame(animate);
  }
}

if (app.type === "stateful") {
  initStateful(app);
} else {
  initStateLess(app);
}
