const { validatePassword } = require('../../src/utils/passwordValidator');

describe('Unit: Password Validation Security Suite', () => {
  test('should accept strong compliant passwords', () => {
    const res = validatePassword('Valid@SecurePass2026');
    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
    expect(res.score).toBeGreaterThanOrEqual(4);
  });

  test('should reject passwords shorter than 8 characters', () => {
    const res = validatePassword('Sh0rt!');
    expect(res.isValid).toBe(false);
    expect(res.errors).toContain('Password must be at least 8 characters long');
  });

  test('should reject passwords without uppercase letters', () => {
    const res = validatePassword('lowercase123!@#');
    expect(res.isValid).toBe(false);
    expect(res.errors).toContain('Password must include at least one uppercase letter');
  });

  test('should reject passwords without numbers', () => {
    const res = validatePassword('NoNumbersHere!@#');
    expect(res.isValid).toBe(false);
    expect(res.errors).toContain('Password must include at least one numerical digit');
  });

  test('should reject passwords without special characters', () => {
    const res = validatePassword('AlphaNumeric1234');
    expect(res.isValid).toBe(false);
    expect(res.errors).toContain('Password must include at least one special character');
  });

  test('should reject null or non-string inputs safely', () => {
    expect(validatePassword(null).isValid).toBe(false);
    expect(validatePassword(undefined).isValid).toBe(false);
    expect(validatePassword(12345678).isValid).toBe(false);
  });
});
