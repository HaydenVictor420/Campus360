// Campus360 - Lab / Hall / Room Booking Module
// Solution 6: Instant 1-click booking with real-time availability and digital confirmation pass

const LabBookingModule = (function () {
  function renderLabBookingView(container) {
    const state = Campus360Data.getState();
    const venues = state.venues;
    const bookings = state.bookings;

    let html = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">meeting_room</span>
            Campus Facilities, Labs & Halls Booking Portal
          </h2>
          <p>Real-time slot availability, one-click reservations for CRs & club leads, and instant verified digital booking passes.</p>
        </div>
        <div class="view-header-actions">
          <button class="topbar-btn primary" onclick="LabBookingModule.openBookingModal()">
            <span class="material-symbols-outlined">add_circle</span> Book Venue Now
          </button>
        </div>
      </div>

      <!-- Top KPI Row -->
      <div class="kpi-grid">
        <div class="kpi-card" style="--card-accent: #10b981;">
          <div>
            <div class="kpi-info-label">Available Venues Today</div>
            <div class="kpi-info-value" style="color:#10b981;">4 <span style="font-size:15px; color:var(--text-dim);">/ 5</span></div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">check_circle</span>
              High-Speed Power & GPU Active
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">check_box</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #3b82f6;">
          <div>
            <div class="kpi-info-label">Approved Passes This Week</div>
            <div class="kpi-info-value">${bookings.filter(b => b.status === 'Approved').length} Confirmed</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">verified</span>
              Automated RFID Gate Access
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">qr_code</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #f59e0b;">
          <div>
            <div class="kpi-info-label">Pending Approvals</div>
            <div class="kpi-info-value" style="color:#fcd34d;">${bookings.filter(b => b.status === 'Pending').length} Request</div>
            <div class="kpi-info-sub warning">
              <span class="material-symbols-outlined" style="font-size:16px;">hourglass_top</span>
              Awaiting HOD / Dean sign-off
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">pending</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #8b5cf6;">
          <div>
            <div class="kpi-info-label">Largest Auditorium Capacity</div>
            <div class="kpi-info-value">650 Pax</div>
            <div class="kpi-info-sub">
              <span class="material-symbols-outlined" style="font-size:16px;">theater_comedy</span>
              APJ Kalam Grand Auditorium
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">groups</span>
          </div>
        </div>
      </div>

      <!-- Live Available Venues Grid -->
      <h3 style="font-size:18px; font-weight:700; color:#fff; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
        <span class="material-symbols-outlined text-secondary">domain</span>
        Select Facility to Reserve
      </h3>

      <div class="venue-cards-grid">
        ${venues.map(v => `
          <div class="venue-card">
            <img src="${v.image}" alt="${v.name}" class="venue-card-img">
            <div class="venue-body">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                  <span class="nav-badge primary" style="font-size:11px;">${v.type} • Capacity: ${v.capacity} Seats</span>
                  <h4 style="font-size:16px; font-weight:700; color:#fff; margin-top:6px;">${v.name}</h4>
                  <p style="font-size:12px; color:var(--text-dim); margin-top:2px;">📍 ${v.location}</p>
                </div>
                <span class="nav-badge ${v.status === 'Available' ? 'success' : 'warning'}">
                  ${v.status}
                </span>
              </div>

              <div>
                <span style="font-size:11.5px; color:var(--text-dim); font-weight:600; display:block; margin-bottom:4px;">Equipped with:</span>
                <div class="venue-equipment-tags">
                  ${v.equipment.map(eq => `<span class="eq-tag">${eq}</span>`).join('')}
                </div>
              </div>

              <div style="margin-top:auto; padding-top:12px; display:flex; gap:8px;">
                <button class="topbar-btn primary" style="flex:1; justify-content:center; font-size:12.5px;" onclick="LabBookingModule.openBookingModal('${v.id}')">
                  <span class="material-symbols-outlined" style="font-size:16px;">bookmark_add</span> Reserve Slot
                </button>
                <button class="topbar-btn" style="font-size:12.5px;" onclick="Campus360App.showToast('Checking telemetry for ${v.name}... All systems nominal.', 'info')">
                  <span class="material-symbols-outlined" style="font-size:16px;">info</span> Details
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Active Bookings & Digital Passes -->
      <div class="dashboard-panel" style="margin-top:28px;">
        <div class="panel-header">
          <div class="panel-header-left">
            <span class="material-symbols-outlined text-secondary">receipt_long</span>
            <h3>Booking History & Issued Passes</h3>
          </div>
          <span style="font-size:12px; color:var(--text-dim);">Real-time status synchronized with campus security</span>
        </div>

        <div style="overflow-x:auto;">
          <table class="cgpa-table">
            <thead>
              <tr>
                <th>Pass Code</th>
                <th>Venue</th>
                <th>Requested By</th>
                <th>Date & Slot</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${bookings.map(b => `
                <tr>
                  <td><code style="color:#38bdf8; font-weight:700;">${b.bookingPassCode}</code></td>
                  <td><strong>${b.venueName}</strong></td>
                  <td>${b.bookedBy}</td>
                  <td>${b.date} • <span style="font-size:12px; color:var(--text-dim);">${b.slot}</span></td>
                  <td><span style="font-size:12.5px; color:var(--text-muted);">${b.purpose.substring(0, 38)}...</span></td>
                  <td>
                    <span class="nav-badge ${b.status === 'Approved' ? 'success' : (b.status === 'Pending' ? 'warning' : 'danger')}">
                      ${b.status}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      <button class="topbar-btn" style="padding:4px 10px; font-size:11.5px;" onclick="LabBookingModule.showDigitalPass('${b.id}')">
                        <span class="material-symbols-outlined" style="font-size:15px; color:var(--secondary);">badge</span> Pass
                      </button>
                      ${(state.currentRole === 'admin' || state.currentRole === 'hod') && b.status === 'Pending' ? `
                        <button class="topbar-btn" style="padding:4px 8px; font-size:11.5px; background:rgba(16,185,129,0.2); color:#6ee7b7;" onclick="LabBookingModule.approveBooking('${b.id}')">
                          Approve
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function openBookingModal(venueId) {
    const state = Campus360Data.getState();
    const venues = state.venues;
    const defaultVenue = venues.find(v => v.id === venueId) || venues[0];

    const modalContent = `
      <form id="labBookingForm" onsubmit="LabBookingModule.handleBookingSubmit(event)">
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">
          Submit your slot reservation request. Instant automated clearance applies for standard club/class activities.
        </p>

        <div class="form-group">
          <label>Facility / Venue:</label>
          <select class="form-control" id="bookVenueSelect" required>
            ${venues.map(v => `
              <option value="${v.id}" ${v.id === defaultVenue.id ? 'selected' : ''}>
                ${v.name} (Cap: ${v.capacity} • ${v.type})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Reservation Date:</label>
            <input type="date" class="form-control" id="bookDateInput" value="2026-11-14" required>
          </div>
          <div class="form-group">
            <label>Time Window:</label>
            <select class="form-control" id="bookSlotSelect" required>
              <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM (Morning Slot 1)</option>
              <option value="11:30 AM - 01:30 PM">11:30 AM - 01:30 PM (Midday Slot 2)</option>
              <option value="02:00 PM - 05:00 PM" selected>02:00 PM - 05:00 PM (Afternoon Workshop)</option>
              <option value="05:30 PM - 08:30 PM">05:30 PM - 08:30 PM (Evening Hackathon)</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Expected Attendees (Pax):</label>
            <input type="number" min="5" max="650" value="45" class="form-control" id="bookAttendeesInput" required>
          </div>
          <div class="form-group">
            <label>Applicant Capacity / Role:</label>
            <select class="form-control" id="bookRoleCapacity">
              <option value="Class Representative (CR)">Class Representative (CR)</option>
              <option value="Student Club Lead">Student Club Lead</option>
              <option value="Faculty Co-ordinator">Faculty Co-ordinator</option>
              <option value="Project Group Lead">Project Group Lead</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Purpose / Event Description:</label>
          <textarea class="form-control" id="bookPurposeInput" rows="3" placeholder="Explain the planned activity, equipment requirements (projector/mics/GPUs)..." required>Hands-on AI agent coding sprint with student members.</textarea>
        </div>

        <button type="submit" class="topbar-btn primary" style="width:100%; justify-content:center; margin-top:10px;">
          <span class="material-symbols-outlined">send</span> Dispatch Reservation Request
        </button>
      </form>
    `;

    Campus360App.showModal('Reserve Campus Hall / Laboratory', modalContent);
  }

  function handleBookingSubmit(e) {
    e.preventDefault();
    const venueId = document.getElementById('bookVenueSelect').value;
    const date = document.getElementById('bookDateInput').value;
    const slot = document.getElementById('bookSlotSelect').value;
    const attendees = parseInt(document.getElementById('bookAttendeesInput').value, 10);
    const purpose = document.getElementById('bookPurposeInput').value.trim();

    const state = Campus360Data.getState();
    const venue = state.venues.find(v => v.id === venueId);
    const newId = 'BK-' + Math.floor(1000 + Math.random() * 9000);

    const newBooking = {
      id: newId,
      venueId: venueId,
      venueName: venue ? venue.name : 'Campus Facility',
      bookedBy: `${state.currentUser.name} (${state.currentUser.role.toUpperCase()})`,
      applicantEmail: state.currentUser.email,
      date: date,
      slot: slot,
      purpose: purpose,
      expectedAttendees: attendees,
      status: 'Approved', // Auto approved for demo flow
      approvedBy: 'Auto-Clearance Engine (Campus360 System)',
      bookingPassCode: 'PASS-' + newId,
      createdAt: 'Just now'
    };

    Campus360Data.addBooking(newBooking);
    Campus360App.closeModal();
    Campus360App.showToast(`Booking Successful! Pass ${newBooking.bookingPassCode} generated.`, 'success');

    // Show instant digital pass
    showDigitalPass(newBooking.id);

    const container = document.getElementById('view-lab-booking');
    if (container) renderLabBookingView(container);
  }

  function showDigitalPass(bookingId) {
    const state = Campus360Data.getState();
    const b = state.bookings.find(item => item.id === bookingId);
    if (!b) return;

    const modalContent = `
      <div style="display:flex; flex-direction:column; align-items:center; text-align:center; padding:10px;">
        <div style="background:linear-gradient(135deg, #4f46e5, #06b6d4); color:#fff; width:100%; padding:20px; border-radius:16px 16px 0 0;">
          <span class="material-symbols-outlined" style="font-size:42px;">verified</span>
          <h2 style="font-size:22px; font-weight:800; margin-top:4px;">Official Facility Access Pass</h2>
          <p style="font-size:12.5px; opacity:0.9;">Campus360 Automated Infrastructure Management</p>
        </div>

        <div style="background:#131826; border:1px solid var(--border-subtle); border-top:none; border-radius:0 0 16px 16px; width:100%; padding:24px;">
          <!-- Simulated QR Code -->
          <div style="background:#fff; padding:14px; border-radius:12px; display:inline-block; margin-bottom:16px;">
            <svg width="140" height="140" viewBox="0 0 100 100" fill="#000">
              <rect x="10" y="10" width="24" height="24" fill="#000"/>
              <rect x="14" y="14" width="16" height="16" fill="#fff"/>
              <rect x="18" y="18" width="8" height="8" fill="#000"/>
              <rect x="66" y="10" width="24" height="24" fill="#000"/>
              <rect x="70" y="14" width="16" height="16" fill="#fff"/>
              <rect x="74" y="18" width="8" height="8" fill="#000"/>
              <rect x="10" y="66" width="24" height="24" fill="#000"/>
              <rect x="14" y="70" width="16" height="16" fill="#fff"/>
              <rect x="18" y="74" width="8" height="8" fill="#000"/>
              <rect x="42" y="14" width="6" height="20" fill="#000"/>
              <rect x="52" y="24" width="8" height="6" fill="#000"/>
              <rect x="42" y="42" width="16" height="16" fill="#000"/>
              <rect x="68" y="42" width="18" height="8" fill="#000"/>
              <rect x="42" y="68" width="8" height="18" fill="#000"/>
              <rect x="56" y="72" width="28" height="14" fill="#000"/>
            </svg>
          </div>

          <div style="font-size:18px; font-weight:800; color:#38bdf8; letter-spacing:0.05em; margin-bottom:14px;">
            ${b.bookingPassCode}
          </div>

          <div style="display:flex; flex-direction:column; gap:8px; text-align:left; font-size:13px; color:var(--text-muted); background:rgba(255,255,255,0.03); padding:16px; border-radius:10px;">
            <div>Facility: <strong style="color:#fff;">${b.venueName}</strong></div>
            <div>Reserved By: <strong style="color:#fff;">${b.bookedBy}</strong></div>
            <div>Date & Slot: <strong style="color:#fff;">${b.date} • ${b.slot}</strong></div>
            <div>Expected Attendance: <strong style="color:#fff;">${b.expectedAttendees} Attendees</strong></div>
            <div>Purpose: <span style="color:#cbd5e1;">${b.purpose}</span></div>
            <div>Status: <span style="color:#10b981; font-weight:700;">${b.status}</span> (${b.approvedBy})</div>
          </div>

          <div style="display:flex; gap:10px; margin-top:20px;">
            <button class="topbar-btn" style="flex:1; justify-content:center;" onclick="window.print()">
              <span class="material-symbols-outlined">print</span> Print Pass
            </button>
            <button class="topbar-btn primary" style="flex:1; justify-content:center;" onclick="Campus360App.showToast('Downloaded PDF Pass with Security Hologram', 'success')">
              <span class="material-symbols-outlined">download</span> Download PDF
            </button>
          </div>
        </div>
      </div>
    `;

    Campus360App.showModal('Official Digital Facility Access Pass', modalContent);
  }

  function approveBooking(bookingId) {
    const state = Campus360Data.getState();
    const b = state.bookings.find(item => item.id === bookingId);
    if (b) {
      b.status = 'Approved';
      b.approvedBy = `${state.currentUser.name} (${state.currentUser.role.toUpperCase()})`;
      Campus360Data.save();
      Campus360App.showToast(`Booking ${b.bookingPassCode} Approved!`, 'success');
      const container = document.getElementById('view-lab-booking');
      if (container) renderLabBookingView(container);
    }
  }

  return {
    renderLabBookingView,
    openBookingModal,
    handleBookingSubmit,
    showDigitalPass,
    approveBooking
  };
})();

