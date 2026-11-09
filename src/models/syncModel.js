const db = require('../config/database');

class SyncModel {
  static async createBatch({ batchId, source, recordsReceived }) {
    const sql = `
      INSERT INTO external_sync_batches (batch_id, source, records_received, records_processed, records_failed, status)
      VALUES (?, ?, ?, 0, 0, 'PROCESSING')
    `;
    const [result] = await db.query(sql, [batchId, source, recordsReceived]);
    return { id: result.insertId, batchId };
  }

  static async updateBatchProgress(batchId, { processed, failed, status, errorSummary = null }) {
    const sql = `
      UPDATE external_sync_batches
      SET records_processed = ?, records_failed = ?, status = ?, error_summary = ?
      WHERE batch_id = ?
    `;
    const [result] = await db.query(sql, [processed, failed, status, errorSummary, batchId]);
    return result.affectedRows > 0;
  }

  static async getBatch(batchId) {
    const sql = 'SELECT * FROM external_sync_batches WHERE batch_id = ? LIMIT 1';
    const [rows] = await db.query(sql, [batchId]);
    return rows[0] || null;
  }
}

module.exports = SyncModel;
