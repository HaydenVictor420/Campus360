// Campus360 - Modular Extensibility Hub ("Space for Further Dashboards to Add")
// Allows dynamic addition and integration of future university modules and pre-reserved services

const ExtensibilityModule = (function () {
  function renderExtensibilityView(container) {
    const state = Campus360Data.getState();
    const modules = state.customModules;

    let html = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>
            <span class="material-symbols-outlined text-secondary" style="font-size:32px;">extension</span>
            Modular Extensibility Engine & Future Dashboards Hub
          </h2>
          <p>Pluggable architecture fulfilling campus scalability. Pre-reserved integrations and a dynamic custom dashboard creator.</p>
        </div>
        <div class="view-header-actions">
          <button class="topbar-btn primary" onclick="ExtensibilityModule.openCreateModuleModal()">
            <span class="material-symbols-outlined">add_box</span> Add Custom Dashboard Module
          </button>
        </div>
      </div>

      <!-- Hero Callout -->
      <div class="extensibility-hero">
        <div class="extensibility-hero-text">
          <h3>Architected for Infinite Academic Expansion 🚀</h3>
          <p>Campus360 is built with a decoupled micro-frontend plugin architecture. Whether your institution needs IoT smart bus tracking, biometric hostel mess rebate, or alumni mentoring, you can deploy new modules with zero downtime.</p>
        </div>
        <button class="topbar-btn primary" style="background:linear-gradient(135deg, #06b6d4, #4f46e5); font-weight:700;" onclick="ExtensibilityModule.openCreateModuleModal()">
          <span class="material-symbols-outlined">rocket_launch</span> Launch Custom Workspace
        </button>
      </div>

      <!-- Pre-Reserved Expansion Modules Catalog -->
      <h3 style="font-size:18px; font-weight:700; color:#fff; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
        <span class="material-symbols-outlined text-primary-light">widgets</span>
        Active & Ready-to-Deploy Institutional Micro-Dashboards
      </h3>

      <div class="modules-catalog-grid">
        ${modules.map(m => `
          <div class="custom-module-card" style="--card-color:${m.color || '#4f46e5'};">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div style="width:42px; height:42px; border-radius:10px; background:rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center; color:${m.color || 'var(--secondary)'};">
                    <span class="material-symbols-outlined" style="font-size:24px;">${m.icon || 'dashboard_customize'}</span>
                  </div>
                  <div>
                    <h4 style="font-size:16px; font-weight:700; color:#fff;">${m.name}</h4>
                    <span style="font-size:11.5px; color:var(--text-dim);">${m.id}</span>
                  </div>
                </div>
                <span class="nav-badge success">${m.badge || 'Ready'}</span>
              </div>

              <p style="font-size:13px; color:var(--text-muted); margin-top:14px; line-height:1.5;">
                ${m.description}
              </p>

              <div style="font-size:12px; color:#cbd5e1; margin-top:14px; padding:10px 14px; background:rgba(0,0,0,0.25); border-radius:8px; border-left:3px solid ${m.color || 'var(--primary)'};">
                <strong>Live Telemetry:</strong> ${m.stats}
              </div>
            </div>

            <div style="display:flex; gap:8px; margin-top:16px; padding-top:12px; border-top:1px solid var(--border-subtle);">
              <button class="topbar-btn primary" style="flex:1; justify-content:center; font-size:12.5px;" onclick="ExtensibilityModule.launchModule('${m.id}')">
                <span class="material-symbols-outlined" style="font-size:16px;">open_in_new</span> Launch Dashboard
              </button>
              <button class="topbar-btn" style="font-size:12.5px;" onclick="Campus360App.showToast('Module settings synced', 'info')">
                <span class="material-symbols-outlined" style="font-size:16px;">settings</span>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  function openCreateModuleModal() {
    const modalContent = `
      <form id="createModuleForm" onsubmit="ExtensibilityModule.handleCreateModuleSubmit(event)">
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">
          Instantiate a new foreground GUI dashboard. This dynamically registers a live route, navigation link, and interactive viewport container.
        </p>

        <div class="form-group">
          <label>Dashboard Module Name:</label>
          <input type="text" class="form-control" id="newModName" placeholder="e.g. Sports & Gymnasium Slot Booking" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Category Tag:</label>
            <input type="text" class="form-control" id="newModTag" placeholder="e.g. Campus Life" value="Campus Services" required>
          </div>
          <div class="form-group">
            <label>Icon (Google Material Symbol):</label>
            <select class="form-control" id="newModIcon">
              <option value="fitness_center">fitness_center (Gym / Sports)</option>
              <option value="payments">payments (Fee Payment & Dues)</option>
              <option value="psychology">psychology (AI Mentor Hub)</option>
              <option value="hotel">hotel (Hostel Room Allotment)</option>
              <option value="verified">verified (Certificate Repository)</option>
              <option value="dashboard_customize">dashboard_customize (Custom)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Layout & Data Architecture:</label>
          <select class="form-control" id="newModLayout">
            <option value="grid">Responsive KPI Bento Grid & Cards</option>
            <option value="table">Interactive Searchable Data Table</option>
            <option value="timeline">Chronological Event Stream</option>
            <option value="map">Interactive Geo / Facility Blueprint Map</option>
          </select>
        </div>

        <div class="form-group">
          <label>Module Description & Objectives:</label>
          <textarea class="form-control" id="newModDesc" rows="3" placeholder="Explain the problem this new dashboard solves..." required>Centralized reservation for badminton courts, swimming pool, and equipment rental.</textarea>
        </div>

        <div class="form-group">
          <label>Role Permissions (Who can access):</label>
          <div style="display:flex; gap:16px; flex-wrap:wrap; font-size:13px; color:#cbd5e1; margin-top:6px;">
            <label><input type="checkbox" checked> Students</label>
            <label><input type="checkbox" checked> Staff</label>
            <label><input type="checkbox" checked> HODs</label>
            <label><input type="checkbox" checked> Admins</label>
            <label><input type="checkbox"> Parents</label>
          </div>
        </div>

        <button type="submit" class="topbar-btn primary" style="width:100%; justify-content:center; margin-top:10px;">
          <span class="material-symbols-outlined">rocket_launch</span> Deploy Dashboard to Campus360
        </button>
      </form>
    `;

    Campus360App.showModal('Add & Deploy New Campus Dashboard', modalContent);
  }

  function handleCreateModuleSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('newModName').value.trim();
    const tag = document.getElementById('newModTag').value.trim();
    const icon = document.getElementById('newModIcon').value;
    const desc = document.getElementById('newModDesc').value.trim();
    const layout = document.getElementById('newModLayout').value;

    const newMod = {
      id: 'MOD-' + Date.now().toString().slice(-4),
      name: name,
      icon: icon,
      badge: tag,
      status: 'Active',
      description: desc,
      stats: 'Newly Deployed • Initializing Telemetry Streams...',
      layoutType: layout,
      color: '#10b981'
    };

    Campus360Data.addCustomModule(newMod);
    Campus360App.closeModal();
    Campus360App.showToast(`New Dashboard "${name}" deployed successfully!`, 'success');

    // Refresh view
    const container = document.getElementById('view-extensibility');
    if (container) renderExtensibilityView(container);
  }

  function launchModule(modId) {
    const state = Campus360Data.getState();
    const mod = state.customModules.find(m => m.id === modId);
    if (!mod) return;

    const modalContent = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="background:linear-gradient(135deg, rgba(79,70,229,0.2), rgba(6,182,212,0.15)); padding:18px; border-radius:12px; border:1px solid var(--border-subtle); display:flex; align-items:center; gap:14px;">
          <div style="width:48px; height:48px; border-radius:12px; background:rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; color:var(--secondary);">
            <span class="material-symbols-outlined" style="font-size:28px;">${mod.icon}</span>
          </div>
          <div>
            <h3 style="font-size:18px; font-weight:800; color:#fff;">${mod.name}</h3>
            <p style="font-size:12.5px; color:var(--text-muted);">${mod.description}</p>
          </div>
        </div>

        <div class="dashboard-panel" style="padding:20px;">
          <h4 style="font-size:14px; color:#fff; margin-bottom:10px;">Live Data Feed & Controls</h4>
          <div style="font-size:13px; color:#cbd5e1; line-height:1.6; background:rgba(0,0,0,0.25); padding:14px; border-radius:8px;">
            ${mod.stats}<br>
            <span style="color:#10b981; font-weight:600;">✓ Endpoint connected: /api/modules/${mod.id.toLowerCase()}</span><br>
            <span style="color:var(--text-dim); font-size:12px;">Authenticated with Campus360 Core Security Context</span>
          </div>
        </div>

        <div style="display:flex; gap:10px;">
          <button class="topbar-btn primary" style="flex:1; justify-content:center;" onclick="Campus360App.showToast('Module action executed successfully', 'success')">
            <span class="material-symbols-outlined">play_arrow</span> Run Module Workflow
          </button>
        </div>
      </div>
    `;

    Campus360App.showModal(`Workspace: ${mod.name}`, modalContent);
  }

  return {
    renderExtensibilityView,
    openCreateModuleModal,
    handleCreateModuleSubmit,
    launchModule
  };
})();

