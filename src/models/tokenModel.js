const db = require('../config/database');
const crypto = require('crypto');

class TokenModel {
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static async storeRefreshToken({ userId, token, familyId, expiresAt }) {
    const tokenHash = this.hashToken(token);
    const sql = `
      INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [userId, tokenHash, familyId, expiresAt]);
    return { id: result.insertId, tokenHash, familyId };
  }

  static async findRefreshToken(token) {
    const tokenHash = this.hashToken(token);
    const sql = 'SELECT * FROM refresh_tokens WHERE token_hash = ? LIMIT 1';
    const [rows] = await db.query(sql, [tokenHash]);
    return rows[0] || null;
  }

  static async revokeToken(token) {
    const tokenHash = this.hashToken(token);
    const sql = 'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = ?';
    const [result] = await db.query(sql, [tokenHash]);
    return result.affectedRows > 0;
  }

  static async revokeTokenFamily(familyId) {
    const sql = 'UPDATE refresh_tokens SET revoked = TRUE WHERE family_id = ?';
    const [result] = await db.query(sql, [familyId]);
    return result.affectedRows > 0;
  }

  static async cleanExpiredTokens() {
    const sql = 'DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE';
    const [result] = await db.query(sql);
    return result.affectedRows;
  }

  static async createPasswordResetToken(userId, rawToken, expiresAt) {
    const tokenHash = this.hashToken(rawToken);
    const sql = `
      INSERT INTO password_resets (user_id, reset_token_hash, expires_at)
      VALUES (?, ?, ?)
    `;
    const [result] = await db.query(sql, [userId, tokenHash, expiresAt]);
    return { id: result.insertId, tokenHash };
  }

  static async findPasswordResetToken(rawToken) {
    const tokenHash = this.hashToken(rawToken);
    const sql = 'SELECT * FROM password_resets WHERE reset_token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1';
    const [rows] = await db.query(sql, [tokenHash]);
    return rows[0] || null;
  }

  static async markPasswordResetUsed(rawToken) {
    const tokenHash = this.hashToken(rawToken);
    const sql = 'UPDATE password_resets SET used_at = NOW() WHERE reset_token_hash = ?';
    const [result] = await db.query(sql, [tokenHash]);
    return result.affectedRows > 0;
  }
}

module.exports = TokenModel;
