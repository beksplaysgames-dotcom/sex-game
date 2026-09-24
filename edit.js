(function () {
  const TIERS = ["Easy", "Medium", "Hard", "Extreme"];

  // ---- Tabs ----
  document.querySelectorAll(".edit-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".edit-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".edit-panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.target).classList.add("active");
    });
  });

  // ---- Shared CSV helpers ----
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
      if (fields.length === 1 && fields[0].includes(",")) {
        rows.push(fields[0].split(","));
      } else {
        rows.push(fields);
      }
    }
    return rows;
  }

  function csvField(value) {
    const v = String(value == null ? "" : value);
    if (/["\n,]/.test(v)) {
      return '"' + v.replace(/"/g, '""') + '"';
    }
    return v;
  }

  async function copyToClipboard(text) {
    const outputWrap = document.getElementById("output-wrap");
    const output = document.getElementById("copy-output");
    output.value = text;
    outputWrap.classList.remove("hidden");
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      /* Clipboard API blocked — the visible textarea above is the fallback. */
    }
    output.focus();
    output.select();
  }

  // ============================================================
  // POSITIONS
  // ============================================================
  const positionsState = (typeof POSITIONS !== "undefined" ? POSITIONS : []).map((p) => ({ ...p }));
  const positionsListEl = document.getElementById("positions-list");
  const positionsSearchEl = document.getElementById("positions-search");
  const positionsFilterEl = document.getElementById("positions-filter");
  const positionsCountEl = document.getElementById("positions-count");

  TIERS.forEach((tier) => {
    const opt = document.createElement("option");
    opt.value = tier;
    opt.textContent = tier;
    positionsFilterEl.appendChild(opt);
  });

  function renderPositions() {
    const search = positionsSearchEl.value.trim().toLowerCase();
    const tierFilter = positionsFilterEl.value;
    const visible = positionsState.filter((p) => {
      const matchesTier = tierFilter === "All" || p.tier === tierFilter;
      const matchesSearch = !search || p.text.toLowerCase().includes(search);
      return matchesTier && matchesSearch;
    });

    positionsCountEl.textContent = `${visible.length} shown / ${positionsState.length} total`;
    positionsListEl.innerHTML = "";

    visible.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "edit-row";

      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.className = "edit-row-text";
      textInput.value = entry.text;
      textInput.addEventListener("input", () => { entry.text = textInput.value; });

      const tierSelect = document.createElement("select");
      TIERS.forEach((tier) => {
        const opt = document.createElement("option");
        opt.value = tier;
        opt.textContent = tier;
        if (tier === entry.tier) opt.selected = true;
        tierSelect.appendChild(opt);
      });
      tierSelect.addEventListener("change", () => { entry.tier = tierSelect.value; });

      const imageInput = document.createElement("input");
      imageInput.type = "text";
      imageInput.placeholder = "images/filename.png";
      imageInput.value = entry.imagePath || "";
      imageInput.addEventListener("input", () => { entry.imagePath = imageInput.value; });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "edit-row-remove";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        const idx = positionsState.indexOf(entry);
        if (idx !== -1) positionsState.splice(idx, 1);
        renderPositions();
      });

      row.appendChild(textInput);
      row.appendChild(tierSelect);
      row.appendChild(imageInput);
      row.appendChild(removeBtn);
      positionsListEl.appendChild(row);
    });
  }

  positionsSearchEl.addEventListener("input", renderPositions);
  positionsFilterEl.addEventListener("change", renderPositions);

  document.getElementById("positions-add").addEventListener("click", () => {
    positionsSearchEl.value = "";
    positionsFilterEl.value = "All";
    positionsState.push({ text: "", tier: "Easy", imagePath: "" });
    renderPositions();
    positionsListEl.lastElementChild.scrollIntoView({ behavior: "smooth", block: "center" });
    positionsListEl.lastElementChild.querySelector("input").focus();
  });

  document.getElementById("positions-copy").addEventListener("click", () => {
    const header = `// POSITIONS DATA
// -----------------------------------------------------------------
// Add your positions here. Each entry needs:
//   text      -> the position name/description (required)
//   tier      -> exactly one of: "Easy", "Medium", "Hard", "Extreme" (required)
//   imagePath -> filename of an image in the /images folder, or "" if none (optional)
//
// Imported from Positions.xlsx (425 entries) with images from the
// "Crimson Violet" set. Difficulty mapping: 1=Easy, 2=Medium, 3=Hard, 4=Extreme.
// -----------------------------------------------------------------

const POSITIONS = [
`;
    const rows = positionsState
      .map((p) => `  { text: ${JSON.stringify(p.text)}, tier: ${JSON.stringify(p.tier)}, imagePath: ${JSON.stringify(p.imagePath || "")} },`)
      .join("\n");
    copyToClipboard(header + rows + "\n];\n");
  });

  renderPositions();

  // ============================================================
  // TRUTH OR DARE
  // ============================================================
  let todState = [];
  const todListEl = document.getElementById("tod-list");
  const todCountEl = document.getElementById("tod-count");

  function renderTod() {
    todCountEl.textContent = `${todState.length} prompts total`;
    todListEl.innerHTML = "";
    todState.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "edit-row";

      const kindSelect = document.createElement("select");
      ["truth", "dare"].forEach((kind) => {
        const opt = document.createElement("option");
        opt.value = kind;
        opt.textContent = kind === "truth" ? "Truth" : "Dare";
        if (kind === entry.kind) opt.selected = true;
        kindSelect.appendChild(opt);
      });
      kindSelect.addEventListener("change", () => { entry.kind = kindSelect.value; });

      const tierSelect = document.createElement("select");
      TIERS.forEach((tier) => {
        const opt = document.createElement("option");
        opt.value = tier;
        opt.textContent = tier;
        if (tier === entry.tier) opt.selected = true;
        tierSelect.appendChild(opt);
      });
      tierSelect.addEventListener("change", () => { entry.tier = tierSelect.value; });

      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.className = "edit-row-text";
      textInput.value = entry.text;
      textInput.addEventListener("input", () => { entry.text = textInput.value; });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "edit-row-remove";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        const idx = todState.indexOf(entry);
        if (idx !== -1) todState.splice(idx, 1);
        renderTod();
      });

      row.appendChild(kindSelect);
      row.appendChild(tierSelect);
      row.appendChild(textInput);
      row.appendChild(removeBtn);
      todListEl.appendChild(row);
    });
  }

  fetch("truth-or-dare-data.csv?v=2")
    .then((res) => res.text())
    .then((text) => {
      const rows = parseCSV(text);
      rows.shift();
      todState = rows
        .filter(([kind, tier, prompt]) => kind && tier && prompt)
        .map(([kind, tier, prompt]) => ({ kind: kind.trim().toLowerCase(), tier: tier.trim(), text: prompt.trim() }));
      renderTod();
    })
    .catch(() => {
      todCountEl.textContent = "Couldn't load truth-or-dare-data.csv (open this page over http/https, not by double-clicking the file).";
    });

  document.getElementById("tod-add").addEventListener("click", () => {
    todState.push({ kind: "truth", tier: "Easy", text: "" });
    renderTod();
    todListEl.lastElementChild.scrollIntoView({ behavior: "smooth", block: "center" });
    todListEl.lastElementChild.querySelector("input").focus();
  });

  document.getElementById("tod-copy").addEventListener("click", () => {
    const rows = todState.map((e) => `${csvField(e.kind)},${csvField(e.tier)},${csvField(e.text)}`);
    copyToClipboard(["kind,tier,text"].concat(rows).join("\n") + "\n");
  });

  // ============================================================
  // DICE GAME
  // ============================================================
  // { Easy: { Action: [6 words], Location: [6 words] }, Medium: {...}, ... }
  let diceState = {};
  const diceGroupsEl = document.getElementById("dice-groups");

  function renderDice() {
    diceGroupsEl.innerHTML = "";
    TIERS.forEach((tier) => {
      const group = document.createElement("div");
      group.className = "dice-tier-group";

      const heading = document.createElement("p");
      heading.className = "dice-tier-heading";
      heading.textContent = tier;
      group.appendChild(heading);

      const columns = document.createElement("div");
      columns.className = "dice-die-columns";

      ["Action", "Location"].forEach((die) => {
        const column = document.createElement("div");

        const words = diceState[tier][die];
        const label = document.createElement("p");
        label.className = "dice-die-label";
        const countClass = words.length === 6 ? "ok" : "bad";
        label.innerHTML = `${die} <span class="dice-die-count ${countClass}">(${words.length}/6)</span>`;
        column.appendChild(label);

        const list = document.createElement("div");
        list.className = "edit-list";
        words.forEach((word, i) => {
          const row = document.createElement("div");
          row.className = "edit-row";
          const input = document.createElement("input");
          input.type = "text";
          input.className = "edit-row-text";
          input.value = word;
          input.addEventListener("input", () => { words[i] = input.value; });
          row.appendChild(input);
          list.appendChild(row);
        });
        column.appendChild(list);
        columns.appendChild(column);
      });

      group.appendChild(columns);
      diceGroupsEl.appendChild(group);
    });
  }

  fetch("dice-game-data.csv?v=2")
    .then((res) => res.text())
    .then((text) => {
      const rows = parseCSV(text);
      rows.shift();
      const byTier = {};
      TIERS.forEach((tier) => { byTier[tier] = { Action: [], Location: [] }; });
      rows.forEach(([die, tier, prompt]) => {
        if (!die || !tier || !prompt) return;
        const dieLower = die.trim().toLowerCase();
        const dieKey = dieLower === "action" ? "Action" : dieLower === "location" ? "Location" : null;
        const tierKey = TIERS.find((t) => t.toLowerCase() === tier.trim().toLowerCase());
        if (dieKey && tierKey) byTier[tierKey][dieKey].push(prompt.trim());
      });
      diceState = byTier;
      renderDice();
    })
    .catch(() => {
      diceGroupsEl.textContent = "Couldn't load dice-game-data.csv (open this page over http/https, not by double-clicking the file).";
    });

  document.getElementById("dice-copy").addEventListener("click", () => {
    const rows = [];
    TIERS.forEach((tier) => {
      ["Action", "Location"].forEach((die) => {
        diceState[tier][die].forEach((word) => {
          rows.push(`${csvField(die)},${csvField(tier)},${csvField(word)}`);
        });
      });
    });
    copyToClipboard(["die,tier,text"].concat(rows).join("\n") + "\n");
  });

  // ============================================================
  // TEASE / LICK / KISS / BITE
  // ============================================================
  // { Easy: [8 body parts], Medium: [...], ... }
  let tlkbState = {};
  const tlkbGroupsEl = document.getElementById("tlkb-groups");

  function renderTlkb() {
    tlkbGroupsEl.innerHTML = "";
    TIERS.forEach((tier) => {
      const group = document.createElement("div");
      group.className = "dice-tier-group";
      group.dataset.tier = tier;

      const heading = document.createElement("p");
      heading.className = "dice-tier-heading";
      heading.textContent = tier;
      group.appendChild(heading);

      const parts = tlkbState[tier];
      const label = document.createElement("p");
      label.className = "dice-die-label";
      const countClass = parts.length === 8 ? "ok" : "bad";
      label.innerHTML = `Body parts <span class="dice-die-count ${countClass}">(${parts.length}/8)</span>`;
      group.appendChild(label);

      const list = document.createElement("div");
      list.className = "edit-list";
      parts.forEach((part, i) => {
        const row = document.createElement("div");
        row.className = "edit-row";
        const input = document.createElement("input");
        input.type = "text";
        input.className = "edit-row-text";
        input.value = part;
        input.addEventListener("input", () => { parts[i] = input.value; });
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "edit-row-remove";
        removeBtn.textContent = "×";
        removeBtn.addEventListener("click", () => {
          parts.splice(i, 1);
          renderTlkb();
        });
        row.appendChild(input);
        row.appendChild(removeBtn);
        list.appendChild(row);
      });
      group.appendChild(list);

      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "edit-btn";
      addBtn.style.marginTop = "10px";
      addBtn.textContent = "+ Add body part";
      addBtn.addEventListener("click", () => {
        parts.push("");
        renderTlkb();
        const newGroup = tlkbGroupsEl.querySelector(`[data-tier="${tier}"]`);
        const lastInput = newGroup.querySelector(".edit-row:last-of-type .edit-row-text");
        lastInput.scrollIntoView({ behavior: "smooth", block: "center" });
        lastInput.focus();
      });
      group.appendChild(addBtn);

      tlkbGroupsEl.appendChild(group);
    });
  }

  fetch("tlkb-data.csv?v=1")
    .then((res) => res.text())
    .then((text) => {
      const rows = parseCSV(text);
      rows.shift();
      const byTier = {};
      TIERS.forEach((tier) => { byTier[tier] = []; });
      rows.forEach(([tier, prompt]) => {
        if (!tier || !prompt) return;
        const tierKey = TIERS.find((t) => t.toLowerCase() === tier.trim().toLowerCase());
        if (tierKey) byTier[tierKey].push(prompt.trim());
      });
      tlkbState = byTier;
      renderTlkb();
    })
    .catch(() => {
      tlkbGroupsEl.textContent = "Couldn't load tlkb-data.csv (open this page over http/https, not by double-clicking the file).";
    });

  document.getElementById("tlkb-copy").addEventListener("click", () => {
    const rows = [];
    TIERS.forEach((tier) => {
      tlkbState[tier].forEach((part) => {
        rows.push(`${csvField(tier)},${csvField(part)}`);
      });
    });
    copyToClipboard(["tier,text"].concat(rows).join("\n") + "\n");
  });

  // ============================================================
  // CARD MATCH
  // ============================================================
  let cardmatchState = [];
  const cardmatchListEl = document.getElementById("cardmatch-list");
  const cardmatchCountEl = document.getElementById("cardmatch-count");

  function renderCardmatch() {
    cardmatchCountEl.textContent = `${cardmatchState.length} cards total`;
    cardmatchListEl.innerHTML = "";
    cardmatchState.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "edit-row";

      const tierSelect = document.createElement("select");
      TIERS.forEach((tier) => {
        const opt = document.createElement("option");
        opt.value = tier;
        opt.textContent = tier;
        if (tier === entry.tier) opt.selected = true;
        tierSelect.appendChild(opt);
      });
      tierSelect.addEventListener("change", () => { entry.tier = tierSelect.value; });

      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.className = "edit-row-text";
      textInput.value = entry.text;
      textInput.addEventListener("input", () => { entry.text = textInput.value; });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "edit-row-remove";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        const idx = cardmatchState.indexOf(entry);
        if (idx !== -1) cardmatchState.splice(idx, 1);
        renderCardmatch();
      });

      row.appendChild(tierSelect);
      row.appendChild(textInput);
      row.appendChild(removeBtn);
      cardmatchListEl.appendChild(row);
    });
  }

  fetch("cardmatch-data.csv?v=1")
    .then((res) => res.text())
    .then((text) => {
      const rows = parseCSV(text);
      rows.shift();
      cardmatchState = rows
        .filter(([tier, prompt]) => tier && prompt)
        .map(([tier, prompt]) => ({ tier: tier.trim(), text: prompt.trim() }));
      renderCardmatch();
    })
    .catch(() => {
      cardmatchCountEl.textContent = "Couldn't load cardmatch-data.csv (open this page over http/https, not by double-clicking the file).";
    });

  document.getElementById("cardmatch-add").addEventListener("click", () => {
    cardmatchState.push({ tier: "Easy", text: "" });
    renderCardmatch();
    cardmatchListEl.lastElementChild.scrollIntoView({ behavior: "smooth", block: "center" });
    cardmatchListEl.lastElementChild.querySelector("input").focus();
  });

  document.getElementById("cardmatch-copy").addEventListener("click", () => {
    const rows = cardmatchState.map((e) => `${csvField(e.tier)},${csvField(e.text)}`);
    copyToClipboard(["tier,text"].concat(rows).join("\n") + "\n");
  });

  // ============================================================
  // COUPONS
  // ============================================================
  let couponsState = [];
  const couponsListEl = document.getElementById("coupons-list");
  const couponsCountEl = document.getElementById("coupons-count");

  function renderCoupons() {
    couponsCountEl.textContent = `${couponsState.length} coupons total`;
    couponsListEl.innerHTML = "";
    couponsState.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "edit-row";

      const serialInput = document.createElement("input");
      serialInput.type = "text";
      serialInput.placeholder = "Serial number";
      serialInput.style.minWidth = "140px";
      serialInput.value = entry.serial;
      serialInput.addEventListener("input", () => { entry.serial = serialInput.value; });

      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.className = "edit-row-text";
      textInput.placeholder = "What does it redeem?";
      textInput.value = entry.text;
      textInput.addEventListener("input", () => { entry.text = textInput.value; });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "edit-row-remove";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        const idx = couponsState.indexOf(entry);
        if (idx !== -1) couponsState.splice(idx, 1);
        renderCoupons();
      });

      row.appendChild(serialInput);
      row.appendChild(textInput);
      row.appendChild(removeBtn);
      couponsListEl.appendChild(row);
    });
  }

  fetch("coupons-data.csv?v=1")
    .then((res) => res.text())
    .then((text) => {
      const rows = parseCSV(text);
      rows.shift();
      couponsState = rows
        .filter(([serial, desc]) => serial && desc)
        .map(([serial, desc]) => ({ serial: serial.trim(), text: desc.trim() }));
      renderCoupons();
    })
    .catch(() => {
      couponsCountEl.textContent = "Couldn't load coupons-data.csv (open this page over http/https, not by double-clicking the file).";
    });

  document.getElementById("coupons-add").addEventListener("click", () => {
    couponsState.push({ serial: "", text: "" });
    renderCoupons();
    couponsListEl.lastElementChild.scrollIntoView({ behavior: "smooth", block: "center" });
    couponsListEl.lastElementChild.querySelector("input").focus();
  });

  document.getElementById("coupons-copy").addEventListener("click", () => {
    const rows = couponsState.map((e) => `${csvField(e.serial)},${csvField(e.text)}`);
    copyToClipboard(["serial,text"].concat(rows).join("\n") + "\n");
  });
})();
