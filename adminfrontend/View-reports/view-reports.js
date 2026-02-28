// Sample data for reports
const reportData = {
    grievances: {
        total: 156,
        resolved: 98,
        pending: 42,
        escalated: 16,
        byType: {
            'Verbal Harassment': 45,
            'Physical Harassment': 28,
            'Cyber Harassment': 35,
            'Discrimination': 32,
            'Other': 16
        },
        byPriority: {
            'High': 52,
            'Medium': 68,
            'Low': 36
        },
        monthly: [
            { month: 'Jan', new: 12, resolved: 10 },
            { month: 'Feb', new: 15, resolved: 12 },
            { month: 'Mar', new: 18, resolved: 15 },
            { month: 'Apr', new: 14, resolved: 13 },
            { month: 'May', new: 20, resolved: 16 },
            { month: 'Jun', new: 22, resolved: 18 }
        ]
    },
    committee: [
        { name: 'Sarah Johnson', assigned: 12, resolved: 10, avgTime: '4.2 days', satisfaction: 4.8 },
        { name: 'Emily Davis', assigned: 10, resolved: 9, avgTime: '3.8 days', satisfaction: 4.9 },
        { name: 'Rachel Green', assigned: 15, resolved: 12, avgTime: '5.1 days', satisfaction: 4.5 },
        { name: 'Monica Geller', assigned: 8, resolved: 7, avgTime: '3.5 days', satisfaction: 5.0 }
    ]
};

// Initialize charts and data
document.addEventListener('DOMContentLoaded', function() {
    updateSummaryCards();
    initializeCharts();
    loadDetailedReports();
});

// Update summary cards
function updateSummaryCards() {
    document.getElementById('totalGrievances').textContent = reportData.grievances.total;
    document.getElementById('resolvedCount').textContent = reportData.grievances.resolved;
    
    const avgTime = calculateAvgResolutionTime();
    document.getElementById('avgTime').textContent = avgTime;
    
    const satisfaction = calculateSatisfactionRate();
    document.getElementById('satisfactionRate').textContent = satisfaction + '%';
}

// Calculate average resolution time
function calculateAvgResolutionTime() {
    // In real app, calculate from actual data
    return '4.5 days';
}

// Calculate satisfaction rate
function calculateSatisfactionRate() {
    // In real app, calculate from feedback data
    return 87;
}

// Initialize all charts
function initializeCharts() {
    createTypeChart();
    createPriorityChart();
    createTrendChart();
    createResolutionChart();
}

// Create grievance type chart
function createTypeChart() {
    const ctx = document.getElementById('typeChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(reportData.grievances.byType),
            datasets: [{
                data: Object.values(reportData.grievances.byType),
                backgroundColor: [
                    '#ff6384',
                    '#36a2eb',
                    '#ffce56',
                    '#4bc0c0',
                    '#9966ff'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Create priority chart
function createPriorityChart() {
    const ctx = document.getElementById('priorityChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(reportData.grievances.byPriority),
            datasets: [{
                data: Object.values(reportData.grievances.byPriority),
                backgroundColor: ['#dc3545', '#ffc107', '#28a745']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Create trend chart
function createTrendChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: reportData.grievances.monthly.map(m => m.month),
            datasets: [
                {
                    label: 'New Cases',
                    data: reportData.grievances.monthly.map(m => m.new),
                    borderColor: '#36a2eb',
                    tension: 0.1
                },
                {
                    label: 'Resolved',
                    data: reportData.grievances.monthly.map(m => m.resolved),
                    borderColor: '#28a745',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Create resolution time chart
function createResolutionChart() {
    const ctx = document.getElementById('resolutionChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Verbal', 'Physical', 'Cyber', 'Discrimination'],
            datasets: [{
                label: 'Avg Resolution Time (days)',
                data: [3.5, 5.2, 4.8, 4.1],
                backgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Load detailed reports
function loadDetailedReports() {
    // Load grievance report
    const grievanceBody = document.getElementById('grievanceTableBody');
    grievanceBody.innerHTML = reportData.grievances.monthly.map((m, index) => `
        <tr>
            <td>${m.month} 2024</td>
            <td>${m.new}</td>
            <td>${m.resolved}</td>
            <td>${m.new - m.resolved}</td>
            <td>${Math.floor(Math.random() * 3)}</td>
            <td>${Math.round((m.resolved / m.new) * 100)}%</td>
        </tr>
    `).join('');
    
    // Load committee report
    const committeeBody = document.getElementById('committeeTableBody');
    committeeBody.innerHTML = reportData.committee.map(c => `
        <tr>
            <td>${c.name}</td>
            <td>${c.assigned}</td>
            <td>${c.resolved}</td>
            <td>${c.avgTime}</td>
            <td>${c.satisfaction}/5.0</td>
            <td>
                <div class="performance-bar">
                    <div class="performance-fill" style="width: ${(c.resolved / c.assigned) * 100}%"></div>
                </div>
            </td>
        </tr>
    `).join('');
}

// Set date range
function setDateRange(range) {
    document.querySelectorAll('.range-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    if (range === 'custom') {
        document.getElementById('customRange').style.display = 'flex';
    } else {
        document.getElementById('customRange').style.display = 'none';
        // Update charts with new range
        showToast(`Showing data for: ${range}`, 'info');
    }
}

// Apply custom date range
function applyCustomRange() {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    
    if (start && end) {
        showToast(`Showing data from ${start} to ${end}`, 'info');
    } else {
        showToast('Please select both dates', 'error');
    }
}

// Show different report tabs
function showReport(type) {
    document.querySelectorAll('.report-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Hide all reports
    document.getElementById('grievanceReport').style.display = 'none';
    document.getElementById('committeeReport').style.display = 'none';
    document.getElementById('feedbackReport').style.display = 'none';
    document.getElementById('escalationReport').style.display = 'none';
    
    // Show selected report
    switch(type) {
        case 'grievance':
            document.getElementById('grievanceReport').style.display = 'block';
            break;
        case 'committee':
            document.getElementById('committeeReport').style.display = 'block';
            break;
        case 'feedback':
            document.getElementById('feedbackReport').style.display = 'block';
            document.getElementById('feedbackReport').innerHTML = generateFeedbackReport();
            break;
        case 'escalation':
            document.getElementById('escalationReport').style.display = 'block';
            document.getElementById('escalationReport').innerHTML = generateEscalationReport();
            break;
    }
}

// Generate feedback report
function generateFeedbackReport() {
    return `
        <div class="feedback-stats">
            <div class="feedback-stat">
                <h4>Average Rating</h4>
                <div class="big-number">4.2/5.0</div>
                <p>Based on 89 responses</p>
            </div>
            <div class="feedback-stat">
                <h4>Response Rate</h4>
                <div class="big-number">72%</div>
                <p>Victims who provided feedback</p>
            </div>
            <div class="feedback-stat">
                <h4>Positive Feedback</h4>
                <div class="big-number">85%</div>
                <p>Rated 4 or 5 stars</p>
            </div>
        </div>
        <div class="feedback-comments">
            <h4>Recent Feedback Comments</h4>
            <div class="comment-list">
                <div class="comment-item">
                    <div class="comment-rating">★★★★★</div>
                    <p>"Very supportive throughout the process"</p>
                    <small>- Victim, 2 days ago</small>
                </div>
                <div class="comment-item">
                    <div class="comment-rating">★★★★☆</div>
                    <p>"Quick response but could be faster"</p>
                    <small>- Victim, 3 days ago</small>
                </div>
            </div>
        </div>
    `;
}

// Generate escalation report
function generateEscalationReport() {
    return `
        <div class="escalation-stats">
            <div class="escalation-stat critical">
                <h4>Critical Escalations</h4>
                <div class="big-number">8</div>
                <p>Require immediate attention</p>
            </div>
            <div class="escalation-stat high">
                <h4>High Priority</h4>
                <div class="big-number">15</div>
                <p>Need review this week</p>
            </div>
            <div class="escalation-stat resolved">
                <h4>Resolved Escalations</h4>
                <div class="big-number">23</div>
                <p>Successfully handled</p>
            </div>
        </div>
        <div class="escalation-trend">
            <h4>Escalation Trends</h4>
            <p>Month-over-month: <span class="trend-up">↑ 12%</span></p>
            <p>Common reasons: Legal intervention (45%), Authority approval (30%)</p>
        </div>
    `;
}

// Export reports
function exportReport(format) {
    showToast(`Exporting report as ${format.toUpperCase()}...`, 'info');
    // In real app, implement actual export logic
}

// Show toast
function showToast(message, type = 'info') {
    // Implement toast notification
    alert(message); // Placeholder
}

// Make functions globally available
window.setDateRange = setDateRange;
window.applyCustomRange = applyCustomRange;
window.showReport = showReport;
window.exportReport = exportReport;