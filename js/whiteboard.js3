// ── MaitriLearn AI Teacher Board ─────────────────────────────────────────────
const BACKEND = typeof BACKEND_URL     !== "undefined" ? BACKEND_URL     : "http://localhost:5000";
const VOICE   = typeof VOICE_TUTOR_URL !== "undefined" ? VOICE_TUTOR_URL : "http://localhost:5001";

let lesson = null, stepIndex = 0, paused = false, running = false;
let currentAudio = null, _timers = [];

const COLORS = [
  { bg:"rgba(34,211,238,.15)",  border:"#22d3ee", text:"#22d3ee" },
  { bg:"rgba(167,139,250,.15)", border:"#a78bfa", text:"#a78bfa" },
  { bg:"rgba(74,222,128,.15)",  border:"#4ade80", text:"#4ade80" },
  { bg:"rgba(251,191,36,.15)",  border:"#fbbf24", text:"#fbbf24" },
  { bg:"rgba(248,113,113,.15)", border:"#f87171", text:"#f87171" },
  { bg:"rgba(251,146,60,.15)",  border:"#fb923c", text:"#fb923c" },
];
const ICONS = { title:"🏷", text:"📄", flowchart:"🔀", diagram:"🗂", graph:"📊", keypoints:"⭐" };

// ── helpers ───────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

function wait(ms) {
  return new Promise(r => { const t = setTimeout(r, ms); _timers.push(t); });
}

function clearAllTimers() {
  _timers.forEach(clearTimeout); _timers = [];
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  setTalking(false);
}

const setStatus  = (t, c="") => { const e=$("statusPill"); e.textContent=t; e.className="status-pill "+c; };
const setSpeech  = t => { const e=$("speechText"); if(e) e.textContent=t; };
const setTalking = y => { const r=$("avatarRing"); if(r) y?r.classList.add("talking"):r.classList.remove("talking"); };

// ── board ─────────────────────────────────────────────────────────────────────
function clearBoard() {
  const c = $("board-content");
  if (c) c.innerHTML = "";
  const o = $("idleOverlay");
  if (o) o.classList.remove("hidden");
}

// KEY FIX: inject HTML, wait one tick, then add .visible
// No requestAnimationFrame double-wrap — just setTimeout(0)
function showPanel(html) {
  const o = $("idleOverlay");
  if (o) o.classList.add("hidden");
  const content = $("board-content");
  if (!content) return null;
  content.innerHTML = html;
  return content.firstElementChild || null;
}

// ── step sidebar ──────────────────────────────────────────────────────────────
function buildStepList(steps) {
  const el = $("stepList");
  if (!el) return;
  el.innerHTML = steps.map((s, i) => `
    <div class="step-row" id="srow_${i}">
      <span class="step-icon">${ICONS[s.type]||"•"}</span>
      <span class="step-dot"></span>
      <span>${s.heading||s.text||s.type}</span>
    </div>`).join("");
}

function markStep(i, state) {
  document.querySelectorAll(".step-row").forEach((el, idx) => {
    el.className = "step-row" + (idx===i?" "+state : idx<i?" done":"");
  });
}

// ── safe element reveal ───────────────────────────────────────────────────────
// Gets the element FRESH from DOM each time — avoids stale reference bug
function show(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("visible");
}

// ── RENDERERS ─────────────────────────────────────────────────────────────────

async function renderTitle(step) {
  showPanel(`<div class="step-panel title-step">
    <div class="title-subject-tag">${lesson.subject||"AI Lesson"}</div>
    <h1 class="title-main" id="titleMain"></h1>
    <div class="title-bar"></div>
    <p class="title-sub">Powered by MaitriLearn AI</p>
  </div>`);
  await wait(200);
  const title = step.text || lesson.title || "Lesson";
  const el = $("titleMain");
  if (el) {
    for (const ch of title) {
      if (paused) return;
      el.textContent += ch;
      await wait(40);
    }
  }
  await wait(600);
}

async function renderText(step) {
  showPanel(`<div class="step-panel text-step">
    <h2 class="step-heading">${step.heading||""}</h2>
    <p class="step-body" id="textBody"></p>
  </div>`);
  await wait(300);

  const bodyEl = $("textBody");
  if (!bodyEl) return;

  const sentences = (step.body||"").split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length === 0) {
    bodyEl.textContent = step.body || "";
    await wait(800);
    return;
  }

  for (const s of sentences) {
    if (paused) return;
    const span = document.createElement("span");
    span.style.cssText = "opacity:0;transition:opacity .5s;";
    span.textContent = s + " ";
    bodyEl.appendChild(span);
    await wait(50);
    span.style.opacity = "1";
    await wait(380);
  }
  await wait(400);
}

async function renderFlowchart(step) {
  const nodes = step.nodes || [];
  const html = nodes.map((n, i) => {
    const c = COLORS[i % COLORS.length];
    const arrow = i < nodes.length-1
      ? `<div class="flow-arrow" id="fa_${i}">→</div>` : "";
    return `<div class="flow-node" id="fn_${i}">
      <div class="flow-node-box" style="background:${c.bg};border-color:${c.border};color:${c.text}">${n}</div>
      <div class="flow-num">0${i+1}</div>
    </div>${arrow}`;
  }).join("");

  showPanel(`<div class="step-panel flowchart-step">
    <h2 class="step-heading">${step.heading||"Process Flow"}</h2>
    <div class="flow-nodes">${html}</div>
  </div>`);

  await wait(200);
  for (let i = 0; i < nodes.length; i++) {
    if (paused) return;
    show(`fn_${i}`);
    await wait(300);
    show(`fa_${i}`);
    await wait(120);
  }
  await wait(400);
}

async function renderDiagram(step) {
  const elements = step.elements || [];
  const html = elements.map((el, i) => {
    const c = COLORS[i % COLORS.length];
    return `<div class="diagram-card" id="dc_${i}" style="border-left:3px solid ${c.border}">
      <div class="diagram-card-num" style="background:${c.bg};color:${c.text}">${i+1}</div>
      <div class="diagram-card-label">${el.label}</div>
      <div class="diagram-card-desc">${el.description||""}</div>
    </div>`;
  }).join("");

  showPanel(`<div class="step-panel diagram-step">
    <h2 class="step-heading">${step.heading||"Diagram"}</h2>
    <div class="diagram-grid">${html}</div>
  </div>`);

  await wait(200);
  for (let i = 0; i < elements.length; i++) {
    if (paused) return;
    show(`dc_${i}`);
    await wait(260);
  }
  await wait(400);
}

async function renderGraph(step) {
  const data   = step.data || [];
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const html   = data.map((d, i) => {
    const c = COLORS[i % COLORS.length];
    return `<div class="bar-group">
      <div class="bar-value" id="bv_${i}">${d.value}</div>
      <div class="bar-fill" id="bf_${i}" style="background:${c.bg};border:1px solid ${c.border};height:0;transition:height .7s cubic-bezier(.34,1.56,.64,1)"></div>
      <div class="bar-label">${d.label}</div>
    </div>`;
  }).join("");

  showPanel(`<div class="step-panel graph-step">
    <h2 class="step-heading">${step.heading||"Graph"}</h2>
    <div class="graph-wrap">
      <div class="graph-axis-label">${step.ylabel||"Value"}</div>
      <div class="bar-chart">${html}</div>
      <div class="graph-axis-label">${step.xlabel||""}</div>
    </div>
  </div>`);

  await wait(300);
  for (let i = 0; i < data.length; i++) {
    if (paused) return;
    const bar  = $(`bf_${i}`);
    const bval = $(`bv_${i}`);
    if (bar)  bar.style.height = Math.round((data[i].value/maxVal)*190)+"px";
    await wait(100);
    if (bval) bval.classList.add("visible");
    await wait(120);
  }
  await wait(500);
}

async function renderKeypoints(step) {
  const points = step.points || [];
  const html   = points.map((p, i) => {
    const c = COLORS[i % COLORS.length];
    return `<div class="keypoint-row" id="kp_${i}">
      <div class="keypoint-num" style="background:${c.bg};color:${c.text}">${i+1}</div>
      <div class="keypoint-text">${p}</div>
    </div>`;
  }).join("");

  showPanel(`<div class="step-panel keypoints-step">
    <h2 class="step-heading">${step.heading||"Key Takeaways"}</h2>
    <div class="keypoints-list">${html}</div>
  </div>`);

  await wait(200);
  for (let i = 0; i < points.length; i++) {
    if (paused) return;
    show(`kp_${i}`);
    await wait(300);
  }
  await wait(400);
}

async function renderStep(step) {
  switch(step.type) {
    case "title":     await renderTitle(step);     break;
    case "text":      await renderText(step);      break;
    case "flowchart": await renderFlowchart(step); break;
    case "diagram":   await renderDiagram(step);   break;
    case "graph":     await renderGraph(step);     break;
    case "keypoints": await renderKeypoints(step); break;
    default:          await renderText(step);      break;
  }
}

// ── narration ─────────────────────────────────────────────────────────────────
function narrate(text) {
  return new Promise(resolve => {
    setSpeech(text);
    setTalking(true);
    // Per-char timing: 55ms min 2.5s max 9s
    const fallback = Math.min(Math.max(text.length * 55, 2500), 9000);
    const useVoice = $("voiceToggle") && $("voiceToggle").checked;

    if (!useVoice) {
      _timers.push(setTimeout(() => { setTalking(false); resolve(); }, fallback));
      return;
    }

    fetch(`${VOICE}/generate`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ prompt: text })
    })
    .then(r => { if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(data => {
      const audio = new Audio(`${VOICE}${data.audio}`);
      currentAudio = audio;
      audio.onended = () => { setTalking(false); currentAudio=null; resolve(); };
      audio.onerror = () => { setTalking(false); currentAudio=null; resolve(); };
      audio.play().catch(() => { setTalking(false); resolve(); });
    })
    .catch(() => {
      _timers.push(setTimeout(() => { setTalking(false); resolve(); }, fallback));
    });
  });
}

// ── runner ────────────────────────────────────────────────────────────────────
async function runStep(index) {
  if (!lesson || index >= lesson.steps.length) {
    setStatus("DONE ✓",""); setSpeech("Lesson complete! Great job! 🎉");
    setTalking(false);
    if($("startBtn")) $("startBtn").disabled = false;
    if($("pauseBtn")) $("pauseBtn").disabled = true;
    running = false; return;
  }
  if (paused) return;

  stepIndex = index;
  markStep(index, "active");
  const step = lesson.steps[index];

  await renderStep(step);
  if (paused) return;

  await narrate(step.narration || step.heading || step.text || "");
  if (paused) return;

  markStep(index, "done");
  await wait(350);
  runStep(index + 1);
}

// ── public API ────────────────────────────────────────────────────────────────
window.startLesson = async function() {
  const topic = ($("topicInput")||{}).value?.trim();
  if (!topic) { alert("Please enter a topic!"); return; }

  clearAllTimers(); clearBoard();
  paused=false; running=true; stepIndex=0;

  if($("startBtn")) $("startBtn").disabled = true;
  if($("pauseBtn")) { $("pauseBtn").disabled=false; $("pauseBtn").textContent="⏸ Pause"; }
  if($("stepList")) $("stepList").innerHTML = "";

  setStatus("LOADING","loading");
  setSpeech(`Preparing lesson on "${topic}"...`);

  try {
    const res  = await fetch(`${BACKEND}/whiteboard/lesson`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({topic})
    });
    if (!res.ok) throw new Error("Backend "+res.status);
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    lesson = data.lesson;
    buildStepList(lesson.steps);
    setStatus("TEACHING","teaching");
    setSpeech(`Starting: ${lesson.title}!`);
    runStep(0);

  } catch(err) {
    console.error(err);
    setStatus("ERROR","error");
    setSpeech("Could not load lesson. Check backend.");
    if($("startBtn")) $("startBtn").disabled = false;
    if($("pauseBtn")) $("pauseBtn").disabled = true;
    running = false;
  }
};

window.togglePause = function() {
  paused = !paused;
  const btn = $("pauseBtn");
  if (paused) {
    clearAllTimers();
    if(btn) btn.textContent = "▶ Resume";
    setStatus("PAUSED","");
    setSpeech("Paused. Press Resume to continue.");
  } else {
    if(btn) btn.textContent = "⏸ Pause";
    setStatus("TEACHING","teaching");
    runStep(stepIndex);
  }
};

window.clearLesson = function() {
  clearAllTimers(); clearBoard();
  lesson=null; running=false; paused=false;
  if($("startBtn")) $("startBtn").disabled = false;
  if($("pauseBtn")) { $("pauseBtn").disabled=true; $("pauseBtn").textContent="⏸ Pause"; }
  if($("stepList")) $("stepList").innerHTML = "";
  setStatus("READY","");
  setSpeech("Hello! Enter a topic and I'll teach you with visuals! 👋");
};
