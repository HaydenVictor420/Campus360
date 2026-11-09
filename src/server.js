const app = require('./app');
const config = require('./config');
const db = require('./config/database');
const cache = require('./config/cache');
const logger = require('./utils/logger');
const CronScheduler = require('./schedulers/cronJobs');
const { runMigrations } = require('../database/migrator');

async function startServer() {
  try {
    // 1. Run database initialization & migrations
    await runMigrations();

    // 2. Start automated cron schedulers
    CronScheduler.initSchedulers();

    // 3. Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`================================================================`);
      logger.info(`🚀 ${config.appName} listening on port ${config.port} [${config.env}]`);
      logger.info(`🌐 Web Authentication UI: ${config.appUrl}`);
      logger.info(`🔌 API Base Endpoint:     ${config.appUrl}/api/v1/auth`);
      logger.info(`📡 External Sync API:     ${config.appUrl}/api/v1/external`);
      logger.info(`================================================================`);
    });

    // 4. Graceful shutdown handler
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await db.close();
          await cache.close();
          logger.info('Database and cache connections closed cleanly.');
          process.exit(0);
        } catch (err) {
          logger.error(`Error during shutdown: ${err.message}`);
          process.exit(1);
        }
      });

      // Force close after 10s timeout
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection:', reason);
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
    });

    return server;
  } catch (err) {
    logger.error(`Failed to bootstrap server: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
