const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const aspectRatio = 16 / 9;

const noScrollbarOffset = 3;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
if (canvas.width / canvas.height > aspectRatio) {
  canvas.width -= canvas.width - canvas.height * aspectRatio;
} else if (canvas.width / canvas.height < aspectRatio) {
  canvas.height -= canvas.height - canvas.width * aspectRatio;
}

canvas.width -= noScrollbarOffset;
canvas.height -= noScrollbarOffset;

ctx.fillStyle = "black";
ctx.strokeStyle = "white";

function run() {
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Animation code

  requestAnimationFrame(run);
}

run();
