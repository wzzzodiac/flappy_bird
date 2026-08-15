const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startButton = document.getElementById("startButton");

const W = canvas.width;
const H = canvas.height;

let bird;
let pipes;
let score;
let bestScore = Number(localStorage.getItem("flappy_best_score") || 0);
let gameState = "ready";
let lastTime = 0;
let spawnTimer = 0;
let speed = 165;
let shake = 0;

bestScoreEl.textContent = bestScore;

const deathMessages = [
  "Gravity remains undefeated.",
  "The bird has been promoted to ground staff.",
  "Aerodynamics has left the chat.",
  "That pipe was clearly placed there by management.",
  "Pilot error. The investigation lasted 0.3 seconds.",
  "Breaking news: bird discovers infrastructure.",
  "Another flawless demonstration of consequences XD.",
  "The flight was short, but the disappointment was efficient.",
  "This is why birds normally come with wings and instincts.",
  "You had one job. Technically the bird had one too."
];

const scoreComments = [
  [5, "Survival has officially become non-accidental."],
  [10, "Okay, this is starting to look suspiciously competent."],
  [20, "Air traffic control has stopped laughing."],
  [30, "The bird now has more career stability than most graduates."],
  [50, "Please stop. You're making this look like a real game."],
  [75, "At this point gravity is filing an appeal."],
  [100, "Touch grass. Preferably without crashing into it."]
];

function resetGame() {
  bird = {
    x: 105,
    y: H * 0.45,
    r: 17,
    vy: 0,
    rotation: 0
  };

  pipes = [];
  score = 0;
  speed = 165;
  spawnTimer = 0;
  shake = 0;
  scoreEl.textContent = "0";
}

function startGame() {
  resetGame();
  gameState = "playing";
  overlay.classList.add("hidden");
  lastTime = performance.now();
}

function flap() {
  if (gameState === "ready" || gameState === "dead") {
    startGame();
  }

  if (gameState === "playing") {
    bird.vy = -375;
  }
}

function spawnPipe() {
  const gap = Math.max(132, 175 - score * 1.1);
  const margin = 90;
  const gapCenter = margin + Math.random() * (H - margin * 2);

  pipes.push({
    x: W + 40,
    width: 72,
    gapTop: gapCenter - gap / 2,
    gapBottom: gapCenter + gap / 2,
    passed: false
  });
}

function gameOver() {
  if (gameState !== "playing") return;

  gameState = "dead";
  shake = 12;

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("flappy_best_score", bestScore);
    bestScoreEl.textContent = bestScore;
    overlayTitle.textContent = `NEW BEST: ${score}`;
    overlayText.textContent = "Against all available evidence, you improved.";
  } else {
    overlayTitle.textContent = `Score: ${score}`;
    overlayText.textContent = deathMessages[Math.floor(Math.random() * deathMessages.length)];
  }

  startButton.textContent = "MAKE THE SAME MISTAKE AGAIN";
  setTimeout(() => overlay.classList.remove("hidden"), 280);
}

function update(dt) {
  if (gameState !== "playing") return;

  bird.vy += 1050 * dt;
  bird.y += bird.vy * dt;
  bird.rotation = Math.max(-0.45, Math.min(1.15, bird.vy / 520));

  spawnTimer += dt;
  if (spawnTimer >= 1.55) {
    spawnTimer = 0;
    spawnPipe();
  }

  speed = Math.min(245, 165 + score * 1.9);

  for (const pipe of pipes) {
    pipe.x -= speed * dt;

    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      pipe.passed = true;
      score += 1;
      scoreEl.textContent = score;

      const milestone = scoreComments.find(([n]) => n === score);
      if (milestone) {
        flashMessage(milestone[1]);
      }
    }

    const withinX = bird.x + bird.r > pipe.x && bird.x - bird.r < pipe.x + pipe.width;
    const hitTop = bird.y - bird.r < pipe.gapTop;
    const hitBottom = bird.y + bird.r > pipe.gapBottom;

    if (withinX && (hitTop || hitBottom)) {
      gameOver();
    }
  }

  pipes = pipes.filter(pipe => pipe.x + pipe.width > -30);

  if (bird.y + bird.r >= H - 45 || bird.y - bird.r <= 0) {
    gameOver();
  }
}

let toastTimer;
function flashMessage(text) {
  clearTimeout(toastTimer);
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.position = "fixed";
    toast.style.left = "50%";
    toast.style.top = "20px";
    toast.style.transform = "translateX(-50%)";
    toast.style.zIndex = "999";
    toast.style.maxWidth = "90vw";
    toast.style.padding = "10px 14px";
    toast.style.borderRadius = "12px";
    toast.style.background = "rgba(4,10,20,.92)";
    toast.style.border = "1px solid rgba(255,255,255,.12)";
    toast.style.color = "#f4f7fb";
    toast.style.font = "600 13px system-ui";
    toast.style.boxShadow = "0 12px 35px rgba(0,0,0,.35)";
    document.body.appendChild(toast);
  }

  toast.textContent = text;
  toast.style.opacity = "1";

  toastTimer = setTimeout(() => {
    toast.style.opacity = "0";
  }, 1800);
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, "#77d6ff");
  gradient.addColorStop(0.62, "#b7ecff");
  gradient.addColorStop(1, "#e7f8ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 6; i++) {
    const x = (i * 95 + 35) % W;
    const y = 90 + (i % 3) * 95;
    ctx.beginPath();
    ctx.ellipse(x, y, 55, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#6fc35b";
  ctx.fillRect(0, H - 45, W, 45);
  ctx.fillStyle = "#4d9b43";
  ctx.fillRect(0, H - 45, W, 8);
}

function drawPipe(pipe) {
  const x = pipe.x;
  const w = pipe.width;

  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, "#2ca448");
  grad.addColorStop(0.45, "#66dc6f");
  grad.addColorStop(1, "#1b8135");

  ctx.fillStyle = grad;
  ctx.strokeStyle = "#155f2c";
  ctx.lineWidth = 4;

  ctx.fillRect(x, 0, w, pipe.gapTop);
  ctx.strokeRect(x, -4, w, pipe.gapTop + 4);
  ctx.fillRect(x - 7, pipe.gapTop - 24, w + 14, 24);
  ctx.strokeRect(x - 7, pipe.gapTop - 24, w + 14, 24);

  ctx.fillRect(x, pipe.gapBottom, w, H - pipe.gapBottom - 45);
  ctx.strokeRect(x, pipe.gapBottom, w, H - pipe.gapBottom - 41);
  ctx.fillRect(x - 7, pipe.gapBottom, w + 14, 24);
  ctx.strokeRect(x - 7, pipe.gapBottom, w + 14, 24);
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  ctx.fillStyle = "#ffd43b";
  ctx.strokeStyle = "#9d6900";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 23, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ff9f1c";
  ctx.beginPath();
  ctx.moveTo(18, -2);
  ctx.lineTo(36, 3);
  ctx.lineTo(18, 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(10, -8, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(13, -8, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f5b82e";
  ctx.beginPath();
  ctx.ellipse(-9, 5, 12, 7, -0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawScore() {
  if (gameState !== "playing") return;

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "900 54px system-ui";
  ctx.lineWidth = 7;
  ctx.strokeStyle = "rgba(0,0,0,.28)";
  ctx.strokeText(score, W / 2, 80);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(score, W / 2, 80);
  ctx.restore();
}

function render() {
  ctx.save();

  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    shake *= 0.82;
  }

  drawBackground();
  pipes.forEach(drawPipe);
  drawBird();
  drawScore();

  ctx.restore();
}

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000 || 0, 0.035);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

startButton.addEventListener("click", (event) => {
  event.stopPropagation();
  startGame();
});

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  flap();
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    flap();
  }
});

resetGame();
render();
requestAnimationFrame(loop);
