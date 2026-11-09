const express = require('express');
const Joi = require('joi');
const ExternalController = require('../controllers/externalController');
const { validateBody } = require('../middleware/validationMiddleware');
const { validateApiKey } = require('../middleware/authMiddleware');

const router = express.Router();

const importSchema = Joi.object({
  source: Joi.string().default('external_system'),
  records: Joi.array().items(
    Joi.object({
      email: Joi.string().email({ tlds: { allow: false } }).required(),
      username: Joi.string().pattern(/^[a-zA-Z0-9_]+$/).min(3).max(30).required(),
      firstName: Joi.string().min(1).max(50).required(),
      lastName: Joi.string().min(1).max(50).required(),
      role: Joi.string().valid('student', 'faculty', 'admin', 'external_service').default('student'),
      password: Joi.string().min(8).optional()
    })
  ).min(1).required()
});

// External API endpoints
router.post('/import', validateApiKey, validateBody(importSchema), ExternalController.importBatch);
router.get('/batch/:batchId', validateApiKey, ExternalController.getBatchStatus);
router.get('/health', ExternalController.healthCheck);

module.exports = router;
