import ParamConfig from "./configParser";
import Mouse from "./core/mouse";
import dom from "./core/dom";
import config from "./app/config";
import { AppContext, DeriveAppState, OptReturnType } from "./core/types";
import app from "./app";

const canvas = dom.get<HTMLCanvasElement>("canvas");
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

let appState: OptReturnType<typeof app.init> =
  app.init != null ? app.init(appContext) ?? null : null;
paramConfig.addCopyToClipboardHandler("#share-btn");

window.onresize = (evt) => {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;
  if (app.onResize != null) {
    appState =
      app.onResize(evt, appContext, appState as DeriveAppState<typeof app>) ??
      appState;
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

const { animationFrame } = app;
if (animationFrame != null) {
  const animate = () => {
    appState =
      animationFrame(appContext, appState as DeriveAppState<typeof app>) ??
      appState;
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}
