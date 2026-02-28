// Sample users data (replace with API calls)
let users = [
    {
        id: 1,
        name: 'Alice Smith',
        email: 'alice@victim.com',
        role: 'victim',
        status: 'active',
        joinedDate: '2024-01-15'
    },
    {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah@committee.com',
        role: 'committee',
        status: 'active',
        joinedDate: '2024-01-10',
        department: 'HR Committee',
        designation: 'HR Head'
    },
    {
        id: 3,
        name: 'Emma Watson',
        email: 'emma@victim.com',
        role: 'victim',
        status: 'blocked',
        joinedDate: '2024-01-05'
    },
    {
        id: 4,
        name: 'Maria Garcia',
        email: 'maria@committee.com',
        role: 'committee',
        status: 'active',
        joinedDate: '2024-01-01',
        department: 'Legal Committee',
        designation: 'Legal Advisor'
    }
];

let currentTab = 'all';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
});

// Load users based on current tab
function loadUsers() {
    let filteredUsers = users;
    
    switch(currentTab) {
        case 'victims':
            filteredUsers = users.filter(u => u.role === 'victim');
            break;
        case 'committee':
            filteredUsers = users.filter(u => u.role === 'committee');
            break;
        case 'blocked':
            filteredUsers = users.filter(u => u.status === 'blocked');
            break;
    }
    
    renderUsersTable(filteredUsers);
}

// Render users table
function renderUsersTable(userList) {
    const tbody = document.getElementById('usersTableBody');
    
    if (userList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = userList.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="role-badge">${user.role.toUpperCase()}</span></td>
            <td><span class="status-badge status-${user.status}">${user.status.toUpperCase()}</span></td>
            <td>${formatDate(user.joinedDate)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" onclick="viewUser(${user.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${user.status === 'blocked' ? 
                        `<button class="action-btn unblock-btn" onclick="unblockUser(${user.id})">
                            <i class="fas fa-unlock"></i>
                        </button>` : 
                        `<button class="action-btn block-btn" onclick="blockUser(${user.id})">
                            <i class="fas fa-ban"></i>
                        </button>`
                    }
                    <button class="action-btn delete-btn" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Switch user tab
function switchUserTab(tab) {
    currentTab = tab;
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    loadUsers();
}

// Search users
function searchUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.role.toLowerCase().includes(searchTerm)
    );
    
    renderUsersTable(filteredUsers);
}

// Show add committee member modal
function showAddCommitteeModal() {
    document.getElementById('addCommitteeForm').reset();
    document.getElementById('addCommitteeModal').classList.add('active');
}

// Add committee member
function addCommitteeMember(event) {
    event.preventDefault();
    
    const name = document.getElementById('memberName').value;
    const email = document.getElementById('memberEmail').value;
    const password = document.getElementById('memberPassword').value;
    const confirmPassword = document.getElementById('memberConfirmPassword').value;
    const department = document.getElementById('memberDepartment').value;
    const designation = document.getElementById('memberDesignation').value;
    const contact = document.getElementById('memberContact').value;
    
    // Validation
    if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters long!', 'error');
        return;
    }
    
    // Check if email already exists
    if (users.some(u => u.email === email)) {
        showToast('Email already exists!', 'error');
        return;
    }
    
    // Create new committee member
    const newMember = {
        id: users.length + 1,
        name: name,
        email: email,
        role: 'committee',
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0],
        department: department,
        designation: designation,
        contact: contact
    };
    
    // Add to users array (in real app, this would be an API call)
    users.push(newMember);
    
    // Show success message
    showToast('Committee member added successfully!', 'success');
    
    // Close modal and refresh
    closeModal('addCommitteeModal');
    loadUsers();
    
    // Log the action (for audit)
    logAudit('Added committee member', { name, email, department });
}

// View user details
function viewUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // In a real app, this would show a detailed view modal
    showToast(`Viewing ${user.name}'s details`, 'info');
}

// Edit user
function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editName').value = user.name;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editRole').value = user.role;
    document.getElementById('editStatus').value = user.status;
    
    document.getElementById('editUserModal').classList.add('active');
}

// Update user
function updateUser(event) {
    event.preventDefault();
    
    const userId = parseInt(document.getElementById('editUserId').value);
    const user = users.find(u => u.id === userId);
    
    if (user) {
        const oldData = {...user};
        
        user.name = document.getElementById('editName').value;
        user.email = document.getElementById('editEmail').value;
        user.role = document.getElementById('editRole').value;
        user.status = document.getElementById('editStatus').value;
        
        showToast('User updated successfully!', 'success');
        closeModal('editUserModal');
        loadUsers();
        
        // Log the update
        logAudit('Updated user', { old: oldData, new: user });
    }
}

// Block user
function blockUser(userId) {
    if (confirm('Are you sure you want to block this user?')) {
        const user = users.find(u => u.id === userId);
        if (user) {
            user.status = 'blocked';
            showToast(`${user.name} has been blocked`, 'info');
            loadUsers();
            
            // Log the action
            logAudit('Blocked user', { userId, userName: user.name });
        }
    }
}

// Unblock user
function unblockUser(userId) {
    if (confirm('Are you sure you want to unblock this user?')) {
        const user = users.find(u => u.id === userId);
        if (user) {
            user.status = 'active';
            showToast(`${user.name} has been unblocked`, 'success');
            loadUsers();
            
            // Log the action
            logAudit('Unblocked user', { userId, userName: user.name });
        }
    }
}

// Delete user
function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            const deletedUser = users.splice(userIndex, 1)[0];
            showToast('User deleted successfully', 'success');
            loadUsers();
            
            // Log the action
            logAudit('Deleted user', { userId, userName: deletedUser.name });
        }
    }
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Show toast notification
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

// Log audit (in real app, this would send to backend)
function logAudit(action, details) {
    const auditEntry = {
        timestamp: new Date().toISOString(),
        admin: 'Michael Brown', // In real app, get from session
        action: action,
        details: details,
        ip: '192.168.1.1' // In real app, get from request
    };
    
    console.log('Audit Log:', auditEntry);
    
    // Store in localStorage for demo (in real app, send to backend)
    const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    auditLogs.push(auditEntry);
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
}

// Make functions globally available
window.switchUserTab = switchUserTab;
window.searchUsers = searchUsers;
window.showAddCommitteeModal = showAddCommitteeModal;
window.addCommitteeMember = addCommitteeMember;
window.viewUser = viewUser;
window.editUser = editUser;
window.updateUser = updateUser;
window.blockUser = blockUser;
window.unblockUser = unblockUser;
window.deleteUser = deleteUser;
window.closeModal = closeModal;