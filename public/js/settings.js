/**
 * Campus360 - Settings & Institutional Configuration Module
 * Manages attendance thresholds, warning margins, grading scale maps, JSON/CSV backups, and data resets.
 */

window.initSettingsModule = function() {
  renderSettingsForm();
};

function renderSettingsForm() {
  const threshold = window.App.settings.minAttendanceThreshold || 75;
  const margin = window.App.settings.warningMargin || 5;
  const rule = window.App.settings.institutionRule || 'weighted_credits';

  const rangeEl = document.getElementById('settingThresholdRange');
  const numEl = document.getElementById('settingMinThreshold');
  const marginEl = document.getElementById('settingWarningMargin');
  const ruleEl = document.getElementById('settingInstitutionRule');

  if (rangeEl) rangeEl.value = threshold;
  if (numEl) numEl.value = threshold;
  if (marginEl) marginEl.value = margin;
  if (ruleEl) ruleEl.value = rule;

  renderGradeScaleTable();
}

function syncThresholdRange(val) {
  document.getElementById('settingMinThreshold').value = val;
}

function syncThresholdInput(val) {
  const v = Math.max(50, Math.min(100, parseFloat(val) || 75));
  document.getElementById('settingThresholdRange').value = v;
}

function renderGradeScaleTable() {
  const tbody = document.getElementById('gradeScaleTableBody');
  if (!tbody) return;

  const scale = window.App.settings.gradeScale || [];

  tbody.innerHTML = scale.map((item, idx) => `
    <tr>
      <td>
        <input type="text" class="form-input font-bold" style="width: 80px" value="${escapeHtml(item.grade)}" oninput="updateGradeScaleItem(${idx}, 'grade', this.value)">
      </td>
      <td>
        <input type="number" class="form-input font-mono font-bold" style="width: 90px" min="0" max="10" step="0.5" value="${item.points}" oninput="updateGradeScaleItem(${idx}, 'points', this.value)">
      </td>
      <td>
        <input type="text" class="form-input" value="${escapeHtml(item.description || '')}" placeholder="Description" oninput="updateGradeScaleItem(${idx}, 'description', this.value)">
      </td>
      <td>
        <button class="btn-icon text-danger" title="Delete Grade" onclick="removeGradeScaleRow(${idx})">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </td>
    </tr>
  `).join('');
}

function updateGradeScaleItem(index, field, val) {
  const scale = window.App.settings.gradeScale;
  if (!scale || !scale[index]) return;

  if (field === 'points') {
    scale[index].points = Math.max(0, parseFloat(val) || 0);
  } else {
    scale[index][field] = val;
  }
}

function addGradeScaleRow() {
  if (!window.App.settings.gradeScale) window.App.settings.gradeScale = [];
  window.App.settings.gradeScale.push({
    grade: 'G' + (window.App.settings.gradeScale.length + 1),
    points: 7,
    description: 'Custom Grade'
  });
  renderGradeScaleTable();
}

function removeGradeScaleRow(index) {
  window.App.settings.gradeScale.splice(index, 1);
  renderGradeScaleTable();
}

async function saveSettings() {
  const threshold = parseFloat(document.getElementById('settingMinThreshold').value) || 75;
  const margin = parseFloat(document.getElementById('settingWarningMargin').value) || 5;
  const rule = document.getElementById('settingInstitutionRule').value;
  const gradeScale = window.App.settings.gradeScale;

  if (threshold < 50 || threshold > 100) {
    showToast('Attendance threshold must be between 50% and 100%', 'error');
    return;
  }

  const payload = {
    minAttendanceThreshold: threshold,
    warningMargin: margin,
    institutionRule: rule,
    gradeScale
  };

  if (window.App.isBackendConnected) {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        window.App.settings = payload;
        saveToLocalStorage();
        renderDashboard();
        if (window.renderAttendanceTable) window.renderAttendanceTable();
        if (window.renderGpaTable) window.renderGpaTable();
        showToast('Settings saved to server database!', 'success');
        return;
      }
    } catch (e) {
      console.warn('Backend settings save failed:', e);
    }
  }

  window.App.settings = payload;
  saveToLocalStorage();
  renderDashboard();
  if (window.renderAttendanceTable) window.renderAttendanceTable();
  if (window.renderGpaTable) window.renderGpaTable();
  showToast('Settings saved locally!', 'success');
}

// ==================== RESTORE / IMPORT JSON BACKUP ====================

function importDataFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      const data = parsed.data || parsed;

      if (!data.attendance && !data.settings && !data.gpaCourses) {
        showToast('Invalid backup file format.', 'error');
        return;
      }

      openConfirmModal(
        'Restore Backup Snapshot',
        'Restoring this file will overwrite your existing attendance, syllabus, and GPA records. Do you wish to continue?',
        async () => {
          if (window.App.isBackendConnected) {
            try {
              const res = await fetch(`${API_BASE}/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data })
              });
              if (res.ok) {
                await fetchAllFromBackend();
                renderDashboard();
                renderSettingsForm();
                showToast('All data successfully restored from file!', 'success');
                return;
              }
            } catch (err) {
              console.warn('Backend restore failed:', err);
            }
          }

          // Local restore
          window.App.settings = data.settings || window.App.settings;
          window.App.attendance = data.attendance || [];
          window.App.syllabus = data.syllabus || [];
          window.App.gpaCourses = data.gpaCourses || [];
          window.App.cgpaSemesters = data.cgpaSemesters || [];

          saveToLocalStorage();
          renderDashboard();
          renderSettingsForm();
          showToast('Data restored locally from backup!', 'success');
        }
      );
    } catch (err) {
      showToast('Could not parse JSON backup file.', 'error');
    }
  };
  reader.readAsText(file);
}

// ==================== RESET DATABASE ====================

function confirmResetDatabase() {
  openConfirmModal(
    'Reset to Demo State',
    'Are you sure you want to restore the default sample dataset? All custom records will be replaced with standard college demo records.',
    async () => {
      if (window.App.isBackendConnected) {
        try {
          const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
          if (res.ok) {
            await fetchAllFromBackend();
            renderDashboard();
            renderSettingsForm();
            showToast('Database reset to initial sample state!', 'success');
            return;
          }
        } catch (e) {
          console.warn('Backend reset failed:', e);
        }
      }

      localStorage.removeItem('campus360_data');
      await loadAppData();
      renderDashboard();
      renderSettingsForm();
      showToast('Restored demo records locally!', 'success');
    }
  );
}

