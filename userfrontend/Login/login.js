// login.js – authentication logic for ResolveIT

document.addEventListener("DOMContentLoaded", function () {

  const API_BASE = "http://localhost:8080/api";

  // ---------------- API HELPER ----------------
  async function apiCall(endpoint, method, body) {

    const response = await fetch(API_BASE + endpoint, {
      method: method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    let data = null;

    try {
      data = await response.json();
    } catch { }

    if (!response.ok) {
      throw new Error(data?.message || "Request failed");
    }

    return data;
  }

  // ---------------- DOM ELEMENTS ----------------

  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");

  const nameField = document.getElementById("nameField");
  const confirmField = document.getElementById("confirmField");

  const formTitle = document.getElementById("formTitle");
  const formSub = document.getElementById("formSub");
  const submitBtn = document.getElementById("submitBtn");

  const errorMsg = document.getElementById("errorMsg");

  const authForm = document.getElementById("authForm");

  const nameInput = document.getElementById("nameInput");
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  const confirmInput = document.getElementById("confirmInput");

  const nameError = document.getElementById("nameError");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const confirmError = document.getElementById("confirmError");

  const showPasswordBtn = document.getElementById("showPasswordBtn");
  const showConfirmPasswordBtn = document.getElementById("showConfirmPasswordBtn");

  const passwordRequirements = document.getElementById("passwordRequirements");

  // ---------------- MODE SWITCH ----------------
  const backToHomeBtn = document.getElementById('backToHomeBtn');
  if (backToHomeBtn) {
    backToHomeBtn.addEventListener('click', () => {
      window.location.href = '../Home/home.html';
    });
  }

  function setMode(mode) {

    if (mode === "login") {

      tabLogin.classList.add("active");
      tabRegister.classList.remove("active");

      nameField.classList.add("hidden");
      confirmField.classList.add("hidden");

      formTitle.innerText = "Welcome back";
      formSub.innerText = "Sign in to access your dashboard";
      submitBtn.innerText = "Sign In";

      passwordRequirements.classList.add("hidden");

    } else {

      tabRegister.classList.add("active");
      tabLogin.classList.remove("active");

      nameField.classList.remove("hidden");
      confirmField.classList.remove("hidden");

      formTitle.innerText = "Create account";
      formSub.innerText = "Join ResolveIT";

      submitBtn.innerText = "Create Account";

      passwordRequirements.classList.remove("hidden");
    }

    clearErrors();
  }

  tabLogin.addEventListener("click", () => setMode("login"));
  tabRegister.addEventListener("click", () => setMode("register"));

  // ---------------- ERROR HELPERS ----------------

  function setFieldError(input, errorEl, message) {

    if (!errorEl) return false;

    if (message) {
      errorEl.innerText = message;
      input.classList.add("invalid");
      return false;
    }

    errorEl.innerText = "";
    input.classList.remove("invalid");
    return true;
  }

  function clearErrors() {

    errorMsg.innerText = "";

    [nameError, emailError, passwordError, confirmError].forEach(el => {
      if (el) el.innerText = "";
    });

    [nameInput, emailInput, passwordInput, confirmInput].forEach(el => {
      if (el) el.classList.remove("invalid");
    });
  }

  // ---------------- PASSWORD CHECK ----------------

  function updatePasswordRequirements(password) {

    const checks = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      digit: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };

    return Object.values(checks).every(Boolean);
  }

  // ---------------- VALIDATION ----------------

  function validateEmail() {

    const v = emailInput.value.trim();

    if (!v)
      return setFieldError(emailInput, emailError, "Email required");

    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!re.test(v))
      return setFieldError(emailInput, emailError, "Invalid email");

    return setFieldError(emailInput, emailError, "");
  }

  function validatePassword() {

    const v = passwordInput.value;

    if (!v)
      return setFieldError(passwordInput, passwordError, "Password required");

    if (!updatePasswordRequirements(v))
      return setFieldError(passwordInput, passwordError, "Weak password");

    return setFieldError(passwordInput, passwordError, "");
  }

  function validateConfirm() {

    if (tabLogin.classList.contains("active"))
      return true;

    const v = confirmInput.value;

    if (!v)
      return setFieldError(confirmInput, confirmError, "Confirm password");

    if (v !== passwordInput.value)
      return setFieldError(confirmInput, confirmError, "Passwords mismatch");

    return setFieldError(confirmInput, confirmError, "");
  }

  function validateName() {

    if (tabLogin.classList.contains("active"))
      return true;

    const v = nameInput.value.trim();

    if (!v)
      return setFieldError(nameInput, nameError, "Name required");

    if (v.length < 2)
      return setFieldError(nameInput, nameError, "Enter full name");

    return setFieldError(nameInput, nameError, "");
  }

  // ---------------- PASSWORD TOGGLE ----------------

  showPasswordBtn.addEventListener("click", (e) => {

    e.preventDefault();

    passwordInput.type =
      passwordInput.type === "password" ? "text" : "password";
  });

  showConfirmPasswordBtn.addEventListener("click", (e) => {

    e.preventDefault();

    confirmInput.type =
      confirmInput.type === "password" ? "text" : "password";
  });

  // ---------------- FORM SUBMIT ----------------

  authForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const isLogin = tabLogin.classList.contains("active");

    const emailOk = validateEmail();
    const passwordOk = validatePassword();
    const confirmOk = validateConfirm();
    const nameOk = validateName();

    if (!emailOk || !passwordOk || !confirmOk || !nameOk) {
      errorMsg.innerText = "Please fix the errors.";
      return;
    }

    submitBtn.innerText = "Please wait...";
    submitBtn.disabled = true;

    try {

      if (isLogin) {

        // -------- LOGIN --------

        const data = await apiCall("/auth/login", "POST", {
          email: emailInput.value.trim(),
          password: passwordInput.value
        });

        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("userName", data.name);
        localStorage.setItem("userRole", data.role);

        window.location.href = "../Dashboard/dashboard.html";

      } else {

        // -------- REGISTER --------

        await apiCall("/auth/register", "POST", {
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          password: passwordInput.value
        });

        alert("Account created. Please login.");

        setMode("login");

      }

    } catch (err) {

      errorMsg.innerText = err.message;

      submitBtn.innerText = isLogin ? "Sign In" : "Create Account";
      submitBtn.disabled = false;

      passwordInput.value = "";
      confirmInput.value = "";
    }

  });

  // ---------------- INIT ----------------

  setMode("login");

});