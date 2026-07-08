// security-dashboard.js
(async function () {
  const state0 = await VMS_SECURITY.load();

  let activeTab = "inside";
  let searchTerm = "";

  const els = {
    statPending: document.getElementById("statPending"),
    statInside: document.getElementById("statInside"),
    statExpected: document.getElementById("statExpected"),
    pendingLabel: document.getElementById("pendingLabel"),
    listTitle: document.getElementById("listTitle"),
    listCount: document.getElementById("listCount"),
    listContainer: document.getElementById("listContainer"),
    searchInput: document.getElementById("searchInput"),
  };

  function renderAvatar(name, id) {
    const color = VMS_SECURITY.colorFor(id || name);
    return `<div class="avatar" style="background:${color}">${VMS_SECURITY.initials(name)}</div>`;
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
    const state = VMS_SECURITY.getState();
    let items = [];
    let title = "";
    let emptyLabel = "";

    if (activeTab === "inside") {
      items = state.inside;
      title = "Currently Inside";
      emptyLabel = "No visitors are currently inside.";
    } else if (activeTab === "expected") {
      items = state.expected;
      title = "Expected Today";
      emptyLabel = "No visitors expected today.";
    } else {
      items = state.checkedOut;
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
      let sub = "";
      let actions = "";

      if (activeTab === "inside") {
        sub = `Host: <b>${item.hostName || "—"}</b> · In ${item.checkInTime}`;
        actions = `<button class="btn btn-sm btn-outline" data-action="checkout" data-id="${item.id}">Check Out</button>`;
      } else if (activeTab === "expected") {
        sub = `Host: <b>${item.hostName || "—"}</b> · Expected ${item.expectedTime}`;
        actions = `<button class="btn btn-sm btn-primary" data-action="checkin-expected" data-id="${item.id}">Check In</button>`;
      } else {
        sub = `Out at ${item.checkOutTime} · In was ${item.checkInTime || "—"}`;
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
    const state = VMS_SECURITY.getState();
    els.statPending.textContent = state.pending.length;
    els.statInside.textContent = state.inside.length;
    els.statExpected.textContent = state.expected.length;

    if (state.pending.length > 0) {
      els.pendingLabel.innerHTML = `Pending approval <span class="pending-badge" style="position:static;border:none;margin-left:4px;">${state.pending.length}</span>`;
    } else {
      els.pendingLabel.textContent = "Pending approval";
    }
  }

  function renderAll() {
    renderStats();
    renderList();
  }

  // ---- Wire up static buttons ----
  document.getElementById("scanQrBtn").addEventListener("click", () => VMS_SECURITY.goTo("pre-approved-scan.html"));
  document.getElementById("checkInBtn").addEventListener("click", () => VMS_SECURITY.goTo("security-checkin.html"));
  document.getElementById("registerBtn").addEventListener("click", () => VMS_SECURITY.goTo("security-register.html"));
  document.getElementById("pendingBtn").addEventListener("click", () => VMS_SECURITY.goTo("security-pending-approvals.html"));
  document.getElementById("profileBtn").addEventListener("click", () => VMS_SECURITY.goTo("security-details.html"));

  document.querySelectorAll(".stat-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const target = pill.getAttribute("data-goto");
      if (target === "pending") return VMS_SECURITY.goTo("security-pending-approvals.html");
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

  // ---- Row interactions (event delegation) ----
  els.listContainer.addEventListener("click", (e) => {
    const actionBtn = e.target.closest("[data-action]");
    if (actionBtn) {
      e.stopPropagation();
      const id = actionBtn.dataset.id;
      const action = actionBtn.dataset.action;
      if (action === "checkout") {
        const v = VMS_SECURITY.checkOut(id);
        if (v) VMS_SECURITY.toast(`${v.name} checked out`, "success");
      } else if (action === "checkin-expected") {
        const v = VMS_SECURITY.checkInFromExpected(id);
        if (v) VMS_SECURITY.toast(`${v.name} checked in`, "success");
      }
      renderAll();
      return;
    }
    const row = e.target.closest(".list-row");
    if (row) {
      VMS_SECURITY.goTo(`security-details.html?id=${encodeURIComponent(row.dataset.rowId)}&mode=visitor`);
    }
  });

  renderAll();
})();
