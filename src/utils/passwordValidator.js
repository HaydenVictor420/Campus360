/**
 * Validates password strength according to NIST and enterprise standards:
 * - Minimum 8 characters, maximum 128
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one digit (0-9)
 * - At least one special symbol (!@#$%^&*...)
 */
function validatePassword(password) {
  const result = {
    isValid: true,
    errors: [],
    score: 0 // 0-4 scale
  };

  if (!password || typeof password !== 'string') {
    result.isValid = false;
    result.errors.push('Password must be provided as a string');
    return result;
  }

  if (password.length < 8) {
    result.errors.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    result.score += 1;
  }

  if (password.length > 128) {
    result.errors.push('Password cannot exceed 128 characters');
  }

  if (!/[A-Z]/.test(password)) {
    result.errors.push('Password must include at least one uppercase letter');
  } else {
    result.score += 1;
  }

  if (!/[a-z]/.test(password)) {
    result.errors.push('Password must include at least one lowercase letter');
  } else {
    result.score += 1;
  }

  if (!/[0-9]/.test(password)) {
    result.errors.push('Password must include at least one numerical digit');
  } else {
    result.score += 1;
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    result.errors.push('Password must include at least one special character');
  } else {
    result.score += 1;
  }

  result.isValid = result.errors.length === 0;
  return result;
}

module.exports = {
  validatePassword
};
