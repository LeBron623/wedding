(function () {
  "use strict";

  const nameInput = document.getElementById("nameInput");
  const suggestionsEl = document.getElementById("suggestions");
  const noMatchEl = document.getElementById("noMatch");
  const loadErrorEl = document.getElementById("loadError");
  const screenSearch = document.getElementById("screen-search");
  const screenResult = document.getElementById("screen-result");
  const backBtn = document.getElementById("backBtn");
  const guestNameEl = document.getElementById("guestName");
  const tableNumberEl = document.getElementById("tableNumber");
  const tablesLayer = document.getElementById("tables-layer");
  const pathLayer = document.getElementById("path-layer");
  const seatBtn = document.getElementById("seatToggleBtn");
  const seatConfirmed = document.getElementById("seatConfirmed");
  const seatTimeEl = document.getElementById("seatTime");
  const seatUndoBtn = document.getElementById("seatUndoBtn");

  let guests = [];
  let currentGuest = null;
  let activeIndex = -1;
  let currentMatches = [];

  function formatTime(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  function renderSeatStatus() {
    if (!currentGuest) return;
    if (currentGuest.seated) {
      seatBtn.classList.add("hidden");
      seatConfirmed.classList.remove("hidden");
      seatTimeEl.textContent = formatTime(currentGuest.seated_at);
    } else {
      seatBtn.classList.remove("hidden");
      seatConfirmed.classList.add("hidden");
    }
  }

  async function setSeated(seated) {
    if (!currentGuest) return;
    const seated_at = seated ? new Date().toISOString() : null;
    const { data, error } = await supabaseClient
      .from("guests")
      .update({ seated, seated_at })
      .eq("id", currentGuest.id)
      .select()
      .single();

    if (error) {
      alert("Erreur de connexion, réessayez.");
      return;
    }

    currentGuest = data;
    const idx = guests.findIndex((g) => g.id === data.id);
    if (idx !== -1) guests[idx] = data;
    renderSeatStatus();
  }

  function highlightMatch(name, query) {
    const idx = normalizeName(name).indexOf(query);
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

    currentMatches = guests.filter((g) => normalizeName(g.name).includes(query)).slice(0, 8);

    if (currentMatches.length === 0) {
      noMatchEl.classList.remove("hidden");
      return;
    }
    noMatchEl.classList.add("hidden");

    currentMatches.forEach((guest, i) => {
      const li = document.createElement("li");
      li.innerHTML =
        highlightMatch(guest.name, query) + (guest.seated ? ' <span class="seated-tag">✔ installé</span>' : "");
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
    currentGuest = guest;
    guestNameEl.textContent = guest.name;
    tableNumberEl.textContent = "Table " + guest.table_number;

    PlanRenderer.showTable(tablesLayer, pathLayer, guest.table_number);
    renderSeatStatus();

    screenSearch.classList.remove("active");
    screenResult.classList.add("active");

    suggestionsEl.innerHTML = "";
    nameInput.value = "";
  }

  nameInput.addEventListener("input", () => {
    renderSuggestions(normalizeName(nameInput.value));
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
    PlanRenderer.clearHighlight(tablesLayer, pathLayer);
    currentGuest = null;
    nameInput.value = "";
    noMatchEl.classList.add("hidden");
    nameInput.focus();
  });

  seatBtn.addEventListener("click", () => setSeated(true));
  seatUndoBtn.addEventListener("click", () => setSeated(false));

  async function loadGuests() {
    const { data, error } = await supabaseClient
      .from("guests")
      .select("id, name, table_number, seated, seated_at")
      .order("name");

    if (error) {
      loadErrorEl.classList.remove("hidden");
      return;
    }

    guests = data;
    nameInput.disabled = false;
    nameInput.placeholder = "Prénom de l'invité...";
    nameInput.focus();

    supabaseClient
      .channel("guests-changes-staff")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "guests" },
        (payload) => {
          const idx = guests.findIndex((g) => g.id === payload.new.id);
          if (idx !== -1) guests[idx] = payload.new;
          if (currentGuest && currentGuest.id === payload.new.id) {
            currentGuest = payload.new;
            renderSeatStatus();
          }
        }
      )
      .subscribe();
  }

  PlanRenderer.renderTables(tablesLayer);
  loadGuests();
})();
