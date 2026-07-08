// reports-analytics.js
// Loads reports-analytics-data.json and renders the charts and stat cards.

function renderPeriodToggle(periods, active) {
  const el = document.getElementById('periodToggle');
  el.innerHTML = periods.map(p => `
    <button class="period-btn${p === active ? ' active' : ''}" data-period="${p}" type="button">${p}</button>
  `).join('');

  el.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Hook point: reload data for the selected period (Daily / Weekly / Monthly).
      console.log('Period changed to', btn.dataset.period);
    });
  });
}

function renderBarChart(containerId, points, { highlightMaxLabel = null, small = false } = {}) {
  const el = document.getElementById(containerId);
  const max = Math.max(...points.map(p => p.value));
  el.innerHTML = points.map(p => {
    const heightPct = Math.max(6, Math.round((p.value / max) * 100));
    const isPeak = highlightMaxLabel !== null && p.value === max;
    return `
      <div class="bar-col">
        <div class="bar${isPeak ? ' peak' : ''}" style="height:${heightPct}%"></div>
        <span class="bar-label">${p.label}</span>
      </div>
    `;
  }).join('');
}

function renderCategoryBars(categories) {
  const el = document.getElementById('categoryBars');
  el.innerHTML = categories.map(c => `
    <div class="category-row">
      <div class="cat-top">
        <span class="cat-name">${c.label}</span>
        <span class="cat-count">${c.count} (${c.percent}%)</span>
      </div>
      <div class="cat-track">
        <div class="cat-fill" style="width:${c.percent}%"></div>
      </div>
    </div>
  `).join('');
}

function renderStatGrid(stats) {
  const el = document.getElementById('statGrid');
  el.innerHTML = stats.map(s => `
    <div class="stat-box">
      <div class="value">${s.value}</div>
      <div class="label">${s.label}</div>
    </div>
  `).join('');
}

async function loadReports() {
  try {
    const res = await fetch('reports-analytics-data.json');
    if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
    const data = await res.json();

    document.getElementById('lastUpdated').textContent = `Last updated: ${data.lastUpdated}`;
    renderPeriodToggle(data.periods, data.activePeriod);

    document.getElementById('weeklyDateRange').textContent = data.weeklyVisitors.dateRange;
    renderBarChart('weeklyChart', data.weeklyVisitors.days, { highlightMaxLabel: null });

    document.getElementById('peakSubtitle').textContent = data.peakHours.subtitle;
    renderBarChart('peakChart', data.peakHours.hours, { highlightMaxLabel: true, small: true });
    document.getElementById('peakCaption').textContent = data.peakHours.peakLabel;

    renderCategoryBars(data.visitorCategories);
    renderStatGrid(data.quickStats);

    document.getElementById('exportBtn').addEventListener('click', () => {
      // Hook point: trigger a real report export (PDF/CSV) via your backend.
      console.log('Export Full Report clicked');
    });
  } catch (err) {
    console.error('Error loading reports:', err);
    document.querySelector('.content').innerHTML =
      '<p style="text-align:center;color:#e0413e;font-size:13px;">Couldn\'t load report data. Please try again.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadReports);