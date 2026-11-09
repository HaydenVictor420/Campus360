const Redis = require('ioredis');
const config = require('./index');
const logger = require('../utils/logger');

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, ttlSeconds = config.redis.ttl) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
    return true;
  }

  async del(key) {
    return this.store.delete(key);
  }

  async has(key) {
    const val = await this.get(key);
    return val !== null;
  }

  async flush() {
    this.store.clear();
    return true;
  }

  getStatus() {
    return {
      type: 'in-memory-fallback',
      activeEntries: this.store.size,
      connected: true
    };
  }
}

class CacheManager {
  constructor() {
    this.memoryFallback = new MemoryCache();
    this.client = null;
    this.useRedis = false;
    this.init();
  }

  init() {
    if (process.env.NODE_ENV === 'test') {
      // In test environment, use fast memory cache to prevent hanging socket handles
      this.useRedis = false;
      return;
    }

    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 2) {
            return null; // Stop retrying quickly
          }
          return 500;
        }
      });

      this.client.connect().then(() => {
        this.useRedis = true;
        logger.info(`Redis cache connected successfully to ${config.redis.host}:${config.redis.port}`);
      }).catch((err) => {
        this.useRedis = false;
        logger.warn(`Redis connection unavailable (${err.message}). High-performance In-Memory caching active.`);
      });

      this.client.on('error', (err) => {
        if (this.useRedis) {
          logger.warn(`Redis runtime error: ${err.message}. Switching to in-memory fallback.`);
          this.useRedis = false;
        }
      });

      this.client.on('connect', () => {
        this.useRedis = true;
      });
    } catch (err) {
      this.useRedis = false;
      logger.warn(`Redis initialization failed: ${err.message}. In-Memory caching active.`);
    }
  }

  async get(key) {
    if (this.useRedis && this.client) {
      try {
        const raw = await this.client.get(key);
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      } catch (err) {
        logger.warn(`Redis get failed for key "${key}": ${err.message}. Using fallback.`);
      }
    }
    return this.memoryFallback.get(key);
  }

  async set(key, value, ttlSeconds = config.redis.ttl) {
    if (this.useRedis && this.client) {
      try {
        const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
        if (ttlSeconds) {
          await this.client.set(key, serialized, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, serialized);
        }
        return true;
      } catch (err) {
        logger.warn(`Redis set failed for key "${key}": ${err.message}. Using fallback.`);
      }
    }
    return this.memoryFallback.set(key, value, ttlSeconds);
  }

  async del(key) {
    if (this.useRedis && this.client) {
      try {
        await this.client.del(key);
        return true;
      } catch (err) {
        logger.warn(`Redis del failed for key "${key}": ${err.message}. Using fallback.`);
      }
    }
    return this.memoryFallback.del(key);
  }

  async flush() {
    if (this.useRedis && this.client) {
      try {
        await this.client.flushdb();
      } catch (err) {
        logger.warn(`Redis flushdb failed: ${err.message}`);
      }
    }
    return this.memoryFallback.flush();
  }

  getStatus() {
    if (this.useRedis && this.client && this.client.status === 'ready') {
      return {
        type: 'redis',
        status: this.client.status,
        host: config.redis.host,
        port: config.redis.port,
        connected: true
      };
    }
    return this.memoryFallback.getStatus();
  }

  async close() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
    }
  }
}

const cache = new CacheManager();
module.exports = cache;
