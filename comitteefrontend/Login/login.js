// login.js – handles tab switching, form validation, done state, and navigation back to home

document.addEventListener('DOMContentLoaded', function () {
  // --- DOM elements ---
  const backBtn = document.getElementById('backToHomeBtn');
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
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const showPasswordBtn = document.getElementById('showPasswordBtn');
  const guidelinesModal = document.getElementById('guidelinesModal');
  const closeGuidelinesBtn = document.getElementById('closeGuidelinesBtn');
  const acknowledgeGuidelinesBtn = document.getElementById('acknowledgeGuidelinesBtn');

  // --- Show/Hide Password Toggle ---
  showPasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    showPasswordBtn.innerText = isPassword ? '👁️‍🗨️' : '👁️';
  });

  // --- Guidelines Modal ---
  closeGuidelinesBtn.addEventListener('click', () => {
    guidelinesModal.classList.add('hidden');
  });

  acknowledgeGuidelinesBtn.addEventListener('click', () => {
    guidelinesModal.classList.add('hidden');
    window.location.href = '../Dashboard/dashboard.html';
  });

  // --- Back to home (home.html) ---
  backBtn.addEventListener('click', () => {
    window.location.href = '../../index.html';
  });

  // --- Forgot password link (no-op) ---
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    // could show a toast, but we just prevent default
  });

  // --- Form submission ---
  authForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const password = passwordInput.value.trim();

    // Basic validations
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
      formState.classList.add('hidden');
      guidelinesModal.classList.remove('hidden');
      submitBtn.innerText = originalText;
      submitBtn.disabled = false;
    }, 1000);
  });

  // --- Go to Dashboard (back home) ---
  goDashboard.addEventListener('click', () => {
    window.location.href = '../Dashboard/dashboard.html';
  });

  // Prevent any stray form submissions from reloading
  authForm.addEventListener('submit', (e) => e.preventDefault(), false);
});