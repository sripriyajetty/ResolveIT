// login.js – Admin login wired to Spring Boot /api/auth/login
document.addEventListener('DOMContentLoaded', function () {

  // --- DOM elements ---
  const backBtn         = document.getElementById('backToHomeBtn');
  const submitBtn       = document.getElementById('submitBtn');
  const errorMsg        = document.getElementById('errorMsg');
  const authForm        = document.getElementById('authForm');
  const formState       = document.getElementById('formState');
  const doneState       = document.getElementById('doneState');
  const goDashboard     = document.getElementById('goDashboardBtn');
  const forgotLink      = document.getElementById('forgotLink');
  const emailInput      = document.getElementById('emailInput');
  const passwordInput   = document.getElementById('passwordInput');
  const showPasswordBtn = document.getElementById('showPasswordBtn');

  // --- Redirect if already logged in as admin ---
  if (localStorage.getItem('token') && localStorage.getItem('userRole') === 'ROLE_ADMIN') {
    window.location.href = '../Dashboard/dashboard.html';
    return;
  }

  // --- Show/Hide Password Toggle ---
  showPasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    showPasswordBtn.innerText = isPassword ? '👁️‍🗨️' : '👁️';
  });

  // --- Back to home ---
  backBtn.addEventListener('click', () => {
    window.location.href = '../../index.html';
  });

  // --- Forgot password (no-op for now) ---
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
  });

  // --- Form submission ---
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.innerText = '';

    const email    = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Basic client-side validation
    if (!email) {
      errorMsg.innerText = 'Please enter your email address.';
      return;
    }
    if (password.length < 6) {
      errorMsg.innerText = 'Password must be at least 6 characters.';
      return;
    }

    // Loading state
    submitBtn.innerText  = 'Signing in...';
    submitBtn.disabled   = true;

    try {
      // POST /api/auth/login
      // Response shape from backend: { token, userId, name, role }
      const data = await apiCall('/auth/login', 'POST', { email, password });

      // Guard: only allow ADMIN logins on this portal
      if (data.role !== 'ROLE_ADMIN') {
        errorMsg.innerText  = 'Access denied. This portal is for admins only.';
        submitBtn.innerText = 'Sign In';
        submitBtn.disabled  = false;
        return;
      }

      // Persist to localStorage — same keys as user login for consistency
      localStorage.setItem('token',    data.token);
      localStorage.setItem('userId',   data.userId);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userRole',  data.role);
      localStorage.setItem('userEmail', email);

      // Redirect directly to dashboard
      window.location.href = '../Dashboard/dashboard.html';

    } catch (err) {
      errorMsg.innerText  = err.message || 'Login failed. Please check your credentials.';
      submitBtn.innerText = 'Sign In';
      submitBtn.disabled  = false;
      passwordInput.value = '';
    }
  });

  // --- Go to Dashboard button (inside done state) ---
  goDashboard.addEventListener('click', () => {
    window.location.href = '../Dashboard/dashboard.html';
  });

});