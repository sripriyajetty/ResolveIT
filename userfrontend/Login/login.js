// login.js – handles tab switching, form validation, done state, and navigation back to home

document.addEventListener('DOMContentLoaded', function () {
  // --- DOM elements ---
  const backBtn = document.getElementById('backToHomeBtn');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const nameField = document.getElementById('nameField');
  const confirmField = document.getElementById('confirmField');
  const formTitle = document.getElementById('formTitle');
  const formSub = document.getElementById('formSub');
  const submitBtn = document.getElementById('submitBtn');
  const errorMsg = document.getElementById('errorMsg');
  const authForm = document.getElementById('authForm');
  const formState = document.getElementById('formState');
  const doneState = document.getElementById('doneState');
  const doneTitle = document.getElementById('doneTitle');
  const goDashboard = document.getElementById('goDashboardBtn');
  const forgotLink = document.getElementById('forgotLink');

  // inputs
  const nameInput = document.getElementById('nameInput');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const confirmInput = document.getElementById('confirmInput');

  // --- Helper to switch UI mode ---
  function setMode(mode) {
    if (mode === 'login') {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      nameField.classList.add('hidden');
      confirmField.classList.add('hidden');
      formTitle.innerText = 'Welcome back';
      formSub.innerText = 'Sign in to access your reports';
      submitBtn.innerText = 'Sign In Securely';
      // optional: clear confirm field
      confirmInput.value = '';
    } else {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      nameField.classList.remove('hidden');
      confirmField.classList.remove('hidden');
      formTitle.innerText = 'Create account';
      formSub.innerText = 'Join ResolveIT to file your report';
      submitBtn.innerText = 'Create Account';
    }
    errorMsg.innerText = ''; // clear errors
  }

  // --- Tab click handlers ---
  tabLogin.addEventListener('click', () => setMode('login'));
  tabRegister.addEventListener('click', () => setMode('register'));

  // --- Back to home (home.html) ---
  backBtn.addEventListener('click', () => {
    window.location.href = '../Home/home.html';
  });

  // --- Forgot password link (no-op) ---
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    // could show a toast, but we just prevent default
  });

  // --- Form submission ---
  authForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const isLogin = tabLogin.classList.contains('active');
    const password = passwordInput.value.trim();
    const confirm = confirmInput.value.trim();

    // Basic validations
    if (!isLogin && password !== confirm) {
      errorMsg.innerText = 'Passwords do not match.';
      return;
    }
    if (password.length < 6) {
      errorMsg.innerText = 'Password must be at least 6 characters.';
      return;
    }
    errorMsg.innerText = '';

    // Simulate loading
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Please wait...';
    submitBtn.disabled = true;

    setTimeout(() => {
      // Hide form, show done state
      formState.classList.add('hidden');
      doneState.classList.remove('hidden');

      // Customize done message based on mode
      if (isLogin) {
        doneTitle.innerText = 'Welcome back!';
      } else {
        doneTitle.innerText = 'Account created!';
      }

      // Re-enable button (though form hidden)
      submitBtn.innerText = originalText;
      submitBtn.disabled = false;
    }, 1000);
  });

  // --- Go to Dashboard (back home) ---
  goDashboard.addEventListener('click', () => {
    window.location.href = '../Dashboard/dashboard.html';
  });

  // --- Initialize (default login) ---
  setMode('login');

  // Prevent any stray form submissions from reloading
  authForm.addEventListener('submit', (e) => e.preventDefault(), false);
});