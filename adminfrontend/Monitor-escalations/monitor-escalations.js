// monitor-escalations.js – wired to Spring Boot /api/escalations

// State
let allEscalations      = [];  // full list from server
let filteredEscalations = [];  // after tab + filters
let currentTab          = 'pending';

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await fetchEscalations();
});

// ─── Fetch all escalations ────────────────────────────────────────────────────
// GET /api/escalations
// Response: [{ id, complaintId, reason, escalatedBy, escalatedTo,
//              escalatedAt, complaintTitle, escalatedByName, escalatedToName }]
async function fetchEscalations() {
  showLoading();
  try {
    const data       = await apiCall('/escalations');
    allEscalations   = Array.isArray(data) ? data : (data.content || []);
    applyAllFilters();
    updateStatistics();
  } catch (err) {
    document.getElementById('escalationsContainer').innerHTML =
      `<div class="no-data">
         <i class="fas fa-exclamation-circle"></i>
         <p>Failed to load escalations: ${err.message}</p>
       </div>`;
    showToast('Failed to load escalations', 'error');
  }
}

// ─── Statistics ───────────────────────────────────────────────────────────────
// Escalation entity has no priority field — derive from complaint status/age
function updateStatistics() {
  // Use escalation age as proxy: <1 day = critical, <3 days = high, else medium
  const now = Date.now();
  let critical = 0, high = 0, medium = 0;

  allEscalations.forEach(e => {
    const age = (now - new Date(e.escalatedAt).getTime()) / (1000 * 60 * 60); // hours
    if (age < 24)       critical++;
    else if (age < 72)  high++;
    else                medium++;
  });

  document.getElementById('criticalCount').textContent = critical;
  document.getElementById('highCount').textContent     = high;
  document.getElementById('mediumCount').textContent   = medium;
}

// ─── Apply all filters + render ───────────────────────────────────────────────
function applyAllFilters() {
  const timeFilter   = document.getElementById('timeFilter').value;
  const reasonFilter = document.getElementById('reasonFilter').value;
  const searchTerm   = (document.querySelector('.search-box input') || {}).value || '';

  let list = [...allEscalations];

  // Tab filter — derive status from complaint status
  // Since Escalation entity has no status field, we treat all as 'pending'
  // unless the complaint status tells us otherwise
  if (currentTab !== 'all') {
    list = list.filter(e => deriveStatus(e) === currentTab);
  }

  // Time filter
  const now = new Date();
  if (timeFilter !== 'all') {
    const cutoff = new Date(now);
    if (timeFilter === 'today')  cutoff.setHours(0, 0, 0, 0);
    if (timeFilter === 'week')   cutoff.setDate(cutoff.getDate() - 7);
    if (timeFilter === 'month')  cutoff.setMonth(cutoff.getMonth() - 1);
    list = list.filter(e => new Date(e.escalatedAt) >= cutoff);
  }

  // Reason filter — partial match on reason text
  if (reasonFilter !== 'all') {
    list = list.filter(e =>
      (e.reason || '').toLowerCase().includes(reasonFilter.toLowerCase())
    );
  }

  // Search
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    list = list.filter(e =>
      String(e.id).includes(term) ||
      String(e.complaintId).includes(term) ||
      (e.reason            || '').toLowerCase().includes(term) ||
      (e.complaintTitle    || '').toLowerCase().includes(term) ||
      (e.escalatedByName   || '').toLowerCase().includes(term)
    );
  }

  filteredEscalations = list;
  renderEscalations(filteredEscalations);
}

// ─── Render escalation cards ──────────────────────────────────────────────────
function renderEscalations(list) {
  const container = document.getElementById('escalationsContainer');

  if (!list || list.length === 0) {
    container.innerHTML =
      '<div class="no-data"><i class="fas fa-inbox"></i><p>No escalations found</p></div>';
    return;
  }

  container.innerHTML = list.map(e => {
    const status   = deriveStatus(e);
    const priority = derivePriority(e);

    return `
      <div class="escalation-card ${priority}">
        <div class="escalation-header">
          <div class="escalation-title">
            <span class="escalation-id">ESC #${e.id}</span>
            <span class="priority-badge ${priority}">${priority.toUpperCase()}</span>
            <span class="status-badge ${status}">${status.replace('-', ' ').toUpperCase()}</span>
          </div>
          <span class="escalation-time">${timeAgo(e.escalatedAt)}</span>
        </div>

        <div class="escalation-body">
          <div class="escalation-details">
            <p><i class="fas fa-hashtag"></i>
               <strong>Complaint:</strong> #${e.complaintId}
               ${e.complaintTitle ? '— ' + e.complaintTitle : ''}
            </p>
            <p><i class="fas fa-user-tie"></i>
               <strong>Escalated By:</strong> ${e.escalatedByName || 'User #' + e.escalatedBy}
            </p>
            ${e.escalatedToName ? `
              <p><i class="fas fa-arrow-right"></i>
                 <strong>Escalated To:</strong> ${e.escalatedToName}
              </p>` : ''}
            <p><i class="fas fa-exclamation-circle"></i>
               <strong>Reason:</strong> ${e.reason || '–'}
            </p>
            <p><i class="fas fa-calendar"></i>
               <strong>Escalated At:</strong> ${formatDate(e.escalatedAt)}
            </p>
          </div>
        </div>

        <div class="escalation-footer">
          <button class="action-btn action-take-btn" onclick="openActionModal(${e.id})">
            <i class="fas fa-tasks"></i> Take Action
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Tab switching ────────────────────────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.currentTarget.classList.add('active');
  applyAllFilters();
}

function filterByTime()   { applyAllFilters(); }
function filterByReason() { applyAllFilters(); }
function searchEscalations() { applyAllFilters(); }

// ─── Action Modal ─────────────────────────────────────────────────────────────
function openActionModal(escalationId) {
  const esc = allEscalations.find(e => e.id === escalationId);
  if (!esc) return;

  document.getElementById('actionEscalationId').value = escalationId;
  document.getElementById('actionDetails').innerHTML = `
    <div style="background:#f8f9fa;padding:12px;border-radius:8px;margin-bottom:16px;">
      <p><strong>Escalation #${esc.id}</strong> — Complaint #${esc.complaintId}</p>
      ${esc.complaintTitle ? `<p>${esc.complaintTitle}</p>` : ''}
      <p><strong>Reason:</strong> ${esc.reason || '–'}</p>
      <p><strong>By:</strong> ${esc.escalatedByName || 'User #' + esc.escalatedBy}</p>
    </div>
  `;

  // Reset form
  document.getElementById('actionType').value    = '';
  document.getElementById('actionComments').value = '';
  document.getElementById('reassignField').style.display  = 'none';
  document.getElementById('meetingField').style.display   = 'none';

  // Populate reassign dropdown with committee members
  // GET /api/admin/users/committee
  apiCall('/admin/users/committee').then(members => {
    const select = document.getElementById('reassignTo');
    select.innerHTML = '<option value="">Select Committee Member</option>' +
      (members || []).map(m =>
        `<option value="${m.id}">${m.name}</option>`
      ).join('');
  }).catch(() => {});

  document.getElementById('actionModal').classList.add('active');
}

function toggleActionFields() {
  const actionType = document.getElementById('actionType').value;
  document.getElementById('reassignField').style.display  = actionType === 'reassign'          ? 'block' : 'none';
  document.getElementById('meetingField').style.display   = actionType === 'schedule-meeting'  ? 'block' : 'none';
}

// Take action — logs to audit via AdminController update status
// Since Escalation entity has no status field, we update the complaint status
async function takeAction(event) {
  event.preventDefault();

  const escalationId = parseInt(document.getElementById('actionEscalationId').value);
  const actionType   = document.getElementById('actionType').value;
  const comments     = document.getElementById('actionComments').value.trim();

  if (!actionType) {
    showToast('Please select an action type', 'error');
    return;
  }

  const esc = allEscalations.find(e => e.id === escalationId);
  if (!esc) return;

  const submitBtn       = event.target.querySelector('.submit-btn');
  submitBtn.textContent = 'Submitting...';
  submitBtn.disabled    = true;

  try {
    // Map action to complaint status update
    // PUT /api/complaints/{id}/status?status=...
    let newStatus = null;
    if (actionType === 'approve')          newStatus = 'UNDER_REVIEW';
    if (actionType === 'close')            newStatus = 'RESOLVED';
    if (actionType === 'involve-legal')    newStatus = 'ESCALATED';
    if (actionType === 'reassign')         newStatus = 'ASSIGNED';
    if (actionType === 'schedule-meeting') newStatus = 'UNDER_REVIEW';

    if (newStatus) {
      await apiCall(`/complaints/${esc.complaintId}/status?status=${newStatus}`, 'PUT');
    }

    showToast('Action recorded successfully', 'success');
    closeModal('actionModal');
    await fetchEscalations();

  } catch (err) {
    showToast(err.message || 'Failed to record action', 'error');
  } finally {
    submitBtn.textContent = 'Submit Action';
    submitBtn.disabled    = false;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Derive status from escalation age (no status field in entity)
function deriveStatus(e) {
  const age = (Date.now() - new Date(e.escalatedAt).getTime()) / (1000 * 60 * 60);
  if (age < 1)  return 'pending';
  if (age < 48) return 'in-progress';
  return 'resolved';
}

// Derive priority from escalation age
function derivePriority(e) {
  const age = (Date.now() - new Date(e.escalatedAt).getTime()) / (1000 * 60 * 60);
  if (age < 24) return 'critical';
  if (age < 72) return 'high';
  return 'medium';
}

function timeAgo(dateStr) {
  if (!dateStr) return '–';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
  for (let [unit, s] of Object.entries(intervals)) {
    const n = Math.floor(seconds / s);
    if (n >= 1) return n === 1 ? `1 ${unit} ago` : `${n} ${unit}s ago`;
  }
  return 'Just now';
}

function formatDate(dateStr) {
  if (!dateStr) return '–';
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function showLoading() {
  document.getElementById('escalationsContainer').innerHTML =
    `<div class="no-data">
       <i class="fas fa-spinner fa-spin"></i>
       <p>Loading escalations...</p>
     </div>`;
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function showToast(message, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position:fixed;bottom:20px;right:20px;background:white;
      padding:15px 25px;border-radius:8px;box-shadow:0 5px 20px rgba(0,0,0,0.2);
      display:none;align-items:center;gap:10px;z-index:2000;
    `;
    document.body.appendChild(toast);
  }
  const icons  = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  const colors = { success: '#4caf50', error: '#f44336', info: '#2196f3' };
  toast.style.borderLeft  = `4px solid ${colors[type] || colors.info}`;
  toast.style.display     = 'flex';
  toast.innerHTML         = `<i class="fas ${icons[type] || icons.info}" style="color:${colors[type]}"></i> ${message}`;
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ─── Expose globals ───────────────────────────────────────────────────────────
window.switchTab           = switchTab;
window.filterByTime        = filterByTime;
window.filterByReason      = filterByReason;
window.searchEscalations   = searchEscalations;
window.openActionModal     = openActionModal;
window.toggleActionFields  = toggleActionFields;
window.takeAction          = takeAction;
window.closeModal          = closeModal;