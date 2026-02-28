// Sample escalation data
let escalations = [
    {
        id: 'ESC001',
        grievanceId: 'GRV002',
        victimName: 'Emma Watson',
        escalatedBy: 'Sarah Johnson',
        escalatedTo: 'Admin',
        reason: 'legal',
        reasonText: 'Legal intervention needed due to criminal nature',
        priority: 'critical',
        status: 'pending',
        escalatedDate: '2024-01-15T10:30:00',
        details: 'Physical harassment case requires police involvement',
        actions: []
    },
    {
        id: 'ESC002',
        grievanceId: 'GRV005',
        victimName: 'Jennifer Lee',
        escalatedBy: 'Emily Davis',
        escalatedTo: 'Admin',
        reason: 'authority',
        reasonText: 'Requires higher authority approval',
        priority: 'high',
        status: 'in-progress',
        escalatedDate: '2024-01-14T14:20:00',
        details: 'Case involves senior management',
        actions: ['Assigned to legal team']
    },
    {
        id: 'ESC003',
        grievanceId: 'GRV007',
        victimName: 'Patricia Williams',
        escalatedBy: 'Rachel Green',
        escalatedTo: 'Admin',
        reason: 'security',
        reasonText: 'Immediate security threat',
        priority: 'critical',
        status: 'pending',
        escalatedDate: '2024-01-15T09:15:00',
        details: 'Victim reported physical threats',
        actions: []
    }
];

let currentTab = 'pending';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    updateStatistics();
    loadEscalations();
});

// Update statistics
function updateStatistics() {
    const critical = escalations.filter(e => e.priority === 'critical').length;
    const high = escalations.filter(e => e.priority === 'high').length;
    const medium = escalations.filter(e => e.priority === 'medium').length;
    
    document.getElementById('criticalCount').textContent = critical;
    document.getElementById('highCount').textContent = high;
    document.getElementById('mediumCount').textContent = medium;
}

// Load escalations
function loadEscalations() {
    const container = document.getElementById('escalationsContainer');
    const timeFilter = document.getElementById('timeFilter').value;
    const reasonFilter = document.getElementById('reasonFilter').value;
    
    let filtered = filterByTab(escalations);
    filtered = filterByTimePeriod(filtered, timeFilter);
    
    if (reasonFilter !== 'all') {
        filtered = filtered.filter(e => e.reason === reasonFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="no-data"><i class="fas fa-inbox"></i><p>No escalations found</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(e => `
        <div class="escalation-card ${e.priority}">
            <div class="escalation-header">
                <div class="escalation-title">
                    <span class="escalation-id">${e.id}</span>
                    <span class="priority-badge ${e.priority}">${e.priority.toUpperCase()}</span>
                    <span class="status-badge ${e.status}">${e.status.replace('-', ' ').toUpperCase()}</span>
                </div>
                <span class="escalation-time">${timeAgo(e.escalatedDate)}</span>
            </div>
            
            <div class="escalation-body">
                <div class="escalation-details">
                    <p><i class="fas fa-user"></i> <strong>Victim:</strong> ${e.victimName}</p>
                    <p><i class="fas fa-hashtag"></i> <strong>Grievance:</strong> ${e.grievanceId}</p>
                    <p><i class="fas fa-user-tie"></i> <strong>Escalated By:</strong> ${e.escalatedBy}</p>
                    <p><i class="fas fa-exclamation-circle"></i> <strong>Reason:</strong> ${e.reasonText}</p>
                    <p><i class="fas fa-align-left"></i> ${e.details}</p>
                </div>
                
                ${e.actions.length > 0 ? `
                    <div class="action-history">
                        <h4>Actions Taken:</h4>
                        <ul>
                            ${e.actions.map(a => `<li>${a}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
            
            <div class="escalation-footer">
                <button class="action-btn view-btn" onclick="viewEscalation('${e.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="action-btn action-take-btn" onclick="openActionModal('${e.id}')">
                    <i class="fas fa-tasks"></i> Take Action
                </button>
                ${e.status === 'pending' ? `
                    <button class="action-btn assign-btn" onclick="assignToCommittee('${e.id}')">
                        <i class="fas fa-user-plus"></i> Assign
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Filter by tab
function filterByTab(data) {
    switch(currentTab) {
        case 'pending':
            return data.filter(e => e.status === 'pending');
        case 'in-progress':
            return data.filter(e => e.status === 'in-progress');
        case 'resolved':
            return data.filter(e => e.status === 'resolved');
        default:
            return data;
    }
}

// Filter by time period
function filterByTimePeriod(data, period) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch(period) {
        case 'today':
            return data.filter(e => new Date(e.escalatedDate) >= today);
        case 'week':
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            return data.filter(e => new Date(e.escalatedDate) >= weekAgo);
        case 'month':
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            return data.filter(e => new Date(e.escalatedDate) >= monthAgo);
        default:
            return data;
    }
}

// Switch tab
function switchTab(tab) {
    currentTab = tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    loadEscalations();
}

// Filter functions
function filterByTime() {
    loadEscalations();
}

function filterByReason() {
    loadEscalations();
}

function searchEscalations() {
    const searchTerm = event.target.value.toLowerCase();
    const container = document.getElementById('escalationsContainer');
    
    const filtered = escalations.filter(e => 
        e.id.toLowerCase().includes(searchTerm) ||
        e.victimName.toLowerCase().includes(searchTerm) ||
        e.grievanceId.toLowerCase().includes(searchTerm) ||
        e.reasonText.toLowerCase().includes(searchTerm)
    );
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="no-data"><i class="fas fa-search"></i><p>No matching escalations</p></div>';
        return;
    }
    
    // Re-render with filtered data (simplified for demo)
    loadEscalations(); // In real app, you'd render the filtered array
}

// View escalation details
function viewEscalation(escalationId) {
    const escalation = escalations.find(e => e.id === escalationId);
    if (!escalation) return;
    
    // In real app, open detailed view modal
    alert(`Viewing escalation ${escalationId}\n\nDetails: ${escalation.details}`);
}

// Open action modal
function openActionModal(escalationId) {
    const escalation = escalations.find(e => e.id === escalationId);
    if (!escalation) return;
    
    document.getElementById('actionEscalationId').value = escalationId;
    document.getElementById('actionDetails').innerHTML = `
        <p><strong>Escalation:</strong> ${escalation.id} (${escalation.grievanceId})</p>
        <p><strong>Victim:</strong> ${escalation.victimName}</p>
        <p><strong>Priority:</strong> <span class="priority-badge ${escalation.priority}">${escalation.priority}</span></p>
    `;
    
    // Load committee members for reassign
    const reassignSelect = document.getElementById('reassignTo');
    reassignSelect.innerHTML = '<option value="">Select Committee Member</option>' +
        ['Sarah Johnson', 'Emily Davis', 'Rachel Green', 'Monica Geller']
            .map(name => `<option value="${name}">${name}</option>`).join('');
    
    document.getElementById('actionModal').classList.add('active');
}

// Toggle action fields based on selected action
function toggleActionFields() {
    const actionType = document.getElementById('actionType').value;
    
    document.getElementById('reassignField').style.display = actionType === 'reassign' ? 'block' : 'none';
    document.getElementById('meetingField').style.display = actionType === 'schedule-meeting' ? 'block' : 'none';
}

// Take action on escalation
function takeAction(event) {
    event.preventDefault();
    
    const escalationId = document.getElementById('actionEscalationId').value;
    const actionType = document.getElementById('actionType').value;
    const comments = document.getElementById('actionComments').value;
    
    const escalation = escalations.find(e => e.id === escalationId);
    
    if (escalation) {
        // Update status based on action
        if (actionType === 'close') {
            escalation.status = 'resolved';
        } else {
            escalation.status = 'in-progress';
        }
        
        // Add action to history
        if (!escalation.actions) escalation.actions = [];
        escalation.actions.push(`${actionType}: ${comments || 'No comments'}`);
        
        showToast('Action recorded successfully', 'success');
        closeModal('actionModal');
        loadEscalations();
        updateStatistics();
        
        // Log the action
        logAudit('Took action on escalation', {
            escalation: escalationId,
            action: actionType,
            comments: comments
        });
    }
}

// Assign to committee
function assignToCommittee(escalationId) {
    if (confirm('Assign this escalation to a committee member?')) {
        showToast('Assigned to committee for review', 'success');
        // Implement actual assignment logic
    }
}

// Time ago formatter
function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (let [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
        }
    }
    
    return 'Just now';
}

// Show toast
function showToast(message, type = 'info') {
    // Implement toast notification (similar to previous modules)
    alert(message); // Placeholder
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Log audit
function logAudit(action, details) {
    const auditEntry = {
        timestamp: new Date().toISOString(),
        admin: 'Michael Brown',
        action: action,
        details: details,
        module: 'monitor-escalations'
    };
    
    console.log('Audit Log:', auditEntry);
    
    const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    auditLogs.push(auditEntry);
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
}

// Make functions globally available
window.switchTab = switchTab;
window.filterByTime = filterByTime;
window.filterByReason = filterByReason;
window.searchEscalations = searchEscalations;
window.viewEscalation = viewEscalation;
window.openActionModal = openActionModal;
window.toggleActionFields = toggleActionFields;
window.takeAction = takeAction;
window.assignToCommittee = assignToCommittee;
window.closeModal = closeModal;