// Campus360 - Dedicated Multi-Role Dashboards Module
// Implements tailored command centers for: Student, Admin, Staff / Faculty, HOD, and Parent

const RoleDashboardsModule = (function () {
  // 1. STUDENT DASHBOARD
  function renderStudentDashboard(container) {
    const state = Campus360Data.getState();
    const user = state.currentUser;
    const courses = state.courses;
    const timetable = state.timetable.Monday; // Sample today
    const critical = courses.filter(c => c.percentage < 75);
    const recentLog = state.periodLogs[0];
    const projects = state.marksData.pendingProjects;

    let html = `
      <!-- Welcome Header -->
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">waving_hand</span>
            Welcome back, ${user.name}!
          </h2>
          <p>${user.department || 'Computer Science & Engineering'} • Roll No: <strong>${user.rollNo || '22CS042'}</strong> • Mentor: <strong>${user.mentor || 'Dr. Arvind Sharma'}</strong></p>
        </div>
        <div class="view-header-actions">
          <button class="topbar-btn" onclick="Campus360App.navigateTo('attendance')">
            <span class="material-symbols-outlined">analytics</span> Attendance Radar
          </button>
          <button class="topbar-btn primary" onclick="Campus360App.navigateTo('timetable')">
            <span class="material-symbols-outlined">schedule</span> Today's Schedule
          </button>
        </div>
      </div>

      <!-- Urgent Alert Banner if Room Shift or Attendance Defaulter -->
      <div class="urgent-broadcast-banner">
        <div class="broadcast-content">
          <div class="broadcast-icon-wrap">
            <span class="material-symbols-outlined">alt_route</span>
          </div>
          <div class="broadcast-text">
            <h4>⚡ ROOM CHANGE ALERT: CS302 (Operating Systems) Relocated!</h4>
            <p>Period 2 (10:00 AM) lecture shifted from <del style="color:#fca5a5;">LH-102</del> ➔ <strong>LH-204</strong> due to projector servicing. Updated 08:30 AM.</p>
          </div>
        </div>
        <button class="broadcast-action-btn" onclick="Campus360App.navigateTo('timetable')">
          View Timetable
        </button>
      </div>

      ${critical.length > 0 ? `
        <div style="background:rgba(239,68,68,0.1); border:1px solid #ef4444; border-radius:12px; padding:14px 20px; display:flex; align-items:center; justify-content:space-between; margin-bottom:24px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="material-symbols-outlined text-danger">warning</span>
            <div style="font-size:13.5px; color:#fca5a5;">
              <strong>ATTENDANCE ALERT:</strong> Your attendance in <strong>${critical[0].name}</strong> is at <strong>${critical[0].percentage}%</strong> (&lt; 75%). Attend next 2 classes to avoid exam debarment!
            </div>
          </div>
          <button class="topbar-btn" style="padding:4px 12px; font-size:12px; background:rgba(239,68,68,0.25); color:#fff;" onclick="AttendanceModule.openSimulatorFor('${critical[0].code}')">
            Simulate Bunk/Attend
          </button>
        </div>
      ` : ''}

      <!-- Top KPI Row -->
      <div class="kpi-grid">
        <div class="kpi-card" style="--card-accent: #10b981;">
          <div>
            <div class="kpi-info-label">Overall Attendance</div>
            <div class="kpi-info-value" style="color:#10b981;">${user.attendanceOverall || '82.8'}%</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">check_circle</span>
              Above 75% Safe Threshold
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">donut_large</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #3b82f6;">
          <div>
            <div class="kpi-info-label">Current CGPA (5th Sem)</div>
            <div class="kpi-info-value" style="color:#38bdf8;">${user.cgpa || '8.74'}</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">trending_up</span>
              Top Tier Distinction Track
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">workspace_premium</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #f59e0b;">
          <div>
            <div class="kpi-info-label">Pending Projects</div>
            <div class="kpi-info-value" style="color:#fcd34d;">${projects.length} Due</div>
            <div class="kpi-info-sub warning">
              <span class="material-symbols-outlined" style="font-size:16px;">schedule</span>
              Next deadline in 3 days!
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">hourglass_top</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #8b5cf6;">
          <div>
            <div class="kpi-info-label">Syllabus Exam Prep</div>
            <div class="kpi-info-value">68%</div>
            <div class="kpi-info-sub">
              <span class="material-symbols-outlined" style="font-size:16px;">checklist</span>
              14 Topics Self-Revised
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">psychology</span>
          </div>
        </div>
      </div>

      <!-- Bento Grid: Today's Schedule & What Happened in Last Class -->
      <div class="bento-grid">
        <!-- Today's Schedule -->
        <div class="dashboard-panel">
          <div class="panel-header">
            <div class="panel-header-left">
              <span class="material-symbols-outlined text-secondary">today</span>
              <h3>Today's Classes & Hourly Timeline</h3>
            </div>
            <button class="topbar-btn" style="padding:4px 10px; font-size:12px;" onclick="Campus360App.navigateTo('timetable')">
              Full Week
            </button>
          </div>

          <div class="timetable-period-grid">
            ${timetable.slice(0, 4).map(p => {
              const isShifted = p.roomChange && p.roomChange.isChanged;
              return `
                <div class="period-card ${isShifted ? 'changed-room' : ''}" onclick="TimetableModule.openPeriodDetails('Monday', ${p.period})">
                  <div class="period-time-slot">
                    <span class="period-num">P${p.period} • ${p.time.split(' - ')[0]}</span>
                    <span class="period-clock">${p.type}</span>
                  </div>
                  <div class="period-details">
                    <h4>${p.code} — ${p.subject}</h4>
                    <p>Instructor: ${p.faculty}</p>
                    <div class="period-topic-pill">
                      <span class="material-symbols-outlined" style="font-size:14px; color:var(--secondary);">menu_book</span>
                      ${p.topic}
                    </div>
                  </div>
                  <div class="period-room-badge">
                    <span class="room-tag ${isShifted ? 'changed' : ''}">
                      ${isShifted ? '🚨 ' + p.roomChange.newRoom : p.room}
                    </span>
                    ${isShifted ? '<span style="font-size:10px; color:#fca5a5; font-weight:700;">Shifted</span>' : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Right Side: "What happened in my last class?" & Quick Actions -->
        <div style="display:flex; flex-direction:column; gap:20px;">
          <!-- Last Class Dossier Widget -->
          <div class="dashboard-panel" style="background:linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(6,182,212,0.1) 100%);">
            <div class="panel-header">
              <div class="panel-header-left">
                <span class="material-symbols-outlined text-secondary">history_edu</span>
                <h3>What Happened in Last Class?</h3>
              </div>
            </div>
            ${recentLog ? `
              <div>
                <div style="display:flex; align-items:center; justify-content:space-between;">
                  <span class="nav-badge primary">${recentLog.courseCode}</span>
                  <span style="font-size:12px; color:var(--text-dim);">${recentLog.date}</span>
                </div>
                <h4 style="font-size:15px; font-weight:700; color:#fff; margin-top:6px;">${recentLog.topicTaught}</h4>
                <p style="font-size:12.5px; color:var(--text-muted); margin-top:4px;">${recentLog.keyTakeaways.substring(0, 100)}...</p>

                <div style="margin-top:14px; display:flex; gap:8px;">
                  <button class="topbar-btn primary" style="flex:1; justify-content:center; font-size:12px;" onclick="Campus360App.navigateTo('period-log')">
                    <span class="material-symbols-outlined" style="font-size:15px;">download</span> Download Lecture Slides
                  </button>
                </div>
              </div>
            ` : '<p style="font-size:13px; color:var(--text-dim);">No recent period logs found.</p>'}
          </div>

          <!-- Quick Action Hub -->
          <div class="dashboard-panel">
            <div class="panel-header">
              <div class="panel-header-left">
                <span class="material-symbols-outlined text-primary-light">bolt</span>
                <h3>Quick Command Shortcuts</h3>
              </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <button class="topbar-btn" style="justify-content:center; padding:10px;" onclick="Campus360App.navigateTo('lab-booking')">
                <span class="material-symbols-outlined text-secondary">meeting_room</span> Book Lab
              </button>
              <button class="topbar-btn" style="justify-content:center; padding:10px;" onclick="Campus360App.navigateTo('leaves')">
                <span class="material-symbols-outlined text-success">task</span> Apply Leave
              </button>
              <button class="topbar-btn" style="justify-content:center; padding:10px;" onclick="Campus360App.navigateTo('cgpa')">
                <span class="material-symbols-outlined text-warning">calculate</span> Calc GPA
              </button>
              <button class="topbar-btn" style="justify-content:center; padding:10px;" onclick="Campus360App.navigateTo('syllabus')">
                <span class="material-symbols-outlined text-pink">checklist</span> Syllabus
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // 2. ADMIN DASHBOARD
  function renderAdminDashboard(container) {
    const state = Campus360Data.getState();
    const bookings = state.bookings;
    const leaves = state.leaves;
    const tickets = state.tickets;

    let html = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">shield_person</span>
            Institutional Administrator Operations Center
          </h2>
          <p>Campus-wide governance, facility allocation approvals, emergency broadcasts, and institutional KPI telemetry.</p>
        </div>
        <div class="view-header-actions">
          <button class="topbar-btn primary" onclick="AnnouncementsModule.openPostModal()">
            <span class="material-symbols-outlined">campaign</span> Dispatch Emergency Broadcast
          </button>
        </div>
      </div>

      <!-- Admin KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card" style="--card-accent: #3b82f6;">
          <div>
            <div class="kpi-info-label">Total Enrolled Students</div>
            <div class="kpi-info-value">4,250 Pax</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">verified</span>
              12 Engineering & Tech Depts
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">groups</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #10b981;">
          <div>
            <div class="kpi-info-label">Active Faculty Members</div>
            <div class="kpi-info-value">215 Faculty</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">co_present</span>
              1:19 Faculty-to-Student Ratio
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">badge</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #f59e0b;">
          <div>
            <div class="kpi-info-label">Pending Hall Reservations</div>
            <div class="kpi-info-value" style="color:#fcd34d;">${bookings.filter(b => b.status === 'Pending').length} Pending</div>
            <div class="kpi-info-sub warning">
              <span class="material-symbols-outlined" style="font-size:16px;">hourglass_top</span>
              Requires Administrator sign-off
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">meeting_room</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #ef4444;">
          <div>
            <div class="kpi-info-label">Active Support Grievances</div>
            <div class="kpi-info-value" style="color:#ef4444;">${tickets.filter(t => t.status !== 'Resolved').length} Open</div>
            <div class="kpi-info-sub danger">
              <span class="material-symbols-outlined" style="font-size:16px;">engineering</span>
              Classroom & WiFi work orders
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">support_agent</span>
          </div>
        </div>
      </div>

      <!-- Admin Pending Clearances Bento -->
      <div class="bento-grid">
        <!-- Pending Facility Clearances -->
        <div class="dashboard-panel">
          <div class="panel-header">
            <div class="panel-header-left">
              <span class="material-symbols-outlined text-secondary">approval</span>
              <h3>Facility & Hall Reservation Approvals Queue</h3>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:12px;">
            ${bookings.map(b => `
              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:10px; padding:14px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                <div>
                  <h4 style="font-size:14.5px; font-weight:700; color:#fff;">${b.venueName}</h4>
                  <div style="font-size:12px; color:var(--text-muted);">${b.bookedBy} • Date: ${b.date} (${b.slot})</div>
                  <div style="font-size:11.5px; color:var(--text-dim); margin-top:2px;">Purpose: ${b.purpose}</div>
                </div>

                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="nav-badge ${b.status === 'Approved' ? 'success' : 'warning'}">${b.status}</span>
                  ${b.status === 'Pending' ? `
                    <button class="topbar-btn primary" style="padding:4px 12px; font-size:12px;" onclick="LabBookingModule.approveBooking('${b.id}')">
                      Approve
                    </button>
                  ` : `
                    <button class="topbar-btn" style="padding:4px 10px; font-size:12px;" onclick="LabBookingModule.showDigitalPass('${b.id}')">
                      View Pass
                    </button>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Infrastructure Telemetry -->
        <div class="dashboard-panel">
          <div class="panel-header">
            <div class="panel-header-left">
              <span class="material-symbols-outlined text-primary-light">dns</span>
              <h3>Campus Infrastructure Telemetry</h3>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:12px; font-size:13px;">
            <div style="display:flex; justify-content:space-between; padding:10px; background:rgba(255,255,255,0.03); border-radius:6px;">
              <span>Biometric Attendance Gate Sync</span>
              <strong style="color:#10b981;">Online (4ms latency)</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:10px; background:rgba(255,255,255,0.03); border-radius:6px;">
              <span>Central Library Turnstiles</span>
              <strong style="color:#10b981;">100% Operational</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:10px; background:rgba(255,255,255,0.03); border-radius:6px;">
              <span>Turing AI Cluster Load</span>
              <strong style="color:#f59e0b;">68% Utilization</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:10px; background:rgba(255,255,255,0.03); border-radius:6px;">
              <span>Active WiFi Access Points</span>
              <strong style="color:#10b981;">142 / 144 Online</strong>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // 3. STAFF / FACULTY DASHBOARD
  function renderStaffDashboard(container) {
    const state = Campus360Data.getState();
    const courses = state.courses;

    let html = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">person_apron</span>
            Faculty Teaching & Class Management Portal
          </h2>
          <p>Logged in as <strong>Dr. Arvind Sharma</strong> (Associate Professor, CSE) • Cabin: Tech Tower C-302</p>
        </div>
        <div class="view-header-actions">
          <button class="topbar-btn primary" onclick="PeriodLogModule.openNewLogModal()">
            <span class="material-symbols-outlined">post_add</span> Record Today's Period Log
          </button>
        </div>
      </div>

      <!-- Staff KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card" style="--card-accent: #3b82f6;">
          <div>
            <div class="kpi-info-label">Assigned Courses</div>
            <div class="kpi-info-value">2 Courses</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">school</span>
              Machine Learning & AI Lab
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">menu_book</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #10b981;">
          <div>
            <div class="kpi-info-label">Period Logs Submitted</div>
            <div class="kpi-info-value" style="color:#10b981;">100% On-Time</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">task_alt</span>
              All 42 Lecture Notes Uploaded
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">fact_check</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #f59e0b;">
          <div>
            <div class="kpi-info-label">Pending Capstone Submissions</div>
            <div class="kpi-info-value" style="color:#fcd34d;">3 Deliverables</div>
            <div class="kpi-info-sub warning">
              <span class="material-symbols-outlined" style="font-size:16px;">rate_review</span>
              Requires rubric evaluation
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">assignment</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #ef4444;">
          <div>
            <div class="kpi-info-label">Shortage Students Flagged</div>
            <div class="kpi-info-value" style="color:#ef4444;">1 Student</div>
            <div class="kpi-info-sub danger">
              <span class="material-symbols-outlined" style="font-size:16px;">crisis_alert</span>
              CS302 Operating Systems (&lt; 75%)
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">warning</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions for Faculty -->
      <div class="bento-grid">
        <div class="dashboard-panel">
          <div class="panel-header">
            <div class="panel-header-left">
              <span class="material-symbols-outlined text-secondary">checklist_rtl</span>
              <h3>Rapid Classroom Period Attendance & Topic Logging</h3>
            </div>
          </div>
          <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">
            Publishing a period log automatically notifies students, informs parents on their portal, and updates the syllabus tracker.
          </p>

          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:10px; padding:16px; display:flex; align-items:center; justify-content:space-between;">
              <div>
                <span class="nav-badge primary">CS301 Machine Learning</span>
                <h4 style="font-size:15px; font-weight:700; color:#fff; margin-top:4px;">Period 1 (09:00 AM) — LH-301</h4>
                <div style="font-size:12px; color:var(--text-dim);">Topic: Support Vector Machines & Dual KKT Formulation</div>
              </div>
              <span class="nav-badge success">✓ Logged</span>
            </div>

            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:10px; padding:16px; display:flex; align-items:center; justify-content:space-between;">
              <div>
                <span class="nav-badge primary">CS301P AI & HPC Lab</span>
                <h4 style="font-size:15px; font-weight:700; color:#fff; margin-top:4px;">Period 5 (01:30 PM) — HPC Lab 4F</h4>
                <div style="font-size:12px; color:var(--text-dim);">Topic: PyTorch ResNet50 Fine-Tuning & Multi-GPU Training</div>
              </div>
              <button class="topbar-btn primary" style="padding:6px 14px; font-size:12.5px;" onclick="PeriodLogModule.openNewLogModal()">
                <span class="material-symbols-outlined" style="font-size:16px;">edit_note</span> Mark Attendance & Log
              </button>
            </div>
          </div>
        </div>

        <div class="dashboard-panel">
          <div class="panel-header">
            <div class="panel-header-left">
              <span class="material-symbols-outlined text-warning">emergency</span>
              <h3>Emergency Relocation Room Trigger</h3>
            </div>
          </div>
          <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">
            Facing a projector glitch or lab conflict? Shift classroom and blast push notifications to your entire class.
          </p>
          <button class="topbar-btn primary" style="width:100%; justify-content:center;" onclick="TimetableModule.openRoomChangeModal()">
            <span class="material-symbols-outlined">edit_location</span> Post Last-Minute Room Change
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // 4. HOD DASHBOARD
  function renderHODDashboard(container) {
    const state = Campus360Data.getState();
    const courses = state.courses;
    const critical = courses.filter(c => c.percentage < 75);

    let html = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">account_balance</span>
            Head of Department (HOD) Oversight Dashboard
          </h2>
          <p>Department of Computer Science & Engineering • Dr. Meenakshi Sundaram • Real-time curriculum and faculty compliance.</p>
        </div>
        <div class="view-header-actions">
          <button class="topbar-btn primary" onclick="HODModule.notifyAllDefaulters()">
            <span class="material-symbols-outlined">send_and_archive</span> Alert All Defaulter Parents
          </button>
        </div>
      </div>

      <!-- HOD KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card" style="--card-accent: #10b981;">
          <div>
            <div class="kpi-info-label">Faculty Period Logging Compliance</div>
            <div class="kpi-info-value" style="color:#10b981;">96.8%</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">verified</span>
              142 of 147 Lectures Logged Daily
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">fact_check</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #3b82f6;">
          <div>
            <div class="kpi-info-label">Department Average Attendance</div>
            <div class="kpi-info-value">84.2%</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">trending_up</span>
              Highest in Engineering College
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">group</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #ef4444;">
          <div>
            <div class="kpi-info-label">Debarment Defaulter Radar</div>
            <div class="kpi-info-value" style="color:#ef4444;">${critical.length} Students</div>
            <div class="kpi-info-sub danger">
              <span class="material-symbols-outlined" style="font-size:16px;">report_problem</span>
              Below mandatory 75% limit
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">warning</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #8b5cf6;">
          <div>
            <div class="kpi-info-label">Pending OD Endorsements</div>
            <div class="kpi-info-value">2 Requests</div>
            <div class="kpi-info-sub">
              <span class="material-symbols-outlined" style="font-size:16px;">task</span>
              Inter-College Hackathons
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">assignment_turned_in</span>
          </div>
        </div>
      </div>

      <!-- Defaulters Radar Table -->
      <div class="dashboard-panel">
        <div class="panel-header">
          <div class="panel-header-left">
            <span class="material-symbols-outlined text-danger">crisis_alert</span>
            <h3>Department Attendance Shortage Defaulters (&lt; 75%)</h3>
          </div>
          <span style="font-size:12px; color:var(--text-dim);">Automated notices ready for dispatch</span>
        </div>

        <div style="overflow-x:auto;">
          <table class="cgpa-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Defaulter Subject</th>
                <th>Attendance %</th>
                <th>Deficit Classes</th>
                <th>Parent Contact</th>
                <th>HOD Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>22CS042</strong></td>
                <td>Alex Turner</td>
                <td><strong style="color:#ef4444;">CS302 Operating Systems</strong></td>
                <td><span style="color:#ef4444; font-weight:800;">72.5%</span></td>
                <td>-2 Classes below 75%</td>
                <td>parent.alex@gmail.com (+91 98765 43210)</td>
                <td>
                  <button class="topbar-btn" style="padding:4px 10px; font-size:11.5px; background:rgba(239,68,68,0.2); color:#fca5a5;" onclick="Campus360App.showToast('Automated warning SMS & email dispatched to parent!', 'success')">
                    Dispatch Alert
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // 5. PARENT DASHBOARD
  function renderParentDashboard(container) {
    const state = Campus360Data.getState();
    const courses = state.courses;
    const user = state.currentUser;
    const recentLogs = state.periodLogs.slice(0, 3);

    let html = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">family_restroom</span>
            Parent & Guardian Portal: Ward Academic Monitor
          </h2>
          <p>Ward: <strong>Alex Turner</strong> (Roll: 22CS042) • B.Tech Computer Science (3rd Year) • Mentor: <strong>Dr. Arvind Sharma</strong></p>
        </div>
        <div class="view-header-actions">
          <button class="topbar-btn primary" onclick="SupportContactModule.openFacultyMessageModal('Dr. Arvind Sharma (Faculty Mentor)')">
            <span class="material-symbols-outlined">chat</span> Message Ward Mentor
          </button>
        </div>
      </div>

      <!-- Parent KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card" style="--card-accent: #10b981;">
          <div>
            <div class="kpi-info-label">Ward Aggregate Attendance</div>
            <div class="kpi-info-value" style="color:#10b981;">82.8%</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">check_circle</span>
              Meets Examination Criteria
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">donut_large</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #3b82f6;">
          <div>
            <div class="kpi-info-label">Cumulative Grade Point (CGPA)</div>
            <div class="kpi-info-value" style="color:#38bdf8;">8.74 / 10.0</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">grade</span>
              Distinction Standing
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">workspace_premium</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #ef4444;">
          <div>
            <div class="kpi-info-label">Attendance Warning Subject</div>
            <div class="kpi-info-value" style="color:#ef4444;">1 Subject</div>
            <div class="kpi-info-sub danger">
              <span class="material-symbols-outlined" style="font-size:16px;">warning</span>
              Operating Systems (72.5%)
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">crisis_alert</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #8b5cf6;">
          <div>
            <div class="kpi-info-label">University Fee & Dues</div>
            <div class="kpi-info-value" style="color:#10b981;">Fully Paid</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">receipt</span>
              Receipt #FEES-2026-981
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">payments</span>
          </div>
        </div>
      </div>

      <!-- Bento: Subject Breakdown + What Did My Child Learn Today? -->
      <div class="bento-grid">
        <!-- Subject Attendance Breakdown -->
        <div class="dashboard-panel">
          <div class="panel-header">
            <div class="panel-header-left">
              <span class="material-symbols-outlined text-secondary">fact_check</span>
              <h3>Ward's Subject-by-Subject Attendance & Status</h3>
            </div>
          </div>

          <div style="overflow-x:auto;">
            <table class="cgpa-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Faculty</th>
                  <th>Held</th>
                  <th>Attended</th>
                  <th>Absent</th>
                  <th>Percentage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${courses.map(c => `
                  <tr>
                    <td><strong>${c.code}</strong><br><span style="font-size:11.5px; color:var(--text-dim);">${c.name}</span></td>
                    <td>${c.faculty}</td>
                    <td>${c.totalClasses}</td>
                    <td style="color:#10b981; font-weight:700;">${c.attended}</td>
                    <td style="color:#ef4444; font-weight:700;">${c.absent}</td>
                    <td style="font-weight:800; color:${c.percentage < 75 ? '#ef4444' : '#10b981'};">${c.percentage}%</td>
                    <td>
                      <span class="nav-badge ${c.percentage < 75 ? 'danger' : 'success'}">
                        ${c.percentage < 75 ? 'SHORTAGE ALERT' : 'GOOD'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- What Did My Child Learn Today? -->
        <div class="dashboard-panel">
          <div class="panel-header">
            <div class="panel-header-left">
              <span class="material-symbols-outlined text-primary-light">school</span>
              <h3>What Did My Child Learn Today?</h3>
            </div>
          </div>
          <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:14px;">
            Direct mirror of topics recorded by university faculty during each period.
          </p>

          <div style="display:flex; flex-direction:column; gap:12px;">
            ${recentLogs.map(l => `
              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:12px;">
                <div style="display:flex; align-items:center; justify-content:space-between;">
                  <strong style="color:var(--secondary); font-size:13px;">${l.courseCode} — ${l.period}</strong>
                  <span class="nav-badge success" style="font-size:10px;">${l.attendanceStatus}</span>
                </div>
                <div style="font-size:13.5px; font-weight:600; color:#fff; margin-top:4px;">${l.topicTaught}</div>
                <div style="font-size:11.5px; color:var(--text-dim); margin-top:2px;">Faculty: ${l.faculty}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function notifyAllDefaulters() {
    Campus360App.showToast('Automated SMS & Email alerts dispatched to all defaulter parents!', 'success');
  }

  return {
    renderStudentDashboard,
    renderAdminDashboard,
    renderStaffDashboard,
    renderHODDashboard,
    renderParentDashboard,
    notifyAllDefaulters
  };
})();

// Alias for HOD actions
window.HODModule = RoleDashboardsModule;


