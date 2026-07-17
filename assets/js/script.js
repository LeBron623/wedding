(function () {
  "use strict";

  const nameInput = document.getElementById("nameInput");
  const suggestionsEl = document.getElementById("suggestions");
  const noMatchEl = document.getElementById("noMatch");
  const screenSearch = document.getElementById("screen-search");
  const screenResult = document.getElementById("screen-result");
  const backBtn = document.getElementById("backBtn");
  const guestNameEl = document.getElementById("guestName");
  const tableNumberEl = document.getElementById("tableNumber");
  const tableLabelEl = document.getElementById("tableLabel");
  const tablesLayer = document.getElementById("tables-layer");
  const pathLayer = document.getElementById("path-layer");

  const SVG_NS = "http://www.w3.org/2000/svg";

  function normalize(str) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function el(tag, attrs, text) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function tableRadius(t) {
    return t.shape === "circle" ? t.r : Math.max(t.w, t.h) / 2;
  }

  // ---------- Rendu du plan (tables) ----------
  function renderTables() {
    Object.keys(TABLES).forEach((num) => {
      const t = TABLES[num];
      const g = el("g", { class: "table-group", "data-table": num });

      if (t.shape === "circle") {
        g.appendChild(
          el("circle", {
            class: "table-shape",
            cx: t.x,
            cy: t.y,
            r: t.r,
          })
        );
      } else {
        g.appendChild(
          el("rect", {
            class: "table-shape",
            x: t.x - t.w / 2,
            y: t.y - t.h / 2,
            width: t.w,
            height: t.h,
            rx: 6,
          })
        );
      }

      g.appendChild(el("text", { class: "table-number", x: t.x, y: t.y + 6 }, num));

      tablesLayer.appendChild(g);
    });
  }

  function clearHighlight() {
    tablesLayer.querySelectorAll(".highlight").forEach((n) => n.classList.remove("highlight"));
    tablesLayer
      .querySelectorAll(".highlight-text")
      .forEach((n) => n.classList.remove("highlight-text"));
    pathLayer.innerHTML = "";
  }

  function highlightTable(num) {
    clearHighlight();
    const g = tablesLayer.querySelector('[data-table="' + num + '"]');
    if (!g) return;
    g.querySelector(".table-shape").classList.add("highlight");
    g.querySelectorAll("text").forEach((t) => t.classList.add("highlight-text"));
    g.parentNode.appendChild(g); // ramène la table au-dessus de tout
  }

  function nearestEntrance(table) {
    let best = ENTRANCES[0];
    let bestDist = Infinity;
    ENTRANCES.forEach((e) => {
      const d = Math.hypot(e.x - table.x, e.y - table.y);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    });
    return best;
  }

  function drawPath(num) {
    const t = TABLES[num];
    if (!t) return;
    const entrance = nearestEntrance(t);
    const ctrlX = (entrance.x + t.x) / 2;
    const ctrlY = 300;

    // Point d'arrivée juste à côté de la table (pas au centre) pour ne pas la recouvrir
    const dx = t.x - ctrlX;
    const dy = t.y - ctrlY;
    const dist = Math.hypot(dx, dy) || 1;
    const R = tableRadius(t) + 16;
    const endX = t.x - (dx / dist) * R;
    const endY = t.y - (dy / dist) * R;

    const d = `M ${entrance.x} ${entrance.y} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;

    pathLayer.appendChild(el("path", { class: "walk-path", d }));
    pathLayer.appendChild(
      el("circle", { class: "walk-marker", cx: entrance.x, cy: entrance.y, r: 6 })
    );
    pathLayer.appendChild(el("circle", { class: "walk-marker", cx: endX, cy: endY, r: 5 }));
  }

  // ---------- Recherche / autocomplétion ----------
  let activeIndex = -1;
  let currentMatches = [];

  function highlightMatch(name, query) {
    const idx = normalize(name).indexOf(query);
    if (idx === -1 || !query) return name;
    return (
      name.slice(0, idx) +
      "<mark>" +
      name.slice(idx, idx + query.length) +
      "</mark>" +
      name.slice(idx + query.length)
    );
  }

  function renderSuggestions(query) {
    suggestionsEl.innerHTML = "";
    activeIndex = -1;

    if (!query) {
      currentMatches = [];
      noMatchEl.classList.add("hidden");
      return;
    }

    currentMatches = GUESTS.filter((g) => normalize(g.name).includes(query)).slice(0, 8);

    if (currentMatches.length === 0) {
      noMatchEl.classList.remove("hidden");
      return;
    }
    noMatchEl.classList.add("hidden");

    currentMatches.forEach((guest, i) => {
      const li = document.createElement("li");
      li.innerHTML = highlightMatch(guest.name, query);
      li.dataset.index = i;
      li.addEventListener("click", () => selectGuest(guest));
      suggestionsEl.appendChild(li);
    });
  }

  function updateActiveItem() {
    Array.from(suggestionsEl.children).forEach((li, i) => {
      li.classList.toggle("active", i === activeIndex);
    });
  }

  function selectGuest(guest) {
    guestNameEl.textContent = guest.name;
    const t = TABLES[guest.table];
    tableNumberEl.textContent = "Table " + guest.table;
    tableLabelEl.textContent = t ? t.label : "";

    highlightTable(guest.table);
    drawPath(guest.table);

    screenSearch.classList.remove("active");
    screenResult.classList.add("active");

    suggestionsEl.innerHTML = "";
    nameInput.value = "";
  }

  nameInput.addEventListener("input", () => {
    renderSuggestions(normalize(nameInput.value));
  });

  nameInput.addEventListener("keydown", (e) => {
    if (currentMatches.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, currentMatches.length - 1);
      updateActiveItem();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      updateActiveItem();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const guest = currentMatches[activeIndex >= 0 ? activeIndex : 0];
      if (guest) selectGuest(guest);
    } else if (e.key === "Escape") {
      suggestionsEl.innerHTML = "";
      currentMatches = [];
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrap")) {
      suggestionsEl.innerHTML = "";
    }
  });

  backBtn.addEventListener("click", () => {
    screenResult.classList.remove("active");
    screenSearch.classList.add("active");
    clearHighlight();
    nameInput.value = "";
    noMatchEl.classList.add("hidden");
    nameInput.focus();
  });

  renderTables();
})();
