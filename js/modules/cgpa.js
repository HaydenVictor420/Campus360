// Campus360 - Dynamic CGPA & SGPA Calculation Module
// Solution 1: GPA/CGPA calculator that updates dynamically in real-time as you enter or adjust grades

const CGPAModule = (function () {
  const gradeScale = {
    'O': { point: 10, label: 'Outstanding (90-100%)' },
    'A+': { point: 9, label: 'Excellent (80-89%)' },
    'A': { point: 8, label: 'Very Good (70-79%)' },
    'B+': { point: 7, label: 'Good (60-69%)' },
    'B': { point: 6, label: 'Above Average (55-59%)' },
    'C': { point: 5, label: 'Pass (50-54%)' },
    'RA': { point: 0, label: 'Reappear / Fail (<50%)' }
  };

  function renderCGPAView(container) {
    const state = Campus360Data.getState();
    const marksData = state.marksData;
    const history = marksData.cgpaHistory;
    const currentCourses = marksData.currentSemesterCourses;

    // Calculate historic CGPA prior to current semester
    const pastSems = history.filter(s => !s.semester.includes('Current'));
    const totalPastCredits = pastSems.reduce((acc, s) => acc + s.credits, 0);
    const totalPastPoints = pastSems.reduce((acc, s) => acc + (s.sgpa * s.credits), 0);
    const baseCGPA = (totalPastPoints / totalPastCredits).toFixed(2);

    let html = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">calculate</span>
            Dynamic GPA & CGPA Simulation Engine
          </h2>
          <p>Real-time calculation updating instantly as you enter grades, with historical semester metrics and target CGPA career planner.</p>
        </div>
        <div class="view-header-actions">
          <button class="topbar-btn" onclick="CGPAModule.resetToDefaultGrades()">
            <span class="material-symbols-outlined">restart_alt</span> Reset to Actuals
          </button>
          <button class="topbar-btn primary" onclick="CGPAModule.addNewCourseRow()">
            <span class="material-symbols-outlined">add</span> Add Elective
          </button>
        </div>
      </div>

      <!-- Top KPI Row -->
      <div class="kpi-grid">
        <div class="kpi-card" style="--card-accent: #4f46e5;">
          <div>
            <div class="kpi-info-label">Projected Cumulative CGPA</div>
            <div class="kpi-info-value" id="kpiCGPAValue">8.74</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">trending_up</span>
              First Class with Distinction Track
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">workspace_premium</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #06b6d4;">
          <div>
            <div class="kpi-info-label">Current Semester SGPA</div>
            <div class="kpi-info-value" id="kpiSGPAValue">8.78</div>
            <div class="kpi-info-sub">
              <span class="material-symbols-outlined" style="font-size:16px;">dynamic_feed</span>
              Updates live with table below
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">grade</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #10b981;">
          <div>
            <div class="kpi-info-label">Total Credits Earned</div>
            <div class="kpi-info-value" id="kpiCreditsValue">110 <span style="font-size:15px; color:var(--text-dim);">/ 160</span></div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">check_circle</span>
              On Track for Graduation (2027)
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">school</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #8b5cf6;">
          <div>
            <div class="kpi-info-label">Historic Base CGPA</div>
            <div class="kpi-info-value">${baseCGPA}</div>
            <div class="kpi-info-sub">
              <span class="material-symbols-outlined" style="font-size:16px;">history</span>
              Semesters 1 - 4 Consolidated
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">insights</span>
          </div>
        </div>
      </div>

      <!-- Main Bento Grid -->
      <div class="bento-grid">
        <!-- Interactive Grade Entry Matrix -->
        <div class="dashboard-panel">
          <div class="panel-header">
            <div class="panel-header-left">
              <span class="material-symbols-outlined text-secondary">table_view</span>
              <h3>Current Semester Course Gradebook (5th Sem)</h3>
            </div>
            <span style="font-size:12px; color:var(--text-dim);">Adjust grades to preview live SGPA</span>
          </div>

          <div style="overflow-x:auto;">
            <table class="cgpa-table" id="cgpaCalcTable">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Subject Name</th>
                  <th>Credits</th>
                  <th>Internal Total</th>
                  <th>Expected Grade</th>
                  <th>Points</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="cgpaTableBody">
                ${currentCourses.map((c, index) => `
                  <tr data-index="${index}">
                    <td><strong>${c.code}</strong></td>
                    <td>${c.name}</td>
                    <td>
                      <input type="number" min="1" max="6" value="${c.credits}" class="form-control credit-input" style="width:65px; padding:4px 8px; font-weight:700;" onchange="CGPAModule.recalculate()">
                    </td>
                    <td>
                      <span style="font-weight:700; color:#38bdf8;">${c.totalInternal} / 50</span>
                    </td>
                    <td>
                      <select class="grade-select" onchange="CGPAModule.recalculate()">
                        ${Object.keys(gradeScale).map(g => `
                          <option value="${g}" ${g === c.gradeExpected ? 'selected' : ''}>
                            ${g} (${gradeScale[g].point} pts)
                          </option>
                        `).join('')}
                      </select>
                    </td>
                    <td class="row-points" style="font-weight:800; color:#10b981;">
                      ${c.credits * gradeScale[c.gradeExpected].point}
                    </td>
                    <td>
                      <button style="background:transparent; border:none; color:var(--text-dim); cursor:pointer;" onclick="CGPAModule.deleteCourseRow(${index})">
                        <span class="material-symbols-outlined" style="font-size:18px;">delete</span>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="margin-top:20px; padding:14px; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <span style="font-size:13px; color:var(--text-muted);">Semester Formula:</span>
              <code style="font-size:12px; color:#a5b4fc; margin-left:8px;">SGPA = Σ(Credit × GradePoint) / Σ(Credits)</code>
            </div>
            <div style="font-size:14px; font-weight:700; color:#fff;">
              Computed SGPA: <span id="tableLiveSGPA" style="color:var(--secondary); font-size:18px;">8.78</span>
            </div>
          </div>
        </div>

        <!-- Semester Progress & Target CGPA Planner -->
        <div style="display:flex; flex-direction:column; gap:20px;">
          <!-- Target CGPA Planner -->
          <div class="dashboard-panel">
            <div class="panel-header">
              <div class="panel-header-left">
                <span class="material-symbols-outlined text-warning">flag</span>
                <h3>Target CGPA Goal Planner</h3>
              </div>
            </div>
            <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">Calculate the minimum SGPA you need in subsequent semesters to graduate with your dream score.</p>

            <div class="form-group">
              <label>Desired Target CGPA by Graduation:</label>
              <input type="number" step="0.05" min="6.0" max="10.0" value="9.00" class="form-control" id="targetCGPAInput" oninput="CGPAModule.calculateTargetGoal()">
            </div>

            <div class="form-group">
              <label>Remaining Semesters:</label>
              <select class="form-control" id="remainingSemsSelect" onchange="CGPAModule.calculateTargetGoal()">
                <option value="3">3 Semesters (Sem 6, 7, 8)</option>
                <option value="2">2 Semesters (Sem 7, 8)</option>
                <option value="1">1 Semester (Sem 8)</option>
              </select>
            </div>

            <div id="targetGoalResultBox" style="background:rgba(255,255,255,0.04); border-radius:var(--radius-sm); padding:16px; margin-top:12px; border-left:3px solid var(--warning);">
              <!-- Rendered dynamically -->
            </div>
          </div>

          <!-- Historic Semester Trend -->
          <div class="dashboard-panel">
            <div class="panel-header">
              <div class="panel-header-left">
                <span class="material-symbols-outlined text-primary-light">timeline</span>
                <h3>Semester Performance Record</h3>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px;">
              ${history.map(s => `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border-radius:6px; background:rgba(255,255,255,0.03);">
                  <span style="font-size:13px; font-weight:600; color:#fff;">${s.semester}</span>
                  <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-size:12px; color:var(--text-dim);">${s.credits} Credits</span>
                    <span style="font-size:14px; font-weight:800; color:var(--secondary);">${s.sgpa}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    CGPAModule.recalculate();
    CGPAModule.calculateTargetGoal();
  }

  function recalculate() {
    const table = document.getElementById('cgpaCalcTable');
    if (!table) return;

    const rows = table.querySelectorAll('#cgpaTableBody tr');
    let totalCredits = 0;
    let totalQualityPoints = 0;

    rows.forEach(row => {
      const creditInput = row.querySelector('.credit-input');
      const gradeSelect = row.querySelector('.grade-select');
      const pointsCell = row.querySelector('.row-points');

      const credits = parseFloat(creditInput.value) || 0;
      const grade = gradeSelect.value;
      const point = gradeScale[grade] ? gradeScale[grade].point : 0;
      const rowQuality = credits * point;

      if (pointsCell) pointsCell.textContent = rowQuality.toFixed(0);

      totalCredits += credits;
      totalQualityPoints += rowQuality;
    });

    const computedSGPA = totalCredits > 0 ? (totalQualityPoints / totalCredits).toFixed(2) : '0.00';

    const liveSGPASpan = document.getElementById('tableLiveSGPA');
    if (liveSGPASpan) liveSGPASpan.textContent = computedSGPA;

    const kpiSGPA = document.getElementById('kpiSGPAValue');
    if (kpiSGPA) kpiSGPA.textContent = computedSGPA;

    // Past semesters consolidated
    const state = Campus360Data.getState();
    const pastSems = state.marksData.cgpaHistory.filter(s => !s.semester.includes('Current'));
    const totalPastCredits = pastSems.reduce((acc, s) => acc + s.credits, 0);
    const totalPastPoints = pastSems.reduce((acc, s) => acc + (s.sgpa * s.credits), 0);

    const overallCredits = totalPastCredits + totalCredits;
    const overallPoints = totalPastPoints + totalQualityPoints;
    const computedCGPA = (overallPoints / overallCredits).toFixed(2);

    const kpiCGPA = document.getElementById('kpiCGPAValue');
    if (kpiCGPA) kpiCGPA.textContent = computedCGPA;

    const kpiCredits = document.getElementById('kpiCreditsValue');
    if (kpiCredits) kpiCredits.innerHTML = `${overallCredits} <span style="font-size:15px; color:var(--text-dim);">/ 160</span>`;

    // Re-evaluate target planner with new CGPA
    calculateTargetGoal(parseFloat(computedCGPA), overallCredits);
  }

  function calculateTargetGoal(currentCGPA, currentCreditsTotal) {
    const targetInput = document.getElementById('targetCGPAInput');
    const remainingSelect = document.getElementById('remainingSemsSelect');
    const resultBox = document.getElementById('targetGoalResultBox');
    if (!targetInput || !remainingSelect || !resultBox) return;

    const targetCGPA = parseFloat(targetInput.value) || 9.0;
    const remainingSems = parseInt(remainingSelect.value, 10) || 3;

    // Estimate 22 credits per remaining semester
    const remainingCredits = remainingSems * 22;
    const totalProgramCredits = (currentCreditsTotal || 110) + remainingCredits;
    const requiredTotalPoints = targetCGPA * totalProgramCredits;
    const earnedPointsSoFar = (currentCGPA || 8.74) * (currentCreditsTotal || 110);
    const neededPoints = requiredTotalPoints - earnedPointsSoFar;
    const requiredSGPA = (neededPoints / remainingCredits).toFixed(2);

    let feasibilityHtml = '';
    if (requiredSGPA > 10.0) {
      feasibilityHtml = `
        <div style="color:#ef4444; font-size:13px; font-weight:700;">
          ❌ Mathematically Unachievable: Requires SGPA of ${requiredSGPA} (Max is 10.0). Consider adjusting your goal to ${( (earnedPointsSoFar + 10.0 * remainingCredits) / totalProgramCredits ).toFixed(2)}.
        </div>
      `;
    } else if (requiredSGPA <= 10.0 && requiredSGPA > 9.0) {
      feasibilityHtml = `
        <div style="color:#f59e0b; font-size:13px; font-weight:700;">
          ⚡ Challenging Goal: You need an average SGPA of <span style="color:#fff; font-size:16px;">${requiredSGPA}</span> across the next ${remainingSems} semesters (requires mostly 'O' & 'A+' grades).
        </div>
      `;
    } else {
      feasibilityHtml = `
        <div style="color:#10b981; font-size:13px; font-weight:700;">
          🎯 Achievable: Maintain an average SGPA of <span style="color:#fff; font-size:16px;">${requiredSGPA}</span> in your remaining ${remainingSems} semesters to hit ${targetCGPA}.
        </div>
      `;
    }

    resultBox.innerHTML = `
      ${feasibilityHtml}
      <div style="font-size:11.5px; color:var(--text-dim); margin-top:8px;">
        Assuming ~22 credits/semester across ${remainingSems} remaining terms (${remainingCredits} future credits).
      </div>
    `;
  }

  function addNewCourseRow() {
    const tbody = document.getElementById('cgpaTableBody');
    if (!tbody) return;

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td><strong>CS399</strong></td>
      <td>Open Professional Elective</td>
      <td>
        <input type="number" min="1" max="6" value="3" class="form-control credit-input" style="width:65px; padding:4px 8px; font-weight:700;" onchange="CGPAModule.recalculate()">
      </td>
      <td>
        <span style="font-weight:700; color:#38bdf8;">45.0 / 50</span>
      </td>
      <td>
        <select class="grade-select" onchange="CGPAModule.recalculate()">
          ${Object.keys(gradeScale).map(g => `
            <option value="${g}" ${g === 'A+' ? 'selected' : ''}>
              ${g} (${gradeScale[g].point} pts)
            </option>
          `).join('')}
        </select>
      </td>
      <td class="row-points" style="font-weight:800; color:#10b981;">27</td>
      <td>
        <button style="background:transparent; border:none; color:var(--text-dim); cursor:pointer;" onclick="this.closest('tr').remove(); CGPAModule.recalculate();">
          <span class="material-symbols-outlined" style="font-size:18px;">delete</span>
        </button>
      </td>
    `;
    tbody.appendChild(newRow);
    recalculate();
    Campus360App.showToast('New Elective Course added to CGPA simulator!', 'info');
  }

  function deleteCourseRow(index) {
    const tbody = document.getElementById('cgpaTableBody');
    if (!tbody) return;
    const row = tbody.querySelector(`tr[data-index="${index}"]`);
    if (row) {
      row.remove();
      recalculate();
      Campus360App.showToast('Course removed from projection', 'info');
    }
  }

  function resetToDefaultGrades() {
    Campus360App.navigateTo('cgpa');
    Campus360App.showToast('Reset gradebook to official records.', 'success');
  }

  return {
    renderCGPAView,
    recalculate,
    calculateTargetGoal,
    addNewCourseRow,
    deleteCourseRow,
    resetToDefaultGrades
  };
})();

