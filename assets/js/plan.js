const PlanRenderer = (function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, text) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function tableRadius(t) {
    return t.shape === "circle" ? t.r : Math.max(t.w, t.h) / 2;
  }

  function renderTables(tablesLayer) {
    Object.keys(TABLES).forEach((num) => {
      const t = TABLES[num];
      const g = el("g", { class: "table-group", "data-table": num });

      if (t.shape === "circle") {
        g.appendChild(el("circle", { class: "table-shape", cx: t.x, cy: t.y, r: t.r }));
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

  function clearHighlight(tablesLayer, pathLayer) {
    tablesLayer.querySelectorAll(".highlight").forEach((n) => n.classList.remove("highlight"));
    tablesLayer
      .querySelectorAll(".highlight-text")
      .forEach((n) => n.classList.remove("highlight-text"));
    pathLayer.innerHTML = "";
  }

  function highlightTable(tablesLayer, num) {
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

  function drawPath(pathLayer, num) {
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

  function showTable(tablesLayer, pathLayer, num) {
    clearHighlight(tablesLayer, pathLayer);
    highlightTable(tablesLayer, num);
    drawPath(pathLayer, num);
  }

  return { renderTables, clearHighlight, highlightTable, drawPath, showTable };
})();
