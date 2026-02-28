// Sample data
let grievances = [
    {
        id: 'GRV001',
        victim: 'Alice Smith',
        type: 'Verbal Harassment',
        priority: 'high',
        date: '2024-01-15',
        status: 'pending',
        assignedTo: null
    },
    {
        id: 'GRV002',
        victim: 'Emma Watson',
        type: 'Physical Harassment',
        priority: 'high',
        date: '2024-01-14',
        status: 'pending',
        assignedTo: null
    },
    {
        id: 'GRV003',
        victim: 'Maria Garcia',
        type: 'Cyber Harassment',
        priority: 'medium',
        date: '2024-01-13',
        status: 'assigned',
        assignedTo: 'Sarah Johnson'
    },
    {
        id: 'GRV004',
        victim: 'Lisa Brown',
        type: 'Discrimination',
        priority: 'low',
        date: '2024-01-12',
        status: 'pending',
        assignedTo: null
    }
];

let committeeMembers = [
    {
        id: 1,
        name: 'Sarah Johnson',
        department: 'HR Committee',
        expertise: ['Verbal Harassment', 'Discrimination'],
        currentLoad: 3,
        maxLoad: 5,
        status: 'available'
    },
    {
        id: 2,
        name: 'Emily Davis',
        department: 'Legal Committee',
        expertise: ['Physical Harassment', 'Cyber Harassment'],
        currentLoad: 2,
        maxLoad: 5,
        status: 'available'
    },
    {
        id: 3,
        name: 'Rachel Green',
        department: 'Women Welfare',
        expertise: ['All Types'],
        currentLoad: 4,
        maxLoad: 5,
        status: 'busy'
    },
    {
        id: 4,
        name: 'Monica Geller',
        department: 'Grievance Redressal',
        expertise: ['Verbal Harassment', 'Discrimination'],
        currentLoad: 1,
        maxLoad: 5,
        status: 'available'
    }
];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    updateStatistics();
    loadGrievances();
    loadCommitteeGrid();
    setDefaultDeadline();
});

// Update statistics
function updateStatistics() {
    const unassigned = grievances.filter(g => !g.assignedTo).length;
    const available = committeeMembers.filter(m => m.status === 'available').length;
    
    document.getElementById('unassignedCount').textContent = unassigned;
    document.getElementById('availableCommitteeCount').textContent = available;
}

// Load grievances table
function loadGrievances() {
    const tbody = document.getElementById('grievancesTableBody');
    const priorityFilter = document.getElementById('priorityFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    let filteredGrievances = grievances.filter(g => g.status === 'pending' || !g.assignedTo);
    
    // Apply filters
    if (priorityFilter !== 'all') {
        filteredGrievances = filteredGrievances.filter(g => g.priority === priorityFilter);
    }
    
    if (typeFilter !== 'all') {
        filteredGrievances = filteredGrievances.filter(g => g.type.includes(typeFilter));
    }
    
    if (searchTerm) {
        filteredGrievances = filteredGrievances.filter(g => 
            g.id.toLowerCase().includes(searchTerm) ||
            g.victim.toLowerCase().includes(searchTerm) ||
            g.type.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filteredGrievances.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px;">No grievances pending assignment</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredGrievances.map(g => `
        <tr>
            <td>${g.id}</td>
            <td>${g.victim}</td>
            <td>${g.type}</td>
            <td><span class="priority-badge priority-${g.priority}">${g.priority.toUpperCase()}</span></td>
            <td>${formatDate(g.date)}</td>
            <td><span class="status-badge status-${g.status}">${g.status.toUpperCase()}</span></td>
            <td>${g.assignedTo || '<span style="color:#999;">Not Assigned</span>'}</td>
            <td>
                ${!g.assignedTo ? 
                    `<button class="action-btn assign-btn" onclick="openAssignModal('${g.id}')">
                        <i class="fas fa-user-plus"></i> Assign
                    </button>` : 
                    `<button class="action-btn reassign-btn" onclick="openAssignModal('${g.id}')">
                        <i class="fas fa-sync-alt"></i> Reassign
                    </button>`
                }
            </td>
        </tr>
    `).join('');
}

// Load committee grid
function loadCommitteeGrid() {
    const grid = document.getElementById('committeeGrid');
    
    grid.innerHTML = committeeMembers.map(m => `
        <div class="committee-card ${m.status}">
            <div class="committee-avatar">
                <i class="fas fa-user-tie"></i>
            </div>
            <div class="committee-info">
                <h4>${m.name}</h4>
                <p>${m.department}</p>
                <div class="expertise-tags">
                    ${m.expertise.map(e => `<span class="expertise-tag">${e}</span>`).join('')}
                </div>
                <div class="workload">
                    <div class="workload-bar">
                        <div class="workload-fill" style="width: ${(m.currentLoad/m.maxLoad)*100}%"></div>
                    </div>
                    <span>${m.currentLoad}/${m.maxLoad} cases</span>
                </div>
                <span class="status-indicator ${m.status}">${m.status}</span>
            </div>
        </div>
    `).join('');
}

// Open assign modal
function openAssignModal(grievanceId) {
    const grievance = grievances.find(g => g.id === grievanceId);
    if (!grievance) return;
    
    document.getElementById('assignGrievanceId').value = grievanceId;
    document.getElementById('grievanceInfo').innerHTML = `
        <p><strong>Grievance:</strong> ${grievance.id} - ${grievance.type}</p>
        <p><strong>Victim:</strong> ${grievance.victim}</p>
        <p><strong>Priority:</strong> <span class="priority-badge priority-${grievance.priority}">${grievance.priority}</span></p>
    `;
    
    // Populate committee select
    const select = document.getElementById('committeeSelect');
    select.innerHTML = '<option value="">Choose a member...</option>' + 
        committeeMembers.filter(m => m.status === 'available').map(m => 
            `<option value="${m.id}">${m.name} (${m.currentLoad}/${m.maxLoad} cases) - ${m.department}</option>`
        ).join('');
    
    document.getElementById('assignModal').classList.add('active');
}

// Assign committee
function assignCommittee(event) {
    event.preventDefault();
    
    const grievanceId = document.getElementById('assignGrievanceId').value;
    const committeeId = parseInt(document.getElementById('committeeSelect').value);
    const notes = document.getElementById('assignmentNotes').value;
    const priority = document.getElementById('assignmentPriority').value;
    const deadline = document.getElementById('assignmentDeadline').value;
    
    const grievance = grievances.find(g => g.id === grievanceId);
    const committee = committeeMembers.find(m => m.id === committeeId);
    
    if (grievance && committee) {
        // Update grievance
        grievance.assignedTo = committee.name;
        grievance.status = 'assigned';
        grievance.assignedDate = new Date().toISOString();
        grievance.deadline = deadline;
        grievance.assignmentNotes = notes;
        
        // Update committee workload
        committee.currentLoad++;
        if (committee.currentLoad >= committee.maxLoad) {
            committee.status = 'busy';
        }
        
        showToast(`Grievance assigned to ${committee.name}`, 'success');
        closeModal('assignModal');
        
        // Refresh data
        updateStatistics();
        loadGrievances();
        loadCommitteeGrid();
        
        // Log the action
        logAudit('Assigned grievance', {
            grievance: grievanceId,
            committee: committee.name,
            priority: priority,
            deadline: deadline
        });
    }
}

// Auto assign grievances
function autoAssignGrievances() {
    const strategy = document.getElementById('autoAssignStrategy').value;
    const unassigned = grievances.filter(g => !g.assignedTo);
    const available = committeeMembers.filter(m => m.status === 'available');
    
    if (unassigned.length === 0) {
        showToast('No unassigned grievances', 'info');
        closeModal('autoAssignModal');
        return;
    }
    
    if (available.length === 0) {
        showToast('No available committee members', 'error');
        closeModal('autoAssignModal');
        return;
    }
    
    // Simple auto-assignment logic
    unassigned.forEach((grievance, index) => {
        // Round-robin assignment
        const committeeIndex = index % available.length;
        const committee = available[committeeIndex];
        
        if (committee.currentLoad < committee.maxLoad) {
            grievance.assignedTo = committee.name;
            grievance.status = 'assigned';
            committee.currentLoad++;
            
            if (committee.currentLoad >= committee.maxLoad) {
                committee.status = 'busy';
            }
        }
    });
    
    showToast(`Auto-assigned ${unassigned.length} grievances`, 'success');
    closeModal('autoAssignModal');
    
    // Refresh data
    updateStatistics();
    loadGrievances();
    loadCommitteeGrid();
    
    // Log the action
    logAudit('Auto-assigned grievances', {
        count: unassigned.length,
        strategy: strategy
    });
}

// Filter grievances
function filterGrievances() {
    loadGrievances();
}

// Set default deadline (7 days from now)
function setDefaultDeadline() {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    const deadline = date.toISOString().split('T')[0];
    document.getElementById('assignmentDeadline').min = deadline;
    document.getElementById('assignmentDeadline').value = deadline;
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Show auto assign modal
function showAutoAssignModal() {
    document.getElementById('autoAssignModal').classList.add('active');
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Show toast
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    let icon = '';
    
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    toast.className = `toast ${type}`;
    toast.innerHTML = `${icon} ${message}`;
    toast.style.display = 'flex';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Log audit
function logAudit(action, details) {
    const auditEntry = {
        timestamp: new Date().toISOString(),
        admin: 'Michael Brown',
        action: action,
        details: details,
        module: 'assign-committee'
    };
    
    console.log('Audit Log:', auditEntry);
    
    const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    auditLogs.push(auditEntry);
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
}

// Make functions globally available
window.filterGrievances = filterGrievances;
window.openAssignModal = openAssignModal;
window.assignCommittee = assignCommittee;
window.showAutoAssignModal = showAutoAssignModal;
window.autoAssignGrievances = autoAssignGrievances;
window.closeModal = closeModal;