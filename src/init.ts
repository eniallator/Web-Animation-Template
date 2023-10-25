import ParamConfig from "./configParser";
import Mouse from "./core/mouse";
import dom from "./core/dom";
import config from "./app/config";
import { AppContext } from "./core/types";
import app from "./app";

function updateCanvasBounds(canvas: HTMLCanvasElement) {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;
}

const canvas = dom.get<HTMLCanvasElement>("canvas");
updateCanvasBounds(canvas);
const ctx = canvas.getContext("2d");
if (ctx == null) {
  throw new Error(`Could not get a 2D rendering context for element ${canvas}`);
}

const mouse = new Mouse(canvas);

const paramConfig = new ParamConfig(config, dom.get("#cfg-outer"));

const appContext: AppContext<typeof config> = {
  paramConfig,
  canvas,
  ctx,
  mouse,
};

let appState = app.type === "stateful" ? app.init(appContext) : null;
if (app.type === "stateless") {
  app.init?.(appContext);
}

paramConfig.addCopyToClipboardHandler("#share-btn");

window.onresize = (evt) => {
  updateCanvasBounds(canvas);
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;
  if (app.type === "stateful") {
    appState =
      app.onResize?.(evt, { ...appContext, state: appState! }) ?? appState;
  } else {
    app.onResize?.(evt, appContext);
  }
};

dom.addListener(dom.get("#download-btn"), "click", () => {
  const url = canvas.toDataURL();
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${
    document.getElementsByTagName("title")?.[0].innerText ?? "download"
  }.png`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
});

dom.addListener(dom.get("#config-dropdown-btn"), "click", () =>
  dom.get<HTMLDialogElement>("#config-modal").showModal()
);

dom.addListener(
  dom.get<HTMLDialogElement>("#config-modal"),
  "click",
  function (evt) {
    if (evt.target === this) {
      this.close();
    }
  }
);

if (app.animationFrame != null) {
  const animate = () => {
    if (app.type === "stateful") {
      appState =
        app.animationFrame?.({ ...appContext, state: appState! }) ?? appState;
    } else {
      app.animationFrame?.(appContext);
    }
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}
