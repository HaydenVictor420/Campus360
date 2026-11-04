const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'database.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helpers for Database read/write
function readDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      throw new Error('Database file does not exist');
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database:', err);
    return {
      settings: { minAttendanceThreshold: 75, warningMargin: 5, institutionRule: 'weighted_credits', gradeScale: [] },
      attendance: [],
      syllabus: [],
      gpaCourses: [],
      cgpaSemesters: []
    };
  }
}

function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}

// Attendance Calculation Helper
function enrichAttendanceRecord(rec, threshold, margin) {
  const conducted = parseInt(rec.conducted, 10) || 0;
  const attended = parseInt(rec.attended, 10) || 0;
  const t = parseFloat(threshold) || 75;
  const m = parseFloat(margin) || 5;

  let percentage = null;
  let status = 'none'; // 'safe' | 'warning' | 'danger' | 'none'
  let classesNeeded = 0;
  let safeBunks = 0;

  if (conducted > 0) {
    percentage = Math.round((attended / conducted) * 10000) / 100;
    if (percentage >= t) {
      status = 'safe';
      // Calculate how many subsequent classes student can miss safely:
      // (attended) / (conducted + m) >= t / 100
      // m <= (100 * attended - t * conducted) / t
      const maxBunks = Math.floor((100 * attended - t * conducted) / t);
      safeBunks = Math.max(0, maxBunks);
      classesNeeded = 0;
    } else {
      if (percentage >= t - m) {
        status = 'warning';
      } else {
        status = 'danger';
      }
      // Calculate how many consecutive classes must be attended to reach threshold:
      // (attended + n) / (conducted + n) >= t / 100
      // 100*(attended + n) >= t*(conducted + n)
      // n*(100 - t) >= t*conducted - 100*attended
      if (t < 100) {
        const needed = Math.ceil((t * conducted - 100 * attended) / (100 - t));
        classesNeeded = Math.max(0, needed);
      } else {
        classesNeeded = conducted - attended;
      }
      safeBunks = 0;
    }
  }

  return {
    ...rec,
    conducted,
    attended,
    percentage,
    status,
    classesNeeded,
    safeBunks,
    threshold: t
  };
}

// Syllabus Calculation Helper
function enrichSyllabusRecord(item) {
  const units = item.units || [];
  let totalTopics = 0;
  let completedTopics = 0;

  const enrichedUnits = units.map(u => {
    const tot = parseInt(u.topicsTotal, 10) || 0;
    const comp = parseInt(u.topicsCompleted, 10) || 0;
    totalTopics += tot;
    completedTopics += comp;
    const unitPct = tot > 0 ? Math.round((comp / tot) * 100) : 0;
    let unitStatus = u.status;
    if (unitPct === 100) unitStatus = 'Completed';
    else if (unitPct > 0) unitStatus = 'In Progress';
    else unitStatus = 'Not Started';

    return {
      ...u,
      topicsTotal: tot,
      topicsCompleted: comp,
      percentage: unitPct,
      status: unitStatus
    };
  });

  const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  let status = 'Not Started';
  if (percentage === 100) status = 'Completed';
  else if (percentage >= 60) status = 'On Track';
  else if (percentage > 0) status = 'In Progress';

  return {
    ...item,
    totalTopics,
    completedTopics,
    percentage,
    status,
    units: enrichedUnits
  };
}

// ==================== API ROUTES ====================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Campus360 Tracker' });
});

// Full Dashboard Stats
app.get('/api/dashboard', (req, res) => {
  const db = readDatabase();
  const threshold = db.settings?.minAttendanceThreshold || 75;
  const margin = db.settings?.warningMargin || 5;

  // Attendance stats
  let totalConducted = 0;
  let totalAttended = 0;
  let safeCount = 0;
  let warningCount = 0;
  let dangerCount = 0;
  const attendanceAlerts = [];

  const attendanceList = (db.attendance || []).map(item => {
    const enriched = enrichAttendanceRecord(item, threshold, margin);
    totalConducted += enriched.conducted;
    totalAttended += enriched.attended;

    if (enriched.status === 'safe') safeCount++;
    else if (enriched.status === 'warning') {
      warningCount++;
      attendanceAlerts.push({
        type: 'warning',
        subject: enriched.name,
        code: enriched.code,
        percentage: enriched.percentage,
        message: `Attendance is near threshold margin (${enriched.percentage}%). Need ${enriched.classesNeeded} more class(es).`
      });
    } else if (enriched.status === 'danger') {
      dangerCount++;
      attendanceAlerts.push({
        type: 'danger',
        subject: enriched.name,
        code: enriched.code,
        percentage: enriched.percentage,
        message: `Attendance shortage (${enriched.percentage}% < ${threshold}%). Must attend next ${enriched.classesNeeded} consecutive class(es).`
      });
    }
    return enriched;
  });

  const overallAttendance = totalConducted > 0 
    ? Math.round((totalAttended / totalConducted) * 10000) / 100 
    : 0;

  // GPA calculation
  let totalGpaCredits = 0;
  let totalGpaPointsWeighted = 0;
  (db.gpaCourses || []).forEach(c => {
    const creds = parseFloat(c.credits) || 0;
    const pts = parseFloat(c.points) || 0;
    totalGpaCredits += creds;
    totalGpaPointsWeighted += (creds * pts);
  });
  const currentSemesterGPA = totalGpaCredits > 0 
    ? Math.round((totalGpaPointsWeighted / totalGpaCredits) * 100) / 100 
    : 0;

  // CGPA calculation
  let totalCgpaCredits = 0;
  let totalCgpaPointsWeighted = 0;
  (db.cgpaSemesters || []).forEach(s => {
    const creds = parseFloat(s.credits) || 0;
    const sgpa = parseFloat(s.sgpa) || 0;
    totalCgpaCredits += creds;
    totalCgpaPointsWeighted += (creds * sgpa);
  });
  const cumulativeCGPA = totalCgpaCredits > 0 
    ? Math.round((totalCgpaPointsWeighted / totalCgpaCredits) * 100) / 100 
    : 0;

  // Syllabus stats
  let totalSyllabusTopics = 0;
  let completedSyllabusTopics = 0;
  const syllabusList = (db.syllabus || []).map(enrichSyllabusRecord);
  syllabusList.forEach(s => {
    totalSyllabusTopics += s.totalTopics;
    completedSyllabusTopics += s.completedTopics;
  });
  const overallSyllabusPercentage = totalSyllabusTopics > 0 
    ? Math.round((completedSyllabusTopics / totalSyllabusTopics) * 100) 
    : 0;

  res.json({
    summary: {
      overallAttendance,
      totalConducted,
      totalAttended,
      totalSubjects: attendanceList.length,
      safeSubjects: safeCount,
      warningSubjects: warningCount,
      dangerSubjects: dangerCount,
      currentSemesterGPA,
      totalGpaCredits,
      cumulativeCGPA,
      totalCgpaCredits,
      overallSyllabusPercentage,
      totalSyllabusTopics,
      completedSyllabusTopics
    },
    alerts: attendanceAlerts,
    attendanceOverview: attendanceList,
    syllabusOverview: syllabusList.map(s => ({
      id: s.id,
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      percentage: s.percentage,
      status: s.status,
      completedTopics: s.completedTopics,
      totalTopics: s.totalTopics
    }))
  });
});

// ==================== ATTENDANCE ENDPOINTS ====================

app.get('/api/attendance', (req, res) => {
  const db = readDatabase();
  const threshold = db.settings?.minAttendanceThreshold || 75;
  const margin = db.settings?.warningMargin || 5;
  const records = (db.attendance || []).map(r => enrichAttendanceRecord(r, threshold, margin));
  res.json(records);
});

app.post('/api/attendance', (req, res) => {
  const { code, name, conducted, attended, faculty } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Subject name is required.' });
  }

  const cond = parseInt(conducted, 10);
  const att = parseInt(attended, 10);

  if (isNaN(cond) || cond < 0 || isNaN(att) || att < 0) {
    return res.status(400).json({ error: 'Conducted and attended classes must be non-negative numbers.' });
  }

  if (att > cond) {
    return res.status(400).json({ error: 'Attended classes cannot exceed total conducted classes.' });
  }

  const db = readDatabase();
  const newRecord = {
    id: 'att_' + Date.now(),
    code: (code || '').trim() || 'SUB-' + (db.attendance.length + 1),
    name: name.trim(),
    conducted: cond,
    attended: att,
    faculty: (faculty || '').trim(),
    lastUpdated: new Date().toISOString().split('T')[0]
  };

  db.attendance.push(newRecord);

  // Also initialize syllabus tracker for this subject if not exists
  const existingSyllabus = (db.syllabus || []).find(s => s.subjectCode === newRecord.code);
  if (!existingSyllabus) {
    db.syllabus.push({
      id: 'syl_' + Date.now(),
      subjectCode: newRecord.code,
      subjectName: newRecord.name,
      totalUnits: 5,
      units: [
        { unitNo: 1, title: 'Unit 1: Fundamentals', topicsTotal: 5, topicsCompleted: 0, status: 'Not Started' },
        { unitNo: 2, title: 'Unit 2: Core Concepts', topicsTotal: 5, topicsCompleted: 0, status: 'Not Started' },
        { unitNo: 3, title: 'Unit 3: Intermediate Topics', topicsTotal: 5, topicsCompleted: 0, status: 'Not Started' },
        { unitNo: 4, title: 'Unit 4: Advanced Systems', topicsTotal: 5, topicsCompleted: 0, status: 'Not Started' },
        { unitNo: 5, title: 'Unit 5: Applications & Case Studies', topicsTotal: 5, topicsCompleted: 0, status: 'Not Started' }
      ]
    });
  }

  writeDatabase(db);
  const enriched = enrichAttendanceRecord(newRecord, db.settings.minAttendanceThreshold, db.settings.warningMargin);
  res.status(201).json(enriched);
});

app.put('/api/attendance/:id', (req, res) => {
  const { id } = req.params;
  const { code, name, conducted, attended, faculty } = req.body;

  const db = readDatabase();
  const index = db.attendance.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Attendance record not found.' });
  }

  const cond = parseInt(conducted, 10);
  const att = parseInt(attended, 10);

  if (isNaN(cond) || cond < 0 || isNaN(att) || att < 0) {
    return res.status(400).json({ error: 'Conducted and attended classes must be non-negative numbers.' });
  }
  if (att > cond) {
    return res.status(400).json({ error: 'Attended classes cannot exceed total conducted classes.' });
  }

  const oldCode = db.attendance[index].code;
  db.attendance[index] = {
    ...db.attendance[index],
    code: (code || db.attendance[index].code).trim(),
    name: (name || db.attendance[index].name).trim(),
    conducted: cond,
    attended: att,
    faculty: faculty !== undefined ? faculty.trim() : db.attendance[index].faculty,
    lastUpdated: new Date().toISOString().split('T')[0]
  };

  // Sync subject name/code in syllabus if changed
  const syl = (db.syllabus || []).find(s => s.subjectCode === oldCode);
  if (syl) {
    syl.subjectCode = db.attendance[index].code;
    syl.subjectName = db.attendance[index].name;
  }

  writeDatabase(db);
  const enriched = enrichAttendanceRecord(db.attendance[index], db.settings.minAttendanceThreshold, db.settings.warningMargin);
  res.json(enriched);
});

app.delete('/api/attendance/:id', (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  const index = db.attendance.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Attendance record not found.' });
  }

  const removed = db.attendance.splice(index, 1)[0];
  writeDatabase(db);
  res.json({ message: 'Subject removed successfully', removed });
});

// Quick increment (+1 attended, or +1 missed)
app.post('/api/attendance/:id/increment', (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'present' or 'absent'

  const db = readDatabase();
  const rec = db.attendance.find(a => a.id === id);
  if (!rec) {
    return res.status(404).json({ error: 'Attendance record not found.' });
  }

  rec.conducted = (rec.conducted || 0) + 1;
  if (action === 'present') {
    rec.attended = (rec.attended || 0) + 1;
  }
  rec.lastUpdated = new Date().toISOString().split('T')[0];

  writeDatabase(db);
  const enriched = enrichAttendanceRecord(rec, db.settings.minAttendanceThreshold, db.settings.warningMargin);
  res.json(enriched);
});

// Bulk Import Attendance
app.post('/api/attendance/bulk', (req, res) => {
  const { items, replaceExisting } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty bulk import dataset.' });
  }

  const errors = [];
  const validItems = [];

  items.forEach((item, idx) => {
    const rowNum = idx + 1;
    const name = item.name || item.subject || item.Subject;
    const code = item.code || item.subjectCode || item.Code || `SUB-${rowNum}`;
    const conducted = parseInt(item.conducted || item.classesHeld || item.classes_conducted || item.Conducted, 10);
    const attended = parseInt(item.attended || item.classesAttended || item.classes_attended || item.Attended, 10);

    if (!name || name.toString().trim() === '') {
      errors.push(`Row ${rowNum}: Subject name is missing.`);
      return;
    }
    if (isNaN(conducted) || conducted < 0) {
      errors.push(`Row ${rowNum} (${name}): Invalid conducted classes.`);
      return;
    }
    if (isNaN(attended) || attended < 0) {
      errors.push(`Row ${rowNum} (${name}): Invalid attended classes.`);
      return;
    }
    if (attended > conducted) {
      errors.push(`Row ${rowNum} (${name}): Attended classes (${attended}) exceed conducted (${conducted}).`);
      return;
    }

    validItems.push({
      id: 'att_' + Date.now() + '_' + idx,
      code: code.toString().trim(),
      name: name.toString().trim(),
      conducted,
      attended,
      faculty: (item.faculty || '').toString().trim(),
      lastUpdated: new Date().toISOString().split('T')[0]
    });
  });

  if (validItems.length === 0) {
    return res.status(400).json({ error: 'No valid records found in the import.', details: errors });
  }

  const db = readDatabase();
  if (replaceExisting) {
    db.attendance = validItems;
  } else {
    // Merge or append
    validItems.forEach(newItem => {
      const existingIdx = db.attendance.findIndex(a => a.name.toLowerCase() === newItem.name.toLowerCase() || a.code.toLowerCase() === newItem.code.toLowerCase());
      if (existingIdx !== -1) {
        db.attendance[existingIdx] = newItem;
      } else {
        db.attendance.push(newItem);
      }
    });
  }

  writeDatabase(db);
  res.json({
    message: `Successfully imported ${validItems.length} records.`,
    count: validItems.length,
    errors: errors.length > 0 ? errors : undefined
  });
});

// ==================== SYLLABUS ENDPOINTS ====================

app.get('/api/syllabus', (req, res) => {
  const db = readDatabase();
  const list = (db.syllabus || []).map(enrichSyllabusRecord);
  res.json(list);
});

app.post('/api/syllabus', (req, res) => {
  const { subjectCode, subjectName, totalUnits, units } = req.body;
  if (!subjectName) {
    return res.status(400).json({ error: 'Subject name is required.' });
  }

  const db = readDatabase();
  const newSyl = {
    id: 'syl_' + Date.now(),
    subjectCode: (subjectCode || 'SUB-' + (db.syllabus.length + 1)).trim(),
    subjectName: subjectName.trim(),
    totalUnits: parseInt(totalUnits, 10) || (units ? units.length : 5),
    units: units || [
      { unitNo: 1, title: 'Unit 1: Introduction', topicsTotal: 5, topicsCompleted: 0, status: 'Not Started' }
    ]
  };

  db.syllabus.push(newSyl);
  writeDatabase(db);
  res.status(201).json(enrichSyllabusRecord(newSyl));
});

app.put('/api/syllabus/:id', (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  const index = db.syllabus.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Syllabus item not found.' });
  }

  const body = req.body;
  db.syllabus[index] = {
    ...db.syllabus[index],
    ...body,
    id: db.syllabus[index].id
  };

  writeDatabase(db);
  res.json(enrichSyllabusRecord(db.syllabus[index]));
});

// Update single unit within a syllabus
app.put('/api/syllabus/:id/unit/:unitNo', (req, res) => {
  const { id, unitNo } = req.params;
  const { title, topicsTotal, topicsCompleted, status } = req.body;

  const db = readDatabase();
  const syl = db.syllabus.find(s => s.id === id);
  if (!syl) {
    return res.status(404).json({ error: 'Syllabus entry not found.' });
  }

  const unit = syl.units.find(u => u.unitNo === parseInt(unitNo, 10));
  if (!unit) {
    return res.status(404).json({ error: 'Unit not found.' });
  }

  if (title !== undefined) unit.title = title.trim();
  if (topicsTotal !== undefined) unit.topicsTotal = Math.max(0, parseInt(topicsTotal, 10) || 0);
  if (topicsCompleted !== undefined) {
    const comp = Math.max(0, parseInt(topicsCompleted, 10) || 0);
    unit.topicsCompleted = Math.min(comp, unit.topicsTotal);
  }
  if (status !== undefined) unit.status = status;

  writeDatabase(db);
  res.json(enrichSyllabusRecord(syl));
});

app.delete('/api/syllabus/:id', (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  const index = db.syllabus.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Syllabus item not found.' });
  }

  const removed = db.syllabus.splice(index, 1)[0];
  writeDatabase(db);
  res.json({ message: 'Syllabus item removed', removed });
});

// ==================== GPA ENDPOINTS ====================

app.get('/api/gpa', (req, res) => {
  const db = readDatabase();
  const courses = db.gpaCourses || [];
  let totalCredits = 0;
  let weightedPoints = 0;

  courses.forEach(c => {
    const cred = parseFloat(c.credits) || 0;
    const pt = parseFloat(c.points) || 0;
    totalCredits += cred;
    weightedPoints += (cred * pt);
  });

  const gpa = totalCredits > 0 ? Math.round((weightedPoints / totalCredits) * 100) / 100 : 0;
  res.json({
    courses,
    totalCredits,
    weightedPoints,
    gpa,
    formula: 'GPA = Σ(Credits × Grade Points) / Σ(Credits)'
  });
});

app.post('/api/gpa', (req, res) => {
  const { courses } = req.body;
  if (!Array.isArray(courses)) {
    return res.status(400).json({ error: 'Courses must be an array.' });
  }

  const db = readDatabase();
  db.gpaCourses = courses.map((c, idx) => ({
    id: c.id || 'gpa_' + Date.now() + '_' + idx,
    code: (c.code || '').trim(),
    name: (c.name || 'Subject ' + (idx + 1)).trim(),
    credits: Math.max(0, parseFloat(c.credits) || 0),
    grade: (c.grade || '').trim().toUpperCase(),
    points: Math.max(0, parseFloat(c.points) || 0)
  }));

  writeDatabase(db);
  res.json({ message: 'GPA courses saved', count: db.gpaCourses.length });
});

// ==================== CGPA ENDPOINTS ====================

app.get('/api/cgpa', (req, res) => {
  const db = readDatabase();
  const semesters = db.cgpaSemesters || [];
  let totalCredits = 0;
  let weightedSgpa = 0;

  semesters.forEach(s => {
    const cred = parseFloat(s.credits) || 0;
    const sgpa = parseFloat(s.sgpa) || 0;
    totalCredits += cred;
    weightedSgpa += (cred * sgpa);
  });

  const cgpa = totalCredits > 0 ? Math.round((weightedSgpa / totalCredits) * 100) / 100 : 0;
  res.json({
    semesters,
    totalCredits,
    weightedSgpa,
    cgpa,
    formula: 'CGPA = Σ(Semester Credits × SGPA) / Σ(Semester Credits)'
  });
});

app.post('/api/cgpa', (req, res) => {
  const { semesters } = req.body;
  if (!Array.isArray(semesters)) {
    return res.status(400).json({ error: 'Semesters must be an array.' });
  }

  const db = readDatabase();
  db.cgpaSemesters = semesters.map((s, idx) => ({
    id: s.id || 'sem_' + Date.now() + '_' + idx,
    semester: (s.semester || 'Semester ' + (idx + 1)).trim(),
    credits: Math.max(0, parseFloat(s.credits) || 0),
    sgpa: Math.max(0, parseFloat(s.sgpa) || 0)
  }));

  writeDatabase(db);
  res.json({ message: 'CGPA semesters saved', count: db.cgpaSemesters.length });
});

// ==================== SETTINGS ENDPOINTS ====================

app.get('/api/settings', (req, res) => {
  const db = readDatabase();
  res.json(db.settings || {});
});

app.post('/api/settings', (req, res) => {
  const { minAttendanceThreshold, warningMargin, institutionRule, gradeScale } = req.body;
  const db = readDatabase();

  if (minAttendanceThreshold !== undefined) {
    const th = parseFloat(minAttendanceThreshold);
    if (isNaN(th) || th <= 0 || th > 100) {
      return res.status(400).json({ error: 'Attendance threshold must be between 1 and 100.' });
    }
    db.settings.minAttendanceThreshold = th;
  }

  if (warningMargin !== undefined) {
    const wm = parseFloat(warningMargin);
    if (!isNaN(wm) && wm >= 0 && wm < 50) {
      db.settings.warningMargin = wm;
    }
  }

  if (institutionRule) {
    db.settings.institutionRule = institutionRule;
  }

  if (Array.isArray(gradeScale) && gradeScale.length > 0) {
    db.settings.gradeScale = gradeScale;
  }

  writeDatabase(db);
  res.json({ message: 'Settings updated successfully', settings: db.settings });
});

// ==================== EXPORT & IMPORT & RESET ====================

app.get('/api/export', (req, res) => {
  const db = readDatabase();
  const format = req.query.format || 'json';

  if (format === 'csv') {
    // Generate CSV for attendance
    let csv = 'Subject Code,Subject Name,Classes Conducted,Classes Attended,Attendance Percentage,Status,Faculty\n';
    const threshold = db.settings.minAttendanceThreshold || 75;
    const margin = db.settings.warningMargin || 5;

    db.attendance.forEach(a => {
      const en = enrichAttendanceRecord(a, threshold, margin);
      csv += `"${en.code}","${en.name}",${en.conducted},${en.attended},${en.percentage !== null ? en.percentage + '%' : 'N/A'},"${en.status}","${en.faculty || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="campus360_attendance.csv"');
    return res.send(csv);
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="campus360_backup.json"');
  res.json({
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    app: 'Campus360 Attendance & GPA Module',
    data: db
  });
});

app.post('/api/import', (req, res) => {
  const { data } = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid import payload structure.' });
  }

  const db = {
    settings: data.settings || { minAttendanceThreshold: 75, warningMargin: 5, institutionRule: 'weighted_credits', gradeScale: [] },
    attendance: Array.isArray(data.attendance) ? data.attendance : [],
    syllabus: Array.isArray(data.syllabus) ? data.syllabus : [],
    gpaCourses: Array.isArray(data.gpaCourses) ? data.gpaCourses : [],
    cgpaSemesters: Array.isArray(data.cgpaSemesters) ? data.cgpaSemesters : []
  };

  writeDatabase(db);
  res.json({ message: 'Data imported and restored successfully.' });
});

app.post('/api/reset', (req, res) => {
  // Reset back to initial baseline demo data
  const defaultData = {
    settings: {
      minAttendanceThreshold: 75,
      warningMargin: 5,
      institutionRule: "weighted_credits",
      gradeScale: [
        { grade: "O", points: 10, description: "Outstanding (90-100%)" },
        { grade: "A+", points: 9, description: "Excellent (80-89%)" },
        { grade: "A", points: 8, description: "Very Good (70-79%)" },
        { grade: "B+", points: 7, description: "Good (60-69%)" },
        { grade: "B", points: 6, description: "Above Average (55-59%)" },
        { grade: "C", points: 5, description: "Average (50-54%)" },
        { grade: "P", points: 4, description: "Pass (40-49%)" },
        { grade: "F", points: 0, description: "Fail (<40%)" }
      ]
    },
    attendance: [
      { id: "att_1", code: "CS301", name: "Mathematics III", conducted: 40, attended: 34, faculty: "Dr. Sarah Jenkins", lastUpdated: "2026-10-25" },
      { id: "att_2", code: "CS302", name: "Physics & Engineering Electromagnetics", conducted: 36, attended: 25, faculty: "Prof. Alan Turing", lastUpdated: "2026-10-26" },
      { id: "att_3", code: "CS303", name: "Programming in C/C++", conducted: 32, attended: 28, faculty: "Dr. Grace Hopper", lastUpdated: "2026-10-27" },
      { id: "att_4", code: "CS304", name: "Data Structures & Algorithms", conducted: 28, attended: 22, faculty: "Prof. Donald Knuth", lastUpdated: "2026-10-26" },
      { id: "att_5", code: "CS305", name: "Digital Logic Design", conducted: 30, attended: 21, faculty: "Dr. Claude Shannon", lastUpdated: "2026-10-24" }
    ],
    syllabus: [
      {
        id: "syl_1", subjectCode: "CS301", subjectName: "Mathematics III", totalUnits: 5,
        units: [
          { unitNo: 1, title: "Linear Algebra & Vector Spaces", topicsTotal: 6, topicsCompleted: 6, status: "Completed" },
          { unitNo: 2, title: "Calculus & Multivariable Functions", topicsTotal: 8, topicsCompleted: 8, status: "Completed" },
          { unitNo: 3, title: "Differential Equations & Laplace Transforms", topicsTotal: 7, topicsCompleted: 4, status: "In Progress" },
          { unitNo: 4, title: "Complex Analysis & Mapping", topicsTotal: 6, topicsCompleted: 0, status: "Not Started" },
          { unitNo: 5, title: "Numerical Methods & Iterations", topicsTotal: 5, topicsCompleted: 0, status: "Not Started" }
        ]
      },
      {
        id: "syl_2", subjectCode: "CS302", subjectName: "Physics & Engineering Electromagnetics", totalUnits: 4,
        units: [
          { unitNo: 1, title: "Electromagnetic Fields & Maxwell's Equations", topicsTotal: 6, topicsCompleted: 6, status: "Completed" },
          { unitNo: 2, title: "Optics & Wave Propagation", topicsTotal: 6, topicsCompleted: 3, status: "In Progress" },
          { unitNo: 3, title: "Quantum Mechanics Fundamentals", topicsTotal: 5, topicsCompleted: 0, status: "Not Started" },
          { unitNo: 4, title: "Thermodynamics & Statistical Physics", topicsTotal: 5, topicsCompleted: 0, status: "Not Started" }
        ]
      },
      {
        id: "syl_3", subjectCode: "CS303", subjectName: "Programming in C/C++", totalUnits: 5,
        units: [
          { unitNo: 1, title: "Language Basics, Flow & Functions", topicsTotal: 5, topicsCompleted: 5, status: "Completed" },
          { unitNo: 2, title: "Pointers, References & Memory Management", topicsTotal: 6, topicsCompleted: 6, status: "Completed" },
          { unitNo: 3, title: "Object-Oriented Design & Classes", topicsTotal: 7, topicsCompleted: 7, status: "Completed" },
          { unitNo: 4, title: "File Handling & Stream I/O", topicsTotal: 4, topicsCompleted: 2, status: "In Progress" },
          { unitNo: 5, title: "Templates, Exception Handling & STL", topicsTotal: 6, topicsCompleted: 1, status: "In Progress" }
        ]
      },
      {
        id: "syl_4", subjectCode: "CS304", subjectName: "Data Structures & Algorithms", totalUnits: 5,
        units: [
          { unitNo: 1, title: "Arrays, Stacks & Complexity Analysis", topicsTotal: 5, topicsCompleted: 5, status: "Completed" },
          { unitNo: 2, title: "Queues, Deques & Linked Lists", topicsTotal: 6, topicsCompleted: 6, status: "Completed" },
          { unitNo: 3, title: "Non-linear Structures: Trees & BSTs", topicsTotal: 7, topicsCompleted: 2, status: "In Progress" },
          { unitNo: 4, title: "Graphs & Minimum Spanning Trees", topicsTotal: 6, topicsCompleted: 0, status: "Not Started" },
          { unitNo: 5, title: "Sorting, Searching & Hash Tables", topicsTotal: 6, topicsCompleted: 0, status: "Not Started" }
        ]
      },
      {
        id: "syl_5", subjectCode: "CS305", subjectName: "Digital Logic Design", totalUnits: 4,
        units: [
          { unitNo: 1, title: "Boolean Algebra & Logic Gates", topicsTotal: 5, topicsCompleted: 5, status: "Completed" },
          { unitNo: 2, title: "Combinational Logic & Decoders/Multiplexers", topicsTotal: 6, topicsCompleted: 6, status: "Completed" },
          { unitNo: 3, title: "Sequential Logic: Flip-Flops & Counters", topicsTotal: 6, topicsCompleted: 1, status: "In Progress" },
          { unitNo: 4, title: "Memory Units & Programmable Logic (PLDs)", topicsTotal: 5, topicsCompleted: 0, status: "Not Started" }
        ]
      }
    ],
    gpaCourses: [
      { id: "gpa_1", code: "CS301", name: "Mathematics III", credits: 4, grade: "A", points: 8 },
      { id: "gpa_2", code: "CS302", name: "Physics & Engineering Electromagnetics", credits: 4, grade: "B+", points: 7 },
      { id: "gpa_3", code: "CS303", name: "Programming in C/C++", credits: 3, grade: "O", points: 10 },
      { id: "gpa_4", code: "CS304", name: "Data Structures & Algorithms", credits: 4, grade: "A+", points: 9 },
      { id: "gpa_5", code: "CS305", name: "Digital Logic Design", credits: 3, grade: "B", points: 6 },
      { id: "gpa_6", code: "CS306", name: "Data Structures Laboratory", credits: 2, grade: "O", points: 10 }
    ],
    cgpaSemesters: [
      { id: "sem_1", semester: "Semester 1", credits: 20, sgpa: 8.40 },
      { id: "sem_2", semester: "Semester 2", credits: 22, sgpa: 8.65 },
      { id: "sem_3", semester: "Semester 3", credits: 21, sgpa: 8.10 },
      { id: "sem_4", semester: "Semester 4 (Current)", credits: 20, sgpa: 8.25 }
    ]
  };

  writeDatabase(defaultData);
  res.json({ message: 'Database reset to initial default state.' });
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`Campus360 Attendance & GPA Module Backend Started`);
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log(`REST API available at: http://localhost:${PORT}/api/`);
  console.log(`=================================================`);
});

