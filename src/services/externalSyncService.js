const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const UserModel = require('../models/userModel');
const SyncModel = require('../models/syncModel');
const AuditModel = require('../models/auditModel');
const config = require('../config');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/AppError');

const recordSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  username: Joi.string().pattern(/^[a-zA-Z0-9_]+$/).min(3).max(30).required(),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  role: Joi.string().valid('student', 'faculty', 'admin', 'external_service').default('student'),
  password: Joi.string().min(8).optional()
});

class ExternalSyncService {
  static async processBatch({ source = 'external-api', records = [] }, context = {}) {
    if (!Array.isArray(records) || records.length === 0) {
      throw new ValidationError('A non-empty "records" array is required');
    }

    const batchId = `sync_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    await SyncModel.createBatch({
      batchId,
      source,
      recordsReceived: records.length
    });

    logger.info(`Starting external data synchronization batch: ${batchId} (${records.length} records) from ${source}`);

    let processed = 0;
    let failed = 0;
    const errors = [];
    const results = [];

    // Pre-calculate standard default password hash if not supplied
    const defaultPasswordHash = await bcrypt.hash('Campus360@2026', config.security.bcryptSaltRounds);

    for (let i = 0; i < records.length; i++) {
      const item = records[i];
      try {
        const { error, value } = recordSchema.validate(item);
        if (error) {
          throw new Error(`Record #${i} validation failed: ${error.message}`);
        }

        const passwordHash = value.password 
          ? await bcrypt.hash(value.password, config.security.bcryptSaltRounds)
          : defaultPasswordHash;

        const outcome = await UserModel.upsertExternalUser({
          email: value.email,
          username: value.username,
          password_hash: passwordHash,
          first_name: value.firstName,
          last_name: value.lastName,
          role: value.role
        });

        results.push({ email: value.email, status: outcome.action });
        processed++;
      } catch (err) {
        failed++;
        errors.push({ index: i, identifier: item.email || item.username || `item-${i}`, error: err.message });
      }
    }

    const batchStatus = failed === 0 ? 'COMPLETED' : (processed > 0 ? 'COMPLETED' : 'FAILED');
    const errorSummary = errors.length > 0 ? JSON.stringify(errors) : null;

    await SyncModel.updateBatchProgress(batchId, {
      processed,
      failed,
      status: batchStatus,
      errorSummary
    });

    await AuditModel.log({
      action: 'EXTERNAL_SYNC_COMPLETED',
      ipAddress: context.ip,
      status: batchStatus === 'COMPLETED' ? 'SUCCESS' : 'WARNING',
      details: { batchId, source, total: records.length, processed, failed }
    });

    logger.info(`External sync batch ${batchId} finished. Processed: ${processed}, Failed: ${failed}`);

    return {
      batchId,
      status: batchStatus,
      total: records.length,
      processed,
      failed,
      results,
      errors: errors.slice(0, 10) // return first 10 errors if any
    };
  }
}

module.exports = ExternalSyncService;
