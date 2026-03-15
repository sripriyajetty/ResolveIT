// audit-logs.js – wired to Spring Boot /api/admin/audit-logs

// State
let allLogs       = [];   // full current page from server
let filteredLogs  = [];   // client-side filtered subset
let currentPage   = 0;    // 0-based (Spring pagination)
let totalPages    = 1;
let totalElements = 0;
const PAGE_SIZE   = 10;

// Active filter state
let activeFilters = {
  dateRange:  'week',
  actionType: 'all',
  startDate:  null,
  endDate:    null,
  search:     ''
};

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchLogs();
});

// ─── Fetch from backend ───────────────────────────────────────────────────────
async function fetchLogs() {
  showTableLoading();

  // Build query params
  const params = new URLSearchParams();
  params.set('page', currentPage);
  params.set('size', PAGE_SIZE);

  // Date range → startDate param
  const { start, end } = resolveDateRange();
  if (start) params.set('startDate', start.toISOString());
  if (end)   params.set('endDate',   end.toISOString());

  // Action filter
  if (activeFilters.actionType !== 'all') {
    params.set('action', activeFilters.actionType.toUpperCase());
  }

  try {
    const data = await apiCall(`/admin/audit-logs?${params.toString()}`);

    // data: { content, totalElements, totalPages, currentPage }
    allLogs       = data.content       || [];
    totalElements = data.totalElements || 0;
    totalPages    = data.totalPages    || 1;

    // Client-side search filter on top
    applySearchFilter();
    updateStatistics(data);
    renderLogs();
    renderPagination();

  } catch (err) {
    document.getElementById('logsTableBody').innerHTML =
      `<tr><td colspan="7" style="text-align:center;color:#e74c3c;padding:30px;">
         Failed to load logs: ${err.message}
       </td></tr>`;
    showToast('Failed to load audit logs', 'error');
  }
}

// ─── Apply client-side search on top of server results ───────────────────────
function applySearchFilter() {
  const term = activeFilters.search.toLowerCase();
  if (!term) {
    filteredLogs = [...allLogs];
    return;
  }
  filteredLogs = allLogs.filter(log =>
    (log.action      || '').toLowerCase().includes(term) ||
    (log.details     || '').toLowerCase().includes(term) ||
    String(log.performedBy || '').includes(term)
  );
}

// ─── Render table ─────────────────────────────────────────────────────────────
function renderLogs() {
  const tbody = document.getElementById('logsTableBody');

  if (filteredLogs.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;padding:30px;color:#aaa;">No logs found</td></tr>';
    return;
  }

  tbody.innerHTML = filteredLogs.map(log => {
    const actionCategory = categorizeAction(log.action);
    const details        = parseDetails(log.details);
    return `
      <tr onclick="viewLogDetails(${log.id})" style="cursor:pointer;">
        <td>${formatTimestamp(log.timestamp)}</td>
        <td>${log.performedBy ? 'User #' + log.performedBy : 'System'}</td>
        <td><span class="user-badge ${getUserType(log)}">${getUserType(log).toUpperCase()}</span></td>
        <td>${log.action || '–'}</td>
        <td>${details}</td>
        <td>–</td>
        <td><span class="status-badge success">SUCCESS</span></td>
      </tr>
    `;
  }).join('');
}

// ─── Statistics bar ───────────────────────────────────────────────────────────
function updateStatistics(data) {
  document.getElementById('totalEvents').textContent  = data.totalElements || 0;
  // Backend doesn't have status field — show total only, zero others
  document.getElementById('successCount').textContent = data.totalElements || 0;
  document.getElementById('failedCount').textContent  = 0;
  document.getElementById('warningCount').textContent = 0;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function renderPagination() {
  const pagination = document.getElementById('pagination');
  const tp = totalPages;
  const cp = currentPage; // 0-based

  if (tp <= 1) { pagination.innerHTML = ''; return; }

  let html = '';
  html += `<button onclick="changePage(0)" ${cp===0?'disabled':''}><i class="fas fa-angle-double-left"></i></button>`;
  html += `<button onclick="changePage(${cp-1})" ${cp===0?'disabled':''}><i class="fas fa-angle-left"></i></button>`;

  for (let i = 0; i < tp; i++) {
    if (i === cp) {
      html += `<button class="active">${i+1}</button>`;
    } else if (i === 0 || i === tp-1 || (i >= cp-2 && i <= cp+2)) {
      html += `<button onclick="changePage(${i})">${i+1}</button>`;
    } else if (i === cp-3 || i === cp+3) {
      html += `<button disabled>...</button>`;
    }
  }

  html += `<button onclick="changePage(${cp+1})" ${cp===tp-1?'disabled':''}><i class="fas fa-angle-right"></i></button>`;
  html += `<button onclick="changePage(${tp-1})" ${cp===tp-1?'disabled':''}><i class="fas fa-angle-double-right"></i></button>`;

  pagination.innerHTML = html;
}

function changePage(page) {
  if (page < 0 || page >= totalPages) return;
  currentPage = page;
  fetchLogs();
}

// ─── Filters ──────────────────────────────────────────────────────────────────
function applyFilters() {
  activeFilters.dateRange  = document.getElementById('dateRange').value;
  activeFilters.actionType = document.getElementById('actionType').value;

  const customRow = document.getElementById('customDateRow');
  customRow.style.display = activeFilters.dateRange === 'custom' ? 'flex' : 'none';

  if (activeFilters.dateRange === 'custom') return; // wait for Apply

  currentPage = 0;
  fetchLogs();
}

function applyCustomDate() {
  const s = document.getElementById('startDate').value;
  const e = document.getElementById('endDate').value;
  if (!s || !e) { showToast('Please select both dates', 'error'); return; }
  activeFilters.startDate = new Date(s);
  activeFilters.endDate   = new Date(e);
  currentPage = 0;
  fetchLogs();
}

function clearFilters() {
  document.getElementById('dateRange').value  = 'week';
  document.getElementById('actionType').value = 'all';
  document.getElementById('status').value     = 'all';
  document.getElementById('userType').value   = 'all';
  document.getElementById('customDateRow').style.display = 'none';
  document.querySelector('.search-box input').value = '';

  activeFilters = { dateRange: 'week', actionType: 'all', startDate: null, endDate: null, search: '' };
  currentPage = 0;
  fetchLogs();
  showToast('Filters cleared', 'info');
}

function searchLogs() {
  activeFilters.search = event.target.value;
  applySearchFilter();
  renderLogs();
}

// ─── View log details modal ───────────────────────────────────────────────────
async function viewLogDetails(logId) {
  try {
    const log = await apiCall(`/admin/audit-logs/${logId}`);
    const details = parseDetails(log.details);

    document.getElementById('logDetails').innerHTML = `
      <div class="detail-group">
        <label>Log ID:</label>
        <span>${log.id}</span>
      </div>
      <div class="detail-group">
        <label>Timestamp:</label>
        <span>${log.timestamp ? new Date(log.timestamp).toLocaleString() : '–'}</span>
      </div>
      <div class="detail-group">
        <label>Performed By:</label>
        <span>${log.performedBy ? 'User #' + log.performedBy : 'System'}</span>
      </div>
      <div class="detail-group">
        <label>Action:</label>
        <span>${log.action || '–'}</span>
      </div>
      <div class="detail-group">
        <label>Details:</label>
        <span>${details}</span>
      </div>
    `;

    document.getElementById('logModal').classList.add('active');
  } catch (err) {
    showToast('Failed to load log details', 'error');
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────
function exportLogs() {
  const format = confirm('Export as CSV? Click OK for CSV, Cancel for JSON') ? 'csv' : 'json';

  if (format === 'csv') {
    const headers = ['ID', 'Timestamp', 'Performed By', 'Action', 'Details'];
    const rows    = filteredLogs.map(l => [
      l.id,
      l.timestamp || '',
      l.performedBy || 'System',
      l.action || '',
      (parseDetails(l.details) || '').replace(/,/g, ';')
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    downloadFile(csv, 'audit-logs.csv', 'text/csv');
  } else {
    downloadFile(JSON.stringify(filteredLogs, null, 2), 'audit-logs.json', 'application/json');
  }
  showToast(`Exported ${filteredLogs.length} logs`, 'success');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Resolve date range filter to { start, end } Date objects
function resolveDateRange() {
  const range = activeFilters.dateRange;
  if (range === 'custom') {
    return { start: activeFilters.startDate, end: activeFilters.endDate };
  }
  const now   = new Date();
  const start = new Date(now);
  switch (range) {
    case 'today':     start.setHours(0,0,0,0);                    break;
    case 'yesterday': start.setDate(start.getDate()-1); start.setHours(0,0,0,0); break;
    case 'week':      start.setDate(start.getDate()-7);            break;
    case 'month':     start.setDate(start.getDate()-30);           break;
    default:          return { start: null, end: null };
  }
  return { start, end: now };
}

// Map action string → user type badge
function getUserType(log) {
  const action = (log.action || '').toUpperCase();
  if (action.includes('REGISTER') || action.includes('COMPLAINT') || action.includes('FEEDBACK'))
    return 'victim';
  if (action.includes('ASSIGN') || action.includes('STATUS') || action.includes('ESCALAT'))
    return 'committee';
  if (!log.performedBy)
    return 'system';
  return 'admin';
}

// Categorize action string for display
function categorizeAction(action) {
  return (action || '–').replace(/_/g, ' ');
}

// Parse details JSON string to readable text
function parseDetails(details) {
  if (!details) return '–';
  try {
    const obj = JSON.parse(details);
    return obj.message || JSON.stringify(obj);
  } catch {
    return details;
  }
}

function formatTimestamp(ts) {
  if (!ts) return '–';
  const date = new Date(ts);
  const diff  = Date.now() - date.getTime();
  if (diff < 3600000)  return `${Math.floor(diff/60000)} mins ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)} hrs ago`;
  return date.toLocaleString();
}

function showTableLoading() {
  document.getElementById('logsTableBody').innerHTML =
    `<tr><td colspan="7" style="text-align:center;padding:30px;color:#aaa;">
       <i class="fas fa-spinner fa-spin"></i> Loading...
     </td></tr>`;
}

function downloadFile(content, fileName, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = fileName; a.click();
  URL.revokeObjectURL(url);
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function showToast(message, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  toast.className     = `toast ${type}`;
  toast.innerHTML     = `<i class="fas ${icons[type]||icons.info}"></i> ${message}`;
  toast.style.display = 'flex';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ─── Expose globals ───────────────────────────────────────────────────────────
window.applyFilters    = applyFilters;
window.applyCustomDate = applyCustomDate;
window.searchLogs      = searchLogs;
window.clearFilters    = clearFilters;
window.viewLogDetails  = viewLogDetails;
window.exportLogs      = exportLogs;
window.changePage      = changePage;
window.closeModal      = closeModal;