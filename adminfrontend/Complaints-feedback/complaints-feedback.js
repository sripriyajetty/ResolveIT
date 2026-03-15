// complaints-feedback.js – wired to Spring Boot backend

// State
let allComplaints  = [];   // all complaints from server
let allFeedback    = [];   // all feedback from server
let filtered       = [];   // after filters

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  showTableLoading();
  await Promise.all([fetchComplaints(), fetchAllFeedback()]);
  applyFilters();
  updateHeaderStats();
});

// ─── Fetch all complaints ─────────────────────────────────────────────────────
// GET /api/complaints  (admin only — endpoint added earlier)
async function fetchComplaints() {
  try {
    const data    = await apiCall('/complaints');
    allComplaints = Array.isArray(data) ? data : (data.content || []);
  } catch (err) {
    showToast('Failed to load complaints: ' + err.message, 'error');
  }
}

// ─── Fetch all feedback ───────────────────────────────────────────────────────
// GET /api/admin/feedback  (new endpoint — see backend patch below)
async function fetchAllFeedback() {
  try {
    const data = await apiCall('/admin/feedback');
    allFeedback = Array.isArray(data) ? data : (data.content || []);
  } catch (err) {
    // Non-fatal — feedback section will just show "no feedback"
    console.warn('Feedback fetch failed:', err.message);
    allFeedback = [];
  }
}

// ─── Header stats ─────────────────────────────────────────────────────────────
function updateHeaderStats() {
  document.getElementById('totalComplaints').textContent = allComplaints.length;
  document.getElementById('totalFeedback').textContent   = allFeedback.length;
}

// ─── Filters ──────────────────────────────────────────────────────────────────
function applyFilters() {
  const statusFilter   = document.getElementById('statusFilter').value;
  const typeFilter     = document.getElementById('typeFilter').value;
  const feedbackFilter = document.getElementById('feedbackFilter').value;
  const searchTerm     = (document.getElementById('searchInput').value || '').toLowerCase();

  // Build a Set of complaintIds that have feedback
  const complaintIdsWithFeedback = new Set(allFeedback.map(f => f.complaint_id || f.complaintId));

  filtered = allComplaints.filter(c => {
    const status      = (c.status || '').toUpperCase();
    const type        = (c.type   || '').toLowerCase();
    const hasFeedback = complaintIdsWithFeedback.has(c.id);

    if (statusFilter !== 'all' && status !== statusFilter.toUpperCase()) return false;
    if (typeFilter   !== 'all' && !type.includes(typeFilter.toLowerCase())) return false;
    if (feedbackFilter === 'with'    && !hasFeedback) return false;
    if (feedbackFilter === 'without' &&  hasFeedback) return false;

    if (searchTerm) {
      const inId   = String(c.id).includes(searchTerm);
      const inType = type.includes(searchTerm);
      const inDesc = (c.description || '').toLowerCase().includes(searchTerm);
      const inTitle= (c.title       || '').toLowerCase().includes(searchTerm);
      if (!inId && !inType && !inDesc && !inTitle) return false;
    }

    return true;
  });

  renderTable(filtered, complaintIdsWithFeedback);
}

// ─── Render table ─────────────────────────────────────────────────────────────
function renderTable(list, complaintIdsWithFeedback) {
  const tbody = document.getElementById('complaintsTableBody');

  if (!list || list.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;padding:30px;color:#aaa;">No complaints found</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(c => {
    const status      = (c.status || 'PENDING').toUpperCase();
    const hasFeedback = complaintIdsWithFeedback
      ? complaintIdsWithFeedback.has(c.id)
      : allFeedback.some(f => (f.complaint_id || f.complaintId) === c.id);

    return `
      <tr>
        <td>#${c.id}</td>
        <td>User #${c.userId || c.user_id}</td>
        <td>${c.title || '–'}</td>
        <td>${c.type  || '–'}</td>
        <td><span class="status-badge status-${status}">${status.replace('_', ' ')}</span></td>
        <td>${formatDate(c.createdAt || c.created_at)}</td>
        <td>
          ${hasFeedback
            ? `<span class="feedback-badge has-feedback"><i class="fas fa-star"></i> Yes</span>`
            : `<span class="feedback-badge no-feedback"><i class="far fa-star"></i> No</span>`
          }
        </td>
        <td>
          <button class="action-btn view-btn" onclick="viewComplaint(${c.id})">
            <i class="fas fa-eye"></i> View
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ─── View complaint + full case history modal ────────────────────────────────
async function viewComplaint(complaintId) {
  // Open modal immediately with loading state
  document.getElementById('complaintDetail').innerHTML =
    '<p style="text-align:center;padding:20px;color:#aaa;"><i class="fas fa-spinner fa-spin"></i> Loading...</p>';
  document.getElementById('feedbackContent').innerHTML = '';
  document.getElementById('detailModal').classList.add('active');

  try {
    // GET /api/admin/complaints/{id}/history
    // Returns: { complaint, assignment, escalations, auditLogs, feedback }
    const h = await apiCall(`/admin/complaints/${complaintId}/history`);
    const c = h.complaint || {};
    const status = (c.status || 'PENDING').toUpperCase();

    // ── Complaint details ──
    document.getElementById('complaintDetail').innerHTML = `
      <div class="detail-grid">
        <div class="detail-item">
          <label>Complaint ID</label>
          <span>#${c.id}</span>
        </div>
        <div class="detail-item">
          <label>Filed By</label>
          <span>User #${c.userId || '–'}</span>
        </div>
        <div class="detail-item">
          <label>Type</label>
          <span>${c.type || '–'}</span>
        </div>
        <div class="detail-item">
          <label>Status</label>
          <span class="status-badge status-${status}">${status.replace('_', ' ')}</span>
        </div>
        <div class="detail-item">
          <label>Incident Date</label>
          <span>${c.incidentDate || '–'}</span>
        </div>
        <div class="detail-item">
          <label>Filed On</label>
          <span>${formatDate(c.createdAt)}</span>
        </div>
        <div class="detail-item full-width">
          <label>Title</label>
          <span>${c.title || '–'}</span>
        </div>
        <div class="detail-item full-width">
          <label>Description</label>
          <span>${c.description || '–'}</span>
        </div>
      </div>

      ${renderCaseHistory(h)}
    `;

    // ── Feedback ──
    const feedbackEl = document.getElementById('feedbackContent');
    const feedbacks  = h.feedback || [];
    if (feedbacks.length === 0) {
      feedbackEl.innerHTML = '<p class="no-feedback-msg">No feedback submitted for this complaint.</p>';
    } else {
      feedbackEl.innerHTML = feedbacks.map(f => `
        <div class="feedback-card">
          <div class="rating">${renderStars(f.rating)}</div>
          <div class="feedback-text">"${f.feedbackText || '–'}"</div>
          <div class="feedback-meta">
            Type: ${f.feedbackType || '–'} &nbsp;|&nbsp; ${formatDate(f.createdAt)}
          </div>
        </div>
      `).join('');
    }

  } catch (err) {
    document.getElementById('complaintDetail').innerHTML =
      `<p style="color:#e74c3c;padding:20px;">Failed to load history: ${err.message}</p>`;
  }
}

// ── Render case history timeline ──────────────────────────────────────────────
function renderCaseHistory(h) {
  // Build a unified timeline from assignment + escalations + audit logs
  const events = [];

  // Assignment
  if (h.assignment) {
    const a = h.assignment;
    events.push({
      time:  a.assignedAt,
      icon:  'fa-user-plus',
      color: '#3498db',
      title: 'Assigned to Committee',
      body:  `${a.committeeMemberName || 'Member #' + a.committeeMemberId}
              ${a.priority ? '· Priority: ' + a.priority : ''}
              ${a.deadline ? '· Deadline: ' + a.deadline : ''}
              ${a.notes    ? '<br><em>' + a.notes + '</em>' : ''}`
    });
  }

  // Escalations
  (h.escalations || []).forEach(e => {
    events.push({
      time:  e.escalatedAt,
      icon:  'fa-exclamation-triangle',
      color: '#e74c3c',
      title: 'Escalated',
      body:  `By: ${e.escalatedByName || 'User #' + e.escalatedBy}
              ${e.reason ? '<br>Reason: ' + e.reason : ''}`
    });
  });

  // Audit logs
  (h.auditLogs || []).forEach(log => {
    events.push({
      time:  log.timestamp,
      icon:  'fa-history',
      color: '#95a5a6',
      title: (log.action || '').replace(/_/g, ' '),
      body:  `By: ${log.performedByName || (log.performedBy ? 'User #' + log.performedBy : 'System')}`
    });
  });

  // Sort by time ascending
  events.sort((a, b) => new Date(a.time) - new Date(b.time));

  if (events.length === 0) return '';

  return `
    <div class="case-history">
      <h4 class="history-title"><i class="fas fa-stream"></i> Case History</h4>
      <div class="timeline">
        ${events.map(ev => `
          <div class="timeline-item">
            <div class="timeline-icon" style="background:${ev.color}">
              <i class="fas ${ev.icon}"></i>
            </div>
            <div class="timeline-content">
              <div class="timeline-event">${ev.title}</div>
              <div class="timeline-body">${ev.body}</div>
              <div class="timeline-time">${formatDate(ev.time)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function renderStars(rating) {
  if (!rating) return '–';
  const filled = Math.round(rating);
  return '★'.repeat(filled) + '☆'.repeat(Math.max(0, 5 - filled));
}

function formatDate(dateStr) {
  if (!dateStr) return '–';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function showTableLoading() {
  document.getElementById('complaintsTableBody').innerHTML =
    `<tr><td colspan="8" style="text-align:center;padding:30px;color:#aaa;">
       <i class="fas fa-spinner fa-spin"></i> Loading...
     </td></tr>`;
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function showToast(message, type = 'info') {
  const toast  = document.getElementById('toast');
  const icons  = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  toast.className     = `toast ${type}`;
  toast.innerHTML     = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
  toast.style.display = 'flex';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ─── Expose globals ───────────────────────────────────────────────────────────
window.applyFilters  = applyFilters;
window.viewComplaint = viewComplaint;
window.closeModal    = closeModal;