const db = require('../config/database');

class AuditModel {
  static async log({ userId = null, action, ipAddress = null, userAgent = null, status = 'SUCCESS', details = {} }) {
    try {
      const sql = `
        INSERT INTO audit_logs (user_id, action, ip_address, user_agent, status, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [result] = await db.query(sql, [
        userId,
        action,
        ipAddress,
        userAgent ? userAgent.substring(0, 500) : null,
        status,
        typeof details === 'object' ? JSON.stringify(details) : details
      ]);
      return result.insertId;
    } catch (err) {
      // Don't crash request if audit log fails
      return null;
    }
  }

  static async getRecentLogs(limit = 50) {
    const sql = 'SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?';
    const [rows] = await db.query(sql, [limit]);
    return rows;
  }

  static async pruneOldLogs(days = 90) {
    const sql = 'DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)';
    const [result] = await db.query(sql, [days]);
    return result.affectedRows;
  }
}

module.exports = AuditModel;
