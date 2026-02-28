// Module loader
function loadModule(moduleName) {
    // Update active menu item
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Show loading
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Loading...</div>';

    // Load module content
    setTimeout(() => {
        switch(moduleName) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'manage-users':
                loadManageUsers();
                break;
            case 'assign-committee':
                loadAssignCommittee();
                break;
            case 'monitor-escalations':
                loadMonitorEscalations();
                break;
            case 'view-reports':
                loadViewReports();
                break;
            case 'audit-logs':
                loadAuditLogs();
                break;
        }
    }, 500);
}

// Load dashboard overview
function loadDashboard() {
    const mainContent = document.getElementById('mainContent');
    
    // Fetch dashboard data
    fetch('/api/admin/dashboard-stats')
        .then(response => response.json())
        .catch(() => {
            // Fallback to demo data if API not available
            return {
                totalUsers: 156,
                activeGrievances: 45,
                pendingAssignments: 12,
                escalatedCases: 8,
                committeeMembers: 15,
                resolutionRate: '78%'
            };
        })
        .then(data => {
            mainContent.innerHTML = `
                <h2>Dashboard Overview</h2>
                <div class="stats-container">
                    <div class="stat-card">
                        <div class="stat-info">
                            <h3>Total Users</h3>
                            <div class="stat-number">${data.totalUsers}</div>
                        </div>
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-info">
                            <h3>Active Grievances</h3>
                            <div class="stat-number">${data.activeGrievances}</div>
                        </div>
                        <div class="stat-icon">
                            <i class="fas fa-exclamation-circle"></i>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-info">
                            <h3>Pending Assignments</h3>
                            <div class="stat-number">${data.pendingAssignments}</div>
                        </div>
                        <div class="stat-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-info">
                            <h3>Escalated Cases</h3>
                            <div class="stat-number">${data.escalatedCases}</div>
                        </div>
                        <div class="stat-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                    </div>
                </div>
                <div class="recent-activities">
                    <h3>Recent Activities</h3>
                    <div class="activity-list">
                        ${generateRecentActivities()}
                    </div>
                </div>
            `;
        });
}

function generateRecentActivities() {
    const activities = [
        { time: '5 mins ago', action: 'New committee member added', user: 'Admin' },
        { time: '10 mins ago', action: 'Grievance #GRV004 escalated', user: 'Committee' },
        { time: '25 mins ago', action: 'User account blocked', user: 'Admin' },
        { time: '1 hour ago', action: 'New grievance filed', user: 'Victim' }
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

// Module loaders
function loadManageUsers() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = '<iframe src="../Manage-users/manage-users.html" style="width:100%; height:100%; border:none;"></iframe>';
}

function loadAssignCommittee() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = '<iframe src="../Assign-committee/assign-committee.html" style="width:100%; height:100%; border:none;"></iframe>';
}

function loadMonitorEscalations() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = '<iframe src="../Monitor-escalations/monitor-escalations.html" style="width:100%; height:100%; border:none;"></iframe>';
}

function loadViewReports() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = '<iframe src="../View-reports/view-reports.html" style="width:100%; height:100%; border:none;"></iframe>';
}

function loadAuditLogs() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = '<iframe src="../Audit-logs/audit-logs.html" style="width:100%; height:100%; border:none;"></iframe>';
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = '../Login/login.html';
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
});

// Make functions globally available
window.loadModule = loadModule;
window.logout = logout;