/**
 * Campus360 - Semester GPA Calculator Module
 * Calculates weighted SGPA based on subject credits and grade points using configurable grading scales.
 */

window.initGpaModule = function() {
  if (!window.App.gpaCourses || window.App.gpaCourses.length === 0) {
    // Populate from attendance subjects or defaults
    populateDefaultGpaCourses();
  }
  renderGpaTable();
};

function populateDefaultGpaCourses() {
  if (window.App.attendance && window.App.attendance.length > 0) {
    window.App.gpaCourses = window.App.attendance.map((att, i) => ({
      id: 'gpa_' + Date.now() + '_' + i,
      code: att.code || `SUB-${i + 1}`,
      name: att.name,
      credits: 4,
      grade: 'A',
      points: 8
    }));
  } else {
    window.App.gpaCourses = [
      { id: 'gpa_1', code: 'CS301', name: 'Mathematics III', credits: 4, grade: 'A', points: 8 },
      { id: 'gpa_2', code: 'CS302', name: 'Physics & Engineering Electromagnetics', credits: 4, grade: 'B+', points: 7 },
      { id: 'gpa_3', code: 'CS303', name: 'Programming in C/C++', credits: 3, grade: 'O', points: 10 },
      { id: 'gpa_4', code: 'CS304', name: 'Data Structures & Algorithms', credits: 4, grade: 'A+', points: 9 }
    ];
  }
}

function renderGpaTable() {
  const tbody = document.getElementById('gpaTableBody');
  if (!tbody) return;

  const gradeScale = window.App.settings.gradeScale || [];

  if (window.App.gpaCourses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-6 text-muted">
          No courses entered. Click "Add Course Row" to start calculating your Semester GPA.
        </td>
      </tr>
    `;
    calculateGpaMetrics();
    return;
  }

  tbody.innerHTML = window.App.gpaCourses.map((c, idx) => {
    // Generate dropdown options from settings gradeScale
    let gradeOptions = `<option value="">Select Grade</option>`;
    gradeScale.forEach(gs => {
      const isSelected = (c.grade || '').toUpperCase() === gs.grade.toUpperCase();
      gradeOptions += `<option value="${gs.grade}" data-points="${gs.points}" ${isSelected ? 'selected' : ''}>${gs.grade} (${gs.points} pts)</option>`;
    });

    const creditVal = parseFloat(c.credits) || 0;
    const pointVal = parseFloat(c.points) || 0;
    const creditPoints = (creditVal * pointVal).toFixed(1);

    return `
      <tr id="gpa_row_${c.id}">
        <td>
          <input type="text" class="form-input font-mono text-xs" style="width: 100px" value="${escapeHtml(c.code || '')}" placeholder="Code" oninput="updateGpaCourseField('${c.id}', 'code', this.value)">
        </td>
        <td>
          <input type="text" class="form-input" style="min-width: 180px" value="${escapeHtml(c.name || '')}" placeholder="Course Name" oninput="updateGpaCourseField('${c.id}', 'name', this.value)">
        </td>
        <td>
          <input type="number" class="form-input font-bold" style="width: 80px" min="0" max="15" step="0.5" value="${c.credits}" oninput="updateGpaCourseField('${c.id}', 'credits', this.value)">
        </td>
        <td>
          <select class="form-select font-semibold" style="width: 130px" onchange="handleGpaGradeChange('${c.id}', this)">
            ${gradeOptions}
          </select>
        </td>
        <td>
          <input type="number" class="form-input font-mono" style="width: 80px" min="0" max="10" step="0.1" value="${c.points}" oninput="updateGpaCourseField('${c.id}', 'points', this.value)">
        </td>
        <td>
          <span class="font-mono font-bold text-primary" id="cp_${c.id}">${creditPoints}</span>
        </td>
        <td>
          <button class="btn-icon text-danger" title="Remove course" onclick="removeGpaRow('${c.id}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  calculateGpaMetrics();
}

function handleGpaGradeChange(courseId, selectEl) {
  const selectedGrade = selectEl.value;
  const selectedOption = selectEl.options[selectEl.selectedIndex];
  const points = selectedOption ? parseFloat(selectedOption.getAttribute('data-points')) : 0;

  const course = window.App.gpaCourses.find(c => c.id === courseId);
  if (course) {
    course.grade = selectedGrade;
    course.points = isNaN(points) ? 0 : points;
  }

  // Update input row without full re-render to keep focus
  const row = document.getElementById(`gpa_row_${courseId}`);
  if (row) {
    const ptInput = row.querySelector('input[type="number"][min="0"][max="10"]');
    if (ptInput) ptInput.value = course.points;
    const cpSpan = document.getElementById(`cp_${courseId}`);
    if (cpSpan) cpSpan.textContent = ((parseFloat(course.credits) || 0) * course.points).toFixed(1);
  }

  calculateGpaMetrics();
}

function updateGpaCourseField(courseId, field, val) {
  const course = window.App.gpaCourses.find(c => c.id === courseId);
  if (!course) return;

  if (field === 'credits') {
    course.credits = Math.max(0, parseFloat(val) || 0);
  } else if (field === 'points') {
    course.points = Math.max(0, parseFloat(val) || 0);
  } else {
    course[field] = val;
  }

  const cpSpan = document.getElementById(`cp_${courseId}`);
  if (cpSpan) {
    const cred = parseFloat(course.credits) || 0;
    const pt = parseFloat(course.points) || 0;
    cpSpan.textContent = (cred * pt).toFixed(1);
  }

  calculateGpaMetrics();
}

function calculateGpaMetrics() {
  let totalCredits = 0;
  let totalPoints = 0;

  window.App.gpaCourses.forEach(c => {
    // Only include courses that have a defined grade or points
    const cred = parseFloat(c.credits) || 0;
    const pt = parseFloat(c.points) || 0;
    if (c.grade || pt > 0) {
      totalCredits += cred;
      totalPoints += (cred * pt);
    }
  });

  const sgpa = totalCredits > 0 ? (Math.round((totalPoints / totalCredits) * 100) / 100).toFixed(2) : '0.00';

  const gpaNumberEl = document.getElementById('calculatedGpa');
  const totalCredsEl = document.getElementById('gpaTotalCredits');
  const totalPointsEl = document.getElementById('gpaTotalPoints');

  if (gpaNumberEl) gpaNumberEl.textContent = sgpa;
  if (totalCredsEl) totalCredsEl.textContent = totalCredits;
  if (totalPointsEl) totalPointsEl.textContent = totalPoints.toFixed(2);

  // Sync to dashboard
  const kpiGpa = document.getElementById('kpiSemesterGPA');
  const kpiGpaCredits = document.getElementById('kpiGpaCredits');
  if (kpiGpa) kpiGpa.textContent = sgpa;
  if (kpiGpaCredits) kpiGpaCredits.textContent = `${totalCredits} registered credits`;
}

function addGpaRow() {
  const newRow = {
    id: 'gpa_' + Date.now(),
    code: 'CS' + (300 + window.App.gpaCourses.length + 1),
    name: 'New Course ' + (window.App.gpaCourses.length + 1),
    credits: 3,
    grade: 'A',
    points: 8
  };
  window.App.gpaCourses.push(newRow);
  renderGpaTable();
  showToast('Added course row', 'info');
}

function removeGpaRow(courseId) {
  window.App.gpaCourses = window.App.gpaCourses.filter(c => c.id !== courseId);
  renderGpaTable();
  showToast('Removed course row', 'info');
}

function resetGpaForm() {
  openConfirmModal('Reset GPA Calculator', 'Clear all rows and restore course list from your attendance timetable?', () => {
    populateDefaultGpaCourses();
    renderGpaTable();
    showToast('Reset GPA courses', 'info');
  });
}

async function saveGpaToBackend() {
  if (window.App.isBackendConnected) {
    try {
      const res = await fetch(`${API_BASE}/gpa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: window.App.gpaCourses })
      });
      if (res.ok) {
        showToast('Semester GPA saved to database!', 'success');
        saveToLocalStorage();
        renderDashboard();
        return;
      }
    } catch (e) {
      console.warn('Backend save failed:', e);
    }
  }

  saveToLocalStorage();
  renderDashboard();
  showToast('Semester GPA saved locally!', 'success');
}

function transferGpaToCgpa() {
  calculateGpaMetrics();
  const sgpa = parseFloat(document.getElementById('calculatedGpa').textContent) || 0;
  const credits = parseFloat(document.getElementById('gpaTotalCredits').textContent) || 0;

  if (credits === 0) {
    showToast('Add course credits before pushing to CGPA', 'error');
    return;
  }

  // Find or create current semester entry in CGPA
  let curSem = window.App.cgpaSemesters.find(s => s.semester.includes('Current') || s.semester === 'Semester 4');
  if (curSem) {
    curSem.credits = credits;
    curSem.sgpa = sgpa;
  } else {
    window.App.cgpaSemesters.push({
      id: 'sem_' + Date.now(),
      semester: `Semester ${window.App.cgpaSemesters.length + 1} (Current)`,
      credits,
      sgpa
    });
  }

  switchTab('cgpa');
  showToast(`SGPA (${sgpa}) transferred to CGPA Calculator!`, 'success');
}

