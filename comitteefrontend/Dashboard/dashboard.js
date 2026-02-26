// Sample data for demonstration
let grievances = [
    {
        id: 'GRV001',
        victimName: 'Sandie',
        date: '2024-01-15',
        type: 'Verbal Harassment',
        description: 'Received inappropriate comments at workplace',
        status: 'pending',
        priority: 'high',
        assignedTo: 'Priya',
        comments: []
    },
    {
        id: 'GRV002',
        victimName: 'Amrutha',
        date: '2024-01-14',
        type: 'Physical Harassment',
        description: 'Unwanted physical contact during meeting',
        status: 'investigating',
        priority: 'high',
        assignedTo: 'Priya',
        comments: ['Initial investigation started', 'Witness statements collected']
    },
    {
        id: 'GRV003',
        victimName: 'Suhitha',
        date: '2024-01-13',
        type: 'Cyber Harassment',
        description: 'Receiving threatening emails',
        status: 'resolved',
        priority: 'medium',
        assignedTo: 'Priya',
        comments: ['Email evidence collected', 'Police complaint filed']
    },
    {
        id: 'GRV004',
        victimName: 'Lisa',
        date: '2024-01-12',
        type: 'Discrimination',
        description: 'Unequal treatment based on gender',
        status: 'escalated',
        priority: 'high',
        assignedTo: 'Priya',
        comments: ['Escalated to HR head']
    },
    {
        id: 'GRV005',
        victimName: 'Sara',
        date: '2024-01-11',
        type: 'Stalking',
        description: 'Being followed after work hours',
        status: 'under-review',
        priority: 'high',
        assignedTo: 'Priya',
        comments: ['Security footage being reviewed']
    },
    {
        id: 'GRV006',
        victimName: 'Angie',
        date: '2024-01-10',
        type: 'Verbal Harassment',
        description: 'Repeated offensive jokes',
        status: 'action-taken',
        priority: 'medium',
        assignedTo: 'Priya',
        comments: ['Warning issued to accused', 'Sensitivity training scheduled']
    }
];

let feedbacks = [
    {
        id: 'FB001',
        grievanceId: 'GRV001',
        victimName: 'Sandie',
        feedback: 'The committee responded quickly but need more updates',
        rating: 4,
        date: '2024-01-16'
    },
    {
        id: 'FB002',
        grievanceId: 'GRV002',
        victimName: 'Amrutha',
        feedback: 'Very supportive throughout the process. They handled it professionally.',
        rating: 5,
        date: '2024-01-15'
    },
    {
        id: 'FB003',
        grievanceId: 'GRV003',
        victimName: 'Suhitha',
        feedback: 'Satisfied with the resolution. Feeling safer now.',
        rating: 5,
        date: '2024-01-14'
    },
    {
        id: 'FB004',
        grievanceId: 'GRV004',
        victimName: 'Lisa',
        feedback: 'Process was slow but fair.',
        rating: 3,
        date: '2024-01-13'
    }
];

// Current user
const currentMember = {
    name: 'Priya',
    id: 'CM001',
    role: 'Committee Member'
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
});

// Switch between tabs
function switchTab(tab) {
    // Update active class
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Load appropriate content
    switch(tab) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'assigned':
            loadAssignedGrievances();
            break;
        case 'escalated':
            loadEscalatedCases();
            break;
        case 'resolved':
            loadResolvedCases();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'feedback':
            loadFeedback();
            break;
    }
}

// Load dashboard
function loadDashboard() {
    const content = document.getElementById('mainContent');
    
    // Calculate statistics
    const assignedGrievances = grievances.filter(g => g.assignedTo === currentMember.name);
    const totalAssigned = assignedGrievances.length;
    const pendingCount = assignedGrievances.filter(g => g.status === 'pending').length;
    const investigatingCount = assignedGrievances.filter(g => g.status === 'investigating' || g.status === 'under-review').length;
    const escalatedCount = assignedGrievances.filter(g => g.status === 'escalated').length;
    const resolvedCount = assignedGrievances.filter(g => g.status === 'resolved' || g.status === 'closed').length;

    content.innerHTML = `
        <div class="stats-container">
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Total Assigned</h3>
                    <div class="stat-number">${totalAssigned}</div>
                </div>
                <div class="stat-icon">
                    <i class="fas fa-tasks"></i>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Pending</h3>
                    <div class="stat-number">${pendingCount}</div>
                </div>
                <div class="stat-icon">
                    <i class="fas fa-clock"></i>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Investigating</h3>
                    <div class="stat-number">${investigatingCount}</div>
                </div>
                <div class="stat-icon">
                    <i class="fas fa-search"></i>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Escalated</h3>
                    <div class="stat-number">${escalatedCount}</div>
                </div>
                <div class="stat-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Resolved</h3>
                    <div class="stat-number">${resolvedCount}</div>
                </div>
                <div class="stat-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
            </div>
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

        <div class="grievances-section">
            <div class="section-header">
                <h2>Recent Grievances</h2>
                <div class="filter-options">
                    <button class="filter-btn active" onclick="filterGrievances('all')">All</button>
                    <button class="filter-btn" onclick="filterGrievances('pending')">Pending</button>
                    <button class="filter-btn" onclick="filterGrievances('investigating')">Investigating</button>
                    <button class="filter-btn" onclick="filterGrievances('escalated')">Escalated</button>
                </div>
            </div>

            <div class="search-bar">
                <input type="text" id="searchInput" placeholder="Search by ID, victim name, or type...">
                <button onclick="searchGrievances()"><i class="fas fa-search"></i> Search</button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Victim Name</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="grievancesTableBody">
                        ${renderGrievancesTableRows(assignedGrievances.slice(0, 5))}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Initialize charts after content is loaded
    setTimeout(() => {
        initializeCharts(assignedGrievances);
    }, 100);
}

// Initialize charts
function initializeCharts(grievanceData) {
    // Destroy existing charts if any
    const statusChartCanvas = document.getElementById('statusChart');
    const priorityChartCanvas = document.getElementById('priorityChart');
    
    if (statusChartCanvas) {
        // Clear previous chart
        const existingChart = Chart.getChart(statusChartCanvas);
        if (existingChart) {
            existingChart.destroy();
        }

        // Status chart
        const statusData = {
            pending: grievanceData.filter(g => g.status === 'pending').length,
            investigating: grievanceData.filter(g => g.status === 'investigating' || g.status === 'under-review').length,
            resolved: grievanceData.filter(g => g.status === 'resolved' || g.status === 'closed').length,
            escalated: grievanceData.filter(g => g.status === 'escalated').length
        };

        new Chart(statusChartCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'Investigating', 'Resolved', 'Escalated'],
                datasets: [{
                    data: [statusData.pending, statusData.investigating, statusData.resolved, statusData.escalated],
                    backgroundColor: ['#ffc107', '#17a2b8', '#28a745', '#dc3545']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    if (priorityChartCanvas) {
        // Clear previous chart
        const existingChart = Chart.getChart(priorityChartCanvas);
        if (existingChart) {
            existingChart.destroy();
        }

        // Priority chart
        const priorityData = {
            high: grievanceData.filter(g => g.priority === 'high').length,
            medium: grievanceData.filter(g => g.priority === 'medium').length,
            low: grievanceData.filter(g => g.priority === 'low').length
        };

        new Chart(priorityChartCanvas, {
            type: 'bar',
            data: {
                labels: ['High', 'Medium', 'Low'],
                datasets: [{
                    label: 'Number of Cases',
                    data: [priorityData.high, priorityData.medium, priorityData.low],
                    backgroundColor: ['#dc3545', '#ffc107', '#28a745']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        stepSize: 1
                    }
                }
            }
        });
    }
}

// Render table rows
function renderGrievancesTableRows(grievanceList) {
    if (grievanceList.length === 0) {
        return '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No grievances found</td></tr>';
    }

    return grievanceList.map(g => `
        <tr>
            <td>${g.id}</td>
            <td>${g.victimName}</td>
            <td>${formatDate(g.date)}</td>
            <td>${g.type}</td>
            <td><span class="status-badge status-${g.status.replace('-', '')}">${formatStatus(g.status)}</span></td>
            <td><span class="status-badge priority-${g.priority}">${g.priority.toUpperCase()}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" onclick="viewGrievance('${g.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="action-btn update-btn" onclick="openUpdateModal('${g.id}')">
                        <i class="fas fa-edit"></i> Update
                    </button>
                    ${g.status !== 'escalated' && g.status !== 'resolved' && g.status !== 'closed' ? `
                        <button class="action-btn escalate-btn" onclick="openEscalateModal('${g.id}')">
                            <i class="fas fa-level-up-alt"></i> Escalate
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Format status for display
function formatStatus(status) {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Load assigned grievances
function loadAssignedGrievances() {
    const content = document.getElementById('mainContent');
    const assignedGrievances = grievances.filter(g => g.assignedTo === currentMember.name);
    
    content.innerHTML = `
        <div class="grievances-section">
            <div class="section-header">
                <h2><i class="fas fa-tasks"></i> My Assigned Grievances</h2>
                <div class="filter-options">
                    <button class="filter-btn active" onclick="filterGrievances('all')">All</button>
                    <button class="filter-btn" onclick="filterGrievances('pending')">Pending</button>
                    <button class="filter-btn" onclick="filterGrievances('investigating')">Investigating</button>
                    <button class="filter-btn" onclick="filterGrievances('escalated')">Escalated</button>
                </div>
            </div>

            <div class="search-bar">
                <input type="text" id="searchInput" placeholder="Search by ID, victim name, or type...">
                <button onclick="searchGrievances()"><i class="fas fa-search"></i> Search</button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Victim Name</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="grievancesTableBody">
                        ${renderGrievancesTableRows(assignedGrievances)}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Load escalated cases
function loadEscalatedCases() {
    const content = document.getElementById('mainContent');
    const escalatedGrievances = grievances.filter(g => g.status === 'escalated');
    
    content.innerHTML = `
        <div class="grievances-section">
            <div class="section-header">
                <h2><i class="fas fa-exclamation-triangle"></i> Escalated Cases</h2>
                <div class="stats-container" style="margin-bottom: 0;">
                    <div class="stat-card" style="padding: 1rem;">
                        <div class="stat-info">
                            <h3>Total Escalated</h3>
                            <div class="stat-number">${escalatedGrievances.length}</div>
                        </div>
                        <div class="stat-icon" style="width: 40px; height: 40px; font-size: 1.2rem;">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Victim Name</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Priority</th>
                            <th>Escalated To</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${escalatedGrievances.map(g => `
                            <tr>
                                <td>${g.id}</td>
                                <td>${g.victimName}</td>
                                <td>${formatDate(g.date)}</td>
                                <td>${g.type}</td>
                                <td><span class="status-badge priority-${g.priority}">${g.priority.toUpperCase()}</span></td>
                                <td>Admin</td>
                                <td>
                                    <button class="action-btn view-btn" onclick="viewGrievance('${g.id}')">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Load resolved cases
function loadResolvedCases() {
    const content = document.getElementById('mainContent');
    const resolvedGrievances = grievances.filter(g => g.status === 'resolved' || g.status === 'closed');
    
    content.innerHTML = `
        <div class="grievances-section">
            <div class="section-header">
                <h2><i class="fas fa-check-circle"></i> Resolved Cases</h2>
                <div class="stats-container" style="margin-bottom: 0;">
                    <div class="stat-card" style="padding: 1rem;">
                        <div class="stat-info">
                            <h3>Total Resolved</h3>
                            <div class="stat-number">${resolvedGrievances.length}</div>
                        </div>
                        <div class="stat-icon" style="width: 40px; height: 40px; font-size: 1.2rem;">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Victim Name</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Resolution Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${resolvedGrievances.map(g => `
                            <tr>
                                <td>${g.id}</td>
                                <td>${g.victimName}</td>
                                <td>${formatDate(g.date)}</td>
                                <td>${g.type}</td>
                                <td>${formatDate(new Date().toISOString().split('T')[0])}</td>
                                <td>
                                    <button class="action-btn view-btn" onclick="viewGrievance('${g.id}')">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Load analytics
function loadAnalytics() {
    const content = document.getElementById('mainContent');
    const assignedGrievances = grievances.filter(g => g.assignedTo === currentMember.name);
    
    // Calculate metrics
    const avgResolutionTime = '5.2 days';
    const satisfactionRate = '92%';
    const pendingEscalations = grievances.filter(g => g.status === 'escalated').length;
    const highPriorityCount = assignedGrievances.filter(g => g.priority === 'high').length;
    
    content.innerHTML = `
        <h2 style="margin-bottom: 1.5rem;"><i class="fas fa-chart-bar"></i> Analytics Dashboard</h2>
        
        <div class="charts-row">
            <div class="chart-container">
                <h3>Monthly Grievance Trends</h3>
                <canvas id="trendChart"></canvas>
            </div>
            <div class="chart-container">
                <h3>Grievance Types Distribution</h3>
                <canvas id="typeChart"></canvas>
            </div>
        </div>

        <div class="analytics-grid">
            <div class="analytics-card">
                <h3>Average Resolution Time</h3>
                <div class="analytics-value">${avgResolutionTime}</div>
                <div class="analytics-label">from filing to closure</div>
            </div>
            <div class="analytics-card">
                <h3>Victim Satisfaction Rate</h3>
                <div class="analytics-value">${satisfactionRate}</div>
                <div class="analytics-label">based on feedback ratings</div>
            </div>
            <div class="analytics-card">
                <h3>Pending Escalations</h3>
                <div class="analytics-value">${pendingEscalations}</div>
                <div class="analytics-label">awaiting higher authority</div>
            </div>
            <div class="analytics-card">
                <h3>High Priority Cases</h3>
                <div class="analytics-value">${highPriorityCount}</div>
                <div class="analytics-label">require immediate attention</div>
            </div>
        </div>

        <div class="grievances-section" style="margin-top: 20px;">
            <h3 style="margin-bottom: 1rem;">Performance Metrics</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div>
                    <h4>This Month</h4>
                    <p>Resolved: 8 cases</p>
                    <p>New: 12 cases</p>
                    <p>Pending: 5 cases</p>
                </div>
                <div>
                    <h4>Last Month</h4>
                    <p>Resolved: 10 cases</p>
                    <p>New: 9 cases</p>
                    <p>Pending: 4 cases</p>
                </div>
                <div>
                    <h4>Quarterly Trend</h4>
                    <p>Q1: 25 cases</p>
                    <p>Q2: 32 cases</p>
                    <p>Q3: 28 cases</p>
                </div>
            </div>
        </div>
    `;

    // Initialize analytics charts
    setTimeout(() => {
        initializeAnalyticsCharts();
    }, 100);
}

// Initialize analytics charts
function initializeAnalyticsCharts() {
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Grievances Received',
                    data: [12, 19, 15, 17, 14, 23],
                    borderColor: '#667eea',
                    tension: 0.1
                }]
            }
        });
    }

    const typeCtx = document.getElementById('typeChart');
    if (typeCtx) {
        new Chart(typeCtx, {
            type: 'pie',
            data: {
                labels: ['Verbal', 'Physical', 'Cyber', 'Discrimination', 'Other'],
                datasets: [{
                    data: [30, 15, 25, 20, 10],
                    backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff']
                }]
            }
        });
    }
}

// Load feedback
function loadFeedback() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="grievances-section">
            <div class="section-header">
                <h2><i class="fas fa-comment"></i> Victim Feedback</h2>
                <div class="stats-container" style="margin-bottom: 0;">
                    <div class="stat-card" style="padding: 1rem;">
                        <div class="stat-info">
                            <h3>Total Feedback</h3>
                            <div class="stat-number">${feedbacks.length}</div>
                        </div>
                        <div class="stat-icon" style="width: 40px; height: 40px; font-size: 1.2rem;">
                            <i class="fas fa-star"></i>
                        </div>
                    </div>
                    <div class="stat-card" style="padding: 1rem;">
                        <div class="stat-info">
                            <h3>Average Rating</h3>
                            <div class="stat-number">${(feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)}</div>
                        </div>
                        <div class="stat-icon" style="width: 40px; height: 40px; font-size: 1.2rem;">
                            <i class="fas fa-star"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div id="feedbackList">
                ${feedbacks.map(f => `
                    <div class="feedback-card">
                        <div class="feedback-header">
                            <h4>${f.victimName}</h4>
                            <div class="feedback-rating">
                                ${generateStarRating(f.rating)}
                            </div>
                        </div>
                        <div class="feedback-comment">
                            "${f.feedback}"
                        </div>
                        <div class="feedback-meta">
                            <span><i class="fas fa-hashtag"></i> Grievance: ${f.grievanceId}</span>
                            <span><i class="far fa-calendar"></i> ${formatDate(f.date)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Generate star rating HTML
function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// View grievance details
function viewGrievance(id) {
    const grievance = grievances.find(g => g.id === id);
    if (!grievance) return;

    const detailsDiv = document.getElementById('grievanceDetails');
    detailsDiv.innerHTML = `
        <div class="grievance-detail">
            <div class="detail-row">
                <span class="detail-label">ID:</span>
                <span class="detail-value">${grievance.id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Victim:</span>
                <span class="detail-value">${grievance.victimName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formatDate(grievance.date)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value">${grievance.type}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">${grievance.description}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value"><span class="status-badge status-${grievance.status.replace('-', '')}">${formatStatus(grievance.status)}</span></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Priority:</span>
                <span class="detail-value"><span class="status-badge priority-${grievance.priority}">${grievance.priority.toUpperCase()}</span></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Assigned To:</span>
                <span class="detail-value">${grievance.assignedTo}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Comments:</span>
                <span class="detail-value">
                    ${grievance.comments && grievance.comments.length > 0 ? 
                        grievance.comments.map(c => `<div>• ${c}</div>`).join('') : 
                        'No comments'}
                </span>
            </div>
        </div>
    `;

    document.getElementById('grievanceModal').classList.add('active');
}

// Open update modal
function openUpdateModal(id) {
    const grievance = grievances.find(g => g.id === id);
    if (!grievance) return;

    document.getElementById('updateGrievanceId').value = id;
    document.getElementById('statusSelect').value = grievance.status;
    document.getElementById('prioritySelect').value = grievance.priority;
    document.getElementById('remarks').value = '';

    document.getElementById('updateModal').classList.add('active');
}

// Update status
function updateStatus(event) {
    event.preventDefault();

    const id = document.getElementById('updateGrievanceId').value;
    const status = document.getElementById('statusSelect').value;
    const priority = document.getElementById('prioritySelect').value;
    const remarks = document.getElementById('remarks').value;

    const grievance = grievances.find(g => g.id === id);
    if (grievance) {
        grievance.status = status;
        grievance.priority = priority;
        if (remarks) {
            if (!grievance.comments) grievance.comments = [];
            grievance.comments.push(remarks);
        }

        showToast('Grievance status updated successfully!', 'success');
        closeUpdateModal();
        
        // Refresh the current view
        const activeTab = document.querySelector('.sidebar-menu li.active span').textContent;
        switch(activeTab.toLowerCase()) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'my assigned grievances':
                loadAssignedGrievances();
                break;
        }
    }
}

// Open escalate modal
function openEscalateModal(id) {
    document.getElementById('escalateGrievanceId').value = id;
    document.getElementById('escalateForm').reset();
    document.getElementById('escalateModal').classList.add('active');
}

// Escalate grievance
function escalateGrievance(event) {
    event.preventDefault();

    const id = document.getElementById('escalateGrievanceId').value;
    const reason = document.getElementById('escalationReason').value;
    const escalateTo = document.getElementById('escalateTo').value;
    const details = document.getElementById('escalationDetails').value;

    const grievance = grievances.find(g => g.id === id);
    if (grievance) {
        grievance.status = 'escalated';
        if (!grievance.comments) grievance.comments = [];
        grievance.comments.push(`Escalated to ${escalateTo}: ${details}`);

        showToast('Grievance escalated successfully!', 'success');
        closeEscalateModal();
        
        // Refresh the current view
        const activeTab = document.querySelector('.sidebar-menu li.active span').textContent;
        switch(activeTab.toLowerCase()) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'my assigned grievances':
                loadAssignedGrievances();
                break;
        }
    }
}

// Filter grievances
function filterGrievances(status) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    const assignedGrievances = grievances.filter(g => g.assignedTo === currentMember.name);
    let filteredGrievances = assignedGrievances;

    if (status !== 'all') {
        if (status === 'investigating') {
            filteredGrievances = assignedGrievances.filter(g => g.status === 'investigating' || g.status === 'under-review');
        } else {
            filteredGrievances = assignedGrievances.filter(g => g.status === status);
        }
    }

    const tableBody = document.getElementById('grievancesTableBody');
    if (tableBody) {
        tableBody.innerHTML = renderGrievancesTableRows(filteredGrievances);
    }
}

// Search grievances
function searchGrievances() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const assignedGrievances = grievances.filter(g => g.assignedTo === currentMember.name);
    
    const filteredGrievances = assignedGrievances.filter(g => 
        g.id.toLowerCase().includes(searchTerm) ||
        g.victimName.toLowerCase().includes(searchTerm) ||
        g.type.toLowerCase().includes(searchTerm) ||
        g.description.toLowerCase().includes(searchTerm)
    );

    const tableBody = document.getElementById('grievancesTableBody');
    if (tableBody) {
        tableBody.innerHTML = renderGrievancesTableRows(filteredGrievances);
    }
}

// Close modals
function closeModal() {
    document.getElementById('grievanceModal').classList.remove('active');
}

function closeUpdateModal() {
    document.getElementById('updateModal').classList.remove('active');
}

function closeEscalateModal() {
    document.getElementById('escalateModal').classList.remove('active');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        showToast('Logging out...', 'info');
        setTimeout(() => {
            window.location.href = '../Login/login.html';
        }, 1500);
    }
}

// Export functions for global use
window.switchTab = switchTab;
window.viewGrievance = viewGrievance;
window.openUpdateModal = openUpdateModal;
window.updateStatus = updateStatus;
window.openEscalateModal = openEscalateModal;
window.escalateGrievance = escalateGrievance;
window.closeModal = closeModal;
window.closeUpdateModal = closeUpdateModal;
window.closeEscalateModal = closeEscalateModal;
window.filterGrievances = filterGrievances;
window.searchGrievances = searchGrievances;
window.logout = logout;