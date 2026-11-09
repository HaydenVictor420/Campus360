/**
 * Frontend UI Controller & Event Handlers
 */
document.addEventListener('DOMContentLoaded', () => {
  // Check if already authenticated -> redirect to dashboard
  if (window.api.accessToken && window.api.getUser()) {
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
      window.location.href = 'dashboard.html';
      return;
    }
  }

  // UI Elements
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const tabForgot = document.getElementById('tab-forgot');

  const viewLogin = document.getElementById('view-login');
  const viewRegister = document.getElementById('view-register');
  const viewForgot = document.getElementById('view-forgot');
  const viewReset = document.getElementById('view-reset');

  const alertBox = document.getElementById('alert-box');
  const alertMsg = document.getElementById('alert-msg');

  // Helper: Display Alert
  function showAlert(message, type = 'error') {
    alertBox.className = `alert-box active ${type}`;
    alertMsg.textContent = message;
    alertBox.setAttribute('role', type === 'error' ? 'alert' : 'status');
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearAlert() {
    alertBox.className = 'alert-box';
    alertMsg.textContent = '';
  }

  // Helper: Switch Active Tab
  function switchTab(viewId) {
    clearAlert();
    [tabLogin, tabRegister, tabForgot].forEach(t => t && t.classList.remove('active'));
    [viewLogin, viewRegister, viewForgot, viewReset].forEach(v => v && v.classList.remove('active'));

    if (viewId === 'login') {
      tabLogin.classList.add('active');
      viewLogin.classList.add('active');
      document.getElementById('login-identifier')?.focus();
    } else if (viewId === 'register') {
      tabRegister.classList.add('active');
      viewRegister.classList.add('active');
      document.getElementById('reg-email')?.focus();
    } else if (viewId === 'forgot') {
      tabForgot.classList.add('active');
      viewForgot.classList.add('active');
      document.getElementById('forgot-email')?.focus();
    } else if (viewId === 'reset') {
      viewReset.classList.add('active');
      document.getElementById('reset-token')?.focus();
    }
  }

  if (tabLogin) tabLogin.addEventListener('click', () => switchTab('login'));
  if (tabRegister) tabRegister.addEventListener('click', () => switchTab('register'));
  if (tabForgot) tabForgot.addEventListener('click', () => switchTab('forgot'));

  document.querySelectorAll('[data-switch-view]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(btn.dataset.switchView);
    });
  });

  // Password Visibility Toggle
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = 'Hide';
          btn.setAttribute('aria-label', 'Hide password');
        } else {
          input.type = 'password';
          btn.textContent = 'Show';
          btn.setAttribute('aria-label', 'Show password');
        }
      }
    });
  });

  // Real-time Registration Password Strength Indicator
  const regPasswordInput = document.getElementById('reg-password');
  const strengthFill = document.getElementById('reg-strength-fill');
  const strengthText = document.getElementById('reg-strength-text');

  if (regPasswordInput && strengthFill) {
    regPasswordInput.addEventListener('input', () => {
      const val = regPasswordInput.value;
      const res = window.Validator.validatePassword(val);
      strengthFill.className = 'strength-fill';

      if (val.length === 0) {
        strengthFill.style.width = '0%';
        strengthText.textContent = 'Minimum 8 characters with letters, numbers & symbols';
      } else if (res.score <= 2) {
        strengthFill.classList.add('weak');
        strengthText.textContent = 'Weak: ' + res.message;
      } else if (res.score === 3) {
        strengthFill.classList.add('medium');
        strengthText.textContent = 'Good: ' + (res.message || 'Almost strong');
      } else {
        strengthFill.classList.add('strong');
        strengthText.textContent = 'Strong password criteria met';
      }
    });
  }

  // 1. Handle Login Form Submit
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert();

      const identifier = document.getElementById('login-identifier').value.trim();
      const password = document.getElementById('login-password').value;
      const submitBtn = document.getElementById('btn-login-submit');
      const spinner = submitBtn.querySelector('.spinner');

      if (!identifier || !password) {
        showAlert('Please enter your email/username and password');
        return;
      }

      try {
        submitBtn.disabled = true;
        if (spinner) spinner.classList.add('active');

        const res = await window.api.login(identifier, password);
        if (res.success) {
          showAlert('Login successful! Redirecting to dashboard...', 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 800);
        }
      } catch (err) {
        showAlert(err.message || 'Login failed. Please check your credentials.');
      } finally {
        submitBtn.disabled = false;
        if (spinner) spinner.classList.remove('active');
      }
    });
  }

  // 2. Handle Register Form Submit
  const formRegister = document.getElementById('form-register');
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert();

      const email = document.getElementById('reg-email').value.trim();
      const username = document.getElementById('reg-username').value.trim();
      const firstName = document.getElementById('reg-firstname').value.trim();
      const lastName = document.getElementById('reg-lastname').value.trim();
      const role = document.getElementById('reg-role').value;
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;

      // Validate
      const emailCheck = window.Validator.validateEmail(email);
      if (!emailCheck.isValid) return showAlert(emailCheck.message);

      const userCheck = window.Validator.validateUsername(username);
      if (!userCheck.isValid) return showAlert(userCheck.message);

      const passCheck = window.Validator.validatePassword(password);
      if (!passCheck.isValid) return showAlert(passCheck.message);

      if (password !== confirmPassword) {
        return showAlert('Passwords do not match');
      }

      const submitBtn = document.getElementById('btn-register-submit');
      const spinner = submitBtn.querySelector('.spinner');

      try {
        submitBtn.disabled = true;
        if (spinner) spinner.classList.add('active');

        const res = await window.api.register({
          email,
          username,
          firstName,
          lastName,
          role,
          password
        });

        if (res.success) {
          showAlert('Registration successful! You may now sign in.', 'success');
          formRegister.reset();
          setTimeout(() => {
            switchTab('login');
            document.getElementById('login-identifier').value = email;
          }, 1500);
        }
      } catch (err) {
        showAlert(err.message || 'Registration failed');
      } finally {
        submitBtn.disabled = false;
        if (spinner) spinner.classList.remove('active');
      }
    });
  }

  // 3. Handle Forgot Password Submit
  const formForgot = document.getElementById('form-forgot');
  if (formForgot) {
    formForgot.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert();

      const email = document.getElementById('forgot-email').value.trim();
      const submitBtn = document.getElementById('btn-forgot-submit');
      const spinner = submitBtn.querySelector('.spinner');

      try {
        submitBtn.disabled = true;
        if (spinner) spinner.classList.add('active');

        const res = await window.api.forgotPassword(email);
        showAlert(res.message || 'Instructions sent to your email.', 'success');

        if (res.resetToken) {
          // Provide convenience shortcut for local demo/development
          setTimeout(() => {
            switchTab('reset');
            document.getElementById('reset-token').value = res.resetToken;
          }, 2000);
        }
      } catch (err) {
        showAlert(err.message || 'Password reset request failed');
      } finally {
        submitBtn.disabled = false;
        if (spinner) spinner.classList.remove('active');
      }
    });
  }

  // 4. Handle Password Reset Submit
  const formReset = document.getElementById('form-reset');
  if (formReset) {
    formReset.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert();

      const token = document.getElementById('reset-token').value.trim();
      const newPassword = document.getElementById('reset-new-password').value;
      const confirmPassword = document.getElementById('reset-confirm-password').value;

      if (!token) return showAlert('Reset token is required');
      const passCheck = window.Validator.validatePassword(newPassword);
      if (!passCheck.isValid) return showAlert(passCheck.message);

      if (newPassword !== confirmPassword) {
        return showAlert('Passwords do not match');
      }

      const submitBtn = document.getElementById('btn-reset-submit');
      const spinner = submitBtn.querySelector('.spinner');

      try {
        submitBtn.disabled = true;
        if (spinner) spinner.classList.add('active');

        const res = await window.api.resetPassword(token, newPassword);
        showAlert(res.message || 'Password successfully updated!', 'success');
        setTimeout(() => {
          switchTab('login');
        }, 1500);
      } catch (err) {
        showAlert(err.message || 'Reset failed');
      } finally {
        submitBtn.disabled = false;
        if (spinner) spinner.classList.remove('active');
      }
    });
  }
});
