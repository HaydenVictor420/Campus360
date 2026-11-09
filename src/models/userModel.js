const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class UserModel {
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    const [rows] = await db.query(sql, [email.toLowerCase().trim()]);
    return rows[0] || null;
  }

  static async findByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ? LIMIT 1';
    const [rows] = await db.query(sql, [username.toLowerCase().trim()]);
    return rows[0] || null;
  }

  static async findById(id) {
    const sql = 'SELECT id, uuid, email, username, first_name, last_name, role, is_active, is_verified, failed_login_attempts, lock_until, last_login_at, created_at, updated_at FROM users WHERE id = ? LIMIT 1';
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  }

  static async findByIdWithPassword(id) {
    const sql = 'SELECT * FROM users WHERE id = ? LIMIT 1';
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  }

  static async findByUuid(uuid) {
    const sql = 'SELECT id, uuid, email, username, first_name, last_name, role, is_active, is_verified, created_at FROM users WHERE uuid = ? LIMIT 1';
    const [rows] = await db.query(sql, [uuid]);
    return rows[0] || null;
  }

  static async create({ email, username, password_hash, first_name, last_name, role = 'student', is_active = 1, is_verified = 0 }) {
    const uuid = uuidv4();
    const sql = `
      INSERT INTO users (uuid, email, username, password_hash, first_name, last_name, role, is_active, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      uuid,
      email.toLowerCase().trim(),
      username.toLowerCase().trim(),
      password_hash,
      first_name.trim(),
      last_name.trim(),
      role,
      is_active ? 1 : 0,
      is_verified ? 1 : 0
    ]);
    return { id: result.insertId, uuid, email, username, first_name, last_name, role };
  }

  static async updatePassword(id, password_hash) {
    const sql = 'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?';
    const [result] = await db.query(sql, [password_hash, id]);
    return result.affectedRows > 0;
  }

  static async recordFailedLogin(id, lockUntil = null) {
    const sql = 'UPDATE users SET failed_login_attempts = failed_login_attempts + 1, lock_until = ?, updated_at = NOW() WHERE id = ?';
    await db.query(sql, [lockUntil, id]);
  }

  static async resetFailedLogin(id) {
    const sql = 'UPDATE users SET failed_login_attempts = 0, lock_until = NULL, last_login_at = NOW(), updated_at = NOW() WHERE id = ?';
    await db.query(sql, [new Date(), id]);
  }

  static async unlockAccount(id) {
    const sql = 'UPDATE users SET lock_until = NULL, failed_login_attempts = 0, updated_at = NOW() WHERE id = ?';
    const [result] = await db.query(sql, [id]);
    return result.affectedRows > 0;
  }

  static async unlockAllExpired() {
    const sql = 'UPDATE users SET lock_until = NULL, failed_login_attempts = 0 WHERE lock_until IS NOT NULL AND lock_until <= NOW()';
    const [result] = await db.query(sql);
    return result.affectedRows;
  }

  static async getAll(limit = 100, offset = 0) {
    const sql = 'SELECT id, uuid, email, username, first_name, last_name, role, is_active, is_verified, last_login_at, created_at FROM users ORDER BY id DESC LIMIT ? OFFSET ?';
    const [rows] = await db.query(sql, [limit, offset]);
    return rows;
  }

  static async upsertExternalUser({ email, username, password_hash, first_name, last_name, role = 'student' }) {
    const existing = await this.findByEmail(email);
    if (existing) {
      const sql = 'UPDATE users SET first_name = ?, last_name = ?, role = ?, updated_at = NOW() WHERE id = ?';
      await db.query(sql, [first_name, last_name, role, existing.id]);
      return { action: 'UPDATED', user: { ...existing, first_name, last_name, role } };
    }
    const created = await this.create({ email, username, password_hash, first_name, last_name, role, is_active: 1, is_verified: 1 });
    return { action: 'CREATED', user: created };
  }
}

module.exports = UserModel;
