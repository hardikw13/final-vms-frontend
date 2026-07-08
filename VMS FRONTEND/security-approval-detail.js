// security-approval-detail.js
(async function () {
  await VMS_SECURITY.load();

  const body = document.getElementById("detailBody");
  const id = VMS_SECURITY.qs("id");
  const state = VMS_SECURITY.getState();
  const visitor = state.pending.find((p) => p.id === id);

  if (!visitor) {
    body.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
      <p>This request is no longer pending — it may already have been actioned.</p>
    </div>
    <a class="btn btn-outline" style="margin-top:16px;display:block;text-align:center;text-decoration:none;" href="security-pending-approvals.html">Back to pending list</a>`;
    return;
  }

  const color = VMS_SECURITY.colorFor(visitor.id);

  body.innerHTML = `
    <div class="detail-card">
      <div class="detail-avatar" style="background:${color}">${VMS_SECURITY.initials(visitor.name)}</div>
      <div class="detail-name">${visitor.name}</div>
      <div class="detail-purpose">${visitor.purpose || "Visit"}</div>

      <div class="detail-info">
        <div class="info-row"><span class="k">Phone</span><span class="v">${visitor.phone || "—"}</span></div>
        <div class="info-row"><span class="k">Host</span><span class="v">${visitor.hostName || "—"}</span></div>
        <div class="info-row"><span class="k">Requested at</span><span class="v">${visitor.requestedAt}</span></div>
        <div class="info-row"><span class="k">Type</span><span class="v" style="text-transform:capitalize;">${visitor.type || "visitor"}</span></div>
      </div>

      <div class="btn-row">
        <button class="btn btn-deny" id="denyBtn">Deny</button>
        <button class="btn btn-allow" id="allowBtn">Allow</button>
      </div>
    </div>
  `;

  document.getElementById("allowBtn").addEventListener("click", () => {
    const v = VMS_SECURITY.approvePending(visitor.id);
    if (v) VMS_SECURITY.toast(`${v.name} allowed in`, "success");
    setTimeout(() => VMS_SECURITY.goTo("security-dashboard.html"), 700);
  });

  document.getElementById("denyBtn").addEventListener("click", () => {
    const v = VMS_SECURITY.denyPending(visitor.id);
    if (v) VMS_SECURITY.toast(`${v.name} denied entry`, "error");
    setTimeout(() => VMS_SECURITY.goTo("security-pending-approvals.html"), 700);
  });
})();
