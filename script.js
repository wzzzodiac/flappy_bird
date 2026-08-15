const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startButton = document.getElementById("startButton");
const skinSelect = document.getElementById("skinSelect");
const hardcoreToggle = document.getElementById("hardcoreToggle");
const soundToggle = document.getElementById("soundToggle");
const medalEl = document.getElementById("medal");

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
let audioContext;

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

const hardcoreDeathMessages = [
  "You enabled Hardcore yourself. This is legally your fault.",
  "Difficulty selected: unemployment simulator.",
  "Hardcore mode has reviewed your application. Rejected.",
  "You wanted pain. Customer satisfaction achieved XD.",
  "The pipes were not harder. You were simply more optimistic."
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

const skins = {
  classic: { body: "#ffd43b", wing: "#f5b82e", beak: "#ff9f1c", outline: "#9d6900", eye: "#111827" },
  angry: { body: "#ff4d57", wing: "#d93440", beak: "#ffc145", outline: "#811924", eye: "#1b0b0c" },
  toxic: { body: "#8aff46", wing: "#4fdb22", beak: "#d8ff3e", outline: "#287913", eye: "#061706" },
  void: { body: "#34264f", wing: "#211832", beak: "#a78bfa", outline: "#120c1d", eye: "#f5f3ff" }
};

function getSettings() {
  return {
    hardcore: hardcoreToggle.checked,
    sound: soundToggle.checked,
    skin: skinSelect.value
  };
}

function playTone(frequency, duration = 0.08, type = "sine", volume = 0.04) {
  if (!soundToggle.checked) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (_) {}
}

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
  speed = getSettings().hardcore ? 200 : 165;
  spawnTimer = 0;
  shake = 0;
  scoreEl.textContent = "0";
  medalEl.classList.add("hidden");
}

function startGame() {
  resetGame();
  gameState = "playing";
  overlay.classList.add("hidden");
  lastTime = performance.now();
  playTone(520, 0.09, "triangle", 0.035);
}

function flap() {
  if (gameState === "ready" || gameState === "dead") {
    startGame();
  }

  if (gameState === "playing") {
    bird.vy = getSettings().hardcore ? -395 : -375;
    playTone(740, 0.055, "square", 0.025);
  }
}

function spawnPipe() {
  const settings = getSettings();
  const baseGap = settings.hardcore ? 148 : 175;
  const minGap = settings.hardcore ? 112 : 132;
  const gap = Math.max(minGap, baseGap - score * (settings.hardcore ? 1.25 : 1.1));
  const margin = settings.hardcore ? 78 : 90;
  const gapCenter = margin + Math.random() * (H - margin * 2);

  pipes.push({
    x: W + 40,
    width: settings.hardcore ? 78 : 72,
    gapTop: gapCenter - gap / 2,
    gapBottom: gapCenter + gap / 2,
    passed: false
  });
}

function getMedal(scoreValue) {
  if (scoreValue >= 50) return { icon: "💎", name: "DIAMOND — SEEK EMPLOYMENT" };
  if (scoreValue >= 30) return { icon: "🥇", name: "GOLD — SUSPICIOUSLY COMPETENT" };
  if (scoreValue >= 20) return { icon: "🥈", name: "SILVER — ACTUAL PILOT" };
  if (scoreValue >= 10) return { icon: "🥉", name: "BRONZE — MOSTLY ALIVE" };
  if (scoreValue >= 5) return { icon: "🪨", name: "STONE — PARTICIPATION ROCK" };
  return null;
}

function showMedal() {
  const medal = getMedal(score);
  if (!medal) {
    medalEl.classList.add("hidden");
    return;
  }
  medalEl.textContent = `${medal.icon} ${medal.name}`;
  medalEl.classList.remove("hidden");
}

function gameOver() {
  if (gameState !== "playing") return;

  gameState = "dead";
  shake = getSettings().hardcore ? 18 : 12;
  playTone(115, 0.28, "sawtooth", 0.055);
  showMedal();

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("flappy_best_score", bestScore);
    bestScoreEl.textContent = bestScore;
    overlayTitle.textContent = `NEW BEST: ${score}`;
    overlayText.textContent = "Against all available evidence, you improved.";
    setTimeout(() => playTone(660, 0.12, "triangle", 0.03), 150);
    setTimeout(() => playTone(880, 0.16, "triangle", 0.03), 300);
  } else {
    overlayTitle.textContent = `Score: ${score}`;
    const pool = getSettings().hardcore ? hardcoreDeathMessages : deathMessages;
    overlayText.textContent = pool[Math.floor(Math.random() * pool.length)];
  }

  startButton.textContent = "MAKE THE SAME MISTAKE AGAIN";
  setTimeout(() => overlay.classList.remove("hidden"), 280);
}

function update(dt) {
  if (gameState !== "playing") return;

  const settings = getSettings();
  bird.vy += (settings.hardcore ? 1175 : 1050) * dt;
  bird.y += bird.vy * dt;
  bird.rotation = Math.max(-0.45, Math.min(1.15, bird.vy / 520));

  spawnTimer += dt;
  const spawnInterval = settings.hardcore ? 1.38 : 1.55;
  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    spawnPipe();
  }

  speed = Math.min(settings.hardcore ? 285 : 245, (settings.hardcore ? 200 : 165) + score * (settings.hardcore ? 2.2 : 1.9));

  for (const pipe of pipes) {
    pipe.x -= speed * dt;

    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      pipe.passed = true;
      score += 1;
      scoreEl.textContent = score;
      playTone(960, 0.06, "sine", 0.025);

      const milestone = scoreComments.find(([n]) => n === score);
      if (milestone) flashMessage(milestone[1]);
    }

    const withinX = bird.x + bird.r > pipe.x && bird.x - bird.r < pipe.x + pipe.width;
    const hitTop = bird.y - bird.r < pipe.gapTop;
    const hitBottom = bird.y + bird.r > pipe.gapBottom;

    if (withinX && (hitTop || hitBottom)) gameOver();
  }

  pipes = pipes.filter(pipe => pipe.x + pipe.width > -30);

  if (bird.y + bird.r >= H - 45 || bird.y - bird.r <= 0) gameOver();
}

let toastTimer;
function flashMessage(text) {
  clearTimeout(toastTimer);
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    Object.assign(toast.style, {
      position: "fixed",
      left: "50%",
      top: "20px",
      transform: "translateX(-50%)",
      zIndex: "999",
      maxWidth: "90vw",
      padding: "10px 14px",
      borderRadius: "12px",
      background: "rgba(4,10,20,.92)",
      border: "1px solid rgba(255,255,255,.12)",
      color: "#f4f7fb",
      font: "600 13px system-ui",
      boxShadow: "0 12px 35px rgba(0,0,0,.35)",
      transition: "opacity .2s ease"
    });
    document.body.appendChild(toast);
  }

  toast.textContent = text;
  toast.style.opacity = "1";
  toastTimer = setTimeout(() => { toast.style.opacity = "0"; }, 1800);
}

function drawBackground() {
  const hardcore = getSettings().hardcore;
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, hardcore ? "#d06363" : "#77d6ff");
  gradient.addColorStop(0.62, hardcore ? "#ffb07c" : "#b7ecff");
  gradient.addColorStop(1, hardcore ? "#ffe0b8" : "#e7f8ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = hardcore ? 0.1 : 0.2;
  for (let i = 0; i < 6; i++) {
    const x = (i * 95 + 35) % W;
    const y = 90 + (i % 3) * 95;
    ctx.beginPath();
    ctx.ellipse(x, y, 55, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = hardcore ? "#493327" : "#6fc35b";
  ctx.fillRect(0, H - 45, W, 45);
  ctx.fillStyle = hardcore ? "#251b16" : "#4d9b43";
  ctx.fillRect(0, H - 45, W, 8);
}

function drawPipe(pipe) {
  const x = pipe.x;
  const w = pipe.width;
  const hardcore = getSettings().hardcore;

  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  if (hardcore) {
    grad.addColorStop(0, "#8b2534");
    grad.addColorStop(0.45, "#d1495b");
    grad.addColorStop(1, "#641927");
  } else {
    grad.addColorStop(0, "#2ca448");
    grad.addColorStop(0.45, "#66dc6f");
    grad.addColorStop(1, "#1b8135");
  }

  ctx.fillStyle = grad;
  ctx.strokeStyle = hardcore ? "#47101a" : "#155f2c";
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
  const skin = skins[getSettings().skin] || skins.classic;
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  ctx.fillStyle = skin.body;
  ctx.strokeStyle = skin.outline;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 23, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = skin.beak;
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

  ctx.fillStyle = skin.eye;
  ctx.beginPath();
  ctx.arc(13, -8, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skin.wing;
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

hardcoreToggle.addEventListener("change", () => {
  if (gameState === "playing") {
    hardcoreToggle.checked = !hardcoreToggle.checked;
    flashMessage("Finish your current disaster before changing difficulty XD.");
    return;
  }
  flashMessage(hardcoreToggle.checked ? "Hardcore enabled. Insurance not included." : "Normal mode restored. Cowardice accepted.");
  render();
});

skinSelect.addEventListener("change", () => render());

resetGame();
render();
requestAnimationFrame(loop);
