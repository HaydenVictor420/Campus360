# 🎓 Campus360 — Unified Academic & Student Intelligence Gateway

> **Foreground GUI Module for Envision Project**  
> Built to eliminate academic chaos, scattered WhatsApp groups, and fragmented ERP portals by uniting every facet of campus life into a high-performance, single-pane-of-glass intelligence portal.

---

## 🌟 The Problem Statement Addressed

> *"College students have to keep track of attendance percentages, GPA, schedules, grades, pending projects, syllabus, and room/lab bookings. All this is managed either via notice boards, WhatsApp groups, different ERP portals, and word of mouth. There is no centralized source that collates all the essential, real-time information about 'what's happening' and 'what happened in my last class'. As a result, students miss out on important deadlines, have unplanned attendance issues, and face confusion due to last-minute room changes."*

---

## 🚀 The 7 Core Solution Portals Implemented

### 1. 📊 Attendance & GPA Command Center (`attendance.js` & `cgpa.js`)
- **Subject-Wise Percentage**: Live gauges with clear visual status:
  - 🔴 **Critical (< 75%)**: Automatic warning banner alerting of exam debarment risk.
  - 🟡 **Caution (75% - 80%)**: Safe but borderline.
  - 🟢 **Safe (> 80%)**: Eligible for distinction.
- **Interactive Bunk / Attend Simulator**:
  - Slide to simulate: *"If I attend next $X$ classes, my attendance climbs to $Y\%$."*
  - Slide to simulate: *"If I skip $N$ classes, do I fall below 75%?"*
  - Dynamic algorithm informs exact number of classes required to regain eligibility.
- **Dynamic GPA & CGPA Calculator**:
  - Real-time grade adjustments (O = 10, A+ = 9, A = 8, B+ = 7, etc.) with credit weightages.
  - Instant recalculation of SGPA and cumulative CGPA.
  - **Target CGPA Goal Planner**: Calculates the required SGPA in remaining semesters to graduate with a desired score (e.g., 9.0+ for Tier-1 placements).

### 2. 📅 Dynamic Timetable & Room Change Radar (`timetable.js`)
- **Interactive Period Cards**: Hourly class breakdown across all 5 weekdays (Monday through Friday).
- **Click-to-Expand Period Dossier**: Reveals instructor cabin, office consultation hours, scheduled curriculum topic, and lecture materials.
- **⚡ Last-Minute Room Change Radar**:
  - Detects and highlights relocated classrooms with a red pulse banner (e.g., *"CS302 shifted from LH-102 to LH-204 due to projector maintenance"*).
  - Staff / Admins can broadcast emergency classroom relocations with 1 click.

### 3. 📝 Period-Wise Class Log (`periodLog.js`)
- Directly answers: **"What happened in my last class?"**
- Chronological timeline recording:
  - Exact topics taught (e.g., *"Support Vector Machines: Dual Formulation & KKT Conditions"*).
  - Key takeaways, numerical homework problems, and surprise test notices.
  - Downloadable faculty materials (PDF lecture slides, Jupyter notebooks, datasets).
  - Biometric period attendance verification & OD claim buttons.

### 4. 🎯 Marks & Pending Projects Tracker (`marksProjects.js`)
- **Continuous Evaluation Card**: IA-1, IA-2, Assignments, and Lab continuous scores.
- **Project Deadlines Radar**:
  - Project title, faculty guide, team members, and priority urgency tags.
  - Dynamic deadline countdowns (e.g., *"🚨 3 Days Left"*).
  - Visual sprint progress bars.
  - **Submit Deliverable Modal**: Students can upload GitHub repository URLs and sprint reports.

### 5. 📚 Syllabus Tracker & Exam-Prep Checklist (`syllabusTracker.js`)
- Comprehensive curriculum breakdown by **Units** and **Sub-topics**.
- Dual Synchronized Counters:
  - **Faculty Covered**: Officially completed topics during lectures.
  - **Self-Revised by You**: Interactive checkboxes allowing students to check off topics as they study.
- Progress bars showing exact exam readiness percentage and remaining study hours.

### 6. 💻 Real-Time Lab / Room / Hall Booking Portal (`labBooking.js`)
- Available facilities:
  - *Turing AI & High-Performance Computing Lab (NVIDIA RTX 4090s)*
  - *Dr. APJ Abdul Kalam Grand Auditorium (650 seats)*
  - *Ramanujan Seminar Hall (180 seats)*
  - *IoT & Embedded Robotics Workshop*
  - *Innovation Discussion Rooms*
- **1-Click Booking**: Date, time slot, purpose, and attendee count.
- **Digital Access Pass Generator**: Generates verifiable passes with unique codes, security holograms, and QR code graphics for security checkpoints.

### 7. 📢 Upcoming Sessions & Unified Announcements (`announcements.js`)
- Centralized stream replacing fragmented WhatsApp groups and physical notice boards.
- Categories:
  - 🚨 *Urgent Room Changes & Alerts*
  - 📚 *Remedial & Extra Doubt-Clearing Classes*
  - 🎤 *Distinguished Industry Keynotes & Tech Talks (e.g., Google DeepMind)*
  - 📅 *Examination Cell Hall Tickets & IA Schedules*
  - 🚀 *Smart India Hackathon & Co-Curricular Nominations*
- **"Add to Google Calendar / Outlook"** instant synchronization.

---

## 👥 Multi-Role Tailored Dashboards (`roleDashboards.js`)

Campus360 provides tailored command centers for all university stakeholders:

| Role | Core Capabilities |
| :--- | :--- |
| **🎓 Student** | Flagship command center, hourly timetable, room change alerts, attendance radar, pending project countdowns, and quick actions. |
| **🛡️ Administrator** | Institutional metrics (4,250 students, 215 faculty), facility booking approvals, emergency broadcast dispatcher, system telemetry. |
| **👨‍🏫 Staff / Faculty** | Teaching schedule, classroom period topic logger, biometric attendance rosters, student project grading, emergency room relocation trigger. |
| **🏛️ HOD (Head of Dept)** | Curriculum coverage index, faculty logging compliance (96.8%), attendance defaulter radar (<75%), 1-click SMS/email dispatch to parents. |
| **👨‍👩‍👦 Parent / Guardian** | Real-time ward attendance monitor, latest SGPA/CGPA card, *"What Did My Child Learn Today?"* period log mirror, fees payment receipts, mentor direct messaging. |

---

## 🛠️ Specialized Service Dashboards

- **Leave & On-Duty (OD) Clearance (`leaves.js`)**:
  - Request Medical Leave, Hackathon OD, Casual Leave, or Hostel Gate Passes.
  - Multi-tier visual timeline: Applied ➔ Mentor Endorsed ➔ HOD Approved ➔ Gate Pass Issued.
  - Printable official pass with gate clearance authorization.
- **Campus Helpdesk & Grievance Redressal (`supportContact.js`)**:
  - Log tickets for Classroom Infrastructure, WiFi/AP coverage, Hostel, or Mess Dining.
  - Real-time SLA tracking and administrator resolution notes.
- **Campus Directory & 24x7 Emergency SOS (`supportContact.js`)**:
  - Emergency SOS direct dials (Security Gate, Health Center Ambulance, Women Safety, Anti-Ragging).
  - Searchable faculty and dean directory with cabin locations, consultation hours, and emails.

---

## 🧩 Modular Extensibility Hub ("+ Add Future Dashboard") (`extensibility.js`)

Campus360 answers the requirement to provide space for further dashboards:
- **Pre-Reserved Micro-Dashboards**:
  1. 🚌 *Smart Transit & Campus Shuttle GPS Tracker*
  2. 🍲 *Hostel Dining & Mess Nutrition Tracker (with automated leave food rebate)*
  3. 💼 *Corporate Placement & Internship Accelerator (with ATS resume scoring)*
  4. 📚 *Digital Library & IEEE Resource Vault (with RFID borrowing & remote proxy)*
  5. 🤝 *Alumni Mentorship Network (15,000+ mentors)*
- **"+ Add Custom Dashboard" Interactive Creator**:
  - Admins and developers can dynamically deploy new dashboards specifying name, icon, role access permissions, and data layouts without restarting the server.

---

## 🖥️ How to Run & Test

### Option 1: Standalone (Double Click)
Open `index.html` directly in any modern web browser (Chrome, Edge, Firefox, Safari). All assets and mock databases run client-side with full persistence via `localStorage`.

### Option 2: Local HTTP Server (Recommended)
Run the bundled zero-dependency Node.js server:
```bash
node server.js
```
Open **`http://localhost:3000`** in your browser.

---

## ⚡ Quick 1-Click Demo Testing Guide
In the top header, use the role switcher pills:
- Click **🎓 Student** to test the Student Command Center.
- Click **👨‍🏫 Staff** to submit a period log or trigger a room change.
- Click **🏛️ HOD** to view department compliance and notify attendance defaulters.
- Click **🛡️ Admin** to approve lab bookings and broadcast notices.
- Click **👨‍👩‍👦 Parent** to monitor ward attendance and view today's class topics.
- Press **`Ctrl + K`** anywhere to test the global search across all campus assets!

