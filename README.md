# Campus360 — Educational Institution Management Information System (IMS)

An evision project implementing an enterprise-grade, interactive Proof of Concept based on architectural designs, student module specifications, and entity-relationship models published across three IEEE research papers:

1. **IEEE 10058674**: *"Institution Management System: Student Module"*
2. **IEEE 10516390**: *"Educational Institution Management Information System"*
3. **IEEE 7384005**: *"College Student Management System Design Using Computer Aided System"*

---

## 🏛️ IEEE Research Paper Architectural Mapping

| IEEE Publication | Core Contribution in Paper | Realization in this PoC |
| :--- | :--- | :--- |
| **IEEE 10058674** | **Student Module & Record Consolidation**: Eliminates record redundancy. Integrates admission details, transfer details, promotion history, course evaluations, corporate placement training, events attended, and student research works/publications. | Full **Student Dossier Modal**, **Promotion Progress Engine**, **Placement & Internship Directorate**, and **Research & Capstone Showcase** with real-time editing and state persistence. |
| **IEEE 10516390** | **Central Management Information System (MIS)**: Built using web technologies (PHP/JS/CSS). Centralizes multi-user data (administrators, instructors, students) to reduce administrative overhead and improve communication. | **Multi-Role Portal Switcher** (`Admin`, `Faculty`, `Student`), **Institutional Notice Board & Broadcast Hub**, and interactive KPI metrics for institutional governance. |
| **IEEE 7384005** | **4-Tier Computer-Aided System & ER Model**: Hierarchical separation into (1) Web Display Layer, (2) Business Logic Layer, (3) Data Access Layer, (4) Database Layer. Relational ER model connecting Students, Teachers, Departments, Majors, Classes, Courses, and Comprehensive Scores. | Strict modular 4-tier JavaScript implementation (`app.js`), interactive **4-Tier Architecture Viewer**, and a visual **ER Schema Explorer** with PK/FK definitions. |

---

## 🏗️ 4-Tier System Architecture (IEEE 7384005)

```mermaid
graph TD
    subgraph Tier 1: Web Display Layer
        A1[Admin Management Portal]
        A2[Faculty Grade & Supervision Portal]
        A3[Student Self-Service Portal]
    end

    subgraph Tier 2: Business Logic Layer
        B1[Comprehensive GPA Calculator]
        B2[Semester Promotion Engine]
        B3[Placement Eligibility Auditor]
        B4[Role-Based Access Controller]
    end

    subgraph Tier 3: Data Access Layer (DAL)
        C1[Student Repository]
        C2[Schema Relational Mapper]
        C3[JSON Export / Restore Engine]
    end

    subgraph Tier 4: Database Layer
        D1[(Central Normalized Schema)]
        D2[(Audit & Promotion Logs)]
        D3[(Notice & Communication DB)]
    end

    Tier 1 --> Tier 2
    Tier 2 --> Tier 3
    Tier 3 --> Tier 4
```

---

## 🧩 Comprehensive Entity-Relationship (ER) Schema

The data model follows the ER diagram specified in **IEEE 7384005**:

- `STUDENT_INFO`: `(PK: id, rollNo, name, email, FK: deptId, FK: majorId, FK: classId, cgpa, totalCreditsEarned, academicStatus, promotionStatus)`
- `TEACHER_INFO`: `(PK: id, name, department, title, email)`
- `DEPARTMENT_INFO`: `(PK: id, code, name, head)`
- `MAJOR_INFO`: `(PK: id, FK: deptId, name, degree)`
- `CLASS_INFO`: `(PK: id, name, currentSemester, FK: counselorId)`
- `COURSE_INFO`: `(PK: id, code, name, credits, type, dept, FK: instructorId)`
- `COMPREHENSIVE_SCORE`: `(Internal [30] + Assignments [20] + Final Exam [50] = Total Score [100] ➔ Grade Point & Letter Grade)`
- `PLACEMENT_INFO`: `(company, role, ctc, offerDate, status)`
- `RESEARCH_AND_PROJECTS`: `(title, type, venue, guide, status)`

---

## ⚡ Key Features

1. **Role-Based Simulation**:
   - **Administrator**: Full CRUD on student records, instant semester promotion, and campus-wide notice publishing.
   - **Faculty**: Grade entry interface with automatic weighted GPA calculation.
   - **Student**: View enrolled modules, comprehensive breakdown, internships, and transcript history.
2. **Dynamic Search & Multi-Predicate Filtering**:
   - Instant live search across names, roll numbers, and emails.
   - Filter by academic department and placement/academic status.
3. **Comprehensive Score Engine**:
   - Calculates letter grades (`O`, `A+`, `A`, `B+`, `B`, `C`, `F`) and GPAs dynamically.
4. **Placement Directorate & Eligibility Audit**:
   - Automates candidate shortlisting based on CGPA thresholds and zero-backlog checks.
5. **Zero-Dependency Architecture**:
   - Pure HTML5, modern vanilla CSS, and vanilla JavaScript.
   - Persistent `localStorage` database with one-click JSON export and reset to seed data.

---

## 🚀 Running the PoC Locally

### Option A: Using the Built-in Zero-Dependency Node.js Server
```bash
node server.js
```
Then navigate to: **`http://localhost:3000`**

### Option B: Direct Browser Launch
Open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari).
