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

  // show password buttons
  const showPasswordBtn = document.getElementById('showPasswordBtn');
  const showConfirmPasswordBtn = document.getElementById('showConfirmPasswordBtn');
  const passwordRequirements = document.getElementById('passwordRequirements');

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
      passwordRequirements.classList.add('hidden');
    } else {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      nameField.classList.remove('hidden');
      confirmField.classList.remove('hidden');
      formTitle.innerText = 'Create account';
      formSub.innerText = 'Join ResolveIT to file your report';
      submitBtn.innerText = 'Create Account';
      passwordRequirements.classList.remove('hidden');
    }
    errorMsg.innerText = ''; // clear global errors
    // clear per-field errors and invalid state
    [nameError, emailError, passwordError, confirmError].forEach(el => { if (el) el.innerText = ''; });
    [nameInput, emailInput, passwordInput, confirmInput].forEach(i => { if (i) i.classList.remove('invalid'); });
  }

  // --- Tab click handlers ---
  tabLogin.addEventListener('click', () => setMode('login'));
  tabRegister.addEventListener('click', () => setMode('register'));

  // --- Show/Hide Password Toggles ---
  showPasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    showPasswordBtn.innerText = isPassword ? '👁️‍🗨️' : '👁️';
  });

  showConfirmPasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isPassword = confirmInput.type === 'password';
    confirmInput.type = isPassword ? 'text' : 'password';
    showConfirmPasswordBtn.innerText = isPassword ? '👁️‍🗨️' : '👁️';
  });

  // --- Back to home (home.html) ---
  backBtn.addEventListener('click', () => {
    window.location.href = '../Home/home.html';
  });

  // --- Forgot password link (no-op) ---
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
  });

  authForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const isLogin = tabLogin.classList.contains('active');
    const password = passwordInput.value.trim();
    const confirm = confirmInput.value.trim();
    const emailOk = validateEmailField();
    const passwordOk = validatePasswordField();
    const confirmOk = validateConfirmField();
    const nameOk = isLogin ? true : validateNameField();

    if (!emailOk || !passwordOk || !confirmOk || !nameOk) {
      errorMsg.innerText = 'Please fix the highlighted errors.';
      return;
    }
    errorMsg.innerText = '';

    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Please wait...';
    submitBtn.disabled = true;

    setTimeout(() => {
      window.location.href = '../Dashboard/dashboard.html';
    }, 1000);
  });
  
  goDashboard.addEventListener('click', () => {
    window.location.href = '../Dashboard/dashboard.html';
  });

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

  function updatePasswordRequirements(password) {
    const reqLength = document.getElementById('req-length');
    const reqUpper = document.getElementById('req-upper');
    const reqLower = document.getElementById('req-lower');
    const reqDigit = document.getElementById('req-digit');
    const reqSpecial = document.getElementById('req-special');

    const checks = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      digit: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };

    reqLength.classList.toggle('valid', checks.length);
    reqUpper.classList.toggle('valid', checks.upper);
    reqLower.classList.toggle('valid', checks.lower);
    reqDigit.classList.toggle('valid', checks.digit);
    reqSpecial.classList.toggle('valid', checks.special);

    return Object.values(checks).every(val => val);
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
    
    // Update requirements display
    updatePasswordRequirements(v);
    
    // Check all requirements
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

  emailInput.addEventListener('input', () => { validateEmailField(); errorMsg.innerText = ''; });
  passwordInput.addEventListener('input', () => { 
    validatePasswordField(); 
    validateConfirmField(); 
    errorMsg.innerText = ''; 
  });
  confirmInput.addEventListener('input', () => { validateConfirmField(); errorMsg.innerText = ''; });
  nameInput.addEventListener('input', () => { validateNameField(); errorMsg.innerText = ''; });
  setMode('login');

  // Prevent any stray form submissions from reloading
  authForm.addEventListener('submit', (e) => e.preventDefault(), false);
});