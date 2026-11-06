# Campus360

Personal attendance, syllabus, SGPA and CGPA tracker. Built with vanilla HTML, CSS and JavaScript, a Node.js server and optional MongoDB Atlas storage. The warm, spacious editorial interface is inspired by [The Online School](https://www.theonlineschool.com/), with original Campus360 branding.

## Start

Install Node.js 22 or newer, open this folder in a terminal, and run:

```powershell
npm install
Copy-Item .env.example .env
npm start
```

Open [Campus360](http://127.0.0.1:3000). Stop the server with Ctrl+C. `start-server.bat` also starts the app after installation. Change `PORT` in `.env` if 3000 is occupied, then open that port instead.

With an empty `MONGODB_URI`, workspaces persist in ignored `data/` files. Local demo mode can run without the MongoDB dependency installed. An Atlas URI switches storage to MongoDB; failed Atlas connections stop startup instead of silently switching storage.

## MongoDB Atlas

Create an Atlas cluster, a database user and an IP access-list entry for your server. Copy the Node.js driver connection URI from the cluster Connect dialog into `MONGODB_URI` in `.env`, replacing the credential placeholders. Percent-encode special characters in credentials. Set `MONGODB_DB=campus360` and restart. The server reports a successful connection, and the interface displays the active storage mode. See the [official driver setup guide](https://www.mongodb.com/docs/drivers/node/current/get-started/).

Credentials remain server-side. Never put the URI in browser code or commit `.env`. Atlas stores one workspace document per normalized demo email in the `workspaces` collection. Live Atlas connectivity requires your own cluster credentials and has not been verified here.

## Mock authentication

Enter any name and valid email to open a demo workspace. Returning with the same email retrieves it. **Anyone using that email can access the same workspace.** Use demo data only. Sessions are random, expire after a day, use HttpOnly/SameSite cookies, and end on server restart.

Google Cloud authentication is intentionally not enabled. `GOOGLE_CLIENT_ID` is reserved for later integration; filling it alone does not activate Google login. Real integration requires server-verified Google ID tokens and workspace identity based on a verified Google subject ID. No Cloud Console resources are created automatically. Keep the application on localhost while mock authentication is active.

## Features

- Overview with weighted attendance, syllabus coverage, SGPA, CGPA and shortage alerts.
- Create, edit and delete subjects; present/missed buttons; recovery and safe-miss advice.
- CSV attendance import with delimiter detection, header mapping, validation and preview. Duplicate course codes are rejected; imports add new subjects.
- Syllabus unit creation, editing and bounded topic completion controls.
- Course GPA with credits, configurable grade mappings and semester transfer.
- Semester CGPA, editable results, duplicate semester-name protection and target planner.
- Complete JSON backup and validated restoration; attendance CSV export; confirmed sample-data reset.
- Persistent local or Atlas workspaces and stale-tab revision conflict detection.

## Rules

Counts are nonnegative integers; attended cannot exceed conducted. Zero classes shows no percentage. Overall attendance uses summed counts. Classification uses unrounded percentages. With threshold T strictly between 0 and 100 and margin W from 0 through T, safe is percentage >= T; near margin is T-W <= percentage < T; shortage is percentage < T-W. Every subject below T triggers an alert.

```text
Attendance = 100*A/C
Required attended future classes = max(0, ceil((T*C - 100*A)/(100-T)))
Future safe misses = max(0, floor((100*A - T*C)/T))
SGPA = sum(credits * grade points) / sum(credits)
CGPA = sum(semester credits * SGPA) / sum(semester credits)
Required remaining weighted average =
 (target * (completed credits + remaining credits) - completed weighted points)
 / remaining credits
```

Recovery advice assumes enough future classes exist. Topic coverage gives every topic equal weight: 0% not started, greater than 0 and below 60% in progress, 60% through below 100% substantial coverage, 100% completed. Zero topics shows no coverage. These are not deadline predictions.

GPA credits must be finite and positive; grades must exist in the configured map. Empty lists show no result. The planner handles impossible targets and zero remaining credits. Stored precision is retained, but rounded semester inputs can produce CGPA differences. Failed, repeated, transferred and non-credit courses must be entered according to institutional rules. Degree classifications are not inferred.

## Imports and backups

CSV requires columns for subject name, code, attended and conducted; map your actual headers in the dialog. Comma, semicolon and tab delimiters, quoted cells and UTF-8 BOMs are supported. Counts must be valid whole numbers and codes unique. Requests and imports are limited to 1 MB. CSV covers attendance only; JSON is the complete backup format. Formula-like spreadsheet cells are escaped on export.

JSON backups include version 1, settings, subjects, courses and semesters. Restoration validates before saving, retains the current revision and replaces the workspace after confirmation. Export a backup before restoration or reset.

## API

Requests and responses use JSON. Authenticated routes use the session cookie.

| Method | Route | Input / result |
| --- | --- | --- |
| GET | `/api/health` | `{ok, storage, auth}` |
| POST | `/api/auth/mock` | `{name,email}` → user and session cookie |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/logout` | `{}` → clear session |
| GET | `/api/state` | Complete workspace and revision |
| PUT | `/api/state` | Complete validated workspace with current revision → saved workspace with incremented revision |

Sign-in example: `{"name":"Alex","email":"alex@example.test"}`. GET state before updating it and retain the revision in PUT. Entity editing and backups use this state API; the earlier individual entity routes are not implemented.

Errors return `{ "error": "description" }`. Codes: 400 invalid data, 401 absent/expired session, 403 cross-origin mutation, 404 missing route, 409 stale revision, 413 oversized request, 500 server/storage failure. Reload after 409 before reapplying edits.

## Files and checks

- `public/index.html`, `style.css`, `app.js`: responsive interface and interactions.
- `server.js`: static serving, mock sessions, local/Atlas persistence.
- `lib.js`: validation, seed data and calculation helpers.
- `test/core.test.js`: calculation and validation tests.
- `test/api-check.js`: smoke checks against the running server.

Run `npm test`. With the app running, use `npm run test:api` to check sessions, saves, persisted reads, stale revisions, validation, static serving, secret isolation and logout. API checks use the isolated `qa-check@example.test` demo workspace. Browser layout verification and live Atlas checks should be completed on the deployment machine.

## Limits

This is a local demo with mock identity. Offline editing, Google token verification, college-system synchronization and institution-specific classification are not enabled. The server must be running to load and save. Forms are not cached offline. Local writes use a process queue and atomic file replacement. Atlas revision checks are coordinated within one server process; multiple instances need database-level compare-and-swap updates. Backups should be stored separately. No license has been selected by the owner.
