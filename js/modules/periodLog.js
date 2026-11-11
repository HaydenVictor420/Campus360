// Campus360 - Period-Wise Log & Faculty Handouts Module
// Solution 3: View log of what was taught in each period, documents/materials shared, and mark attendance

const PeriodLogModule = (function () {
  let selectedCourseFilter = 'ALL';

  function renderPeriodLogView(container) {
    const state = Campus360Data.getState();
    const periodLogs = state.periodLogs;
    const courses = state.courses;

    const filteredLogs = selectedCourseFilter === 'ALL' 
      ? periodLogs 
      : periodLogs.filter(l => l.courseCode === selectedCourseFilter);

    let html = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">history_edu</span>
            Period-Wise Class Log & Lecture Dossier
          </h2>
          <p>Instant answers to <em>"What happened in my last class?"</em> — track exact topics covered, download lecture slides, and verify period attendance.</p>
        </div>
        <div class="view-header-actions">
          ${(state.currentRole === 'staff' || state.currentRole === 'admin') ? `
            <button class="topbar-btn primary" onclick="PeriodLogModule.openNewLogModal()">
              <span class="material-symbols-outlined">post_add</span> Submit Today's Period Log
            </button>
          ` : ''}
          <div style="display:flex; align-items:center; gap:8px;">
            <select class="form-control" style="width:190px;" onchange="PeriodLogModule.filterByCourse(this.value)">
              <option value="ALL">All Subjects</option>
              ${courses.map(c => `<option value="${c.code}" ${c.code === selectedCourseFilter ? 'selected' : ''}>${c.code} (${c.name.substring(0, 16)}...)</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Quick Answer Banner -->
      <div class="dashboard-panel" style="background:linear-gradient(135deg, rgba(79,70,229,0.1) 0%, rgba(6,182,212,0.08) 100%); margin-bottom:24px; border:1px solid rgba(99,102,241,0.25);">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
          <div style="display:flex; align-items:center; gap:14px;">
            <div style="width:44px; height:44px; border-radius:12px; background:rgba(79,70,229,0.25); display:flex; align-items:center; justify-content:center; color:var(--secondary);">
              <span class="material-symbols-outlined" style="font-size:26px;">help_center</span>
            </div>
            <div>
              <h4 style="font-size:15px; font-weight:700; color:#fff;">Missed your last lecture? Stay 100% in sync</h4>
              <p style="font-size:13px; color:var(--text-muted);">Review official faculty summaries, copy numerical questions, and download distributed source code below.</p>
            </div>
          </div>
          <div style="display:flex; gap:10px;">
            <span class="nav-badge success" style="font-size:12px;">5 Recent Period Logs Logged</span>
          </div>
        </div>
      </div>

      <!-- Timeline Entries -->
      <div class="log-timeline">
        ${filteredLogs.map(log => {
          const isPresent = log.attendanceStatus === 'Present';
          const isOD = log.attendanceStatus.includes('OD');

          return `
            <div class="log-entry-card">
              <div class="log-entry-header">
                <div class="log-meta-left">
                  <span class="log-course-tag">${log.courseCode}</span>
                  <span style="font-weight:700; font-size:14.5px; color:#fff;">${log.courseName}</span>
                  <span class="log-date">• ${log.date} — ${log.period}</span>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:12px; color:var(--text-dim);">${log.room}</span>
                  <span class="nav-badge ${isPresent ? 'success' : (isOD ? 'primary' : 'danger')}">
                    ${isPresent ? '✓ ' + log.attendanceStatus : (isOD ? '🏛️ ' + log.attendanceStatus : '✗ ' + log.attendanceStatus)}
                  </span>
                </div>
              </div>

              <div>
                <div class="log-topic-title">${log.topicTaught}</div>
                <div style="font-size:12.5px; color:var(--text-dim); margin-top:4px;">
                  Conducted by <strong>${log.faculty}</strong> • Log recorded at ${log.submittedAt}
                </div>
              </div>

              <div class="log-takeaways">
                <strong style="color:#fff; display:block; margin-bottom:4px;">💡 Key Takeaways & Action Items:</strong>
                ${log.keyTakeaways}
              </div>

              <!-- Shared Materials & Documents -->
              ${log.materials && log.materials.length > 0 ? `
                <div>
                  <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--text-dim); margin-bottom:8px; display:flex; align-items:center; gap:6px;">
                    <span class="material-symbols-outlined" style="font-size:16px; color:var(--secondary);">attachment</span>
                    Shared Faculty Materials & Handouts:
                  </div>
                  <div class="log-materials-row">
                    ${log.materials.map(mat => `
                      <a href="#" class="material-chip" onclick="PeriodLogModule.downloadMaterial('${mat.name}')">
                        <span class="material-symbols-outlined" style="font-size:16px; color:var(--secondary);">
                          ${mat.type === 'pdf' ? 'picture_as_pdf' : (mat.type === 'code' ? 'terminal' : 'description')}
                        </span>
                        <span>${mat.name}</span>
                        <span style="font-size:10px; color:var(--text-dim); margin-left:4px;">(${mat.size})</span>
                        <span class="material-symbols-outlined" style="font-size:14px; margin-left:4px;">download</span>
                      </a>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Self Attendance / Student Check-in Status -->
              <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px; padding-top:12px; border-top:1px solid var(--border-subtle);">
                <div style="font-size:12px; color:var(--text-dim);">
                  Period Attendance Verification: 
                  <strong style="color:${isPresent ? '#10b981' : (isOD ? '#38bdf8' : '#ef4444')};">
                    ${log.attendanceStatus}
                  </strong>
                </div>
                ${!log.studentMarked ? `
                  <button class="topbar-btn" style="font-size:12px; padding:4px 12px;" onclick="PeriodLogModule.markPeriodAttendance('${log.id}')">
                    <span class="material-symbols-outlined" style="font-size:15px; color:#10b981;">check</span> Claim Period Attendance / OD
                  </button>
                ` : `
                  <span style="font-size:11.5px; color:#10b981; display:flex; align-items:center; gap:4px;">
                    <span class="material-symbols-outlined" style="font-size:16px;">verified</span> Verified with Biometric
                  </span>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  function filterByCourse(code) {
    selectedCourseFilter = code;
    const container = document.getElementById('view-period-log');
    if (container) renderPeriodLogView(container);
  }

  function downloadMaterial(filename) {
    Campus360App.showToast(`Downloading official course asset: ${filename}`, 'info');
  }

  function markPeriodAttendance(logId) {
    const state = Campus360Data.getState();
    const log = state.periodLogs.find(l => l.id === logId);
    if (log) {
      log.attendanceStatus = 'Present';
      log.studentMarked = true;
      Campus360Data.save();
      Campus360App.showToast('Attendance recorded and synced with academic ERP!', 'success');
      const container = document.getElementById('view-period-log');
      if (container) renderPeriodLogView(container);
    }
  }

  function openNewLogModal() {
    const state = Campus360Data.getState();
    const courses = state.courses;

    const modalContent = `
      <form id="newPeriodLogForm" onsubmit="PeriodLogModule.handleNewLogSubmit(event)">
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">
          Log the curriculum covered in your latest period so students receive notifications and access your materials.
        </p>

        <div class="form-row">
          <div class="form-group">
            <label>Course:</label>
            <select class="form-control" id="logCourseCode" required>
              ${courses.map(c => `<option value="${c.code}">${c.code} - ${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Period & Time:</label>
            <select class="form-control" id="logPeriodTime" required>
              <option value="Period 1 (09:00 AM)">Period 1 (09:00 AM)</option>
              <option value="Period 2 (10:00 AM)">Period 2 (10:00 AM)</option>
              <option value="Period 3 (11:00 AM)">Period 3 (11:00 AM)</option>
              <option value="Period 5 (01:30 PM)">Period 5 (01:30 PM)</option>
              <option value="Period 6 (02:30 PM)">Period 6 (02:30 PM)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Topic Taught Today:</label>
          <input type="text" class="form-control" id="logTopicInput" placeholder="e.g. Backpropagation Math & Tensor Flow Graphs" required>
        </div>

        <div class="form-group">
          <label>Key Takeaways & Homework Announcements:</label>
          <textarea class="form-control" id="logTakeawaysInput" rows="3" placeholder="Key derivation steps, assigned practice questions, upcoming test..." required></textarea>
        </div>

        <div class="form-group">
          <label>Attach Materials / Slide Link:</label>
          <input type="text" class="form-control" id="logMaterialName" placeholder="e.g. Lecture_Notes_Module4.pdf, Colab Notebook link">
        </div>

        <button type="submit" class="topbar-btn primary" style="width:100%; justify-content:center; margin-top:10px;">
          <span class="material-symbols-outlined">send</span> Publish Period Log & Notify Class
        </button>
      </form>
    `;

    Campus360App.showModal('Faculty Class Submission: Period Log', modalContent);
  }

  function handleNewLogSubmit(e) {
    e.preventDefault();
    const code = document.getElementById('logCourseCode').value;
    const periodTime = document.getElementById('logPeriodTime').value;
    const topic = document.getElementById('logTopicInput').value.trim();
    const takeaways = document.getElementById('logTakeawaysInput').value.trim();
    const materialName = document.getElementById('logMaterialName').value.trim();

    const state = Campus360Data.getState();
    const course = state.courses.find(c => c.code === code) || state.courses[0];

    const newLog = {
      id: 'LOG-' + Date.now(),
      date: 'Today, 11 Nov 2026',
      period: periodTime,
      courseCode: code,
      courseName: course.name,
      faculty: state.currentUser.name || course.faculty,
      room: course.cabin || 'LH-301',
      topicTaught: topic,
      keyTakeaways: takeaways,
      materials: materialName ? [{ name: materialName, size: '2.1 MB', type: 'pdf', url: '#' }] : [],
      attendanceStatus: 'Present',
      studentMarked: true,
      submittedAt: 'Just now'
    };

    Campus360Data.addPeriodLog(newLog);
    Campus360App.closeModal();
    Campus360App.showToast('Period log published successfully!', 'success');
    
    const container = document.getElementById('view-period-log');
    if (container) renderPeriodLogView(container);
  }

  return {
    renderPeriodLogView,
    filterByCourse,
    downloadMaterial,
    markPeriodAttendance,
    openNewLogModal,
    handleNewLogSubmit
  };
})();

