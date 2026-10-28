/**
 * Educational Institution Management Information System (IMS) - Application Controller
 * Realizing the 4-Tier Architecture from IEEE 7384005:
 *   [1] Web Display Layer
 *   [2] Business Logic Layer
 *   [3] Data Access Layer
 *   [4] Database Layer
 * Incorporating features from IEEE 10058674 (Student Module) & IEEE 10516390 (IMS Web Platform)
 */

// ============================================================================
// [LAYER 4 & 3] DATA ACCESS LAYER (DAL) & STORAGE
// ============================================================================
class DataAccessLayer {
  constructor() {
    this.STORAGE_KEY = 'IMS_EDUCATIONAL_SYSTEM_DATA_V1';
    this.state = this.loadState();
  }

  loadState() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch (e) {
      console.warn('Storage read fallback:', e);
    }
    // Deep clone initial data
    if (typeof IMS_INITIAL_DATA !== 'undefined') {
      return JSON.parse(JSON.stringify(IMS_INITIAL_DATA));
    }
    return { departments: [], majors: [], classes: [], teachers: [], courses: [], students: [], announcements: [] };
  }

  saveState() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch (e) {
      console.error('Storage write error:', e);
    }
  }

  resetToDefaults() {
    this.state = JSON.parse(JSON.stringify(IMS_INITIAL_DATA));
    this.saveState();
  }

  // Entities CRUD
  getStudents() {
    return this.state.students;
  }

  getStudentById(id) {
    return this.state.students.find(s => s.id === id);
  }

  createStudent(studentData) {
    studentData.id = 'stu-' + Date.now().toString().slice(-6);
    this.state.students.unshift(studentData);
    this.saveState();
    return studentData;
  }

  updateStudent(id, studentData) {
    const idx = this.state.students.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.state.students[idx] = { ...this.state.students[idx], ...studentData, id };
      this.saveState();
      return this.state.students[idx];
    }
    return null;
  }

  deleteStudent(id) {
    const idx = this.state.students.findIndex(s => s.id === id);
    if (idx !== -1) {
      const removed = this.state.students.splice(idx, 1)[0];
      this.saveState();
      return removed;
    }
    return null;
  }

  getDepartments() { return this.state.departments; }
  getMajors() { return this.state.majors; }
  getClasses() { return this.state.classes; }
  getCourses() { return this.state.courses; }
  getTeachers() { return this.state.teachers; }
  getAnnouncements() { return this.state.announcements; }

  addAnnouncement(announcement) {
    announcement.id = 'ann-' + Date.now().toString().slice(-4);
    this.state.announcements.unshift(announcement);
    this.saveState();
    return announcement;
  }
}

// ============================================================================
// [LAYER 2] BUSINESS LOGIC LAYER (BLL)
// ============================================================================
class BusinessLogicLayer {
  constructor(dal) {
    this.dal = dal;
  }

  // Calculate Grade Letter and GPA from total score (IEEE 7384005 Comprehensive Score)
  calculateGradeFromTotal(total) {
    if (total >= 90) return { grade: 'O', gpa: 10.0 };
    if (total >= 80) return { grade: 'A+', gpa: 9.0 };
    if (total >= 70) return { grade: 'A', gpa: 8.0 };
    if (total >= 60) return { grade: 'B+', gpa: 7.0 };
    if (total >= 50) return { grade: 'B', gpa: 6.0 };
    if (total >= 40) return { grade: 'C', gpa: 5.0 };
    return { grade: 'F', gpa: 0.0 };
  }

  // Compute student cumulative CGPA dynamically from course scores
  computeStudentCGPA(student) {
    if (!student.scores || student.scores.length === 0) return student.cgpa || 0.0;
    const totalGpa = student.scores.reduce((acc, curr) => acc + (curr.gpa || 0), 0);
    const computed = (totalGpa / student.scores.length).toFixed(2);
    return parseFloat(computed);
  }

  // Verify campus placement eligibility (IEEE 10058674 Placement criteria)
  checkPlacementEligibility(student) {
    const cgpa = student.cgpa || 0;
    const hasBacklog = (student.scores || []).some(s => s.grade === 'F');
    if (cgpa >= 7.5 && !hasBacklog) {
      return { eligible: true, statusText: 'Eligible for Tier-1 Companies' };
    } else if (cgpa >= 6.0 && !hasBacklog) {
      return { eligible: true, statusText: 'Eligible for General Drives' };
    }
    return { eligible: false, statusText: 'Remediation Required (CGPA < 6.0 or Backlog)' };
  }

  // Process academic progression / student promotion (IEEE 10058674 Student Module)
  promoteStudentSemester(studentId) {
    const student = this.dal.getStudentById(studentId);
    if (!student) return { success: false, message: 'Student not found.' };

    if (student.currentSemester >= 8) {
      student.academicStatus = 'Graduated / Degree Awarded';
      student.promotionStatus = 'Degree Conferred (Class of ' + (student.admissionYear + 4) + ')';
    } else {
      student.currentSemester += 1;
      student.promotionStatus = `Successfully Promoted to Semester ${student.currentSemester}`;
      student.totalCreditsEarned = (student.totalCreditsEarned || 0) + 24;
    }
    this.dal.saveState();
    return { success: true, student, message: `Student promoted to Semester ${student.currentSemester}!` };
  }

  // Compute institutional summary statistics
  getInstitutionalMetrics() {
    const students = this.dal.getStudents();
    const total = students.length;
    if (total === 0) {
      return { total: 0, avgCgpa: '0.00', placedCount: 0, placementRate: '0%', publicationsCount: 0 };
    }

    const totalCgpa = students.reduce((acc, s) => acc + (s.cgpa || 0), 0);
    const avgCgpa = (totalCgpa / total).toFixed(2);
    const placedCount = students.filter(s => s.placement && s.placement.status === 'Placed').length;
    const placementRate = Math.round((placedCount / total) * 100) + '%';
    
    let publicationsCount = 0;
    students.forEach(s => {
      if (s.projectsAndPublications) {
        publicationsCount += s.projectsAndPublications.length;
      }
    });

    return {
      total,
      avgCgpa,
      placedCount,
      placementRate,
      publicationsCount
    };
  }

  // Filter students by search term, department, and academic status
  filterStudents(searchTerm = '', deptId = 'all', status = 'all') {
    let list = this.dal.getStudents();

    if (deptId !== 'all') {
      list = list.filter(s => s.deptId === deptId);
    }

    if (status !== 'all') {
      if (status === 'Placed') {
        list = list.filter(s => s.placement && s.placement.status === 'Placed');
      } else if (status === 'Eligible') {
        list = list.filter(s => s.placement && (s.placement.status === 'Eligible' || s.placement.status === 'Placed'));
      } else {
        list = list.filter(s => s.academicStatus === status);
      }
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.rollNo && s.rollNo.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
    }

    return list;
  }
}

// ============================================================================
// [LAYER 1] WEB DISPLAY LAYER & UI CONTROLLER
// ============================================================================
class InstitutionManagementApp {
  constructor() {
    this.dal = new DataAccessLayer();
    this.bll = new BusinessLogicLayer(this.dal);

    // Current session state
    this.currentRole = 'admin'; // 'admin' | 'faculty' | 'student'
    this.activeTab = 'directory'; // 'directory' | 'academics' | 'placements' | 'research' | 'architecture' | 'communications'
    this.selectedStudentForDetail = null;

    this.initDOMReferences();
    this.bindEvents();
    this.render();
  }

  initDOMReferences() {
    // Header & Role switchers
    this.roleButtons = document.querySelectorAll('.role-btn');
    this.tabButtons = document.querySelectorAll('.tab-nav-btn');
    this.activeRoleBadge = document.getElementById('active-role-badge');

    // Metrics elements
    this.metricTotalStudents = document.getElementById('metric-total-students');
    this.metricAvgCgpa = document.getElementById('metric-avg-cgpa');
    this.metricPlacementRate = document.getElementById('metric-placement-rate');
    this.metricPublications = document.getElementById('metric-publications');

    // Content container & views
    this.mainContent = document.getElementById('main-content');

    // Modals
    this.modalOverlay = document.getElementById('modal-overlay');
    this.modalTitle = document.getElementById('modal-title');
    this.modalBody = document.getElementById('modal-body');
    this.modalFooter = document.getElementById('modal-footer');
    this.modalCloseBtn = document.getElementById('modal-close-btn');

    // Quick Action Buttons
    this.btnNewStudent = document.getElementById('btn-new-student');
    this.btnExportData = document.getElementById('btn-export-data');
    this.btnResetData = document.getElementById('btn-reset-data');
  }

  bindEvents() {
    // Role switcher clicks
    this.roleButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const role = e.currentTarget.dataset.role;
        this.setRole(role);
      });
    });

    // Tab navigation clicks
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.setActiveTab(tab);
      });
    });

    // Close modal
    this.modalCloseBtn.addEventListener('click', () => this.closeModal());
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) this.closeModal();
    });

    // Action buttons
    if (this.btnNewStudent) {
      this.btnNewStudent.addEventListener('click', () => this.openAddStudentModal());
    }
    if (this.btnExportData) {
      this.btnExportData.addEventListener('click', () => this.exportDatabaseJSON());
    }
    if (this.btnResetData) {
      this.btnResetData.addEventListener('click', () => {
        if (confirm('Reset institutional database to original IEEE seed records?')) {
          this.dal.resetToDefaults();
          this.showToast('Database reset to IEEE sample dataset', 'info');
          this.render();
        }
      });
    }
  }

  setRole(role) {
    this.currentRole = role;
    this.roleButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.role === role);
    });
    if (this.activeRoleBadge) {
      this.activeRoleBadge.textContent = role.toUpperCase();
    }
    this.showToast(`Switched workspace role to ${role.toUpperCase()}`, 'info');
    this.render();
  }

  setActiveTab(tab) {
    this.activeTab = tab;
    this.tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    this.render();
  }

  render() {
    this.renderMetrics();

    switch (this.activeTab) {
      case 'directory':
        this.renderStudentDirectoryView();
        break;
      case 'academics':
        this.renderAcademicsView();
        break;
      case 'placements':
        this.renderPlacementsView();
        break;
      case 'research':
        this.renderResearchView();
        break;
      case 'architecture':
        this.renderArchitectureView();
        break;
      case 'communications':
        this.renderCommunicationsView();
        break;
      default:
        this.renderStudentDirectoryView();
    }
  }

  renderMetrics() {
    const metrics = this.bll.getInstitutionalMetrics();
    if (this.metricTotalStudents) this.metricTotalStudents.textContent = metrics.total;
    if (this.metricAvgCgpa) this.metricAvgCgpa.textContent = metrics.avgCgpa;
    if (this.metricPlacementRate) this.metricPlacementRate.textContent = metrics.placementRate;
    if (this.metricPublications) this.metricPublications.textContent = metrics.publicationsCount;
  }

  // ==========================================================================
  // VIEW: STUDENT DIRECTORY (IEEE 10058674 & 10516390)
  // ==========================================================================
  renderStudentDirectoryView() {
    const depts = this.dal.getDepartments();
    const students = this.bll.filterStudents();

    this.mainContent.innerHTML = `
      <div class="glass-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <h2>
              <span>Student Module Master Records</span>
              <span class="badge badge-cyan" id="filtered-count-badge">${students.length} Records</span>
            </h2>
            <p>Comprehensive student information, academic credentials, promotion status, and institutional records.</p>
          </div>
          <div class="toolbar-controls">
            <div class="search-input-wrapper">
              <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="student-search-input" placeholder="Search by name, roll no, email..." />
            </div>

            <select id="filter-dept-select" class="select-filter">
              <option value="all">All Departments</option>
              ${depts.map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join('')}
            </select>

            <select id="filter-status-select" class="select-filter">
              <option value="all">All Statuses</option>
              <option value="Regular">Regular</option>
              <option value="Graduating Senior">Graduating Senior</option>
              <option value="Placed">Placed Candidates</option>
              <option value="Eligible">Eligible for Placements</option>
            </select>

            ${this.currentRole === 'admin' ? `
              <button class="btn-quick btn-primary" id="btn-add-student-inline">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Enroll New Student
              </button>
            ` : ''}
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student Dossier</th>
                <th>Department & Major</th>
                <th>Semester / Batch</th>
                <th>CGPA & Credits</th>
                <th>Placement Status</th>
                <th>Promotion Progress</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="student-table-body">
              ${this.buildStudentTableRows(students)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Hook search & filter inputs
    const searchInput = document.getElementById('student-search-input');
    const deptSelect = document.getElementById('filter-dept-select');
    const statusSelect = document.getElementById('filter-status-select');
    const tableBody = document.getElementById('student-table-body');
    const countBadge = document.getElementById('filtered-count-badge');

    const updateFilterResults = () => {
      const q = searchInput.value;
      const dept = deptSelect.value;
      const st = statusSelect.value;
      const filtered = this.bll.filterStudents(q, dept, st);
      tableBody.innerHTML = this.buildStudentTableRows(filtered);
      countBadge.textContent = `${filtered.length} Records`;
      this.attachTableRowEventListeners();
    };

    searchInput.addEventListener('input', updateFilterResults);
    deptSelect.addEventListener('change', updateFilterResults);
    statusSelect.addEventListener('change', updateFilterResults);

    const inlineAdd = document.getElementById('btn-add-student-inline');
    if (inlineAdd) {
      inlineAdd.addEventListener('click', () => this.openAddStudentModal());
    }

    this.attachTableRowEventListeners();
  }

  buildStudentTableRows(students) {
    if (students.length === 0) {
      return `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No student records matching your query criteria.
          </td>
        </tr>
      `;
    }

    const depts = this.dal.getDepartments();
    const majors = this.dal.getMajors();

    return students.map(s => {
      const dept = depts.find(d => d.id === s.deptId);
      const major = majors.find(m => m.id === s.majorId);
      const deptCode = dept ? dept.code : 'UNASSIGNED';
      const majorName = major ? major.name : 'General';
      const initials = s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

      let cgpaClass = 'high';
      if (s.cgpa < 8.0) cgpaClass = 'med';
      if (s.cgpa < 7.0) cgpaClass = 'low';

      let placementBadge = '<span class="badge badge-amber">Unassigned</span>';
      if (s.placement) {
        if (s.placement.status === 'Placed') {
          placementBadge = `<span class="badge badge-emerald">Placed • ${s.placement.company}</span>`;
        } else if (s.placement.status === 'Interviewing') {
          placementBadge = `<span class="badge badge-purple">Interviewing • ${s.placement.company}</span>`;
        } else if (s.placement.status === 'Eligible') {
          placementBadge = `<span class="badge badge-cyan">Eligible Candidate</span>`;
        }
      }

      return `
        <tr data-student-id="${s.id}">
          <td>
            <div class="student-identity">
              <div class="student-avatar">${initials}</div>
              <div>
                <div class="student-name">${s.name}</div>
                <div class="student-roll">${s.rollNo} • ${s.email}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge badge-cyan">${deptCode}</span>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">${majorName}</div>
          </td>
          <td>
            <span style="font-weight: 600;">Sem ${s.currentSemester}</span>
            <div style="font-size: 0.725rem; color: var(--text-dim);">Adm: ${s.admissionYear}</div>
          </td>
          <td>
            <div class="cgpa-indicator">
              <span class="cgpa-pill ${cgpaClass}">${s.cgpa.toFixed(2)}</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${s.totalCreditsEarned} Credits</span>
            </div>
          </td>
          <td>${placementBadge}</td>
          <td>
            <div style="font-size: 0.8rem; font-weight: 600; color: #38bdf8;">${s.promotionStatus || 'Active'}</div>
            <div style="font-size: 0.7rem; color: var(--text-dim);">${s.academicStatus}</div>
          </td>
          <td style="text-align: right;">
            <div class="action-btn-group" style="justify-content: flex-end;">
              <button class="action-icon-btn btn-view-dossier" title="View Detailed Student Dossier" data-id="${s.id}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>

              ${this.currentRole !== 'student' ? `
                <button class="action-icon-btn btn-edit-student" title="Edit Student Profile" data-id="${s.id}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              ` : ''}

              ${this.currentRole === 'admin' ? `
                <button class="action-icon-btn btn-promote-student" title="Promote Student to Next Semester" data-id="${s.id}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </button>
                <button class="action-icon-btn delete btn-delete-student" title="Purge Record" data-id="${s.id}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  attachTableRowEventListeners() {
    // Dossier view
    document.querySelectorAll('.btn-view-dossier').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.openStudentDossierModal(id);
      });
    });

    // Edit modal
    document.querySelectorAll('.btn-edit-student').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.openEditStudentModal(id);
      });
    });

    // Promote action
    document.querySelectorAll('.btn-promote-student').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const res = this.bll.promoteStudentSemester(id);
        if (res.success) {
          this.showToast(res.message, 'success');
          this.render();
        }
      });
    });

    // Delete record
    document.querySelectorAll('.btn-delete-student').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const student = this.dal.getStudentById(id);
        if (confirm(`Are you sure you want to delete student "${student.name}" (${student.rollNo})?`)) {
          this.dal.deleteStudent(id);
          this.showToast(`Deleted student record for ${student.name}`, 'info');
          this.render();
        }
      });
    });
  }

  // ==========================================================================
  // VIEW: ACADEMICS & COMPREHENSIVE SCORES (IEEE 7384005)
  // ==========================================================================
  renderAcademicsView() {
    const students = this.dal.getStudents();
    const courses = this.dal.getCourses();

    this.mainContent.innerHTML = `
      <div class="glass-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <h2>
              <span>Comprehensive Score & Grade Management</span>
              <span class="badge badge-emerald">Tier-2 BLL Active</span>
            </h2>
            <p>Based on IEEE 7384005: 4-Component Score Formula (Internal Assessment + Assignments + Semester Exam = Total Grade Point).</p>
          </div>
          ${this.currentRole === 'faculty' || this.currentRole === 'admin' ? `
            <button class="btn-quick btn-primary" id="btn-grade-entry-trigger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              Faculty Grade Entry
            </button>
          ` : ''}
        </div>

        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-header">
              <span>Grade Distribution Overview</span>
              <span class="badge badge-cyan">Institutional Cohort</span>
            </div>
            <div class="bar-chart-container">
              <div class="bar-row">
                <div class="bar-row-header">
                  <span>Grade O (Outstanding 90-100)</span>
                  <span style="font-weight: 700; color: #34d399;">52%</span>
                </div>
                <div class="bar-track"><div class="bar-fill" style="width: 52%; background: #10b981;"></div></div>
              </div>
              <div class="bar-row">
                <div class="bar-row-header">
                  <span>Grade A+ (Excellent 80-89)</span>
                  <span style="font-weight: 700; color: #38bdf8;">34%</span>
                </div>
                <div class="bar-track"><div class="bar-fill" style="width: 34%; background: #06b6d4;"></div></div>
              </div>
              <div class="bar-row">
                <div class="bar-row-header">
                  <span>Grade A (Very Good 70-79)</span>
                  <span style="font-weight: 700; color: #818cf8;">11%</span>
                </div>
                <div class="bar-track"><div class="bar-fill" style="width: 11%; background: #6366f1;"></div></div>
              </div>
              <div class="bar-row">
                <div class="bar-row-header">
                  <span>Grade B+ / Below (Remedial)</span>
                  <span style="font-weight: 700; color: #fbbf24;">3%</span>
                </div>
                <div class="bar-track"><div class="bar-fill" style="width: 3%; background: #f59e0b;"></div></div>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <span>Active Curriculum Courses</span>
              <span class="badge badge-purple">${courses.length} Modules</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.6rem;">
              ${courses.map(c => `
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: 0.825rem; font-weight: 600;">${c.code}: ${c.name}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${c.type} • ${c.credits} Credits</div>
                  </div>
                  <span class="badge badge-cyan">${c.dept}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="table-responsive" style="margin-top: 1.5rem;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course Evaluation</th>
                <th>Internal (30)</th>
                <th>Assignments (20)</th>
                <th>Final Exam (50)</th>
                <th>Total (100)</th>
                <th>Grade Letter</th>
                <th>Grade Point</th>
              </tr>
            </thead>
            <tbody>
              ${students.flatMap(s => (s.scores || []).map(score => `
                <tr>
                  <td>
                    <div style="font-weight: 600;">${s.name}</div>
                    <div style="font-size: 0.725rem; color: var(--text-muted);">${s.rollNo}</div>
                  </td>
                  <td>
                    <span class="badge badge-purple">${score.courseCode}</span>
                    <span style="font-size: 0.8rem; margin-left: 0.3rem;">${score.courseName}</span>
                  </td>
                  <td>${score.internal} / 30</td>
                  <td>${score.assignments} / 20</td>
                  <td>${score.exam} / 50</td>
                  <td style="font-weight: 700; color: #fff;">${score.total}</td>
                  <td><span class="badge badge-emerald">${score.grade}</span></td>
                  <td><span class="cgpa-pill high">${(score.gpa || 0).toFixed(1)}</span></td>
                </tr>
              `)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const gradeTrigger = document.getElementById('btn-grade-entry-trigger');
    if (gradeTrigger) {
      gradeTrigger.addEventListener('click', () => this.openFacultyGradeModal());
    }
  }

  // ==========================================================================
  // VIEW: PLACEMENT & INTERNSHIP DIRECTORATE (IEEE 10058674)
  // ==========================================================================
  renderPlacementsView() {
    const students = this.dal.getStudents();
    const placedStudents = students.filter(s => s.placement && s.placement.status === 'Placed');

    this.mainContent.innerHTML = `
      <div class="glass-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <h2>
              <span>Corporate Placement & Internship Directorate</span>
              <span class="badge badge-emerald">Campus Drive 2025-2026</span>
            </h2>
            <p>From IEEE 10058674: Student placement training records, interviews, offers, and compensation CTC tracking.</p>
          </div>
          <button class="btn-quick btn-primary" id="btn-check-eligibility">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            Run Eligibility Audit
          </button>
        </div>

        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-header">
              <span>Top Recruiting Partners</span>
              <span class="badge badge-emerald">Tier-1 Marquee</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                <div>
                  <div style="font-weight: 700; color: #fff;">NVIDIA AI Labs</div>
                  <div style="font-size: 0.725rem; color: var(--text-muted);">Systems Software & Parallel Computing</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-weight: 700; color: #34d399;">32.5 LPA</div>
                  <span class="badge badge-emerald">1 Offer</span>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                <div>
                  <div style="font-weight: 700; color: #fff;">Google DeepMind</div>
                  <div style="font-size: 0.725rem; color: var(--text-muted);">Research Associate Internship</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-weight: 700; color: #38bdf8;">38.0 LPA</div>
                  <span class="badge badge-cyan">1 Offer</span>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                <div>
                  <div style="font-weight: 700; color: #fff;">Microsoft Azure Core</div>
                  <div style="font-size: 0.725rem; color: var(--text-muted);">Cloud Infrastructure Engineering</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-weight: 700; color: #818cf8;">28.0 LPA</div>
                  <span class="badge badge-purple">1 Offer</span>
                </div>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <span>Placement Status Ratio</span>
              <span class="badge badge-cyan">Active Batch</span>
            </div>
            <div class="bar-chart-container">
              <div class="bar-row">
                <div class="bar-row-header">
                  <span>Placed Candidates</span>
                  <span style="font-weight: 700; color: #34d399;">60%</span>
                </div>
                <div class="bar-track"><div class="bar-fill" style="width: 60%; background: #10b981;"></div></div>
              </div>
              <div class="bar-row">
                <div class="bar-row-header">
                  <span>Final Round Interviewing</span>
                  <span style="font-weight: 700; color: #38bdf8;">20%</span>
                </div>
                <div class="bar-track"><div class="bar-fill" style="width: 20%; background: #06b6d4;"></div></div>
              </div>
              <div class="bar-row">
                <div class="bar-row-header">
                  <span>Eligible for Upcoming Drives</span>
                  <span style="font-weight: 700; color: #fbbf24;">20%</span>
                </div>
                <div class="bar-track"><div class="bar-fill" style="width: 20%; background: #f59e0b;"></div></div>
              </div>
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Roll No</th>
                <th>CGPA</th>
                <th>Company</th>
                <th>Role Designation</th>
                <th>Compensation (CTC)</th>
                <th>Offer Date</th>
                <th>Eligibility Check</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => {
                const p = s.placement || { status: 'Not registered', company: '—', role: '—', ctc: '—', offerDate: '—' };
                const elig = this.bll.checkPlacementEligibility(s);
                return `
                  <tr>
                    <td style="font-weight: 600;">${s.name}</td>
                    <td style="font-family: var(--font-mono); font-size: 0.75rem;">${s.rollNo}</td>
                    <td><span class="cgpa-pill ${s.cgpa >= 8.5 ? 'high' : 'med'}">${s.cgpa.toFixed(2)}</span></td>
                    <td style="font-weight: 600; color: #38bdf8;">${p.company}</td>
                    <td>${p.role}</td>
                    <td style="font-weight: 700; color: #34d399;">${p.ctc}</td>
                    <td style="font-size: 0.75rem; color: var(--text-muted);">${p.offerDate}</td>
                    <td>
                      <span class="badge ${elig.eligible ? 'badge-emerald' : 'badge-amber'}">
                        ${elig.statusText}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const auditBtn = document.getElementById('btn-check-eligibility');
    if (auditBtn) {
      auditBtn.addEventListener('click', () => {
        const eligibleCount = students.filter(s => this.bll.checkPlacementEligibility(s).eligible).length;
        this.showToast(`Eligibility Audit Complete: ${eligibleCount} of ${students.length} students satisfy Tier-1 criteria!`, 'success');
      });
    }
  }

  // ==========================================================================
  // VIEW: RESEARCH, CAPSTONES & EVENTS (IEEE 10058674)
  // ==========================================================================
  renderResearchView() {
    const students = this.dal.getStudents();

    this.mainContent.innerHTML = `
      <div class="glass-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <h2>
              <span>Research, Publications & Student Capstones</span>
              <span class="badge badge-purple">Academic Output</span>
            </h2>
            <p>From IEEE 10058674: Module for tracking student publishing papers/journals, patent applications, project guides, and symposiums.</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.25rem;">
          ${students.flatMap(s => (s.projectsAndPublications || []).map(p => `
            <div class="item-chip">
              <div class="chip-head">
                <span class="badge ${p.type.includes('Paper') ? 'badge-cyan' : 'badge-emerald'}">${p.type}</span>
                <span style="font-size: 0.725rem; color: var(--text-muted);">${s.name} (${s.rollNo})</span>
              </div>
              <div class="chip-title" style="margin: 0.5rem 0;">${p.title}</div>
              <div class="chip-sub">
                <strong>Target Venue:</strong> ${p.venue}
              </div>
              <div class="chip-sub" style="margin-top: 0.25rem;">
                <strong>Faculty Supervisor:</strong> ${p.guide}
              </div>
            </div>
          `)).join('')}
        </div>

        <h3 style="margin: 2rem 0 1rem; font-size: 1.15rem; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
          <span>Student Training, Competitions & Events Attended</span>
          <span class="badge badge-cyan">IEEE 10058674 Activity Track</span>
        </h3>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Participant Student</th>
                <th>Event / Symposium Name</th>
                <th>Activity Category</th>
                <th>Outcome / Honors Achieved</th>
              </tr>
            </thead>
            <tbody>
              ${students.flatMap(s => (s.events || []).map(e => `
                <tr>
                  <td style="font-weight: 600;">${s.name} (${s.rollNo})</td>
                  <td style="font-weight: 600; color: #fff;">${e.name}</td>
                  <td><span class="badge badge-purple">${e.type}</span></td>
                  <td><span class="badge badge-emerald">${e.outcome}</span></td>
                </tr>
              `)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // VIEW: 4-TIER ARCHITECTURE & ER SCHEMA (IEEE 7384005)
  // ==========================================================================
  renderArchitectureView() {
    this.mainContent.innerHTML = `
      <div class="glass-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <h2>
              <span>Hierarchical 4-Tier Computer-Aided System Architecture</span>
              <span class="badge badge-cyan">IEEE 7384005 Specifications</span>
            </h2>
            <p>Direct architectural mapping of the computer-aided college student management system proposed in IEEE 7384005.</p>
          </div>
        </div>

        <div class="architecture-grid">
          <div class="tier-column active-tier">
            <div class="tier-header">
              <div class="tier-tag">Layer 1</div>
              <div class="tier-title">Web Display Layer</div>
            </div>
            <div class="tier-component-list">
              <div class="tier-box">
                <div class="box-title">Student Portal View <span class="badge badge-cyan">Active</span></div>
                <div class="box-desc">Transcript queries, enrolled courses, placement status, and publication showcase.</div>
              </div>
              <div class="tier-box">
                <div class="box-title">Teacher / Faculty View</div>
                <div class="box-desc">Grade recording, attendance audit, and capstone supervision workflows.</div>
              </div>
              <div class="tier-box">
                <div class="box-title">Manager / Admin View</div>
                <div class="box-desc">Student onboarding, promotion engines, department configuration, and institutional metrics.</div>
              </div>
            </div>
          </div>

          <div class="tier-column">
            <div class="tier-header">
              <div class="tier-tag">Layer 2</div>
              <div class="tier-title">Business Logic Layer</div>
            </div>
            <div class="tier-component-list">
              <div class="tier-box">
                <div class="box-title">Score & GPA Calculator</div>
                <div class="box-desc">4-component evaluation: Internal + Assignments + Final Exam = Comprehensive Grade.</div>
              </div>
              <div class="tier-box">
                <div class="box-title">Promotion Engine</div>
                <div class="box-desc">Automated validation of credits, prerequisites, and semester progression.</div>
              </div>
              <div class="tier-box">
                <div class="box-title">Placement Eligibility</div>
                <div class="box-desc">CGPA thresholds and backlog checks for corporate drive shortlisting.</div>
              </div>
            </div>
          </div>

          <div class="tier-column">
            <div class="tier-header">
              <div class="tier-tag">Layer 3</div>
              <div class="tier-title">Data Access Layer (DAL)</div>
            </div>
            <div class="tier-component-list">
              <div class="tier-box">
                <div class="box-title">Student Repository</div>
                <div class="box-desc">Normalized persistence, multi-predicate filtering, and transactional updates.</div>
              </div>
              <div class="tier-box">
                <div class="box-title">Schema Relational Mapper</div>
                <div class="box-desc">Maintains foreign key integrity across departments, majors, classes, and teachers.</div>
              </div>
              <div class="tier-box">
                <div class="box-title">Data Serialization Engine</div>
                <div class="box-desc">JSON backup/restore, export pipelines, and caching layers.</div>
              </div>
            </div>
          </div>

          <div class="tier-column">
            <div class="tier-header">
              <div class="tier-tag">Layer 4</div>
              <div class="tier-title">Database Layer</div>
            </div>
            <div class="tier-component-list">
              <div class="tier-box">
                <div class="box-title">Central Storage Schema</div>
                <div class="box-desc">Consolidated tables with zero redundancy as highlighted in IEEE 10058674.</div>
              </div>
              <div class="tier-box">
                <div class="box-title">Audit Log Store</div>
                <div class="box-desc">Historical promotion logs, transfer histories, and grade alteration records.</div>
              </div>
              <div class="tier-box">
                <div class="box-title">Communication DB</div>
                <div class="box-desc">Institutional broadcasts and notice boards (IEEE 10516390).</div>
              </div>
            </div>
          </div>
        </div>

        <h3 style="margin: 2.5rem 0 1rem; font-size: 1.15rem; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
          <span>Entity-Relationship (ER) Schema Specifications</span>
          <span class="badge badge-emerald">IEEE 7384005 ER Design</span>
        </h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
          Relational model defining entities, Primary Keys (PK), and Foreign Keys (FK) connecting students, departments, majors, classes, courses, and scores.
        </p>

        <div class="er-container">
          <!-- STUDENT ENTITY -->
          <div class="er-card">
            <div class="er-card-header">
              <span>STUDENT_INFO</span>
              <span class="badge badge-cyan">Entity</span>
            </div>
            <div class="er-card-body">
              <div class="er-field"><span class="er-field-name">id</span><div class="er-field-meta"><span class="pk-tag">PK</span><span class="er-field-type">VARCHAR</span></div></div>
              <div class="er-field"><span class="er-field-name">rollNo</span><div class="er-field-meta"><span class="er-field-type">VARCHAR UNIQUE</span></div></div>
              <div class="er-field"><span class="er-field-name">name</span><div class="er-field-meta"><span class="er-field-type">VARCHAR</span></div></div>
              <div class="er-field"><span class="er-field-name">email</span><div class="er-field-meta"><span class="er-field-type">VARCHAR</span></div></div>
              <div class="er-field"><span class="er-field-name">deptId</span><div class="er-field-meta"><span class="fk-tag">FK &rarr; DEPT</span><span class="er-field-type">VARCHAR</span></div></div>
              <div class="er-field"><span class="er-field-name">majorId</span><div class="er-field-meta"><span class="fk-tag">FK &rarr; MAJOR</span><span class="er-field-type">VARCHAR</span></div></div>
              <div class="er-field"><span class="er-field-name">classId</span><div class="er-field-meta"><span class="fk-tag">FK &rarr; CLASS</span><span class="er-field-type">VARCHAR</span></div></div>
              <div class="er-field"><span class="er-field-name">cgpa</span><div class="er-field-meta"><span class="er-field-type">DECIMAL(4,2)</span></div></div>
              <div class="er-field"><span class="er-field-name">promotionStatus</span><div class="er-field-meta"><span class="er-field-type">VARCHAR</span></div></div>
            </div>
          </div>

          <!-- TEACHER ENTITY -->
          <div class="er-card">
            <div class="er-card-header">
              <span>TEACHER_INFO</span>
              <span class="badge badge-emerald">Entity</span>
            </div>
            <div class="er-card-body">
              <div class="er-field"><span class="er-field-name">id</span><div class="er-field-meta"><span class="pk-tag">PK</span><span class="er-field-type">VARCHAR</span></div></div>
              <div class="er-field"><span class="er-field-name">name</span><div class="er-field-meta"><span class="er-field-type">VARCHAR</span></div></div>
              <div class="er-field"><span class="er-field-name">department</span><div class="er-field-meta"><span class="er-field-type">VARCHAR</span></div></div>
              <div class="er-field"><span class="er-field-name">title</span><div class="er-field-meta"><span class="er-field-type">VARCHAR</span></div></div>
              <div class="er-field"><span class="er-field-name">email</span><div class="er-field-meta"><span class="er-field-type">VARCHAR</span></div></div>
            </div>
          </div>

          <!-- DEPARTMENT & MAJOR ENTITY -->
          <div class="er-card">
            <div class="er-card-header">
              <span>DEPARTMENT & MAJOR</span>
              <span class="badge badge-purple">Entity</span>
            </div>
            <div class="er-card-body">
              <div class="er-field"><span class="er-field-name">id</span><div class="er-field-meta"><span class="pk-tag">PK</span><span class="er-field-type">VARCHAR</span></div></div>
              <div class="er-field"><span class="er-field-name">code</span><div class="er-field-meta"><span class="er-field-type">VARCHAR(10)</span></div></div>
              <div class="er-field"><span class="er-field-name">name</span><div class="er-field-meta"><span class="er-field-type">VARCHAR(100)</span></div></div>
              <div class="er-field"><span class="er-field-name">deptId</span><div class="er-field-meta"><span class="fk-tag">FK &rarr; DEPT</span><span class="er-field-type">VARCHAR</span></div></div>
              <div class="er-field"><span class="er-field-name">degree</span><div class="er-field-meta"><span class="er-field-type">VARCHAR</span></div></div>
            </div>
          </div>

          <!-- COMPREHENSIVE SCORE ENTITY -->
          <div class="er-card">
            <div class="er-card-header">
              <span>COMPREHENSIVE_SCORE</span>
              <span class="badge badge-amber">Entity</span>
            </div>
            <div class="er-card-body">
              <div class="er-field"><span class="er-field-name">scoreId</span><div class="er-field-meta"><span class="pk-tag">PK</span><span class="er-field-type">VARCHAR</span></div></div>
              <div class="er-field"><span class="er-field-name">studentId</span><div class="er-field-meta"><span class="fk-tag">FK &rarr; STUDENT</span><span class="er-field-type">VARCHAR</span></div></div>
              <div class="er-field"><span class="er-field-name">courseCode</span><div class="er-field-meta"><span class="fk-tag">FK &rarr; COURSE</span><span class="er-field-type">VARCHAR</span></div></div>
              <div class="er-field"><span class="er-field-name">internalScore</span><div class="er-field-meta"><span class="er-field-type">INT(30)</span></div></div>
              <div class="er-field"><span class="er-field-name">assignmentScore</span><div class="er-field-meta"><span class="er-field-type">INT(20)</span></div></div>
              <div class="er-field"><span class="er-field-name">examScore</span><div class="er-field-meta"><span class="er-field-type">INT(50)</span></div></div>
              <div class="er-field"><span class="er-field-name">totalScore</span><div class="er-field-meta"><span class="er-field-type">INT(100)</span></div></div>
              <div class="er-field"><span class="er-field-name">gradeLetter</span><div class="er-field-meta"><span class="er-field-type">CHAR(2)</span></div></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // VIEW: INSTITUTIONAL COMMUNICATIONS (IEEE 10516390)
  // ==========================================================================
  renderCommunicationsView() {
    const announcements = this.dal.getAnnouncements();

    this.mainContent.innerHTML = `
      <div class="glass-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <h2>
              <span>Institutional Broadcast & Communication Hub</span>
              <span class="badge badge-cyan">IEEE 10516390 Feature</span>
            </h2>
            <p>Direct communication channel connecting Administrators, Instructors, and Students to streamline institution operations.</p>
          </div>
          ${this.currentRole === 'admin' ? `
            <button class="btn-quick btn-primary" id="btn-post-announcement">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Publish New Notice
            </button>
          ` : ''}
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${announcements.map(a => `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span class="badge ${a.priority === 'High' ? 'badge-rose' : (a.priority === 'Important' ? 'badge-amber' : 'badge-cyan')}">${a.priority} Priority</span>
                  <h3 style="font-size: 1rem; font-weight: 700; color: #fff;">${a.title}</h3>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                  Published: <strong>${a.date}</strong> by <em>${a.author}</em>
                </div>
              </div>
              <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">${a.content}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const postBtn = document.getElementById('btn-post-announcement');
    if (postBtn) {
      postBtn.addEventListener('click', () => this.openPostAnnouncementModal());
    }
  }

  // ==========================================================================
  // MODALS & INTERACTIVE WORKFLOWS
  // ==========================================================================
  openModal(title, bodyHtml, footerHtml) {
    this.modalTitle.textContent = title;
    this.modalBody.innerHTML = bodyHtml;
    this.modalFooter.innerHTML = footerHtml;
    this.modalOverlay.classList.add('active');
  }

  closeModal() {
    this.modalOverlay.classList.remove('active');
  }

  openStudentDossierModal(studentId) {
    const s = this.dal.getStudentById(studentId);
    if (!s) return;

    const dept = this.dal.getDepartments().find(d => d.id === s.deptId);
    const major = this.dal.getMajors().find(m => m.id === s.majorId);
    const cls = this.dal.getClasses().find(c => c.id === s.classId);
    const initials = s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const bodyHtml = `
      <div class="dossier-grid">
        <div class="dossier-sidebar">
          <div class="dossier-avatar-large">${initials}</div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #fff;">${s.name}</h4>
          <span class="badge badge-cyan" style="margin-top: 0.25rem;">${s.rollNo}</span>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.4rem;">${s.email}</div>

          <div class="dossier-info-list">
            <div class="dossier-info-item"><span class="k">Department</span><span class="v">${dept ? dept.name : 'CSE'}</span></div>
            <div class="dossier-info-item"><span class="k">Major Degree</span><span class="v">${major ? major.name : 'B.Tech'}</span></div>
            <div class="dossier-info-item"><span class="k">Cohort / Class</span><span class="v">${cls ? cls.name : 'Alpha'}</span></div>
            <div class="dossier-info-item"><span class="k">Current Sem</span><span class="v">Semester ${s.currentSemester}</span></div>
            <div class="dossier-info-item"><span class="k">Cumulative CGPA</span><span class="v" style="color: #34d399; font-weight: 700;">${s.cgpa.toFixed(2)}</span></div>
            <div class="dossier-info-item"><span class="k">Credits Earned</span><span class="v">${s.totalCreditsEarned} Credits</span></div>
            <div class="dossier-info-item"><span class="k">Admission Year</span><span class="v">${s.admissionYear}</span></div>
          </div>
        </div>

        <div class="dossier-main">
          <!-- Comprehensive Scores -->
          <div class="dossier-section-title">
            <span>Academic Performance & Course Scores</span>
            <span class="badge badge-emerald">IEEE 7384005</span>
          </div>
          <div class="table-responsive" style="margin-bottom: 1.5rem;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Internal</th>
                  <th>Assignments</th>
                  <th>Exam</th>
                  <th>Total</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                ${(s.scores || []).map(score => `
                  <tr>
                    <td><strong>${score.courseCode}</strong>: ${score.courseName}</td>
                    <td>${score.internal}/30</td>
                    <td>${score.assignments}/20</td>
                    <td>${score.exam}/50</td>
                    <td style="font-weight: 700; color: #fff;">${score.total}</td>
                    <td><span class="badge badge-emerald">${score.grade} (${score.gpa})</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Placement Record -->
          <div class="dossier-section-title">
            <span>Corporate Placement & Internship Data</span>
            <span class="badge badge-cyan">IEEE 10058674</span>
          </div>
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
            ${s.placement ? `
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <div style="font-size: 1rem; font-weight: 700; color: #38bdf8;">${s.placement.company}</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">${s.placement.role}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 1.1rem; font-weight: 800; color: #34d399;">${s.placement.ctc}</div>
                  <span class="badge badge-emerald">${s.placement.status}</span>
                </div>
              </div>
            ` : '<div style="color: var(--text-muted); font-size: 0.8rem;">No corporate placement record linked.</div>'}
          </div>

          <!-- Projects & Publications -->
          <div class="dossier-section-title">
            <span>Published Papers & Capstone Projects</span>
            <span class="badge badge-purple">Research Output</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
            ${(s.projectsAndPublications || []).map(p => `
              <div class="item-chip">
                <div class="chip-head">
                  <span class="badge badge-purple">${p.type}</span>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">Guide: ${p.guide}</span>
                </div>
                <div class="chip-title">${p.title}</div>
                <div class="chip-sub">Venue: ${p.venue}</div>
              </div>
            `).join('')}
          </div>

          <!-- Promotion & Transfer History -->
          <div class="dossier-section-title">
            <span>Admission, Transfer & Promotion Audit History</span>
          </div>
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.8rem; color: var(--text-muted);">
            <div><strong>Promotion Status:</strong> ${s.promotionStatus || 'Normal progression'}</div>
            <div style="margin-top: 0.25rem;"><strong>Transfer / Admission Route:</strong> ${s.transferHistory || 'Direct Regular Enrollment'}</div>
          </div>
        </div>
      </div>
    `;

    const footerHtml = `
      <button class="btn-quick" id="btn-modal-close-action">Close Dossier</button>
      ${this.currentRole === 'admin' ? `
        <button class="btn-quick btn-primary" id="btn-modal-promote-direct">Promote to Next Semester</button>
      ` : ''}
    `;

    this.openModal(`Official Dossier: ${s.name} (${s.rollNo})`, bodyHtml, footerHtml);

    document.getElementById('btn-modal-close-action').addEventListener('click', () => this.closeModal());
    const promoteDirect = document.getElementById('btn-modal-promote-direct');
    if (promoteDirect) {
      promoteDirect.addEventListener('click', () => {
        const res = this.bll.promoteStudentSemester(s.id);
        if (res.success) {
          this.showToast(res.message, 'success');
          this.closeModal();
          this.render();
        }
      });
    }
  }

  openAddStudentModal() {
    const depts = this.dal.getDepartments();
    const majors = this.dal.getMajors();
    const classes = this.dal.getClasses();

    const bodyHtml = `
      <form id="add-student-form" class="form-grid">
        <div class="form-group">
          <label class="form-label">Full Student Name *</label>
          <input type="text" class="form-control" name="name" required placeholder="e.g. Samantha Wu" />
        </div>
        <div class="form-group">
          <label class="form-label">Roll Number *</label>
          <input type="text" class="form-control" name="rollNo" required placeholder="e.g. 2024CSE108" />
        </div>
        <div class="form-group">
          <label class="form-label">Official University Email *</label>
          <input type="email" class="form-control" name="email" required placeholder="e.g. s.wu@student.ims.edu" />
        </div>
        <div class="form-group">
          <label class="form-label">Department *</label>
          <select class="form-control" name="deptId" required>
            ${depts.map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Major Degree *</label>
          <select class="form-control" name="majorId" required>
            ${majors.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Cohort / Class Section *</label>
          <select class="form-control" name="classId" required>
            ${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Admission Year</label>
          <input type="number" class="form-control" name="admissionYear" value="2024" />
        </div>
        <div class="form-group">
          <label class="form-label">Current Semester</label>
          <input type="number" class="form-control" name="currentSemester" value="4" min="1" max="8" />
        </div>
        <div class="form-group">
          <label class="form-label">Starting CGPA</label>
          <input type="number" step="0.01" class="form-control" name="cgpa" value="8.50" min="0" max="10" />
        </div>
        <div class="form-group">
          <label class="form-label">Earned Credits</label>
          <input type="number" class="form-control" name="totalCreditsEarned" value="80" />
        </div>
        <div class="form-group col-span-2">
          <label class="form-label">Admission Route / Transfer History</label>
          <input type="text" class="form-control" name="transferHistory" placeholder="Direct Admission via State Entrance Exam" />
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn-quick" id="btn-cancel-modal">Cancel</button>
      <button class="btn-quick btn-primary" id="btn-submit-student">Save & Enroll Student</button>
    `;

    this.openModal('Enroll New Student Record (IEEE 10058674)', bodyHtml, footerHtml);

    document.getElementById('btn-cancel-modal').addEventListener('click', () => this.closeModal());
    document.getElementById('btn-submit-student').addEventListener('click', () => {
      const form = document.getElementById('add-student-form');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const fd = new FormData(form);
      const newStudent = {
        name: fd.get('name'),
        rollNo: fd.get('rollNo'),
        email: fd.get('email'),
        deptId: fd.get('deptId'),
        majorId: fd.get('majorId'),
        classId: fd.get('classId'),
        admissionYear: parseInt(fd.get('admissionYear'), 10),
        currentSemester: parseInt(fd.get('currentSemester'), 10),
        cgpa: parseFloat(fd.get('cgpa')),
        totalCreditsEarned: parseInt(fd.get('totalCreditsEarned'), 10),
        academicStatus: 'Regular',
        promotionStatus: `Promoted to Sem ${fd.get('currentSemester')}`,
        transferHistory: fd.get('transferHistory') || 'Direct Regular Admission',
        scores: [
          { courseCode: 'CS301', courseName: 'Distributed Systems', internal: 26, assignments: 18, exam: 44, total: 88, grade: 'A+', gpa: 9.0 }
        ],
        placement: {
          status: 'Eligible',
          company: 'Campus Placement Cell',
          role: 'Undergraduate Trainee',
          ctc: 'Awaiting Drive Registration',
          offerDate: '—'
        },
        events: [],
        projectsAndPublications: []
      };

      this.dal.createStudent(newStudent);
      this.showToast(`Enrolled student ${newStudent.name} successfully!`, 'success');
      this.closeModal();
      this.render();
    });
  }

  openEditStudentModal(studentId) {
    const s = this.dal.getStudentById(studentId);
    if (!s) return;

    const depts = this.dal.getDepartments();
    const majors = this.dal.getMajors();
    const classes = this.dal.getClasses();

    const bodyHtml = `
      <form id="edit-student-form" class="form-grid">
        <div class="form-group">
          <label class="form-label">Full Student Name</label>
          <input type="text" class="form-control" name="name" value="${s.name}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Roll Number</label>
          <input type="text" class="form-control" name="rollNo" value="${s.rollNo}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" name="email" value="${s.email}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Department</label>
          <select class="form-control" name="deptId">
            ${depts.map(d => `<option value="${d.id}" ${d.id === s.deptId ? 'selected' : ''}>${d.name} (${d.code})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Current Semester</label>
          <input type="number" class="form-control" name="currentSemester" value="${s.currentSemester}" min="1" max="8" />
        </div>
        <div class="form-group">
          <label class="form-label">Cumulative CGPA</label>
          <input type="number" step="0.01" class="form-control" name="cgpa" value="${s.cgpa}" min="0" max="10" />
        </div>
        <div class="form-group">
          <label class="form-label">Placement Company</label>
          <input type="text" class="form-control" name="company" value="${s.placement ? s.placement.company : ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Placement CTC Package</label>
          <input type="text" class="form-control" name="ctc" value="${s.placement ? s.placement.ctc : ''}" />
        </div>
        <div class="form-group col-span-2">
          <label class="form-label">Promotion / Status Notes</label>
          <input type="text" class="form-control" name="promotionStatus" value="${s.promotionStatus || ''}" />
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn-quick" id="btn-cancel-edit">Cancel</button>
      <button class="btn-quick btn-primary" id="btn-save-edit">Update Dossier</button>
    `;

    this.openModal(`Edit Dossier: ${s.name}`, bodyHtml, footerHtml);

    document.getElementById('btn-cancel-edit').addEventListener('click', () => this.closeModal());
    document.getElementById('btn-save-edit').addEventListener('click', () => {
      const form = document.getElementById('edit-student-form');
      const fd = new FormData(form);

      const updated = {
        name: fd.get('name'),
        rollNo: fd.get('rollNo'),
        email: fd.get('email'),
        deptId: fd.get('deptId'),
        currentSemester: parseInt(fd.get('currentSemester'), 10),
        cgpa: parseFloat(fd.get('cgpa')),
        promotionStatus: fd.get('promotionStatus'),
        placement: {
          ...(s.placement || {}),
          company: fd.get('company'),
          ctc: fd.get('ctc')
        }
      };

      this.dal.updateStudent(s.id, updated);
      this.showToast(`Updated profile for ${updated.name}`, 'success');
      this.closeModal();
      this.render();
    });
  }

  openFacultyGradeModal() {
    const students = this.dal.getStudents();
    const courses = this.dal.getCourses();

    const bodyHtml = `
      <form id="grade-entry-form" class="form-grid">
        <div class="form-group">
          <label class="form-label">Select Student *</label>
          <select class="form-control" name="studentId" required>
            ${students.map(s => `<option value="${s.id}">${s.name} (${s.rollNo})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Select Course Module *</label>
          <select class="form-control" name="courseCode" required>
            ${courses.map(c => `<option value="${c.code}">${c.code} - ${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Internal Assessment Score (Max 30)</label>
          <input type="number" class="form-control" name="internal" min="0" max="30" value="26" required />
        </div>
        <div class="form-group">
          <label class="form-label">Assignment Score (Max 20)</label>
          <input type="number" class="form-control" name="assignments" min="0" max="20" value="18" required />
        </div>
        <div class="form-group col-span-2">
          <label class="form-label">Semester Final Exam Score (Max 50)</label>
          <input type="number" class="form-control" name="exam" min="0" max="50" value="45" required />
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn-quick" id="btn-cancel-grade">Cancel</button>
      <button class="btn-quick btn-primary" id="btn-save-grade">Calculate & Commit Grade</button>
    `;

    this.openModal('Faculty Grade Entry & Evaluation (IEEE 7384005)', bodyHtml, footerHtml);

    document.getElementById('btn-cancel-grade').addEventListener('click', () => this.closeModal());
    document.getElementById('btn-save-grade').addEventListener('click', () => {
      const form = document.getElementById('grade-entry-form');
      const fd = new FormData(form);

      const studentId = fd.get('studentId');
      const courseCode = fd.get('courseCode');
      const internal = parseInt(fd.get('internal'), 10) || 0;
      const assignments = parseInt(fd.get('assignments'), 10) || 0;
      const exam = parseInt(fd.get('exam'), 10) || 0;
      const total = internal + assignments + exam;
      const { grade, gpa } = this.bll.calculateGradeFromTotal(total);

      const courseObj = courses.find(c => c.code === courseCode);
      const student = this.dal.getStudentById(studentId);

      if (student) {
        student.scores = student.scores || [];
        const existingScoreIdx = student.scores.findIndex(sc => sc.courseCode === courseCode);
        const scorePayload = {
          courseCode,
          courseName: courseObj ? courseObj.name : courseCode,
          internal,
          assignments,
          exam,
          total,
          grade,
          gpa
        };

        if (existingScoreIdx !== -1) {
          student.scores[existingScoreIdx] = scorePayload;
        } else {
          student.scores.push(scorePayload);
        }

        // Recalculate CGPA
        student.cgpa = this.bll.computeStudentCGPA(student);
        this.dal.saveState();
        this.showToast(`Committed grade ${grade} (${gpa}) for ${student.name}`, 'success');
        this.closeModal();
        this.render();
      }
    });
  }

  openPostAnnouncementModal() {
    const bodyHtml = `
      <form id="announcement-form" class="form-grid">
        <div class="form-group col-span-2">
          <label class="form-label">Notice Title *</label>
          <input type="text" class="form-control" name="title" required placeholder="e.g. Schedule for Mid-Term Practical Exams" />
        </div>
        <div class="form-group">
          <label class="form-label">Publishing Authority *</label>
          <input type="text" class="form-control" name="author" value="Office of Academic Dean" required />
        </div>
        <div class="form-group">
          <label class="form-label">Priority Level</label>
          <select class="form-control" name="priority">
            <option value="Normal">Normal</option>
            <option value="Important">Important</option>
            <option value="High">High</option>
          </select>
        </div>
        <div class="form-group col-span-2">
          <label class="form-label">Notice Body *</label>
          <textarea class="form-control" name="content" required placeholder="Provide detailed institutional announcement text here..."></textarea>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn-quick" id="btn-cancel-ann">Cancel</button>
      <button class="btn-quick btn-primary" id="btn-post-ann">Publish Notice</button>
    `;

    this.openModal('Publish Campus Notice (IEEE 10516390)', bodyHtml, footerHtml);

    document.getElementById('btn-cancel-ann').addEventListener('click', () => this.closeModal());
    document.getElementById('btn-post-ann').addEventListener('click', () => {
      const form = document.getElementById('announcement-form');
      const fd = new FormData(form);

      const newAnn = {
        title: fd.get('title'),
        author: fd.get('author'),
        date: new Date().toISOString().split('T')[0],
        priority: fd.get('priority'),
        content: fd.get('content')
      };

      this.dal.addAnnouncement(newAnn);
      this.showToast('Published notice to all portal users!', 'success');
      this.closeModal();
      this.render();
    });
  }

  exportDatabaseJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.dal.state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `IMS_Database_Export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast('Exported central institutional database to JSON', 'success');
  }

  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// Global bootstrap & Isomorphic Environment Detection
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Browser environment: initialize UI controller when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    window.imsApp = new InstitutionManagementApp();
  });
} else if (typeof module !== 'undefined' && typeof process !== 'undefined') {
  // Node.js environment: auto-start server and open the browser
  try {
    const { startServer } = require('./server');
    console.log('Initiating IMS local server via app.js...');
    startServer({ openBrowser: true });
  } catch (err) {
    console.error('Failed to auto-start server from app.js:', err);
  }
}
