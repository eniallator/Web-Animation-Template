const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

ctx.fillStyle = "black";
ctx.strokeStyle = "white";

function run() {
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Animation code

  requestAnimationFrame(run);
}

run();
