/* Kefel — a kids' multiplication game. No dependencies, no build step. */

const I18N = {
  en: {
    title: "Kefel ✖️",
    tagline: "Let's practice multiplication!",
    chooseTable: "Choose a times table",
    howMany: "How many questions?",
    start: "Start! 🚀",
    mixed: "Mixed 🎲",
    greatJob: "Great job!",
    playAgain: "Play again 🔁",
    changeTable: "Change table",
    correct: ["Yes! 🎉", "Awesome! ⭐", "Perfect! 💯", "You got it! 🌟", "Brilliant! ✨"],
    wrong: "Oops! It's",
    youScored: "You scored",
    outOf: "out of",
    perfect: "PERFECT! 🏆",
    langBtn: "עב",
  },
  he: {
    title: "כֵּפֶל ✖️",
    tagline: "!בואו נתרגל לוח הכפל",
    chooseTable: "בחרו לוח כפל",
    howMany: "?כמה שאלות",
    start: "!התחלה 🚀",
    mixed: "מעורב 🎲",
    greatJob: "!כל הכבוד",
    playAgain: "שחקו שוב 🔁",
    changeTable: "החליפו לוח",
    correct: ["!כן 🎉", "!מעולה ⭐", "!מושלם 💯", "!הצלחת 🌟", "!מבריק ✨"],
    wrong: "אופס! התשובה היא",
    youScored: "צברתם",
    outOf: "מתוך",
    perfect: "!מושלם 🏆",
    langBtn: "EN",
  },
};

const state = {
  lang: localStorage.getItem("kefel.lang") || "en",
  table: 2,        // 2..12 or "mixed"
  length: 10,
  queue: [],
  index: 0,
  score: 0,
  streak: 0,
  bestStreak: 0,
  locked: false,
};

const $ = (id) => document.getElementById(id);
const t = () => I18N[state.lang];

/* ---------- Sound (Web Audio, no assets) ---------- */
let audioCtx;
function beep(freq, dur = 0.12, type = "sine", when = 0) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    g.connect(audioCtx.destination);
    const start = audioCtx.currentTime + when;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.25, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.start(start);
    o.stop(start + dur);
  } catch (e) { /* audio not available — ignore */ }
}
const sndCorrect = () => { beep(660, 0.12, "triangle"); beep(880, 0.14, "triangle", 0.1); };
const sndWrong = () => beep(180, 0.25, "sawtooth");
const sndWin = () => [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.18, "triangle", i * 0.12));

/* ---------- Language ---------- */
function applyLang() {
  const dict = t();
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === "he" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
  $("title").textContent = dict.title;
  $("langBtn").textContent = dict.langBtn;
  buildTableGrid();
  buildLengthRow();
}
function toggleLang() {
  state.lang = state.lang === "en" ? "he" : "en";
  localStorage.setItem("kefel.lang", state.lang);
  applyLang();
}

/* ---------- Setup screen ---------- */
function buildTableGrid() {
  const grid = $("tableGrid");
  grid.innerHTML = "";
  for (let n = 2; n <= 12; n++) {
    const b = document.createElement("button");
    b.className = "tile" + (state.table === n ? " selected" : "");
    b.textContent = "×" + n;
    b.onclick = () => { state.table = n; buildTableGrid(); beep(520, 0.06); };
    grid.appendChild(b);
  }
  const mixed = document.createElement("button");
  mixed.className = "tile mixed" + (state.table === "mixed" ? " selected" : "");
  mixed.textContent = t().mixed;
  mixed.onclick = () => { state.table = "mixed"; buildTableGrid(); beep(520, 0.06); };
  grid.appendChild(mixed);
}

function buildLengthRow() {
  const row = $("lengthRow");
  row.innerHTML = "";
  [5, 10, 15, 20].forEach((len) => {
    const p = document.createElement("button");
    p.className = "pill" + (state.length === len ? " selected" : "");
    p.textContent = len;
    p.onclick = () => { state.length = len; buildLengthRow(); beep(520, 0.06); };
    row.appendChild(p);
  });
}

/* ---------- Game flow ---------- */
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function buildQueue() {
  const q = [];
  for (let i = 0; i < state.length; i++) {
    const a = state.table === "mixed" ? rand(2, 12) : state.table;
    const b = rand(2, 12);
    q.push({ a, b });
  }
  state.queue = q;
}

function makeChoices(answer) {
  const set = new Set([answer]);
  while (set.size < 4) {
    let delta = rand(-10, 10);
    if (delta === 0) delta = 1;
    const cand = answer + delta;
    if (cand > 0) set.add(cand);
  }
  return [...set].sort(() => Math.random() - 0.5);
}

function startGame() {
  buildQueue();
  state.index = 0;
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.locked = false;
  showScreen("game");
  renderQuestion();
}

function renderQuestion() {
  const q = state.queue[state.index];
  const answer = q.a * q.b;
  $("question").textContent = `${q.a} × ${q.b}`;
  $("score").textContent = state.score;
  $("streak").textContent = state.streak;
  $("progress").textContent = `${state.index + 1}/${state.length}`;
  $("progressFill").style.width = `${(state.index / state.length) * 100}%`;
  $("feedback").textContent = "";
  $("mascotGame").className = "mascot";

  const wrap = $("answers");
  wrap.innerHTML = "";
  makeChoices(answer).forEach((choice) => {
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.textContent = choice;
    btn.onclick = () => handleAnswer(btn, choice, answer);
    wrap.appendChild(btn);
  });
  state.locked = false;
}

function handleAnswer(btn, choice, answer) {
  if (state.locked) return;
  state.locked = true;
  const buttons = [...document.querySelectorAll(".answer")];
  buttons.forEach((b) => b.classList.add("disabled"));

  if (choice === answer) {
    btn.classList.add("correct");
    state.score += 10 + state.streak * 2; // streak bonus
    state._correct = (state._correct || 0) + 1;
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    const msgs = t().correct;
    $("feedback").textContent = msgs[rand(0, msgs.length - 1)];
    $("mascotGame").className = "mascot happy";
    sndCorrect();
    burstConfetti(18);
  } else {
    btn.classList.add("wrong");
    buttons.find((b) => +b.textContent === answer)?.classList.add("correct");
    state.streak = 0;
    $("feedback").textContent = `${t().wrong} ${answer}`;
    $("mascotGame").className = "mascot sad";
    sndWrong();
  }
  $("score").textContent = state.score;
  $("streak").textContent = state.streak;

  setTimeout(() => {
    state.index++;
    if (state.index >= state.length) finish();
    else renderQuestion();
  }, choice === answer ? 750 : 1500);
}

function finish() {
  $("progressFill").style.width = "100%";
  const total = state.length * 10; // base points (streak bonus is extra)
  const correctCount = countCorrect();
  const ratio = correctCount / state.length;
  const starCount = ratio === 1 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.4 ? 1 : 0;

  const stars = $("stars");
  stars.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const s = document.createElement("span");
    s.textContent = "⭐";
    if (i >= starCount) s.className = "dim";
    stars.appendChild(s);
  }

  $("resultTitle").textContent = ratio === 1 ? t().perfect : t().greatJob;
  $("mascotResults").textContent = ratio === 1 ? "🏆" : ratio >= 0.7 ? "🎉" : "💪";
  $("resultScore").textContent =
    `${t().youScored} ${correctCount} ${t().outOf} ${state.length}  ·  ⭐ ${state.score}`;

  showScreen("results");
  if (starCount >= 2) { sndWin(); burstConfetti(120); }
}

/* We track correctness implicitly via streak resets, so recompute here. */
function countCorrect() {
  // score includes streak bonuses; derive correct answers from a simple replay-free counter.
  return state._correct || 0;
}

/* ---------- Screens ---------- */
function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(name).classList.add("active");
}

/* ---------- Confetti ---------- */
const canvas = $("confetti");
const ctx = canvas.getContext("2d");
let particles = [];
function resizeCanvas() { canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener("resize", resizeCanvas);
resizeCanvas();

const COLORS = ["#fd79a8", "#ffd32a", "#00b894", "#6c5ce7", "#0984e3", "#e17055"];
function burstConfetti(count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: innerWidth / 2,
      y: innerHeight / 3,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -12 - 4,
      size: Math.random() * 8 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 100,
    });
  }
}
function tick() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p) => {
    p.vy += 0.4;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life--;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  });
  particles = particles.filter((p) => p.life > 0 && p.y < canvas.height + 20);
  requestAnimationFrame(tick);
}
tick();

/* ---------- Wire up ---------- */
$("langBtn").onclick = toggleLang;
$("homeBtn").onclick = () => { showScreen("home"); };
$("startBtn").onclick = () => { state._correct = 0; startGame(); };
$("againBtn").onclick = () => { state._correct = 0; startGame(); };
$("changeBtn").onclick = () => showScreen("home");

applyLang();
showScreen("home");
