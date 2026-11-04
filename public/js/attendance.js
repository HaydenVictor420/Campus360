/**
 * Campus360 - Attendance Tracker Module
 * Handles subject-wise attendance calculation, quick logs, validation, shortage estimation, and CSV bulk importer.
 */

let attendanceFilter = 'all';
let parsedCsvData = [];
let detectedCsvHeaders = [];

window.initAttendanceModule = function() {
  renderAttendanceTable();
};

// ==================== TABLE RENDERING & FILTERING ====================

function renderAttendanceTable() {
  const tbody = document.getElementById('attendanceTableBody');
  if (!tbody) return;

  const threshold = parseFloat(window.App.settings.minAttendanceThreshold) || 75;
  const margin = parseFloat(window.App.settings.warningMargin) || 5;
  const search = (document.getElementById('attendanceSearchInput')?.value || '').toLowerCase().trim();

  let list = window.App.attendance || [];

  // Filter by search query
  if (search) {
    list = list.filter(item => 
      (item.name || '').toLowerCase().includes(search) ||
      (item.code || '').toLowerCase().includes(search) ||
      (item.faculty || '').toLowerCase().includes(search)
    );
  }

  // Filter by status pill
  if (attendanceFilter !== 'all') {
    list = list.filter(item => {
      const cond = parseInt(item.conducted, 10) || 0;
      const att = parseInt(item.attended, 10) || 0;
      if (cond === 0) return attendanceFilter === 'all';
      const pct = (att / cond) * 100;
      if (attendanceFilter === 'safe') return pct >= threshold;
      if (attendanceFilter === 'warning') return pct >= (threshold - margin) && pct < threshold;
      if (attendanceFilter === 'danger') return pct < (threshold - margin);
      return true;
    });
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-6 text-muted">
          No courses matching your criteria. Click "Add Subject" or adjust search filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(item => {
    const cond = parseInt(item.conducted, 10) || 0;
    const att = parseInt(item.attended, 10) || 0;

    let pctText = 'Not available yet';
    let pctNum = null;
    let statusPill = `<span class="status-pill pill-neutral">Pending</span>`;
    let adviceHtml = `<span class="text-muted text-xs">No classes conducted yet</span>`;

    if (cond > 0) {
      pctNum = Math.round((att / cond) * 1000) / 10;
      pctText = `${pctNum}%`;

      if (pctNum >= threshold) {
        statusPill = `<span class="status-pill pill-safe">Safe (&ge;${threshold}%)</span>`;
        const bunks = Math.floor((100 * att - threshold * cond) / threshold);
        if (bunks > 0) {
          adviceHtml = `<span class="text-emerald-700 text-xs"><strong>${bunks} class${bunks > 1 ? 'es' : ''}</strong> can be safely missed</span>`;
        } else {
          adviceHtml = `<span class="text-xs text-muted">Borderline safe. Do not miss upcoming classes.</span>`;
        }
      } else if (pctNum >= threshold - margin) {
        statusPill = `<span class="status-pill pill-warning">Near Margin</span>`;
        const needed = Math.ceil((threshold * cond - 100 * att) / (100 - threshold));
        adviceHtml = `<span class="text-amber-800 text-xs font-semibold">Attend next <strong>${needed}</strong> class${needed > 1 ? 'es' : ''} to reach ${threshold}%</span>`;
      } else {
        statusPill = `<span class="status-pill pill-danger">Shortage (&lt;${threshold}%)</span>`;
        const needed = Math.ceil((threshold * cond - 100 * att) / (100 - threshold));
        adviceHtml = `<span class="text-rose-700 text-xs font-bold">Must attend next <strong>${needed}</strong> consecutive classes!</span>`;
      }
    }

    return `
      <tr id="row_${item.id}">
        <td>
          <div class="font-bold text-primary">${escapeHtml(item.name)}</div>
          <div class="text-xs text-muted">
            <span class="font-mono">${escapeHtml(item.code || 'N/A')}</span>
            ${item.faculty ? ` • <span>${escapeHtml(item.faculty)}</span>` : ''}
          </div>
        </td>
        <td><strong>${cond}</strong></td>
        <td><strong>${att}</strong></td>
        <td>
          <span class="font-mono font-bold text-base ${pctNum !== null && pctNum < threshold ? 'text-rose-600' : ''}">${pctText}</span>
        </td>
        <td>${statusPill}</td>
        <td>${adviceHtml}</td>
        <td>
          <div class="quick-log-group">
            <button class="quick-btn present" title="Mark +1 Present" onclick="quickLogAttendance('${item.id}', 'present')">+1 Present</button>
            <button class="quick-btn absent" title="Mark +1 Absent (Conducted increases)" onclick="quickLogAttendance('${item.id}', 'absent')">+1 Missed</button>
          </div>
        </td>
        <td>
          <div class="flex gap-1">
            <button class="btn-icon" title="Edit Subject" onclick="openEditSubjectModal('${item.id}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button class="btn-icon text-danger" title="Delete Subject" onclick="confirmDeleteSubject('${item.id}', '${escapeHtml(item.name)}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setAttendanceFilter(filter, btn) {
  attendanceFilter = filter;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderAttendanceTable();
}

function filterAttendanceTable() {
  renderAttendanceTable();
}

// ==================== QUICK LOG (+1 PRESENT / +1 MISSED) ====================

async function quickLogAttendance(id, action) {
  const item = window.App.attendance.find(a => a.id === id);
  if (!item) return;

  if (window.App.isBackendConnected) {
    try {
      const res = await fetch(`${API_BASE}/attendance/${id}/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        const updated = await res.json();
        const idx = window.App.attendance.findIndex(a => a.id === id);
        if (idx !== -1) window.App.attendance[idx] = updated;
        saveToLocalStorage();
        renderAttendanceTable();
        renderDashboard();
        showToast(`Logged ${action === 'present' ? 'attendance' : 'missed class'} for ${item.name}`, 'success');
        return;
      }
    } catch (err) {
      console.warn('Backend quick log failed, falling back to local update:', err);
    }
  }

  // Local fallback
  item.conducted = (parseInt(item.conducted, 10) || 0) + 1;
  if (action === 'present') {
    item.attended = (parseInt(item.attended, 10) || 0) + 1;
  }
  saveToLocalStorage();
  renderAttendanceTable();
  renderDashboard();
  showToast(`Updated ${item.name} (${action})`, 'success');
}

// ==================== ADD / EDIT SUBJECT MODAL ====================

function openAddSubjectModal() {
  document.getElementById('subjectModalTitle').textContent = 'Add Course Attendance';
  document.getElementById('modalSubjectId').value = '';
  document.getElementById('modalSubjectCode').value = '';
  document.getElementById('modalSubjectName').value = '';
  document.getElementById('modalClassesConducted').value = '';
  document.getElementById('modalClassesAttended').value = '';
  document.getElementById('modalFaculty').value = '';
  document.getElementById('modalAttendanceError').classList.add('hidden');
  
  validateModalAttendance();
  document.getElementById('subjectModal').classList.remove('hidden');
}

function openEditSubjectModal(id) {
  const item = window.App.attendance.find(a => a.id === id);
  if (!item) return;

  document.getElementById('subjectModalTitle').textContent = 'Edit Course Attendance';
  document.getElementById('modalSubjectId').value = item.id;
  document.getElementById('modalSubjectCode').value = item.code || '';
  document.getElementById('modalSubjectName').value = item.name || '';
  document.getElementById('modalClassesConducted').value = item.conducted;
  document.getElementById('modalClassesAttended').value = item.attended;
  document.getElementById('modalFaculty').value = item.faculty || '';
  document.getElementById('modalAttendanceError').classList.add('hidden');

  validateModalAttendance();
  document.getElementById('subjectModal').classList.remove('hidden');
}

function closeSubjectModal() {
  document.getElementById('subjectModal').classList.add('hidden');
}

function validateModalAttendance() {
  const condInput = document.getElementById('modalClassesConducted');
  const attInput = document.getElementById('modalClassesAttended');
  const previewPct = document.getElementById('modalPreviewPct');
  const previewStatus = document.getElementById('modalPreviewStatus');
  const errBox = document.getElementById('modalAttendanceError');
  const saveBtn = document.getElementById('saveSubjectBtn');

  const cond = parseInt(condInput.value, 10);
  const att = parseInt(attInput.value, 10);
  const threshold = parseFloat(window.App.settings.minAttendanceThreshold) || 75;

  let isValid = true;
  let errorMsg = '';

  if (isNaN(cond) || cond < 0) {
    isValid = false;
  }
  if (isNaN(att) || att < 0) {
    isValid = false;
  }
  if (!isNaN(cond) && !isNaN(att) && att > cond) {
    isValid = false;
    errorMsg = 'Classes attended cannot be greater than classes conducted!';
  }

  if (errorMsg) {
    errBox.textContent = errorMsg;
    errBox.classList.remove('hidden');
    saveBtn.disabled = true;
  } else {
    errBox.classList.add('hidden');
    saveBtn.disabled = !isValid;
  }

  if (!isNaN(cond) && !isNaN(att) && cond > 0 && att <= cond) {
    const pct = Math.round((att / cond) * 1000) / 10;
    previewPct.textContent = `${pct}%`;
    if (pct >= threshold) {
      previewStatus.className = 'status-pill pill-safe';
      previewStatus.textContent = `Safe (≥ ${threshold}%)`;
    } else {
      previewStatus.className = 'status-pill pill-danger';
      previewStatus.textContent = `Shortage (< ${threshold}%)`;
    }
  } else if (cond === 0 && att === 0) {
    previewPct.textContent = 'Not available yet';
    previewStatus.className = 'status-pill pill-neutral';
    previewStatus.textContent = '0 Classes Held';
  } else {
    previewPct.textContent = '--%';
    previewStatus.className = 'status-pill pill-neutral';
    previewStatus.textContent = 'Pending Input';
  }
}

async function handleSubjectFormSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('modalSubjectId').value;
  const code = document.getElementById('modalSubjectCode').value.trim();
  const name = document.getElementById('modalSubjectName').value.trim();
  const conducted = parseInt(document.getElementById('modalClassesConducted').value, 10);
  const attended = parseInt(document.getElementById('modalClassesAttended').value, 10);
  const faculty = document.getElementById('modalFaculty').value.trim();

  if (!name) {
    showToast('Course name is mandatory', 'error');
    return;
  }
  if (isNaN(conducted) || conducted < 0 || isNaN(attended) || attended < 0) {
    showToast('Classes conducted and attended must be non-negative integers', 'error');
    return;
  }
  if (attended > conducted) {
    showToast('Classes attended cannot exceed classes conducted', 'error');
    return;
  }

  const payload = { code, name, conducted, attended, faculty };

  if (window.App.isBackendConnected) {
    try {
      const url = id ? `${API_BASE}/attendance/${id}` : `${API_BASE}/attendance`;
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchAllFromBackend();
        closeSubjectModal();
        renderAttendanceTable();
        renderDashboard();
        showToast(id ? 'Course updated successfully' : 'Course added successfully', 'success');
        return;
      } else {
        const data = await res.json();
        showToast(data.error || 'Server rejected submission', 'error');
        return;
      }
    } catch (err) {
      console.warn('Backend submission failed, falling back to local saving:', err);
    }
  }

  // Local fallback
  if (id) {
    const idx = window.App.attendance.findIndex(a => a.id === id);
    if (idx !== -1) {
      window.App.attendance[idx] = { ...window.App.attendance[idx], ...payload };
    }
  } else {
    const newId = 'att_' + Date.now();
    window.App.attendance.push({ id: newId, ...payload });

    // Also create matching syllabus entry
    window.App.syllabus.push({
      id: 'syl_' + Date.now(),
      subjectCode: code || 'SUB-' + window.App.attendance.length,
      subjectName: name,
      totalUnits: 5,
      units: [
        { unitNo: 1, title: 'Unit 1: Fundamentals', topicsTotal: 5, topicsCompleted: 0, status: 'Not Started' },
        { unitNo: 2, title: 'Unit 2: Core Concepts', topicsTotal: 5, topicsCompleted: 0, status: 'Not Started' },
        { unitNo: 3, title: 'Unit 3: Intermediate Topics', topicsTotal: 5, topicsCompleted: 0, status: 'Not Started' },
        { unitNo: 4, title: 'Unit 4: Advanced Principles', topicsTotal: 5, topicsCompleted: 0, status: 'Not Started' },
        { unitNo: 5, title: 'Unit 5: Applications & Case Studies', topicsTotal: 5, topicsCompleted: 0, status: 'Not Started' }
      ]
    });
  }

  saveToLocalStorage();
  closeSubjectModal();
  renderAttendanceTable();
  renderDashboard();
  showToast(id ? 'Course updated locally' : 'Course added locally', 'success');
}

function confirmDeleteSubject(id, name) {
  openConfirmModal(
    'Delete Course',
    `Are you sure you want to remove "${name}" from your attendance tracker? This action cannot be undone.`,
    async () => {
      if (window.App.isBackendConnected) {
        try {
          const res = await fetch(`${API_BASE}/attendance/${id}`, { method: 'DELETE' });
          if (res.ok) {
            await fetchAllFromBackend();
            renderAttendanceTable();
            renderDashboard();
            showToast(`Deleted ${name}`, 'success');
            return;
          }
        } catch (e) {
          console.warn('Backend delete failed:', e);
        }
      }

      window.App.attendance = window.App.attendance.filter(a => a.id !== id);
      saveToLocalStorage();
      renderAttendanceTable();
      renderDashboard();
      showToast(`Removed ${name}`, 'success');
    }
  );
}

// ==================== BULK CSV IMPORT ====================

function openBulkImportModal() {
  parsedCsvData = [];
  detectedCsvHeaders = [];
  document.getElementById('csvFileInput').value = '';
  document.getElementById('columnMappingSection').classList.add('hidden');
  document.getElementById('csvPreviewContainer').classList.add('hidden');
  document.getElementById('bulkImportError').classList.add('hidden');
  document.getElementById('confirmImportBtn').disabled = true;
  document.getElementById('bulkImportModal').classList.remove('hidden');
}

function closeBulkImportModal() {
  document.getElementById('bulkImportModal').classList.add('hidden');
}

function handleCsvFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    parseAndPrepareCsv(text);
  };
  reader.readAsText(file);
}

// Parse CSV text supporting comma, semicolon, tab, and quotes
function parseAndPrepareCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    showBulkImportError('CSV file must have a header row and at least one data row.');
    return;
  }

  // Detect delimiter
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

  // Tokenize rows
  const parseRow = row => {
    const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*(?:""[^"]*)*)"|([^"${delimiter}]*))`, 'g');
    const result = [];
    let match;
    while ((match = regex.exec(row)) !== null) {
      let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
      result.push((val || '').trim());
      if (regex.lastIndex === match.index) regex.lastIndex++;
    }
    return result;
  };

  detectedCsvHeaders = parseRow(lines[0]);
  parsedCsvData = lines.slice(1).map(parseRow);

  populateColumnMappingDropdowns();
  document.getElementById('columnMappingSection').classList.remove('hidden');
  document.getElementById('bulkImportError').classList.add('hidden');

  previewMappedCsv();
}

function populateColumnMappingDropdowns() {
  const selects = [
    { el: document.getElementById('mapSubjectName'), hint: ['subject', 'course', 'name', 'title'] },
    { el: document.getElementById('mapSubjectCode'), hint: ['code', 'sub code', 'course code', 'id'] },
    { el: document.getElementById('mapConducted'), hint: ['conducted', 'held', 'total', 'classes conducted'] },
    { el: document.getElementById('mapAttended'), hint: ['attended', 'present', 'classes attended'] }
  ];

  selects.forEach(({ el, hint }) => {
    el.innerHTML = detectedCsvHeaders.map((h, i) => `<option value="${i}">${h} (Col ${i + 1})</option>`).join('');
    // Auto-select best match based on hint
    const matchIdx = detectedCsvHeaders.findIndex(h => hint.some(k => h.toLowerCase().includes(k)));
    if (matchIdx !== -1) el.value = matchIdx;
  });
}

function previewMappedCsv() {
  const nameIdx = parseInt(document.getElementById('mapSubjectName').value, 10);
  const codeIdx = parseInt(document.getElementById('mapSubjectCode').value, 10);
  const condIdx = parseInt(document.getElementById('mapConducted').value, 10);
  const attIdx = parseInt(document.getElementById('mapAttended').value, 10);

  const tbody = document.getElementById('csvPreviewTableBody');
  const threshold = parseFloat(window.App.settings.minAttendanceThreshold) || 75;
  const errors = [];

  let validRowsCount = 0;
  tbody.innerHTML = parsedCsvData.slice(0, 15).map((row, idx) => {
    const rowNum = idx + 1;
    const name = row[nameIdx] || '';
    const code = row[codeIdx] || `SUB-${rowNum}`;
    const conducted = parseInt(row[condIdx], 10);
    const attended = parseInt(row[attIdx], 10);

    let rowError = '';
    if (!name) rowError = 'Missing name';
    else if (isNaN(conducted) || conducted < 0) rowError = 'Invalid conducted count';
    else if (isNaN(attended) || attended < 0) rowError = 'Invalid attended count';
    else if (attended > conducted) rowError = 'Attended > Conducted';

    if (rowError) {
      errors.push(`Row ${rowNum}: ${rowError}`);
      return `
        <tr class="bg-red-50 text-danger">
          <td>${rowNum}</td>
          <td>${escapeHtml(code)}</td>
          <td>${escapeHtml(name)}</td>
          <td>${isNaN(conducted) ? '-' : conducted}</td>
          <td>${isNaN(attended) ? '-' : attended}</td>
          <td colspan="2"><span class="status-pill pill-danger">Error: ${rowError}</span></td>
        </tr>
      `;
    }

    validRowsCount++;
    const pct = conducted > 0 ? `${Math.round((attended / conducted) * 1000) / 10}%` : 'N/A';
    const statusClass = (conducted > 0 && (attended / conducted) * 100 >= threshold) ? 'pill-safe' : 'pill-danger';

    return `
      <tr>
        <td>${rowNum}</td>
        <td><code>${escapeHtml(code)}</code></td>
        <td><strong>${escapeHtml(name)}</strong></td>
        <td>${conducted}</td>
        <td>${attended}</td>
        <td><strong>${pct}</strong></td>
        <td><span class="status-pill ${statusClass}">${(attended / conducted) * 100 >= threshold ? 'Safe' : 'Shortage'}</span></td>
      </tr>
    `;
  }).join('');

  document.getElementById('csvPreviewContainer').classList.remove('hidden');

  const confirmBtn = document.getElementById('confirmImportBtn');
  if (validRowsCount > 0) {
    confirmBtn.disabled = false;
    document.getElementById('bulkImportError').classList.add('hidden');
  } else {
    confirmBtn.disabled = true;
    showBulkImportError('No valid rows could be mapped with the selected columns.');
  }
}

async function executeBulkImport() {
  const nameIdx = parseInt(document.getElementById('mapSubjectName').value, 10);
  const codeIdx = parseInt(document.getElementById('mapSubjectCode').value, 10);
  const condIdx = parseInt(document.getElementById('mapConducted').value, 10);
  const attIdx = parseInt(document.getElementById('mapAttended').value, 10);
  const replaceExisting = document.getElementById('replaceExistingCheckbox').checked;

  const validRecords = [];
  parsedCsvData.forEach((row, idx) => {
    const name = (row[nameIdx] || '').trim();
    const code = (row[codeIdx] || `SUB-${idx + 1}`).trim();
    const conducted = parseInt(row[condIdx], 10);
    const attended = parseInt(row[attIdx], 10);

    if (name && !isNaN(conducted) && conducted >= 0 && !isNaN(attended) && attended >= 0 && attended <= conducted) {
      validRecords.push({
        id: 'att_' + Date.now() + '_' + idx,
        code,
        name,
        conducted,
        attended,
        faculty: '',
        lastUpdated: new Date().toISOString().split('T')[0]
      });
    }
  });

  if (validRecords.length === 0) {
    showBulkImportError('Could not find any valid records to import.');
    return;
  }

  if (window.App.isBackendConnected) {
    try {
      const res = await fetch(`${API_BASE}/attendance/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: validRecords, replaceExisting })
      });
      if (res.ok) {
        await fetchAllFromBackend();
        closeBulkImportModal();
        renderAttendanceTable();
        renderDashboard();
        showToast(`Successfully imported ${validRecords.length} courses!`, 'success');
        return;
      }
    } catch (err) {
      console.warn('Backend bulk import failed, falling back to local merge:', err);
    }
  }

  // Local fallback
  if (replaceExisting) {
    window.App.attendance = validRecords;
  } else {
    validRecords.forEach(newItem => {
      const existing = window.App.attendance.find(a => a.name.toLowerCase() === newItem.name.toLowerCase() || a.code.toLowerCase() === newItem.code.toLowerCase());
      if (existing) {
        existing.conducted = newItem.conducted;
        existing.attended = newItem.attended;
      } else {
        window.App.attendance.push(newItem);
      }
    });
  }

  saveToLocalStorage();
  closeBulkImportModal();
  renderAttendanceTable();
  renderDashboard();
  showToast(`Imported ${validRecords.length} courses locally!`, 'success');
}

function showBulkImportError(msg) {
  const errBox = document.getElementById('bulkImportError');
  errBox.textContent = msg;
  errBox.classList.remove('hidden');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

