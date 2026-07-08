// all-visitors.js
// Loads all-visitors-data.json, renders the visitor list, and wires up search, filter, and export.

let allVisitors = [];
let activeFilters = { status: new Set(), category: new Set() };

function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, '-');
}
function categoryClass(cat) {
  return cat.toLowerCase().replace(/\s+/g, '-');
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
      v.id.toLowerCase().includes(q) ||
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

async function loadVisitors() {
  try {
    const res = await fetch('all-visitors-data.json');
    if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
    const data = await res.json();

    document.querySelector('.page-heading').textContent = data.pageTitle || 'All Visitors';
    allVisitors = data.visitors || [];

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
