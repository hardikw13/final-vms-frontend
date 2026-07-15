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
    { name: "Priya Sharma", category: "Parent Meeting — 09:14 AM", status: "inside" },
    { name: "Rajan Patel", category: "Job Interview — 09:47 AM", status: "inside" },
    { name: "Kavita Nair", category: "Guest Lecture — 10:02 AM", status: "checked-out" },
    { name: "Amit Singh", category: "Delivery — Amazon — 10:30 AM", status: "inside" }
  ],
  notifications: [
    { type: "success", text: "Rajan Patel has checked in for your Job Interview appointment", time: "09:47 AM" },
    { type: "success", text: "Amit Singh has checked in for Delivery — Amazon", time: "10:30 AM" },
    { type: "info", text: "Kavita Nair checked out after Guest Lecture", time: "10:48 AM" }
  ],
  signOutText: "Sign Out",
  signOutLink: "member-login.html"
};

async function loadData() {

  try {

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/hosts/dashboard", {

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
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const statusLabel = item.status === "inside" ? "Inside" : "Checked Out";
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
                Reassign
             </button>`
          : ""
      }

    </div>

  </div>
`;
  return el;
}

function renderNotification(item) {
  const el = document.createElement("div");
  el.className = "notification-item";
  el.innerHTML = `
    <div class="notif-icon ${item.type}">${NOTIF_ICONS[item.type] || NOTIF_ICONS.info}</div>
    <div class="notif-text">
      <p>${item.text}</p>
      <span class="notif-time">${item.time}</span>
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
  data.todaysVisitors.forEach((item, i) => todayList.appendChild(renderTodayCard(item, i)));

  const notificationsList = document.getElementById("notificationsList");
  data.notifications.forEach((item) => notificationsList.appendChild(renderNotification(item)));

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
  // ================================
// Reassign Modal
// ================================

const modal = document.getElementById("reassignModal");

const cancelBtn = document.getElementById("cancelReassign");
const confirmBtn = document.getElementById("confirmReassign");
const hostSelect = document.getElementById("hostSelect");
console.log("modal:", modal);
console.log("cancel:", cancelBtn);
console.log("confirm:", confirmBtn);
console.log("hostSelect:", hostSelect);
console.log("invite:", document.getElementById("inviteVisitorBtn"));


confirmBtn.addEventListener("click", async () => {

    if (!hostSelect.value) {

        alert("Please select a host.");

        return;

    }

    const response = await fetch(

        `http://localhost:5000/api/hosts/visits/${selectedVisitId}/reassign`,

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

    const btn = e.target.closest(".reassign-btn");

    if (!btn) return;

    selectedVisitId = btn.dataset.visit;

    

    hostSelect.innerHTML = `<option value="">Loading...</option>`;

    const res = await fetch(
        "http://localhost:5000/api/hosts/department-hosts",
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
