// departments.js — loads departments-data.json, renders the list, and wires up search.

let allDepartments = [];

const BUILDING_ICON = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M3 21V8l9-5 9 5v13h-6v-6h-6v6Z" fill="currentColor"/></svg>';

function renderDepartments(list) {
  const el = document.getElementById('deptList');
  const totalStaff = allDepartments.reduce((sum, d) => sum + d.staffCount, 0);
  document.getElementById('deptSummary').textContent =
    `${allDepartments.length} departments · ${totalStaff} staff total`;

  if (!list.length) {
    el.innerHTML = '<div class="empty-state">No departments match your search.</div>';
    return;
  }
  el.innerHTML = list.map(d => `
    <div class="dept-item">
      <div class="dept-icon">${BUILDING_ICON}</div>
      <div class="dept-body">
        <div class="dept-name">${d.name}</div>
        <div class="dept-meta">${d.building}</div>
      </div>
      <div class="dept-count">${d.staffCount} staff</div>
    </div>
  `).join('');
}

async function loadDepartments() {
  try {
    const res = await fetch('departments-data.json');
    if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
    const data = await res.json();
    allDepartments = data.departments || [];
    renderDepartments(allDepartments);

    document.getElementById('searchInput').addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      const filtered = !q ? allDepartments : allDepartments.filter(d =>
        d.name.toLowerCase().includes(q) || d.building.toLowerCase().includes(q)
      );
      renderDepartments(filtered);
    });
  } catch (err) {
    console.error('Error loading departments:', err);
    document.getElementById('deptList').innerHTML =
      '<div class="empty-state" style="color:#e0413e;">Couldn\'t load departments. Please try again.</div>';
  }
}

document.addEventListener('DOMContentLoaded', loadDepartments);
