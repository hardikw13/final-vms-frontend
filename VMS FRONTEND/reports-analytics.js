// reports-analytics.js
// Loads reports-analytics-data.json and renders the charts and stat cards, with working
// period switching (Daily / Weekly / Monthly) and a real CSV export.

let reportData = null;

function renderPeriodToggle(periods, active) {
  const el = document.getElementById('periodToggle');
  el.innerHTML = periods.map(p => `
    <button class="period-btn${p === active ? ' active' : ''}" data-period="${p}" type="button">${p}</button>
  `).join('');

  el.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderWeeklyCard(btn.dataset.period);
    });
  });
}

function renderBarChart(containerId, points, { highlightMax = false } = {}) {
  const el = document.getElementById(containerId);
  const max = Math.max(...points.map(p => p.value));
  el.innerHTML = points.map(p => {
    const heightPct = Math.max(6, Math.round((p.value / max) * 100));
    const isPeak = highlightMax && p.value === max;
    return `
      <div class="bar-col">
        <div class="bar${isPeak ? ' peak' : ''}" style="height:${heightPct}%"></div>
        <span class="bar-label">${p.label}</span>
      </div>
    `;
  }).join('');
}

function renderWeeklyCard(period) {
  const dataset = reportData.byPeriod[period];
  if (!dataset) return;
  document.getElementById('weeklyCardTitle').textContent = dataset.chartTitle;
  document.getElementById('weeklyDateRange').textContent = dataset.dateRange;
  renderBarChart('weeklyChart', dataset.days, { highlightMax: false });
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

function exportReport() {
  const activeBtn = document.querySelector('.period-btn.active');
  const period = activeBtn ? activeBtn.dataset.period : reportData.activePeriod;
  const dataset = reportData.byPeriod[period];

  const rows = [
    [`${dataset.chartTitle} Report`],
    ['Period', period],
    ['Date Range', dataset.dateRange],
    [],
    ['Label', 'Visitors'],
    ...dataset.days.map(d => [d.label, d.value]),
    [],
    ['Visitor Category', 'Count', 'Percent'],
    ...reportData.visitorCategories.map(c => [c.label, c.count, `${c.percent}%`]),
    [],
    ['Quick Stat', 'Value'],
    ...reportData.quickStats.map(s => [s.label, s.value])
  ];
  downloadCSV(`report-${period.toLowerCase()}.csv`, rows);
  showToast('Report exported');
}

async function loadReports() {
  try {
    const res = await fetch('reports-analytics-data.json');
    if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
    reportData = await res.json();

    document.getElementById('lastUpdated').textContent = `Last updated: ${reportData.lastUpdated}`;
    renderPeriodToggle(reportData.periods, reportData.activePeriod);
    renderWeeklyCard(reportData.activePeriod);

    document.getElementById('peakSubtitle').textContent = reportData.peakHours.subtitle;
    renderBarChart('peakChart', reportData.peakHours.hours, { highlightMax: true });
    document.getElementById('peakCaption').textContent = reportData.peakHours.peakLabel;

    renderCategoryBars(reportData.visitorCategories);
    renderStatGrid(reportData.quickStats);

    document.getElementById('exportBtn').addEventListener('click', exportReport);
  } catch (err) {
    console.error('Error loading reports:', err);
    document.querySelector('.content').innerHTML =
      '<p style="text-align:center;color:#e0413e;font-size:13px;">Couldn\'t load report data. Please try again.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadReports);
