// security-details.js
(async function () {
  const API_BASE = "https://edugate-9yl5.onrender.com/api";
  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders
  });

  const result = await response.json();
  const currentUser = result.data;

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
    let visit;

    try {
      const res = await fetch(`${API_BASE}/visits/${id}`, {
        headers: authHeaders
      });
      const json = await res.json();

      if (!res.ok || !json.data) {
        throw new Error("Not found");
      }

      visit = json.data;
    } catch (err) {
      detName.textContent = "Visitor not found";
      actionBtn.classList.add("hidden");
      return;
    }

    const visitorName = visit.visitor?.full_name || "—";
    const visitorPhone = visit.visitor?.phone || "—";
    const hostName =
      visit.assigned_host?.user?.name ||
      visit.requested_host?.user?.name ||
      "—";

    const color = VMS_SECURITY.colorFor(visit.visit_id);
    avatarHero.style.background = color;
    avatarHero.textContent = VMS_SECURITY.initials(visitorName);
    detName.textContent = visitorName;
    detPhone.textContent = visitorPhone;

    const status = (visit.status || "").toLowerCase();

const currentlyInside = status === "checked_in";
const checkedOut = status === "checked_out";

    const checkInTime = visit.entry_log?.check_in_time
      ? new Date(visit.entry_log.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "—";

    renderExtra([
      ["Host", hostName],
      ["Purpose", visit.purpose || "—"],
      ["Check-in time", checkInTime],
      ["Status", currentlyInside ? "Inside" : (checkedOut ? "Checked out" : "Expected")]
    ]);

    if (
  visit.status?.toLowerCase() === "expected" ||
  visit.status?.toLowerCase() === "checked_out"
) {
  actionBtn.classList.add("hidden");
} else if (currentlyInside) {
  actionBtn.textContent = "Check Out";
  actionBtn.classList.remove("btn-primary");
  actionBtn.classList.add("btn-orange");

  actionBtn.addEventListener("click", async () => {
    try {
      const res = await fetch(`${API_BASE}/visits/${visit.visit_id}/checkout`, {
        method: "PATCH",
        headers: authHeaders
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Checkout failed");

      VMS_SECURITY.toast(`${visitorName} checked out`, "success");
      setTimeout(() => VMS_SECURITY.goTo("security-dashboard.html"), 700);
    } catch (err) {
      VMS_SECURITY.toast(err.message, "error");
    }
  });
} else {
      actionBtn.classList.add("hidden");
    }

    return;
  }

  // ---- Guard profile view (default) ----
  const color = VMS_SECURITY.colorFor(currentUser.name);

  avatarHero.style.background = color;
  avatarHero.textContent = VMS_SECURITY.initials(currentUser.name);
  detName.textContent = currentUser.name;
  detPhone.textContent = currentUser.phone ?? "—";

  renderExtra([
    ["Email", currentUser.email],
    ["Role", currentUser.role.role_name]
  ]);

  actionBtn.textContent = "Sign Out";
  actionBtn.addEventListener("click", () => {
    VMS_SECURITY.toast("Signed out successfully", "success");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setTimeout(() => VMS_SECURITY.goTo("member-login.html"), 700);
  });
})();