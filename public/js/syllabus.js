/**
 * Campus360 - Syllabus Completion Tracker Module
 * Calculates subject-wise unit & topic coverage, completion percentages, and milestone progress.
 */

window.initSyllabusModule = function() {
  renderSyllabusCards();
};

function renderSyllabusCards() {
  const container = document.getElementById('syllabusCardsContainer');
  const heroPct = document.getElementById('syllabusHeroPct');
  const heroFill = document.getElementById('syllabusHeroFill');
  const heroTopics = document.getElementById('syllabusHeroTopics');
  const heroStatus = document.getElementById('syllabusHeroStatus');

  if (!container) return;

  const syllabusList = window.App.syllabus || [];

  // Calculate overall metrics
  let grandTotalTopics = 0;
  let grandCompletedTopics = 0;

  syllabusList.forEach(item => {
    (item.units || []).forEach(u => {
      grandTotalTopics += (parseInt(u.topicsTotal, 10) || 0);
      grandCompletedTopics += (parseInt(u.topicsCompleted, 10) || 0);
    });
  });

  const overallPct = grandTotalTopics > 0 
    ? Math.round((grandCompletedTopics / grandTotalTopics) * 100) 
    : 0;

  if (heroPct) heroPct.textContent = `${overallPct}%`;
  if (heroFill) heroFill.style.width = `${overallPct}%`;
  if (heroTopics) heroTopics.textContent = `${grandCompletedTopics} / ${grandTotalTopics} Total Topics Covered`;
  if (heroStatus) {
    if (overallPct >= 80) heroStatus.textContent = 'Overall Status: Exam Ready / Ahead';
    else if (overallPct >= 50) heroStatus.textContent = 'Overall Status: On Track';
    else heroStatus.textContent = 'Overall Status: Needs Urgent Review';
  }

  if (syllabusList.length === 0) {
    container.innerHTML = `
      <div class="card full-width text-center py-8 text-muted">
        <h3>No course syllabus records tracked yet</h3>
        <p class="mt-2 text-sm">Add a subject from the Attendance tab or click "Add Subject Syllabus" above.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = syllabusList.map(item => {
    let subTotal = 0;
    let subComp = 0;
    const units = item.units || [];

    units.forEach(u => {
      subTotal += (parseInt(u.topicsTotal, 10) || 0);
      subComp += (parseInt(u.topicsCompleted, 10) || 0);
    });

    const subPct = subTotal > 0 ? Math.round((subComp / subTotal) * 100) : 0;
    let statusClass = 'pill-neutral';
    let statusLabel = 'Not Started';

    if (subPct === 100) {
      statusClass = 'pill-safe';
      statusLabel = 'Completed';
    } else if (subPct >= 60) {
      statusClass = 'pill-safe';
      statusLabel = 'On Track';
    } else if (subPct > 0) {
      statusClass = 'pill-warning';
      statusLabel = 'In Progress';
    }

    const unitsHtml = units.map(u => {
      const tot = parseInt(u.topicsTotal, 10) || 0;
      const comp = parseInt(u.topicsCompleted, 10) || 0;
      const uPct = tot > 0 ? Math.round((comp / tot) * 100) : 0;
      const isDone = uPct === 100;

      return `
        <div class="unit-item">
          <div class="unit-item-top">
            <span class="unit-title-text">${escapeHtml(u.title || `Unit ${u.unitNo}`)}</span>
            <div class="unit-topic-controls">
              <button class="unit-btn" title="Decrease completed topic" onclick="adjustUnitProgress('${item.id}', ${u.unitNo}, -1)">&minus;</button>
              <span class="font-mono text-xs font-bold px-1">${comp}/${tot}</span>
              <button class="unit-btn" title="Increase completed topic" onclick="adjustUnitProgress('${item.id}', ${u.unitNo}, 1)">&#43;</button>
              <button class="btn-icon" title="Edit Unit Title" onclick="openEditUnitModal('${item.id}', ${u.unitNo}, '${escapeHtml(u.title || '')}', ${tot}, ${comp})">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
            </div>
          </div>
          <div class="unit-progress-track">
            <div class="unit-progress-fill ${isDone ? 'done' : ''}" style="width: ${uPct}%"></div>
          </div>
          <div class="flex justify-between text-xs text-muted">
            <span>${uPct}% Finished</span>
            <span>${u.status || (isDone ? 'Completed' : (comp > 0 ? 'In Progress' : 'Not Started'))}</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="syllabus-card" id="syl_card_${item.id}">
        <div>
          <div class="syllabus-card-header">
            <div>
              <span class="syllabus-subject-code">${escapeHtml(item.subjectCode || 'SUB')}</span>
              <h3 class="syllabus-subject-title">${escapeHtml(item.subjectName)}</h3>
            </div>
            <span class="status-pill ${statusClass}">${statusLabel}</span>
          </div>

          <div class="flex justify-between items-baseline mb-1">
            <span class="text-xs text-muted">Subject Coverage</span>
            <span class="font-bold text-sm">${subPct}% (${subComp}/${subTotal} Topics)</span>
          </div>

          <div class="progress-bar-track mb-3">
            <div class="progress-bar-fill progress-blue" style="width: ${subPct}%"></div>
          </div>

          <div class="unit-list">
            ${unitsHtml}
          </div>
        </div>

        <div class="pt-2 border-t border-slate-100 flex justify-between items-center">
          <button class="btn btn-sm btn-outline" onclick="openAddUnitModal('${item.id}')">+ Add Unit</button>
          <span class="text-xs text-muted">${units.length} Modules Total</span>
        </div>
      </div>
    `;
  }).join('');
}

// Quick Topic +1 / -1
async function adjustUnitProgress(subjectId, unitNo, delta) {
  const syl = window.App.syllabus.find(s => s.id === subjectId);
  if (!syl) return;

  const unit = syl.units.find(u => u.unitNo === unitNo);
  if (!unit) return;

  const tot = parseInt(unit.topicsTotal, 10) || 0;
  let comp = parseInt(unit.topicsCompleted, 10) || 0;
  comp = Math.max(0, Math.min(tot, comp + delta));
  unit.topicsCompleted = comp;

  if (comp === tot) unit.status = 'Completed';
  else if (comp > 0) unit.status = 'In Progress';
  else unit.status = 'Not Started';

  if (window.App.isBackendConnected) {
    try {
      await fetch(`${API_BASE}/syllabus/${subjectId}/unit/${unitNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicsCompleted: comp, status: unit.status })
      });
    } catch (e) {
      console.warn('Backend sync failed for syllabus unit:', e);
    }
  }

  saveToLocalStorage();
  renderSyllabusCards();
  renderDashboard();
}

// ==================== UNIT MODAL ====================

function openAddUnitModal(subjectId) {
  const syl = window.App.syllabus.find(s => s.id === subjectId);
  if (!syl) return;

  const nextUnitNo = (syl.units?.length || 0) + 1;
  document.getElementById('syllabusModalTitle').textContent = `Add Unit to ${syl.subjectName}`;
  document.getElementById('sylSubjectId').value = subjectId;
  document.getElementById('sylUnitNo').value = nextUnitNo;
  document.getElementById('sylUnitTitle').value = `Unit ${nextUnitNo}: New Module`;
  document.getElementById('sylTopicsTotal').value = 5;
  document.getElementById('sylTopicsCompleted').value = 0;
  document.getElementById('sylUnitStatus').value = 'Not Started';

  document.getElementById('syllabusUnitModal').classList.remove('hidden');
}

function openEditUnitModal(subjectId, unitNo, title, total, comp) {
  document.getElementById('syllabusModalTitle').textContent = `Edit Unit ${unitNo}`;
  document.getElementById('sylSubjectId').value = subjectId;
  document.getElementById('sylUnitNo').value = unitNo;
  document.getElementById('sylUnitTitle').value = title;
  document.getElementById('sylTopicsTotal').value = total;
  document.getElementById('sylTopicsCompleted').value = comp;
  document.getElementById('sylUnitStatus').value = comp >= total ? 'Completed' : (comp > 0 ? 'In Progress' : 'Not Started');

  document.getElementById('syllabusUnitModal').classList.remove('hidden');
}

function closeSyllabusModal() {
  document.getElementById('syllabusUnitModal').classList.add('hidden');
}

async function handleSyllabusUnitSubmit(event) {
  event.preventDefault();

  const subjectId = document.getElementById('sylSubjectId').value;
  const unitNo = parseInt(document.getElementById('sylUnitNo').value, 10);
  const title = document.getElementById('sylUnitTitle').value.trim();
  const topicsTotal = parseInt(document.getElementById('sylTopicsTotal').value, 10);
  const topicsCompleted = parseInt(document.getElementById('sylTopicsCompleted').value, 10);
  const status = document.getElementById('sylUnitStatus').value;

  const syl = window.App.syllabus.find(s => s.id === subjectId);
  if (!syl) return;

  let unit = (syl.units || []).find(u => u.unitNo === unitNo);
  if (unit) {
    unit.title = title;
    unit.topicsTotal = topicsTotal;
    unit.topicsCompleted = Math.min(topicsTotal, topicsCompleted);
    unit.status = status;
  } else {
    if (!syl.units) syl.units = [];
    syl.units.push({
      unitNo,
      title,
      topicsTotal,
      topicsCompleted: Math.min(topicsTotal, topicsCompleted),
      status
    });
  }

  if (window.App.isBackendConnected) {
    try {
      await fetch(`${API_BASE}/syllabus/${subjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syl)
      });
    } catch (e) {
      console.warn('Backend update failed for syllabus:', e);
    }
  }

  saveToLocalStorage();
  closeSyllabusModal();
  renderSyllabusCards();
  renderDashboard();
  showToast('Unit updated successfully!', 'success');
}

function openAddSyllabusSubjectModal() {
  // Shortcut to add subject in attendance which automatically initializes syllabus
  openAddSubjectModal();
}

