const AuthService = require('../../src/services/authService');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');

describe('Unit: AuthService Cryptography & Token Suite', () => {
  test('should correctly hash and verify passwords using bcrypt', async () => {
    const rawPassword = 'Password@12345';
    const hash = await AuthService.hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2b$')).toBe(true);

    const isMatch = await AuthService.verifyPassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await AuthService.verifyPassword('WrongPassword@999', hash);
    expect(isWrongMatch).toBe(false);
  });

  test('should generate valid signed JWT access token', () => {
    const mockUser = {
      id: 99,
      uuid: 'test-uuid-1234',
      email: 'unit@campus360.internal',
      role: 'student',
      username: 'unittest'
    };

    const token = AuthService.generateAccessToken(mockUser);
    expect(token).toBeDefined();

    const decoded = jwt.verify(token, config.jwt.accessSecret);
    expect(decoded.sub).toBe(mockUser.uuid);
    expect(decoded.userId).toBe(mockUser.id);
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.role).toBe(mockUser.role);
  });

  test('should generate valid refresh token with familyId', () => {
    const mockUser = { id: 99, uuid: 'test-uuid-1234' };
    const { token, familyId } = AuthService.generateRefreshToken(mockUser);

    expect(token).toBeDefined();
    expect(familyId).toBeDefined();

    const decoded = jwt.verify(token, config.jwt.refreshSecret);
    expect(decoded.sub).toBe(mockUser.uuid);
    expect(decoded.familyId).toBe(familyId);
  });
});
