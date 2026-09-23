(function () {
  const TIERS = ["Easy", "Medium", "Hard", "Extreme"];
  const STORAGE_KEY = "positions_tried_v1";
  const THEME_KEY = "positions_theme_v1";

  // ---- Theme toggle (classic / neon), persisted in localStorage ----
  const themeToggleBtn = document.getElementById("theme-toggle");
  function applyTheme(theme) {
    if (theme === "neon") {
      document.documentElement.setAttribute("data-theme", "neon");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }
  let currentTheme = "classic";
  try {
    currentTheme = localStorage.getItem(THEME_KEY) || "classic";
  } catch (e) {
    /* localStorage unavailable, default to classic */
  }
  applyTheme(currentTheme);
  themeToggleBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "neon" ? "classic" : "neon";
    applyTheme(currentTheme);
    try {
      localStorage.setItem(THEME_KEY, currentTheme);
    } catch (e) {
      /* localStorage unavailable, theme choice just won't persist */
    }
  });

  const tierCards = document.querySelectorAll("#screen-home .tier-card");
  const tierSelect = document.getElementById("tier-select");
  const backHomeBtn = document.getElementById("back-home");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const doneBtn = document.getElementById("done-btn");
  const positionText = document.getElementById("position-text");
  const positionImage = document.getElementById("position-image");
  const positionPlaceholder = document.getElementById("position-placeholder");

  const openGalleryBtn = document.getElementById("open-gallery");
  const backHome2Btn = document.getElementById("back-home-2");
  const galleryTierSelect = document.getElementById("gallery-tier-select");
  const galleryGrid = document.getElementById("gallery-grid");
  const galleryProgress = document.getElementById("gallery-progress");

  let currentTier = "Easy";
  let lastIndex = -1;
  let currentEntry = null;

  // Give every position a stable key (tier + text), independent of array order
  POSITIONS.forEach((p) => {
    p.key = `${p.tier}::${p.text}`;
  });

  // ---- "Tried" tracking, persisted in localStorage ----
  function loadTried() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) {
      return new Set();
    }
  }
  function saveTried(set) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
    } catch (e) {
      /* localStorage unavailable, tried-state just won't persist */
    }
  }
  let triedSet = loadTried();

  function isTried(entry) {
    return triedSet.has(entry.key);
  }
  function markTried(entry) {
    triedSet.add(entry.key);
    saveTried(triedSet);
  }

  // ---- Screen switching ----
  function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  // ---- Split landing screen: Positions vs Game ----
  const PLAYERS_KEY = "positions_players_v1";
  const GAMES = ["Truth or Dare", "Dice Game", "Jar Game"];

  const splitPositionsBtn = document.getElementById("split-positions");
  const splitGameBtn = document.getElementById("split-game");
  const backSplitHomeBtn = document.getElementById("back-split-home");
  const backSplitNamesBtn = document.getElementById("back-split-names");
  const backSplitGamePickBtn = document.getElementById("back-split-gamepick");
  const namesForm = document.getElementById("names-form");
  const player1Input = document.getElementById("player1-input");
  const player2Input = document.getElementById("player2-input");
  const gameListEl = document.getElementById("game-list");
  const gameSettingsBtns = document.querySelectorAll(".game-settings-btn");
  const backGameSettingsBtn = document.getElementById("back-game-settings");
  const settingsForm = document.getElementById("settings-form");
  const settingsPlayer1Input = document.getElementById("settings-player1-input");
  const settingsPlayer2Input = document.getElementById("settings-player2-input");

  function loadPlayers() {
    try {
      const raw = localStorage.getItem(PLAYERS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function savePlayers(players) {
    try {
      localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
    } catch (e) {
      /* localStorage unavailable, names just won't persist */
    }
  }
  function renderGameList() {
    gameListEl.innerHTML = "";
    GAMES.forEach((name) => {
      const btn = document.createElement("button");
      btn.className = "game-card";
      btn.type = "button";
      btn.textContent = name;
      btn.addEventListener("click", () => {
        if (name === "Truth or Dare") {
          showScreen("screen-tod-start");
        } else if (name === "Dice Game") {
          showScreen("screen-dice-start");
        } else if (name === "Jar Game") {
          enterJarSetup();
        }
      });
      gameListEl.appendChild(btn);
    });
  }
  renderGameList();

  splitPositionsBtn.addEventListener("click", () => showScreen("screen-home"));
  splitGameBtn.addEventListener("click", () => {
    const players = loadPlayers();
    if (players && players.player1 && players.player2) {
      showScreen("screen-game-pick");
    } else {
      showScreen("screen-names");
    }
  });

  backSplitHomeBtn.addEventListener("click", () => showScreen("screen-split"));
  backSplitNamesBtn.addEventListener("click", () => showScreen("screen-split"));
  backSplitGamePickBtn.addEventListener("click", () => showScreen("screen-split"));

  namesForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const player1 = player1Input.value.trim();
    const player2 = player2Input.value.trim();
    if (!player1 || !player2) return;
    savePlayers({ player1, player2 });
    showScreen("screen-game-pick");
  });

  gameSettingsBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const players = loadPlayers();
      settingsPlayer1Input.value = players ? players.player1 : "";
      settingsPlayer2Input.value = players ? players.player2 : "";
      showScreen("screen-game-settings");
    });
  });

  backGameSettingsBtn.addEventListener("click", () => showScreen("screen-game-pick"));

  settingsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const player1 = settingsPlayer1Input.value.trim();
    const player2 = settingsPlayer2Input.value.trim();
    if (!player1 || !player2) return;
    savePlayers({ player1, player2 });
    showScreen("screen-game-pick");
  });

  // ---- Truth or Dare ----
  const backTodBtn = document.getElementById("back-tod");
  const todTurnEl = document.getElementById("tod-turn");
  const todTierSelect = document.getElementById("tod-tier-select");
  const todChoiceEl = document.getElementById("tod-choice");
  const todTruthBtn = document.getElementById("tod-truth-btn");
  const todDareBtn = document.getElementById("tod-dare-btn");
  const todRevealEl = document.getElementById("tod-reveal");
  const todKindEl = document.getElementById("tod-kind");
  const todScratchWrap = document.getElementById("tod-scratch-wrap");
  const todScratchCanvas = document.getElementById("tod-scratch-canvas");
  const todTextEl = document.getElementById("tod-text");
  const todNextBtn = document.getElementById("tod-next-btn");
  const todLevelUpEl = document.getElementById("tod-levelup");
  const todLevelUpTextEl = document.getElementById("tod-levelup-text");
  const todLevelUpYesBtn = document.getElementById("tod-levelup-yes");
  const todLevelUpNoBtn = document.getElementById("tod-levelup-no");

  const TOD_ROUNDS_BEFORE_ASK = 5;

  let todPlayerIndex = 0;
  let todTier = "Easy";
  let todRoundsAtTier = 0;
  let todLastTruthIndex = -1;
  let todLastDareIndex = -1;
  let TRUTHS = [];
  let DARES = [];

  TIERS.forEach((tier) => {
    const opt = document.createElement("option");
    opt.value = tier;
    opt.textContent = tier;
    todTierSelect.appendChild(opt);
  });

  // Minimal CSV parser: handles quoted fields, embedded commas, and "" as an escaped quote.
  function parseCSV(text) {
    const rows = [];
    const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim() !== "");
    for (const line of lines) {
      const fields = [];
      let field = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"' && line[i + 1] === '"') {
            field += '"';
            i++;
          } else if (ch === '"') {
            inQuotes = false;
          } else {
            field += ch;
          }
        } else if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          fields.push(field);
          field = "";
        } else {
          field += ch;
        }
      }
      fields.push(field);
      // Spreadsheet apps sometimes export a whole row as a single quoted cell
      // (e.g. "Action,Kiss") if the columns weren't actually split when editing.
      // Recover from that instead of silently dropping the row.
      if (fields.length === 1 && fields[0].includes(",")) {
        rows.push(fields[0].split(","));
      } else {
        rows.push(fields);
      }
    }
    return rows;
  }

  fetch("truth-or-dare-data.csv?v=2")
    .then((res) => res.text())
    .then((text) => {
      const rows = parseCSV(text);
      rows.shift(); // drop header row
      rows.forEach(([kind, tier, prompt]) => {
        if (!kind || !tier || !prompt) return;
        const normalized = kind.trim().toLowerCase();
        const entry = { tier: tier.trim(), text: prompt.trim() };
        if (normalized === "truth") TRUTHS.push(entry);
        else if (normalized === "dare") DARES.push(entry);
      });
    })
    .catch(() => {
      /* CSV unreachable (e.g. opened via file:// instead of a server) — Truth or Dare falls back to its empty-pool message */
    });

  // ---- Truth or Dare: scratch-card reveal ----
  const scratchCtx = todScratchCanvas.getContext("2d");
  const SCRATCH_SAMPLE_W = 32;
  const SCRATCH_SAMPLE_H = 20;
  const SCRATCH_REVEAL_THRESHOLD = 0.55;
  const scratchSampleCanvas = document.createElement("canvas");
  scratchSampleCanvas.width = SCRATCH_SAMPLE_W;
  scratchSampleCanvas.height = SCRATCH_SAMPLE_H;
  const scratchSampleCtx = scratchSampleCanvas.getContext("2d");

  let scratchDisplayW = 0;
  let scratchDisplayH = 0;
  let scratchActive = false;
  let scratchRevealed = false;
  let scratchDrawing = false;
  let scratchLastPoint = null;
  let scratchSampleQueued = false;

  function scratchThemeColors() {
    const styles = getComputedStyle(document.documentElement);
    return {
      gold: styles.getPropertyValue("--gold").trim() || "#D4AF37",
      crimson: styles.getPropertyValue("--crimson").trim() || "#D41F3C",
      crimsonDark: styles.getPropertyValue("--crimson-dark").trim() || "#7A0F22",
    };
  }

  function paintScratchLayer(ctx, w, h) {
    const { gold, crimson, crimsonDark } = scratchThemeColors();
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, crimsonDark);
    grad.addColorStop(1, crimson);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = gold;
    ctx.font = `${Math.max(10, Math.round(h * 0.16))}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cols = 6;
    const rows = 4;
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const x = (w / cols) * c + (r % 2 === 0 ? 0 : w / cols / 2);
        const y = (h / rows) * r;
        ctx.fillText("✦", x, y);
      }
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = gold;
    ctx.font = `800 ${Math.max(12, Math.round(h * 0.15))}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 4;
    ctx.fillText("SCRATCH TO REVEAL", w / 2, h / 2);
    ctx.restore();
  }

  function initScratchCard() {
    const rect = todScratchWrap.getBoundingClientRect();
    scratchDisplayW = Math.max(1, Math.round(rect.width));
    scratchDisplayH = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    todScratchCanvas.width = scratchDisplayW * dpr;
    todScratchCanvas.height = scratchDisplayH * dpr;
    todScratchCanvas.style.width = scratchDisplayW + "px";
    todScratchCanvas.style.height = scratchDisplayH + "px";
    scratchCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scratchCtx.globalCompositeOperation = "source-over";
    paintScratchLayer(scratchCtx, scratchDisplayW, scratchDisplayH);

    scratchSampleCtx.setTransform(1, 0, 0, 1, 0, 0);
    scratchSampleCtx.globalCompositeOperation = "source-over";
    scratchSampleCtx.fillStyle = "#000";
    scratchSampleCtx.fillRect(0, 0, SCRATCH_SAMPLE_W, SCRATCH_SAMPLE_H);

    // Snap opacity back to 1 instantly rather than animating — the transition
    // exists for the reveal fade-out, not for a fresh card fading itself in.
    todScratchCanvas.style.transition = "none";
    todScratchCanvas.classList.remove("revealed");
    void todScratchCanvas.offsetWidth; // force reflow so transition:none takes effect first
    todScratchCanvas.style.transition = "";
    todScratchCanvas.style.pointerEvents = "";
    scratchActive = true;
    scratchRevealed = false;
    scratchLastPoint = null;
  }

  function scratchErase(x, y) {
    scratchCtx.globalCompositeOperation = "destination-out";
    scratchCtx.beginPath();
    scratchCtx.arc(x, y, 22, 0, Math.PI * 2);
    scratchCtx.fill();

    const sx = (x / scratchDisplayW) * SCRATCH_SAMPLE_W;
    const sy = (y / scratchDisplayH) * SCRATCH_SAMPLE_H;
    scratchSampleCtx.globalCompositeOperation = "destination-out";
    scratchSampleCtx.beginPath();
    scratchSampleCtx.arc(sx, sy, 3, 0, Math.PI * 2);
    scratchSampleCtx.fill();
  }

  function scratchStrokeTo(x, y) {
    if (scratchLastPoint) {
      const dx = x - scratchLastPoint.x;
      const dy = y - scratchLastPoint.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.floor(dist / 8));
      for (let i = 1; i <= steps; i++) {
        scratchErase(scratchLastPoint.x + (dx * i) / steps, scratchLastPoint.y + (dy * i) / steps);
      }
    } else {
      scratchErase(x, y);
    }
    scratchLastPoint = { x, y };
  }

  function queueScratchSample() {
    if (scratchSampleQueued) return;
    scratchSampleQueued = true;
    requestAnimationFrame(() => {
      scratchSampleQueued = false;
      checkScratchProgress();
    });
  }

  function checkScratchProgress() {
    if (!scratchActive || scratchRevealed) return;
    const data = scratchSampleCtx.getImageData(0, 0, SCRATCH_SAMPLE_W, SCRATCH_SAMPLE_H).data;
    let cleared = 0;
    const total = SCRATCH_SAMPLE_W * SCRATCH_SAMPLE_H;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 128) cleared++;
    }
    if (cleared / total >= SCRATCH_REVEAL_THRESHOLD) {
      revealScratchCard();
    }
  }

  function revealScratchCard() {
    if (scratchRevealed) return;
    scratchRevealed = true;
    scratchActive = false;
    todScratchCanvas.classList.add("revealed");
    todScratchCanvas.style.pointerEvents = "none";
    setTimeout(() => {
      todNextBtn.classList.remove("hidden");
    }, 350);
  }

  function skipScratchCard() {
    scratchActive = false;
    scratchRevealed = true;
    todScratchCanvas.classList.add("revealed");
    todScratchCanvas.style.pointerEvents = "none";
  }

  function scratchPointFromEvent(e) {
    const rect = todScratchCanvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  todScratchCanvas.addEventListener("pointerdown", (e) => {
    if (!scratchActive || scratchRevealed) return;
    e.preventDefault();
    scratchDrawing = true;
    scratchLastPoint = null;
    todScratchCanvas.setPointerCapture(e.pointerId);
    const p = scratchPointFromEvent(e);
    scratchStrokeTo(p.x, p.y);
    queueScratchSample();
  });
  todScratchCanvas.addEventListener("pointermove", (e) => {
    if (!scratchDrawing || !scratchActive || scratchRevealed) return;
    const p = scratchPointFromEvent(e);
    scratchStrokeTo(p.x, p.y);
    queueScratchSample();
  });
  function stopScratchDrawing() {
    scratchDrawing = false;
    scratchLastPoint = null;
  }
  todScratchCanvas.addEventListener("pointerup", stopScratchDrawing);
  todScratchCanvas.addEventListener("pointercancel", stopScratchDrawing);
  todScratchCanvas.addEventListener("pointerleave", stopScratchDrawing);

  window.addEventListener("resize", () => {
    const screenTod = document.getElementById("screen-tod");
    if (!screenTod.classList.contains("active")) return;
    if (!scratchActive || scratchRevealed) return;
    if (todRevealEl.classList.contains("hidden")) return;
    initScratchCard();
  });

  function todCurrentPlayerName() {
    const players = loadPlayers();
    if (!players) return "Player " + (todPlayerIndex + 1);
    return todPlayerIndex === 0 ? players.player1 : players.player2;
  }

  function todShowChoice() {
    todTurnEl.textContent = `${todCurrentPlayerName()}'s turn · ${todTier}`;
    todChoiceEl.classList.remove("hidden");
    todRevealEl.classList.add("hidden");
    todNextBtn.classList.add("hidden");
    todLevelUpEl.classList.add("hidden");
  }

  function todShowLevelUpAsk() {
    const nextTier = TIERS[TIERS.indexOf(todTier) + 1];
    todLevelUpTextEl.textContent = `You've done ${TOD_ROUNDS_BEFORE_ASK} rounds of ${todTier}. Ready to level up to ${nextTier}?`;
    todChoiceEl.classList.add("hidden");
    todRevealEl.classList.add("hidden");
    todNextBtn.classList.add("hidden");
    todLevelUpEl.classList.remove("hidden");
  }

  function todDraw(kind) {
    const source = kind === "Truth" ? TRUTHS : DARES;
    const pool = source.filter((entry) => entry.tier === todTier);
    todRoundsAtTier++;
    todChoiceEl.classList.add("hidden");
    todRevealEl.classList.remove("hidden");
    todNextBtn.classList.add("hidden");

    if (pool.length === 0) {
      todKindEl.textContent = kind;
      todTextEl.textContent = `No ${todTier} ${kind.toLowerCase()} prompts yet — add some to truth-or-dare-data.csv.`;
      skipScratchCard();
      todNextBtn.classList.remove("hidden");
      return;
    }

    let idx;
    if (pool.length === 1) {
      idx = 0;
    } else {
      const lastIdx = kind === "Truth" ? todLastTruthIndex : todLastDareIndex;
      do {
        idx = Math.floor(Math.random() * pool.length);
      } while (idx === lastIdx);
    }
    if (kind === "Truth") {
      todLastTruthIndex = idx;
    } else {
      todLastDareIndex = idx;
    }
    todKindEl.textContent = kind;
    todTextEl.textContent = pool[idx].text;
    initScratchCard();
  }

  function enterTruthOrDare(startTier) {
    todPlayerIndex = 0;
    todTier = startTier;
    todTierSelect.value = todTier;
    todRoundsAtTier = 0;
    todLastTruthIndex = -1;
    todLastDareIndex = -1;
    showScreen("screen-tod");
    todShowChoice();
  }

  document.querySelectorAll(".tod-start-tier").forEach((card) => {
    card.addEventListener("click", () => enterTruthOrDare(card.dataset.tier));
  });

  document.getElementById("back-tod-start").addEventListener("click", () => showScreen("screen-game-pick"));

  todTruthBtn.addEventListener("click", () => todDraw("Truth"));
  todDareBtn.addEventListener("click", () => todDraw("Dare"));

  todTierSelect.addEventListener("change", (e) => {
    todTier = e.target.value;
    todRoundsAtTier = 0;
    todLastTruthIndex = -1;
    todLastDareIndex = -1;
    todShowChoice();
  });

  todLevelUpYesBtn.addEventListener("click", () => {
    todTier = TIERS[TIERS.indexOf(todTier) + 1];
    todTierSelect.value = todTier;
    todRoundsAtTier = 0;
    todLastTruthIndex = -1;
    todLastDareIndex = -1;
    todShowChoice();
  });

  todLevelUpNoBtn.addEventListener("click", () => {
    todRoundsAtTier = 0;
    todShowChoice();
  });

  todNextBtn.addEventListener("click", () => {
    todPlayerIndex = todPlayerIndex === 0 ? 1 : 0;
    const hasNextTier = TIERS.indexOf(todTier) < TIERS.length - 1;
    if (hasNextTier && todRoundsAtTier >= TOD_ROUNDS_BEFORE_ASK) {
      todShowLevelUpAsk();
    } else {
      todShowChoice();
    }
  });

  backTodBtn.addEventListener("click", () => showScreen("screen-game-pick"));

  // ---- Dice Game ----
  const backDiceBtn = document.getElementById("back-dice");
  const backDiceStartBtn = document.getElementById("back-dice-start");
  const diceTierSelect = document.getElementById("dice-tier-select");
  const diceTurnEl = document.getElementById("dice-turn");
  const diceCube1 = document.getElementById("die-cube-1");
  const diceCube2 = document.getElementById("die-cube-2");
  const diceRollBtn = document.getElementById("dice-roll-btn");
  const diceResultEl = document.getElementById("dice-result");
  const diceNextBtn = document.getElementById("dice-next-btn");
  const diceLevelUpEl = document.getElementById("dice-levelup");
  const diceLevelUpTextEl = document.getElementById("dice-levelup-text");
  const diceLevelUpYesBtn = document.getElementById("dice-levelup-yes");
  const diceLevelUpNoBtn = document.getElementById("dice-levelup-no");

  const DICE_ROUNDS_BEFORE_ASK = 5;

  // Order must match the .die-face-* CSS classes, and DIE_FACE_BASE_ROTATION below.
  const DIE_FACE_ORDER = ["front", "back", "right", "left", "top", "bottom"];
  const DIE_FACE_BASE_ROTATION = [
    { x: 0, y: 0 },
    { x: 0, y: 180 },
    { x: 0, y: -90 },
    { x: 0, y: 90 },
    { x: -90, y: 0 },
    { x: 90, y: 0 },
  ];

  TIERS.forEach((tier) => {
    const opt = document.createElement("option");
    opt.value = tier;
    opt.textContent = tier;
    diceTierSelect.appendChild(opt);
  });

  let dicePlayerIndex = 0;
  let diceTier = "Easy";
  let diceRoundsAtTier = 0;
  let diceRolling = false;
  // wordsByTier: { Easy: [...6], Medium: [...6], Hard: [...6], Extreme: [...6] }
  const dieStates = [
    { wordsByTier: {}, lastFace: -1, x: 0, y: 0 },
    { wordsByTier: {}, lastFace: -1, x: 0, y: 0 },
  ];

  function renderDieFaces(cubeEl, words) {
    DIE_FACE_ORDER.forEach((face, i) => {
      const faceEl = cubeEl.querySelector(`.die-face-${face}`);
      if (faceEl) faceEl.textContent = (words && words[i]) || "";
    });
  }

  // Resets a die's cube to its resting rotation and paints the current tier's
  // words onto its faces (a roll never rewrites face content, only a tier change does).
  function diceApplyTier(cubeEl, state) {
    state.lastFace = -1;
    state.x = 0;
    state.y = 0;
    // Snap instantly rather than animating through the roll transition — a tier
    // change isn't a roll, so it shouldn't look like one settled on its own.
    cubeEl.style.transition = "none";
    cubeEl.style.transform = "rotateX(0deg) rotateY(0deg)";
    void cubeEl.offsetWidth; // force reflow so the transition:none takes effect first
    cubeEl.style.transition = "";
    renderDieFaces(cubeEl, state.wordsByTier[diceTier]);
  }

  fetch("dice-game-data.csv?v=2")
    .then((res) => res.text())
    .then((text) => {
      const rows = parseCSV(text);
      rows.shift(); // drop header row
      const byTier = { Action: {}, Location: {} };
      TIERS.forEach((tier) => {
        byTier.Action[tier] = [];
        byTier.Location[tier] = [];
      });
      rows.forEach(([die, tier, prompt]) => {
        if (!die || !tier || !prompt) return;
        const dieLower = die.trim().toLowerCase();
        const dieKey = dieLower === "action" ? "Action" : dieLower === "location" ? "Location" : null;
        const tierKey = TIERS.find((t) => t.toLowerCase() === tier.trim().toLowerCase());
        if (dieKey && tierKey) {
          byTier[dieKey][tierKey].push(prompt.trim());
        }
      });
      dieStates[0].wordsByTier = byTier.Action;
      dieStates[1].wordsByTier = byTier.Location;
      diceApplyTier(diceCube1, dieStates[0]);
      diceApplyTier(diceCube2, dieStates[1]);
    })
    .catch(() => {
      /* CSV unreachable (e.g. opened via file:// instead of a server) — roll will show a fallback message */
    });

  function diceCurrentPlayerName() {
    const players = loadPlayers();
    if (!players) return "Player " + (dicePlayerIndex + 1);
    return dicePlayerIndex === 0 ? players.player1 : players.player2;
  }

  function diceShowReady() {
    diceTurnEl.textContent = `${diceCurrentPlayerName()}'s turn · ${diceTier}`;
    diceRollBtn.classList.remove("hidden");
    diceResultEl.classList.add("hidden");
    diceNextBtn.classList.add("hidden");
    diceLevelUpEl.classList.add("hidden");
  }

  function diceShowLevelUpAsk() {
    const nextTier = TIERS[TIERS.indexOf(diceTier) + 1];
    diceLevelUpTextEl.textContent = `You've done ${DICE_ROUNDS_BEFORE_ASK} rounds of ${diceTier}. Ready to level up to ${nextTier}?`;
    diceRollBtn.classList.add("hidden");
    diceResultEl.classList.add("hidden");
    diceNextBtn.classList.add("hidden");
    diceLevelUpEl.classList.remove("hidden");
  }

  // Rotates one die to a random new face (never repeating the previous one) and
  // returns the word on that face. Rotation accumulates across rolls (rather than
  // resetting to 0) so the cube always spins forward into its next position, plus
  // a few extra full turns for visual flair.
  function rollOneDie(cubeEl, state) {
    const words = state.wordsByTier[diceTier];
    let faceIndex;
    do {
      faceIndex = Math.floor(Math.random() * 6);
    } while (faceIndex === state.lastFace);
    state.lastFace = faceIndex;

    const base = DIE_FACE_BASE_ROTATION[faceIndex];
    const extraX = (2 + Math.floor(Math.random() * 2)) * 360 * (Math.random() < 0.5 ? 1 : -1);
    const extraY = (2 + Math.floor(Math.random() * 2)) * 360 * (Math.random() < 0.5 ? 1 : -1);
    const deltaX = (((base.x - state.x) % 360) + 360) % 360;
    const deltaY = (((base.y - state.y) % 360) + 360) % 360;
    state.x += deltaX + extraX;
    state.y += deltaY + extraY;
    cubeEl.style.transform = `rotateX(${state.x}deg) rotateY(${state.y}deg)`;
    return words[faceIndex];
  }

  function diceTierReady() {
    const words1 = dieStates[0].wordsByTier[diceTier];
    const words2 = dieStates[1].wordsByTier[diceTier];
    return words1 && words1.length === 6 && words2 && words2.length === 6;
  }

  diceRollBtn.addEventListener("click", () => {
    if (diceRolling) return;
    if (!diceTierReady()) {
      diceResultEl.textContent = `Add exactly 6 Action and 6 Location rows for ${diceTier} to dice-game-data.csv.`;
      diceResultEl.classList.remove("hidden");
      return;
    }
    diceRolling = true;
    diceRollBtn.disabled = true;
    spinCompassOn(diceRollBtn);
    const word1 = rollOneDie(diceCube1, dieStates[0]);
    const word2 = rollOneDie(diceCube2, dieStates[1]);

    const finish = () => {
      diceRolling = false;
      diceRollBtn.disabled = false;
      diceResultEl.textContent = `${word1} · ${word2}`;
      diceResultEl.classList.remove("hidden");
      diceRollBtn.classList.add("hidden");
      diceNextBtn.classList.remove("hidden");
      diceRoundsAtTier++;
    };
    diceCube1.addEventListener("transitionend", finish, { once: true });
    // Fallback in case transitionend never fires (e.g. reduced-motion edge cases).
    setTimeout(() => {
      if (diceRolling) finish();
    }, 1400);
  });

  diceNextBtn.addEventListener("click", () => {
    dicePlayerIndex = dicePlayerIndex === 0 ? 1 : 0;
    const hasNextTier = TIERS.indexOf(diceTier) < TIERS.length - 1;
    if (hasNextTier && diceRoundsAtTier >= DICE_ROUNDS_BEFORE_ASK) {
      diceShowLevelUpAsk();
    } else {
      diceShowReady();
    }
  });

  diceTierSelect.addEventListener("change", (e) => {
    diceTier = e.target.value;
    diceRoundsAtTier = 0;
    diceApplyTier(diceCube1, dieStates[0]);
    diceApplyTier(diceCube2, dieStates[1]);
    diceShowReady();
  });

  diceLevelUpYesBtn.addEventListener("click", () => {
    diceTier = TIERS[TIERS.indexOf(diceTier) + 1];
    diceTierSelect.value = diceTier;
    diceRoundsAtTier = 0;
    diceApplyTier(diceCube1, dieStates[0]);
    diceApplyTier(diceCube2, dieStates[1]);
    diceShowReady();
  });

  diceLevelUpNoBtn.addEventListener("click", () => {
    diceRoundsAtTier = 0;
    diceShowReady();
  });

  backDiceBtn.addEventListener("click", () => showScreen("screen-game-pick"));
  backDiceStartBtn.addEventListener("click", () => showScreen("screen-game-pick"));

  document.querySelectorAll(".dice-start-tier").forEach((card) => {
    card.addEventListener("click", () => enterDiceGame(card.dataset.tier));
  });

  function enterDiceGame(startTier) {
    dicePlayerIndex = 0;
    diceTier = startTier;
    diceTierSelect.value = diceTier;
    diceRoundsAtTier = 0;
    diceApplyTier(diceCube1, dieStates[0]);
    diceApplyTier(diceCube2, dieStates[1]);
    showScreen("screen-dice");
    diceShowReady();
  }

  // ---- Jar Game ----
  const backJarSetupBtn = document.getElementById("back-jar-setup");
  const backJarBtn = document.getElementById("back-jar");
  const jarPlayer1Label = document.getElementById("jar-player1-label");
  const jarPlayer2Label = document.getElementById("jar-player2-label");
  const jarPlayer1Dares = document.getElementById("jar-player1-dares");
  const jarPlayer2Dares = document.getElementById("jar-player2-dares");
  const jarSetupForm = document.getElementById("jar-setup-form");
  const jarSetupError = document.getElementById("jar-setup-error");
  const jarTurnEl = document.getElementById("jar-turn");
  const jarRemainingEl = document.getElementById("jar-remaining");
  const jarDrawBtn = document.getElementById("jar-draw-btn");
  const jarRevealEl = document.getElementById("jar-reveal");
  const jarDareTextEl = document.getElementById("jar-dare-text");
  const jarDoneBtn = document.getElementById("jar-done-btn");
  const jarCompleteEl = document.getElementById("jar-complete");
  const jarCompleteTextEl = document.getElementById("jar-complete-text");
  const jarCompleteAgainBtn = document.getElementById("jar-complete-again");
  const jarCompleteBackBtn = document.getElementById("jar-complete-back");

  const JAR_MIN_DARES = 5;
  const JAR_MAX_DARES = 10;

  let jarPlayerIndex = 0;
  let jarDares = [];
  let jarTotal = 0;

  function jarCurrentPlayerName() {
    const players = loadPlayers();
    if (!players) return "Player " + (jarPlayerIndex + 1);
    return jarPlayerIndex === 0 ? players.player1 : players.player2;
  }

  function parseDareLines(raw) {
    return raw
      .split(/\r\n|\n|\r/)
      .map((line) => line.trim())
      .filter((line) => line !== "");
  }

  function enterJarSetup() {
    const players = loadPlayers();
    jarPlayer1Label.textContent = `${players ? players.player1 : "Player 1"}'s dares`;
    jarPlayer2Label.textContent = `${players ? players.player2 : "Player 2"}'s dares`;
    jarPlayer1Dares.value = "";
    jarPlayer2Dares.value = "";
    jarSetupError.classList.add("hidden");
    showScreen("screen-jar-setup");
  }

  jarSetupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const dares1 = parseDareLines(jarPlayer1Dares.value);
    const dares2 = parseDareLines(jarPlayer2Dares.value);
    if (
      dares1.length < JAR_MIN_DARES ||
      dares1.length > JAR_MAX_DARES ||
      dares2.length < JAR_MIN_DARES ||
      dares2.length > JAR_MAX_DARES
    ) {
      jarSetupError.textContent = `Each of you needs ${JAR_MIN_DARES} to ${JAR_MAX_DARES} dares, one per line.`;
      jarSetupError.classList.remove("hidden");
      return;
    }
    jarSetupError.classList.add("hidden");
    jarDares = [...dares1, ...dares2];
    jarTotal = jarDares.length;
    jarPlayerIndex = 0;
    showScreen("screen-jar");
    jarShowDrawReady();
  });

  function jarShowDrawReady() {
    jarTurnEl.textContent = `${jarCurrentPlayerName()}'s turn`;
    jarRemainingEl.textContent = `${jarDares.length} / ${jarTotal} dares left`;
    jarDrawBtn.classList.remove("hidden");
    jarRevealEl.classList.add("hidden");
    jarDoneBtn.classList.add("hidden");
    jarCompleteEl.classList.add("hidden");
  }

  function jarShowComplete() {
    jarCompleteTextEl.textContent = `The jar's empty! You got through all ${jarTotal} dares.`;
    jarDrawBtn.classList.add("hidden");
    jarRevealEl.classList.add("hidden");
    jarDoneBtn.classList.add("hidden");
    jarCompleteEl.classList.remove("hidden");
  }

  jarDrawBtn.addEventListener("click", () => {
    if (jarDares.length === 0) return;
    spinCompassOn(jarDrawBtn);
    const idx = Math.floor(Math.random() * jarDares.length);
    const [dare] = jarDares.splice(idx, 1);
    jarDareTextEl.textContent = dare;
    jarRemainingEl.textContent = `${jarDares.length} / ${jarTotal} dares left`;
    jarDrawBtn.classList.add("hidden");
    jarRevealEl.classList.remove("hidden");
    jarDoneBtn.classList.remove("hidden");
  });

  jarDoneBtn.addEventListener("click", () => {
    jarPlayerIndex = jarPlayerIndex === 0 ? 1 : 0;
    if (jarDares.length === 0) {
      jarShowComplete();
    } else {
      jarShowDrawReady();
    }
  });

  jarCompleteAgainBtn.addEventListener("click", () => enterJarSetup());
  jarCompleteBackBtn.addEventListener("click", () => showScreen("screen-game-pick"));

  backJarSetupBtn.addEventListener("click", () => showScreen("screen-game-pick"));
  backJarBtn.addEventListener("click", () => showScreen("screen-game-pick"));

  // ---- Draw screen logic ----
  function poolFor(tier) {
    return POSITIONS.filter((p) => p.tier === tier);
  }

  function renderEntry(entry) {
    currentEntry = entry;
    if (!entry) {
      positionText.textContent = "No positions added for this difficulty yet.";
      positionImage.classList.remove("visible");
      positionPlaceholder.classList.remove("hidden");
      return;
    }
    positionText.textContent = entry.text;
    if (entry.imagePath) {
      positionImage.src = entry.imagePath;
      positionImage.alt = entry.text;
      positionImage.classList.add("visible");
      positionPlaceholder.classList.add("hidden");
    } else {
      positionImage.classList.remove("visible");
      positionPlaceholder.classList.remove("hidden");
    }
  }

  function drawRandom() {
    const pool = poolFor(currentTier);
    if (pool.length === 0) {
      renderEntry(null);
      return;
    }
    let idx;
    if (pool.length === 1) {
      idx = 0;
    } else {
      do {
        idx = Math.floor(Math.random() * pool.length);
      } while (idx === lastIndex);
    }
    lastIndex = idx;
    renderEntry(pool[idx]);
  }

  function spinCompassOn(btn) {
    const compass = btn.querySelector(".compass");
    if (!compass) return;
    compass.classList.remove("spin");
    void compass.offsetWidth;
    compass.classList.add("spin");
  }

  function enterDraw(tier) {
    currentTier = tier;
    tierSelect.value = tier;
    lastIndex = -1;
    showScreen("screen-draw");
    drawRandom();
  }

  tierCards.forEach((card) => {
    card.addEventListener("click", () => enterDraw(card.dataset.tier));
  });

  TIERS.forEach((tier) => {
    const opt = document.createElement("option");
    opt.value = tier;
    opt.textContent = tier;
    tierSelect.appendChild(opt);
  });

  tierSelect.addEventListener("change", (e) => {
    currentTier = e.target.value;
    lastIndex = -1;
    drawRandom();
  });

  shuffleBtn.addEventListener("click", () => {
    spinCompassOn(shuffleBtn);
    drawRandom();
  });

  doneBtn.addEventListener("click", () => {
    if (currentEntry) {
      markTried(currentEntry);
    }
    drawRandom();
  });

  backHomeBtn.addEventListener("click", () => {
    showScreen("screen-home");
  });

  // ---- Gallery screen logic ----
  TIERS.forEach((tier) => {
    const opt = document.createElement("option");
    opt.value = tier;
    opt.textContent = tier;
    galleryTierSelect.appendChild(opt);
  });

  function renderGallery(filterTier) {
    const items = filterTier === "All" ? POSITIONS : POSITIONS.filter((p) => p.tier === filterTier);
    galleryGrid.innerHTML = "";

    const triedCount = items.filter(isTried).length;
    galleryProgress.textContent = `${triedCount} / ${items.length} tried`;

    items.forEach((entry) => {
      const cell = document.createElement("div");
      cell.className = "gallery-item" + (isTried(entry) ? " tried" : "");
      cell.setAttribute("role", "button");
      cell.setAttribute("tabindex", "0");
      cell.setAttribute("aria-label", entry.text);

      if (entry.imagePath) {
        const img = document.createElement("img");
        img.src = entry.imagePath;
        img.alt = entry.text;
        img.loading = "lazy";
        cell.appendChild(img);
      } else {
        const ph = document.createElement("div");
        ph.className = "no-image";
        ph.textContent = "✦";
        cell.appendChild(ph);
      }

      const label = document.createElement("div");
      label.className = "label";
      label.textContent = entry.text;
      cell.appendChild(label);

      const mark = document.createElement("div");
      mark.className = "tried-mark";
      mark.textContent = "✓";
      cell.appendChild(mark);

      function toggle() {
        if (isTried(entry)) {
          triedSet.delete(entry.key);
        } else {
          triedSet.add(entry.key);
        }
        saveTried(triedSet);
        cell.classList.toggle("tried");
        const triedNow = items.filter(isTried).length;
        galleryProgress.textContent = `${triedNow} / ${items.length} tried`;
      }

      cell.addEventListener("click", toggle);
      cell.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });

      galleryGrid.appendChild(cell);
    });
  }

  openGalleryBtn.addEventListener("click", () => {
    galleryTierSelect.value = "All";
    showScreen("screen-gallery");
    renderGallery("All");
  });

  galleryTierSelect.addEventListener("change", (e) => {
    renderGallery(e.target.value);
  });

  backHome2Btn.addEventListener("click", () => {
    showScreen("screen-home");
  });
})();
