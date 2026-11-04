/**
 * Campus360 - Main Application Controller
 * Handles SPA navigation, API / LocalStorage persistence sync, KPI updates, and global modals.
 */

const API_BASE = '/api';

window.App = {
  isBackendConnected: false,
  settings: {
    minAttendanceThreshold: 75,
    warningMargin: 5,
    institutionRule: 'weighted_credits',
    gradeScale: []
  },
  attendance: [],
  syllabus: [],
  gpaCourses: [],
  cgpaSemesters: []
};

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupMobileMenu();
  setupDocumentationModal();
  
  // Load application data (try API first, fallback to LocalStorage)
  await loadAppData();

  // Initialize individual sub-modules
  if (window.initAttendanceModule) window.initAttendanceModule();
  if (window.initSyllabusModule) window.initSyllabusModule();
  if (window.initGpaModule) window.initGpaModule();
  if (window.initCgpaModule) window.initCgpaModule();
  if (window.initSettingsModule) window.initSettingsModule();

  // Render initial dashboard metrics
  renderDashboard();
});

// ==================== NAVIGATION ROUTER ====================

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const target = link.getAttribute('data-target');
      switchTab(target);
    });
  });
}

function switchTab(tabId) {
  // Update nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-target') === tabId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Switch content section
  document.querySelectorAll('.content-section').forEach(sec => {
    if (sec.id === tabId) {
      sec.classList.add('active');
    } else {
      sec.classList.remove('active');
    }
  });

  // Close mobile menu if opened
  const navMenu = document.getElementById('navMenu');
  if (navMenu) navMenu.classList.remove('open');

  // Specific tab refreshes
  if (tabId === 'dashboard') renderDashboard();
  if (tabId === 'attendance' && window.renderAttendanceTable) window.renderAttendanceTable();
  if (tabId === 'syllabus' && window.renderSyllabusCards) window.renderSyllabusCards();
  if (tabId === 'gpa' && window.renderGpaTable) window.renderGpaTable();
  if (tabId === 'cgpa' && window.renderCgpaTable) window.renderCgpaTable();
  if (tabId === 'settings' && window.renderSettingsForm) window.renderSettingsForm();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupMobileMenu() {
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');
  if (mobileBtn && navMenu) {
    mobileBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }
}

// ==================== DATA SYNC (BACKEND API + LOCALSTORAGE) ====================

async function loadAppData() {
  const syncBadge = document.getElementById('syncStatusBadge');
  const syncText = document.getElementById('syncStatusText');

  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      window.App.isBackendConnected = true;
      if (syncBadge && syncText) {
        syncBadge.className = 'status-indicator online';
        syncText.textContent = 'Server Connected';
      }
      // Load from server
      await fetchAllFromBackend();
      return;
    }
  } catch (err) {
    console.warn('Backend server not reachable, using Browser LocalStorage fallback:', err);
  }

  // LocalStorage Fallback
  window.App.isBackendConnected = false;
  if (syncBadge && syncText) {
    syncBadge.className = 'status-indicator';
    syncText.textContent = 'Offline (Local)';
  }
  loadFromLocalStorage();
}

async function fetchAllFromBackend() {
  try {
    const [settingsRes, attRes, sylRes, gpaRes, cgpaRes] = await Promise.all([
      fetch(`${API_BASE}/settings`).then(r => r.json()),
      fetch(`${API_BASE}/attendance`).then(r => r.json()),
      fetch(`${API_BASE}/syllabus`).then(r => r.json()),
      fetch(`${API_BASE}/gpa`).then(r => r.json()),
      fetch(`${API_BASE}/cgpa`).then(r => r.json())
    ]);

    window.App.settings = settingsRes;
    window.App.attendance = attRes;
    window.App.syllabus = sylRes;
    window.App.gpaCourses = gpaRes.courses || [];
    window.App.cgpaSemesters = cgpaRes.semesters || [];

    // Cache locally as secondary mirror
    saveToLocalStorage();
  } catch (err) {
    console.error('Failed to load from backend:', err);
    loadFromLocalStorage();
  }
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('campus360_data');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      window.App.settings = parsed.settings || window.App.settings;
      window.App.attendance = parsed.attendance || [];
      window.App.syllabus = parsed.syllabus || [];
      window.App.gpaCourses = parsed.gpaCourses || [];
      window.App.cgpaSemesters = parsed.cgpaSemesters || [];
    } catch (e) {
      console.error('Error parsing local storage:', e);
    }
  }
}

function saveToLocalStorage() {
  const payload = {
    settings: window.App.settings,
    attendance: window.App.attendance,
    syllabus: window.App.syllabus,
    gpaCourses: window.App.gpaCourses,
    cgpaSemesters: window.App.cgpaSemesters
  };
  localStorage.setItem('campus360_data', JSON.stringify(payload));
}

// ==================== DASHBOARD RENDERING ====================

function renderDashboard() {
  const threshold = parseFloat(window.App.settings.minAttendanceThreshold) || 75;
  const margin = parseFloat(window.App.settings.warningMargin) || 5;

  // 1. Attendance Metrics
  let totalConducted = 0;
  let totalAttended = 0;
  let shortageCount = 0;
  let warningCount = 0;

  const attendanceList = window.App.attendance || [];
  attendanceList.forEach(item => {
    const cond = parseInt(item.conducted, 10) || 0;
    const att = parseInt(item.attended, 10) || 0;
    totalConducted += cond;
    totalAttended += att;

    if (cond > 0) {
      const pct = (att / cond) * 100;
      if (pct < threshold - margin) shortageCount++;
      else if (pct < threshold) warningCount++;
    }
  });

  const overallAttPct = totalConducted > 0 
    ? Math.round((totalAttended / totalConducted) * 1000) / 10 
    : 0;

  // KPI UI Updates
  const kpiOverallAtt = document.getElementById('kpiOverallAttendance');
  const kpiAttRatio = document.getElementById('kpiAttendanceRatio');
  const kpiAttProgress = document.getElementById('kpiAttendanceProgress');
  const kpiAttBadge = document.getElementById('kpiAttendanceBadge');
  const kpiSafeBunksNote = document.getElementById('kpiSafeBunksNote');
  const kpiThresholdNote = document.getElementById('kpiThresholdNote');

  if (kpiOverallAtt) kpiOverallAtt.textContent = totalConducted > 0 ? `${overallAttPct}%` : 'N/A';
  if (kpiAttRatio) kpiAttRatio.textContent = `${totalAttended} / ${totalConducted} classes attended`;
  if (kpiThresholdNote) kpiThresholdNote.textContent = `Mandatory Threshold: ${threshold}%`;

  if (kpiAttProgress) {
    kpiAttProgress.style.width = `${Math.min(100, overallAttPct)}%`;
    if (overallAttPct >= threshold) {
      kpiAttProgress.className = 'progress-bar-fill';
      if (kpiAttBadge) {
        kpiAttBadge.className = 'kpi-badge';
        kpiAttBadge.textContent = 'Safe';
      }
      const bunks = Math.floor((100 * totalAttended - threshold * totalConducted) / threshold);
      if (kpiSafeBunksNote) kpiSafeBunksNote.textContent = bunks > 0 ? `Can miss ${bunks} classes safely` : 'On boundary';
    } else if (overallAttPct >= threshold - margin) {
      kpiAttProgress.className = 'progress-bar-fill progress-yellow';
      if (kpiAttBadge) {
        kpiAttBadge.className = 'kpi-badge warning';
        kpiAttBadge.textContent = 'Near Margin';
      }
      const needed = Math.ceil((threshold * totalConducted - 100 * totalAttended) / (100 - threshold));
      if (kpiSafeBunksNote) kpiSafeBunksNote.textContent = `Need ${needed} classes to reach ${threshold}%`;
    } else {
      kpiAttProgress.className = 'progress-bar-fill progress-red';
      if (kpiAttBadge) {
        kpiAttBadge.className = 'kpi-badge danger';
        kpiAttBadge.textContent = 'Shortage Alert';
      }
      const needed = Math.ceil((threshold * totalConducted - 100 * totalAttended) / (100 - threshold));
      if (kpiSafeBunksNote) kpiSafeBunksNote.textContent = `Must attend next ${needed} classes!`;
    }
  }

  // 2. Syllabus Completion Metrics
  let totalTopics = 0;
  let completedTopics = 0;
  (window.App.syllabus || []).forEach(sub => {
    (sub.units || []).forEach(u => {
      totalTopics += (parseInt(u.topicsTotal, 10) || 0);
      completedTopics += (parseInt(u.topicsCompleted, 10) || 0);
    });
  });

  const overallSyllabusPct = totalTopics > 0 
    ? Math.round((completedTopics / totalTopics) * 100) 
    : 0;

  const kpiOverallSyllabus = document.getElementById('kpiOverallSyllabus');
  const kpiSyllabusRatio = document.getElementById('kpiSyllabusRatio');
  const kpiSyllabusProgress = document.getElementById('kpiSyllabusProgress');
  const kpiSyllabusStatusText = document.getElementById('kpiSyllabusStatusText');

  if (kpiOverallSyllabus) kpiOverallSyllabus.textContent = `${overallSyllabusPct}%`;
  if (kpiSyllabusRatio) kpiSyllabusRatio.textContent = `${completedTopics} / ${totalTopics} topics completed`;
  if (kpiSyllabusProgress) kpiSyllabusProgress.style.width = `${overallSyllabusPct}%`;
  if (kpiSyllabusStatusText) {
    if (overallSyllabusPct >= 80) kpiSyllabusStatusText.textContent = 'Ahead of Schedule';
    else if (overallSyllabusPct >= 50) kpiSyllabusStatusText.textContent = 'On Track';
    else kpiSyllabusStatusText.textContent = 'Needs Focus';
  }

  // 3. GPA & CGPA Metrics
  let gpaCreds = 0, gpaPts = 0;
  (window.App.gpaCourses || []).forEach(c => {
    const cred = parseFloat(c.credits) || 0;
    const pt = parseFloat(c.points) || 0;
    gpaCreds += cred;
    gpaPts += (cred * pt);
  });
  const sgpa = gpaCreds > 0 ? (Math.round((gpaPts / gpaCreds) * 100) / 100).toFixed(2) : '0.00';
  const kpiGpa = document.getElementById('kpiSemesterGPA');
  const kpiGpaCredits = document.getElementById('kpiGpaCredits');
  if (kpiGpa) kpiGpa.textContent = sgpa;
  if (kpiGpaCredits) kpiGpaCredits.textContent = `${gpaCreds} registered credits`;

  let cgpaCreds = 0, cgpaPts = 0;
  (window.App.cgpaSemesters || []).forEach(s => {
    const cred = parseFloat(s.credits) || 0;
    const val = parseFloat(s.sgpa) || 0;
    cgpaCreds += cred;
    cgpaPts += (cred * val);
  });
  const cgpa = cgpaCreds > 0 ? (Math.round((cgpaPts / cgpaCreds) * 100) / 100).toFixed(2) : '0.00';
  const kpiCgpa = document.getElementById('kpiCumulativeCGPA');
  const kpiCgpaCredits = document.getElementById('kpiCgpaCredits');
  if (kpiCgpa) kpiCgpa.textContent = cgpa;
  if (kpiCgpaCredits) kpiCgpaCredits.textContent = `${cgpaCreds} total earned credits`;

  // 4. Alert Banner Display
  const alertBanner = document.getElementById('systemAlertBanner');
  const alertTitle = document.getElementById('alertTitle');
  const alertMsg = document.getElementById('alertMessage');

  if (alertBanner) {
    if (shortageCount > 0) {
      alertBanner.classList.remove('hidden');
      alertTitle.textContent = `Attendance Shortage Alert (${shortageCount} Subject${shortageCount > 1 ? 's' : ''}):`;
      alertMsg.textContent = `You have subjects falling below ${threshold}%. Review required classes immediately to prevent exam debarment.`;
    } else if (warningCount > 0) {
      alertBanner.classList.remove('hidden');
      alertTitle.textContent = `Approaching Threshold Margin:`;
      alertMsg.textContent = `${warningCount} subject(s) are near the ${threshold}% margin. Maintain regular attendance.`;
    } else {
      alertBanner.classList.add('hidden');
    }
  }

  // 5. Render Dashboard Attendance Table Preview
  renderDashboardAttendanceTable();

  // 6. Render Dashboard Syllabus Progress Preview
  renderDashboardSyllabusPreview();
}

function renderDashboardAttendanceTable() {
  const tbody = document.getElementById('dashboardAttendanceList');
  if (!tbody) return;

  const threshold = parseFloat(window.App.settings.minAttendanceThreshold) || 75;
  const margin = parseFloat(window.App.settings.warningMargin) || 5;

  if (window.App.attendance.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No attendance records yet. Click "Add Subject" to begin.</td></tr>`;
    return;
  }

  tbody.innerHTML = window.App.attendance.map(item => {
    const cond = parseInt(item.conducted, 10) || 0;
    const att = parseInt(item.attended, 10) || 0;
    
    let pctDisplay = 'Not available yet';
    let statusPill = '<span class="status-pill pill-neutral">N/A</span>';
    let advice = 'No classes conducted yet';

    if (cond > 0) {
      const pct = Math.round((att / cond) * 1000) / 10;
      pctDisplay = `${pct}%`;

      if (pct >= threshold) {
        statusPill = `<span class="status-pill pill-safe">Safe</span>`;
        const bunks = Math.floor((100 * att - threshold * cond) / threshold);
        advice = bunks > 0 ? `Can safely miss ${bunks} class${bunks > 1 ? 'es' : ''}` : 'On margin (attend all)';
      } else if (pct >= threshold - margin) {
        statusPill = `<span class="status-pill pill-warning">Near Margin</span>`;
        const needed = Math.ceil((threshold * cond - 100 * att) / (100 - threshold));
        advice = `Attend next ${needed} class${needed > 1 ? 'es' : ''}`;
      } else {
        statusPill = `<span class="status-pill pill-danger">Shortage</span>`;
        const needed = Math.ceil((threshold * cond - 100 * att) / (100 - threshold));
        advice = `<strong>Attend next ${needed} classes!</strong>`;
      }
    }

    return `
      <tr>
        <td>
          <div class="font-semibold text-primary">${item.name}</div>
          <span class="text-xs text-muted">${item.code || ''}</span>
        </td>
        <td><strong>${att}</strong> / ${cond}</td>
        <td><strong>${pctDisplay}</strong></td>
        <td>${statusPill}</td>
        <td class="text-sm">${advice}</td>
      </tr>
    `;
  }).join('');
}

function renderDashboardSyllabusPreview() {
  const container = document.getElementById('dashboardSyllabusList');
  if (!container) return;

  if (window.App.syllabus.length === 0) {
    container.innerHTML = `<p class="text-center py-4 text-muted">No syllabus tracked yet. Add subjects to see completion progress.</p>`;
    return;
  }

  container.innerHTML = window.App.syllabus.map(s => {
    let tot = 0, comp = 0;
    (s.units || []).forEach(u => {
      tot += (parseInt(u.topicsTotal, 10) || 0);
      comp += (parseInt(u.topicsCompleted, 10) || 0);
    });
    const pct = tot > 0 ? Math.round((comp / tot) * 100) : 0;

    return `
      <div class="syllabus-summary-item mb-3">
        <div class="flex justify-between text-sm mb-1">
          <span class="font-semibold">${s.subjectName} (${s.subjectCode || ''})</span>
          <strong>${pct}% (${comp}/${tot} Topics)</strong>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill progress-blue" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// ==================== MODAL SYSTEM ====================

function openConfirmModal(title, message, onConfirm) {
  const modal = document.getElementById('confirmModal');
  const titleEl = document.getElementById('confirmModalTitle');
  const msgEl = document.getElementById('confirmModalMessage');
  
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;

  window._confirmCallback = onConfirm;
  modal.classList.remove('hidden');
}

function closeConfirmModal(isConfirmed) {
  const modal = document.getElementById('confirmModal');
  modal.classList.add('hidden');
  if (isConfirmed && typeof window._confirmCallback === 'function') {
    window._confirmCallback();
  }
  window._confirmCallback = null;
}

function setupDocumentationModal() {
  const infoBtn = document.getElementById('infoBtn');
  const infoModal = document.getElementById('infoModal');
  if (infoBtn && infoModal) {
    infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
  }
}

function closeInfoModal() {
  const infoModal = document.getElementById('infoModal');
  if (infoModal) infoModal.classList.add('hidden');
}

// ==================== EXPORT DATA ====================

async function exportData(format = 'json') {
  if (window.App.isBackendConnected) {
    window.location.href = `${API_BASE}/export?format=${format}`;
    showToast(`Exported ${format.toUpperCase()} successfully!`, 'success');
  } else {
    // Generate file download directly in browser
    if (format === 'csv') {
      let csv = 'Subject Code,Subject Name,Classes Conducted,Classes Attended,Attendance Percentage,Faculty\n';
      window.App.attendance.forEach(a => {
        const pct = a.conducted > 0 ? `${Math.round((a.attended / a.conducted) * 1000) / 10}%` : 'N/A';
        csv += `"${a.code || ''}","${a.name}",${a.conducted},${a.attended},${pct},"${a.faculty || ''}"\n`;
      });
      downloadBlob(csv, 'campus360_attendance.csv', 'text/csv');
      showToast('Attendance CSV downloaded!', 'success');
    } else {
      const payload = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        app: 'Campus360 Module',
        data: {
          settings: window.App.settings,
          attendance: window.App.attendance,
          syllabus: window.App.syllabus,
          gpaCourses: window.App.gpaCourses,
          cgpaSemesters: window.App.cgpaSemesters
        }
      };
      downloadBlob(JSON.stringify(payload, null, 2), 'campus360_backup.json', 'application/json');
      showToast('Complete JSON backup downloaded!', 'success');
    }
  }
}

function downloadBlob(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

