// all-visitors.js
// Loads visitors from the backend API, renders the visitor list, and wires up search, filter, and export.

// ---- Config ----------------------------------------------------------
const API_BASE = 'http://localhost:5000/api'; // change to your deployed API origin
const TOKEN_KEY = 'token'; // must match whatever key your login page saves the JWT under

let allVisitors = [];
let activeFilters = { status: new Set(), category: new Set() };

function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, '-');
}
function categoryClass(cat) {
  return cat.toLowerCase().replace(/\s+/g, '-');
}

// Human-readable labels for the VisitStatus enum coming back from Prisma
const STATUS_LABELS = {
  pending_otp: 'Pending OTP',
  auto_cleared: 'Auto Cleared',
  flagged: 'Flagged',
  resolved_approved: 'Approved',
  resolved_rejected: 'Rejected',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
};

function formatStatus(rawStatus) {
  return STATUS_LABELS[rawStatus] || rawStatus;
}

function buildHostLine(visit) {
  const host = visit.assigned_host || visit.requested_host;
  if (host && host.user && host.user.name) {
    return visit.purpose ? `Host: ${host.user.name} — ${visit.purpose}` : `Host: ${host.user.name}`;
  }
  if (visit.visit_type === 'delivery') {
    return visit.recipient_name ? `Delivery for ${visit.recipient_name}` : 'Delivery';
  }
  return visit.purpose || 'No host assigned';
}

// Map a raw /api/visits row into the shape the UI expects
function mapVisitToVisitor(visit) {
  return {
    id: visit.visit_id,
    name: visit.visitor ? visit.visitor.full_name : 'Unknown',
    status: formatStatus(visit.status),
    category: (visit.department && visit.department.department_name) || 'Uncategorized',
    hostLine: buildHostLine(visit),
  };
}

function renderVisitors(visitors) {
  const el = document.getElementById('visitorList');
  if (!visitors.length) {
    el.innerHTML = '<div class="no-results">No visitors match your search.</div>';
    return;
  }
  el.innerHTML = visitors.map(v => `
    <div class="visitor-item">
      <div class="visitor-top">
        <div>
          <div class="visitor-name">${v.name}</div>
          <div class="visitor-id">ID: ${v.id}</div>
        </div>
        <span class="status-pill ${statusClass(v.status)}">${v.status}</span>
      </div>
      <div class="visitor-host">${v.hostLine}</div>
      <span class="category-tag ${categoryClass(v.category)}">${v.category}</span>
    </div>
  `).join('');
}

function getVisibleVisitors() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  return allVisitors.filter(v => {
    const matchesQuery = !q ||
      v.name.toLowerCase().includes(q) ||
      String(v.id).toLowerCase().includes(q) ||
      v.hostLine.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q);
    const matchesStatus = !activeFilters.status.size || activeFilters.status.has(v.status);
    const matchesCategory = !activeFilters.category.size || activeFilters.category.has(v.category);
    return matchesQuery && matchesStatus && matchesCategory;
  });
}

function refresh() {
  renderVisitors(getVisibleVisitors());
}

function buildChips(containerId, values, filterKey) {
  const el = document.getElementById(containerId);
  el.innerHTML = values.map(v => `<button type="button" class="filter-chip" data-value="${v}">${v}</button>`).join('');
  el.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.value;
      if (activeFilters[filterKey].has(val)) {
        activeFilters[filterKey].delete(val);
        chip.classList.remove('active');
      } else {
        activeFilters[filterKey].add(val);
        chip.classList.add('active');
      }
    });
  });
}

function exportVisibleCSV() {
  const visible = getVisibleVisitors();
  if (!visible.length) { showToast('Nothing to export'); return; }
  const rows = [
    ['ID', 'Name', 'Status', 'Category', 'Host / Purpose'],
    ...visible.map(v => [v.id, v.name, v.status, v.category, v.hostLine])
  ];
  downloadCSV('visitors-export.csv', rows);
  showToast(`Exported ${visible.length} visitor${visible.length === 1 ? '' : 's'}`);
}

function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function loadVisitors() {
  try {
    const token = getAuthToken();
    if (!token) {
      window.location.href = 'member-login.html';
      return;
    }

    const res = await fetch(`${API_BASE}/visits`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      // Token missing/expired — send back to login
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = 'member-login.html';
      return;
    }

    const payload = await res.json();
    if (!res.ok || !payload.success) {
      throw new Error(payload.message || `Failed to load data: ${res.status}`);
    }

    allVisitors = (payload.data || []).map(mapVisitToVisitor);

    const statuses = [...new Set(allVisitors.map(v => v.status))];
    const categories = [...new Set(allVisitors.map(v => v.category))];
    buildChips('statusChips', statuses, 'status');
    buildChips('categoryChips', categories, 'category');

    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q');
    if (initialQuery) document.getElementById('searchInput').value = initialQuery;

    refresh();

    document.getElementById('searchInput').addEventListener('input', refresh);

    document.getElementById('downloadBtn').addEventListener('click', exportVisibleCSV);

    const filterBtn = document.getElementById('filterBtn');
    const filterPanel = document.getElementById('filterPanel');
    filterBtn.setAttribute('data-panel-trigger', '');
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !filterPanel.classList.contains('open');
      closeAllPanels();
      if (willOpen) filterPanel.classList.add('open');
    });

    document.getElementById('filterApplyBtn').addEventListener('click', () => {
      refresh();
      filterPanel.classList.remove('open');
      showToast('Filters applied');
    });

    document.getElementById('filterClearBtn').addEventListener('click', () => {
      activeFilters.status.clear();
      activeFilters.category.clear();
      filterPanel.querySelectorAll('.filter-chip.active').forEach(c => c.classList.remove('active'));
      refresh();
    });
  } catch (err) {
    console.error('Error loading visitors:', err);
    document.getElementById('visitorList').innerHTML =
      '<div class="no-results" style="color:#e0413e;">Couldn\'t load visitors. Please try again.</div>';
  }
}

document.addEventListener('DOMContentLoaded', loadVisitors);