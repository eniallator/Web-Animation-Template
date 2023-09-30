import ParamConfig from "./configParser";
import Mouse from "./core/mouse";
import dom from "./core/dom";
import config from "./projectFiles/config";
import * as app from "./projectFiles";
import { AppContext } from "./configParser/types";

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
paramConfig.addCopyToClipboardHandler("#share-btn");

window.onresize = (evt) => {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;
  if ("onResize" in app && typeof app.onResize === "function") {
    app.onResize(evt, appContext);
  }
};
window.onresize(new UIEvent("resize"));

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
  dom.get<HTMLDialogElement>("dialog#config-modal").showModal()
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

app.init(appContext);