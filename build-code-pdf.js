const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectDir = __dirname;
const outputFileHtml = path.join(projectDir, 'Campus360_Source_Code.html');
const outputFilePdf = path.join(projectDir, 'Campus360_Source_Code.pdf');

const filesToInclude = [
  { name: 'README.md', lang: 'markdown', desc: 'Project Overview, IEEE Research Mapping & System Architecture' },
  { name: 'package.json', lang: 'json', desc: 'Project Metadata, Dependencies & NPM Scripts' },
  { name: 'server.js', lang: 'javascript', desc: 'Zero-Dependency HTTP Server & Port Failover' },
  { name: 'index.html', lang: 'html', desc: 'Web Display Layer (Tier 1) - Multi-Role Dashboard HTML' },
  { name: 'styles.css', lang: 'css', desc: 'Styling & Visual Design System (CSS3 Variables & Responsive Layout)' },
  { name: 'data.js', lang: 'javascript', desc: 'Data Layer (Tier 4) - Seed Data & Entity Schemas' },
  { name: 'app.js', lang: 'javascript', desc: 'Business Logic Layer (Tier 2) & Data Access Layer (Tier 3)' },
  { name: 'start.bat', lang: 'bat', desc: 'Windows One-Click Startup Script' },
  { name: '.gitignore', lang: 'plaintext', desc: 'Git Ignored Files Specification' }
];

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let tocItems = '';
let filesContentHtml = '';
let totalLines = 0;

filesToInclude.forEach((f, idx) => {
  const filePath = path.join(projectDir, f.name);
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  totalLines += lines.length;

  tocItems += `
    <tr>
      <td class="toc-num">${idx + 1}</td>
      <td class="toc-file"><a href="#file-${idx}">${f.name}</a></td>
      <td class="toc-desc">${f.desc}</td>
      <td class="toc-lang">${f.lang.toUpperCase()}</td>
      <td class="toc-lines">${lines.length.toLocaleString()} lines</td>
    </tr>
  `;

  const numberedCode = lines
    .map((line, lIdx) => `<span class="line-num">${lIdx + 1}</span><span class="line-text">${escapeHtml(line) || '&nbsp;'}</span>`)
    .join('\n');

  filesContentHtml += `
    <div class="file-section" id="file-${idx}">
      <div class="file-header">
        <div class="file-meta">
          <span class="file-badge file-badge-num">#${idx + 1}</span>
          <span class="file-badge file-badge-lang">${f.lang.toUpperCase()}</span>
          <h2 class="file-title">${f.name}</h2>
        </div>
        <div class="file-stats">
          <span>${lines.length.toLocaleString()} lines</span>
          <span>&bull;</span>
          <span>${(raw.length / 1024).toFixed(1)} KB</span>
        </div>
      </div>
      <div class="file-description">${f.desc}</div>
      <pre class="code-block"><code>${numberedCode}</code></pre>
    </div>
  `;
});

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Campus360 — Full Source Code Documentation</title>
<style>
  @page {
    size: A4;
    margin: 14mm 12mm 14mm 12mm;
    @bottom-right {
      content: counter(page);
    }
  }

  * {
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    margin: 0;
    padding: 0;
    font-size: 11pt;
    line-height: 1.5;
  }

  /* Cover Page */
  .cover-page {
    padding: 60px 30px;
    min-height: 90vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-after: always;
  }

  .cover-badge {
    display: inline-block;
    background: #eff6ff;
    color: #2563eb;
    border: 1px solid #bfdbfe;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 10pt;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 24px;
  }

  .cover-title {
    font-size: 30pt;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.15;
    margin: 0 0 16px 0;
  }

  .cover-subtitle {
    font-size: 14pt;
    color: #475569;
    margin: 0 0 32px 0;
    line-height: 1.4;
  }

  .cover-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px 24px;
    margin-bottom: 30px;
  }

  .cover-card h3 {
    margin: 0 0 12px 0;
    font-size: 12pt;
    color: #1e293b;
    font-weight: 700;
  }

  .cover-card ul {
    margin: 0;
    padding-left: 20px;
    color: #475569;
    font-size: 10pt;
    line-height: 1.6;
  }

  .cover-meta-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-top: 20px;
  }

  .cover-meta-item {
    background: #f1f5f9;
    border-radius: 6px;
    padding: 12px 16px;
  }

  .cover-meta-label {
    font-size: 8pt;
    text-transform: uppercase;
    color: #64748b;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .cover-meta-val {
    font-size: 11pt;
    font-weight: 600;
    color: #0f172a;
    margin-top: 4px;
    word-break: break-all;
  }

  /* Table of Contents */
  .toc-section {
    page-break-after: always;
    padding-top: 20px;
  }

  .toc-title {
    font-size: 20pt;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 8px;
  }

  .toc-subtitle {
    color: #64748b;
    font-size: 10pt;
    margin-bottom: 24px;
  }

  table.toc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
  }

  table.toc-table th {
    text-align: left;
    padding: 10px 12px;
    background: #f1f5f9;
    border-bottom: 2px solid #cbd5e1;
    color: #334155;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 8pt;
    letter-spacing: 0.05em;
  }

  table.toc-table td {
    padding: 10px 12px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
  }

  .toc-num {
    font-weight: 700;
    color: #64748b;
    width: 30px;
  }

  .toc-file a {
    color: #2563eb;
    text-decoration: none;
    font-weight: 600;
    font-family: "Consolas", monospace;
  }

  .toc-desc {
    color: #475569;
  }

  .toc-lang {
    font-weight: 600;
    color: #64748b;
    font-size: 8pt;
  }

  .toc-lines {
    text-align: right;
    font-weight: 600;
    color: #334155;
    font-family: "Consolas", monospace;
  }

  /* File Sections */
  .file-section {
    page-break-before: always;
    margin-top: 10px;
  }

  .file-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 10px;
    margin-bottom: 8px;
  }

  .file-meta {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .file-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
  }

  .file-badge-num {
    background: #0f172a;
    color: #ffffff;
  }

  .file-badge-lang {
    background: #dbeafe;
    color: #1e40af;
  }

  .file-title {
    margin: 0;
    font-size: 15pt;
    font-family: "Consolas", "Courier New", monospace;
    color: #0f172a;
  }

  .file-stats {
    font-size: 9pt;
    color: #64748b;
    display: flex;
    gap: 8px;
    font-family: "Consolas", monospace;
  }

  .file-description {
    font-size: 9.5pt;
    color: #475569;
    margin-bottom: 14px;
    font-style: italic;
  }

  /* Code Blocks */
  pre.code-block {
    margin: 0;
    padding: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-family: "Consolas", "Courier New", monospace;
    font-size: 8pt;
    line-height: 1.45;
    color: #0f172a;
    white-space: pre-wrap;
    word-break: break-all;
    overflow: hidden;
  }

  .line-num {
    display: inline-block;
    width: 42px;
    color: #94a3b8;
    user-select: none;
    text-align: right;
    margin-right: 12px;
    border-right: 1px solid #e2e8f0;
    padding-right: 8px;
    font-size: 7.5pt;
  }

  .line-text {
    display: inline;
  }
</style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    <div>
      <div class="cover-badge">Source Code Documentation</div>
      <h1 class="cover-title">Campus360</h1>
      <div class="cover-subtitle">Educational Institution Management Information System (IMS) — Proof of Concept</div>

      <div class="cover-card">
        <h3>🏛️ IEEE Research Paper Specifications Implemented</h3>
        <ul>
          <li><strong>IEEE 10058674</strong>: <em>"Institution Management System: Student Module"</em> — Record consolidation, dossier modal, promotion engine, placement & internship directorate.</li>
          <li><strong>IEEE 10516390</strong>: <em>"Educational Institution Management Information System"</em> — Centralized multi-role web platform (Admin, Faculty, Student) with institutional broadcast engine.</li>
          <li><strong>IEEE 7384005</strong>: <em>"College Student Management System Design Using Computer Aided System"</em> — 4-Tier Computer-Aided Architecture & Relational Entity-Relationship Model.</li>
        </ul>
      </div>
    </div>

    <div>
      <div class="cover-meta-grid">
        <div class="cover-meta-item">
          <div class="cover-meta-label">GitHub Repository</div>
          <div class="cover-meta-val">HaydenVictor420/Campus360</div>
        </div>
        <div class="cover-meta-item">
          <div class="cover-meta-label">Git Branch</div>
          <div class="cover-meta-val">muhil</div>
        </div>
        <div class="cover-meta-item">
          <div class="cover-meta-label">Local Server URL</div>
          <div class="cover-meta-val">http://localhost:3000</div>
        </div>
        <div class="cover-meta-item">
          <div class="cover-meta-label">Total Codebase Volume</div>
          <div class="cover-meta-val">${filesToInclude.length} files &bull; ${totalLines.toLocaleString()} total lines</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Table of Contents -->
  <div class="toc-section">
    <h2 class="toc-title">Table of Contents</h2>
    <div class="toc-subtitle">Comprehensive listing of all project source code modules, schemas, and configurations.</div>
    <table class="toc-table">
      <thead>
        <tr>
          <th>#</th>
          <th>File Name</th>
          <th>Module Description</th>
          <th>Language</th>
          <th>Lines</th>
        </tr>
      </thead>
      <tbody>
        ${tocItems}
      </tbody>
    </table>
  </div>

  <!-- All Source Code Files -->
  ${filesContentHtml}

</body>
</html>
`;

fs.writeFileSync(outputFileHtml, fullHtml, 'utf8');
console.log('Generated HTML preview at:', outputFileHtml);

// Compile to PDF using Edge Headless
console.log('Compiling to PDF using Microsoft Edge...');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const cmd = `"${edgePath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputFilePdf}" "${outputFileHtml}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  const stats = fs.statSync(outputFilePdf);
  console.log(`Successfully generated PDF: ${outputFilePdf} (${(stats.size / 1024).toFixed(1)} KB)`);
} catch (err) {
  console.error('Error generating PDF:', err.message);
  process.exit(1);
}
