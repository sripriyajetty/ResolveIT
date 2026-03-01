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
  // per-field error elements
  const nameError = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const confirmError = document.getElementById('confirmError');

  // --- Helper to switch UI mode ---
  function setMode(mode) {
    if (mode === 'login') {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      nameField.classList.add('hidden');
      confirmField.classList.add('hidden');
      formTitle.innerText = 'Welcome back';
      formSub.innerText = 'Sign in to access your reports';
      submitBtn.innerText = 'Sign In';
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
    errorMsg.innerText = ''; // clear global errors
    // clear per-field errors and invalid state
    [nameError, emailError, passwordError, confirmError].forEach(el => { if (el) el.innerText = ''; });
    [nameInput, emailInput, passwordInput, confirmInput].forEach(i => { if (i) i.classList.remove('invalid'); });
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
    // Run field validators and block submit if any errors
    const emailOk = validateEmailField();
    const passwordOk = validatePasswordField();
    const confirmOk = validateConfirmField();
    const nameOk = isLogin ? true : validateNameField();

    if (!emailOk || !passwordOk || !confirmOk || !nameOk) {
      errorMsg.innerText = 'Please fix the highlighted errors.';
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

  // --- Validation helpers (live) ---
  function setFieldError(inputEl, errorEl, message) {
    if (!errorEl || !inputEl) return;
    if (message) {
      errorEl.innerText = message;
      inputEl.classList.add('invalid');
      return false;
    }
    errorEl.innerText = '';
    inputEl.classList.remove('invalid');
    return true;
  }

  function validateEmailField() {
    const v = emailInput.value.trim();
    if (!v) return setFieldError(emailInput, emailError, 'Email is required.');
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(v)) return setFieldError(emailInput, emailError, 'Enter a valid email address.');
    return setFieldError(emailInput, emailError, '');
  }

  function validatePasswordField() {
    const v = passwordInput.value;
    if (!v) return setFieldError(passwordInput, passwordError, 'Password is required.');
    // stronger policy: min 8 chars, at least one uppercase, one lowercase, one digit, one special char
    if (v.length < 8) return setFieldError(passwordInput, passwordError, 'Password must be at least 8 characters.');
    if (!/[A-Z]/.test(v)) return setFieldError(passwordInput, passwordError, 'Include at least one uppercase letter.');
    if (!/[a-z]/.test(v)) return setFieldError(passwordInput, passwordError, 'Include at least one lowercase letter.');
    if (!/\d/.test(v)) return setFieldError(passwordInput, passwordError, 'Include at least one digit.');
    if (!/[^A-Za-z0-9]/.test(v)) return setFieldError(passwordInput, passwordError, 'Include at least one special character.');
    return setFieldError(passwordInput, passwordError, '');
  }

  function validateConfirmField() {
    if (tabLogin.classList.contains('active')) {
      // no confirm needed for login
      setFieldError(confirmInput, confirmError, '');
      return true;
    }
    const v = confirmInput.value;
    if (!v) return setFieldError(confirmInput, confirmError, 'Please confirm your password.');
    if (v !== passwordInput.value) return setFieldError(confirmInput, confirmError, 'Passwords do not match.');
    return setFieldError(confirmInput, confirmError, '');
  }

  function validateNameField() {
    if (tabLogin.classList.contains('active')) {
      setFieldError(nameInput, nameError, '');
      return true;
    }
    const v = nameInput.value.trim();
    if (!v) return setFieldError(nameInput, nameError, 'Full name is required.');
    if (v.length < 2) return setFieldError(nameInput, nameError, 'Please enter your full name.');
    return setFieldError(nameInput, nameError, '');
  }

  // Attach live listeners
  emailInput.addEventListener('input', () => { validateEmailField(); errorMsg.innerText = ''; });
  passwordInput.addEventListener('input', () => { validatePasswordField(); validateConfirmField(); errorMsg.innerText = ''; });
  confirmInput.addEventListener('input', () => { validateConfirmField(); errorMsg.innerText = ''; });
  nameInput.addEventListener('input', () => { validateNameField(); errorMsg.innerText = ''; });

  // --- Initialize (default login) ---
  setMode('login');

  // Prevent any stray form submissions from reloading
  authForm.addEventListener('submit', (e) => e.preventDefault(), false);
});