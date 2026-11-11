// Campus360 - Syllabus Tracker & Exam-Prep Revision Module
// Solution 5: Syllabus split into topics & sub-topics with counters for covered vs yet-to-cover

const SyllabusTrackerModule = (function () {
  let activeCourseCode = 'CS301';

  function renderSyllabusView(container) {
    const state = Campus360Data.getState();
    const syllabusList = state.syllabusTracker;
    const activeCourse = syllabusList.find(c => c.courseCode === activeCourseCode) || syllabusList[0];

    // Compute overall statistics for active course
    let totalTopics = 0;
    let facultyCoveredCount = 0;
    let selfRevisedCount = 0;

    activeCourse.units.forEach(unit => {
      totalTopics += unit.topics.length;
      facultyCoveredCount += unit.topics.filter(t => t.facultyCovered).length;
      selfRevisedCount += unit.topics.filter(t => t.selfRevised).length;
    });

    const facultyPct = Math.round((facultyCoveredCount / totalTopics) * 100);
    const revisedPct = Math.round((selfRevisedCount / totalTopics) * 100);

    let html = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">checklist</span>
            Curriculum Breakdown & Exam-Prep Tracker
          </h2>
          <p>Unit-by-unit syllabus progression. Track what faculty have completed vs what you have self-revised for upcoming exams.</p>
        </div>
        <div class="view-header-actions">
          <button class="topbar-btn" onclick="Campus360App.showToast('Downloaded official university syllabus PDF', 'info')">
            <span class="material-symbols-outlined">download</span> Download Syllabus PDF
          </button>
        </div>
      </div>

      <!-- Course Switcher Pills -->
      <div class="day-selector-tabs">
        ${syllabusList.map(c => `
          <button class="day-tab-btn ${c.courseCode === activeCourse.courseCode ? 'active' : ''}" onclick="SyllabusTrackerModule.switchCourse('${c.courseCode}')">
            ${c.courseCode} — ${c.courseName.substring(0, 24)}
          </button>
        `).join('')}
      </div>

      <!-- Top Metric Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" style="--card-accent: #3b82f6;">
          <div>
            <div class="kpi-info-label">Faculty Syllabus Coverage</div>
            <div class="kpi-info-value" style="color:#38bdf8;">${facultyPct}%</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">verified</span>
              ${facultyCoveredCount} of ${totalTopics} Topics Completed
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">co_present</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #10b981;">
          <div>
            <div class="kpi-info-label">Your Personal Revision Progress</div>
            <div class="kpi-info-value" style="color:#10b981;">${revisedPct}%</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">task_alt</span>
              ${selfRevisedCount} Topics Revised by You
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">psychology</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #f59e0b;">
          <div>
            <div class="kpi-info-label">Remaining to Revise</div>
            <div class="kpi-info-value" style="color:#fcd34d;">${totalTopics - selfRevisedCount} Topics</div>
            <div class="kpi-info-sub warning">
              <span class="material-symbols-outlined" style="font-size:16px;">pending</span>
              Est. ~6.5 hours of study left
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">hourglass_empty</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #8b5cf6;">
          <div>
            <div class="kpi-info-label">Curriculum Lead Faculty</div>
            <div class="kpi-info-value" style="font-size:20px; margin-top:12px;">${activeCourse.faculty}</div>
            <div class="kpi-info-sub">
              <span class="material-symbols-outlined" style="font-size:16px;">domain</span>
              Department of Computer Science
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">account_circle</span>
          </div>
        </div>
      </div>

      <!-- Unit Accordions -->
      <div style="margin-top:24px;">
        ${activeCourse.units.map(unit => {
          const unitTotal = unit.topics.length;
          const unitFaculty = unit.topics.filter(t => t.facultyCovered).length;
          const unitRevised = unit.topics.filter(t => t.selfRevised).length;
          const unitFacultyPct = Math.round((unitFaculty / unitTotal) * 100);

          return `
            <div class="syllabus-course-accordion">
              <div class="syllabus-accordion-header">
                <div>
                  <span class="nav-badge primary">Unit ${unit.unitNo}</span>
                  <span style="font-size:16px; font-weight:700; color:#fff; margin-left:10px;">${unit.title}</span>
                </div>
                <div style="display:flex; align-items:center; gap:20px;">
                  <div style="text-align:right;">
                    <div style="font-size:12px; color:var(--text-muted);">
                      Faculty: <strong style="color:#38bdf8;">${unitFaculty}/${unitTotal} (${unitFacultyPct}%)</strong> • 
                      Self-Revised: <strong style="color:#10b981;">${unitRevised}/${unitTotal}</strong>
                    </div>
                  </div>
                  <span class="material-symbols-outlined text-dim">expand_more</span>
                </div>
              </div>

              <div class="unit-card">
                <div style="display:flex; flex-direction:column; gap:8px;">
                  ${unit.topics.map(t => `
                    <div class="topic-item-row">
                      <label class="topic-checkbox-label">
                        <input type="checkbox" ${t.selfRevised ? 'checked' : ''} onchange="SyllabusTrackerModule.handleTopicToggle('${activeCourse.courseCode}', ${unit.unitNo}, '${t.name.replace(/'/g, "\\'")}', 'selfRevised')">
                        <span style="${t.selfRevised ? 'color:#10b981; font-weight:600;' : ''}">${t.name}</span>
                      </label>

                      <div style="display:flex; align-items:center; gap:10px;">
                        <span class="nav-badge ${t.facultyCovered ? 'success' : 'danger'}" style="font-size:10.5px;">
                          ${t.facultyCovered ? '✓ Covered in Lecture' : '⏳ Yet to Cover'}
                        </span>
                        ${t.selfRevised ? `
                          <span style="font-size:11px; color:#10b981; font-weight:600;">✓ Revised</span>
                        ` : `
                          <span style="font-size:11px; color:var(--text-dim);">Unrevised</span>
                        `}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  function switchCourse(code) {
    activeCourseCode = code;
    const container = document.getElementById('view-syllabus');
    if (container) renderSyllabusView(container);
  }

  function handleTopicToggle(courseCode, unitNo, topicName, type) {
    Campus360Data.toggleSyllabusTopic(courseCode, unitNo, topicName, type);
    Campus360App.showToast('Revision status updated & synced!', 'success');
    const container = document.getElementById('view-syllabus');
    if (container) renderSyllabusView(container);
  }

  return {
    renderSyllabusView,
    switchCourse,
    handleTopicToggle
  };
})();

