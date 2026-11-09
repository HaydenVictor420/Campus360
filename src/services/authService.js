const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const cache = require('../config/cache');
const UserModel = require('../models/userModel');
const TokenModel = require('../models/tokenModel');
const AuditModel = require('../models/auditModel');
const AlertService = require('./alertService');
const { validatePassword } = require('../utils/passwordValidator');
const { ValidationError, AuthenticationError, ForbiddenError, NotFoundError } = require('../utils/AppError');
const logger = require('../utils/logger');

class AuthService {
  static async hashPassword(password) {
    const pwCheck = validatePassword(password);
    if (!pwCheck.isValid) {
      throw new ValidationError(pwCheck.errors.join(', '));
    }
    return bcrypt.hash(password, config.security.bcryptSaltRounds);
  }

  static async verifyPassword(plainPassword, passwordHash) {
    return bcrypt.compare(plainPassword, passwordHash);
  }

  static generateAccessToken(user) {
    const payload = {
      sub: user.uuid,
      userId: user.id,
      email: user.email,
      role: user.role,
      username: user.username
    };

    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
      issuer: config.appName,
      audience: 'campus360-users'
    });
  }

  static generateRefreshToken(user, familyId = null) {
    const famId = familyId || crypto.randomUUID();
    const payload = {
      sub: user.uuid,
      userId: user.id,
      familyId: famId,
      jti: crypto.randomUUID()
    };

    const token = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: config.appName,
      audience: 'campus360-refresh'
    });

    return { token, familyId: famId };
  }

  static async register({ email, username, password, firstName, lastName, role = 'student' }, context = {}) {
    // 1. Check if email or username already taken
    const existingEmail = await UserModel.findByEmail(email);
    if (existingEmail) {
      throw new ValidationError('An account with this email address already exists');
    }

    const existingUsername = await UserModel.findByUsername(username);
    if (existingUsername) {
      throw new ValidationError('This username is already taken');
    }

    // 2. Hash password
    const passwordHash = await this.hashPassword(password);

    // 3. Create user in DB
    const user = await UserModel.create({
      email,
      username,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role
    });

    // 4. Audit log
    await AuditModel.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      ipAddress: context.ip,
      userAgent: context.userAgent,
      status: 'SUCCESS',
      details: { email, username, role }
    });

    logger.info(`New user registered: ${user.email} (${user.role})`);
    return user;
  }

  static async login({ identifier, password }, context = {}) {
    // Identifier can be email or username
    let user = null;
    if (identifier.includes('@')) {
      user = await UserModel.findByEmail(identifier);
    } else {
      user = await UserModel.findByUsername(identifier);
    }

    if (!user) {
      await AuditModel.log({
        action: 'LOGIN_FAILED',
        ipAddress: context.ip,
        userAgent: context.userAgent,
        status: 'FAILURE',
        details: { identifier, reason: 'USER_NOT_FOUND' }
      });
      throw new AuthenticationError('Invalid email/username or password');
    }

    // Check if account is active
    if (!user.is_active) {
      throw new ForbiddenError('Your account has been deactivated. Please contact campus administration.');
    }

    // Check account lockout
    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      const minutesRemaining = Math.ceil((new Date(user.lock_until) - new Date()) / 60000);
      await AlertService.alertBruteForce(context.ip, user.email, user.failed_login_attempts);
      throw new ForbiddenError(`Account is temporarily locked due to multiple failed login attempts. Try again in ${minutesRemaining} minute(s).`);
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      let lockUntil = null;

      if (attempts >= config.security.maxFailedAttempts) {
        lockUntil = new Date(Date.now() + config.security.lockDurationMinutes * 60000);
        await UserModel.recordFailedLogin(user.id, lockUntil);
        await AlertService.alertAccountLocked(user.id, user.email, context.ip);
        throw new ForbiddenError(`Account locked due to 5 consecutive failed attempts. Please wait ${config.security.lockDurationMinutes} minutes.`);
      } else {
        await UserModel.recordFailedLogin(user.id, null);
      }

      await AuditModel.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        ipAddress: context.ip,
        userAgent: context.userAgent,
        status: 'FAILURE',
        details: { attempt: attempts }
      });

      throw new AuthenticationError('Invalid email/username or password');
    }

    // Reset failed login counter upon successful authentication
    await UserModel.resetFailedLogin(user.id);

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const { token: refreshToken, familyId } = this.generateRefreshToken(user);

    // Store refresh token in DB with expiration date
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await TokenModel.storeRefreshToken({
      userId: user.id,
      token: refreshToken,
      familyId,
      expiresAt: refreshExpiresAt
    });

    // Cache user profile for fast lookup
    await cache.set(`user:${user.uuid}`, {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    }, 3600);

    // Audit log
    await AuditModel.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      ipAddress: context.ip,
      userAgent: context.userAgent,
      status: 'SUCCESS'
    });

    return {
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: config.jwt.accessExpiresIn
      }
    };
  }

  static async refreshTokens(rawRefreshToken, context = {}) {
    if (!rawRefreshToken) {
      throw new AuthenticationError('Refresh token required');
    }

    let decoded;
    try {
      decoded = jwt.verify(rawRefreshToken, config.jwt.refreshSecret);
    } catch (err) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    // Lookup token in DB
    const storedToken = await TokenModel.findRefreshToken(rawRefreshToken);
    if (!storedToken) {
      throw new AuthenticationError('Refresh token not recognized or already used');
    }

    // Detect Token Reuse (Security Violation!)
    if (storedToken.revoked) {
      // Invalidate the entire token family immediately
      await TokenModel.revokeTokenFamily(storedToken.family_id);
      await AlertService.alertTokenReuse(storedToken.user_id, storedToken.family_id, context.ip);
      throw new ForbiddenError('Security Alert: Refresh token reuse detected. All sessions invalidated.');
    }

    // Mark current token as revoked (single-use rotation)
    await TokenModel.revokeToken(rawRefreshToken);

    const user = await UserModel.findById(storedToken.user_id);
    if (!user || !user.is_active) {
      throw new AuthenticationError('User account not found or deactivated');
    }

    // Issue new pair using the same familyId
    const newAccessToken = this.generateAccessToken(user);
    const { token: newRefreshToken } = this.generateRefreshToken(user, storedToken.family_id);

    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await TokenModel.storeRefreshToken({
      userId: user.id,
      token: newRefreshToken,
      familyId: storedToken.family_id,
      expiresAt: refreshExpiresAt
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: config.jwt.accessExpiresIn
    };
  }

  static async logout(rawRefreshToken, context = {}) {
    if (rawRefreshToken) {
      await TokenModel.revokeToken(rawRefreshToken);
    }
    if (context.userId) {
      await AuditModel.log({
        userId: context.userId,
        action: 'LOGOUT',
        ipAddress: context.ip,
        userAgent: context.userAgent,
        status: 'SUCCESS'
      });
    }
    return true;
  }

  static async requestPasswordReset(email, context = {}) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Return true to avoid user enumeration
      return { message: 'If the email exists, a password reset instruction has been logged.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await TokenModel.createPasswordResetToken(user.id, resetToken, expiresAt);

    await AuditModel.log({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      ipAddress: context.ip,
      userAgent: context.userAgent,
      status: 'SUCCESS'
    });

    logger.info(`Password reset token generated for ${email}: ${resetToken}`);
    return {
      message: 'Password reset instructions have been dispatched',
      resetToken // returned for developer convenience in this module
    };
  }

  static async resetPassword(resetToken, newPassword, context = {}) {
    const stored = await TokenModel.findPasswordResetToken(resetToken);
    if (!stored) {
      throw new ValidationError('Invalid or expired password reset token');
    }

    const newHash = await this.hashPassword(newPassword);
    await UserModel.updatePassword(stored.user_id, newHash);
    await TokenModel.markPasswordResetUsed(resetToken);

    // Invalidate cached user
    const user = await UserModel.findById(stored.user_id);
    if (user) {
      await cache.del(`user:${user.uuid}`);
    }

    await AuditModel.log({
      userId: stored.user_id,
      action: 'PASSWORD_RESET_COMPLETED',
      ipAddress: context.ip,
      userAgent: context.userAgent,
      status: 'SUCCESS'
    });

    return { message: 'Password has been updated successfully' };
  }

  static async getProfile(uuid) {
    const cacheKey = `user:${uuid}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const user = await UserModel.findByUuid(uuid);
    if (!user) throw new NotFoundError('User');

    const profile = {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: Boolean(user.is_active),
      isVerified: Boolean(user.is_verified),
      createdAt: user.created_at
    };

    await cache.set(cacheKey, profile, 1800);
    return profile;
  }
}

module.exports = AuthService;
