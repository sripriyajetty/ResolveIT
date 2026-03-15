// manage-users.js – wired to Spring Boot /api/admin/users

let allUsers     = [];   // full list from server
let filteredUsers = [];  // after tab + search filter
let currentTab   = 'all';

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchUsers();
});

// ─── Fetch all users from backend ─────────────────────────────────────────────
// GET /api/admin/users
// Response: [{ id, name, email, active, createdAt, roles: ['ROLE_VICTIM'] }, ...]
async function fetchUsers() {
  showTableLoading();
  try {
    allUsers = await apiCall('/admin/users');
    applyTabFilter();
  } catch (err) {
    document.getElementById('usersTableBody').innerHTML =
      `<tr><td colspan="6" style="text-align:center;color:#e74c3c;padding:30px;">
         Failed to load users: ${err.message}
       </td></tr>`;
    showToast('Failed to load users', 'error');
  }
}

// ─── Tab filtering (client-side on fetched data) ───────────────────────────────
function applyTabFilter() {
  const search = (document.getElementById('searchInput').value || '').toLowerCase();

  let list = allUsers;

  switch (currentTab) {
    case 'victims':
      list = allUsers.filter(u => hasRole(u, 'ROLE_VICTIM'));
      break;
    case 'committee':
      list = allUsers.filter(u => hasRole(u, 'ROLE_COMMITTEE'));
      break;
    case 'blocked':
      list = allUsers.filter(u => !u.active);
      break;
  }

  // Apply search on top
  if (search) {
    list = list.filter(u =>
      (u.name  || '').toLowerCase().includes(search) ||
      (u.email || '').toLowerCase().includes(search) ||
      getRoleLabel(u).toLowerCase().includes(search)
    );
  }

  filteredUsers = list;
  renderUsersTable(filteredUsers);
}

function switchUserTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.currentTarget.classList.add('active');
  applyTabFilter();
}

function searchUsers() {
  applyTabFilter();
}

// ─── Render table ─────────────────────────────────────────────────────────────
function renderUsersTable(userList) {
  const tbody = document.getElementById('usersTableBody');

  if (!userList || userList.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;padding:30px;color:#aaa;">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = userList.map(user => {
    const status    = user.active ? 'active' : 'blocked';
    const roleLabel = getRoleLabel(user);
    return `
      <tr>
        <td>${user.name  || '–'}</td>
        <td>${user.email || '–'}</td>
        <td><span class="role-badge">${roleLabel}</span></td>
        <td><span class="status-badge status-${status}">${status.toUpperCase()}</span></td>
        <td>${user.createdAt ? formatDate(user.createdAt) : '–'}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn edit-btn" onclick="editUser(${user.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            ${user.active
              ? `<button class="action-btn block-btn" onclick="blockUser(${user.id})" title="Block">
                   <i class="fas fa-ban"></i>
                 </button>`
              : `<button class="action-btn unblock-btn" onclick="unblockUser(${user.id})" title="Unblock">
                   <i class="fas fa-unlock"></i>
                 </button>`
            }
            <button class="action-btn delete-btn" onclick="deleteUser(${user.id})" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ─── Add Committee Member ─────────────────────────────────────────────────────
// POST /api/admin/users/committee
function showAddCommitteeModal() {
  document.getElementById('addCommitteeForm').reset();
  document.getElementById('addCommitteeModal').classList.add('active');
}

async function addCommitteeMember(event) {
  event.preventDefault();

  const name            = document.getElementById('memberName').value.trim();
  const email           = document.getElementById('memberEmail').value.trim();
  const password        = document.getElementById('memberPassword').value;
  const confirmPassword = document.getElementById('memberConfirmPassword').value;
  const errorEl         = document.getElementById('addMemberError');

  // Reset inline error
  errorEl.style.display = 'none';
  errorEl.textContent   = '';

  if (password !== confirmPassword) {
    errorEl.textContent   = 'Passwords do not match!';
    errorEl.style.display = 'block';
    return;
  }
  if (password.length < 6) {
    errorEl.textContent   = 'Password must be at least 6 characters!';
    errorEl.style.display = 'block';
    return;
  }

  const submitBtn       = event.target.querySelector('.submit-btn');
  submitBtn.textContent = 'Adding...';
  submitBtn.disabled    = true;

  try {
    // POST /api/admin/users/committee  — body: { name, email, password }
    await apiCall('/admin/users/committee', 'POST', { name, email, password });

    showToast('Committee member added successfully!', 'success');
    closeModal('addCommitteeModal');
    fetchUsers();

  } catch (err) {
    errorEl.textContent   = err.message || 'Failed to add committee member';
    errorEl.style.display = 'block';
  } finally {
    submitBtn.textContent = 'Add Committee Member';
    submitBtn.disabled    = false;
  }
}

// ─── Edit User ────────────────────────────────────────────────────────────────
function editUser(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;

  document.getElementById('editUserId').value = user.id;
  document.getElementById('editName').value   = user.name  || '';
  document.getElementById('editEmail').value  = user.email || '';
  document.getElementById('editRole').value   =
    hasRole(user, 'ROLE_COMMITTEE') ? 'committee' : 'victim';
  document.getElementById('editStatus').value = user.active ? 'active' : 'blocked';

  document.getElementById('editUserModal').classList.add('active');
}

// Update — currently calls block/unblock based on status change
// (full edit endpoint can be added to AdminController later)
async function updateUser(event) {
  event.preventDefault();

  const userId    = parseInt(document.getElementById('editUserId').value);
  const newStatus = document.getElementById('editStatus').value;
  const user      = allUsers.find(u => u.id === userId);
  if (!user) return;

  const submitBtn = event.target.querySelector('.submit-btn');
  submitBtn.textContent = 'Saving...';
  submitBtn.disabled    = true;

  try {
    // If status changed, call block/unblock
    const wasActive = user.active;
    const wantActive = newStatus === 'active';

    if (wasActive && !wantActive) {
      await apiCall(`/admin/users/${userId}/block`, 'PUT');
    } else if (!wasActive && wantActive) {
      await apiCall(`/admin/users/${userId}/unblock`, 'PUT');
    }

    showToast('User updated successfully!', 'success');
    closeModal('editUserModal');
    fetchUsers();

  } catch (err) {
    showToast(err.message || 'Failed to update user', 'error');
  } finally {
    submitBtn.textContent = 'Update User';
    submitBtn.disabled    = false;
  }
}

// ─── Block / Unblock / Delete ─────────────────────────────────────────────────
async function blockUser(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user || !confirm(`Block ${user.name}?`)) return;
  try {
    // PUT /api/admin/users/{id}/block
    await apiCall(`/admin/users/${userId}/block`, 'PUT');
    showToast(`${user.name} has been blocked`, 'info');
    fetchUsers();
  } catch (err) {
    showToast(err.message || 'Failed to block user', 'error');
  }
}

async function unblockUser(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user || !confirm(`Unblock ${user.name}?`)) return;
  try {
    // PUT /api/admin/users/{id}/unblock
    await apiCall(`/admin/users/${userId}/unblock`, 'PUT');
    showToast(`${user.name} has been unblocked`, 'success');
    fetchUsers();
  } catch (err) {
    showToast(err.message || 'Failed to unblock user', 'error');
  }
}

async function deleteUser(userId) {
  const user        = allUsers.find(u => u.id === userId);
  if (!user) return;

  // Prevent admin from deleting themselves
  const currentEmail = localStorage.getItem('userEmail') || localStorage.getItem('email');
  if (currentEmail && user.email === currentEmail) {
    showToast('You cannot delete your own account!', 'error');
    return;
  }

  if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;

  try {
    // DELETE /api/admin/users/{id}
    await apiCall(`/admin/users/${userId}`, 'DELETE');
    showToast('User deleted successfully', 'success');
    fetchUsers();
  } catch (err) {
    // Backend also guards this — show its message directly
    showToast(err.message || 'Failed to delete user', 'error');
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hasRole(user, roleName) {
  return Array.isArray(user.roles) && user.roles.includes(roleName);
}

function getRoleLabel(user) {
  if (!user.roles || user.roles.length === 0) return 'UNKNOWN';
  const r = user.roles[0];
  return r.replace('ROLE_', '');
}

function formatDate(dateStr) {
  if (!dateStr) return '–';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function showTableLoading() {
  document.getElementById('usersTableBody').innerHTML =
    `<tr><td colspan="6" style="text-align:center;padding:30px;color:#aaa;">
       <i class="fas fa-spinner fa-spin"></i> Loading...
     </td></tr>`;
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

// ─── Password Toggle ──────────────────────────────────────────────────────────
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.textContent = isPassword ? '👁️‍🗨️' : '👁️';
}

// ─── Expose globals ───────────────────────────────────────────────────────────
window.switchUserTab        = switchUserTab;
window.searchUsers          = searchUsers;
window.showAddCommitteeModal = showAddCommitteeModal;
window.addCommitteeMember   = addCommitteeMember;
window.editUser             = editUser;
window.updateUser           = updateUser;
window.blockUser            = blockUser;
window.unblockUser          = unblockUser;
window.deleteUser           = deleteUser;
window.closeModal           = closeModal;
window.togglePassword       = togglePassword;