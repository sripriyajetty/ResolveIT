// login.js /api/auth/login

document.addEventListener('DOMContentLoaded', function () {

  // --- DOM elements ---
  const backBtn         = document.getElementById('backToHomeBtn');
  const submitBtn       = document.getElementById('submitBtn');
  const errorMsg        = document.getElementById('errorMsg');
  const authForm        = document.getElementById('authForm');
  const formState       = document.getElementById('formState');
  const forgotLink      = document.getElementById('forgotLink');
  const emailInput      = document.getElementById('emailInput');
  const passwordInput   = document.getElementById('passwordInput');
  const showPasswordBtn = document.getElementById('showPasswordBtn');
  const guidelinesModal = document.getElementById('guidelinesModal');
  const closeGuidelinesBtn     = document.getElementById('closeGuidelinesBtn');
  const acknowledgeGuidelinesBtn = document.getElementById('acknowledgeGuidelinesBtn');

  // --- Redirect if already logged in as committee member ---
  if (localStorage.getItem('token') && localStorage.getItem('userRole') === 'ROLE_COMMITTEE') {
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

  // --- Guidelines Modal: close without proceeding ---
  closeGuidelinesBtn.addEventListener('click', () => {
    guidelinesModal.classList.add('hidden');
    // Re-enable form so user can try again if they closed by mistake
    submitBtn.disabled  = false;
    submitBtn.innerText = 'Sign In';
  });

  // --- Guidelines Modal: acknowledge → go to dashboard ---
  acknowledgeGuidelinesBtn.addEventListener('click', () => {
    guidelinesModal.classList.add('hidden');
    window.location.href = '../Dashboard/dashboard.html';
  });

  // --- Form submission ---
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.innerText = '';

    const email    = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Client-side validation
    if (!email) {
      errorMsg.innerText = 'Please enter your email address.';
      return;
    }
    if (password.length < 6) {
      errorMsg.innerText = 'Password must be at least 6 characters.';
      return;
    }

    // Loading state
    submitBtn.innerText = 'Signing in...';
    submitBtn.disabled  = true;

    try {
      // POST /api/auth/login
      // Expected response: { token, userId, name, role }
      const data = await apiCall('/auth/login', 'POST', { email, password });

      // Guard: only allow ROLE_COMMITTEE logins on this portal
      if (data.role !== 'ROLE_COMMITTEE') {
        errorMsg.innerText  = 'Access denied. This portal is for committee members only.';
        submitBtn.innerText = 'Sign In';
        submitBtn.disabled  = false;
        passwordInput.value = '';
        return;
      }

      // Persist session to localStorage — consistent keys across all portals
      localStorage.setItem('token',     data.token);
      localStorage.setItem('userId',    data.userId);
      localStorage.setItem('userName',  data.name);
      localStorage.setItem('userRole',  data.role);
      localStorage.setItem('userEmail', email);

      // Show the guidelines modal before entering the dashboard
      formState.classList.add('hidden');
      guidelinesModal.classList.remove('hidden');

    } catch (err) {
      errorMsg.innerText  = err.message || 'Login failed. Please check your credentials.';
      submitBtn.innerText = 'Sign In';
      submitBtn.disabled  = false;
      passwordInput.value = '';
    }
  });

});