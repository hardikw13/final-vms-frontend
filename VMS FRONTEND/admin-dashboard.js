// admin-dashboard.js
// Loads admin-dashboard-data.json and renders the Admin Dashboard overview page.

const ICONS = {
  users: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-3.3 0-9 1.66-9 5v3h18v-3c0-3.34-5.7-5-9-5Z" fill="currentColor"/></svg>',
  visitors: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4Zm0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4Z" fill="currentColor"/></svg>',
  reports: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm2 12h2v4H7Zm4-6h2v10h-2Zm4 3h2v7h-2Z" fill="currentColor"/></svg>',
  bell: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22Zm7-6.2v-5a7 7 0 0 0-5.6-6.86V3a1.4 1.4 0 1 0-2.8 0v.94A7 7 0 0 0 5 15.8L3.5 17.3v.9H20.5v-.9L19 15.8Z" fill="currentColor"/></svg>',
  departments: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M3 21V8l9-5 9 5v13h-6v-6h-6v6Z" fill="currentColor"/></svg>',
  logs: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 4h16v2H4Zm0 7h16v2H4Zm0 7h10v2H4Z" fill="currentColor"/></svg>'
};

function tagClass(tag) {
  return tag.toLowerCase().replace(/\s+/g, '-');
}

function renderStatCards(stats) {
  const el = document.getElementById('statCards');
  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-top">
        <div class="stat-icon blue">
          ${ICONS.visitors}
        </div>
        <span class="stat-change">+${stats.changePercent}%</span>
      </div>
      <div class="stat-value">${stats.totalVisitorsToday.toLocaleString()}</div>
      <div class="stat-label">Total Visitors Today</div>
    </div>
    <div class="stat-card">
      <div class="stat-top">
        <div class="stat-icon blue">
          ${ICONS.users}
        </div>
      </div>
      <div class="stat-value">${stats.checkedIn}</div>
      <div class="stat-label">Checked In Now</div>
    </div>
  `;
}

function renderQuickAccess(items) {
  const el = document.getElementById('quickGrid');
  el.innerHTML = items.map(item => `
    <a class="quick-item" href="${item.href}">
      <div class="quick-icon${item.id === 'notifications' ? ' red' : ''}">
        ${ICONS[item.icon] || ICONS.users}
      </div>
      <div class="quick-text">
        <div class="label">${item.label}</div>
        <div class="sub">${item.sub}</div>
      </div>
    </a>
  `).join('');
}

function renderActivity(items) {
  const el = document.getElementById('activityList');
  el.innerHTML = items.map(item => `
    <div class="activity-item">
      <div class="activity-avatar">${item.initials}</div>
      <div class="activity-body">
        <div class="activity-name">${item.name}</div>
        <div class="activity-host">${item.hostLine}</div>
        <div class="activity-tags">
          ${item.tags.map(t => `<span class="tag ${tagClass(t)}">${t}</span>`).join('')}
        </div>
      </div>
      <div class="activity-time">${item.time}</div>
    </div>
  `).join('');
}

function renderUser(user) {
  const avatarEl = document.getElementById('avatarInitial');
  if (avatarEl) avatarEl.textContent = user.initial || (user.name || 'A').charAt(0);
}

async function loadDashboard() {
  try {
    const res = await fetch('admin-dashboard-data.json');
    if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
    const data = await res.json();

    renderUser(data.user);
    renderStatCards(data.stats);
    renderQuickAccess(data.quickAccess);
    renderActivity(data.recentActivity);
    wireSearch();
  } catch (err) {
    console.error('Error loading admin dashboard data:', err);
    document.querySelector('.content').innerHTML =
      '<p style="text-align:center;color:#e0413e;font-size:13px;">Couldn\'t load dashboard data. Please try again.</p>';
  }
}

function wireSearch() {
  const input = document.querySelector('.search-wrap input');
  if (!input) return;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      window.location.href = `all-visitors.html?q=${encodeURIComponent(input.value.trim())}`;
    }
  });
}

document.addEventListener('DOMContentLoaded', loadDashboard);
