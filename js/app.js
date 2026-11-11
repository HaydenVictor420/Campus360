// Campus360 - Main Foreground Application Controller
// Orchestrates multi-role personas, view routing, modal system, global search, and notifications

const Campus360App = (function () {
  let currentActiveView = 'student-dashboard';

  // Navigation map linking view IDs to module renderers
  const routes = {
    'student-dashboard': RoleDashboardsModule.renderStudentDashboard,
    'admin-dashboard': RoleDashboardsModule.renderAdminDashboard,
    'staff-dashboard': RoleDashboardsModule.renderStaffDashboard,
    'hod-dashboard': RoleDashboardsModule.renderHODDashboard,
    'parent-dashboard': RoleDashboardsModule.renderParentDashboard,
    'attendance': AttendanceModule.renderAttendanceView,
    'cgpa': CGPAModule.renderCGPAView,
    'timetable': TimetableModule.renderTimetableView,
    'period-log': PeriodLogModule.renderPeriodLogView,
    'marks-projects': MarksProjectsModule.renderMarksProjectsView,
    'syllabus': SyllabusTrackerModule.renderSyllabusView,
    'lab-booking': LabBookingModule.renderLabBookingView,
    'announcements': AnnouncementsModule.renderAnnouncementsView,
    'leaves': LeavesModule.renderLeavesView,
    'support': SupportContactModule.renderSupportView,
    'contact': SupportContactModule.renderContactView,
    'extensibility': ExtensibilityModule.renderExtensibilityView
  };

  function init() {
    updateClock();
    setInterval(updateClock, 1000);
    setupKeyboardShortcuts();
    syncUserInterface();

    // Default view based on role
    const state = Campus360Data.getState();
    const role = state.currentRole || 'student';
    navigateTo(getPrimaryViewForRole(role));
  }

  function getPrimaryViewForRole(role) {
    switch (role) {
      case 'admin': return 'admin-dashboard';
      case 'staff': return 'staff-dashboard';
      case 'hod': return 'hod-dashboard';
      case 'parent': return 'parent-dashboard';
      default: return 'student-dashboard';
    }
  }

  // View Navigation
  function navigateTo(viewId) {
    if (!routes[viewId]) {
      console.warn('Unknown view: ' + viewId);
      viewId = 'student-dashboard';
    }

    currentActiveView = viewId;

    // Update Sidebar active state
    document.querySelectorAll('.nav-link').forEach(link => {
      const target = link.getAttribute('data-view');
      if (target === viewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Close mobile sidebar if open
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');

    // Render View Content
    const contentContainer = document.getElementById('mainContentBody');
    if (contentContainer) {
      contentContainer.innerHTML = '';
      routes[viewId](contentContainer);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Role Switching Logic
  function switchRole(roleKey) {
    const newUser = Campus360Data.setRole(roleKey);
    if (newUser) {
      syncUserInterface();
      showToast(`Switched persona to: ${newUser.title || newUser.name}`, 'info');
      navigateTo(getPrimaryViewForRole(roleKey));
    }
  }

  function syncUserInterface() {
    const state = Campus360Data.getState();
    const user = state.currentUser;
    const role = state.currentRole;

    // Update role pills in header
    document.querySelectorAll('.role-pill').forEach(pill => {
      if (pill.getAttribute('data-role') === role) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Update User Chip in sidebar footer
    const nameEl = document.getElementById('sidebarUserName');
    const roleEl = document.getElementById('sidebarUserRole');
    const badgeEl = document.getElementById('sidebarUserBadge');
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.title || (role.toUpperCase() + ' Account');
    if (badgeEl) badgeEl.textContent = user.avatarBadge || '🎓';
  }

  // Live Clock
  function updateClock() {
    const clockEl = document.getElementById('liveClockDisplay');
    if (clockEl) {
      const now = new Date();
      const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
      clockEl.textContent = now.toLocaleDateString('en-US', options);
    }
  }

  // Global Modal System
  function showModal(title, bodyHtml) {
    const overlay = document.getElementById('globalModalOverlay');
    const titleEl = document.getElementById('globalModalTitle');
    const bodyEl = document.getElementById('globalModalBody');

    if (overlay && titleEl && bodyEl) {
      titleEl.textContent = title;
      bodyEl.innerHTML = bodyHtml;
      overlay.classList.add('active');
    }
  }

  function closeModal() {
    const overlay = document.getElementById('globalModalOverlay');
    if (overlay) overlay.classList.remove('active');
  }

  // Toast System
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    if (type === 'danger') icon = 'error';
    if (type === 'warning') icon = 'warning';

    toast.innerHTML = `
      <span class="material-symbols-outlined" style="font-size:20px;">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Keyboard Shortcuts (Ctrl+K search, Esc close modal)
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openGlobalSearchModal();
      }
      if (e.key === 'Escape') {
        closeModal();
      }
    });
  }

  // Global Search Modal
  function openGlobalSearchModal() {
    const modalContent = `
      <div>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:12px;">Type to search across courses, timetable periods, faculty members, project deadlines, and announcements.</p>
        <input type="text" class="form-control" id="globalSearchInput" placeholder="Search 'Machine Learning', 'LH-204', 'Syllabus', 'Lab 4'..." autofocus oninput="Campus360App.performSearch(this.value)">
        <div id="searchResultsBox" style="margin-top:16px; max-height:50vh; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
          <div style="font-size:12px; color:var(--text-dim); text-align:center; padding:20px;">Start typing to explore Campus360 resources...</div>
        </div>
      </div>
    `;

    showModal('Campus360 Unified Intelligent Search', modalContent);
    setTimeout(() => {
      const input = document.getElementById('globalSearchInput');
      if (input) input.focus();
    }, 100);
  }

  function performSearch(query) {
    const box = document.getElementById('searchResultsBox');
    if (!box) return;

    query = query.trim().toLowerCase();
    if (!query) {
      box.innerHTML = '<div style="font-size:12px; color:var(--text-dim); text-align:center; padding:20px;">Start typing to explore Campus360 resources...</div>';
      return;
    }

    const state = Campus360Data.getState();
    const results = [];

    // Search courses
    state.courses.forEach(c => {
      if (c.code.toLowerCase().includes(query) || c.name.toLowerCase().includes(query) || c.faculty.toLowerCase().includes(query)) {
        results.push({
          title: `${c.code}: ${c.name}`,
          sub: `Faculty: ${c.faculty} • Attendance: ${c.percentage}%`,
          view: 'attendance',
          icon: 'subject'
        });
      }
    });

    // Search period logs
    state.periodLogs.forEach(l => {
      if (l.topicTaught.toLowerCase().includes(query) || l.courseName.toLowerCase().includes(query)) {
        results.push({
          title: `Class Log: ${l.courseCode} — ${l.period}`,
          sub: l.topicTaught,
          view: 'period-log',
          icon: 'history_edu'
        });
      }
    });

    // Search announcements
    state.announcements.forEach(a => {
      if (a.title.toLowerCase().includes(query) || a.content.toLowerCase().includes(query)) {
        results.push({
          title: `Announcement: ${a.title}`,
          sub: a.content.substring(0, 70) + '...',
          view: 'announcements',
          icon: 'campaign'
        });
      }
    });

    // Search venues
    state.venues.forEach(v => {
      if (v.name.toLowerCase().includes(query) || v.type.toLowerCase().includes(query)) {
        results.push({
          title: `Facility: ${v.name}`,
          sub: `${v.location} (Capacity: ${v.capacity})`,
          view: 'lab-booking',
          icon: 'meeting_room'
        });
      }
    });

    if (results.length === 0) {
      box.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-dim); font-size:13px;">No results found for "${query}".</div>`;
      return;
    }

    box.innerHTML = results.map(r => `
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:12px; display:flex; align-items:center; justify-content:space-between; cursor:pointer;" onclick="Campus360App.closeModal(); Campus360App.navigateTo('${r.view}')">
        <div style="display:flex; align-items:center; gap:12px;">
          <span class="material-symbols-outlined text-secondary">${r.icon}</span>
          <div>
            <div style="font-size:14px; font-weight:700; color:#fff;">${r.title}</div>
            <div style="font-size:12px; color:var(--text-muted);">${r.sub}</div>
          </div>
        </div>
        <span class="material-symbols-outlined text-dim" style="font-size:18px;">arrow_forward</span>
      </div>
    `).join('');
  }

  // Authentication Dialogs (Login & Sign Up)
  function openLoginModal() {
    const modalContent = `
      <div style="padding:10px;">
        <div style="text-align:center; margin-bottom:20px;">
          <div style="width:48px; height:48px; border-radius:12px; background:linear-gradient(135deg, #4f46e5, #06b6d4); display:inline-flex; align-items:center; justify-content:center; color:#fff; margin-bottom:8px;">
            <span class="material-symbols-outlined" style="font-size:28px;">school</span>
          </div>
          <h2 style="font-size:22px; font-weight:800; color:#fff;">Welcome to Campus360</h2>
          <p style="font-size:13px; color:var(--text-muted);">Sign in with your verified institutional account</p>
        </div>

        <!-- 1-Click Persona Quick Logins -->
        <div style="background:rgba(79, 70, 229, 0.1); border:1px solid rgba(99, 102, 241, 0.3); border-radius:12px; padding:14px; margin-bottom:20px;">
          <span style="font-size:11.5px; font-weight:700; color:var(--secondary); text-transform:uppercase; letter-spacing:0.05em; display:block; margin-bottom:8px;">
            ⚡ Instant 1-Click Demo Evaluation Sign-In:
          </span>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(100px, 1fr)); gap:6px;">
            <button class="topbar-btn" style="justify-content:center; font-size:11.5px; padding:6px 4px;" onclick="Campus360App.demoLogin('student')">
              🎓 Student
            </button>
            <button class="topbar-btn" style="justify-content:center; font-size:11.5px; padding:6px 4px;" onclick="Campus360App.demoLogin('staff')">
              👨‍🏫 Staff
            </button>
            <button class="topbar-btn" style="justify-content:center; font-size:11.5px; padding:6px 4px;" onclick="Campus360App.demoLogin('hod')">
              🏛️ HOD
            </button>
            <button class="topbar-btn" style="justify-content:center; font-size:11.5px; padding:6px 4px;" onclick="Campus360App.demoLogin('admin')">
              🛡️ Admin
            </button>
            <button class="topbar-btn" style="justify-content:center; font-size:11.5px; padding:6px 4px;" onclick="Campus360App.demoLogin('parent')">
              👨‍👩‍👦 Parent
            </button>
          </div>
        </div>

        <form onsubmit="Campus360App.handleCredentialsLogin(event)">
          <div class="form-group">
            <label>Institutional Email / Roll Number:</label>
            <input type="email" class="form-control" id="loginEmail" placeholder="e.g. alex.turner@campus.edu" value="alex.turner@campus.edu" required>
          </div>

          <div class="form-group">
            <label>Password:</label>
            <input type="password" class="form-control" id="loginPassword" placeholder="••••••••" value="Campus@1234" required>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12.5px; color:var(--text-muted); margin-bottom:16px;">
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
              <input type="checkbox" checked> Remember me
            </label>
            <a href="#" style="color:var(--secondary); text-decoration:none;" onclick="Campus360App.showToast('Reset password link dispatched to email', 'info')">Forgot Password?</a>
          </div>

          <button type="submit" class="topbar-btn primary" style="width:100%; justify-content:center; padding:11px; font-weight:700; margin-bottom:12px;">
            Sign In to Portal
          </button>

          <!-- Google Auth button (matching Smart_Campus-main) -->
          <button type="button" class="topbar-btn" style="width:100%; justify-content:center; padding:10px; font-weight:600;" onclick="Campus360App.handleGoogleLogin()">
            <svg width="18" height="18" viewBox="0 0 48 48" style="margin-right:8px;">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Institutional Google ID
          </button>
        </form>

        <p style="font-size:12.5px; color:var(--text-dim); text-align:center; margin-top:20px;">
          Don't have an account? <a href="#" style="color:var(--secondary); font-weight:600; text-decoration:none;" onclick="Campus360App.openRegisterModal()">Create one here</a>
        </p>
      </div>
    `;

    showModal('Campus360 Authentication Gateway', modalContent);
  }

  function openRegisterModal() {
    const modalContent = `
      <div style="padding:10px;">
        <div style="text-align:center; margin-bottom:18px;">
          <h2 style="font-size:22px; font-weight:800; color:#fff;">Register on Campus360</h2>
          <p style="font-size:13px; color:var(--text-muted);">Enroll into your department's digital academic environment</p>
        </div>

        <form onsubmit="Campus360App.handleRegisterSubmit(event)">
          <div class="form-row">
            <div class="form-group">
              <label>Full Name:</label>
              <input type="text" class="form-control" id="regName" placeholder="e.g. Alex Turner" required>
            </div>
            <div class="form-group">
              <label>Select Role:</label>
              <select class="form-control" id="regRole">
                <option value="student">Student</option>
                <option value="staff">Faculty / Staff</option>
                <option value="parent">Parent / Guardian</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Institutional Email:</label>
              <input type="email" class="form-control" id="regEmail" placeholder="your.name@campus.edu" required>
            </div>
            <div class="form-group">
              <label>Roll No / Employee ID:</label>
              <input type="text" class="form-control" id="regId" placeholder="e.g. 22CS042" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Department:</label>
              <select class="form-control">
                <option>Computer Science & Engineering</option>
                <option>Artificial Intelligence & Data Science</option>
                <option>Electronics & Communication</option>
                <option>Mechanical & Automation</option>
              </select>
            </div>
            <div class="form-group">
              <label>Semester (if Student):</label>
              <select class="form-control">
                <option>Semester 1</option>
                <option>Semester 3</option>
                <option selected>Semester 5</option>
                <option>Semester 7</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Set Secure Password:</label>
            <input type="password" class="form-control" placeholder="••••••••" required>
          </div>

          <button type="submit" class="topbar-btn primary" style="width:100%; justify-content:center; padding:11px; font-weight:700;">
            Register Verified Account
          </button>
        </form>

        <p style="font-size:12.5px; color:var(--text-dim); text-align:center; margin-top:16px;">
          Already registered? <a href="#" style="color:var(--secondary); font-weight:600; text-decoration:none;" onclick="Campus360App.openLoginModal()">Sign in here</a>
        </p>
      </div>
    `;

    showModal('Campus360 Registration Portal', modalContent);
  }

  function demoLogin(role) {
    switchRole(role);
    closeModal();
    showToast(`Signed in as ${role.toUpperCase()} (Demo Access)`, 'success');
  }

  function handleCredentialsLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.toLowerCase();
    
    let targetRole = 'student';
    if (email.includes('admin')) targetRole = 'admin';
    else if (email.includes('hod')) targetRole = 'hod';
    else if (email.includes('sharma') || email.includes('fac') || email.includes('staff')) targetRole = 'staff';
    else if (email.includes('parent')) targetRole = 'parent';

    demoLogin(targetRole);
  }

  function handleGoogleLogin() {
    closeModal();
    showToast('Verified Google OAuth token received! Syncing profile...', 'success');
    demoLogin('student');
  }

  function handleRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const role = document.getElementById('regRole').value;
    closeModal();
    showToast(`Account created for ${name}! Welcome to Campus360.`, 'success');
    demoLogin(role);
  }

  function openNotifications() {
    const state = Campus360Data.getState();
    const ann = state.announcements;

    const modalContent = `
      <div style="display:flex; flex-direction:column; gap:12px; max-height:60vh; overflow-y:auto;">
        ${ann.map(a => `
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:12px;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <span class="nav-badge ${a.priority === 'urgent' ? 'danger' : 'primary'}">${a.badge}</span>
              <span style="font-size:11px; color:var(--text-dim);">${a.timestamp}</span>
            </div>
            <h4 style="font-size:14px; font-weight:700; color:#fff; margin-top:4px;">${a.title}</h4>
            <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">${a.content.substring(0, 80)}...</p>
          </div>
        `).join('')}
      </div>
    `;

    showModal('Campus Notifications & Live Dispatch', modalContent);
  }

  return {
    init,
    navigateTo,
    switchRole,
    showModal,
    closeModal,
    showToast,
    openGlobalSearchModal,
    performSearch,
    openLoginModal,
    openRegisterModal,
    demoLogin,
    handleCredentialsLogin,
    handleGoogleLogin,
    handleRegisterSubmit,
    openNotifications
  };
})();

// Auto-boot on DOM ready
document.addEventListener('DOMContentLoaded', Campus360App.init);

