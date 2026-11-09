const ExternalSyncService = require('../services/externalSyncService');
const SyncModel = require('../models/syncModel');
const db = require('../config/database');
const cache = require('../config/cache');

class ExternalController {
  static async importBatch(req, res, next) {
    try {
      const { source, records } = req.body;
      const context = { ip: req.ip };

      const result = await ExternalSyncService.processBatch({ source, records }, context);

      res.status(200).json({
        success: true,
        message: 'External data batch ingestion executed',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getBatchStatus(req, res, next) {
    try {
      const { batchId } = req.params;
      const batch = await SyncModel.getBatch(batchId);

      if (!batch) {
        return res.status(404).json({
          success: false,
          errorCode: 'BATCH_NOT_FOUND',
          message: `Batch ID "${batchId}" not found`
        });
      }

      res.status(200).json({
        success: true,
        data: batch
      });
    } catch (err) {
      next(err);
    }
  }

  static async healthCheck(req, res) {
    const dbStatus = db.getStatus();
    const cacheStatus = cache.getStatus();

    res.status(200).json({
      success: true,
      service: 'Campus360 Login Module',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      components: {
        database: dbStatus,
        cache: cacheStatus
      }
    });
  }
}

module.exports = ExternalController;
