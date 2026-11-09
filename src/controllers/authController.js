const AuthService = require('../services/authService');
const UserModel = require('../models/userModel');

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, username, password, firstName, lastName, role } = req.body;
      const context = { ip: req.ip, userAgent: req.headers['user-agent'] };

      const user = await AuthService.register({
        email,
        username,
        password,
        firstName,
        lastName,
        role
      }, context);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          uuid: user.uuid,
          email: user.email,
          username: user.username,
          role: user.role
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { identifier, password } = req.body;
      const context = { ip: req.ip, userAgent: req.headers['user-agent'] };

      const result = await AuthService.login({ identifier, password }, context);

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const context = { ip: req.ip, userAgent: req.headers['user-agent'] };

      const result = await AuthService.refreshTokens(refreshToken, context);

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const context = {
        userId: req.user ? req.user.userId : null,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      };

      await AuthService.logout(refreshToken, context);

      res.status(200).json({
        success: true,
        message: 'Successfully logged out'
      });
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const context = { ip: req.ip, userAgent: req.headers['user-agent'] };

      const result = await AuthService.requestPasswordReset(email, context);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const context = { ip: req.ip, userAgent: req.headers['user-agent'] };

      const result = await AuthService.resetPassword(token, newPassword, context);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const profile = await AuthService.getProfile(req.user.uuid);

      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const offset = parseInt(req.query.offset, 10) || 0;
      const users = await UserModel.getAll(limit, offset);

      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
