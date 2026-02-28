// Sample audit logs data
let auditLogs = [
    {
        id: 1,
        timestamp: '2024-01-15T10:30:00',
        user: 'Michael Brown',
        userType: 'admin',
        action: 'login',
        actionType: 'login',
        details: 'Admin logged in successfully',
        ip: '192.168.1.100',
        status: 'success',
        metadata: {
            browser: 'Chrome 120',
            os: 'Windows 11',
            location: 'New York, USA'
        }
    },
    {
        id: 2,
        timestamp: '2024-01-15T09:45:00',
        user: 'Sarah Johnson',
        userType: 'committee',
        action: 'update',
        actionType: 'update',
        details: 'Updated grievance status GRV002 to "investigating"',
        ip: '192.168.1.101',
        status: 'success'
    },
    {
        id: 3,
        timestamp: '2024-01-15T09:30:00',
        user: 'System',
        userType: 'system',
        action: 'escalate',
        actionType: 'escalate',
        details: 'Automatic escalation triggered for GRV005 (48h no response)',
        ip: 'system',
        status: 'warning'
    },
    {
        id: 4,
        timestamp: '2024-01-15T08:15:00',
        user: 'Alice Smith',
        userType: 'victim',
        action: 'create',
        actionType: 'create',
        details: 'Filed new grievance GRV008',
        ip: '192.168.1.102',
        status: 'success'
    },
    {
        id: 5,
        timestamp: '2024-01-14T23:20:00',
        user: 'Unknown',
        userType: 'unknown',
        action: 'login',
        actionType: 'login',
        details: 'Failed login attempt for user admin@example.com',
        ip: '45.67.89.123',
        status: 'failed'
    }
];

let currentPage = 1;
const logsPerPage = 10;
let filteredLogs = [...auditLogs];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    updateStatistics();
    renderLogs();
});

// Update statistics
function updateStatistics() {
    document.getElementById('totalEvents').textContent = auditLogs.length;
    document.getElementById('successCount').textContent = auditLogs.filter(l => l.status === 'success').length;
    document.getElementById('failedCount').textContent = auditLogs.filter(l => l.status === 'failed').length;
    document.getElementById('warningCount').textContent = auditLogs.filter(l => l.status === 'warning').length;
}

// Render logs table
function renderLogs() {
    const tbody = document.getElementById('logsTableBody');
    const start = (currentPage - 1) * logsPerPage;
    const end = start + logsPerPage;
    const pageLogs = filteredLogs.slice(start, end);
    
    if (pageLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">No logs found</td></tr>';
        return;
    }
    
    tbody.innerHTML = pageLogs.map(log => `
        <tr onclick="viewLogDetails('${log.id}')" style="cursor: pointer;">
            <td>${formatTimestamp(log.timestamp)}</td>
            <td>${log.user}</td>
            <td><span class="user-badge ${log.userType}">${log.userType.toUpperCase()}</span></td>
            <td>${log.action}</td>
            <td>${log.details}</td>
            <td>${log.ip}</td>
            <td><span class="status-badge ${log.status}">${log.status.toUpperCase()}</span></td>
        </tr>
    `).join('');
    
    renderPagination();
}

// Render pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
    const pagination = document.getElementById('pagination');
    
    let html = '<button onclick="changePage(1)" ' + (currentPage === 1 ? 'disabled' : '') + '><i class="fas fa-angle-double-left"></i></button>';
    html += '<button onclick="changePage(' + (currentPage - 1) + ')" ' + (currentPage === 1 ? 'disabled' : '') + '><i class="fas fa-angle-left"></i></button>';
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="active">${i}</button>`;
        } else if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<button disabled>...</button>`;
        }
    }
    
    html += '<button onclick="changePage(' + (currentPage + 1) + ')" ' + (currentPage === totalPages ? 'disabled' : '') + '><i class="fas fa-angle-right"></i></button>';
    html += '<button onclick="changePage(' + totalPages + ')" ' + (currentPage === totalPages ? 'disabled' : '') + '><i class="fas fa-angle-double-right"></i></button>';
    
    pagination.innerHTML = html;
}

// Change page
function changePage(page) {
    if (page < 1 || page > Math.ceil(filteredLogs.length / logsPerPage)) return;
    currentPage = page;
    renderLogs();
}

// Apply filters
function applyFilters() {
    const dateRange = document.getElementById('dateRange').value;
    const userType = document.getElementById('userType').value;
    const actionType = document.getElementById('actionType').value;
    const status = document.getElementById('status').value;
    
    // Show/hide custom date range
    document.getElementById('customDateRow').style.display = dateRange === 'custom' ? 'flex' : 'none';
    
    if (dateRange === 'custom') return;
    
    // Apply filters
    filteredLogs = auditLogs.filter(log => {
        // Date filter
        if (dateRange !== 'all') {
            const logDate = new Date(log.timestamp);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            switch(dateRange) {
                case 'today':
                    if (logDate < today) return false;
                    break;
                case 'yesterday':
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    if (logDate < yesterday || logDate >= today) return false;
                    break;
                case 'week':
                    const weekAgo = new Date(now.setDate(now.getDate() - 7));
                    if (logDate < weekAgo) return false;
                    break;
                case 'month':
                    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
                    if (logDate < monthAgo) return false;
                    break;
            }
        }
        
        // User type filter
        if (userType !== 'all' && log.userType !== userType) return false;
        
        // Action type filter
        if (actionType !== 'all' && log.actionType !== actionType) return false;
        
        // Status filter
        if (status !== 'all' && log.status !== status) return false;
        
        return true;
    });
    
    currentPage = 1;
    updateStatistics();
    renderLogs();
}

// Apply custom date range
function applyCustomDate() {
    const start = new Date(document.getElementById('startDate').value);
    const end = new Date(document.getElementById('endDate').value);
    
    filteredLogs = auditLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= start && logDate <= end;
    });
    
    currentPage = 1;
    updateStatistics();
    renderLogs();
}

// Search logs
function searchLogs() {
    const searchTerm = event.target.value.toLowerCase();
    
    filteredLogs = auditLogs.filter(log => 
        log.user.toLowerCase().includes(searchTerm) ||
        log.details.toLowerCase().includes(searchTerm) ||
        log.action.toLowerCase().includes(searchTerm) ||
        log.ip.includes(searchTerm)
    );
    
    currentPage = 1;
    renderLogs();
}

// Clear filters
function clearFilters() {
    document.getElementById('dateRange').value = 'week';
    document.getElementById('userType').value = 'all';
    document.getElementById('actionType').value = 'all';
    document.getElementById('status').value = 'all';
    document.getElementById('customDateRow').style.display = 'none';
    
    filteredLogs = [...auditLogs];
    currentPage = 1;
    updateStatistics();
    renderLogs();
    
    showToast('Filters cleared', 'info');
}

// View log details
function viewLogDetails(logId) {
    const log = auditLogs.find(l => l.id == logId);
    if (!log) return;
    
    const detailsDiv = document.getElementById('logDetails');
    detailsDiv.innerHTML = `
        <div class="detail-group">
            <label>Log ID:</label>
            <span>${log.id}</span>
        </div>
        <div class="detail-group">
            <label>Timestamp:</label>
            <span>${new Date(log.timestamp).toLocaleString()}</span>
        </div>
        <div class="detail-group">
            <label>User:</label>
            <span>${log.user} (${log.userType})</span>
        </div>
        <div class="detail-group">
            <label>Action:</label>
            <span>${log.action}</span>
        </div>
        <div class="detail-group">
            <label>Details:</label>
            <span>${log.details}</span>
        </div>
        <div class="detail-group">
            <label>IP Address:</label>
            <span>${log.ip}</span>
        </div>
        <div class="detail-group">
            <label>Status:</label>
            <span class="status-badge ${log.status}">${log.status}</span>
        </div>
        ${log.metadata ? `
            <h4 style="margin-top: 15px;">Additional Information</h4>
            <div class="detail-group">
                <label>Browser:</label>
                <span>${log.metadata.browser || 'N/A'}</span>
            </div>
            <div class="detail-group">
                <label>OS:</label>
                <span>${log.metadata.os || 'N/A'}</span>
            </div>
            <div class="detail-group">
                <label>Location:</label>
                <span>${log.metadata.location || 'N/A'}</span>
            </div>
        ` : ''}
    `;
    
    document.getElementById('logModal').classList.add('active');
}

// Export logs
function exportLogs() {
    const format = confirm('Export as CSV? Click OK for CSV, Cancel for JSON') ? 'csv' : 'json';
    
    if (format === 'csv') {
        // Convert to CSV
        const headers = ['Timestamp', 'User', 'User Type', 'Action', 'Details', 'IP', 'Status'];
        const csvData = filteredLogs.map(log => [
            log.timestamp,
            log.user,
            log.userType,
            log.action,
            log.details,
            log.ip,
            log.status
        ]);
        
        const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
        downloadFile(csv, 'audit-logs.csv', 'text/csv');
    } else {
        // Export as JSON
        const json = JSON.stringify(filteredLogs, null, 2);
        downloadFile(json, 'audit-logs.json', 'application/json');
    }
    
    showToast(`Exported ${filteredLogs.length} logs`, 'success');
}

// Download file
function downloadFile(content, fileName, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

// Format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 24 hours
    if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
        
        if (hours === 0) {
            return `${minutes} minutes ago`;
        } else {
            return `${hours} hours ago`;
        }
    }
    
    return date.toLocaleString();
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Show toast
function showToast(message, type = 'info') {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
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

// Make functions globally available
window.applyFilters = applyFilters;
window.applyCustomDate = applyCustomDate;
window.searchLogs = searchLogs;
window.clearFilters = clearFilters;
window.viewLogDetails = viewLogDetails;
window.exportLogs = exportLogs;
window.changePage = changePage;
window.closeModal = closeModal;