// security-approval-detail.js
(async function () {
  const API_BASE = "http://localhost:5000/api";

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login again.");
    window.location.href = "member-login.html";
    return;
  }

  const body = document.getElementById("detailBody");
  const id = VMS_SECURITY.qs("id");

  function formatRequestedAt(raw) {
    if (!raw) return "—";
    const d = new Date(raw);
    return isNaN(d) ? raw : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function showEmptyState() {
    body.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
      <p>This request is no longer pending — it may already have been actioned.</p>
    </div>
    <a class="btn btn-outline" style="margin-top:16px;display:block;text-align:center;text-decoration:none;" href="security-pending-approvals.html">Back to pending list</a>`;
  }

  // Fetch visit details from backend
  let visit;
  try {
    const res = await fetch(`${API_BASE}/visits/${id}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.status === 404) {
      showEmptyState();
      return;
    }

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || "Request failed.");
      showEmptyState();
      return;
    }

    visit = result.data;
  } catch (err) {
    console.error("Failed to load visit:", err);
    showEmptyState();
    return;
  }

  if (!visit) {
    showEmptyState();
    return;
  }

  const color = VMS_SECURITY.colorFor(visit.visit_id || visit.visitor_name);

  body.innerHTML = `
    <div class="detail-card">
      <div class="detail-avatar" style="background:${color}">${VMS_SECURITY.initials(visit.visitor_name)}</div>
      <div class="detail-name">${visit.visitor_name}</div>
      <div class="detail-purpose">${visit.purpose || "Visit"}</div>

      <div class="detail-info">
        <div class="info-row"><span class="k">Phone</span><span class="v">${visit.phone || "—"}</span></div>
        <div class="info-row"><span class="k">Host</span><span class="v">${visit.host_name || "—"}</span></div>
        <div class="info-row"><span class="k">Requested at</span><span class="v">${formatRequestedAt(visit.requested_at)}</span></div>
        <div class="info-row"><span class="k">Type</span><span class="v" style="text-transform:capitalize;">${visit.type || "visitor"}</span></div>
      </div>

      <div class="btn-row">
        <button class="btn btn-deny" id="denyBtn">Deny</button>
        <button class="btn btn-allow" id="allowBtn">Allow</button>
      </div>
    </div>
  `;

  document.getElementById("allowBtn").addEventListener("click", async () => {
    const allowBtn = document.getElementById("allowBtn");
    allowBtn.disabled = true;
    allowBtn.textContent = "Approving...";

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

      VMS_SECURITY.toast("Visitor approved.", "success");
      setTimeout(() => VMS_SECURITY.goTo("security-dashboard.html"), 700);
    } catch (err) {
      console.error("Failed to approve visit:", err);
      alert("Unable to connect to the server. Please check your connection and try again.");
    } finally {
      if (allowBtn.isConnected) {
        allowBtn.disabled = false;
        allowBtn.textContent = "Allow";
      }
    }
  });

  document.getElementById("denyBtn").addEventListener("click", async () => {
    const denyBtn = document.getElementById("denyBtn");
    denyBtn.disabled = true;
    denyBtn.textContent = "Rejecting...";

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

      VMS_SECURITY.toast("Visitor rejected.", "error");
      setTimeout(() => VMS_SECURITY.goTo("security-pending-approvals.html"), 700);
    } catch (err) {
      console.error("Failed to reject visit:", err);
      alert("Unable to connect to the server. Please check your connection and try again.");
    } finally {
      if (denyBtn.isConnected) {
        denyBtn.disabled = false;
        denyBtn.textContent = "Deny";
      }
    }
  });
})();
