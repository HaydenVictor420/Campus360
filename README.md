# Campus360
An evision project

---

## 🎓 Campus360 — Attendance, Syllabus & GPA/CGPA Platform

[![Branch: shiffana](https://img.shields.io/badge/Branch-shiffana-4f46e5.svg)](https://github.com/HaydenVictor420/Campus360/tree/shiffana)
[![Local Server](https://img.shields.io/badge/Local_App-http%3A%2F%2Flocalhost%3A3000-10b981.svg)](http://localhost:3000)
[![Documentation](https://img.shields.io/badge/Documentation-PDF_Included-0ea5e9.svg)](./Campus360_Source_Code_Documentation.pdf)
[![Platform](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v24%20LTS-brightgreen.svg)](https://nodejs.org/)

A full-stack, responsive student academic monitoring platform engineered according to the **Campus360 Architecture Guide**.

---

### 🌐 Quick Access Link
When the backend server is running, access the live portal directly in your browser:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## ⚡ 1-Click Launch

### Windows (Quickest):
Simply **double-click** the included [`start-server.bat`](./start-server.bat) file in this repository:
1. It automatically boots the Express REST backend.
2. It automatically opens **http://localhost:3000** in your default web browser.

### Command Line:
```powershell
# 1. Install dependencies (if not already installed)
npm install

# 2. Start the server
npm start
# OR
node server.js
```
Open **[http://localhost:3000](http://localhost:3000)** in Chrome, Edge, or Firefox.

---

## 📄 Complete Source Code PDF Documentation
The complete source code of all backend and frontend files, styling, database schemas, and mathematical formulas has been compiled into a standalone, 87-page PDF document:
📥 **[Download Campus360_Source_Code_Documentation.pdf](./Campus360_Source_Code_Documentation.pdf)**

---

## 🌟 Key Functional Modules

### 1. 📊 Real-Time Academic Dashboard
- **Overall Attendance Gauge**: Automatically computes cumulative attendance across all registered courses.
- **Shortage Alert Banner**: Instant visual notification whenever attendance in any subject drops below the mandatory threshold (e.g., $< 75\%$).
- **Syllabus Progress Indicator**: Unit and topic completion across all semester courses.
- **GPA & CGPA Highlights**: Key semester and cumulative performance metrics available at a glance.

---

### 2. 📅 Subject-Wise Attendance Tracker
- **Fields Stored**: Subject Name, Course Code, Total Classes Conducted, Classes Attended, Faculty Name, Last Updated Date.
- **Zero-Class Safety**: Renders `Not available yet` rather than division-by-zero when classes held = 0.
- **Validation**: Strict boundary checks preventing negative numbers or attended classes exceeding conducted classes.
- **Three-Tier Status Indicators**:
  - 🟢 **Safe**: Attendance $\ge 75\%$ (Configurable in Settings). Displays **Safe Bunk Count** ($m$).
  - 🟡 **Near Margin**: Between $70\%$ and $75\%$ (Approaching threshold warning buffer).
  - 🔴 **Shortage**: Attendance $< 75\%$. Computes mandatory **Consecutive Classes Required** ($n$).
- **Mathematical Formulas**:
  - **Consecutive Classes Needed ($n$)**:
    $$n = \left\lceil \frac{\text{Threshold} \times \text{Conducted} - 100 \times \text{Attended}}{100 - \text{Threshold}} \right\rceil$$
  - **Safe Bunks ($m$)**:
    $$m = \left\lfloor \frac{100 \times \text{Attended} - \text{Threshold} \times \text{Conducted}}{\text{Threshold}} \right\rfloor$$
- **Quick Logging**: 1-click `+1 Present` and `+1 Missed` buttons for rapid timetable updates.
- **Bulk CSV Importer**: Auto-detects CSV delimiters, maps custom college headers, validates entries, and previews before import.

---

### 3. 📚 Syllabus Completion Tracker
- **Unit & Topic Tracking**: Tracks each module's sub-topics (e.g., Unit 1 through Unit 5).
- **Subject Coverage Percentage**:
  $$\text{Coverage \%} = \left(\frac{\text{Completed Topics}}{\text{Total Topics}}\right) \times 100$$
- **Status Badges**: `Not Started` ($0\%$), `In Progress` ($1-59\%$), `On Track` ($\ge 60\%$), and `Completed` ($100\%$).
- **Quick Controls**: `+` and `−` increment buttons for instant topic logging after lectures.

---

### 4. 🧮 Semester GPA Calculator (SGPA)
- **Dynamic Recalculation**: Formula executes instantly on any grade or credit change:
  $$\text{SGPA} = \frac{\sum (\text{Course Credits} \times \text{Grade Points})}{\sum \text{Course Credits}}$$
- **Configurable Scale**: Grade options (O: 10, A+: 9, A: 8, B+: 7, B: 6, C: 5, P: 4, F: 0) mapped dynamically from Settings.
- **1-Click CGPA Transfer**: Automatically pushes calculated SGPA into the cumulative calculator.

---

### 5. 🎯 Cumulative CGPA Calculator & Target Planner
- **Multi-Semester Aggregation**:
  $$\text{CGPA} = \frac{\sum (\text{Semester Credits} \times \text{SGPA})}{\sum \text{Semester Credits}}$$
- **Degree Classification**: Categorizes academic standing (*First Class with Distinction*, *First Class*, *Second Class*).
- **Target CGPA Planner**: Forecasts the required SGPA in remaining semesters to achieve graduation targets:
  $$\text{Required SGPA} = \frac{(\text{Target CGPA} \times \text{Total Credits}) - \text{Current Weighted Points}}{\text{Remaining Credits}}$$

---

### 6. ⚙️ Settings, Backups & Dual Persistence
- **Configurable Thresholds**: Slider & numeric input for attendance percentage (default $75\%$) and warning margins.
- **Custom Grading Scales**: Add, edit, or delete institutional letter grades and point maps.
- **JSON & CSV Backups**: Complete snapshot export and restoration with confirmation.
- **Dual Persistence Architecture**: REST API database file (`data/database.json`) with continuous browser `localStorage` mirroring for offline use.

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

## 🛠️ Repository & Branch Info
- **GitHub Repository**: [https://github.com/HaydenVictor420/Campus360.git](https://github.com/HaydenVictor420/Campus360.git)
- **Active Branch**: `shiffana`
- To push updates from your local machine, run:
  ```powershell
  git push -u origin shiffana
  ```
  *(Or double-click `push-to-github.bat`)*
