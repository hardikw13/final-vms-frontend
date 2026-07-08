// entry-logs.js — loads entry-logs-data.json, renders the audit trail, wires up search + CSV export.

let allLogs = [];

const ENTRY_ICON = '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M11 3v6H5v6h6v6l7-9Z" fill="currentColor" transform="rotate(90 12 12)"/></svg>';
const EXIT_ICON = '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M13 3v6h6v6h-6v6l-7-9Z" fill="currentColor" transform="rotate(90 12 12)"/></svg>';

function renderLogs(list) {
  const el = document.getElementById('logList');
  document.getElementById('logSummary').textContent = `${allLogs.length} events logged today`;

  if (!list.length) {
    el.innerHTML = '<div class="empty-state">No log entries match your search.</div>';
    return;
  }
  el.innerHTML = list.map(l => `
    <div class="log-item">
      <div class="log-icon ${l.type}">${l.type === 'entry' ? ENTRY_ICON : EXIT_ICON}</div>
      <div class="log-body">
        <div class="log-title">${l.name} · ${l.type === 'entry' ? 'Checked In' : 'Checked Out'}</div>
        <div class="log-meta">${l.detail}</div>
      </div>
      <div class="log-time">${l.time}</div>
    </div>
  `).join('');
}

async function loadLogs() {
  try {
    const res = await fetch('entry-logs-data.json');
    if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
    const data = await res.json();
    allLogs = data.logs || [];
    renderLogs(allLogs);

    document.getElementById('searchInput').addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      const filtered = !q ? allLogs : allLogs.filter(l =>
        l.name.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q)
      );
      renderLogs(filtered);
    });

    document.getElementById('exportLogsBtn').addEventListener('click', () => {
      const rows = [
        ['Name', 'Type', 'Detail', 'Time'],
        ...allLogs.map(l => [l.name, l.type === 'entry' ? 'Checked In' : 'Checked Out', l.detail, l.time])
      ];
      downloadCSV('entry-logs.csv', rows);
      showToast('Entry logs exported');
    });
  } catch (err) {
    console.error('Error loading entry logs:', err);
    document.getElementById('logList').innerHTML =
      '<div class="empty-state" style="color:#e0413e;">Couldn\'t load entry logs. Please try again.</div>';
  }
}

document.addEventListener('DOMContentLoaded', loadLogs);
