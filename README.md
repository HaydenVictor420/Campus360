# Campus360
An evision project

---

## Attendance, Syllabus & GPA/CGPA Tracker Module

A modern, responsive, full-stack student academic tracker built according to the **Campus360 System Architecture & Antigravity IDE Implementation Guide**.

---

## 🌟 Key Features

### 1. 📊 Academic Dashboard
- **Overall Attendance Metric**: Automatically calculates cumulative attendance percentage across all enrolled courses.
- **Shortage Alert Banner**: Instant alerts when any course drops below the configured threshold (default 75%), highlighting the exact number of consecutive classes required.
- **Syllabus Completion Gauge**: Real-time progress bar across all subjects and topics for upcoming exams.
- **Semester GPA & Cumulative CGPA Highlights**: Key performance indicators displayed at a glance.
- **Quick Action Buttons**: Fast shortcuts to log attendance, calculate GPA, or plan targets.

### 2. 📅 Subject-Wise Attendance Tracker
- **Fields Stored**: Subject Name, Course Code, Total Classes Conducted, Classes Attended, Faculty Name, Last Updated Date.
- **Input Validation**: Strict validation preventing negative numbers or attended classes exceeding conducted classes.
- **Zero-class Handling**: Displays `Not available yet` rather than division by zero when conducted classes = 0.
- **Status Indicators**:
  - 🟢 **Safe (Green)**: $\ge$ Minimum Threshold (e.g. $\ge 75\%$). Displays the number of **safe bunks** (classes you can safely miss without falling below threshold).
  - 🟡 **Near Margin (Yellow)**: Approaching threshold within warning margin (e.g. $70\% - 75\%$).
  - 🔴 **Shortage (Red)**: Attendance $< 75\%$.
- **Shortage Recovery Formula**:
  $$\text{Classes Needed } (n) = \left\lceil \frac{\text{Threshold} \times \text{Conducted} - 100 \times \text{Attended}}{100 - \text{Threshold}} \right\rceil$$
- **Safe Bunk Formula**:
  $$\text{Safe Bunks } (m) = \left\lfloor \frac{100 \times \text{Attended} - \text{Threshold} \times \text{Conducted}}{\text{Threshold}} \right\rfloor$$
- **Quick Log Controls**: One-click `+1 Present` and `+1 Missed` for rapid timetable updates.
- **Bulk CSV Importer**: Upload any college CSV attendance report, auto-detect columns, map custom headers, preview parsed rows with validation, and confirm before import.

### 3. 📚 Syllabus Completion Tracking
- **Unit-by-Unit Breakdown**: Course units/modules with total sub-topics and completed sub-topics.
- **Visual Progress Bars**: Subject-level and unit-level completion percentages.
- **Status Badges**: `Not Started` ($0\%$), `In Progress` ($1-59\%$), `On Track` ($\ge 60\%$), and `Completed` ($100\%$).
- **Quick Topic Increments**: `+` and `−` buttons for topic tracking after every lecture.

### 4. 🧮 Semester GPA Calculator (SGPA)
- **Course Rows**: Course Code, Name, Credit Value, Letter Grade, and Grade Points.
- **Configurable Grading Scales**: Integrates directly with institutional grade scales defined in Settings (10-point scale: O=10, A+=9, A=8, B+=7, B=6, C=5, P=4, F=0).
- **Instant Formula Execution**:
  $$\text{SGPA} = \frac{\sum (\text{Course Credits} \times \text{Grade Points})}{\sum \text{Course Credits}}$$
- **Seamless Transfer**: Push calculated SGPA directly into the CGPA Calculator with one click.

### 5. 🎯 Cumulative CGPA Calculator & Planner
- **Multi-Semester Aggregation**: Calculates cumulative grade point average weighted by semester credits:
  $$\text{CGPA} = \frac{\sum (\text{Semester Credits} \times \text{SGPA})}{\sum \text{Semester Credits}}$$
- **Equivalent Percentage & Classification**: Converts CGPA to percentage and standard degree classification (*First Class with Distinction*, *First Class*, etc.).
- **Target CGPA Planner**: Forecasts what future SGPA is needed in remaining semesters to achieve a graduation target (e.g., aiming for $8.50$ CGPA).

### 6. ⚙️ Settings, Persistence & Backup
- **Configurable Minimum Attendance Threshold**: Slider & numeric input (e.g., $75\%$).
- **Warning Buffer**: Configurable margin (default $5\%$).
- **Custom Grade Scale Editor**: Add or edit letter grades and point values.
- **Export & Import**: Full snapshot export/import as JSON, and attendance export as CSV.
- **Reset to Baseline**: One-click restoration of sample college data.
- **Hybrid Storage Architecture**: Automatically persists to backend server REST API database (`data/database.json`), with continuous mirror in browser `localStorage`.

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v18+ or v24 LTS)
- Web browser (Chrome, Edge, Firefox)

### Start the Backend Server
```powershell
npm start
```
*Or directly:*
```powershell
node server.js
```

The application will start on **http://localhost:3000**.
Open **http://localhost:3000** in your web browser.

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status |
| `GET` | `/api/dashboard` | Aggregated metrics, overall attendance %, CGPA, syllabus % |
| `GET` | `/api/attendance` | Subject-wise attendance list with calculated advice |
| `POST` | `/api/attendance` | Add new subject record |
| `PUT` | `/api/attendance/:id` | Update attendance record |
| `DELETE`| `/api/attendance/:id` | Remove subject record |
| `POST` | `/api/attendance/:id/increment` | Quick log `present` or `absent` |
| `POST` | `/api/attendance/bulk` | Bulk import CSV records |
| `GET` | `/api/syllabus` | Unit-wise syllabus records |
| `PUT` | `/api/syllabus/:id/unit/:unitNo` | Update unit topic completion |
| `GET` | `/api/gpa` | Current semester course list & SGPA |
| `POST` | `/api/gpa` | Save GPA courses |
| `GET` | `/api/cgpa` | Semesters list & weighted CGPA |
| `POST` | `/api/cgpa` | Save CGPA semesters |
| `GET` | `/api/settings` | Read institutional rules & grade scales |
| `POST` | `/api/settings` | Update settings & grade scales |
| `GET` | `/api/export` | Export backup (JSON or CSV) |
| `POST` | `/api/import` | Restore backup from file |
| `POST` | `/api/reset` | Reset to initial sample data |

---

## 🧪 Verification & Manual Testing Checklist

| Test Item | Expected Result | Verified |
|---|---|---|
| Zero Classes Conducted | Shows `Not available yet` (no NaN or divide-by-zero errors) | ✅ |
| Attended > Conducted | Form displays error and rejects submission | ✅ |
| Attendance < 75% | Displays Red Shortage pill + accurate consecutive classes needed | ✅ |
| Attendance $\ge 75\%$ | Displays Green Safe pill + safe bunks count | ✅ |
| Quick Log Buttons | `+1 Present` and `+1 Missed` update immediately | ✅ |
| Syllabus Unit Tracker | Topic `+` and `−` increments recalculate completion % | ✅ |
| GPA Dynamic Recalc | Changing grade or credits instantly recalculates SGPA | ✅ |
| CGPA Multi-Semester | Weights by credits $\sum(\text{Credits} \times \text{SGPA}) / \sum \text{Credits}$ | ✅ |
| Bulk CSV Import | Maps custom columns, previews data, validates rows | ✅ |
| Data Persistence | Refreshing page preserves state from server / localStorage | ✅ |
