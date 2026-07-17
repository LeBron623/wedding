(function () {
  "use strict";

  const listEl = document.getElementById("guestList");
  const counterEl = document.getElementById("counter");
  const filterInput = document.getElementById("filterInput");
  const emptyMsg = document.getElementById("emptyMsg");

  let guests = [];
  let filter = "";

  function render() {
    const q = normalizeName(filter);
    const filtered = guests.filter(
      (g) => !q || normalizeName(g.name).includes(q) || g.table_number.includes(q)
    );

    const seatedCount = guests.filter((g) => g.seated).length;
    counterEl.textContent = seatedCount + " / " + guests.length + " installés";

    listEl.innerHTML = "";
    filtered.forEach((g) => {
      const li = document.createElement("li");
      li.className = "guest-row" + (g.seated ? " seated" : "");

      const name = document.createElement("span");
      name.className = "guest-row-name";
      name.textContent = g.name;

      const table = document.createElement("span");
      table.className = "guest-row-table";
      table.textContent = "Table " + g.table_number;

      const btn = document.createElement("button");
      btn.className = "guest-row-toggle";
      btn.textContent = g.seated ? "✔ Installé" : "Marquer";
      btn.addEventListener("click", () => toggleSeated(g));

      li.appendChild(name);
      li.appendChild(table);
      li.appendChild(btn);
      listEl.appendChild(li);
    });

    emptyMsg.classList.toggle("hidden", filtered.length !== 0);
  }

  async function toggleSeated(guest) {
    const seated = !guest.seated;
    const seated_at = seated ? new Date().toISOString() : null;
    const { data, error } = await supabaseClient
      .from("guests")
      .update({ seated, seated_at })
      .eq("id", guest.id)
      .select()
      .single();

    if (error) {
      alert("Erreur de connexion, réessayez.");
      return;
    }

    const idx = guests.findIndex((g) => g.id === data.id);
    if (idx !== -1) guests[idx] = data;
    render();
  }

  filterInput.addEventListener("input", () => {
    filter = filterInput.value;
    render();
  });

  function sortGuests(list) {
    return list.slice().sort((a, b) => {
      const t = Number(a.table_number) - Number(b.table_number);
      return t !== 0 ? t : a.name.localeCompare(b.name, "fr");
    });
  }

  async function load() {
    const { data, error } = await supabaseClient
      .from("guests")
      .select("id, name, table_number, seated, seated_at");

    if (error) {
      counterEl.textContent = "Impossible de charger la liste.";
      return;
    }

    guests = sortGuests(data);
    render();

    supabaseClient
      .channel("guests-changes-list")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "guests" },
        (payload) => {
          const idx = guests.findIndex((g) => g.id === payload.new.id);
          if (idx !== -1) guests[idx] = payload.new;
          render();
        }
      )
      .subscribe();
  }

  load();
})();
