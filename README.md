# Campus360 - Enterprise Authentication & Access Management Module

[![Campus360 CI](https://github.com/HaydenVictor420/Campus360/actions/workflows/ci.yml/badge.svg)](https://github.com/HaydenVictor420/Campus360/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MySQL%208.0-blue.svg)](https://www.mysql.com/)
[![Cache](https://img.shields.io/badge/Cache-Redis%207.2-red.svg)](https://redis.io/)
[![Branch](https://img.shields.io/badge/Git%20Branch-sanjay-orange.svg)](https://github.com/HaydenVictor420/Campus360/tree/sanjay)

An enterprise-grade, secure, and accessible authentication and user management module built for the **Campus360** ecosystem.

---

## 🌟 Key Architecture & Capabilities

### 1. Data Automation & Storage

- **MySQL 8.0**: Connection pooling with `mysql2/promise`, parameterized queries (SQLi protection), dynamic auto-migrations (`database/schema.sql` and `database/migrator.js`), and high-availability embedded memory fallback for zero downtime.
- **Caching Layer**: High-speed caching via **Redis** (`ioredis`) for user sessions, blacklist checks, and profile lookups, backed by an automatic in-memory TTL fallback cache when Redis is offline.
- **Automated Cron Jobs / Schedulers**: Integrated background tasks via `node-cron`:
  - **Hourly**: Expired and revoked refresh token purge.
  - **Every 5 Minutes**: Account lockout expiry watchdog.
  - **Daily (02:00 AM)**: Pruning of audit logs older than 90 days.

### 2. DevOps & Infrastructure

- **Containerization**:
  - `Dockerfile`: Multi-stage, secure Node 20 Alpine container running as non-root user `node` with `dumb-init` and container health checks.
  - `docker-compose.yml`: Complete stack orchestration bringing up App (`:3000`), MySQL 8.0 (`:3306`), Redis 7.2 (`:6379`), and phpMyAdmin (`:8080`).
- **CI/CD Pipelines**:
  - `.github/workflows/ci.yml`: Automated testing, dependency caching, linter checks, and Docker container verification on pushes and PRs to `sanjay` and `main`.
  - `.github/workflows/deploy.yml`: Production staging deployment pipeline.
- **Environment Configuration**: Robust validation schema using Joi (`src/config/index.js`), with documented `.env.example`.

### 3. Reliability & Maintenance

- **Logging & Monitoring**: Dual logging stack with **Winston** (rotating JSON error, security, and combined logs) and **Morgan** (HTTP request logger) tagged with unique correlation IDs (`X-Request-Id`).
- **Error Handling & Alerts**: Standardized `AppError` hierarchy (`ValidationError`, `AuthenticationError`, `ForbiddenError`, `NotFoundError`), centralized Express error handler, and automated security alerting for brute-force attempts and token reuse.
- **Automated Testing**: 19 automated unit and integration tests using **Jest** and **Supertest** covering JWT lifecycles, bcrypt hashing, NIST password validation, login lockout, and external data ingestion.

### 4. Security & Compliance

- **Authentication**: Dual-token JWT (short-lived Access Token + cryptographically rotated Refresh Token family).
- **Password Security**: NIST-compliant password validation with 12-round **BCrypt** hashing.
- **Account Lockout Policy**: Automatically locks accounts for 15 minutes after 5 consecutive failed login attempts to thwart brute-force attacks.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `student`, `faculty`, and `admin`.
- **Hardened HTTP**: Security headers with **Helmet**, whitelisted **CORS**, and strict **Rate Limiting** via `express-rate-limit`.

### 5. Accessibility & Frontend Correlation

- **Accessible UI**: Semantic HTML5 with ARIA roles (`role="tab"`, `role="alert"`, `aria-live="polite"`), high-contrast styling, keyboard navigation (Tab/Enter), and real-time password strength indicators.
- **Auto-Refresh Interceptor**: Client-side API client (`public/js/api.js`) automatically intercepts HTTP 401s to transparently rotate tokens and retry requests.

### 6. External Data Ingestion & Integration API

- Secure API (`POST /api/v1/external/import`) protected by institutional API Key (`x-api-key`) allowing student information systems (SIS), attendance trackers, and registrars to push user records regularly with batch error reporting.

### 7. External Module Manager & Recovery Tool (`external-manager.js`)

- Dedicated administrative and maintenance utility allowing administrators and developers to inspect, manage, recode, and test the module externally without opening a browser or writing manual database queries.

---

## 📁 Directory Structure

```
Login Module/
├── .github/workflows/
│   ├── ci.yml                 # GitHub Actions automated test & build pipeline
│   └── deploy.yml             # CD deployment workflow
├── database/
│   ├── schema.sql             # MySQL schema definitions
│   ├── seed.sql               # Seed data for default accounts
│   └── migrator.js            # Auto-migration runner on startup
├── public/                    # Professional accessible Frontend
│   ├── css/style.css          # Modern responsive stylesheet
│   ├── js/
│   │   ├── api.js             # API client with auto token refresh
│   │   ├── app.js             # Form UI event coordinator
│   │   └── validation.js      # Client-side input & strength validation
│   ├── index.html             # Main accessible authentication portal
│   └── dashboard.html         # Post-login session & admin overview
├── src/
│   ├── config/                # Environment validation, MySQL pool & Cache manager
│   ├── controllers/           # Auth and External controllers
│   ├── middleware/            # JWT auth, RBAC, Rate limiter, Error handler, Request logger
│   ├── models/                # User, Token, Audit, and Sync database models
│   ├── routes/                # Express API routes
│   ├── schedulers/            # Node-cron background jobs
│   ├── services/              # AuthService, AlertService, ExternalSyncService
│   ├── utils/                 # Winston Logger, AppError, Password validator
│   ├── app.js                 # Express application setup
│   └── server.js              # Server bootstrap & graceful shutdown
├── tests/
│   ├── unit/                  # Cryptography & Validation tests
│   └── integration/           # Auth & External API integration tests
├── .dockerignore
├── .env.example
├── .env
├── .gitignore
├── Dockerfile                 # Production multi-stage container
├── docker-compose.yml         # Full stack orchestration (App + MySQL + Redis + phpMyAdmin)
├── external-manager.js        # External CLI management & recovery devkit
├── manage.bat                 # One-click Windows runner for external manager
├── push-to-github.bat         # One-click Windows script to push branch sanjay
├── sample-external-users.json # Sample batch data for external ingestion
├── start-server.bat           # One-click Windows server starter
└── package.json
```

---

## 🚀 Quick Start Guide

### 1. Local Development (Node.js)

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Run Diagnostic Suite**:

   ```bash
   node external-manager.js diagnostics
   ```

3. **Start the Application**:

   ```bash
   # Using script:
   start-server.bat
   # Or using npm:
   npm start
   ```

   Open your browser at: `http://localhost:3000`

4. **Default Accounts**:
   - **Admin**: `admin@campus360.internal` / `Admin@12345`
   - **Student**: `student@campus360.internal` / `Student@12345`
   - **Faculty**: `faculty@campus360.internal` / `Faculty@12345`

---

### 2. Full Containerized Deployment (Docker Compose)

Start the entire stack including Node.js App, MySQL 8, Redis, and phpMyAdmin:

```bash
docker compose up -d --build
```

- Application: `http://localhost:3000`
- MySQL 8.0: `localhost:3306`
- Redis: `localhost:6379`
- phpMyAdmin: `http://localhost:8080`

To stop:

```bash
docker compose down
```

---

### 3. Automated Testing Suite

Run all 19 unit and integration tests:

```bash
npm test
```

Coverage report:

```bash
npm run test:coverage
```

---

## 🛠 External Module Manager CLI (`external-manager.js`)

A dedicated external maintenance file is provided in this folder to inspect, recode, or repair the module if issues arise:

| Command | Description |
| --- | --- |
| `node external-manager.js diagnostics` | Runs an 8-point automated diagnostic test suite |
| `node external-manager.js health` | Inspects MySQL, Redis, and system status |
| `node external-manager.js users` | Lists all registered users and lock states |
| `node external-manager.js create-user <email> <user> <pass> [role]` | Directly creates an account |
| `node external-manager.js reset-password <email> <newPassword>` | Forces a password reset for any user |
| `node external-manager.js unlock <email\|id>` | Instantly clears an account lockout |
| `node external-manager.js cron [token-clean\|unlock\|audit-prune]` | Manually executes a background cron job |
| `node external-manager.js import-data sample-external-users.json` | Ingests external batch user data |
| `node external-manager.js recode <KEY> <VALUE>` | Safely updates an environment setting in `.env` |

---

## 📡 External Data Ingestion API

To push external student/faculty records regularly from external systems:

**Endpoint**: `POST /api/v1/external/import`  
**Header**: `x-api-key: campus360_external_sync_key_93817f7b2c9a41e089d5119`  
**Payload**:

```json
{
  "source": "campus_sis_registrar",
  "records": [
    {
      "email": "john.smith@campus360.internal",
      "username": "john_s",
      "firstName": "John",
      "lastName": "Smith",
      "role": "student"
    }
  ]
}
```

---

## 🌿 Git & GitHub Synchronization (Branch: `sanjay`)

The repository is configured on active branch **`sanjay`** tracking:  
`https://github.com/HaydenVictor420/Campus360.git`

### Option 1: Double-Click Batch Script

Double-click `push-to-github.bat` in this folder. It will stage, commit, and push directly to branch `sanjay`.

### Option 2: Command Line

```bash
git checkout sanjay
git add .
git commit -m "feat(auth): complete enterprise login module"
git push -u origin sanjay
```

If GitHub prompts for authentication, provide a **GitHub Personal Access Token (PAT)** with repository write permissions or authorize via Git Credential Manager in your browser.
