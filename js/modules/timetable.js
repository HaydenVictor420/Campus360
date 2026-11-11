// Campus360 - Dynamic Timetable & Room Change Radar Module
// Solution 2: Dynamic timetable where each period, when clicked on, reveals extra detail + last-minute room changes

const TimetableModule = (function () {
  let activeDay = 'Monday';

  function renderTimetableView(container) {
    const state = Campus360Data.getState();
    const timetable = state.timetable;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Check for any room changes in current day
    const dayPeriods = timetable[activeDay] || [];
    const changedPeriods = dayPeriods.filter(p => p.roomChange && p.roomChange.isChanged);

    let html = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">calendar_today</span>
            Dynamic Smart Timetable & Room Change Radar
          </h2>
          <p>Interactive schedule synced to faculty rosters. Click any period to reveal deep lecture details and real-time room shifts.</p>
        </div>
        <div class="view-header-actions">
          ${(state.currentRole === 'staff' || state.currentRole === 'admin' || state.currentRole === 'hod') ? `
            <button class="topbar-btn primary" onclick="TimetableModule.openRoomChangeModal()">
              <span class="material-symbols-outlined">edit_location</span> Post Room Change Broadcast
            </button>
          ` : ''}
          <button class="topbar-btn" onclick="window.print()">
            <span class="material-symbols-outlined">print</span> Print Schedule
          </button>
        </div>
      </div>

      <!-- Last Minute Room Shift Banner if detected -->
      ${changedPeriods.length > 0 ? `
        <div class="urgent-broadcast-banner">
          <div class="broadcast-content">
            <div class="broadcast-icon-wrap">
              <span class="material-symbols-outlined">alt_route</span>
            </div>
            <div class="broadcast-text">
              <h4>⚡ LIVE ROOM CHANGE DETECTED FOR ${activeDay.toUpperCase()}!</h4>
              <p>
                ${changedPeriods.map(p => `
                  <strong>${p.code} (${p.subject})</strong>: Moved from <del style="color:#fca5a5;">${p.roomChange.originalRoom}</del> 
                  ➔ <span style="color:#6ee7b7; font-weight:800; background:rgba(0,0,0,0.3); padding:2px 6px; border-radius:4px;">${p.roomChange.newRoom}</span> 
                  (Reason: ${p.roomChange.reason}) • Updated ${p.roomChange.timestamp}
                `).join('<br>')}
              </p>
            </div>
          </div>
          <button class="broadcast-action-btn" onclick="TimetableModule.openPeriodDetails('${activeDay}', ${changedPeriods[0].period})">
            View Period Details
          </button>
        </div>
      ` : ''}

      <!-- Day Selector Pills -->
      <div class="day-selector-tabs">
        ${days.map(d => `
          <button class="day-tab-btn ${d === activeDay ? 'active' : ''}" onclick="TimetableModule.switchDay('${d}')">
            ${d}
            ${(timetable[d] || []).some(p => p.roomChange && p.roomChange.isChanged) ? `
              <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#ef4444; margin-left:4px;"></span>
            ` : ''}
          </button>
        `).join('')}
        <button class="day-tab-btn" onclick="TimetableModule.renderFullWeekModal()">
          <span class="material-symbols-outlined" style="font-size:16px; vertical-align:middle;">view_week</span>
          Full Week Grid View
        </button>
      </div>

      <!-- Period List -->
      <div class="dashboard-panel">
        <div class="panel-header">
          <div class="panel-header-left">
            <span class="material-symbols-outlined text-secondary">schedule</span>
            <h3>${activeDay}'s Hourly Class Schedule</h3>
          </div>
          <span style="font-size:13px; color:var(--text-muted);">
            Click on any period card to open complete syllabus topic & faculty dossier
          </span>
        </div>

        <div class="timetable-period-grid">
          ${dayPeriods.map(p => {
            const isLunch = p.code === 'LUNCH';
            const hasShift = p.roomChange && p.roomChange.isChanged;
            const isLive = p.period === 2 && activeDay === 'Monday'; // Sample live indicator

            if (isLunch) {
              return `
                <div style="background:rgba(255,255,255,0.02); border:1px dashed var(--border-subtle); border-radius:var(--radius-sm); padding:12px 20px; display:flex; align-items:center; justify-content:space-between;">
                  <div style="display:flex; align-items:center; gap:12px; color:var(--text-muted);">
                    <span class="material-symbols-outlined text-warning">restaurant</span>
                    <strong style="color:#fff;">${p.time}</strong> — ${p.subject}
                  </div>
                  <span style="font-size:12px; color:var(--text-dim);">${p.room}</span>
                </div>
              `;
            }

            return `
              <div class="period-card ${hasShift ? 'changed-room' : ''} ${isLive ? 'live-now' : ''}" onclick="TimetableModule.openPeriodDetails('${activeDay}', ${p.period})">
                <div class="period-time-slot">
                  <span class="period-num">Period ${p.period} ${isLive ? '• LIVE NOW' : ''}</span>
                  <span class="period-clock">${p.time}</span>
                </div>

                <div class="period-details">
                  <h4>
                    <span>${p.code} — ${p.subject}</span>
                    <span class="nav-badge ${p.type === 'Practical' ? 'primary' : 'success'}">${p.type}</span>
                  </h4>
                  <p>Faculty: <strong>${p.faculty}</strong></p>
                  <div class="period-topic-pill">
                    <span class="material-symbols-outlined" style="font-size:15px; color:var(--secondary);">menu_book</span>
                    Scheduled: ${p.topic}
                  </div>
                </div>

                <div class="period-room-badge">
                  <span class="room-tag ${hasShift ? 'changed' : ''}">
                    ${hasShift ? '🚨 NEW: ' + p.roomChange.newRoom : p.room}
                  </span>
                  ${hasShift ? `
                    <span style="font-size:10px; color:#fca5a5; font-weight:700;">Shifted from ${p.roomChange.originalRoom}</span>
                  ` : `
                    <span style="font-size:11px; color:var(--text-dim);">Standard Venue</span>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function switchDay(day) {
    activeDay = day;
    const container = document.getElementById('view-timetable');
    if (container) renderTimetableView(container);
  }

  function openPeriodDetails(day, periodNum) {
    const state = Campus360Data.getState();
    const periods = state.timetable[day] || [];
    const p = periods.find(item => item.period === periodNum);
    if (!p) return;

    const courseObj = state.courses.find(c => c.code === p.code);
    const hasShift = p.roomChange && p.roomChange.isChanged;

    const modalContent = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <!-- Course Header -->
        <div style="background:linear-gradient(135deg, rgba(79,70,229,0.2), rgba(6,182,212,0.15)); padding:18px; border-radius:12px; border:1px solid var(--border-subtle);">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span class="nav-badge primary" style="font-size:12px;">${p.code} • ${p.type}</span>
            <span style="font-size:13px; color:#cbd5e1; font-weight:600;">${day} — Period ${p.period} (${p.time})</span>
          </div>
          <h2 style="font-size:20px; font-weight:800; color:#fff; margin:10px 0 4px 0;">${p.subject}</h2>
          <p style="font-size:13px; color:var(--text-muted);">Taught by <strong>${p.faculty}</strong> • Credits: ${courseObj ? courseObj.credits : 3}</p>
        </div>

        <!-- Room Location & Urgent Shift Alert -->
        ${hasShift ? `
          <div style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; border-radius:10px; padding:14px;">
            <div style="display:flex; align-items:center; gap:8px; color:#f87171; font-weight:700; font-size:14px;">
              <span class="material-symbols-outlined">warning</span> LAST-MINUTE VENUE CHANGE ACTIVE
            </div>
            <div style="font-size:13px; color:#fff; margin-top:6px;">
              Original Room: <del style="color:#fca5a5;">${p.roomChange.originalRoom}</del> 
              ➔ <strong>New Venue: <span style="color:#34d399; font-size:15px;">${p.roomChange.newRoom}</span></strong>
            </div>
            <div style="font-size:12px; color:#cbd5e1; margin-top:4px;">
              Reason: ${p.roomChange.reason} (Broadcasted: ${p.roomChange.timestamp})
            </div>
          </div>
        ` : `
          <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); padding:12px 16px; border-radius:8px;">
            <span style="font-size:13px; color:var(--text-muted);">Assigned Class Venue:</span>
            <strong style="color:#fff; font-size:15px;">${p.room}</strong>
          </div>
        `}

        <!-- Topic Dossier -->
        <div class="dashboard-panel" style="padding:16px;">
          <h4 style="font-size:14px; color:#fff; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
            <span class="material-symbols-outlined text-secondary" style="font-size:18px;">menu_book</span>
            Scheduled Curriculum Topic
          </h4>
          <p style="font-size:14px; color:#cbd5e1; line-height:1.5;">${p.topic}</p>
        </div>

        <!-- Instructor Contact -->
        <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); padding:14px; border-radius:8px;">
          <div>
            <div style="font-size:13.5px; font-weight:700; color:#fff;">${p.faculty}</div>
            <div style="font-size:12px; color:var(--text-dim);">${courseObj ? courseObj.cabin : 'Tech Tower Cabin'} • Consultation Hours: 03:00 - 04:30 PM</div>
          </div>
          <button class="topbar-btn" onclick="Campus360App.showToast('Connecting with ${p.faculty}...', 'info')">
            <span class="material-symbols-outlined" style="font-size:16px;">mail</span> Message
          </button>
        </div>

        <!-- Actions -->
        <div style="display:flex; gap:10px; margin-top:8px;">
          <button class="topbar-btn primary" style="flex:1; justify-content:center;" onclick="Campus360App.closeModal(); Campus360App.navigateTo('period-log');">
            <span class="material-symbols-outlined">menu_book</span> View Class Notes & Period Log
          </button>
        </div>
      </div>
    `;

    Campus360App.showModal(`Period Dossier: ${p.code} (${day})`, modalContent);
  }

  function renderFullWeekModal() {
    const state = Campus360Data.getState();
    const timetable = state.timetable;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const modalContent = `
      <div style="max-height:70vh; overflow-x:auto;">
        <table class="cgpa-table" style="min-width:700px;">
          <thead>
            <tr>
              <th>Day</th>
              <th>P1 (09:00)</th>
              <th>P2 (10:00)</th>
              <th>P3 (11:00)</th>
              <th>P4 (12:00)</th>
              <th>P5 (01:30)</th>
              <th>P6 (02:30)</th>
            </tr>
          </thead>
          <tbody>
            ${days.map(d => {
              const list = timetable[d] || [];
              return `
                <tr>
                  <td><strong>${d}</strong></td>
                  ${list.slice(0, 6).map(p => `
                    <td style="font-size:11.5px; padding:8px; vertical-align:top; border-left:1px solid rgba(255,255,255,0.05);">
                      <div style="font-weight:700; color:${p.roomChange && p.roomChange.isChanged ? '#ef4444' : '#fff'};">
                        ${p.code}
                      </div>
                      <div style="color:var(--text-dim); font-size:10px;">${p.roomChange && p.roomChange.isChanged ? '🚨 ' + p.roomChange.newRoom : p.room}</div>
                    </td>
                  `).join('')}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    Campus360App.showModal('Comprehensive 5-Day Master Timetable', modalContent);
  }

  function openRoomChangeModal() {
    const state = Campus360Data.getState();
    const courses = state.courses;

    const modalContent = `
      <form id="roomChangeForm" onsubmit="TimetableModule.handleRoomChangeSubmit(event)">
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">
          Broadcast an instantaneous venue update. All enrolled students and department monitors will receive high-priority alerts.
        </p>

        <div class="form-row">
          <div class="form-group">
            <label>Day:</label>
            <select class="form-control" id="changeDaySelect">
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
            </select>
          </div>
          <div class="form-group">
            <label>Period:</label>
            <select class="form-control" id="changePeriodSelect">
              <option value="1">Period 1 (09:00 AM)</option>
              <option value="2">Period 2 (10:00 AM)</option>
              <option value="3">Period 3 (11:00 AM)</option>
              <option value="5">Period 5 (01:30 PM)</option>
              <option value="6">Period 6 (02:30 PM)</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Course Code:</label>
            <select class="form-control" id="changeCourseSelect">
              ${courses.map(c => `<option value="${c.code}">${c.code} - ${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>New Venue / Room No:</label>
            <input type="text" class="form-control" id="changeNewRoomInput" placeholder="e.g. LH-204 or Turing Lab 4" required>
          </div>
        </div>

        <div class="form-group">
          <label>Reason for Venue Relocation:</label>
          <input type="text" class="form-control" id="changeReasonInput" placeholder="e.g. Projector servicing, Lab demo, Capacity upgrade" required>
        </div>

        <button type="submit" class="topbar-btn primary" style="width:100%; justify-content:center; margin-top:10px;">
          <span class="material-symbols-outlined">campaign</span> Dispatch Room Change Broadcast
        </button>
      </form>
    `;

    Campus360App.showModal('Emergency / Relocation Room Change Broadcast', modalContent);
  }

  function handleRoomChangeSubmit(e) {
    e.preventDefault();
    const day = document.getElementById('changeDaySelect').value;
    const periodNum = parseInt(document.getElementById('changePeriodSelect').value, 10);
    const newRoom = document.getElementById('changeNewRoomInput').value.trim();
    const reason = document.getElementById('changeReasonInput').value.trim();

    const state = Campus360Data.getState();
    const period = (state.timetable[day] || []).find(p => p.period === periodNum);
    if (period) {
      const origRoom = period.room;
      period.roomChange = {
        isChanged: true,
        originalRoom: origRoom,
        newRoom: newRoom,
        reason: reason,
        timestamp: 'Just now'
      };

      // Also create an urgent announcement
      Campus360Data.addAnnouncement({
        id: 'ANN-' + Date.now(),
        title: `⚡ ROOM SHIFT: ${period.code} (${period.subject}) moved to ${newRoom}`,
        category: 'Room Change Alert',
        priority: 'urgent',
        timestamp: 'Just now',
        author: state.currentUser.name,
        content: `Class on ${day} Period ${periodNum} relocated from ${origRoom} to ${newRoom}. Reason: ${reason}.`,
        badge: 'Room Shift',
        icon: 'alt_route',
        color: '#ef4444'
      });

      Campus360Data.save();
      Campus360App.closeModal();
      Campus360App.showToast(`Room changed to ${newRoom}! Broadcast dispatched.`, 'success');
      switchDay(day);
    }
  }

  return {
    renderTimetableView,
    switchDay,
    openPeriodDetails,
    renderFullWeekModal,
    openRoomChangeModal,
    handleRoomChangeSubmit
  };
})();

