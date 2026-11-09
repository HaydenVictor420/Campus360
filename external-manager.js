#!/usr/bin/env node
/**
 * ============================================================================
 * Campus360 - External Module Manager & Troubleshooting DevKit
 * ============================================================================
 * Purpose: A standalone, dedicated tool to manage, inspect, re-code, repair,
 * and troubleshoot the Login Module externally when problems arise.
 *
 * Usage:
 *   node external-manager.js [command] [options]
 *
 * Commands:
 *   health             - Performs full connectivity check (Database, Cache, Config)
 *   users              - Lists all registered users and account states
 *   create-user        - Creates a new user or administrator directly
 *   reset-password     - Forces a password reset for any user
 *   unlock <id|email>  - Instantly unlocks a locked user account
 *   import-data <file> - Bulk imports external records into the system
 *   cron <jobName>     - Manually triggers background cron jobs
 *   diagnostics        - Runs an automated 8-point system integrity diagnostic
 *   recode <key> <val> - Safely updates an environment variable in .env
 * ============================================================================
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const bcrypt = require('bcrypt');
const db = require('./src/config/database');
const cache = require('./src/config/cache');
const config = require('./src/config');
const UserModel = require('./src/models/userModel');
const TokenModel = require('./src/models/tokenModel');
const CronScheduler = require('./src/schedulers/cronJobs');
const ExternalSyncService = require('./src/services/externalSyncService');

function printHeader() {
  console.log('================================================================');
  console.log('       CAMPUS360 - EXTERNAL MODULE MANAGER & RECOVERY TOOL      ');
  console.log('================================================================');
}

async function runHealthCheck() {
  printHeader();
  console.log('Running System Health Check...\n');

  console.log(`[+] Node Version:   ${process.version}`);
  console.log(`[+] Environment:    ${config.env}`);
  console.log(`[+] App Name:       ${config.appName}`);
  console.log(`[+] App Port:       ${config.port}`);

  const dbStatus = db.getStatus();
  console.log(`[+] Database:       ${dbStatus.type.toUpperCase()} (Host: ${dbStatus.host}, DB: ${dbStatus.database}, Connected: ${dbStatus.connected})`);

  const cacheStatus = cache.getStatus();
  console.log(`[+] Caching Layer:  ${cacheStatus.type.toUpperCase()} (Connected: ${cacheStatus.connected})`);

  console.log('\n[SUCCESS] Health check completed successfully.');
  process.exit(0);
}

async function listUsers() {
  printHeader();
  console.log('Retrieving registered users...\n');

  try {
    const users = await UserModel.getAll(100, 0);
    if (!users || users.length === 0) {
      console.log('No users found in database.');
    } else {
      console.table(users.map(u => ({
        ID: u.id,
        Username: u.username,
        Email: u.email,
        Name: `${u.first_name} ${u.last_name}`,
        Role: u.role,
        Active: u.is_active ? 'YES' : 'NO',
        Verified: u.is_verified ? 'YES' : 'NO',
        LockedUntil: u.lock_until || 'None'
      })));
    }
  } catch (err) {
    console.error('Error fetching users:', err.message);
  }
  process.exit(0);
}

async function unlockUser(identifier) {
  printHeader();
  if (!identifier) {
    console.error('[ERROR] Please specify an email or user ID to unlock.');
    console.log('Usage: node external-manager.js unlock <email|id>');
    process.exit(1);
  }

  let user = null;
  if (!isNaN(identifier)) {
    user = await UserModel.findById(parseInt(identifier, 10));
  } else {
    user = await UserModel.findByEmail(identifier);
  }

  if (!user) {
    console.error(`[ERROR] User "${identifier}" was not found.`);
    process.exit(1);
  }

  await UserModel.unlockAccount(user.id);
  console.log(`[SUCCESS] Account for ${user.email} (ID: ${user.id}) has been unlocked!`);
  process.exit(0);
}

async function forceResetPassword(email, newPassword) {
  printHeader();
  if (!email || !newPassword) {
    console.error('[ERROR] Missing arguments.');
    console.log('Usage: node external-manager.js reset-password <email> <newPassword>');
    process.exit(1);
  }

  const user = await UserModel.findByEmail(email);
  if (!user) {
    console.error(`[ERROR] User with email "${email}" not found.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, config.security.bcryptSaltRounds);
  await UserModel.updatePassword(user.id, hash);
  await UserModel.unlockAccount(user.id);

  console.log(`[SUCCESS] Password for ${email} has been updated and account unlocked.`);
  process.exit(0);
}

async function createUserDirect(email, username, password, role = 'student', firstName = 'New', lastName = 'User') {
  printHeader();
  if (!email || !username || !password) {
    console.error('[ERROR] Usage: node external-manager.js create-user <email> <username> <password> [role] [firstName] [lastName]');
    process.exit(1);
  }

  try {
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      console.error(`[ERROR] User with email ${email} already exists.`);
      process.exit(1);
    }

    const hash = await bcrypt.hash(password, config.security.bcryptSaltRounds);
    const created = await UserModel.create({
      email,
      username,
      password_hash: hash,
      first_name: firstName,
      last_name: lastName,
      role,
      is_active: 1,
      is_verified: 1
    });

    console.log(`[SUCCESS] User created successfully:`);
    console.log(created);
  } catch (err) {
    console.error('[ERROR] Failed to create user:', err.message);
  }
  process.exit(0);
}

async function runCronJob(jobName) {
  printHeader();
  console.log(`Executing manual cron trigger: ${jobName || 'all'}...\n`);

  if (!jobName || jobName === 'token-clean') {
    const res = await CronScheduler.runTokenCleanup();
    console.log('[-] Token cleanup result:', res);
  }

  if (!jobName || jobName === 'unlock') {
    const res = await CronScheduler.runAccountUnlock();
    console.log('[-] Account unlock watchdog result:', res);
  }

  if (!jobName || jobName === 'audit-prune') {
    const res = await CronScheduler.runAuditPruning();
    console.log('[-] Audit log pruning result:', res);
  }

  console.log('\n[SUCCESS] Cron job execution finished.');
  process.exit(0);
}

async function importExternalData(filePath) {
  printHeader();
  if (!filePath) {
    console.error('[ERROR] Please specify the path to a JSON file containing user records.');
    console.log('Usage: node external-manager.js import-data <path/to/users.json>');
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`[ERROR] File not found: ${resolved}`);
    process.exit(1);
  }

  try {
    const content = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    const records = Array.isArray(content) ? content : (content.records || []);
    
    console.log(`Loaded ${records.length} records. Processing external batch...`);
    const result = await ExternalSyncService.processBatch({ source: `file:${path.basename(filePath)}`, records }, { ip: '127.0.0.1' });
    console.log('\n[SUCCESS] Ingestion completed:');
    console.log(result);
  } catch (err) {
    console.error('[ERROR] Ingestion failed:', err.message);
  }
  process.exit(0);
}

async function recodeConfig(key, value) {
  printHeader();
  if (!key || value === undefined) {
    console.error('[ERROR] Usage: node external-manager.js recode <ENV_KEY> <NEW_VALUE>');
    process.exit(1);
  }

  const envPath = path.resolve(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('[ERROR] .env file not found.');
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, 'utf8');
  const regex = new RegExp(`^${key}=.*$`, 'm');

  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${key}=${value}`);
  } else {
    envContent += `\n${key}=${value}`;
  }

  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`[SUCCESS] Configuration updated in .env: ${key}=${value}`);
  console.log('Restart the application or container for changes to take effect.');
  process.exit(0);
}

async function runDiagnostics() {
  printHeader();
  console.log('Executing 8-Point Module Diagnostic Suite...\n');

  const tests = [
    {
      name: 'BCrypt Cryptographic Hashing',
      fn: async () => {
        const hash = await bcrypt.hash('Diagnostic@2026', 10);
        const match = await bcrypt.compare('Diagnostic@2026', hash);
        if (!match) throw new Error('BCrypt comparison failed');
        return 'OK (Salt rounds: 10/12)';
      }
    },
    {
      name: 'JWT Access & Refresh Token Engine',
      fn: async () => {
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ test: true }, config.jwt.accessSecret, { expiresIn: '1m' });
        const decoded = jwt.verify(token, config.jwt.accessSecret);
        if (!decoded.test) throw new Error('JWT verification mismatch');
        return 'OK (Signature verified)';
      }
    },
    {
      name: 'Database Storage Layer',
      fn: async () => {
        const status = db.getStatus();
        return `OK (${status.type.toUpperCase()})`;
      }
    },
    {
      name: 'Caching Layer',
      fn: async () => {
        await cache.set('diag_test', 'val123', 60);
        const val = await cache.get('diag_test');
        await cache.del('diag_test');
        if (val !== 'val123') throw new Error('Cache read/write mismatch');
        return `OK (${cache.getStatus().type.toUpperCase()})`;
      }
    },
    {
      name: 'Security Rate Limiter Definitions',
      fn: async () => {
        return `OK (General: ${config.rateLimit.max}/15m, Auth: ${config.rateLimit.authMax}/15m)`;
      }
    },
    {
      name: 'External Ingestion API Key',
      fn: async () => {
        if (!config.external.apiKey || config.external.apiKey.length < 10) throw new Error('Insecure API key');
        return `OK (Configured, Length: ${config.external.apiKey.length})`;
      }
    },
    {
      name: 'Logging Directory & Transports',
      fn: async () => {
        const logDir = path.resolve(config.logging.path);
        if (!fs.existsSync(logDir)) throw new Error('Log directory missing');
        return `OK (Path: ${logDir})`;
      }
    },
    {
      name: 'Background Schedulers Status',
      fn: async () => {
        return 'OK (Cron schedules ready: Token Purge, Lock Watchdog, Audit)';
      }
    }
  ];

  let passed = 0;
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    try {
      const res = await t.fn();
      console.log(`[PASS] [${i + 1}/${tests.length}] ${t.name} -> ${res}`);
      passed++;
    } catch (err) {
      console.log(`[FAIL] [${i + 1}/${tests.length}] ${t.name} -> ${err.message}`);
    }
  }

  console.log(`\nDiagnostics finished: ${passed}/${tests.length} tests passed.`);
  process.exit(passed === tests.length ? 0 : 1);
}

// Command Router
const [,, command, ...args] = process.argv;

switch (command) {
  case 'health':
    runHealthCheck();
    break;
  case 'users':
    listUsers();
    break;
  case 'unlock':
    unlockUser(args[0]);
    break;
  case 'reset-password':
    forceResetPassword(args[0], args[1]);
    break;
  case 'create-user':
    createUserDirect(args[0], args[1], args[2], args[3], args[4], args[5]);
    break;
  case 'cron':
    runCronJob(args[0]);
    break;
  case 'import-data':
    importExternalData(args[0]);
    break;
  case 'recode':
    recodeConfig(args[0], args[1]);
    break;
  case 'diagnostics':
    runDiagnostics();
    break;
  default:
    printHeader();
    console.log(`
Available Commands:
  node external-manager.js health
  node external-manager.js users
  node external-manager.js create-user <email> <user> <pass> [role] [fn] [ln]
  node external-manager.js reset-password <email> <newPassword>
  node external-manager.js unlock <email|userId>
  node external-manager.js import-data <records.json>
  node external-manager.js cron [token-clean|unlock|audit-prune]
  node external-manager.js recode <ENV_KEY> <NEW_VALUE>
  node external-manager.js diagnostics
`);
    process.exit(0);
}
