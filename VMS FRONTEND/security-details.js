// security-details.js
(async function () {
  const state = await VMS_SECURITY.load();

  const id = VMS_SECURITY.qs("id");
  const mode = VMS_SECURITY.qs("mode");

  const avatarHero = document.getElementById("avatarHero");
  const detName = document.getElementById("detName");
  const detPhone = document.getElementById("detPhone");
  const extraGrid = document.getElementById("extraGrid");
  const actionBtn = document.getElementById("primaryActionBtn");
  const backLink = document.getElementById("backLink");

  function renderExtra(rows) {
    extraGrid.innerHTML = rows.map(([k, v]) => `<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join("");
  }

  if (mode === "visitor" && id) {
    // ---- Visitor detail view ----
    const visitor = VMS_SECURITY.findAnyById(id);

    if (!visitor) {
      detName.textContent = "Visitor not found";
      actionBtn.classList.add("hidden");
      return;
    }

    const color = VMS_SECURITY.colorFor(visitor.id);
    avatarHero.style.background = color;
    avatarHero.textContent = VMS_SECURITY.initials(visitor.name);
    detName.textContent = visitor.name;
    detPhone.textContent = visitor.phone || "—";

    const currentlyInside = state.inside.some((v) => v.id === visitor.id);

    renderExtra([
      ["Host", visitor.hostName || "—"],
      ["Purpose", visitor.purpose || "—"],
      ["Check-in time", visitor.checkInTime || "—"],
      ["Status", currentlyInside ? "Inside" : (visitor.checkOutTime ? "Checked out" : "Expected")]
    ]);

    if (currentlyInside) {
      actionBtn.textContent = "Check Out";
      actionBtn.classList.remove("btn-primary");
      actionBtn.classList.add("btn-orange");
      actionBtn.addEventListener("click", () => {
        const v = VMS_SECURITY.checkOut(visitor.id);
        if (v) VMS_SECURITY.toast(`${v.name} checked out`, "success");
        setTimeout(() => VMS_SECURITY.goTo("security-dashboard.html"), 700);
      });
    } else {
      actionBtn.classList.add("hidden");
    }

    return;
  }

  // ---- Guard profile view (default) ----
  const guard = state.guard || { name: "Security Guard", phone: "—" };
  const color = VMS_SECURITY.colorFor(guard.name);
  avatarHero.style.background = color;
  avatarHero.textContent = VMS_SECURITY.initials(guard.name);
  detName.textContent = guard.name;
  detPhone.textContent = guard.phone || "—";
  renderExtra([["Role", guard.role || "Security Guard"]]);

  actionBtn.textContent = "Sign Out";
  actionBtn.addEventListener("click", () => {
    VMS_SECURITY.toast("Signed out successfully", "success");
    setTimeout(() => VMS_SECURITY.goTo("member-login.html"), 700);
  });
})();