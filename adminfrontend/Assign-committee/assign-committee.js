// assign-committee.js – wired to Spring Boot backend

// State
let allComplaints      = [];  // all unassigned/pending complaints from server
let committeeMembers   = [];  // all ROLE_COMMITTEE users
let filteredComplaints = [];  // after filter/search

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setDefaultDeadline();
  await Promise.all([fetchComplaints(), fetchCommitteeMembers()]);
  updateStatistics();
});

// ─── Fetch complaints ─────────────────────────────────────────────────────────
// GET /api/complaints  (admin can see all)
// We show only pending/unassigned ones in the table
async function fetchComplaints() {
  try {
    const data = await apiCall('/complaints');
    allComplaints = Array.isArray(data) ? data : (data.content || []);
    applyFilters();
  } catch (err) {
    document.getElementById('grievancesTableBody').innerHTML =
      `<tr><td colspan="8" style="text-align:center;color:#e74c3c;padding:30px;">
         Failed to load complaints: ${err.message}
       </td></tr>`;
    showToast('Failed to load complaints', 'error');
  }
}

// ─── Fetch committee members ──────────────────────────────────────────────────
// GET /api/admin/users/committee
async function fetchCommitteeMembers() {
  try {
    committeeMembers = await apiCall('/admin/users/committee');
    renderCommitteeGrid();
  } catch (err) {
    document.getElementById('committeeGrid').innerHTML =
      `<p style="color:#e74c3c;">Failed to load committee members: ${err.message}</p>`;
    showToast('Failed to load committee members', 'error');
  }
}

// ─── Statistics ───────────────────────────────────────────────────────────────
function updateStatistics() {
  const unassigned = allComplaints.filter(c =>
    c.status === 'pending' || c.status === 'PENDING'
  ).length;

  document.getElementById('unassignedCount').textContent        = unassigned;
  document.getElementById('availableCommitteeCount').textContent = committeeMembers.length;
}

// ─── Render complaints table ──────────────────────────────────────────────────
function renderComplaintsTable(list) {
  const tbody = document.getElementById('grievancesTableBody');

  if (!list || list.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;padding:30px;color:#aaa;">No grievances pending assignment</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(c => {
    const status     = (c.status || 'pending').toLowerCase();
    const isAssigned = status === 'assigned';
    return `
      <tr>
        <td>#${c.id}</td>
        <td>User #${c.userId}</td>
        <td>${c.type || '–'}</td>
        <td><span class="priority-badge priority-medium">–</span></td>
        <td>${c.incidentDate ? formatDate(c.incidentDate) : formatDate(c.createdAt)}</td>
        <td><span class="status-badge status-${status}">${status.toUpperCase()}</span></td>
        <td>${isAssigned ? '<span style="color:#27ae60;">Assigned</span>' : '<span style="color:#999;">Not Assigned</span>'}</td>
        <td>
          <button class="action-btn ${isAssigned ? 'reassign-btn' : 'assign-btn'}"
                  onclick="openAssignModal(${c.id})">
            <i class="fas fa-${isAssigned ? 'sync-alt' : 'user-plus'}"></i>
            ${isAssigned ? 'Reassign' : 'Assign'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ─── Render committee grid ────────────────────────────────────────────────────
function renderCommitteeGrid() {
  const grid = document.getElementById('committeeGrid');

  if (!committeeMembers || committeeMembers.length === 0) {
    grid.innerHTML = '<p style="color:#aaa;">No committee members found.</p>';
    return;
  }

  grid.innerHTML = committeeMembers.map(m => `
    <div class="committee-card">
      <div class="committee-avatar">
        <i class="fas fa-user-tie"></i>
      </div>
      <div class="committee-info">
        <h4>${m.name}</h4>
        <p>${m.email}</p>
        <span class="status-indicator available">Available</span>
      </div>
    </div>
  `).join('');
}

// ─── Filters ──────────────────────────────────────────────────────────────────
function applyFilters() {
  const typeFilter   = document.getElementById('typeFilter').value;
  const searchTerm   = (document.getElementById('searchInput').value || '').toLowerCase();

  let list = allComplaints.filter(c => {
    const status = (c.status || '').toLowerCase();
    return status === 'pending' || status === 'submitted' || status === 'assigned';
  });

  if (typeFilter !== 'all') {
    list = list.filter(c => (c.type || '').toLowerCase().includes(typeFilter.toLowerCase()));
  }

  if (searchTerm) {
    list = list.filter(c =>
      String(c.id).includes(searchTerm) ||
      (c.type        || '').toLowerCase().includes(searchTerm) ||
      (c.title       || '').toLowerCase().includes(searchTerm) ||
      (c.description || '').toLowerCase().includes(searchTerm)
    );
  }

  filteredComplaints = list;
  renderComplaintsTable(filteredComplaints);
  updateStatistics();
}

function filterGrievances() {
  applyFilters();
}

// ─── Open assign modal ────────────────────────────────────────────────────────
function openAssignModal(complaintId) {
  const complaint = allComplaints.find(c => c.id === complaintId);
  if (!complaint) return;

  document.getElementById('assignGrievanceId').value = complaintId;

  document.getElementById('grievanceInfo').innerHTML = `
    <p><strong>Complaint #${complaint.id}:</strong> ${complaint.title || complaint.type || '–'}</p>
    <p><strong>Type:</strong> ${complaint.type || '–'}</p>
    <p><strong>Status:</strong> ${complaint.status || '–'}</p>
    <p><strong>Description:</strong> ${(complaint.description || '').substring(0, 100)}${complaint.description && complaint.description.length > 100 ? '...' : ''}</p>
  `;

  // Populate committee dropdown
  const select = document.getElementById('committeeSelect');
  select.innerHTML = '<option value="">Choose a member...</option>' +
    committeeMembers.map(m =>
      `<option value="${m.id}">${m.name} — ${m.email}</option>`
    ).join('');

  document.getElementById('assignModal').classList.add('active');
}

// ─── Assign committee ─────────────────────────────────────────────────────────
// POST /api/assignments  — body: { complaintId, committeeMemberId }
async function assignCommittee(event) {
  event.preventDefault();

  const complaintIdRaw       = document.getElementById('assignGrievanceId').value;
  const committeeMemberIdRaw = document.getElementById('committeeSelect').value;

  if (!committeeMemberIdRaw || committeeMemberIdRaw === '') {
    showToast('Please select a committee member', 'error');
    return;
  }
  if (!complaintIdRaw || complaintIdRaw === '') {
    showToast('No complaint selected', 'error');
    return;
  }

  const complaintId       = Number(complaintIdRaw);
  const committeeMemberId = Number(committeeMemberIdRaw);

  if (isNaN(complaintId) || isNaN(committeeMemberId)) {
    showToast('Invalid complaint or committee member ID', 'error');
    return;
  }

  const submitBtn       = event.target.querySelector('.submit-btn');
  submitBtn.textContent = 'Assigning...';
  submitBtn.disabled    = true;

  const notes    = document.getElementById('assignmentNotes').value.trim();
  const priority = document.getElementById('assignmentPriority').value;
  const deadline = document.getElementById('assignmentDeadline').value;


  try {
    // POST /api/assignments
    // Body: { complaintId, committeeMemberId, notes, priority, deadline }
    await apiCall('/assignments', 'POST', {
      complaintId,
      committeeMemberId,
      notes:    notes    || null,
      priority: priority || 'medium',
      deadline: deadline || null
    });

    showToast('Grievance assigned successfully!', 'success');
    closeModal('assignModal');

    // Refresh data
    await fetchComplaints();
    updateStatistics();

  } catch (err) {
    showToast(err.message || 'Failed to assign grievance', 'error');
  } finally {
    submitBtn.textContent = 'Assign Grievance';
    submitBtn.disabled    = false;
  }
}

// ─── Auto assign ──────────────────────────────────────────────────────────────
// Round-robin: assign each unassigned complaint to committee members in turn
async function autoAssignGrievances() {
  const unassigned = allComplaints.filter(c => {
    const s = (c.status || '').toLowerCase();
    return s === 'pending' || s === 'submitted';
  });

  if (unassigned.length === 0) {
    showToast('No unassigned grievances found', 'info');
    closeModal('autoAssignModal');
    return;
  }

  if (committeeMembers.length === 0) {
    showToast('No committee members available', 'error');
    closeModal('autoAssignModal');
    return;
  }

  const submitBtn       = document.querySelector('#autoAssignModal .submit-btn');
  submitBtn.textContent = 'Assigning...';
  submitBtn.disabled    = true;

  let successCount = 0;
  let failCount    = 0;

  for (let i = 0; i < unassigned.length; i++) {
    const complaint       = unassigned[i];
    const member          = committeeMembers[i % committeeMembers.length];
    try {
      await apiCall('/assignments', 'POST', {
        complaintId:       complaint.id,
        committeeMemberId: member.id
      });
      successCount++;
    } catch (err) {
      // Already assigned or other error — skip
      failCount++;
    }
  }

  showToast(
    `Auto-assigned ${successCount} grievance(s)${failCount > 0 ? `, ${failCount} skipped` : ''}`,
    successCount > 0 ? 'success' : 'info'
  );

  closeModal('autoAssignModal');
  submitBtn.textContent = 'Proceed with Auto-Assign';
  submitBtn.disabled    = false;

  await fetchComplaints();
  updateStatistics();
}

function showAutoAssignModal() {
  document.getElementById('autoAssignModal').classList.add('active');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setDefaultDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const val = date.toISOString().split('T')[0];
  const el  = document.getElementById('assignmentDeadline');
  if (el) { el.min = val; el.value = val; }
}

function formatDate(dateStr) {
  if (!dateStr) return '–';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  toast.className     = `toast ${type}`;
  toast.innerHTML     = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
  toast.style.display = 'flex';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ─── Expose globals ───────────────────────────────────────────────────────────
window.filterGrievances      = filterGrievances;
window.openAssignModal        = openAssignModal;
window.assignCommittee        = assignCommittee;
window.showAutoAssignModal    = showAutoAssignModal;
window.autoAssignGrievances   = autoAssignGrievances;
window.closeModal             = closeModal;