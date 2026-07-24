const STAT_ICONS = {
  visitors: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  approved: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
};

const NOTIF_ICONS = {
  success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  pending: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
};

const AVATAR_COLORS = ["#3346e8", "#e0433d", "#1c8a4c", "#b9790f", "#7c4fd6", "#0891b2"];
let dashboardData = null;
let selectedVisitId = null;

const FALLBACK_DATA = {
  brand: { title: "Host Dashboard", rolePill: "Host" },
  hostSubtitle: "Dr. Anjali Mehta, Dept. of CS",
  stats: [
    { key: "visitors", label: "Today's Visitors", value: 4, color: "blue" },
    { key: "approved", label: "Approved Today", value: 3, color: "green" }
  ],
  tabs: {
    today: "Today's Visitors",
    notifications: "Notifications"
  },
  todaysVisitors: [
    { name: "Priya Sharma", category: "Parent Meeting", status: "inside" },
    { name: "Rajan Patel", category: "Job Interview", status: "inside" },
    { name: "Kavita Nair", category: "Guest Lecture", status: "checked-out" },
    { name: "Amit Singh", category: "Delivery — Amazon", status: "inside" }
  ],
  notifications: [
    { notificationId: 1, visitId: 1, type: "success", text: "You created a visit for Rajan Patel", time: "09:47 AM" },
    { notificationId: 2, visitId: 2, type: "success", text: "You created a visit for Amit Singh", time: "10:30 AM" }
  ],
  signOutText: "Sign Out",
  signOutLink: "member-login.html"
};

async function loadData() {

  try {

    const token = localStorage.getItem("token");

    const res = await fetch("https://edugate-9yl5.onrender.com/api/hosts/dashboard", {

      method: "GET",

      headers: {

        "Content-Type": "application/json",

        "Authorization": `Bearer ${token}`

      }

    });

    if (!res.ok) {

      throw new Error("Failed to fetch dashboard");

    }

    const result = await res.json();
    console.log("Dashboard API Status:", res.status);
console.log("Dashboard API Response:", result);

    return result.data;

  }

  catch (err) {

    console.error(err);

    return FALLBACK_DATA;

  }

}
function initials(name) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function renderStatCard(stat) {
  const colorMap = {
    amber: { bg: "var(--amber-bg)", fg: "var(--amber-fg)" },
    blue: { bg: "var(--blue-bg)", fg: "var(--brand-blue)" },
    green: { bg: "var(--green-bg)", fg: "var(--green-fg)" }
  };
  const c = colorMap[stat.color] || colorMap.blue;
  const el = document.createElement("div");
  el.className = "stat-card";
  el.innerHTML = `
    <div class="stat-icon" style="background:${c.bg}; color:${c.fg}">${STAT_ICONS[stat.key] || ""}</div>
    <span class="stat-value">${stat.value}</span>
    <span class="stat-label">${stat.label}</span>
  `;
  return el;
}

function renderTodayCard(item, index) {
  const el = document.createElement("div");
  el.className = "visitor-card";
  el.dataset.visit = item.visitId;
  el.style.cursor = "pointer";
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
 const statusLabel = item.status === "inside"
    ? "Inside"
    : item.status === "checked-out"
    ? "Checked Out"
    : "Expected";
  el.innerHTML = `
  <div class="visitor-top">

    <div class="avatar" style="background:${color}">
      ${initials(item.name)}
    </div>

    <div class="visitor-info">

      <div class="visitor-name-row">

        <span class="visitor-name">${item.name}</span>

        <span class="status-badge ${item.status}">
          ${statusLabel}
        </span>

      </div>

      <p class="visitor-meta">${item.category}</p>

      ${
        dashboardData?.permissions?.canReassign
          ? `<button class="reassign-btn" data-visit="${item.visitId}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                Reassign
             </button>`
          : ""
      }

    </div>

  </div>
`;
  return el;
}
function renderDeliveryCard(item, index) {
  const el = document.createElement("div");
  el.className = "visitor-card";
  el.dataset.visit = item.visitId;
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  el.innerHTML = `
  <div class="visitor-top">

    <div class="avatar" style="background:${color}">
      ${initials(item.courierName)}
    </div>

    <div class="visitor-info">

      <div class="visitor-name-row">
        <span class="visitor-name">${item.courierName}</span>
      </div>

      <p class="visitor-meta">For: ${item.recipientName} · Tracking: ${item.trackingNumber}</p>
      <p class="visitor-meta">Arrived ${item.arrivedTime}</p>

      <button class="reassign-btn receive-btn" data-visit="${item.visitId}">
        Package Received
      </button>

    </div>

  </div>
`;
  return el;
}

function renderNotification(item) {
  const el = document.createElement("div");
  el.className = "notification-item";
  el.dataset.notification = item.notificationId;
  el.innerHTML = `
    <div class="notif-icon ${item.type}">${NOTIF_ICONS[item.type] || NOTIF_ICONS.info}</div>
    <div class="notif-text">
      <p>${item.text}</p>
      <span class="notif-time">${item.time}</span>
      <div class="notif-actions">
        <button class="notif-mark-read" data-notification="${item.notificationId}">Mark as Read</button>
      </div>
    </div>
  `;
  return el;
}

(async function init() {
  const data = await loadData();
  dashboardData = data;

  document.getElementById("brandTitle").textContent = data.brand.title;
  document.getElementById("rolePill").textContent = data.brand.rolePill;
  document.getElementById("hostSubtitle").textContent = data.hostSubtitle;
  document.getElementById("tabTodayLabel").textContent = data.tabs.today;
  document.getElementById("tabNotificationsLabel").textContent = data.tabs.notifications;
  document.getElementById("signOutText").textContent = data.signOutText;

  const statsRow = document.getElementById("statsRow");
  data.stats.forEach((stat) => statsRow.appendChild(renderStatCard(stat)));

  const todayList = document.getElementById("todayList");

  if (data.permissions?.isDeliveryHost) {
    (data.deliveries || []).forEach((item, i) => todayList.appendChild(renderDeliveryCard(item, i)));
  } else {
    data.todaysVisitors.forEach((item, i) => todayList.appendChild(renderTodayCard(item, i)));
  }

  const notificationsList = document.getElementById("notificationsList");
  data.notifications.forEach((item) => notificationsList.appendChild(renderNotification(item)));

  // this added
  const notificationDot = document.getElementById("notificationDot");

if (data.notifications && data.notifications.length > 0) {
    notificationDot.classList.add("show");
} else {
    notificationDot.classList.remove("show");
}

  // ---- Tab switching ----
  document.getElementById("tabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    document.getElementById(
      btn.dataset.tab === "today" ? "panelToday" : "panelNotifications"
    ).classList.add("active");
  });

  // ---- Card click → open visit details (but not when clicking Reassign) ----
  document.getElementById("todayList").addEventListener("click", (e) => {

    if (e.target.closest(".reassign-btn")) return;

    const card = e.target.closest(".visitor-card");
    if (!card) return;

    window.location.href = `visit-details.html?visit_id=${card.dataset.visit}`;

  });

  // ---- Notification actions: See Details / Mark as Read (permanent delete) ----
  document.getElementById("notificationsList").addEventListener("click", async (e) => {

    const seeBtn = e.target.closest(".notif-see-details");
    if (seeBtn) {
        window.location.href = `visit-details.html?visit_id=${seeBtn.dataset.visit}`;
        return;
    }

    const readBtn = e.target.closest(".notif-mark-read");
    if (readBtn) {

        const notificationId = readBtn.dataset.notification;

        try {

            const res = await fetch(`https://edugate-9yl5.onrender.com/api/notifications/${notificationId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (!res.ok) {
                const result = await res.json();
                console.error("Failed to delete notification:", result.message);
                alert(result.message || "Could not remove notification.");
                return;
            }

        } catch (err) {
            console.error("Error deleting notification:", err);
            return;
        }

        const item = readBtn.closest(".notification-item");
        item.remove();
        // this added
        if (notificationsList.children.length === 0) {
    notificationDot.classList.remove("show");
}

    }

  });

  // ================================
  // Reassign Modal
  // ================================

  const modal = document.getElementById("reassignModal");

  const cancelBtn = document.getElementById("cancelReassign");
  const confirmBtn = document.getElementById("confirmReassign");
  const hostSelect = document.getElementById("hostSelect");

  confirmBtn.addEventListener("click", async () => {

    if (!hostSelect.value) {

        alert("Please select a host.");

        return;

    }

    const response = await fetch(

        `https://edugate-9yl5.onrender.com/api/hosts/visits/${selectedVisitId}/reassign`,

        {

            method: "PATCH",

            headers: {

                "Content-Type": "application/json",

                "Authorization": `Bearer ${localStorage.getItem("token")}`

            },

            body: JSON.stringify({

                newHostId: hostSelect.value

            })

        }

    );

    const result = await response.json();

    if(result.success){

        alert("Visit reassigned successfully.");

        modal.classList.add("hidden");

        location.reload();

    }

    else{

        alert(result.message);

    }

  });

  document.addEventListener("click", async (e) => {

    const receiveBtn = e.target.closest(".receive-btn");
    if (receiveBtn) {

      receiveBtn.disabled = true;

      try {
        const res = await fetch(
          `https://edugate-9yl5.onrender.com/api/hosts/deliveries/${receiveBtn.dataset.visit}/receive`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        const result = await res.json();

        if (!res.ok) {
          alert(result.message || "Failed to mark as received.");
          receiveBtn.disabled = false;
          return;
        }

        receiveBtn.closest(".visitor-card").remove();

      } catch (err) {
        alert("Something went wrong.");
        receiveBtn.disabled = false;
      }

      return;
    }

    const btn = e.target.closest(".reassign-btn");

    if (!btn) return;

    selectedVisitId = btn.dataset.visit;

    hostSelect.innerHTML = `<option value="">Loading...</option>`;

    const res = await fetch(
        "https://edugate-9yl5.onrender.com/api/hosts/department-hosts",
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        }
    );

    const result = await res.json();

    if (!res.ok) {
        alert(result.message || "Failed to load hosts.");
        return;
    }

    hostSelect.innerHTML = "";

    result.data.forEach((host) => {
        const option = document.createElement("option");
        option.value = host.host_id;
        option.textContent = host.user.name;
        hostSelect.appendChild(option);
    });

    modal.classList.remove("hidden");

  });

  // Close modal
  cancelBtn.addEventListener("click", () => {

    modal.classList.add("hidden");

  });

  document.getElementById("inviteVisitorBtn").addEventListener("click", () => {

    window.location.href = "create-visit.html";

  });

  document.getElementById("signOutBtn").addEventListener("click", () => {
    window.location.href = data.signOutLink;
  });
})();