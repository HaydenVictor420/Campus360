// Campus360 - Support & Contact Dashboards Module
// Covers Support Dashboard (Grievances & Helpdesk) + Contact Dashboard (Faculty Directory & Emergency SOS)

const SupportContactModule = (function () {
  // Support Dashboard View
  function renderSupportView(container) {
    const state = Campus360Data.getState();
    const tickets = state.tickets;

    let html = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">support_agent</span>
            Campus Helpdesk & Grievance Redressal
          </h2>
          <p>Direct institutional channel for academic queries, hostel complaints, WiFi issues, and infrastructure work orders.</p>
        </div>
        <div class="view-header-actions">
          <button class="topbar-btn primary" onclick="SupportContactModule.openTicketModal()">
            <span class="material-symbols-outlined">add_comment</span> Raise New Ticket / Grievance
          </button>
        </div>
      </div>

      <!-- Top KPI Row -->
      <div class="kpi-grid">
        <div class="kpi-card" style="--card-accent: #10b981;">
          <div>
            <div class="kpi-info-label">Tickets Resolved</div>
            <div class="kpi-info-value" style="color:#10b981;">${tickets.filter(t => t.status === 'Resolved').length} Resolved</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">verified</span>
              Average Resolution: 18 Hours
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">task_alt</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #f59e0b;">
          <div>
            <div class="kpi-info-label">Under Investigation</div>
            <div class="kpi-info-value" style="color:#fcd34d;">${tickets.filter(t => t.status === 'In Progress').length} Active</div>
            <div class="kpi-info-sub warning">
              <span class="material-symbols-outlined" style="font-size:16px;">engineering</span>
              Field technician dispatched
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">pending</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #3b82f6;">
          <div>
            <div class="kpi-info-label">Helpdesk Response SLA</div>
            <div class="kpi-info-value">98.4%</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">speed</span>
              Meets ISO 9001 Education SLA
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">verified_user</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #8b5cf6;">
          <div>
            <div class="kpi-info-label">Campus AI Concierge</div>
            <div class="kpi-info-value">24x7 Online</div>
            <div class="kpi-info-sub">
              <span class="material-symbols-outlined" style="font-size:16px;">smart_toy</span>
              Ask instant campus FAQs
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">chat</span>
          </div>
        </div>
      </div>

      <!-- Tickets History List -->
      <div class="dashboard-panel">
        <div class="panel-header">
          <div class="panel-header-left">
            <span class="material-symbols-outlined text-secondary">confirmation_number</span>
            <h3>Your Grievance Redressal Tickets</h3>
          </div>
          <span style="font-size:12px; color:var(--text-dim);">Real-time tracking with administrative action notes</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:14px;">
          ${tickets.map(t => `
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:12px; padding:18px;">
              <div style="display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                <div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span class="nav-badge primary">${t.category}</span>
                    <span style="font-size:11.5px; color:var(--text-dim);">Ticket ID: <strong>${t.id}</strong> • Logged: ${t.date}</span>
                  </div>
                  <h4 style="font-size:15.5px; font-weight:700; color:#fff; margin-top:6px;">${t.title}</h4>
                </div>

                <div style="display:flex; align-items:center; gap:10px;">
                  <span class="nav-badge ${t.status === 'Resolved' ? 'success' : (t.status === 'In Progress' ? 'warning' : 'primary')}">
                    ${t.status}
                  </span>
                </div>
              </div>

              <div style="margin-top:12px; font-size:13.5px; color:#cbd5e1; background:rgba(0,0,0,0.25); padding:12px 16px; border-radius:8px; border-left:3px solid var(--secondary);">
                <strong style="color:#fff; display:block; margin-bottom:2px;">Administrative Resolution Note:</strong>
                ${t.adminReply}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // Contact Dashboard View
  function renderContactView(container) {
    const state = Campus360Data.getState();
    const contacts = state.contacts;

    let html = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">contacts</span>
            Campus Contact Directory & Emergency SOS Network
          </h2>
          <p>Instant phone lines, cabin addresses, consultation timings, and round-the-clock emergency assistance.</p>
        </div>
      </div>

      <!-- Emergency SOS Hotlines -->
      <h3 style="font-size:17px; font-weight:700; color:#fff; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
        <span class="material-symbols-outlined text-danger">crisis_alert</span>
        24x7 Rapid Emergency Assistance (Click to Dial)
      </h3>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-bottom:28px;">
        ${contacts.emergency.map(em => `
          <div style="background:rgba(239, 68, 68, 0.08); border:1px solid rgba(239, 68, 68, 0.3); border-radius:12px; padding:18px; display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:40px; height:40px; border-radius:10px; background:rgba(239,68,68,0.2); display:flex; align-items:center; justify-content:center; color:#f87171;">
                <span class="material-symbols-outlined">${em.icon}</span>
              </div>
              <div>
                <h4 style="font-size:13.5px; font-weight:700; color:#fff;">${em.title}</h4>
                <div style="font-size:14px; font-weight:800; color:#fca5a5; margin-top:2px;">${em.number}</div>
              </div>
            </div>
            <a href="tel:${em.number.replace(/\s+/g, '')}" class="topbar-btn primary" style="background:#ef4444; padding:6px 12px; font-size:12px;">
              <span class="material-symbols-outlined" style="font-size:16px;">call</span>
            </a>
          </div>
        `).join('')}
      </div>

      <!-- Key Department Officers -->
      <div class="dashboard-panel" style="margin-bottom:28px;">
        <div class="panel-header">
          <div class="panel-header-left">
            <span class="material-symbols-outlined text-secondary">corporate_fare</span>
            <h3>Academic Deans & Administrative Offices</h3>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:18px;">
          ${contacts.departments.map(dept => `
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:10px; padding:18px;">
              <h4 style="font-size:15px; font-weight:700; color:#fff;">${dept.dept}</h4>
              <p style="font-size:13px; color:var(--secondary); margin-top:2px;">Head / Dean: <strong>${dept.hod}</strong></p>
              
              <div style="font-size:12px; color:var(--text-dim); margin-top:10px; display:flex; flex-direction:column; gap:4px;">
                <div>📍 Office: <span style="color:#cbd5e1;">${dept.office}</span></div>
                <div>✉️ Email: <a href="mailto:${dept.email}" style="color:var(--secondary); text-decoration:none;">${dept.email}</a></div>
                <div>📞 Phone: <span style="color:#cbd5e1;">${dept.phone}</span></div>
                <div>🕒 Hours: <span style="color:#cbd5e1;">${dept.hours}</span></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Faculty Directory -->
      <div class="dashboard-panel">
        <div class="panel-header">
          <div class="panel-header-left">
            <span class="material-symbols-outlined text-primary-light">school</span>
            <h3>Department Faculty Directory & Office Hours</h3>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:18px;">
          ${contacts.faculty.map(fac => `
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:10px; padding:18px; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <h4 style="font-size:15px; font-weight:700; color:#fff;">${fac.name}</h4>
                <div style="font-size:12px; color:var(--text-dim);">${fac.role}</div>
                <div style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;">
                  ${fac.courses.map(c => `<span class="nav-badge primary" style="font-size:10.5px;">${c}</span>`).join('')}
                </div>

                <div style="font-size:12px; color:var(--text-muted); margin-top:10px; display:flex; flex-direction:column; gap:4px;">
                  <div>Cabin: <strong style="color:#fff;">${fac.cabin}</strong></div>
                  <div>Office Hours: <span style="color:#cbd5e1;">${fac.hours}</span></div>
                  <div>Email: <a href="mailto:${fac.email}" style="color:var(--secondary); text-decoration:none;">${fac.email}</a></div>
                </div>
              </div>

              <div style="margin-top:14px; padding-top:12px; border-top:1px solid var(--border-subtle);">
                <button class="topbar-btn" style="width:100%; justify-content:center; font-size:12px;" onclick="SupportContactModule.openFacultyMessageModal('${fac.name}')">
                  <span class="material-symbols-outlined" style="font-size:16px;">mail</span> Send Message / Book Consultation
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function openTicketModal() {
    const modalContent = `
      <form id="raiseTicketForm" onsubmit="SupportContactModule.handleTicketSubmit(event)">
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">
          Submit your query or maintenance request. It will be routed directly to the concerned campus superintendent.
        </p>

        <div class="form-group">
          <label>Issue Title / Subject:</label>
          <input type="text" class="form-control" id="ticketTitle" placeholder="e.g. WiFi AP disconnects in Tech Tower Room 302" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Category:</label>
            <select class="form-control" id="ticketCategory">
              <option value="IT & Networking">IT & Campus WiFi Network</option>
              <option value="Infrastructure">Classroom & Lab Infrastructure (Projector/AC)</option>
              <option value="Hostel & Facilities">Hostel & Residential Maintenance</option>
              <option value="Academic">Curriculum & Examination Grievance</option>
              <option value="Mess & Dining">Hostel Mess & Dining Quality</option>
            </select>
          </div>
          <div class="form-group">
            <label>Urgency Level:</label>
            <select class="form-control" id="ticketPriority">
              <option value="Normal">Normal (Response within 24h)</option>
              <option value="High">High (Response within 6h)</option>
              <option value="Urgent">Urgent / Emergency Facility Halt</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Detailed Description & Location:</label>
          <textarea class="form-control" id="ticketDescription" rows="3" placeholder="Provide room number, exact problem symptoms, and photos if available..." required></textarea>
        </div>

        <button type="submit" class="topbar-btn primary" style="width:100%; justify-content:center; margin-top:10px;">
          <span class="material-symbols-outlined">send</span> Register Campus Ticket
        </button>
      </form>
    `;

    Campus360App.showModal('Raise Campus Helpdesk Grievance', modalContent);
  }

  function handleTicketSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('ticketTitle').value.trim();
    const cat = document.getElementById('ticketCategory').value;
    const prio = document.getElementById('ticketPriority').value;

    const state = Campus360Data.getState();
    const newTicket = {
      id: 'TKT-' + Math.floor(100 + Math.random() * 900),
      title: title,
      category: cat,
      priority: prio,
      createdBy: state.currentUser.email,
      date: 'Today, 11 Nov 2026',
      status: 'In Progress',
      adminReply: 'Ticket logged with Campus Maintenance supervisor. Work order dispatched.',
      statusHistory: ['Open', 'In Progress']
    };

    Campus360Data.addTicket(newTicket);
    Campus360App.closeModal();
    Campus360App.showToast(`Ticket ${newTicket.id} logged successfully!`, 'success');

    const container = document.getElementById('view-support');
    if (container) renderSupportView(container);
  }

  function openFacultyMessageModal(facultyName) {
    const modalContent = `
      <form onsubmit="event.preventDefault(); Campus360App.closeModal(); Campus360App.showToast('Message sent to ${facultyName}!', 'success');">
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">
          Send a priority academic query or schedule an appointment during office consultation hours.
        </p>

        <div class="form-group">
          <label>Recipient:</label>
          <input type="text" class="form-control" value="${facultyName}" disabled>
        </div>

        <div class="form-group">
          <label>Subject:</label>
          <input type="text" class="form-control" placeholder="e.g. Doubts on Neural Network Backpropagation or Project Sprint Consultation" required>
        </div>

        <div class="form-group">
          <label>Your Message:</label>
          <textarea class="form-control" rows="4" placeholder="Write your question clearly..." required></textarea>
        </div>

        <button type="submit" class="topbar-btn primary" style="width:100%; justify-content:center; margin-top:10px;">
          <span class="material-symbols-outlined">send</span> Send Academic Inquiry
        </button>
      </form>
    `;

    Campus360App.showModal(`Contact ${facultyName}`, modalContent);
  }

  return {
    renderSupportView,
    renderContactView,
    openTicketModal,
    handleTicketSubmit,
    openFacultyMessageModal
  };
})();

