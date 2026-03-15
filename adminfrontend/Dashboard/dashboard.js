(function () {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('userRole');
  if (!token || role !== 'ROLE_ADMIN') {
    window.location.href = '../Login/login.html';
  }
})();

// --- Set admin name from localStorage ---
document.addEventListener('DOMContentLoaded', function () {
  const nameEl = document.getElementById('adminName');
  if (nameEl) {
    nameEl.textContent = localStorage.getItem('userName') || 'Admin';
  }
  loadDashboard();
});

// --- Module Loader ---
function loadModule(moduleName) {
  document.querySelectorAll('.sidebar-menu li').forEach(item => {
    item.classList.remove('active');
  });
  event.currentTarget.classList.add('active');

  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Loading...</div>';

  setTimeout(() => {
    switch (moduleName) {
      case 'dashboard':           loadDashboard();           break;
      case 'manage-users':        loadManageUsers();         break;
      case 'assign-committee':    loadAssignCommittee();     break;
      case 'monitor-escalations': loadMonitorEscalations();  break;
      case 'complaints-feedback': loadComplaintsFeedback();  break;
      case 'view-reports':        loadViewReports();         break;
      case 'audit-logs':          loadAuditLogs();           break;
    }
  }, 300);
}
window.loadComplaintsFeedback = loadComplaintsFeedback;
function loadComplaintsFeedback() {
   document.getElementById('mainContent').innerHTML ='<iframe src="../Complaints-feedback/complaints-feedback.html" style="width:100%;height:100%;border:none;min-height:80vh;"></iframe>';
 }
// --- Dashboard Overview (built from multiple API calls) ---
async function loadDashboard() {
  const mainContent = document.getElementById('mainContent');

  // Default fallback values
  const data = {
    totalUsers:         '--',
    activeGrievances:   '--',
    pendingAssignments: '--',
    escalatedCases:     '--',
    committeeMembers:   '--',
    resolutionRate:     '--'
  };

  // 1. Complaints by status  →  GET /api/admin/reports/complaints-by-status
  // Response: { "SUBMITTED": 10, "UNDER_REVIEW": 5, "RESOLVED": 40, "ESCALATED": 3, ... }
  try {
    const statusMap = await apiCall('/admin/reports/complaints-by-status');
    const total     = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const resolved  = statusMap['RESOLVED']  || statusMap['Resolved']  || 0;
    const escalated = statusMap['ESCALATED'] || statusMap['Escalated'] || 0;
    const pending   = statusMap['SUBMITTED'] || statusMap['Submitted'] || statusMap['PENDING'] || 0;

    data.activeGrievances   = total - resolved;
    data.pendingAssignments = pending;
    data.escalatedCases     = escalated;
    data.resolutionRate     = total > 0 ? Math.round((resolved / total) * 100) + '%' : '0%';
  } catch (err) {
    console.warn('Complaints stats error:', err.message);
  }

  // 2. All users count  →  GET /api/admin/users
  try {
    const users = await apiCall('/admin/users');
    data.totalUsers = Array.isArray(users) ? users.length
                    : (users.totalElements ?? '--');
  } catch (err) {
    console.warn('Users fetch error:', err.message);
  }

  // 3. Committee members count  →  GET /api/admin/users/committee
  try {
    const committee = await apiCall('/admin/users/committee');
    data.committeeMembers = Array.isArray(committee) ? committee.length : '--';
  } catch (err) {
    console.warn('Committee fetch error:', err.message);
  }

  // 3. Recent audit logs  →  GET /api/admin/audit-logs?page=0&size=5
  let recentActivitiesHTML = '';
  try {
    const logs    = await apiCall('/admin/audit-logs?page=0&size=5');
    const entries = Array.isArray(logs) ? logs : (logs.content || []);
    if (entries.length > 0) {
      recentActivitiesHTML = entries.map(log => `
        <div class="activity-item">
          <i class="fas fa-circle"></i>
          <div>
            <p>${log.action || log.description || 'Action performed'}</p>
            <small>${formatTime(log.timestamp || log.createdAt)} by ${log.performedBy || log.adminName || 'Admin'}</small>
          </div>
        </div>
      `).join('');
    } else {
      recentActivitiesHTML = '<p style="color:#aaa;font-size:0.95rem;">No recent activity found.</p>';
    }
  } catch (err) {
    recentActivitiesHTML = generateFallbackActivities();
  }

  mainContent.innerHTML = `
    <h2>Dashboard Overview</h2>
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-info">
          <h3>Total Users</h3>
          <div class="stat-number">${data.totalUsers}</div>
        </div>
        <div class="stat-icon"><i class="fas fa-users"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <h3>Active Grievances</h3>
          <div class="stat-number">${data.activeGrievances}</div>
        </div>
        <div class="stat-icon"><i class="fas fa-exclamation-circle"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <h3>Pending Assignments</h3>
          <div class="stat-number">${data.pendingAssignments}</div>
        </div>
        <div class="stat-icon"><i class="fas fa-clock"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <h3>Escalated Cases</h3>
          <div class="stat-number">${data.escalatedCases}</div>
        </div>
        <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <h3>Committee Members</h3>
          <div class="stat-number">${data.committeeMembers}</div>
        </div>
        <div class="stat-icon"><i class="fas fa-user-tie"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <h3>Resolution Rate</h3>
          <div class="stat-number">${data.resolutionRate}</div>
        </div>
        <div class="stat-icon"><i class="fas fa-chart-pie"></i></div>
      </div>
    </div>
    <div class="recent-activities">
      <h3>Recent Activities</h3>
      <div class="activity-list">
        ${recentActivitiesHTML}
      </div>
    </div>
  `;
}

// --- Fallback activity list ---
function generateFallbackActivities() {
  const activities = [
    { time: '–', action: 'New committee member added', user: 'Admin' },
    { time: '–', action: 'Grievance escalated',        user: 'Committee' },
    { time: '–', action: 'User account blocked',       user: 'Admin' },
    { time: '–', action: 'New grievance filed',        user: 'Victim' }
  ];
  return activities.map(a => `
    <div class="activity-item">
      <i class="fas fa-circle"></i>
      <div>
        <p>${a.action}</p>
        <small>${a.time} by ${a.user}</small>
      </div>
    </div>
  `).join('');
}

// --- Helper: format ISO timestamp ---
function formatTime(ts) {
  if (!ts) return '–';
  const date = new Date(ts);
  const diff  = Math.floor((Date.now() - date) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  return date.toLocaleDateString();
}

// --- Module loaders ---
function loadManageUsers() {
  document.getElementById('mainContent').innerHTML =
    '<iframe src="../Manage-users/manage-users.html" style="width:100%;height:100%;border:none;min-height:80vh;"></iframe>';
}

function loadAssignCommittee() {
  document.getElementById('mainContent').innerHTML =
    '<iframe src="../Assign-committee/assign-committee.html" style="width:100%;height:100%;border:none;min-height:80vh;"></iframe>';
}

function loadMonitorEscalations() {
  document.getElementById('mainContent').innerHTML =
    '<iframe src="../Monitor-escalations/monitor-escalations.html" style="width:100%;height:100%;border:none;min-height:80vh;"></iframe>';
}

function loadViewReports() {
  document.getElementById('mainContent').innerHTML =
    '<iframe src="../View-reports/view-reports.html" style="width:100%;height:100%;border:none;min-height:80vh;"></iframe>';
}

function loadAuditLogs() {
  document.getElementById('mainContent').innerHTML =
    '<iframe src="../Audit-logs/audit-logs.html" style="width:100%;height:100%;border:none;min-height:80vh;"></iframe>';
}

// --- Logout ---
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    window.location.href = '../Login/login.html';
  }
}

window.loadModule = loadModule;
window.logout     = logout;