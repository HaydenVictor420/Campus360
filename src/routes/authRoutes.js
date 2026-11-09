const express = require('express');
const Joi = require('joi');
const AuthController = require('../controllers/authController');
const { validateBody } = require('../middleware/validationMiddleware');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Joi Schemas
const registerSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  username: Joi.string().pattern(/^[a-zA-Z0-9_]+$/).min(3).max(30).required().messages({
    'string.pattern.base': 'Username must only contain alphanumeric characters and underscores',
    'string.min': 'Username must be at least 3 characters',
    'any.required': 'Username is required'
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  }),
  firstName: Joi.string().trim().min(1).max(50).required(),
  lastName: Joi.string().trim().min(1).max(50).required(),
  role: Joi.string().valid('student', 'faculty', 'admin').default('student')
});

const loginSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'any.required': 'Email or Username is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required'
  })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required()
});

// Auth Routes with rate limiting
router.post('/register', authLimiter, validateBody(registerSchema), AuthController.register);
router.post('/login', authLimiter, validateBody(loginSchema), AuthController.login);
router.post('/refresh', validateBody(refreshSchema), AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), AuthController.resetPassword);

// Protected User Routes
router.get('/me', authenticateToken, AuthController.getProfile);
router.get('/users', authenticateToken, requireRole('admin'), AuthController.getAllUsers);

module.exports = router;
