const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const mouse = new Mouse(canvas);
const paramConfig = new ParamConfig("./config.json", $("#cfg-outer")[0]);
paramConfig.addCopyToClipboardHandler("#share-btn");

window.onresize = (evt) => {
  canvas.width = $("#canvas").width();
  canvas.height = $("#canvas").height();
};
window.onresize();

ctx.fillStyle = "black";
ctx.strokeStyle = "white";

function run() {
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Animation code

  requestAnimationFrame(run);
}

paramConfig.onLoad(run);
