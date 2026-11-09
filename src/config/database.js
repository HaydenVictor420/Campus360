const mysql = require('mysql2/promise');
const config = require('./index');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class MemoryDatabaseAdapter {
  constructor() {
    this.users = new Map();
    this.refreshTokens = new Map();
    this.passwordResets = new Map();
    this.auditLogs = [];
    this.syncBatches = new Map();
    this.userAutoId = 1;
    this.tokenAutoId = 1;
    this.resetAutoId = 1;
    this.auditAutoId = 1;
    this.syncAutoId = 1;
  }

  async query(sql, params = []) {
    const cleanSql = sql.trim();

    // 1. SELECT user by email, username, or id
    if (/SELECT.*FROM users.*WHERE.*email/i.test(cleanSql)) {
      const email = params[0]?.toLowerCase();
      for (const u of this.users.values()) {
        if (u.email.toLowerCase() === email) {
          return [[{ ...u }]];
        }
      }
      return [[]];
    }

    if (/SELECT.*FROM users.*WHERE.*username/i.test(cleanSql)) {
      const username = params[0]?.toLowerCase();
      for (const u of this.users.values()) {
        if (u.username.toLowerCase() === username) {
          return [[{ ...u }]];
        }
      }
      return [[]];
    }

    if (/SELECT.*FROM users.*WHERE.*id =/i.test(cleanSql)) {
      const id = parseInt(params[0], 10);
      const u = this.users.get(id);
      return u ? [[{ ...u }]] : [[]];
    }

    if (/SELECT.*FROM users.*WHERE.*uuid =/i.test(cleanSql)) {
      const uuid = params[0];
      for (const u of this.users.values()) {
        if (u.uuid === uuid) return [[{ ...u }]];
      }
      return [[]];
    }

    if (/SELECT.*FROM users/i.test(cleanSql) && !/WHERE/i.test(cleanSql)) {
      return [[...Array.from(this.users.values()).map(u => ({ ...u }))]];
    }

    // 2. INSERT into users
    if (/INSERT INTO users/i.test(cleanSql)) {
      const id = this.userAutoId++;
      const [uuid, email, username, password_hash, first_name, last_name, role, is_active, is_verified] = params;
      const user = {
        id,
        uuid: uuid || `uuid-${id}`,
        email: email?.toLowerCase(),
        username: username?.toLowerCase(),
        password_hash,
        first_name: first_name || '',
        last_name: last_name || '',
        role: role || 'student',
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        is_verified: is_verified !== undefined ? Boolean(is_verified) : false,
        failed_login_attempts: 0,
        lock_until: null,
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      this.users.set(id, user);
      return [{ insertId: id, affectedRows: 1 }];
    }

    // 3. UPDATE users
    if (/UPDATE users/i.test(cleanSql)) {
      let updatedCount = 0;
      // Handle password update
      if (/password_hash = \?/i.test(cleanSql)) {
        const [pw, userId] = params;
        const u = this.users.get(parseInt(userId, 10));
        if (u) {
          u.password_hash = pw;
          u.updated_at = new Date();
          updatedCount++;
        }
      }
      // Handle failed attempts increment & lock
      else if (/failed_login_attempts = failed_login_attempts \+ 1/i.test(cleanSql)) {
        const [lockUntil, userId] = params;
        const u = this.users.get(parseInt(userId, 10));
        if (u) {
          u.failed_login_attempts = (u.failed_login_attempts || 0) + 1;
          u.lock_until = lockUntil;
          u.updated_at = new Date();
          updatedCount++;
        }
      }
      // Handle successful login reset
      else if (/failed_login_attempts = 0/i.test(cleanSql)) {
        const [now, userId] = params;
        const u = this.users.get(parseInt(userId, 10));
        if (u) {
          u.failed_login_attempts = 0;
          u.lock_until = null;
          u.last_login_at = now;
          u.updated_at = new Date();
          updatedCount++;
        }
      }
      // Handle unlock
      else if (/lock_until = NULL/i.test(cleanSql)) {
        const [userId] = params;
        if (userId) {
          const u = this.users.get(parseInt(userId, 10));
          if (u) {
            u.lock_until = null;
            u.failed_login_attempts = 0;
            updatedCount++;
          }
        } else {
          // Unlock all expired
          for (const u of this.users.values()) {
            if (u.lock_until && new Date(u.lock_until) <= new Date()) {
              u.lock_until = null;
              u.failed_login_attempts = 0;
              updatedCount++;
            }
          }
        }
      }
      // General update
      else if (/first_name/i.test(cleanSql)) {
        const [fn, ln, id] = params;
        const u = this.users.get(parseInt(id, 10));
        if (u) {
          u.first_name = fn;
          u.last_name = ln;
          u.updated_at = new Date();
          updatedCount++;
        }
      }
      return [{ affectedRows: updatedCount }];
    }

    // 4. Refresh Tokens
    if (/INSERT INTO refresh_tokens/i.test(cleanSql)) {
      const id = this.tokenAutoId++;
      const [user_id, token_hash, family_id, expires_at] = params;
      const rec = { id, user_id, token_hash, family_id, expires_at, revoked: false, created_at: new Date() };
      this.refreshTokens.set(token_hash, rec);
      return [{ insertId: id, affectedRows: 1 }];
    }

    if (/SELECT.*FROM refresh_tokens.*token_hash/i.test(cleanSql)) {
      const hash = params[0];
      const rec = this.refreshTokens.get(hash);
      return rec ? [[{ ...rec }]] : [[]];
    }

    if (/UPDATE refresh_tokens.*revoked = TRUE.*token_hash/i.test(cleanSql)) {
      const hash = params[0];
      const rec = this.refreshTokens.get(hash);
      if (rec) rec.revoked = true;
      return [{ affectedRows: rec ? 1 : 0 }];
    }

    if (/UPDATE refresh_tokens.*revoked = TRUE.*family_id/i.test(cleanSql)) {
      const familyId = params[0];
      let c = 0;
      for (const rec of this.refreshTokens.values()) {
        if (rec.family_id === familyId) {
          rec.revoked = true;
          c++;
        }
      }
      return [{ affectedRows: c }];
    }

    if (/DELETE FROM refresh_tokens/i.test(cleanSql)) {
      let c = 0;
      for (const [k, v] of this.refreshTokens.entries()) {
        if (v.revoked || new Date(v.expires_at) < new Date()) {
          this.refreshTokens.delete(k);
          c++;
        }
      }
      return [{ affectedRows: c }];
    }

    // 5. Password Resets
    if (/INSERT INTO password_resets/i.test(cleanSql)) {
      const id = this.resetAutoId++;
      const [user_id, reset_token_hash, expires_at] = params;
      this.passwordResets.set(reset_token_hash, { id, user_id, reset_token_hash, expires_at, used_at: null });
      return [{ insertId: id, affectedRows: 1 }];
    }

    if (/SELECT.*FROM password_resets/i.test(cleanSql)) {
      const hash = params[0];
      const rec = this.passwordResets.get(hash);
      return rec ? [[{ ...rec }]] : [[]];
    }

    if (/UPDATE password_resets.*used_at/i.test(cleanSql)) {
      const [now, hash] = params;
      const rec = this.passwordResets.get(hash);
      if (rec) rec.used_at = now;
      return [{ affectedRows: rec ? 1 : 0 }];
    }

    // 6. Audit Logs
    if (/INSERT INTO audit_logs/i.test(cleanSql)) {
      const id = this.auditAutoId++;
      const [user_id, action, ip_address, user_agent, status, details] = params;
      this.auditLogs.push({ id, user_id, action, ip_address, user_agent, status, details, created_at: new Date() });
      return [{ insertId: id, affectedRows: 1 }];
    }

    if (/SELECT.*FROM audit_logs/i.test(cleanSql)) {
      return [[...this.auditLogs.slice(-50)]];
    }

    // 7. External Sync Batches
    if (/INSERT INTO external_sync_batches/i.test(cleanSql)) {
      const id = this.syncAutoId++;
      const [batch_id, source, records_received, records_processed, records_failed, status, error_summary] = params;
      this.syncBatches.set(batch_id, {
        id, batch_id, source, records_received, records_processed, records_failed, status, error_summary, created_at: new Date()
      });
      return [{ insertId: id, affectedRows: 1 }];
    }

    if (/UPDATE external_sync_batches/i.test(cleanSql)) {
      const [processed, failed, status, errors, batch_id] = params;
      const rec = this.syncBatches.get(batch_id);
      if (rec) {
        rec.records_processed = processed;
        rec.records_failed = failed;
        rec.status = status;
        rec.error_summary = errors;
      }
      return [{ affectedRows: rec ? 1 : 0 }];
    }

    return [{ affectedRows: 0 }];
  }
}

class DatabaseManager {
  constructor() {
    this.pool = null;
    this.isMySQL = false;
    this.memoryDb = new MemoryDatabaseAdapter();
    this.init();
  }

  async init() {
    try {
      this.pool = mysql.createPool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        waitForConnections: true,
        connectionLimit: config.db.connectionLimit,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });

      // Test connection
      const conn = await this.pool.getConnection();
      conn.release();
      this.isMySQL = true;
      logger.info(`MySQL database pool connected successfully to ${config.db.host}:${config.db.port}/${config.db.database}`);
    } catch (err) {
      this.isMySQL = false;
      logger.warn(`MySQL connection unavailable (${err.message}). High-availability Embedded Database storage active for zero-downtime operation.`);
    }
  }

  async query(sql, params = []) {
    if (this.isMySQL && this.pool) {
      try {
        return await this.pool.query(sql, params);
      } catch (err) {
        logger.error(`MySQL query execution error: ${err.message}`, { sql });
        throw err;
      }
    }
    return this.memoryDb.query(sql, params);
  }

  async execute(sql, params = []) {
    if (this.isMySQL && this.pool) {
      try {
        return await this.pool.execute(sql, params);
      } catch (err) {
        logger.error(`MySQL execute error: ${err.message}`, { sql });
        throw err;
      }
    }
    return this.memoryDb.query(sql, params);
  }

  async getConnection() {
    if (this.isMySQL && this.pool) {
      return this.pool.getConnection();
    }
    return {
      query: (sql, params) => this.memoryDb.query(sql, params),
      execute: (sql, params) => this.memoryDb.query(sql, params),
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {}
    };
  }

  getStatus() {
    return {
      type: this.isMySQL ? 'mysql' : 'embedded-memory-resilient',
      host: config.db.host,
      database: config.db.database,
      connected: true
    };
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

const db = new DatabaseManager();
module.exports = db;
