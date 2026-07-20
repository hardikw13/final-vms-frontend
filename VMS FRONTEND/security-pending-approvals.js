// security-pending-approvals.js
(async function () {
  await VMS_SECURITY.load();

  const listEl = document.getElementById("pendingList");
  const headerCount = document.getElementById("headerCount");

  function renderAvatar(name, id) {
    const color = VMS_SECURITY.colorFor(id || name);
    return `<div class="avatar" style="background:${color}">${VMS_SECURITY.initials(name)}</div>`;
  }

  function render() {
    const state = VMS_SECURITY.getState();
    headerCount.textContent = state.pending.length;

    if (state.pending.length === 0) {
      listEl.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
        <p>No pending approvals right now.</p>
      </div>`;
      return;
    }

    listEl.innerHTML = state.pending.map((p) => `
      <div class="pending-card" data-id="${p.id}">
        <div class="top-row">
          ${renderAvatar(p.name, p.id)}
          <div class="row-body">
            <div class="row-name">${p.name}</div>
            <div class="row-sub">${p.purpose || "Visit"} · Host: <b>${p.hostName || "—"}</b></div>
            <div class="row-sub">Requested at ${p.requestedAt}</div>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn btn-deny" data-action="deny" data-id="${p.id}">Deny</button>
          <button class="btn btn-allow" data-action="allow" data-id="${p.id}">Allow</button>
        </div>
      </div>
    `).join("");
  }

  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) {
      const card = e.target.closest(".pending-card");
      if (card) VMS_SECURITY.goTo(`security-approval-detail.html?id=${encodeURIComponent(card.dataset.id)}`);
      return;
    }
    const id = btn.dataset.id;
    if (btn.dataset.action === "allow") {
      const v = VMS_SECURITY.approvePending(id);
      if (v) VMS_SECURITY.toast(`${v.name} allowed in`, "success");
    } else {
      const v = VMS_SECURITY.denyPending(id);
      if (v) VMS_SECURITY.toast(`${v.name} denied entry`, "error");
    }
    render();
  });

  render();
})();
