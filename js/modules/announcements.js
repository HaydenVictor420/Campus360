// Campus360 - Upcoming Sessions & Institutional Announcements Module
// Solution 7: Unified place for upcoming classes, extra remedial sessions, guest lectures & college notices

const AnnouncementsModule = (function () {
  let activeFilter = 'ALL';

  function renderAnnouncementsView(container) {
    const state = Campus360Data.getState();
    const announcements = state.announcements;

    const filtered = activeFilter === 'ALL'
      ? announcements
      : announcements.filter(a => a.category.toLowerCase().includes(activeFilter.toLowerCase()) || (activeFilter === 'urgent' && a.priority === 'urgent'));

    let html = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">campaign</span>
            Unified Announcements & Academic Sessions Feed
          </h2>
          <p>No more scattered WhatsApp groups or missed physical notice boards — all authenticated updates in one central live stream.</p>
        </div>
        <div class="view-header-actions">
          ${(state.currentRole === 'staff' || state.currentRole === 'admin' || state.currentRole === 'hod') ? `
            <button class="topbar-btn primary" onclick="AnnouncementsModule.openPostModal()">
              <span class="material-symbols-outlined">add_alert</span> Broadcast Official Notice
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Quick Filter Pills -->
      <div class="day-selector-tabs">
        <button class="day-tab-btn ${activeFilter === 'ALL' ? 'active' : ''}" onclick="AnnouncementsModule.setFilter('ALL')">
          All Announcements (${announcements.length})
        </button>
        <button class="day-tab-btn ${activeFilter === 'urgent' ? 'active' : ''}" onclick="AnnouncementsModule.setFilter('urgent')">
          🚨 Urgent / Room Shifts (${announcements.filter(a => a.priority === 'urgent').length})
        </button>
        <button class="day-tab-btn ${activeFilter === 'academic' ? 'active' : ''}" onclick="AnnouncementsModule.setFilter('academic')">
          📚 Remedial & Extra Sessions
        </button>
        <button class="day-tab-btn ${activeFilter === 'guest' ? 'active' : ''}" onclick="AnnouncementsModule.setFilter('guest')">
          🎤 Guest Lectures & Tech Talks
        </button>
        <button class="day-tab-btn ${activeFilter === 'exam' ? 'active' : ''}" onclick="AnnouncementsModule.setFilter('exam')">
          📅 Examination Cell
        </button>
        <button class="day-tab-btn ${activeFilter === 'club' ? 'active' : ''}" onclick="AnnouncementsModule.setFilter('club')">
          🚀 Hackathons & Clubs
        </button>
      </div>

      <!-- Feed Stream -->
      <div style="display:flex; flex-direction:column; gap:16px;">
        ${filtered.map(item => {
          const isUrgent = item.priority === 'urgent';
          const isHigh = item.priority === 'high';

          return `
            <div class="dashboard-panel" style="${isUrgent ? 'border-left: 4px solid var(--danger); background: rgba(239, 68, 68, 0.05);' : (isHigh ? 'border-left: 4px solid var(--primary);' : '')}">
              <div style="display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px;">
                <div style="display:flex; align-items:flex-start; gap:14px;">
                  <div style="width:44px; height:44px; border-radius:12px; background:${isUrgent ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.06)'}; display:flex; align-items:center; justify-content:center; color:${item.color || 'var(--secondary)'}; flex-shrink:0;">
                    <span class="material-symbols-outlined" style="font-size:24px;">${item.icon || 'notifications'}</span>
                  </div>
                  <div>
                    <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                      <span class="nav-badge ${isUrgent ? 'danger' : 'primary'}" style="font-size:11px;">
                        ${item.badge}
                      </span>
                      <span style="font-size:12px; color:var(--text-dim);">${item.category} • ${item.timestamp}</span>
                    </div>
                    <h3 style="font-size:17px; font-weight:800; color:#fff; margin-top:6px;">${item.title}</h3>
                    <div style="font-size:12px; color:var(--text-dim); margin-top:2px;">
                      Issued by: <strong>${item.author}</strong>
                    </div>
                  </div>
                </div>

                <div style="display:flex; gap:8px;">
                  <button class="topbar-btn" style="padding:5px 12px; font-size:12px;" onclick="Campus360App.showToast('Event synced to Google Calendar / Outlook!', 'success')">
                    <span class="material-symbols-outlined" style="font-size:15px; color:var(--secondary);">event</span> Add to Calendar
                  </button>
                  <button class="topbar-btn" style="padding:5px 10px; font-size:12px;" onclick="Campus360App.showToast('Notice link copied to clipboard', 'info')">
                    <span class="material-symbols-outlined" style="font-size:15px;">share</span>
                  </button>
                </div>
              </div>

              <div style="margin-top:14px; font-size:14px; color:#cbd5e1; line-height:1.6; background:rgba(0,0,0,0.2); padding:14px 18px; border-radius:8px;">
                ${item.content}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  function setFilter(cat) {
    activeFilter = cat;
    const container = document.getElementById('view-announcements');
    if (container) renderAnnouncementsView(container);
  }

  function openPostModal() {
    const modalContent = `
      <form id="postNoticeForm" onsubmit="AnnouncementsModule.handlePostSubmit(event)">
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">
          Broadcast an official announcement to the entire university portal. Instant push notifications dispatched to student & faculty dashboards.
        </p>

        <div class="form-group">
          <label>Announcement Headline / Title:</label>
          <input type="text" class="form-control" id="postTitle" placeholder="e.g. Remedial Doubt Session on Deep Neural Nets" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Category:</label>
            <select class="form-control" id="postCategory">
              <option value="Academic Session">Academic Session (Extra Class / Doubt Session)</option>
              <option value="Room Change Alert">Room Change Alert</option>
              <option value="Guest Lecture">Distinguished Guest Lecture / Keynote</option>
              <option value="Examinations">Examinations & Internal Tests</option>
              <option value="Clubs & Competitions">Clubs, Hackathons & Co-Curricular</option>
            </select>
          </div>
          <div class="form-group">
            <label>Priority Level:</label>
            <select class="form-control" id="postPriority">
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent / Emergency Alert (Red Banner)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Detailed Announcement Text:</label>
          <textarea class="form-control" id="postContent" rows="4" placeholder="Detail date, time, venue, prerequisites, and mandatory instructions..." required></textarea>
        </div>

        <button type="submit" class="topbar-btn primary" style="width:100%; justify-content:center; margin-top:10px;">
          <span class="material-symbols-outlined">send</span> Dispatch University-Wide Broadcast
        </button>
      </form>
    `;

    Campus360App.showModal('Publish Campus Announcement', modalContent);
  }

  function handlePostSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('postTitle').value.trim();
    const cat = document.getElementById('postCategory').value;
    const prio = document.getElementById('postPriority').value;
    const text = document.getElementById('postContent').value.trim();

    const state = Campus360Data.getState();
    const newNotice = {
      id: 'ANN-' + Date.now(),
      title: title,
      category: cat,
      priority: prio,
      timestamp: 'Just now',
      author: `${state.currentUser.name} (${state.currentUser.title || state.currentUser.role.toUpperCase()})`,
      content: text,
      badge: cat.split(' ')[0],
      icon: prio === 'urgent' ? 'warning' : 'campaign',
      color: prio === 'urgent' ? '#ef4444' : '#3b82f6'
    };

    Campus360Data.addAnnouncement(newNotice);
    Campus360App.closeModal();
    Campus360App.showToast('Announcement broadcasted across campus!', 'success');
    const container = document.getElementById('view-announcements');
    if (container) renderAnnouncementsView(container);
  }

  return {
    renderAnnouncementsView,
    setFilter,
    openPostModal,
    handlePostSubmit
  };
})();

