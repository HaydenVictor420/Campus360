const logger = require('../utils/logger');
const config = require('../config');

class AlertService {
  static async sendAlert({ type, severity = 'WARNING', message, details = {} }) {
    const alertPayload = {
      timestamp: new Date().toISOString(),
      type,
      severity,
      message,
      environment: config.env,
      details
    };

    // 1. Log to structured security & combined logs
    logger.log('security', `[SECURITY ALERT] [${severity}] ${type}: ${message}`, { alertPayload });

    // 2. Dispatch to external webhook (Slack/Discord/PagerDuty) if configured
    if (config.alerts.webhookUrl) {
      try {
        // Safe non-blocking fetch
        if (typeof fetch !== 'undefined') {
          fetch(config.alerts.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alertPayload)
          }).catch(err => logger.error(`Webhook alert dispatch failed: ${err.message}`));
        }
      } catch (err) {
        logger.error(`Failed to invoke alert webhook: ${err.message}`);
      }
    }

    return alertPayload;
  }

  static async alertBruteForce(ip, email, attempts) {
    return this.sendAlert({
      type: 'BRUTE_FORCE_ATTACK_DETECTED',
      severity: 'CRITICAL',
      message: `Multiple failed login attempts (${attempts}) detected for email "${email}" from IP ${ip}`,
      details: { ip, email, attempts }
    });
  }

  static async alertAccountLocked(userId, email, ip) {
    return this.sendAlert({
      type: 'ACCOUNT_LOCKED',
      severity: 'HIGH',
      message: `User account [${email}] has been temporarily locked due to security policy violations`,
      details: { userId, email, ip }
    });
  }

  static async alertTokenReuse(userId, familyId, ip) {
    return this.sendAlert({
      type: 'REFRESH_TOKEN_REUSE_DETECTED',
      severity: 'CRITICAL',
      message: `Possible token theft: Revoked refresh token reused for user ${userId}. All family tokens revoked.`,
      details: { userId, familyId, ip }
    });
  }
}

module.exports = AlertService;
