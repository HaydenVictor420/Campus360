/**
 * Campus360 - Cumulative CGPA Calculator & Graduation Planner Module
 * Calculates credit-weighted CGPA across multiple semesters and forecasts required SGPA for academic goals.
 */

window.initCgpaModule = function() {
  if (!window.App.cgpaSemesters || window.App.cgpaSemesters.length === 0) {
    window.App.cgpaSemesters = [
      { id: 'sem_1', semester: 'Semester 1', credits: 20, sgpa: 8.40 },
      { id: 'sem_2', semester: 'Semester 2', credits: 22, sgpa: 8.65 },
      { id: 'sem_3', semester: 'Semester 3', credits: 21, sgpa: 8.10 },
      { id: 'sem_4', semester: 'Semester 4 (Current)', credits: 20, sgpa: 8.25 }
    ];
  }
  renderCgpaTable();
};

function renderCgpaTable() {
  const tbody = document.getElementById('cgpaTableBody');
  if (!tbody) return;

  if (window.App.cgpaSemesters.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-6 text-muted">
          No semester records added yet. Click "Add Semester" to begin.
        </td>
      </tr>
    `;
    calculateCgpaMetrics();
    return;
  }

  tbody.innerHTML = window.App.cgpaSemesters.map((s, idx) => {
    const cred = parseFloat(s.credits) || 0;
    const sgpa = parseFloat(s.sgpa) || 0;
    const weightedPts = (cred * sgpa).toFixed(2);

    return `
      <tr id="sem_row_${s.id}">
        <td>
          <input type="text" class="form-input font-bold" style="min-width: 160px" value="${escapeHtml(s.semester)}" placeholder="e.g. Semester ${idx + 1}" oninput="updateCgpaSemesterField('${s.id}', 'semester', this.value)">
        </td>
        <td>
          <input type="number" class="form-input font-bold" style="width: 100px" min="0" max="40" step="1" value="${s.credits}" oninput="updateCgpaSemesterField('${s.id}', 'credits', this.value)">
        </td>
        <td>
          <input type="number" class="form-input font-mono font-bold" style="width: 110px" min="0" max="10" step="0.01" value="${s.sgpa}" oninput="updateCgpaSemesterField('${s.id}', 'sgpa', this.value)">
        </td>
        <td>
          <span class="font-mono font-bold text-teal-700" id="sem_wp_${s.id}">${weightedPts}</span>
        </td>
        <td>
          <button class="btn-icon text-danger" title="Remove Semester" onclick="removeCgpaSemesterRow('${s.id}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  calculateCgpaMetrics();
}

function updateCgpaSemesterField(semId, field, val) {
  const sem = window.App.cgpaSemesters.find(s => s.id === semId);
  if (!sem) return;

  if (field === 'credits') {
    sem.credits = Math.max(0, parseFloat(val) || 0);
  } else if (field === 'sgpa') {
    sem.sgpa = Math.max(0, Math.min(10, parseFloat(val) || 0));
  } else {
    sem[field] = val;
  }

  const wpSpan = document.getElementById(`sem_wp_${semId}`);
  if (wpSpan) {
    const cred = parseFloat(sem.credits) || 0;
    const sgpa = parseFloat(sem.sgpa) || 0;
    wpSpan.textContent = (cred * sgpa).toFixed(2);
  }

  calculateCgpaMetrics();
}

function calculateCgpaMetrics() {
  let totalCredits = 0;
  let totalWeightedPts = 0;

  window.App.cgpaSemesters.forEach(s => {
    const cred = parseFloat(s.credits) || 0;
    const sgpa = parseFloat(s.sgpa) || 0;
    totalCredits += cred;
    totalWeightedPts += (cred * sgpa);
  });

  const cgpaVal = totalCredits > 0 ? (Math.round((totalWeightedPts / totalCredits) * 100) / 100) : 0;
  const cgpaFormatted = cgpaVal.toFixed(2);

  // Conversion rule (Standard AICTE/UGC formula: Percentage = (CGPA - 0.75) * 10 or CGPA * 9.5)
  const approxPercentage = cgpaVal > 0 ? Math.max(0, ((cgpaVal - 0.75) * 10)).toFixed(1) : '0.0';

  const cgpaNumberEl = document.getElementById('calculatedCgpa');
  const totalCredsEl = document.getElementById('cgpaTotalCredits');
  const totalPtsEl = document.getElementById('cgpaTotalPoints');
  const pctEl = document.getElementById('cgpaPercentage');
  const classEl = document.getElementById('cgpaClassification');

  if (cgpaNumberEl) cgpaNumberEl.textContent = cgpaFormatted;
  if (totalCredsEl) totalCredsEl.textContent = totalCredits;
  if (totalPtsEl) totalPtsEl.textContent = totalWeightedPts.toFixed(2);
  if (pctEl) pctEl.textContent = `${approxPercentage}%`;

  if (classEl) {
    if (cgpaVal >= 8.0) {
      classEl.textContent = '🌟 First Class with Distinction';
      classEl.className = 'cgpa-classification bg-emerald-50 text-emerald-800 border-emerald-200';
    } else if (cgpaVal >= 6.75) {
      classEl.textContent = '✅ First Class';
      classEl.className = 'cgpa-classification bg-blue-50 text-blue-800 border-blue-200';
    } else if (cgpaVal >= 5.5) {
      classEl.textContent = '🔹 Second Class';
      classEl.className = 'cgpa-classification bg-amber-50 text-amber-800 border-amber-200';
    } else if (cgpaVal >= 4.0) {
      classEl.textContent = '🔸 Pass Class';
      classEl.className = 'cgpa-classification bg-slate-50 text-slate-800 border-slate-200';
    } else {
      classEl.textContent = '⚠️ Remedial / Arrears';
      classEl.className = 'cgpa-classification bg-rose-50 text-rose-800 border-rose-200';
    }
  }

  // Sync to dashboard
  const kpiCgpa = document.getElementById('kpiCumulativeCGPA');
  const kpiCgpaCredits = document.getElementById('kpiCgpaCredits');
  if (kpiCgpa) kpiCgpa.textContent = cgpaFormatted;
  if (kpiCgpaCredits) kpiCgpaCredits.textContent = `${totalCredits} total earned credits`;
}

function addCgpaSemesterRow() {
  const nextNum = window.App.cgpaSemesters.length + 1;
  const newRow = {
    id: 'sem_' + Date.now(),
    semester: `Semester ${nextNum}`,
    credits: 20,
    sgpa: 8.00
  };
  window.App.cgpaSemesters.push(newRow);
  renderCgpaTable();
  showToast(`Added Semester ${nextNum}`, 'info');
}

function removeCgpaSemesterRow(semId) {
  window.App.cgpaSemesters = window.App.cgpaSemesters.filter(s => s.id !== semId);
  renderCgpaTable();
  showToast('Removed semester row', 'info');
}

async function saveCgpaToBackend() {
  if (window.App.isBackendConnected) {
    try {
      const res = await fetch(`${API_BASE}/cgpa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semesters: window.App.cgpaSemesters })
      });
      if (res.ok) {
        showToast('CGPA records saved to database!', 'success');
        saveToLocalStorage();
        renderDashboard();
        return;
      }
    } catch (e) {
      console.warn('Backend CGPA save failed:', e);
    }
  }

  saveToLocalStorage();
  renderDashboard();
  showToast('CGPA records saved locally!', 'success');
}

// ==================== TARGET CGPA PLANNER ====================

function openTargetCgpaModal() {
  calculateTargetPlanner();
  document.getElementById('targetCgpaModal').classList.remove('hidden');
}

function closeTargetCgpaModal() {
  document.getElementById('targetCgpaModal').classList.add('hidden');
}

function calculateTargetPlanner() {
  const targetCgpa = parseFloat(document.getElementById('plannerTargetCgpa').value) || 8.5;
  const futureSemesters = parseInt(document.getElementById('plannerFutureSemesters').value, 10) || 4;
  const avgCredits = parseFloat(document.getElementById('plannerAvgCredits').value) || 20;

  let currentEarnedCredits = 0;
  let currentWeightedPts = 0;

  window.App.cgpaSemesters.forEach(s => {
    const cred = parseFloat(s.credits) || 0;
    const sgpa = parseFloat(s.sgpa) || 0;
    currentEarnedCredits += cred;
    currentWeightedPts += (cred * sgpa);
  });

  const futureTotalCredits = futureSemesters * avgCredits;
  const grandTotalCredits = currentEarnedCredits + futureTotalCredits;

  const targetTotalPts = targetCgpa * grandTotalCredits;
  const neededFuturePts = targetTotalPts - currentWeightedPts;
  const requiredSgpa = futureTotalCredits > 0 ? (neededFuturePts / futureTotalCredits) : 0;

  const resVal = document.getElementById('plannerRequiredSgpa');
  const resNote = document.getElementById('plannerNote');

  if (requiredSgpa <= 10.0 && requiredSgpa >= 0) {
    resVal.textContent = requiredSgpa.toFixed(2);
    resVal.className = 'planner-value text-emerald-700';
    if (requiredSgpa <= 8.0) {
      resNote.textContent = '🎉 Very achievable! Maintain consistent preparation.';
    } else if (requiredSgpa <= 9.0) {
      resNote.textContent = '💪 Strong target! Focus on high-credit core subjects.';
    } else {
      resNote.textContent = '🔥 High performance needed! Aim for top grades in all subjects.';
    }
  } else if (requiredSgpa > 10.0) {
    resVal.textContent = `${requiredSgpa.toFixed(2)} (Exceeds 10.0)`;
    resVal.className = 'planner-value text-rose-600';
    resNote.textContent = '⚠️ Mathematically impossible with remaining semesters alone. Adjust target or add elective credits.';
  } else {
    resVal.textContent = 'Achieved';
    resVal.className = 'planner-value text-teal-700';
    resNote.textContent = '✨ You have already satisfied or exceeded this target!';
  }
}

