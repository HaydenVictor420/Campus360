// Campus360 - Marks & Projects Tracking Module
// Solution 4: View marks for internals, assignments, exams in one place; track all pending projects with deadlines

const MarksProjectsModule = (function () {
  function renderMarksProjectsView(container) {
    const state = Campus360Data.getState();
    const marksData = state.marksData;
    const courses = marksData.currentSemesterCourses;
    const projects = marksData.pendingProjects;

    let html = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">assignment_turned_in</span>
            Marks & Capstone Projects Command Center
          </h2>
          <p>Consolidated internal assessment scorecards, laboratory continuous evaluation, and real-time project deadline countdowns.</p>
        </div>
        <div class="view-header-actions">
          <button class="topbar-btn primary" onclick="MarksProjectsModule.openSubmitProjectModal()">
            <span class="material-symbols-outlined">upload_file</span> Submit Project Deliverable
          </button>
        </div>
      </div>

      <!-- Top KPI Row -->
      <div class="kpi-grid">
        <div class="kpi-card" style="--card-accent: #10b981;">
          <div>
            <div class="kpi-info-label">Internal Assessment Aggregate</div>
            <div class="kpi-info-value">44.6 <span style="font-size:15px; color:var(--text-dim);">/ 50</span></div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">trending_up</span>
              Top 5% in CSE 5th Semester
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">analytics</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #f59e0b;">
          <div>
            <div class="kpi-info-label">Pending Projects Active</div>
            <div class="kpi-info-value">${projects.length} Projects</div>
            <div class="kpi-info-sub warning">
              <span class="material-symbols-outlined" style="font-size:16px;">schedule</span>
              Next deadline in 3 days!
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">hourglass_top</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #3b82f6;">
          <div>
            <div class="kpi-info-label">Assignments Completed</div>
            <div class="kpi-info-value">12 <span style="font-size:15px; color:var(--text-dim);">/ 12</span></div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">verified</span>
              100% Submission Compliance
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">task</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #8b5cf6;">
          <div>
            <div class="kpi-info-label">Predicted Semester SGPA</div>
            <div class="kpi-info-value">8.78</div>
            <div class="kpi-info-sub">
              <span class="material-symbols-outlined" style="font-size:16px;">grade</span>
              Based on IA-1 & Model Scores
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">military_tech</span>
          </div>
        </div>
      </div>

      <!-- Pending Projects Tracker Section (Primary Solution Highlight) -->
      <div class="dashboard-panel" style="margin-bottom:28px;">
        <div class="panel-header">
          <div class="panel-header-left">
            <span class="material-symbols-outlined text-warning">pending_actions</span>
            <h3>Pending Projects & Milestones Radar</h3>
          </div>
          <span style="font-size:13px; color:var(--text-muted);">
            Never miss an evaluation deadline or code review sprint
          </span>
        </div>

        <div class="project-card-grid">
          ${projects.map(proj => {
            const urgencyClass = proj.urgency;
            return `
              <div class="project-card">
                <div>
                  <div class="project-header">
                    <div>
                      <span style="font-size:11px; font-weight:700; color:var(--secondary); text-transform:uppercase;">${proj.course}</span>
                      <h4 style="font-size:16px; font-weight:700; color:#fff; margin-top:4px;">${proj.title}</h4>
                    </div>
                    <span class="urgency-badge ${urgencyClass}">
                      ${proj.daysLeft <= 3 ? '🚨 ' + proj.daysLeft + ' Days Left' : proj.daysLeft + ' Days Left'}
                    </span>
                  </div>

                  <p style="font-size:13px; color:var(--text-muted); margin-top:10px;">
                    ${proj.description}
                  </p>

                  <div style="font-size:12px; color:var(--text-dim); margin-top:12px;">
                    <div>Faculty Guide: <strong style="color:#cbd5e1;">${proj.faculty}</strong></div>
                    <div>Team: <span style="color:#cbd5e1;">${proj.team.join(', ')}</span></div>
                    <div>Final Submission Deadline: <strong style="color:#fcd34d;">${proj.deadline}</strong></div>
                  </div>
                </div>

                <div>
                  <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
                    <span style="color:var(--text-muted);">Development Sprint Progress</span>
                    <strong style="color:var(--secondary);">${proj.progress}%</strong>
                  </div>
                  <div class="progress-track" style="margin-bottom:14px;">
                    <div class="progress-fill safe" style="width:${proj.progress}%;"></div>
                  </div>

                  <div style="display:flex; gap:8px;">
                    <button class="topbar-btn primary" style="flex:1; justify-content:center; font-size:12px;" onclick="MarksProjectsModule.openSubmitProjectModal('${proj.id}')">
                      <span class="material-symbols-outlined" style="font-size:16px;">upload</span> Submit PR / Zip
                    </button>
                    <button class="topbar-btn" style="font-size:12px;" onclick="Campus360App.showToast('Rubric rubric downloaded', 'info')">
                      <span class="material-symbols-outlined" style="font-size:16px;">rule</span> Rubric
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Marks Breakdown Table -->
      <div class="dashboard-panel">
        <div class="panel-header">
          <div class="panel-header-left">
            <span class="material-symbols-outlined text-secondary">view_list</span>
            <h3>Continuous Assessment & Examination Marks Card</h3>
          </div>
          <span style="font-size:12px; color:var(--text-dim);">Authenticated by Office of Controller of Exams</span>
        </div>

        <div style="overflow-x:auto;">
          <table class="cgpa-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Name</th>
                <th>IA-1 (50)</th>
                <th>IA-2 (50)</th>
                <th>Assignment (20)</th>
                <th>Lab Model (50)</th>
                <th>Internal Total (50)</th>
                <th>Expected Grade</th>
              </tr>
            </thead>
            <tbody>
              ${courses.map(c => `
                <tr>
                  <td><strong>${c.code}</strong></td>
                  <td>${c.name}</td>
                  <td><span style="font-weight:700; color:#38bdf8;">${c.internal1}</span></td>
                  <td><span style="font-weight:700; color:#38bdf8;">${c.internal2}</span></td>
                  <td><span style="font-weight:700; color:#10b981;">${c.assignment}</span></td>
                  <td><span style="font-weight:700; color:#a78bfa;">${c.labModel}</span></td>
                  <td><span style="font-weight:800; color:#fff; font-size:14px;">${c.totalInternal}</span> / 50</td>
                  <td>
                    <span class="nav-badge ${c.gradeExpected === 'O' ? 'success' : (c.gradeExpected.includes('A') ? 'primary' : 'warning')}">
                      ${c.gradeExpected} (${c.gradePoint} pts)
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function openSubmitProjectModal(projectId) {
    const state = Campus360Data.getState();
    const projects = state.marksData.pendingProjects;
    const defaultProject = projects.find(p => p.id === projectId) || projects[0];

    const modalContent = `
      <form id="projectSubmitForm" onsubmit="MarksProjectsModule.handleProjectSubmit(event)">
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">
          Submit your sprint deliverable, GitHub repository URL, and presentation slides to your faculty evaluator.
        </p>

        <div class="form-group">
          <label>Select Project:</label>
          <select class="form-control" id="submitProjectSelect" required>
            ${projects.map(p => `
              <option value="${p.id}" ${p.id === defaultProject.id ? 'selected' : ''}>
                ${p.course} — ${p.title}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label>GitHub Repository / Live Demo URL:</label>
          <input type="url" class="form-control" id="submitRepoUrl" placeholder="https://github.com/alexturner/campus-envision" required>
        </div>

        <div class="form-group">
          <label>Project Report / Presentation Deck (PDF):</label>
          <input type="text" class="form-control" id="submitFileName" placeholder="e.g. Capstone_Sprint3_Documentation.pdf" value="Sprint3_Submission_Final.pdf" required>
        </div>

        <div class="form-group">
          <label>Self-Assessed Sprint Completion (%):</label>
          <input type="number" min="50" max="100" value="95" class="form-control" id="submitProgressPercent" required>
        </div>

        <div class="form-group">
          <label>Comments / Release Notes for Faculty:</label>
          <textarea class="form-control" rows="3" placeholder="Key modules completed, test suite results, known limitations..."></textarea>
        </div>

        <button type="submit" class="topbar-btn primary" style="width:100%; justify-content:center; margin-top:10px;">
          <span class="material-symbols-outlined">cloud_upload</span> Deliver Project to Evaluator
        </button>
      </form>
    `;

    Campus360App.showModal('Capstone Project Submission Portal', modalContent);
  }

  function handleProjectSubmit(e) {
    e.preventDefault();
    const projId = document.getElementById('submitProjectSelect').value;
    const repoUrl = document.getElementById('submitRepoUrl').value;
    const progressVal = parseInt(document.getElementById('submitProgressPercent').value, 10) || 95;

    const state = Campus360Data.getState();
    const proj = state.marksData.pendingProjects.find(p => p.id === projId);
    if (proj) {
      proj.progress = progressVal;
      proj.status = 'Submitted & Under Review';
      Campus360Data.save();
      Campus360App.closeModal();
      Campus360App.showToast(`Project submitted successfully! Review pending with ${proj.faculty}.`, 'success');
      const container = document.getElementById('view-marks-projects');
      if (container) renderMarksProjectsView(container);
    }
  }

  return {
    renderMarksProjectsView,
    openSubmitProjectModal,
    handleProjectSubmit
  };
})();

