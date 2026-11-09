const cron = require('node-cron');
const TokenModel = require('../models/tokenModel');
const UserModel = require('../models/userModel');
const AuditModel = require('../models/auditModel');
const logger = require('../utils/logger');

class CronScheduler {
  static initSchedulers() {
    logger.info('Initializing automated background cron jobs & schedulers...');

    // 1. Expired Token Purge: Runs at minute 0 of every hour
    cron.schedule('0 * * * *', async () => {
      await this.runTokenCleanup();
    });

    // 2. Account Unlock Watchdog: Runs every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.runAccountUnlock();
    });

    // 3. Audit Log Prune: Runs daily at 02:00 AM
    cron.schedule('0 2 * * *', async () => {
      await this.runAuditPruning();
    });

    logger.info('Background cron schedulers active: [Token Purge (Hourly), Account Unlock (5min), Audit Prune (Daily)]');
  }

  static async runTokenCleanup() {
    try {
      const purged = await TokenModel.cleanExpiredTokens();
      logger.info(`[CRON] Cleaned up ${purged} expired/revoked refresh tokens and reset tokens.`);
      return { success: true, purgedCount: purged };
    } catch (err) {
      logger.error(`[CRON] Token cleanup failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  static async runAccountUnlock() {
    try {
      const unlocked = await UserModel.unlockAllExpired();
      if (unlocked > 0) {
        logger.info(`[CRON] Unlocked ${unlocked} accounts whose lockout period expired.`);
      }
      return { success: true, unlockedCount: unlocked };
    } catch (err) {
      logger.error(`[CRON] Account unlock watchdog error: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  static async runAuditPruning() {
    try {
      const pruned = await AuditModel.pruneOldLogs(90);
      logger.info(`[CRON] Pruned ${pruned} audit log records older than 90 days.`);
      return { success: true, prunedCount: pruned };
    } catch (err) {
      logger.error(`[CRON] Audit log pruning error: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}

module.exports = CronScheduler;
