require('dotenv').config();
const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  APP_NAME: Joi.string().default('Campus360-AuthModule'),
  APP_URL: Joi.string().default('http://localhost:3000'),
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),

  JWT_ACCESS_SECRET: Joi.string().min(16).default('campus360_super_secret_access_jwt_key_2026_dev!'),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).default('campus360_super_secret_refresh_jwt_key_2026_dev!'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  BCRYPT_SALT_ROUNDS: Joi.number().default(12),

  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(3306),
  DB_USER: Joi.string().default('root'),
  DB_PASSWORD: Joi.string().allow('').default('rootpassword'),
  DB_NAME: Joi.string().default('campus360_auth'),
  DB_CONNECTION_LIMIT: Joi.number().default(10),

  REDIS_HOST: Joi.string().default('127.0.0.1'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_TTL_SECONDS: Joi.number().default(3600),

  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  AUTH_RATE_LIMIT_MAX: Joi.number().default(20),

  EXTERNAL_API_KEY: Joi.string().default('campus360_external_sync_key_93817f7b2c9a41e089d5119'),
  EXTERNAL_WEBHOOK_URL: Joi.string().allow('').default(''),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'security', 'debug').default('debug'),
  LOG_FILE_PATH: Joi.string().default('./logs'),

  ALERT_WEBHOOK_URL: Joi.string().allow('').default(''),
  ALERT_EMAIL_RECIPIENT: Joi.string().allow('').default('admin@campus360.internal')
}).unknown(true);

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  appName: envVars.APP_NAME,
  appUrl: envVars.APP_URL,
  frontendUrl: envVars.FRONTEND_URL,
  jwt: {
    accessSecret: envVars.JWT_ACCESS_SECRET,
    accessExpiresIn: envVars.JWT_ACCESS_EXPIRES_IN,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN
  },
  security: {
    bcryptSaltRounds: parseInt(envVars.BCRYPT_SALT_ROUNDS, 10),
    maxFailedAttempts: 5,
    lockDurationMinutes: 15
  },
  db: {
    host: envVars.DB_HOST,
    port: parseInt(envVars.DB_PORT, 10),
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    database: envVars.DB_NAME,
    connectionLimit: parseInt(envVars.DB_CONNECTION_LIMIT, 10)
  },
  redis: {
    host: envVars.REDIS_HOST,
    port: parseInt(envVars.REDIS_PORT, 10),
    password: envVars.REDIS_PASSWORD || null,
    ttl: parseInt(envVars.REDIS_TTL_SECONDS, 10)
  },
  rateLimit: {
    windowMs: parseInt(envVars.RATE_LIMIT_WINDOW_MS, 10),
    max: parseInt(envVars.RATE_LIMIT_MAX_REQUESTS, 10),
    authMax: parseInt(envVars.AUTH_RATE_LIMIT_MAX, 10)
  },
  external: {
    apiKey: envVars.EXTERNAL_API_KEY,
    webhookUrl: envVars.EXTERNAL_WEBHOOK_URL
  },
  logging: {
    level: envVars.LOG_LEVEL,
    path: envVars.LOG_FILE_PATH
  },
  alerts: {
    webhookUrl: envVars.ALERT_WEBHOOK_URL,
    email: envVars.ALERT_EMAIL_RECIPIENT
  }
};
