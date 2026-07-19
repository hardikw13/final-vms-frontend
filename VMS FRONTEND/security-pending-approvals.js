// security-pending-approvals.js
(async function () {
  const API_BASE = "http://localhost:5000/api";

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login again.");
    window.location.href = "member-login.html";
    return;
  }

  const listEl = document.getElementById("pendingList");
  const headerCount = document.getElementById("headerCount");

  // Keeps a local copy so we can remove cards without refetching
  let pendingVisits = [];

  function renderAvatar(name, id) {
    const color = VMS_SECURITY.colorFor(id || name);
    return `<div class="avatar" style="background:${color}">${VMS_SECURITY.initials(name)}</div>`;
  }

  function formatRequestedAt(raw) {
    if (!raw) return "—";
    const d = new Date(raw);
    return isNaN(d) ? raw : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function render() {
    headerCount.textContent = pendingVisits.length;

    if (pendingVisits.length === 0) {
      listEl.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
        <p>No pending approvals right now.</p>
      </div>`;
      return;
    }

    listEl.innerHTML = pendingVisits.map((v) => `
      <div class="pending-card" data-id="${v.visit_id}">
        <div class="top-row">
          ${renderAvatar(v.visitor_name, v.visit_id)}
          <div class="row-body">
            <div class="row-name">${v.visitor_name}</div>
            <div class="row-sub">${v.purpose || "Visit"} · Host: <b>${v.host_name || "—"}</b></div>
            <div class="row-sub">Requested at ${formatRequestedAt(v.requested_at)}</div>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn btn-deny" data-action="deny" data-id="${v.visit_id}">Deny</button>
          <button class="btn btn-allow" data-action="allow" data-id="${v.visit_id}">Allow</button>
        </div>
      </div>
    `).join("");
  }

  async function loadPending() {
    try {
      const res = await fetch(`${API_BASE}/visits/pending`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Request failed.");
        return;
      }

      pendingVisits = result.data;
      render();
    } catch (err) {
      console.error("Failed to load pending visits:", err);
      alert("Unable to connect to the server. Please check your connection and try again.");
    }
  }

  async function approveVisit(id, btn) {
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Approving...";

    try {
      const res = await fetch(`${API_BASE}/visits/${id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Request failed.");
        return;
      }

      pendingVisits = pendingVisits.filter((v) => v.visit_id !== id);
      render();
      VMS_SECURITY.toast("Visitor approved.", "success");
    } catch (err) {
      console.error("Failed to approve visit:", err);
      alert("Unable to connect to the server. Please check your connection and try again.");
    } finally {
      if (btn.isConnected) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }
  }

  async function rejectVisit(id, btn) {
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Rejecting...";

    try {
      const res = await fetch(`${API_BASE}/visits/${id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Request failed.");
        return;
      }

      pendingVisits = pendingVisits.filter((v) => v.visit_id !== id);
      render();
      VMS_SECURITY.toast("Visitor rejected.", "error");
    } catch (err) {
      console.error("Failed to reject visit:", err);
      alert("Unable to connect to the server. Please check your connection and try again.");
    } finally {
      if (btn.isConnected) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }
  }

  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");

    if (!btn) {
      const card = e.target.closest(".pending-card");
      if (card) {
        VMS_SECURITY.goTo(
          `security-approval-detail.html?id=${encodeURIComponent(card.dataset.id)}`
        );
      }
      return;
    }

    const id = Number(btn.dataset.id);

    if (btn.dataset.action === "allow") {
      approveVisit(id, btn);
    } else {
      rejectVisit(id, btn);
    }
  });

  await loadPending();
})();
