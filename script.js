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

  const tierCards = document.querySelectorAll(".tier-card");
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
