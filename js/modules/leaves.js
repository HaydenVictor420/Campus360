// Campus360 - Leave & On-Duty (OD) Applying Dashboard Module
// Provides comprehensive digital leave workflows, OD regularizations, and gate passes

const LeavesModule = (function () {
  function renderLeavesView(container) {
    const state = Campus360Data.getState();
    const leaves = state.leaves;

    let html = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">description</span>
            Leave & On-Duty (OD) Electronic Portal
          </h2>
          <p>Request medical leave, hackathon OD regularization, or hostel gate passes with automated multi-tier approval tracking.</p>
        </div>
        <div class="view-header-actions">
          <button class="topbar-btn primary" onclick="LeavesModule.openApplyModal()">
            <span class="material-symbols-outlined">add_task</span> Apply for Leave / OD
          </button>
        </div>
      </div>

      <!-- Top KPI Row -->
      <div class="kpi-grid">
        <div class="kpi-card" style="--card-accent: #10b981;">
          <div>
            <div class="kpi-info-label">Active Approved Leaves</div>
            <div class="kpi-info-value" style="color:#10b981;">${leaves.filter(l => l.status === 'Approved').length} Approved</div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">verified</span>
              Attendance regularized on ERP
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">event_available</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #f59e0b;">
          <div>
            <div class="kpi-info-label">Pending Clearance</div>
            <div class="kpi-info-value" style="color:#fcd34d;">${leaves.filter(l => l.status === 'Pending').length} Request</div>
            <div class="kpi-info-sub warning">
              <span class="material-symbols-outlined" style="font-size:16px;">hourglass_top</span>
              Warden / Mentor stage
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">pending_actions</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #3b82f6;">
          <div>
            <div class="kpi-info-label">OD Quota Claimed</div>
            <div class="kpi-info-value">3 <span style="font-size:15px; color:var(--text-dim);">/ 10 Days</span></div>
            <div class="kpi-info-sub success">
              <span class="material-symbols-outlined" style="font-size:16px;">military_tech</span>
              Technical Symposium & Hackathons
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">emoji_events</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #8b5cf6;">
          <div>
            <div class="kpi-info-label">Faculty Advisor</div>
            <div class="kpi-info-value" style="font-size:18px; margin-top:8px;">Dr. Arvind Sharma</div>
            <div class="kpi-info-sub">
              <span class="material-symbols-outlined" style="font-size:16px;">person</span>
              Mentor Approvals Active
            </div>
          </div>
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">approval</span>
          </div>
        </div>
      </div>

      <!-- Requests Table & Approval Pipeline -->
      <div class="dashboard-panel">
        <div class="panel-header">
          <div class="panel-header-left">
            <span class="material-symbols-outlined text-secondary">history</span>
            <h3>Leave & On-Duty Application Registry</h3>
          </div>
          <span style="font-size:12px; color:var(--text-dim);">Tracks Dean, HOD & Hostel Warden Clearances</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:16px;">
          ${leaves.map(l => `
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:12px; padding:20px;">
              <div style="display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                <div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span class="nav-badge ${l.type.includes('OD') ? 'primary' : 'warning'}">${l.type}</span>
                    <span style="font-size:12px; color:var(--text-dim);">App ID: ${l.id}</span>
                  </div>
                  <h4 style="font-size:16px; font-weight:700; color:#fff; margin-top:6px;">${l.category}</h4>
                  <div style="font-size:13px; color:var(--text-muted); margin-top:2px;">
                    Date: <strong style="color:#fff;">${l.fromDate} to ${l.toDate}</strong> (${l.days} Day${l.days > 1 ? 's' : ''})
                  </div>
                </div>

                <div style="text-align:right;">
                  <span class="nav-badge ${l.status === 'Approved' ? 'success' : (l.status === 'Pending' ? 'warning' : 'danger')}" style="font-size:12px;">
                    ${l.status === 'Approved' ? '✓ ' + l.status : l.status}
                  </span>
                  <div style="margin-top:6px;">
                    <button class="topbar-btn" style="padding:4px 10px; font-size:12px;" onclick="LeavesModule.viewPass('${l.id}')">
                      <span class="material-symbols-outlined" style="font-size:15px; color:var(--secondary);">badge</span> Digital Pass
                    </button>
                    ${(state.currentRole === 'staff' || state.currentRole === 'hod' || state.currentRole === 'admin') && l.status === 'Pending' ? `
                      <button class="topbar-btn" style="padding:4px 10px; font-size:12px; background:rgba(16,185,129,0.2); color:#6ee7b7; margin-left:4px;" onclick="LeavesModule.approveLeave('${l.id}')">
                        Approve
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>

              <div style="font-size:13.5px; color:#cbd5e1; margin-top:12px; background:rgba(0,0,0,0.2); padding:10px 14px; border-radius:6px;">
                <strong>Reason:</strong> ${l.reason} • 
                <span style="color:var(--secondary);">Attached: ${l.supportingDoc}</span>
              </div>

              <!-- Visual Approval Pipeline -->
              <div style="margin-top:16px; border-top:1px solid rgba(255,255,255,0.06); padding-top:14px;">
                <div style="font-size:11px; text-transform:uppercase; font-weight:700; color:var(--text-dim); margin-bottom:8px;">
                  Multi-Stage Verification Timeline:
                </div>
                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                  ${l.timeline.map(st => `
                    <div style="display:flex; align-items:center; gap:6px; font-size:12px; color:${st.status === 'done' ? '#10b981' : '#f59e0b'};">
                      <span class="material-symbols-outlined" style="font-size:16px;">
                        ${st.status === 'done' ? 'check_circle' : 'pending'}
                      </span>
                      <span>${st.step} <em style="font-size:10.5px; color:var(--text-dim);">(${st.time})</em></span>
                    </div>
                  `).join('<span style="color:var(--text-dim); font-size:12px;">➔</span>')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function openApplyModal() {
    const state = Campus360Data.getState();

    const modalContent = `
      <form id="applyLeaveForm" onsubmit="LeavesModule.handleApplySubmit(event)">
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">
          Submit digital application. Automatic routing to mentor, HOD, and hostel warden as required.
        </p>

        <div class="form-row">
          <div class="form-group">
            <label>Application Type:</label>
            <select class="form-control" id="leaveType" required>
              <option value="On-Duty (OD)">On-Duty (OD) — Academic / Hackathon / Sports</option>
              <option value="Medical Leave">Medical Leave (Doctor Certificate Attached)</option>
              <option value="Casual Leave">Casual / Personal Emergency</option>
              <option value="Hostel Outing / Gate Pass">Hostel Outing / Night Outing Gate Pass</option>
            </select>
          </div>
          <div class="form-group">
            <label>Category:</label>
            <input type="text" class="form-control" id="leaveCategory" placeholder="e.g. Smart India Hackathon, Sickness" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>From Date:</label>
            <input type="date" class="form-control" id="leaveFromDate" value="2026-11-18" required>
          </div>
          <div class="form-group">
            <label>To Date:</label>
            <input type="date" class="form-control" id="leaveToDate" value="2026-11-20" required>
          </div>
        </div>

        <div class="form-group">
          <label>Supporting Document (PDF / Image Certificate):</label>
          <input type="text" class="form-control" id="leaveDocName" placeholder="e.g. Hackathon_Invitation.pdf or Hospital_Rx.pdf" value="Acceptance_Letter_IITM.pdf" required>
        </div>

        <div class="form-group">
          <label>Detailed Justification / Parent Contact:</label>
          <textarea class="form-control" id="leaveReason" rows="3" placeholder="Provide event details, mentor pre-briefing, and emergency contact..." required>Selected for national finale hackathon. Mentored by Dr. Sharma.</textarea>
        </div>

        <button type="submit" class="topbar-btn primary" style="width:100%; justify-content:center; margin-top:10px;">
          <span class="material-symbols-outlined">send</span> Transmit Application to Approval Queue
        </button>
      </form>
    `;

    Campus360App.showModal('Apply for Leave / On-Duty Clearance', modalContent);
  }

  function handleApplySubmit(e) {
    e.preventDefault();
    const type = document.getElementById('leaveType').value;
    const cat = document.getElementById('leaveCategory').value.trim();
    const fromDate = document.getElementById('leaveFromDate').value;
    const toDate = document.getElementById('leaveToDate').value;
    const docName = document.getElementById('leaveDocName').value.trim();
    const reason = document.getElementById('leaveReason').value.trim();

    const state = Campus360Data.getState();
    const newId = 'LEV-' + Math.floor(100 + Math.random() * 900);

    const newLeave = {
      id: newId,
      studentName: state.currentUser.name,
      studentEmail: state.currentUser.email,
      rollNo: state.currentUser.rollNo || '22CS042',
      type: type,
      category: cat,
      fromDate: fromDate,
      toDate: toDate,
      days: 3,
      reason: reason,
      supportingDoc: docName,
      status: 'Approved', // Auto-approved in interactive portal
      timeline: [
        { step: 'Applied Online', time: 'Just now', status: 'done' },
        { step: 'Mentor Endorsement', time: 'Just now', status: 'done' },
        { step: 'HOD Approval', time: 'Just now', status: 'done' },
        { step: 'Gate Pass Issued', time: 'Just now', status: 'done' }
      ],
      gatePassId: 'GP-' + newId
    };

    Campus360Data.addLeaveRequest(newLeave);
    Campus360App.closeModal();
    Campus360App.showToast(`Leave application registered & approved! Gate Pass ${newLeave.gatePassId} issued.`, 'success');

    viewPass(newLeave.id);

    const container = document.getElementById('view-leaves');
    if (container) renderLeavesView(container);
  }

  function viewPass(leaveId) {
    const state = Campus360Data.getState();
    const l = state.leaves.find(item => item.id === leaveId);
    if (!l) return;

    const modalContent = `
      <div style="display:flex; flex-direction:column; align-items:center; text-align:center; padding:10px;">
        <div style="background:linear-gradient(135deg, #10b981, #06b6d4); color:#fff; width:100%; padding:20px; border-radius:16px 16px 0 0;">
          <span class="material-symbols-outlined" style="font-size:42px;">verified_user</span>
          <h2 style="font-size:22px; font-weight:800; margin-top:4px;">Campus Leave & Gate Pass</h2>
          <p style="font-size:12.5px; opacity:0.9;">Office of the Chief Proctor & Warden</p>
        </div>

        <div style="background:#131826; border:1px solid var(--border-subtle); border-top:none; border-radius:0 0 16px 16px; width:100%; padding:24px;">
          <div style="font-size:20px; font-weight:800; color:#34d399; letter-spacing:0.05em; margin-bottom:12px;">
            ${l.gatePassId || 'GP-OD-2026-9812'}
          </div>

          <div style="display:flex; flex-direction:column; gap:8px; text-align:left; font-size:13px; color:var(--text-muted); background:rgba(255,255,255,0.03); padding:16px; border-radius:10px;">
            <div>Student Name: <strong style="color:#fff;">${l.studentName} (${l.rollNo})</strong></div>
            <div>Category / Type: <strong style="color:#fff;">${l.type} — ${l.category}</strong></div>
            <div>Valid Duration: <strong style="color:#fff;">${l.fromDate} to ${l.toDate}</strong></div>
            <div>Status: <span style="color:#10b981; font-weight:700;">APPROVED & REGULARIZED</span></div>
            <div>Security Checkpoint: <span style="color:#38bdf8;">Authorized for Main Gate Transit</span></div>
          </div>

          <div style="display:flex; gap:10px; margin-top:20px;">
            <button class="topbar-btn" style="flex:1; justify-content:center;" onclick="window.print()">
              <span class="material-symbols-outlined">print</span> Print Physical Pass
            </button>
            <button class="topbar-btn primary" style="flex:1; justify-content:center;" onclick="Campus360App.showToast('Gate Pass QR exported to phone wallet', 'success')">
              <span class="material-symbols-outlined">smartphone</span> Save to Phone
            </button>
          </div>
        </div>
      </div>
    `;

    Campus360App.showModal('Official Campus Leave / Gate Clearance Pass', modalContent);
  }

  function approveLeave(id) {
    const state = Campus360Data.getState();
    const l = state.leaves.find(item => item.id === id);
    if (l) {
      l.status = 'Approved';
      Campus360Data.save();
      Campus360App.showToast(`Leave ${l.id} Approved!`, 'success');
      const container = document.getElementById('view-leaves');
      if (container) renderLeavesView(container);
    }
  }

  return {
    renderLeavesView,
    openApplyModal,
    handleApplySubmit,
    viewPass,
    approveLeave
  };
})();

