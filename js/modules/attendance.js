// Campus360 - Attendance & Bunk Simulator Module
// Solution 1: Subject-wise attendance % at a glance, 75% threshold alerts, and bunk/attend simulator

const AttendanceModule = (function () {
  function renderAttendanceView(container) {
    const state = Campus360Data.getState();
    const courses = state.courses;

    // Calculate aggregated overall attendance
    const totalClasses = courses.reduce((acc, c) => acc + c.totalClasses, 0);
    const totalAttended = courses.reduce((acc, c) => acc + c.attended, 0);
    const overallPct = ((totalAttended / totalClasses) * 100).toFixed(1);

    const criticalCourses = courses.filter(c => c.percentage < 75);
    const warningCourses = courses.filter(c => c.percentage >= 75 && c.percentage < 80);

    let html = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">fact_check</span>
            Attendance Command Center & Threshold Radar
          </h2>
          <p>Real-time subject-wise percentage tracking, mandatory 75% university threshold alerts, and intelligent bunk simulator.</p>
        </div>
        <div class="view-header-actions">
          <button class="topbar-btn" onclick="AttendanceModule.openDetailedHistory()">
            <span class="material-symbols-outlined">calendar_month</span> Attendance Log
          </button>
          <button class="topbar-btn primary" onclick="AttendanceModule.showBunkCalculatorModal()">
            <span class="material-symbols-outlined">calculate</span> Bunk / Attend Simulator
          </button>
        </div>
      </div>

      <!-- Critical Alert if any course < 75% -->
      ${criticalCourses.length > 0 ? `
        <div class="urgent-broadcast-banner">
          <div class="broadcast-content">
            <div class="broadcast-icon-wrap">
              <span class="material-symbols-outlined">warning</span>
            </div>
            <div class="broadcast-text">
              <h4>CRITICAL ATTENDANCE ALERT: ${criticalCourses.length} Subject(s) Below 75% Threshold!</h4>
              <p>You risk debarment from semester examinations in: <strong>${criticalCourses.map(c => c.code + ' (' + c.percentage + '%)').join(', ')}</strong>. Attend mandatory classes or apply for On-Duty (OD) regularization immediately.</p>
            </div>
          </div>
          <button class="broadcast-action-btn" onclick="Campus360App.navigateTo('leaves')">
            Apply OD / Regularize
          </button>
        </div>
      ` : ''}

      <!-- Top KPI Row -->
      <div class="kpi-grid">
        <div class="kpi-card" style="--card-accent: #4f46e5;">
          <div>
            <div class="kpi-info-label">Overall Aggregate</div>
            <div class="kpi-info-value" style="color: ${overallPct >= 75 ? '#10b981' : '#ef4444'};">${overallPct}%</div>
            <div class="kpi-info-sub ${overallPct >= 75 ? 'success' : 'danger'}">
              <span class="material-symbols-outlined" style="font-size:16px;">${overallPct >= 75 ? 'check_circle' : 'error'}</span>
              ${overallPct >= 75 ? 'Meets 75% Examination Criteria' : 'Debarment Risk Active!'}
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">donut_large</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #10b981;">
          <div>
            <div class="kpi-info-label">Total Classes Attended</div>
            <div class="kpi-info-value">${totalAttended} <span style="font-size:16px; color:var(--text-dim);">/ ${totalClasses}</span></div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">verified</span>
              Across 6 Theory & Lab Courses
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">checklist_rtl</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #f59e0b;">
          <div>
            <div class="kpi-info-label">Caution Radar (75% - 80%)</div>
            <div class="kpi-info-value">${warningCourses.length} Courses</div>
            <div class="kpi-info-sub warning">
              <span class="material-symbols-outlined" style="font-size:16px;">crisis_alert</span>
              ${warningCourses.map(c => c.code).join(', ') || 'All clear'}
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">warning</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #ef4444;">
          <div>
            <div class="kpi-info-label">Shortage Defaulters (&lt; 75%)</div>
            <div class="kpi-info-value" style="color:#ef4444;">${criticalCourses.length} Subject</div>
            <div class="kpi-info-sub danger">
              <span class="material-symbols-outlined" style="font-size:16px;">cancel</span>
              ${criticalCourses.map(c => c.code).join(', ') || 'Zero defaulters'}
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">report_problem</span>
          </div>
        </div>
      </div>

      <!-- Subject-wise Attendance Bento Cards -->
      <h3 style="font-size:18px; font-weight:700; color:#fff; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
        <span class="material-symbols-outlined text-primary-light">subject</span>
        Course-by-Course Attendance Breakdown
      </h3>

      <div class="attendance-cards-grid">
        ${courses.map(course => {
          const statusClass = course.percentage < 75 ? 'critical' : (course.percentage < 80 ? 'warning' : 'safe');
          
          // Calculate safe bunk buffer or required attend count
          let adviceText = '';
          if (course.percentage >= 75) {
            // Can miss: floor((attended - 0.75 * total) / 0.75)
            const safeBunks = Math.floor((course.attended - 0.75 * course.totalClasses) / 0.75);
            adviceText = safeBunks > 0 
              ? `<span style="color:#10b981; font-weight:600;">✨ You can safely miss ${safeBunks} more class(es)</span> and stay &gt;= 75%`
              : `<span style="color:#f59e0b; font-weight:600;">⚠️ Do not miss any classes!</span> You are on the borderline.`;
          } else {
            // Must attend: ceil((0.75 * total - attended) / 0.25)
            const needed = Math.ceil((0.75 * course.totalClasses - course.attended) / 0.25);
            adviceText = `<span style="color:#ef4444; font-weight:700;">🚨 Attend next ${needed} consecutive class(es)</span> to recover above 75%!`;
          }

          return `
            <div class="attendance-subject-card">
              <div class="attendance-card-top">
                <div>
                  <span class="att-code">${course.code}</span>
                  <div class="att-title">${course.name}</div>
                  <div class="att-faculty">Instructor: ${course.faculty} • ${course.cabin}</div>
                </div>
                <div class="attendance-percentage-wrap">
                  <div class="att-pct-val ${statusClass}">${course.percentage}%</div>
                  <span class="nav-badge ${statusClass === 'critical' ? 'danger' : (statusClass === 'warning' ? 'warning' : 'success')}">
                    ${statusClass.toUpperCase()}
                  </span>
                </div>
              </div>

              <div class="progress-track">
                <div class="progress-fill ${statusClass}" style="width: ${Math.min(course.percentage, 100)}%;"></div>
              </div>

              <div class="attendance-breakdown-row">
                <span>Total Conducted: <strong>${course.totalClasses}</strong></span>
                <span>Attended: <strong style="color:#10b981;">${course.attended}</strong></span>
                <span>Absent: <strong style="color:#ef4444;">${course.absent}</strong></span>
                <span>On-Duty (OD): <strong style="color:#3b82f6;">${course.od}</strong></span>
              </div>

              <div style="font-size:12px; margin-top:10px; padding:8px 12px; border-radius:var(--radius-xs); background:rgba(255,255,255,0.03); border-left:2px solid ${course.percentage < 75 ? '#ef4444' : '#10b981'};">
                ${adviceText}
              </div>

              <div style="margin-top:14px; display:flex; gap:8px;">
                <button class="topbar-btn" style="flex:1; justify-content:center; font-size:12px;" onclick="AttendanceModule.openSimulatorFor('${course.code}')">
                  <span class="material-symbols-outlined" style="font-size:16px;">tune</span> Simulate Bunk/Attend
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Integrated Bunk & Attend Simulator Section -->
      <div class="simulator-box" id="bunkSimulatorSection">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
          <div>
            <h3 style="font-size:18px; font-weight:800; color:#fff; display:flex; align-items:center; gap:8px;">
              <span class="material-symbols-outlined text-secondary">tune</span>
              Interactive Bunk & Attend Projection Simulator
            </h3>
            <p style="font-size:13px; color:var(--text-muted);">Simulate future class decisions and instantly visualize your updated attendance percentage before making plans.</p>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <label style="font-size:13px; color:#cbd5e1; font-weight:600;">Select Subject:</label>
            <select id="simCourseSelect" class="form-control" style="width:220px;" onchange="AttendanceModule.updateSimulator()">
              ${courses.map(c => `<option value="${c.code}">${c.code} - ${c.name.substring(0, 24)}... (${c.percentage}%)</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="sim-controls">
          <div class="dashboard-panel" style="background:rgba(14,18,27,0.7);">
            <div class="sim-slider-group">
              <label>
                <span>Classes to Attend in Next Sprints:</span>
                <span id="attendCountLabel" style="color:var(--secondary); font-size:16px; font-weight:700;">+0</span>
              </label>
              <input type="range" min="0" max="20" value="0" class="sim-slider" id="simAttendInput" oninput="AttendanceModule.updateSimulator()">
              <p style="font-size:11.5px; color:var(--text-dim); margin-top:6px;">Increase this to see how fast your percentage climbs.</p>
            </div>

            <div class="sim-slider-group" style="margin-top:20px;">
              <label>
                <span>Classes to Skip / Bunk:</span>
                <span id="missCountLabel" style="color:var(--danger); font-size:16px; font-weight:700;">+0</span>
              </label>
              <input type="range" min="0" max="15" value="0" class="sim-slider" id="simMissInput" oninput="AttendanceModule.updateSimulator()">
              <p style="font-size:11.5px; color:var(--text-dim); margin-top:6px;">Slide right to check the danger zone if you miss upcoming classes.</p>
            </div>
          </div>

          <div class="sim-output-card" id="simOutputBox">
            <!-- Injected dynamically by updateSimulator -->
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    AttendanceModule.updateSimulator();
  }

  function updateSimulator() {
    const select = document.getElementById('simCourseSelect');
    if (!select) return;
    const courseCode = select.value;
    const attendInput = document.getElementById('simAttendInput');
    const missInput = document.getElementById('simMissInput');
    const outputBox = document.getElementById('simOutputBox');

    const attendAdd = parseInt(attendInput.value, 10) || 0;
    const missAdd = parseInt(missInput.value, 10) || 0;

    document.getElementById('attendCountLabel').textContent = `+${attendAdd}`;
    document.getElementById('missCountLabel').textContent = `+${missAdd}`;

    const state = Campus360Data.getState();
    const course = state.courses.find(c => c.code === courseCode) || state.courses[0];

    const projectedAttended = course.attended + attendAdd;
    const projectedTotal = course.totalClasses + attendAdd + missAdd;
    const projectedPct = ((projectedAttended / projectedTotal) * 100).toFixed(1);

    const diff = (projectedPct - course.percentage).toFixed(1);
    const isAbove75 = projectedPct >= 75;

    outputBox.innerHTML = `
      <div style="font-size:12px; text-transform:uppercase; font-weight:700; color:var(--text-dim);">Projected Percentage</div>
      <div class="sim-output-number" style="color: ${isAbove75 ? '#10b981' : '#ef4444'};">
        ${projectedPct}%
      </div>
      <div style="font-size:13px; font-weight:600; color:${diff >= 0 ? '#10b981' : '#ef4444'}; margin-top:2px;">
        ${diff >= 0 ? '▲ +' + diff + '%' : '▼ ' + diff + '%'} from current (${course.percentage}%)
      </div>
      <div style="margin-top:12px; font-size:12.5px; color:#cbd5e1; padding:8px; border-radius:6px; background:rgba(255,255,255,0.05);">
        ${isAbove75 
          ? '✅ Status: Safe & Eligible for Examinations' 
          : '⚠️ Status: Debarred! Below mandatory 75% limit'}
      </div>
      <div style="font-size:11.5px; color:var(--text-muted); margin-top:8px;">
        Projected Total: ${projectedAttended} attended out of ${projectedTotal} total
      </div>
    `;
  }

  function openSimulatorFor(courseCode) {
    const select = document.getElementById('simCourseSelect');
    if (select) {
      select.value = courseCode;
      updateSimulator();
      const el = document.getElementById('bunkSimulatorSection');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function showBunkCalculatorModal() {
    const el = document.getElementById('bunkSimulatorSection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  function openDetailedHistory() {
    Campus360App.showModal(
      'Subject Attendance Log & Verification Matrix',
      `
      <div style="max-height:60vh; overflow-y:auto;">
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">Official institutional roll verified by Office of Academic Affairs. Syncs in real-time with biometric and faculty period submissions.</p>
        <table class="cgpa-table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Subject Title</th>
              <th>Total Held</th>
              <th>Attended</th>
              <th>Absent</th>
              <th>OD</th>
              <th>Percentage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${Campus360Data.getState().courses.map(c => `
              <tr>
                <td><strong>${c.code}</strong></td>
                <td>${c.name}</td>
                <td>${c.totalClasses}</td>
                <td style="color:#10b981; font-weight:700;">${c.attended}</td>
                <td style="color:#ef4444; font-weight:700;">${c.absent}</td>
                <td style="color:#3b82f6;">${c.od}</td>
                <td style="font-weight:800; color:${c.percentage < 75 ? '#ef4444' : (c.percentage < 80 ? '#f59e0b' : '#10b981')}">${c.percentage}%</td>
                <td>
                  <span class="nav-badge ${c.percentage < 75 ? 'danger' : (c.percentage < 80 ? 'warning' : 'success')}">
                    ${c.percentage < 75 ? 'CRITICAL' : (c.percentage < 80 ? 'WARNING' : 'ELIGIBLE')}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top:18px; padding:12px; background:rgba(255,255,255,0.04); border-radius:8px; font-size:12px; color:var(--text-muted);">
          Note: Shortage condonation requests must be submitted through the Leave / OD module with authenticated medical or institutional certificates.
        </div>
      </div>
      `
    );
  }

  return {
    renderAttendanceView,
    updateSimulator,
    openSimulatorFor,
    showBunkCalculatorModal,
    openDetailedHistory
  };
})();

