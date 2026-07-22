(function () {
  const API_BASE = "https://edugate-9yl5.onrender.com/api";
  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  let currentUser = null;
  let dashboardState = { inside: [], expected: [], checkedOut: [] };
  let stats = { totalVisitors: 0, inside: 0, expected: 0 };

  let activeTab = "inside";
  let searchTerm = "";

  const els = {
    profileBtn: document.getElementById("profileBtn"),
    statPending: document.getElementById("statPending"),
    statInside: document.getElementById("statInside"),
    statExpected: document.getElementById("statExpected"),
    listTitle: document.getElementById("listTitle"),
    listCount: document.getElementById("listCount"),
    listContainer: document.getElementById("listContainer"),
    searchInput: document.getElementById("searchInput"),
  };

  async function fetchJSON(path) {
    const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Request failed");
    return json.data;
  }

  async function loadCurrentUser() {
    currentUser = await fetchJSON("/auth/me");
  }

  async function loadDashboard() {
    const [insideData, expectedData, checkedOutData, statsData] = await Promise.all([
      fetchJSON("/visits/dashboard/inside"),
      fetchJSON("/visits/dashboard/expected"),
      fetchJSON("/visits/dashboard/checked-out"),
      fetchJSON("/visits/dashboard/stats"),
    ]);

    dashboardState = {
      inside: insideData,
      expected: expectedData,
      checkedOut: checkedOutData
    };
    stats = statsData;
  }

  function renderAvatar(name, id) {
    const color = VMS_SECURITY.colorFor(id || name);
    return `<div class="avatar" style="background:${color}">${VMS_SECURITY.initials(name)}</div>`;
  }

  function updateProfile() {
    if (!currentUser) return;
    const initials = currentUser.name
      .split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
    els.profileBtn.textContent = initials;
    els.profileBtn.title = currentUser.name;
  }

  function emptyState(label) {
    return `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
      <p>${label}</p>
    </div>`;
  }

  function matchesSearch(item) {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (item.name || "").toLowerCase().includes(s) || (item.hostName || "").toLowerCase().includes(s);
  }

  function renderList() {
    let items = [], title = "", emptyLabel = "";

    if (activeTab === "inside") {
      items = dashboardState.inside;
      title = "Currently Inside";
      emptyLabel = "No visitors are currently inside.";
    } else if (activeTab === "expected") {
      items = dashboardState.expected;
      title = "Expected Today";
      emptyLabel = "No visitors expected today.";
    } else {
      items = dashboardState.checkedOut;
      title = "Checked Out";
      emptyLabel = "No one has checked out yet.";
    }

    const filtered = items.filter(matchesSearch);
    els.listTitle.textContent = title;
    els.listCount.textContent = filtered.length;

    if (filtered.length === 0) {
      els.listContainer.innerHTML = emptyState(emptyLabel);
      return;
    }

    els.listContainer.innerHTML = filtered.map((item) => {
      let sub = "", actions = "";

      if (activeTab === "inside") {
        sub = `Host: <b>${item.hostName || "—"}</b> · In ${item.checkInTime || "—"}`;
        actions = `<button class="btn btn-sm btn-outline" data-action="checkout" data-id="${item.id}">Check Out</button>`;
      } else if (activeTab === "expected") {
        sub = `Host: <b>${item.hostName || "—"}</b> · Expected ${item.expectedTime || "—"}`;
      } else {
        sub = `Out at ${item.checkOutTime || "—"} · In was ${item.checkInTime || "—"}`;
      }

      return `<div class="list-row" data-row-id="${item.id}">
        ${renderAvatar(item.name, item.id)}
        <div class="row-body">
          <div class="row-name">${item.name}</div>
          <div class="row-sub">${sub}</div>
        </div>
        <div class="row-actions">${actions}</div>
      </div>`;
    }).join("");
  }

  function renderStats() {
    els.statPending.textContent = stats.totalVisitors;
    els.statInside.textContent = stats.inside;
    els.statExpected.textContent = stats.expected;
  }

  async function refreshAll() {
    await loadDashboard();
    updateProfile();
    renderStats();
    renderList();
  }

  async function handleCheckout(visitId, btn) {
    btn.disabled = true;
    try {
      const res = await fetch(`${API_BASE}/visits/${visitId}/checkout`, {
        method: "PATCH",
        headers: authHeaders
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Checkout failed");

      VMS_SECURITY.toast("Visitor checked out", "success");
      await refreshAll();
    } catch (err) {
      VMS_SECURITY.toast(err.message, "error");
      btn.disabled = false;
    }
  }

  document.getElementById("scanQrBtn").addEventListener("click",() => VMS_SECURITY.goTo("pre-approved-scan.html?mode=register"));
  document.getElementById("registerBtn").addEventListener("click", () => VMS_SECURITY.goTo("security-register.html"));
  document.getElementById("profileBtn").addEventListener("click", () => VMS_SECURITY.goTo("security-details.html"));

  document.querySelectorAll(".stat-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const target = pill.getAttribute("data-goto");
      if (target === "total") return;
      activeTab = target;
      document.querySelectorAll(".tab-btn").forEach((t) => t.classList.toggle("active", t.dataset.tab === target));
      renderList();
    });
  });

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach((t) => t.classList.toggle("active", t === btn));
      renderList();
    });
  });

  els.searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderList();
  });

  els.listContainer.addEventListener("click", (e) => {
    const actionBtn = e.target.closest("[data-action]");
    if (actionBtn) {
      e.stopPropagation();
      if (actionBtn.dataset.action === "checkout") {
        handleCheckout(actionBtn.dataset.id, actionBtn);
      }
      return;
    }
    const row = e.target.closest(".list-row");
    if (row) {
      VMS_SECURITY.goTo(`security-details.html?id=${encodeURIComponent(row.dataset.rowId)}&mode=visitor`);
    }
  });

  (async function init() {
    try {
      await loadCurrentUser();
      await refreshAll();
    } catch (err) {
      console.error("Dashboard init failed:", err);
      VMS_SECURITY.toast("Failed to load dashboard", "error");
    }
  })();

})();