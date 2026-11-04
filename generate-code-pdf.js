const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outputFile = path.join(__dirname, 'Campus360_Source_Code_Documentation.pdf');

const filesToInclude = [
  { name: 'server.js', path: 'server.js', type: 'Backend REST API (Node.js/Express)' },
  { name: 'package.json', path: 'package.json', type: 'Project Manifest & Scripts' },
  { name: 'public/index.html', path: 'public/index.html', type: 'Frontend Dashboard & SPA View (HTML5)' },
  { name: 'public/css/style.css', path: 'public/css/style.css', type: 'Complete UI Design System & Responsive Styles (CSS3)' },
  { name: 'public/js/app.js', path: 'public/js/app.js', type: 'App Controller, Sync Engine & Modal Manager (JavaScript)' },
  { name: 'public/js/attendance.js', path: 'public/js/attendance.js', type: 'Attendance Tracker, Safe Bunk Calculator & CSV Importer' },
  { name: 'public/js/syllabus.js', path: 'public/js/syllabus.js', type: 'Syllabus Completion & Topic Tracker (JavaScript)' },
  { name: 'public/js/gpa.js', path: 'public/js/gpa.js', type: 'Semester GPA (SGPA) Dynamic Calculator (JavaScript)' },
  { name: 'public/js/cgpa.js', path: 'public/js/cgpa.js', type: 'Cumulative CGPA Calculator & Target Planner (JavaScript)' },
  { name: 'public/js/settings.js', path: 'public/js/settings.js', type: 'Institutional Rules, Grading Scales & Data Backups' },
  { name: 'data/database.json', path: 'data/database.json', type: 'Sample Dataset & JSON Database Schema' },
  { name: 'README.md', path: 'README.md', type: 'System Architecture & Mathematical Formulas Documentation' }
];

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 45, right: 45 },
  bufferPages: true
});

const writeStream = fs.createWriteStream(outputFile);
doc.pipe(writeStream);

// Cover Page
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0f172a');

doc.fillColor('#38bdf8').fontSize(14).font('Helvetica-Bold')
   .text('CAMPUS360 ACADEMIC PLATFORM', 45, 180, { characterSpacing: 2 });

doc.fillColor('#ffffff').fontSize(28).font('Helvetica-Bold')
   .text('Complete Source Code & Architecture Specification', 45, 210, { width: 500 });

doc.fillColor('#94a3b8').fontSize(12).font('Helvetica')
   .text('Attendance Tracker • Syllabus Tracker • SGPA Calculator • CGPA Planner • REST API', 45, 290);

doc.rect(45, 330, 500, 2).fill('#4f46e5');

doc.fillColor('#e2e8f0').fontSize(11).font('Helvetica')
   .text('Branch: shiffana', 45, 360)
   .text('Repository: https://github.com/HaydenVictor420/Campus360.git', 45, 380)
   .text('Local Endpoint: http://localhost:3000', 45, 400)
   .text('Runtime: Node.js (v24 LTS) / Express.js', 45, 420)
   .text('Generated Date: ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 45, 440);

doc.fillColor('#64748b').fontSize(9).font('Helvetica')
   .text('Confidential & Educational Project Submission — Campus360 Module', 45, 750);

// Table of Contents
doc.addPage();
doc.fillColor('#0f172a').fontSize(22).font('Helvetica-Bold').text('Table of Contents', 45, 50);
doc.moveDown(0.5);
doc.rect(45, doc.y, 505, 1.5).fill('#4f46e5');
doc.moveDown(1.5);

filesToInclude.forEach((f, idx) => {
  const lineY = doc.y;
  doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold')
     .text(`${idx + 1}. ${f.name}`, 45, lineY, { width: 300, continued: false });
  doc.fillColor('#64748b').fontSize(9).font('Helvetica')
     .text(f.type, 260, lineY, { width: 290, align: 'right' });
  doc.moveDown(0.6);
});

// Render Code Files
filesToInclude.forEach((f, fileIdx) => {
  const fullPath = path.join(__dirname, f.path);
  if (!fs.existsSync(fullPath)) return;

  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');

  doc.addPage();
  
  // Section Header Card
  const headerY = 50;
  doc.rect(45, headerY, 505, 36).fill('#f1f5f9');
  doc.rect(45, headerY, 4, 36).fill('#4f46e5');
  
  doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold')
     .text(`${fileIdx + 1}. ${f.name}`, 58, headerY + 7);
  doc.fillColor('#64748b').fontSize(9).font('Helvetica')
     .text(f.type + ` (${lines.length} lines)`, 58, headerY + 22);

  doc.y = headerY + 48;

  // Print code lines
  doc.font('Courier').fontSize(7.2);
  const lineHeight = 9.5;

  lines.forEach((line, lineIdx) => {
    // Check if new page is needed
    if (doc.y > doc.page.height - 55) {
      doc.addPage();
      doc.y = 50;
      doc.font('Courier').fontSize(7.2);
    }

    const curY = doc.y;
    // Line number gutter
    doc.fillColor('#94a3b8').text(String(lineIdx + 1).padStart(4, ' '), 45, curY, { width: 28, align: 'right' });
    
    // Code text
    const sanitizedLine = line.replace(/\t/g, '  ').replace(/[\r\n]/g, '');
    doc.fillColor('#1e293b').text(sanitizedLine, 80, curY, { width: 470 });

    doc.y = curY + lineHeight;
  });
});

// Add Page Numbering & Footers across all pages
const pageCount = doc.bufferedPageRange().count;
for (let i = 0; i < pageCount; i++) {
  doc.switchToPage(i);
  if (i === 0) continue; // Skip cover

  doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
     .text('Campus360 Module — Complete Source Code', 45, doc.page.height - 35);
  doc.text(`Page ${i + 1} of ${pageCount}`, doc.page.width - 120, doc.page.height - 35, { width: 75, align: 'right' });
  doc.rect(45, doc.page.height - 42, 505, 0.5).fill('#e2e8f0');
}

doc.end();

writeStream.on('finish', () => {
  const stats = fs.statSync(outputFile);
  console.log(`PDF Generated Successfully: ${outputFile} (${(stats.size / 1024).toFixed(1)} KB, ${pageCount} pages)`);
});
