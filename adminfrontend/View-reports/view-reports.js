let typeChart, priorityChart, trendChart, resolutionChart;
let currentDays = 30;

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
  await Promise.all([
    loadSummaryCards(),
    loadCharts(),
    loadGrievanceReport(),
    loadCommitteeReport()
  ]);
});

// ─── Summary Cards ───────────────────────────────────────────────────────────
async function loadSummaryCards() {
  try {
    // GET /api/admin/reports/complaints-by-status
    // Response: { "SUBMITTED": 20, "UNDER_REVIEW": 15, "RESOLVED": 98, "ESCALATED": 8, ... }
    const statusMap = await apiCall('/admin/reports/complaints-by-status');

    const total    = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const resolved = statusMap['RESOLVED'] || statusMap['Resolved'] || 0;

    document.getElementById('totalGrievances').textContent = total;
    document.getElementById('resolvedCount').textContent   = resolved;

    // Resolution rate as a proxy for satisfaction (real feedback endpoint can override)
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    document.getElementById('satisfactionRate').textContent = rate + '%';

  } catch (err) {
    console.error('Summary cards error:', err.message);
    ['totalGrievances', 'resolvedCount', 'satisfactionRate'].forEach(id => {
      document.getElementById(id).textContent = '--';
    });
  }

  // Avg resolution time — not yet in backend, show placeholder
  document.getElementById('avgTime').textContent = 'N/A';
}

// ─── Charts ──────────────────────────────────────────────────────────────────
async function loadCharts() {
  try {
    const [statusMap, actionSummary, escalationTrends] = await Promise.all([
      apiCall('/admin/reports/complaints-by-status'),
      apiCall('/admin/reports/action-summary'),
      apiCall(`/admin/reports/escalation-trends?days=${currentDays}`)
    ]);

    renderTypeChart(statusMap);
    renderPriorityChart(statusMap);
    renderTrendChart(escalationTrends);
    renderResolutionChart(actionSummary);

  } catch (err) {
    console.error('Charts error:', err.message);
  }
}

// Chart 1 – Complaints by Status (pie)
function renderTypeChart(statusMap) {
  const ctx = document.getElementById('typeChart').getContext('2d');
  if (typeChart) typeChart.destroy();

  typeChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(statusMap),
      datasets: [{
        data: Object.values(statusMap),
        backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40']
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

// Chart 2 – Complaints by Status breakdown 
function renderPriorityChart(statusMap) {
  const ctx = document.getElementById('priorityChart').getContext('2d');
  if (priorityChart) priorityChart.destroy();

  // Group into Resolved / Active / Escalated
  const resolved  = statusMap['RESOLVED']   || statusMap['Resolved']   || 0;
  const escalated = statusMap['ESCALATED']  || statusMap['Escalated']  || 0;
  const active    = Object.entries(statusMap)
    .filter(([k]) => !['RESOLVED','Resolved','ESCALATED','Escalated'].includes(k))
    .reduce((sum, [, v]) => sum + v, 0);

  priorityChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Resolved', 'Active', 'Escalated'],
      datasets: [{
        data: [resolved, active, escalated],
        backgroundColor: ['#28a745', '#ffc107', '#dc3545']
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

// Chart 3 – Escalation trends over time (line)
// Response: { "2024-05-01": 3, "2024-05-02": 1, ... }
function renderTrendChart(escalationTrends) {
  const ctx = document.getElementById('trendChart').getContext('2d');
  if (trendChart) trendChart.destroy();

  const sorted  = Object.entries(escalationTrends).sort(([a], [b]) => a.localeCompare(b));
  const labels  = sorted.map(([date]) => formatDate(date));
  const values  = sorted.map(([, count]) => count);

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Escalations',
        data: values,
        borderColor: '#36a2eb',
        backgroundColor: 'rgba(54,162,235,0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

// Chart 4 – Action type summary (bar)
// Response: { "COMPLAINT_SUBMITTED": 45, "STATUS_UPDATED": 30, ... }
function renderResolutionChart(actionSummary) {
  const ctx = document.getElementById('resolutionChart').getContext('2d');
  if (resolutionChart) resolutionChart.destroy();

  resolutionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(actionSummary).map(k => k.replace(/_/g, ' ')),
      datasets: [{
        label: 'Action Count',
        data: Object.values(actionSummary),
        backgroundColor: '#667eea'
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

// ─── Detailed Reports ─────────────────────────────────────────────────────────

// Grievance Report tab — complaints by status as a table
async function loadGrievanceReport() {
  const tbody = document.getElementById('grievanceTableBody');
  try {
    const statusMap = await apiCall('/admin/reports/complaints-by-status');
    const total     = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const resolved  = statusMap['RESOLVED']  || statusMap['Resolved']  || 0;
    const escalated = statusMap['ESCALATED'] || statusMap['Escalated'] || 0;
    const pending   = total - resolved - escalated;
    const rate      = total > 0 ? Math.round((resolved / total) * 100) : 0;

    tbody.innerHTML = `
      <tr>
        <td>Current Period</td>
        <td>${total}</td>
        <td>${resolved}</td>
        <td>${pending > 0 ? pending : 0}</td>
        <td>${escalated}</td>
        <td>${rate}%</td>
      </tr>
      ${Object.entries(statusMap).map(([status, count]) => `
        <tr>
          <td colspan="1" style="padding-left:2rem; color:#888;">${status}</td>
          <td>${count}</td>
          <td>–</td><td>–</td><td>–</td><td>–</td>
        </tr>
      `).join('')}
    `;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#aaa;">Failed to load data</td></tr>`;
  }
}

// Committee Performance tab — GET /api/admin/users/committee + /api/admin/reports/user-activity
async function loadCommitteeReport() {
  const tbody = document.getElementById('committeeTableBody');
  try {
    // Fetch committee members (ROLE_COMMITTEE only) and their action counts in parallel
    const [members, activity] = await Promise.all([
      apiCall('/admin/users/committee'),
      apiCall('/admin/reports/user-activity')
    ]);

    if (!members || members.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#aaa;">No committee members found</td></tr>`;
      return;
    }

    // Build a quick lookup: userId -> actionCount
    const activityMap = {};
    (activity || []).forEach(row => { activityMap[row.userId] = row.actionCount || 0; });

    tbody.innerHTML = members.map(member => {
      const actions = activityMap[member.id] || 0;
      const pct     = Math.min(100, Math.round((actions / 50) * 100));
      return `
        <tr>
          <td>${member.name}</td>
          <td>${actions}</td>
          <td>–</td>
          <td>–</td>
          <td>–</td>
          <td>
            <div class="performance-bar">
              <div class="performance-fill" style="width:${pct}%"></div>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#aaa;">Failed to load data</td></tr>`;
  }
}

// ─── Tab Switching ────────────────────────────────────────────────────────────
function showReport(type) {
  document.querySelectorAll('.report-tab').forEach(btn => btn.classList.remove('active'));
  event.currentTarget.classList.add('active');

  ['grievanceReport','committeeReport','feedbackReport','escalationReport'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });

  switch (type) {
    case 'grievance':
      document.getElementById('grievanceReport').style.display = 'block';
      break;
    case 'committee':
      document.getElementById('committeeReport').style.display = 'block';
      break;
    case 'feedback':
      document.getElementById('feedbackReport').style.display = 'block';
      document.getElementById('feedbackReport').innerHTML = generateFeedbackPlaceholder();
      break;
    case 'escalation':
      document.getElementById('escalationReport').style.display = 'block';
      loadEscalationReport();
      break;
  }
}

// Escalation report — live from API
async function loadEscalationReport() {
  const el = document.getElementById('escalationReport');
  el.innerHTML = '<p style="color:#aaa; padding:1rem;">Loading...</p>';
  try {
    const trends    = await apiCall(`/admin/reports/escalation-trends?days=${currentDays}`);
    const total     = Object.values(trends).reduce((a, b) => a + b, 0);
    const sorted    = Object.entries(trends).sort(([a], [b]) => a.localeCompare(b));
    const last7     = sorted.slice(-7).reduce((s, [, v]) => s + v, 0);
    const prev7     = sorted.slice(-14, -7).reduce((s, [, v]) => s + v, 0);
    const trend     = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : 0;
    const trendSign = trend >= 0 ? '↑' : '↓';
    const trendCls  = trend >= 0 ? 'trend-up' : 'trend-down';

    el.innerHTML = `
      <div class="escalation-stats">
        <div class="escalation-stat critical">
          <h4>Last 7 Days</h4>
          <div class="big-number">${last7}</div>
          <p>Escalations</p>
        </div>
        <div class="escalation-stat high">
          <h4>Last ${currentDays} Days</h4>
          <div class="big-number">${total}</div>
          <p>Total escalations</p>
        </div>
        <div class="escalation-stat resolved">
          <h4>Week-on-Week</h4>
          <div class="big-number">${Math.abs(trend)}%</div>
          <p><span class="${trendCls}">${trendSign} ${Math.abs(trend)}%</span> vs prior week</p>
        </div>
      </div>
      <div class="escalation-trend" style="margin-top:1rem;">
        <h4>Daily Breakdown (last ${currentDays} days)</h4>
        <table class="report-table" style="margin-top:1rem;">
          <thead><tr><th>Date</th><th>Escalations</th></tr></thead>
          <tbody>
            ${sorted.map(([date, count]) => `
              <tr><td>${formatDate(date)}</td><td>${count}</td></tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<p style="color:#aaa; padding:1rem;">Failed to load escalation data.</p>`;
  }
}

// Feedback placeholder (backend endpoint not available yet)
function generateFeedbackPlaceholder() {
  return `
    <div class="feedback-stats">
      <div class="feedback-stat">
        <h4>Average Rating</h4>
        <div class="big-number">–</div>
        <p>Feedback API coming soon</p>
      </div>
      <div class="feedback-stat">
        <h4>Response Rate</h4>
        <div class="big-number">–</div>
        <p>Feedback API coming soon</p>
      </div>
      <div class="feedback-stat">
        <h4>Positive Feedback</h4>
        <div class="big-number">–</div>
        <p>Feedback API coming soon</p>
      </div>
    </div>
  `;
}

// ─── Date Range ───────────────────────────────────────────────────────────────
function setDateRange(range) {
  document.querySelectorAll('.range-btn').forEach(btn => btn.classList.remove('active'));
  event.currentTarget.classList.add('active');

  const customRange = document.getElementById('customRange');

  if (range === 'custom') {
    customRange.style.display = 'flex';
    return;
  }

  customRange.style.display = 'none';

  const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
  currentDays = daysMap[range] || 30;

  // Reload charts with new window
  loadCharts();
}

function applyCustomRange() {
  const start = document.getElementById('startDate').value;
  const end   = document.getElementById('endDate').value;
  if (!start || !end) {
    alert('Please select both start and end dates.');
    return;
  }
  const diff  = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
  currentDays = diff > 0 ? diff : 30;
  loadCharts();
}

// ─── Export (placeholder — implement server-side export when ready) ────────────
function exportReport(format) {
  alert(`Export as ${format.toUpperCase()} — coming soon.`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// ─── Expose globals ───────────────────────────────────────────────────────────
window.setDateRange    = setDateRange;
window.applyCustomRange = applyCustomRange;
window.showReport      = showReport;
window.exportReport    = exportReport;