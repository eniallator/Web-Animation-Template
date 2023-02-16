ctx.fillStyle = "black";
ctx.strokeStyle = "white";

function draw() {
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Animation code

  // requestAnimationFrame(draw);
}

window.resizeCallback = draw;

paramConfig.onLoad(draw);
