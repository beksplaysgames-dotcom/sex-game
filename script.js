(function () {
  const TIERS = ["Easy", "Medium", "Hard", "Extreme"];
  const STORAGE_KEY = "positions_tried_v1";

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
  const GAMES = ["Truth or Dare", "Dice Game", "Jar Game", "Tease · Lick · Kiss · Bite", "Card Match"];

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
        } else if (name === "Tease · Lick · Kiss · Bite") {
          showScreen("screen-tlkb-start");
        } else if (name === "Card Match") {
          showScreen("screen-cardmatch-start");
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
      gold: styles.getPropertyValue("--gold").trim() || "#9B30FF",
      crimson: styles.getPropertyValue("--crimson").trim() || "#FF2FD6",
      crimsonDark: styles.getPropertyValue("--crimson-dark").trim() || "#A6129C",
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
  const backJarSetupP1Btn = document.getElementById("back-jar-setup-p1");
  const backJarHandoffBtn = document.getElementById("back-jar-handoff");
  const backJarSetupP2Btn = document.getElementById("back-jar-setup-p2");
  const backJarBtn = document.getElementById("back-jar");
  const jarPlayer1Label = document.getElementById("jar-player1-label");
  const jarPlayer2Label = document.getElementById("jar-player2-label");
  const jarSetupP1Subtitle = document.getElementById("jar-setup-p1-subtitle");
  const jarPlayer1Dares = document.getElementById("jar-player1-dares");
  const jarPlayer2Dares = document.getElementById("jar-player2-dares");
  const jarSetupP1Form = document.getElementById("jar-setup-p1-form");
  const jarSetupP2Form = document.getElementById("jar-setup-p2-form");
  const jarSetupP1Error = document.getElementById("jar-setup-p1-error");
  const jarSetupP2Error = document.getElementById("jar-setup-p2-error");
  const jarHandoffText = document.getElementById("jar-handoff-text");
  const jarHandoffReadyBtn = document.getElementById("jar-handoff-ready");
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
  let jarPlayer1Submitted = [];

  function jarCurrentPlayerName() {
    const players = loadPlayers();
    if (!players) return "Player " + (jarPlayerIndex + 1);
    return jarPlayerIndex === 0 ? players.player1 : players.player2;
  }

  function jarPlayerName(index) {
    const players = loadPlayers();
    if (!players) return "Player " + (index + 1);
    return index === 0 ? players.player1 : players.player2;
  }

  function parseDareLines(raw) {
    return raw
      .split(/\r\n|\n|\r/)
      .map((line) => line.trim())
      .filter((line) => line !== "");
  }

  function enterJarSetup() {
    jarPlayer1Label.textContent = `${jarPlayerName(0)}'s dares`;
    jarSetupP1Subtitle.textContent = `${jarPlayerName(0)}, write 5–10 dares, then hand the phone off. ${jarPlayerName(1)} won't see them.`;
    jarPlayer1Dares.value = "";
    jarPlayer2Dares.value = "";
    jarSetupP1Error.classList.add("hidden");
    jarSetupP2Error.classList.add("hidden");
    jarPlayer1Submitted = [];
    showScreen("screen-jar-setup-p1");
  }

  jarSetupP1Form.addEventListener("submit", (e) => {
    e.preventDefault();
    const dares1 = parseDareLines(jarPlayer1Dares.value);
    if (dares1.length < JAR_MIN_DARES || dares1.length > JAR_MAX_DARES) {
      jarSetupP1Error.textContent = `Write ${JAR_MIN_DARES} to ${JAR_MAX_DARES} dares, one per line.`;
      jarSetupP1Error.classList.remove("hidden");
      return;
    }
    jarSetupP1Error.classList.add("hidden");
    jarPlayer1Submitted = dares1;
    jarHandoffText.textContent = `${jarPlayerName(0)} is done. Hand the phone to ${jarPlayerName(1)}.`;
    jarPlayer2Label.textContent = `${jarPlayerName(1)}'s dares`;
    jarPlayer2Dares.value = "";
    jarSetupP2Error.classList.add("hidden");
    showScreen("screen-jar-handoff");
  });

  jarHandoffReadyBtn.addEventListener("click", () => showScreen("screen-jar-setup-p2"));

  jarSetupP2Form.addEventListener("submit", (e) => {
    e.preventDefault();
    const dares2 = parseDareLines(jarPlayer2Dares.value);
    if (dares2.length < JAR_MIN_DARES || dares2.length > JAR_MAX_DARES) {
      jarSetupP2Error.textContent = `Write ${JAR_MIN_DARES} to ${JAR_MAX_DARES} dares, one per line.`;
      jarSetupP2Error.classList.remove("hidden");
      return;
    }
    jarSetupP2Error.classList.add("hidden");
    jarDares = [...jarPlayer1Submitted, ...dares2];
    jarTotal = jarDares.length;
    jarPlayerIndex = 0;
    showScreen("screen-jar");
    jarShowDrawReady();
  });

  backJarSetupP1Btn.addEventListener("click", () => showScreen("screen-game-pick"));
  backJarHandoffBtn.addEventListener("click", () => enterJarSetup());
  backJarSetupP2Btn.addEventListener("click", () => showScreen("screen-jar-handoff"));

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

  backJarBtn.addEventListener("click", () => showScreen("screen-game-pick"));

  // ---- Tease / Lick / Kiss / Bite ----
  const backTlkbBtn = document.getElementById("back-tlkb");
  const backTlkbStartBtn = document.getElementById("back-tlkb-start");
  const tlkbTierSelect = document.getElementById("tlkb-tier-select");
  const tlkbTurnEl = document.getElementById("tlkb-turn");
  const tlkbWheelEl = document.getElementById("tlkb-wheel");
  const tlkbSpinBtn = document.getElementById("tlkb-spin-btn");
  const tlkbRevealEl = document.getElementById("tlkb-reveal");
  const tlkbResultTextEl = document.getElementById("tlkb-result-text");
  const tlkbNextBtn = document.getElementById("tlkb-next-btn");
  const tlkbLevelUpEl = document.getElementById("tlkb-levelup");
  const tlkbLevelUpTextEl = document.getElementById("tlkb-levelup-text");
  const tlkbLevelUpYesBtn = document.getElementById("tlkb-levelup-yes");
  const tlkbLevelUpNoBtn = document.getElementById("tlkb-levelup-no");
  const tlkbModal = document.getElementById("tlkb-modal");

  const TLKB_ROUNDS_BEFORE_ASK = 5;
  const TLKB_SEGMENTS = 8;

  let tlkbPlayerIndex = 0;
  let tlkbTier = "Easy";
  let tlkbRoundsAtTier = 0;
  let tlkbRotation = 0;
  let tlkbLastIndex = -1;
  let tlkbSpinning = false;
  let tlkbBodyPartsByTier = {};

  TIERS.forEach((tier) => {
    const opt = document.createElement("option");
    opt.value = tier;
    opt.textContent = tier;
    tlkbTierSelect.appendChild(opt);
  });

  fetch("tlkb-data.csv?v=1")
    .then((res) => res.text())
    .then((text) => {
      const rows = parseCSV(text);
      rows.shift(); // drop header row
      const byTier = {};
      TIERS.forEach((tier) => { byTier[tier] = []; });
      rows.forEach(([tier, prompt]) => {
        if (!tier || !prompt) return;
        const tierKey = TIERS.find((t) => t.toLowerCase() === tier.trim().toLowerCase());
        if (tierKey) byTier[tierKey].push(prompt.trim());
      });
      tlkbBodyPartsByTier = byTier;
      renderTlkbWheel(tlkbTier);
    })
    .catch(() => {
      /* CSV unreachable (e.g. opened via file:// instead of a server) — spin will show a fallback message */
    });

  // Rebuilds the wheel's 8 labels for the current tier. The colored slices are a
  // static CSS conic-gradient on .wheel — only the text overlay changes here.
  function renderTlkbWheel(tier) {
    tlkbWheelEl.innerHTML = "";
    const parts = tlkbBodyPartsByTier[tier] || [];
    const segAngle = 360 / TLKB_SEGMENTS;
    for (let i = 0; i < TLKB_SEGMENTS; i++) {
      const slice = document.createElement("div");
      slice.className = "wheel-slice";
      slice.style.transform = `rotate(${i * segAngle + segAngle / 2}deg)`;
      const label = document.createElement("span");
      label.className = "wheel-label";
      label.textContent = parts[i] || "";
      slice.appendChild(label);
      tlkbWheelEl.appendChild(slice);
    }
  }

  function tlkbTierReady() {
    const parts = tlkbBodyPartsByTier[tlkbTier];
    return parts && parts.length === TLKB_SEGMENTS;
  }

  // Resets the wheel to its resting rotation without animating — used on entry
  // and tier changes, which aren't spins and shouldn't look like one settling.
  function tlkbSnapWheel() {
    tlkbRotation = 0;
    tlkbLastIndex = -1;
    tlkbWheelEl.style.transition = "none";
    tlkbWheelEl.style.transform = "rotate(0deg)";
    void tlkbWheelEl.offsetWidth; // force reflow so transition:none takes effect first
    tlkbWheelEl.style.transition = "";
  }

  function tlkbCurrentPlayerName() {
    const players = loadPlayers();
    if (!players) return "Player " + (tlkbPlayerIndex + 1);
    return tlkbPlayerIndex === 0 ? players.player1 : players.player2;
  }

  function tlkbShowReady() {
    tlkbTurnEl.textContent = `${tlkbCurrentPlayerName()}'s turn · ${tlkbTier}`;
    tlkbSpinBtn.classList.remove("hidden");
    tlkbSpinBtn.disabled = false;
    tlkbRevealEl.classList.add("hidden");
    tlkbNextBtn.classList.add("hidden");
    tlkbLevelUpEl.classList.add("hidden");
  }

  function tlkbShowLevelUpAsk() {
    const nextTier = TIERS[TIERS.indexOf(tlkbTier) + 1];
    tlkbLevelUpTextEl.textContent = `You've done ${TLKB_ROUNDS_BEFORE_ASK} rounds of ${tlkbTier}. Ready to level up to ${nextTier}?`;
    tlkbSpinBtn.classList.add("hidden");
    tlkbRevealEl.classList.add("hidden");
    tlkbNextBtn.classList.add("hidden");
    tlkbLevelUpEl.classList.remove("hidden");
  }

  tlkbSpinBtn.addEventListener("click", () => {
    if (tlkbSpinning) return;
    if (!tlkbTierReady()) {
      tlkbResultTextEl.textContent = `Add exactly ${TLKB_SEGMENTS} entries for ${tlkbTier} to tlkb-data.csv.`;
      tlkbRevealEl.classList.remove("hidden");
      return;
    }
    tlkbModal.classList.remove("hidden");
  });

  document.querySelectorAll(".modal-action-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      tlkbModal.classList.add("hidden");
      tlkbSpin(btn.dataset.action);
    });
  });

  function tlkbSpin(action) {
    const parts = tlkbBodyPartsByTier[tlkbTier];
    tlkbSpinning = true;
    tlkbSpinBtn.disabled = true;
    spinCompassOn(tlkbSpinBtn);

    let idx;
    if (parts.length === 1) {
      idx = 0;
    } else {
      do {
        idx = Math.floor(Math.random() * parts.length);
      } while (idx === tlkbLastIndex);
    }
    tlkbLastIndex = idx;

    const segAngle = 360 / TLKB_SEGMENTS;
    const midAngle = idx * segAngle + segAngle / 2;
    const targetMod = (360 - midAngle) % 360;
    const currentMod = ((tlkbRotation % 360) + 360) % 360;
    const delta = (targetMod - currentMod + 360) % 360;
    const extraSpins = (4 + Math.floor(Math.random() * 3)) * 360;
    tlkbRotation += delta + extraSpins;
    tlkbWheelEl.style.transform = `rotate(${tlkbRotation}deg)`;

    const finish = () => {
      tlkbSpinning = false;
      tlkbSpinBtn.disabled = false;
      tlkbSpinBtn.classList.add("hidden");
      tlkbResultTextEl.textContent = `${action} the ${parts[idx]}`;
      tlkbRevealEl.classList.remove("hidden");
      tlkbNextBtn.classList.remove("hidden");
      tlkbRoundsAtTier++;
    };
    tlkbWheelEl.addEventListener("transitionend", finish, { once: true });
    // Fallback in case transitionend never fires (e.g. reduced-motion edge cases).
    setTimeout(() => {
      if (tlkbSpinning) finish();
    }, 3600);
  }

  tlkbNextBtn.addEventListener("click", () => {
    tlkbPlayerIndex = tlkbPlayerIndex === 0 ? 1 : 0;
    const hasNextTier = TIERS.indexOf(tlkbTier) < TIERS.length - 1;
    if (hasNextTier && tlkbRoundsAtTier >= TLKB_ROUNDS_BEFORE_ASK) {
      tlkbShowLevelUpAsk();
    } else {
      tlkbShowReady();
    }
  });

  tlkbTierSelect.addEventListener("change", (e) => {
    tlkbTier = e.target.value;
    tlkbRoundsAtTier = 0;
    tlkbSnapWheel();
    renderTlkbWheel(tlkbTier);
    tlkbShowReady();
  });

  tlkbLevelUpYesBtn.addEventListener("click", () => {
    tlkbTier = TIERS[TIERS.indexOf(tlkbTier) + 1];
    tlkbTierSelect.value = tlkbTier;
    tlkbRoundsAtTier = 0;
    tlkbSnapWheel();
    renderTlkbWheel(tlkbTier);
    tlkbShowReady();
  });

  tlkbLevelUpNoBtn.addEventListener("click", () => {
    tlkbRoundsAtTier = 0;
    tlkbShowReady();
  });

  backTlkbBtn.addEventListener("click", () => showScreen("screen-game-pick"));
  backTlkbStartBtn.addEventListener("click", () => showScreen("screen-game-pick"));

  document.querySelectorAll(".tlkb-start-tier").forEach((card) => {
    card.addEventListener("click", () => enterTlkb(card.dataset.tier));
  });

  function enterTlkb(startTier) {
    tlkbPlayerIndex = 0;
    tlkbTier = startTier;
    tlkbTierSelect.value = tlkbTier;
    tlkbRoundsAtTier = 0;
    tlkbSnapWheel();
    renderTlkbWheel(tlkbTier);
    showScreen("screen-tlkb");
    tlkbShowReady();
  }

  // ---- Card Match ----
  const backCardmatchStartBtn = document.getElementById("back-cardmatch-start");
  const backCardmatchSortBtn = document.getElementById("back-cardmatch-sort");
  const backCardmatchHandoffBtn = document.getElementById("back-cardmatch-handoff");
  const backCardmatchResultsBtn = document.getElementById("back-cardmatch-results");
  const cardmatchSortTurnEl = document.getElementById("cardmatch-sort-turn");
  const cardmatchSortProgressEl = document.getElementById("cardmatch-sort-progress");
  const cardmatchSortTextEl = document.getElementById("cardmatch-sort-text");
  const cardmatchNoBtn = document.getElementById("cardmatch-no-btn");
  const cardmatchMaybeBtn = document.getElementById("cardmatch-maybe-btn");
  const cardmatchYesBtn = document.getElementById("cardmatch-yes-btn");
  const cardmatchHandoffTextEl = document.getElementById("cardmatch-handoff-text");
  const cardmatchHandoffReadyBtn = document.getElementById("cardmatch-handoff-ready");
  const cardmatchResultsSummaryEl = document.getElementById("cardmatch-results-summary");
  const cardmatchPerfectListEl = document.getElementById("cardmatch-perfect-list");
  const cardmatchExploreListEl = document.getElementById("cardmatch-explore-list");
  const cardmatchPlayAgainBtn = document.getElementById("cardmatch-play-again");
  const cardmatchBackGamesBtn = document.getElementById("cardmatch-back-games");

  let cardmatchByTier = {};
  let cmTier = "Easy";
  let cmDeck = [];
  let cmIndex = 0;
  let cmPhase = 1;
  let cmAnswers1 = [];
  let cmAnswers2 = [];

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  fetch("cardmatch-data.csv?v=1")
    .then((res) => res.text())
    .then((text) => {
      const rows = parseCSV(text);
      rows.shift(); // drop header row
      const byTier = {};
      TIERS.forEach((tier) => { byTier[tier] = []; });
      rows.forEach(([tier, prompt]) => {
        if (!tier || !prompt) return;
        const tierKey = TIERS.find((t) => t.toLowerCase() === tier.trim().toLowerCase());
        if (tierKey) byTier[tierKey].push(prompt.trim());
      });
      cardmatchByTier = byTier;
    })
    .catch(() => {
      /* CSV unreachable (e.g. opened via file:// instead of a server) — sorting will show a fallback message */
    });

  function cmPlayerName(phase) {
    const players = loadPlayers();
    if (!players) return "Player " + phase;
    return phase === 1 ? players.player1 : players.player2;
  }

  function cmShowCard() {
    cardmatchSortTurnEl.textContent = `${cmPlayerName(cmPhase)}'s turn · private`;
    cardmatchSortProgressEl.textContent = `${cmIndex + 1} / ${cmDeck.length} cards`;
    cardmatchSortTextEl.textContent = cmDeck[cmIndex];
  }

  function cmShowHandoff() {
    cardmatchHandoffTextEl.textContent = `${cmPlayerName(1)} is done. Hand the phone to ${cmPlayerName(2)}.`;
    showScreen("screen-cardmatch-handoff");
  }

  function cmShowResults() {
    const perfect = [];
    const explore = [];
    cmDeck.forEach((text, i) => {
      const a1 = cmAnswers1[i];
      const a2 = cmAnswers2[i];
      if (a1 === "yes" && a2 === "yes") {
        perfect.push(text);
      } else if (a1 !== "no" && a2 !== "no") {
        explore.push(text);
      }
    });

    cardmatchResultsSummaryEl.textContent = `${perfect.length} perfect match${perfect.length === 1 ? "" : "es"} · ${explore.length} worth exploring`;

    cardmatchPerfectListEl.innerHTML = "";
    if (perfect.length === 0) {
      const p = document.createElement("p");
      p.className = "match-empty";
      p.textContent = "No perfect matches this time.";
      cardmatchPerfectListEl.appendChild(p);
    } else {
      perfect.forEach((text) => {
        const item = document.createElement("div");
        item.className = "match-item";
        item.textContent = text;
        cardmatchPerfectListEl.appendChild(item);
      });
    }

    cardmatchExploreListEl.innerHTML = "";
    if (explore.length === 0) {
      const p = document.createElement("p");
      p.className = "match-empty";
      p.textContent = "Nothing here yet.";
      cardmatchExploreListEl.appendChild(p);
    } else {
      explore.forEach((text) => {
        const item = document.createElement("div");
        item.className = "match-item";
        item.textContent = text;
        cardmatchExploreListEl.appendChild(item);
      });
    }

    showScreen("screen-cardmatch-results");
  }

  function cmAnswer(choice) {
    const answers = cmPhase === 1 ? cmAnswers1 : cmAnswers2;
    answers.push(choice);
    cmIndex++;
    if (cmIndex >= cmDeck.length) {
      if (cmPhase === 1) {
        cmShowHandoff();
      } else {
        cmShowResults();
      }
    } else {
      cmShowCard();
    }
  }

  cardmatchNoBtn.addEventListener("click", () => cmAnswer("no"));
  cardmatchMaybeBtn.addEventListener("click", () => cmAnswer("maybe"));
  cardmatchYesBtn.addEventListener("click", () => cmAnswer("yes"));

  function startCardMatch(tier) {
    const pool = cardmatchByTier[tier];
    if (!pool || pool.length === 0) {
      cmDeck = [];
      cardmatchSortTurnEl.textContent = "";
      cardmatchSortProgressEl.textContent = "";
      cardmatchSortTextEl.textContent = `No ${tier} cards yet — add some to cardmatch-data.csv.`;
      showScreen("screen-cardmatch-sort");
      return;
    }
    cmTier = tier;
    cmDeck = shuffleArray(pool);
    cmIndex = 0;
    cmPhase = 1;
    cmAnswers1 = [];
    cmAnswers2 = [];
    showScreen("screen-cardmatch-sort");
    cmShowCard();
  }

  document.querySelectorAll(".cardmatch-start-tier").forEach((card) => {
    card.addEventListener("click", () => startCardMatch(card.dataset.tier));
  });

  cardmatchHandoffReadyBtn.addEventListener("click", () => {
    cmPhase = 2;
    cmIndex = 0;
    showScreen("screen-cardmatch-sort");
    cmShowCard();
  });

  backCardmatchStartBtn.addEventListener("click", () => showScreen("screen-game-pick"));
  backCardmatchSortBtn.addEventListener("click", () => showScreen("screen-game-pick"));
  backCardmatchHandoffBtn.addEventListener("click", () => showScreen("screen-game-pick"));
  backCardmatchResultsBtn.addEventListener("click", () => showScreen("screen-game-pick"));

  cardmatchPlayAgainBtn.addEventListener("click", () => showScreen("screen-cardmatch-start"));
  cardmatchBackGamesBtn.addEventListener("click", () => showScreen("screen-game-pick"));

  // ---- Coupons ----
  // Catalog (serial + description) comes from coupons-data.csv, same as the
  // other games' content. Only which serials are "used" is stateful, so that
  // alone is tracked in localStorage — mirroring how Positions' catalog comes
  // from data.js while its "tried" set lives separately in localStorage.
  const COUPONS_USED_KEY = "positions_coupons_used_v1";
  const splitCouponsBtn = document.getElementById("split-coupons");
  const backCouponsBtn = document.getElementById("back-coupons");
  const couponsScanBtn = document.getElementById("coupons-scan-btn");
  const couponsListEl = document.getElementById("coupons-list");
  const couponsEmptyEl = document.getElementById("coupons-empty");

  const backCouponScanBtn = document.getElementById("back-coupon-scan");
  const couponScanVideo = document.getElementById("coupon-scan-video");
  const couponScanStatusEl = document.getElementById("coupon-scan-status");

  const backCouponDetailBtn = document.getElementById("back-coupon-detail");
  const couponDetailSerialEl = document.getElementById("coupon-detail-serial");
  const couponDetailStatusEl = document.getElementById("coupon-detail-status");
  const couponDetailDescEl = document.getElementById("coupon-detail-desc");
  const couponToggleUsedBtn = document.getElementById("coupon-toggle-used-btn");
  const couponToggleUsedLabelEl = document.getElementById("coupon-toggle-used-label");

  let COUPONS = []; // [{serial, text}], loaded from coupons-data.csv
  let couponDetailSerial = null; // currently-viewed coupon's serial, for the detail screen

  fetch("coupons-data.csv?v=1")
    .then((res) => res.text())
    .then((text) => {
      const rows = parseCSV(text);
      rows.shift(); // drop header row
      COUPONS = rows
        .filter(([serial, desc]) => serial && desc)
        .map(([serial, desc]) => ({ serial: serial.trim(), text: desc.trim() }));
      renderCouponsList();
    })
    .catch(() => {
      /* CSV unreachable (e.g. opened via file:// instead of a server) — list stays empty */
    });

  function loadUsedSerials() {
    try {
      const raw = localStorage.getItem(COUPONS_USED_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) {
      return new Set();
    }
  }
  function saveUsedSerials(set) {
    try {
      localStorage.setItem(COUPONS_USED_KEY, JSON.stringify([...set]));
    } catch (e) {
      /* localStorage unavailable, used-state just won't persist */
    }
  }
  let couponsUsedSet = loadUsedSerials();

  function findCouponBySerial(serial) {
    const target = serial.trim().toLowerCase();
    return COUPONS.find((c) => c.serial.toLowerCase() === target) || null;
  }
  function isCouponUsed(serial) {
    return couponsUsedSet.has(serial.toLowerCase());
  }

  function renderCouponsList() {
    couponsListEl.innerHTML = "";
    couponsEmptyEl.classList.toggle("hidden", COUPONS.length > 0);
    COUPONS.forEach((coupon) => {
      const used = isCouponUsed(coupon.serial);
      const item = document.createElement("button");
      item.type = "button";
      item.className = "coupon-item" + (used ? " used" : "");

      const text = document.createElement("div");
      text.className = "coupon-item-text";
      const serialEl = document.createElement("span");
      serialEl.className = "coupon-item-serial";
      serialEl.textContent = coupon.serial;
      const descEl = document.createElement("span");
      descEl.className = "coupon-item-desc";
      descEl.textContent = coupon.text;
      text.appendChild(serialEl);
      text.appendChild(descEl);

      const badge = document.createElement("span");
      badge.className = "coupon-item-badge";
      badge.textContent = used ? "Used" : "Available";

      item.appendChild(text);
      item.appendChild(badge);
      item.addEventListener("click", () => showCouponDetail(coupon.serial));
      couponsListEl.appendChild(item);
    });
  }

  splitCouponsBtn.addEventListener("click", () => {
    showScreen("screen-coupons");
    renderCouponsList();
  });
  backCouponsBtn.addEventListener("click", () => showScreen("screen-split"));

  // ---- Coupons: detail screen ----
  function showCouponDetail(serial) {
    const coupon = findCouponBySerial(serial);
    if (!coupon) {
      showScreen("screen-coupons");
      renderCouponsList();
      return;
    }
    const used = isCouponUsed(coupon.serial);
    couponDetailSerial = coupon.serial;
    couponDetailSerialEl.textContent = coupon.serial;
    couponDetailDescEl.textContent = coupon.text;
    couponDetailStatusEl.textContent = used ? "Used" : "Available";
    couponDetailStatusEl.classList.toggle("used", used);
    couponToggleUsedLabelEl.textContent = used ? "Mark as not used" : "Mark as used";
    showScreen("screen-coupon-detail");
  }

  backCouponDetailBtn.addEventListener("click", () => {
    showScreen("screen-coupons");
    renderCouponsList();
  });

  couponToggleUsedBtn.addEventListener("click", () => {
    if (!couponDetailSerial) return;
    const key = couponDetailSerial.toLowerCase();
    if (couponsUsedSet.has(key)) {
      couponsUsedSet.delete(key);
    } else {
      couponsUsedSet.add(key);
    }
    saveUsedSerials(couponsUsedSet);
    showCouponDetail(couponDetailSerial);
  });

  // ---- Coupons: QR scan ----
  let couponScanStream = null;
  let couponScanRAF = null;
  const couponScanCanvas = document.createElement("canvas");
  const couponScanCtx = couponScanCanvas.getContext("2d", { willReadFrequently: true });

  function stopCouponScan() {
    if (couponScanRAF) {
      cancelAnimationFrame(couponScanRAF);
      couponScanRAF = null;
    }
    if (couponScanStream) {
      couponScanStream.getTracks().forEach((track) => track.stop());
      couponScanStream = null;
    }
    couponScanVideo.srcObject = null;
  }

  function couponScanTick() {
    if (!document.getElementById("screen-coupon-scan").classList.contains("active")) {
      stopCouponScan();
      return;
    }
    if (typeof jsQR !== "function") {
      couponScanStatusEl.textContent = "QR scanning isn't available in this browser.";
      stopCouponScan();
      return;
    }
    if (couponScanVideo.readyState >= couponScanVideo.HAVE_ENOUGH_DATA) {
      const w = couponScanVideo.videoWidth;
      const h = couponScanVideo.videoHeight;
      if (w > 0 && h > 0) {
        couponScanCanvas.width = w;
        couponScanCanvas.height = h;
        couponScanCtx.drawImage(couponScanVideo, 0, 0, w, h);
        const imageData = couponScanCtx.getImageData(0, 0, w, h);
        const code = jsQR(imageData.data, w, h, { inversionAttempts: "dontInvert" });
        if (code && code.data) {
          stopCouponScan();
          handleScannedSerial(code.data);
          return;
        }
      }
    }
    couponScanRAF = requestAnimationFrame(couponScanTick);
  }

  function handleScannedSerial(rawText) {
    const serial = rawText.trim();
    const coupon = findCouponBySerial(serial);
    if (coupon) {
      showCouponDetail(coupon.serial);
      return;
    }
    couponScanStatusEl.textContent = `No coupon found for serial "${serial}" — add it to coupons-data.csv.`;
  }

  function startCouponScan() {
    couponScanStatusEl.textContent = "Point your camera at the coupon's QR code.";

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      couponScanStatusEl.textContent = "Camera access isn't available in this browser.";
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .catch(() => navigator.mediaDevices.getUserMedia({ video: true }))
      .then((stream) => {
        couponScanStream = stream;
        couponScanVideo.srcObject = stream;
        return couponScanVideo.play();
      })
      .then(() => {
        couponScanRAF = requestAnimationFrame(couponScanTick);
      })
      .catch(() => {
        couponScanStatusEl.textContent = "Couldn't access the camera. Check that this page has camera permission (and is loaded over https).";
      });
  }

  couponsScanBtn.addEventListener("click", () => {
    showScreen("screen-coupon-scan");
    startCouponScan();
  });

  backCouponScanBtn.addEventListener("click", () => {
    stopCouponScan();
    showScreen("screen-coupons");
    renderCouponsList();
  });

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
