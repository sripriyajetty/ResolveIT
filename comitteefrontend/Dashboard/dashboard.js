// dashboard.js – Committee Member Dashboard
// Wired to Spring Boot APIs:
//   GET  /api/assignments/committee/{userId}  → AssignmentResponse[]
//   GET  /api/complaints/{id}                 → Complaint (fetched per assignment)
//   PUT  /api/complaints/{id}/status?status=  → update status
//   POST /api/escalations                     → escalate
// ─────────────────────────────────────────────────────────────────────

// ── Auth guard ────────────────────────────────────────────────────────
const token    = localStorage.getItem('token');
const userRole = localStorage.getItem('userRole');
const userId   = localStorage.getItem('userId');
const userName = localStorage.getItem('userName') || 'Committee Member';

if (!token || userRole !== 'ROLE_COMMITTEE') {
  window.location.href = '../Login/login.html';
}

// ── State ─────────────────────────────────────────────────────────────
let grievances    = [];   // enriched list: AssignmentResponse + Complaint fields merged
let activeTab     = 'dashboard';
let currentFilter = 'all';

// ── Boot ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('memberName').textContent = userName;
  await loadGrievances();
  switchTab('dashboard');
});

// ═════════════════════════════════════════════════════════════════════
// DATA LAYER
// ═════════════════════════════════════════════════════════════════════

/**
 * Load assignments then enrich each with full complaint details.
 * We need GET /api/complaints/{id} because AssignmentResponse only
 * carries complaintId, complaintTitle — no status, priority, type, date.
 *
 * NOTE: GET /api/complaints/{id} has a security check that only lets a
 * user view their OWN complaint. You will need to either:
 *   (a) Add a committee-accessible endpoint e.g. GET /api/complaints/{id}/detail
 *       with @PreAuthorize("hasAnyRole('COMMITTEE','ADMIN')")
 *   (b) Or remove the userId equality check for COMMITTEE role inside
 *       the existing getComplaintById method.
 * Until then, the table will fall back to showing whatever AssignmentResponse provides.
 */
async function loadGrievances() {
  try {
    const assignments = await apiCall(`/assignments/committee/${userId}`, 'GET');

    // Enrich each assignment with full complaint details in parallel
    grievances = await Promise.all(
      assignments.map(async (a) => {
        try {
          const complaint = await apiCall(`/complaints/${a.complaintId}/detail`, 'GET');
          return {
            // Assignment fields
            assignmentId:        a.id,
            assignedAt:          a.assignedAt,
            committeeMemberName: a.committeeMemberName,
            // Complaint fields
            id:          String(a.complaintId),
            complaintId: a.complaintId,
            title:       complaint.title                                    || a.complaintTitle || `Case #${a.complaintId}`,
            date:        complaint.createdAt   || complaint.created_at      || complaint.incidentDate || complaint.incident_date || a.assignedAt,
            type:        complaint.type        || complaint.category        || 'Not specified',
            description: complaint.description || '',
            status:      (complaint.status     || 'PENDING').toUpperCase().replace(/-/g,'_'),
            priority:    (complaint.priority   || 'MEDIUM').toUpperCase(),
            comments:    complaint.comments    || [],
          };
        } catch {
          // Complaint detail fetch failed (likely 403 until backend is fixed)
          // Fall back to assignment-only data
          return {
            assignmentId: a.id,
            assignedAt:   a.assignedAt,
            id:           String(a.complaintId),
            complaintId:  a.complaintId,
            title:        a.complaintTitle || `Case #${a.complaintId}`,
            date:         a.assignedAt,
            type:         'Not specified',
            description:  '',
            status:       'PENDING',
            priority:     'MEDIUM',
            comments:     [],
          };
        }
      })
    );

  } catch (err) {
    console.error('Failed to load assignments:', err);
    grievances = [];
    showToast('Failed to load assignments: ' + (err.message || 'Unknown error'), 'error');
  }
}

async function apiUpdateStatus(complaintId, status) {
  return apiCall(
    `/complaints/${complaintId}/status?status=${encodeURIComponent(status)}`,
    'PUT'
  );
}

async function apiEscalate(complaintId, reason, escalatedTo) {
  return apiCall('/escalations', 'POST', { complaintId, reason, escalatedTo });
}

// ═════════════════════════════════════════════════════════════════════
// TAB ROUTING
// ═════════════════════════════════════════════════════════════════════

function switchTab(tab) {
  activeTab = tab;
  currentFilter = 'all';

  document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
  const tabOrder = ['dashboard','assigned','escalated','resolved','analytics','feedback'];
  const idx = tabOrder.indexOf(tab);
  const items = document.querySelectorAll('.sidebar-menu li');
  if (idx >= 0 && items[idx]) items[idx].classList.add('active');

  const main = document.getElementById('mainContent');
  switch (tab) {
    case 'dashboard': loadDashboard(main);          break;
    case 'assigned':  loadAssignedGrievances(main); break;
    case 'escalated': loadEscalatedCases(main);     break;
    case 'resolved':  loadResolvedCases(main);      break;
    case 'analytics': loadAnalytics(main);          break;
    case 'feedback':  loadFeedback(main);           break;
    default:          loadDashboard(main);
  }
}

// ═════════════════════════════════════════════════════════════════════
// TAB: DASHBOARD
// ═════════════════════════════════════════════════════════════════════

function loadDashboard(main) {
  const assigned     = grievances;
  const pending      = assigned.filter(g => matchStatus(g, ['PENDING','OPEN'])).length;
  const investigating = assigned.filter(g => matchStatus(g, ['INVESTIGATING','UNDER_REVIEW','IN_PROGRESS'])).length;
  const escalated    = assigned.filter(g => matchStatus(g, ['ESCALATED'])).length;
  const resolved     = assigned.filter(g => matchStatus(g, ['RESOLVED','CLOSED','ACTION_TAKEN'])).length;
  const recent       = [...assigned]
    .sort((a, b) => new Date(b.assignedAt || 0) - new Date(a.assignedAt || 0))
    .slice(0, 5);

  main.innerHTML = `
    <div class="stats-container">
      ${statCard('Total Assigned', assigned.length, 'fa-tasks')}
      ${statCard('Pending',        pending,         'fa-clock')}
      ${statCard('Investigating',  investigating,   'fa-search')}
      ${statCard('Escalated',      escalated,       'fa-exclamation-triangle')}
      ${statCard('Resolved',       resolved,        'fa-check-circle')}
    </div>

    <div class="grievances-section">
      <div class="section-header">
        <h2>Recent Grievances</h2>
        <div class="filter-options">
          <button class="filter-btn active" onclick="filterGrievances('all',event)">All</button>
          <button class="filter-btn" onclick="filterGrievances('pending',event)">Pending</button>
          <button class="filter-btn" onclick="filterGrievances('investigating',event)">Investigating</button>
          <button class="filter-btn" onclick="filterGrievances('escalated',event)">Escalated</button>
        </div>
      </div>

      <div class="search-bar">
        <input type="text" id="searchInput" placeholder="Search by ID, type, or status...">
        <button onclick="searchGrievances()"><i class="fas fa-search"></i> Search</button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Assigned On</th>
              <th>Type</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="grievancesTableBody">
            ${renderTableRows(recent)}
          </tbody>
        </table>
      </div>
    </div>`;
}

// ═════════════════════════════════════════════════════════════════════
// TAB: MY ASSIGNED GRIEVANCES
// ═════════════════════════════════════════════════════════════════════

function loadAssignedGrievances(main) {
  const active = grievances.filter(g =>
    !matchStatus(g, ['RESOLVED','CLOSED','ACTION_TAKEN','ESCALATED'])
  );

  main.innerHTML = `
    <div class="grievances-section">
      <div class="section-header">
        <h2><i class="fas fa-tasks"></i> My Assigned Grievances</h2>
        <div class="filter-options">
          <button class="filter-btn active" onclick="filterGrievances('all',event)">All</button>
          <button class="filter-btn" onclick="filterGrievances('pending',event)">Pending</button>
          <button class="filter-btn" onclick="filterGrievances('investigating',event)">Investigating</button>
          <button class="filter-btn" onclick="filterGrievances('escalated',event)">Escalated</button>
        </div>
      </div>

      <div class="search-bar">
        <input type="text" id="searchInput" placeholder="Search by ID, type, or status...">
        <button onclick="searchGrievances()"><i class="fas fa-search"></i> Search</button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Assigned On</th>
              <th>Type</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="grievancesTableBody">
            ${renderTableRows(active)}
          </tbody>
        </table>
      </div>
    </div>`;
}

// ═════════════════════════════════════════════════════════════════════
// TAB: ESCALATED CASES
// ═════════════════════════════════════════════════════════════════════

function loadEscalatedCases(main) {
  const escalated = grievances.filter(g => matchStatus(g, ['ESCALATED']));

  main.innerHTML = `
    <div class="grievances-section">
      <div class="section-header">
        <h2><i class="fas fa-exclamation-triangle"></i> Escalated Cases</h2>
        <div class="stats-container" style="margin-bottom:0">
          ${statCard('Total Escalated', escalated.length, 'fa-exclamation-triangle', true)}
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Date</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Escalated To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${escalated.length === 0
              ? '<tr><td colspan="7" style="text-align:center;padding:2rem">No escalated cases</td></tr>'
              : escalated.map(g => `
                <tr>
                  <td>#${g.complaintId}</td>
                  <td>${g.title}</td>
                  <td>${formatDate(g.date)}</td>
                  <td>${g.type}</td>
                  <td><span class="status-badge priority-${g.priority.toLowerCase()}">${g.priority}</span></td>
                  <td>Admin</td>
                  <td>
                    <div class="action-buttons">
                      <button class="action-btn view-btn" onclick="viewGrievance('${g.id}')">
                        <i class="fas fa-eye"></i> View
                      </button>
                    </div>
                  </td>
                </tr>`).join('')
            }
          </tbody>
        </table>
      </div>
    </div>`;
}

// ═════════════════════════════════════════════════════════════════════
// TAB: RESOLVED CASES
// ═════════════════════════════════════════════════════════════════════

function loadResolvedCases(main) {
  const resolved = grievances.filter(g =>
    matchStatus(g, ['RESOLVED','CLOSED','ACTION_TAKEN'])
  );

  main.innerHTML = `
    <div class="grievances-section">
      <div class="section-header">
        <h2><i class="fas fa-check-circle"></i> Resolved Cases</h2>
        <div class="stats-container" style="margin-bottom:0">
          ${statCard('Total Resolved', resolved.length, 'fa-check-circle', true)}
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Date Filed</th>
              <th>Type</th>
              <th>Resolution Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${resolved.length === 0
              ? '<tr><td colspan="6" style="text-align:center;padding:2rem">No resolved cases yet</td></tr>'
              : resolved.map(g => `
                <tr>
                  <td>#${g.complaintId}</td>
                  <td>${g.title}</td>
                  <td>${formatDate(g.date)}</td>
                  <td>${g.type}</td>
                  <td><span class="status-badge status-${statusClass(g.status)}">${formatStatus(g.status)}</span></td>
                  <td>
                    <div class="action-buttons">
                      <button class="action-btn view-btn" onclick="viewGrievance('${g.id}')">
                        <i class="fas fa-eye"></i> View
                      </button>
                    </div>
                  </td>
                </tr>`).join('')
            }
          </tbody>
        </table>
      </div>
    </div>`;
}

// ═════════════════════════════════════════════════════════════════════
// TAB: ANALYTICS (charts only here)
// ═════════════════════════════════════════════════════════════════════

function loadAnalytics(main) {
  // Count by status
  const statusBuckets = {
    Pending:       grievances.filter(g => matchStatus(g, ['PENDING','OPEN'])).length,
    Investigating: grievances.filter(g => matchStatus(g, ['INVESTIGATING','UNDER_REVIEW','IN_PROGRESS'])).length,
    Resolved:      grievances.filter(g => matchStatus(g, ['RESOLVED','CLOSED','ACTION_TAKEN'])).length,
    Escalated:     grievances.filter(g => matchStatus(g, ['ESCALATED'])).length,
  };

  // Count by priority
  const priorityBuckets = {
    High:   grievances.filter(g => g.priority === 'HIGH').length,
    Medium: grievances.filter(g => g.priority === 'MEDIUM').length,
    Low:    grievances.filter(g => g.priority === 'LOW').length,
  };

  // Count by type (top 5)
  const typeCounts = {};
  grievances.forEach(g => {
    const t = g.type || 'Not specified';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const typeLabels = Object.keys(typeCounts).slice(0, 5);
  const typeData   = typeLabels.map(t => typeCounts[t]);

  // Metrics
  const avgRating    = '—';   // no GET feedback endpoint for committee
  const highPriority = priorityBuckets.High;
  const totalEsc     = statusBuckets.Escalated;
  const totalRes     = statusBuckets.Resolved;

  main.innerHTML = `
    <h2 style="margin-bottom:1.5rem"><i class="fas fa-chart-bar"></i> Analytics Dashboard</h2>

    <div class="analytics-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px">
      ${analyticsCard('Total Assigned',    grievances.length,  'all cases')}
      ${analyticsCard('High Priority',     highPriority,       'need immediate attention')}
      ${analyticsCard('Pending Escalations', totalEsc,         'awaiting higher authority')}
      ${analyticsCard('Resolved',          totalRes,           'cases closed')}
    </div>

    <div class="charts-row">
      <div class="chart-container">
        <h3>Grievance Status Distribution</h3>
        <canvas id="statusChart"></canvas>
      </div>
      <div class="chart-container">
        <h3>Priority Distribution</h3>
        <canvas id="priorityChart"></canvas>
      </div>
    </div>

    <div class="charts-row" style="margin-top:24px">
      <div class="chart-container">
        <h3>Grievance Types</h3>
        <canvas id="typeChart"></canvas>
      </div>
    </div>`;

  setTimeout(() => {
    renderDoughnut('statusChart',
      Object.keys(statusBuckets), Object.values(statusBuckets),
      ['#ffc107','#17a2b8','#28a745','#dc3545']
    );
    renderBar('priorityChart',
      ['High','Medium','Low'],
      [priorityBuckets.High, priorityBuckets.Medium, priorityBuckets.Low],
      ['#dc3545','#ffc107','#28a745']
    );
    if (typeLabels.length > 0) {
      renderPie('typeChart', typeLabels, typeData,
        ['#ff6384','#36a2eb','#ffce56','#4bc0c0','#9966ff']
      );
    }
  }, 50);
}

function renderDoughnut(id, labels, data, colors) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  const existing = Chart.getChart(ctx);
  if (existing) existing.destroy();
  new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } } }
  });
}

function renderBar(id, labels, data, colors) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  const existing = Chart.getChart(ctx);
  if (existing) existing.destroy();
  new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Number of Cases', data, backgroundColor: colors }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function renderPie(id, labels, data, colors) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  const existing = Chart.getChart(ctx);
  if (existing) existing.destroy();
  new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data, backgroundColor: colors }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } } }
  });
}

// ═════════════════════════════════════════════════════════════════════
// TAB: VICTIM FEEDBACK
// ═════════════════════════════════════════════════════════════════════

function loadFeedback(main) {
  // No GET /api/feedback endpoint exists for committee members.
  // Show resolved cases the member handled — feedback visible to admin only.
  const resolvedCases = grievances.filter(g =>
    matchStatus(g, ['RESOLVED','CLOSED','ACTION_TAKEN'])
  );

  main.innerHTML = `
    <div class="grievances-section">
      <div class="section-header">
        <h2><i class="fas fa-comment"></i> Victim Feedback</h2>
      </div>
      <div class="info-banner" style="background:#e8f4f8;border-left:4px solid #17a2b8;padding:12px 16px;border-radius:4px;margin-bottom:20px;color:#444">
        <i class="fas fa-info-circle" style="color:#17a2b8"></i>
        Victim feedback is submitted directly by the victim after resolution and is visible
        to admins in their reporting panel. The cases below are your resolved grievances
        where feedback may have been submitted.
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Type</th>
              <th>Resolution Status</th>
              <th>Assigned On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${resolvedCases.length === 0
              ? '<tr><td colspan="6" style="text-align:center;padding:2rem">No resolved cases yet</td></tr>'
              : resolvedCases.map(g => `
                <tr>
                  <td>#${g.complaintId}</td>
                  <td>${g.title}</td>
                  <td>${g.type}</td>
                  <td><span class="status-badge status-${statusClass(g.status)}">${formatStatus(g.status)}</span></td>
                  <td>${formatDate(g.assignedAt)}</td>
                  <td>
                    <button class="action-btn view-btn" onclick="viewGrievance('${g.id}')">
                      <i class="fas fa-eye"></i> View
                    </button>
                  </td>
                </tr>`).join('')
            }
          </tbody>
        </table>
      </div>
    </div>`;
}

// ═════════════════════════════════════════════════════════════════════
// TABLE RENDERER
// ═════════════════════════════════════════════════════════════════════

function renderTableRows(list) {
  if (!list || list.length === 0) {
    return '<tr><td colspan="7" style="text-align:center;padding:2rem">No grievances found</td></tr>';
  }
  return list.map(g => `
    <tr>
      <td>#${g.complaintId}</td>
      <td>${g.title}</td>
      <td>${formatDate(g.date || g.assignedAt)}</td>
      <td>${g.type}</td>
      <td>
        <span class="status-badge status-${statusClass(g.status)}">
          ${formatStatus(g.status)}
        </span>
      </td>
      <td>
        <span class="status-badge priority-${g.priority.toLowerCase()}">
          ${g.priority}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="action-btn view-btn" onclick="viewGrievance('${g.id}')">
            <i class="fas fa-eye"></i> View
          </button>
          ${!matchStatus(g, ['RESOLVED','CLOSED','ESCALATED']) ? `
          <button class="action-btn update-btn" onclick="openUpdateModal('${g.id}')">
            <i class="fas fa-edit"></i> Update
          </button>` : ''}
          ${!matchStatus(g, ['ESCALATED','RESOLVED','CLOSED']) ? `
          <button class="action-btn escalate-btn" onclick="openEscalateModal('${g.id}')">
            <i class="fas fa-level-up-alt"></i> Escalate
          </button>` : ''}
        </div>
      </td>
    </tr>`).join('');
}

// ═════════════════════════════════════════════════════════════════════
// GRIEVANCE DETAIL MODAL
// ═════════════════════════════════════════════════════════════════════

function viewGrievance(id) {
  const g = grievances.find(x => x.id === id);
  if (!g) return;

  document.getElementById('grievanceDetails').innerHTML = `
    <div class="grievance-detail">
      <div class="detail-row">
        <span class="detail-label">ID:</span>
        <span class="detail-value">#${g.complaintId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Title:</span>
        <span class="detail-value">${g.title}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Type:</span>
        <span class="detail-value">${g.type}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date Filed:</span>
        <span class="detail-value">${formatDate(g.date)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Assigned On:</span>
        <span class="detail-value">${formatDate(g.assignedAt)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="detail-value">
          <span class="status-badge status-${statusClass(g.status)}">${formatStatus(g.status)}</span>
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Priority:</span>
        <span class="detail-value">
          <span class="status-badge priority-${g.priority.toLowerCase()}">${g.priority}</span>
        </span>
      </div>
      ${g.description ? `
      <div class="detail-row">
        <span class="detail-label">Description:</span>
        <span class="detail-value">${g.description}</span>
      </div>` : ''}
      ${g.comments && g.comments.length > 0 ? `
      <div class="detail-row">
        <span class="detail-label">Comments:</span>
        <span class="detail-value">
          ${g.comments.map(c => `<div>• ${c}</div>`).join('')}
        </span>
      </div>` : ''}
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      ${!matchStatus(g, ['RESOLVED','CLOSED','ESCALATED']) ? `
      <button class="action-btn update-btn"
        onclick="closeModal(); openUpdateModal('${g.id}')">
        <i class="fas fa-edit"></i> Update Status
      </button>` : ''}
      ${!matchStatus(g, ['ESCALATED','RESOLVED','CLOSED']) ? `
      <button class="action-btn escalate-btn"
        onclick="closeModal(); openEscalateModal('${g.id}')">
        <i class="fas fa-level-up-alt"></i> Escalate
      </button>` : ''}
    </div>`;

  document.getElementById('grievanceModal').classList.add('active');
}

function closeModal() {
  document.getElementById('grievanceModal').classList.remove('active');
}

// ═════════════════════════════════════════════════════════════════════
// UPDATE STATUS MODAL
// ═════════════════════════════════════════════════════════════════════

function openUpdateModal(id) {
  const g = grievances.find(x => x.id === id);
  if (!g) return;

  document.getElementById('updateGrievanceId').value = id;

  // Map backend status → select option value
  const statusMap = {
    PENDING: 'pending', OPEN: 'pending',
    UNDER_REVIEW: 'under-review',
    INVESTIGATING: 'investigating',
    ACTION_TAKEN: 'action-taken',
    RESOLVED: 'resolved',
    CLOSED: 'closed'
  };
  document.getElementById('statusSelect').value   = statusMap[g.status] || 'pending';
  document.getElementById('prioritySelect').value = g.priority.toLowerCase();
  document.getElementById('remarks').value        = '';

  document.getElementById('updateModal').classList.add('active');
}

function closeUpdateModal() {
  document.getElementById('updateModal').classList.remove('active');
}

async function updateStatus(event) {
  event.preventDefault();

  const id     = document.getElementById('updateGrievanceId').value;
  const status = document.getElementById('statusSelect').value;
  const btn    = event.target.querySelector('button[type="submit"]');

  btn.disabled    = true;
  btn.textContent = 'Updating...';

  try {
    const g = grievances.find(x => x.id === id);
    await apiUpdateStatus(g.complaintId, status);

    // Update local state immediately — no need to reload all assignments
    grievances = grievances.map(x =>
      x.id === id
        ? { ...x, status: status.toUpperCase().replace(/-/g, '_') }
        : x
    );

    closeUpdateModal();
    showToast('Grievance status updated successfully!', 'success');
    switchTab(activeTab);

  } catch (err) {
    showToast('Failed to update: ' + (err.message || 'Unknown error'), 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Update Status';
  }
}

// ═════════════════════════════════════════════════════════════════════
// ESCALATE MODAL
// ═════════════════════════════════════════════════════════════════════

function openEscalateModal(id) {
  document.getElementById('escalateGrievanceId').value = id;
  document.getElementById('escalateForm').reset();
  document.getElementById('escalateModal').classList.add('active');
}

function closeEscalateModal() {
  document.getElementById('escalateModal').classList.remove('active');
}

async function escalateGrievance(event) {
  event.preventDefault();

  const id          = document.getElementById('escalateGrievanceId').value;
  const reason      = document.getElementById('escalationReason').value;
  const escalatedTo = document.getElementById('escalateTo').value;
  const details     = document.getElementById('escalationDetails').value.trim();
  const btn         = event.target.querySelector('button[type="submit"]');

  if (!details) {
    showToast('Please provide a detailed explanation.', 'error');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Escalating...';

  try {
    const g = grievances.find(x => x.id === id);
    // POST /api/escalations — body: { complaintId, reason, escalatedTo }
    // Details are appended to reason since EscalationRequest has no separate field
    await apiEscalate(g.complaintId, `${reason}: ${details}`, escalatedTo);

    grievances = grievances.map(x =>
      x.id === id ? { ...x, status: 'ESCALATED' } : x
    );

    closeEscalateModal();
    showToast('Grievance escalated successfully!', 'success');
    switchTab(activeTab);

  } catch (err) {
    showToast('Failed to escalate: ' + (err.message || 'Unknown error'), 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Escalate Grievance';
  }
}

// ═════════════════════════════════════════════════════════════════════
// FILTER + SEARCH
// ═════════════════════════════════════════════════════════════════════

function filterGrievances(status, event) {
  if (event) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
  }
  currentFilter = status;

  let filtered = activeTab === 'assigned'
    ? grievances.filter(g => !matchStatus(g, ['RESOLVED','CLOSED','ACTION_TAKEN','ESCALATED']))
    : grievances;

  if (status !== 'all') {
    if (status === 'investigating') {
      filtered = filtered.filter(g => matchStatus(g, ['INVESTIGATING','UNDER_REVIEW','IN_PROGRESS']));
    } else {
      filtered = filtered.filter(g => g.status.toLowerCase() === status);
    }
  }

  const body = document.getElementById('grievancesTableBody');
  if (body) body.innerHTML = renderTableRows(filtered);
}

function searchGrievances() {
  const term = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const filtered = grievances.filter(g =>
    String(g.complaintId).includes(term) ||
    (g.title  || '').toLowerCase().includes(term) ||
    (g.type   || '').toLowerCase().includes(term) ||
    (g.status || '').toLowerCase().includes(term)
  );
  const body = document.getElementById('grievancesTableBody');
  if (body) body.innerHTML = renderTableRows(filtered);
}

// ═════════════════════════════════════════════════════════════════════
// LOGOUT
// ═════════════════════════════════════════════════════════════════════

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    showToast('Logging out...', 'info');
    ['token','userId','userName','userRole','userEmail'].forEach(k =>
      localStorage.removeItem(k)
    );
    setTimeout(() => { window.location.href = '../Login/login.html'; }, 1500);
  }
}

// ═════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════

function matchStatus(g, statusList) {
  const s = (g.status || '').toUpperCase().replace(/-/g,'_');
  return statusList.map(x => x.toUpperCase()).includes(s);
}

function formatStatus(status) {
  return (status || 'Unknown')
    .replace(/_/g,' ')
    .replace(/-/g,' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function statusClass(status) {
  const map = {
    PENDING:'pending', OPEN:'pending',
    UNDER_REVIEW:'underreview', INVESTIGATING:'investigating',
    ACTION_TAKEN:'actiontaken', RESOLVED:'resolved',
    CLOSED:'resolved', ESCALATED:'escalated'
  };
  return map[(status||'').toUpperCase().replace(/-/g,'_')] || 'pending';
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return dateStr; }
}

function statCard(label, value, icon, compact = false) {
  const style = compact ? 'style="padding:1rem"' : '';
  const iconStyle = compact ? 'style="width:40px;height:40px;font-size:1.2rem"' : '';
  return `
    <div class="stat-card" ${style}>
      <div class="stat-info">
        <h3>${label}</h3>
        <div class="stat-number">${value}</div>
      </div>
      <div class="stat-icon" ${iconStyle}>
        <i class="fas ${icon}"></i>
      </div>
    </div>`;
}

function analyticsCard(label, value, sub) {
  return `
    <div class="analytics-card">
      <h3>${label}</h3>
      <div class="analytics-value">${value}</div>
      <div class="analytics-label">${sub}</div>
    </div>`;
}

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
    <span>${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Close modals on outside click
window.addEventListener('click', e => {
  if (e.target.id === 'grievanceModal') closeModal();
  if (e.target.id === 'updateModal')    closeUpdateModal();
  if (e.target.id === 'escalateModal')  closeEscalateModal();
});

// Expose globals called from inline HTML onclick handlers
window.switchTab        = switchTab;
window.viewGrievance    = viewGrievance;
window.openUpdateModal  = openUpdateModal;
window.updateStatus     = updateStatus;
window.openEscalateModal  = openEscalateModal;
window.escalateGrievance  = escalateGrievance;
window.closeModal         = closeModal;
window.closeUpdateModal   = closeUpdateModal;
window.closeEscalateModal = closeEscalateModal;
window.filterGrievances   = filterGrievances;
window.searchGrievances   = searchGrievances;
window.logout             = logout;