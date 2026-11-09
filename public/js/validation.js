/**
 * Client-Side Validation Module for Campus360
 */
const Validator = {
  validateEmail(email) {
    if (!email) return { isValid: false, message: 'Email address is required' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, message: 'Please enter a valid email address (e.g., student@campus360.internal)' };
    }
    return { isValid: true };
  },

  validateUsername(username) {
    if (!username) return { isValid: false, message: 'Username is required' };
    if (username.length < 3 || username.length > 30) {
      return { isValid: false, message: 'Username must be between 3 and 30 characters' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { isValid: false, message: 'Username can only contain alphanumeric characters and underscores' };
    }
    return { isValid: true };
  },

  validatePassword(password) {
    if (!password) return { isValid: false, message: 'Password is required', score: 0 };
    const errors = [];
    let score = 0;

    if (password.length < 8) errors.push('At least 8 characters');
    else score++;

    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter (A-Z)');
    else score++;

    if (!/[a-z]/.test(password)) errors.push('One lowercase letter (a-z)');
    else score++;

    if (!/[0-9]/.test(password)) errors.push('One numerical digit (0-9)');
    else score++;

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
      errors.push('One special symbol (!@#$...)');
    } else {
      score++;
    }

    return {
      isValid: errors.length === 0,
      message: errors.length ? `Missing: ${errors.join(', ')}` : '',
      score: Math.min(score, 4) // 0 to 4
    };
  },

  validateRequired(val, fieldName) {
    if (!val || !val.trim()) {
      return { isValid: false, message: `${fieldName} is required` };
    }
    return { isValid: true };
  }
};

window.Validator = Validator;
