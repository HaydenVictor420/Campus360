/**
 * Deadlines & Reminder Hub - Backend REST API Router
 * Implements clean, zero-dependency RESTful endpoints with persistent JSON storage.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'deadlines.json');

// Initial seed deadlines for campus academic courses & institutional events
function getInitialSeedDeadlines() {
  const now = new Date();
  
  // Helper to get ISO string offset by hours from now
  const offsetHours = (hours) => {
    const d = new Date(now.getTime() + hours * 3600 * 1000);
    return d.toISOString();
  };

  return [
    {
      id: 'dl-101',
      title: 'Distributed Consensus & Raft Protocol Simulation',
      courseCode: 'CS301',
      courseName: 'Distributed Systems & Cloud Computing',
      category: 'Assignment',
      dueDate: offsetHours(18), // Due in 18 hours (Due Soon!)
      priority: 'High',
      status: 'pending',
      description: 'Implement leader election and log replication using Node.js or Python. Submit Git repository link and benchmark report.',
      assignedBy: 'Prof. Donald Knuth Jr.',
      targetRole: 'student',
      reminderHoursBefore: 24,
      createdAt: offsetHours(-48),
      completedAt: null
    },
    {
      id: 'dl-102',
      title: 'Neural Network Architecture Review & Presentation',
      courseCode: 'AI302',
      courseName: 'Deep Learning & Neural Architectures',
      category: 'Project',
      dueDate: offsetHours(64), // Due in ~2.5 days
      priority: 'High',
      status: 'pending',
      description: 'Prepare a 15-minute presentation comparing Vision Transformers (ViT) with ConvNeXt architectures on CIFAR-100.',
      assignedBy: 'Dr. Barbara Liskov',
      targetRole: 'student',
      reminderHoursBefore: 48,
      createdAt: offsetHours(-72),
      completedAt: null
    },
    {
      id: 'dl-103',
      title: 'IEEE Student Technical Paper Camera-Ready Submission',
      courseCode: 'RESEARCH',
      courseName: 'Campus Research & Sponsored Projects',
      category: 'Research',
      dueDate: offsetHours(120), // Due in 5 days
      priority: 'Medium',
      status: 'pending',
      description: 'Submit camera-ready PDF and LaTeX source package for peer-reviewed papers accepted in IEEE CloudNet 2026.',
      assignedBy: 'Dean of Research',
      targetRole: 'all',
      reminderHoursBefore: 48,
      createdAt: offsetHours(-96),
      completedAt: null
    },
    {
      id: 'dl-104',
      title: 'Tier-1 Campus Recruitment Registration (NVIDIA & Microsoft)',
      courseCode: 'CAREER',
      courseName: 'Placement & Training Directorate',
      category: 'Placement',
      dueDate: offsetHours(168), // Due in 7 days
      priority: 'High',
      status: 'pending',
      description: 'Upload updated resume dossier, GitHub profile link, and confirm zero active academic backlogs before slot booking closes.',
      assignedBy: 'Director of Placements',
      targetRole: 'student',
      reminderHoursBefore: 72,
      createdAt: offsetHours(-24),
      completedAt: null
    },
    {
      id: 'dl-105',
      title: 'B-Tree & LSM Storage Engine Benchmark Lab',
      courseCode: 'CS303',
      courseName: 'Database Internal Engine Design',
      category: 'Lab',
      dueDate: offsetHours(-14), // Overdue by 14 hours!
      priority: 'Medium',
      status: 'pending',
      description: 'Run workload tests comparing B-Tree vs LSM-tree write amplification. Late submissions incur a 10% penalty.',
      assignedBy: 'Dr. Ada Lovelace',
      targetRole: 'student',
      reminderHoursBefore: 24,
      createdAt: offsetHours(-120),
      completedAt: null
    },
    {
      id: 'dl-106',
      title: 'Technology Entrepreneurship Case Analysis',
      courseCode: 'OE305',
      courseName: 'Technology Entrepreneurship & Ethics',
      category: 'Assignment',
      dueDate: offsetHours(-96),
      priority: 'Low',
      status: 'completed',
      description: 'Submit 3-page ethical analysis on algorithmic transparency and data privacy in modern education platforms.',
      assignedBy: 'Prof. Donald Knuth Jr.',
      targetRole: 'student',
      reminderHoursBefore: 24,
      createdAt: offsetHours(-200),
      completedAt: offsetHours(-100)
    }
  ];
}

// Persistence manager
class DeadlineStorage {
  constructor() {
    this.ensureDirectoryAndFile();
  }

  ensureDirectoryAndFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(DB_FILE)) {
        const initial = getInitialSeedDeadlines();
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
      }
    } catch (err) {
      console.error('[DeadlineStorage] Error initializing storage file:', err);
    }
  }

  getAll() {
    try {
      this.ensureDirectoryAndFile();
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('[DeadlineStorage] Error reading database:', err);
      return getInitialSeedDeadlines();
    }
  }

  saveAll(deadlines) {
    try {
      this.ensureDirectoryAndFile();
      fs.writeFileSync(DB_FILE, JSON.stringify(deadlines, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[DeadlineStorage] Error writing database:', err);
      return false;
    }
  }

  reset() {
    const initial = getInitialSeedDeadlines();
    this.saveAll(initial);
    return initial;
  }
}

const storage = new DeadlineStorage();

// Helper to compute urgency and countdown info
function enrichDeadline(d) {
  const now = new Date();
  const due = new Date(d.dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (3600 * 1000);

  let urgency = 'upcoming';
  if (d.status === 'completed') {
    urgency = 'completed';
  } else if (diffMs < 0) {
    urgency = 'overdue';
  } else if (diffHours <= 48) {
    urgency = 'due-soon';
  }

  return {
    ...d,
    urgency,
    remainingHours: Math.round(diffHours * 10) / 10,
    isOverdue: d.status !== 'completed' && diffMs < 0,
    isDueSoon: d.status !== 'completed' && diffMs >= 0 && diffHours <= 48
  };
}

// Send standard JSON response
function sendJson(res, statusCode, data) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(payload);
  return true;
}

// Read body stream as JSON
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', err => reject(err));
  });
}

/**
 * Handle incoming API requests starting with /api/deadlines
 * Returns true if request was handled, false otherwise
 */
async function handleDeadlinesApi(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return true;
  }

  // Health check endpoint
  if (pathname === '/api/health') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'Campus360 IMS Deadline Service',
      serverTime: new Date().toISOString()
    });
    return true;
  }

  // Check if request is under /api/deadlines
  if (!pathname.startsWith('/api/deadlines')) {
    return false;
  }

  const subPath = pathname.replace(/^\/api\/deadlines\/?/, '');
  const pathParts = subPath ? subPath.split('/') : [];

  try {
    // 1. GET /api/deadlines/summary
    if (method === 'GET' && pathParts[0] === 'summary') {
      const items = storage.getAll().map(enrichDeadline);
      const total = items.length;
      const completed = items.filter(i => i.status === 'completed').length;
      const pending = items.filter(i => i.status === 'pending').length;
      const overdue = items.filter(i => i.isOverdue).length;
      const dueSoon = items.filter(i => i.isDueSoon).length;
      const highPriority = items.filter(i => i.priority === 'High' && i.status !== 'completed').length;

      return sendJson(res, 200, {
        success: true,
        summary: {
          total,
          completed,
          pending,
          overdue,
          dueSoon,
          highPriority
        }
      });
    }

    // 2. POST /api/deadlines/reset
    if (method === 'POST' && pathParts[0] === 'reset') {
      const resetList = storage.reset().map(enrichDeadline);
      return sendJson(res, 200, {
        success: true,
        message: 'Deadlines database reset to seed records',
        count: resetList.length,
        deadlines: resetList
      });
    }

    // 3. GET /api/deadlines (List all with query filters)
    if (method === 'GET' && pathParts.length === 0) {
      let items = storage.getAll().map(enrichDeadline);

      const statusFilter = parsedUrl.searchParams.get('status');
      const priorityFilter = parsedUrl.searchParams.get('priority');
      const categoryFilter = parsedUrl.searchParams.get('category');
      const courseFilter = parsedUrl.searchParams.get('course');
      const searchFilter = (parsedUrl.searchParams.get('search') || '').toLowerCase().trim();
      const sortBy = parsedUrl.searchParams.get('sortBy') || 'dueDate';
      const order = parsedUrl.searchParams.get('order') || 'asc';

      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'due-soon') {
          items = items.filter(i => i.isDueSoon);
        } else if (statusFilter === 'overdue') {
          items = items.filter(i => i.isOverdue);
        } else {
          items = items.filter(i => i.status === statusFilter);
        }
      }

      if (priorityFilter && priorityFilter !== 'all') {
        items = items.filter(i => i.priority.toLowerCase() === priorityFilter.toLowerCase());
      }

      if (categoryFilter && categoryFilter !== 'all') {
        items = items.filter(i => i.category.toLowerCase() === categoryFilter.toLowerCase());
      }

      if (courseFilter && courseFilter !== 'all') {
        items = items.filter(i => i.courseCode.toLowerCase() === courseFilter.toLowerCase());
      }

      if (searchFilter) {
        items = items.filter(i =>
          i.title.toLowerCase().includes(searchFilter) ||
          (i.description && i.description.toLowerCase().includes(searchFilter)) ||
          i.courseCode.toLowerCase().includes(searchFilter) ||
          i.courseName.toLowerCase().includes(searchFilter)
        );
      }

      // Sorting
      items.sort((a, b) => {
        if (sortBy === 'dueDate') {
          const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          return order === 'desc' ? -diff : diff;
        }
        if (sortBy === 'priority') {
          const weights = { High: 3, Medium: 2, Low: 1 };
          const diff = (weights[b.priority] || 0) - (weights[a.priority] || 0);
          return order === 'desc' ? -diff : diff;
        }
        if (sortBy === 'title') {
          return order === 'desc' ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title);
        }
        return 0;
      });

      return sendJson(res, 200, {
        success: true,
        count: items.length,
        deadlines: items
      });
    }

    // 4. POST /api/deadlines (Create new deadline)
    if (method === 'POST' && pathParts.length === 0) {
      const body = await parseJsonBody(req);

      if (!body.title || !body.dueDate) {
        return sendJson(res, 400, {
          success: false,
          error: 'Missing required fields: title and dueDate are mandatory.'
        });
      }

      const items = storage.getAll();
      const newDeadline = {
        id: 'dl-' + Date.now().toString().slice(-6),
        title: String(body.title).trim(),
        courseCode: body.courseCode ? String(body.courseCode).trim().toUpperCase() : 'GENERAL',
        courseName: body.courseName ? String(body.courseName).trim() : 'General Campus Academic',
        category: body.category || 'Assignment',
        dueDate: new Date(body.dueDate).toISOString(),
        priority: body.priority || 'Medium',
        status: 'pending',
        description: body.description ? String(body.description).trim() : '',
        assignedBy: body.assignedBy || 'Faculty / Academic Coordinator',
        targetRole: body.targetRole || 'student',
        reminderHoursBefore: parseInt(body.reminderHoursBefore, 10) || 24,
        createdAt: new Date().toISOString(),
        completedAt: null
      };

      items.unshift(newDeadline);
      storage.saveAll(items);

      return sendJson(res, 201, {
        success: true,
        message: 'Deadline reminder created successfully',
        deadline: enrichDeadline(newDeadline)
      });
    }

    // 5. Operations on a single deadline by ID
    const deadlineId = pathParts[0];
    const items = storage.getAll();
    const index = items.findIndex(d => d.id === deadlineId);

    if (index === -1) {
      return sendJson(res, 404, {
        success: false,
        error: `Deadline with ID '${deadlineId}' not found.`
      });
    }

    // 5a. POST /api/deadlines/:id/toggle (Toggle complete / pending)
    if (method === 'POST' && pathParts[1] === 'toggle') {
      const current = items[index];
      const isCompleted = current.status === 'completed';
      current.status = isCompleted ? 'pending' : 'completed';
      current.completedAt = isCompleted ? null : new Date().toISOString();
      items[index] = current;
      storage.saveAll(items);

      return sendJson(res, 200, {
        success: true,
        message: `Deadline marked as ${current.status}`,
        deadline: enrichDeadline(current)
      });
    }

    // 5b. POST /api/deadlines/:id/snooze (Postpone deadline by N hours, default 24h)
    if (method === 'POST' && pathParts[1] === 'snooze') {
      const body = await parseJsonBody(req);
      const hours = parseInt(body.hours, 10) || 24;
      const current = items[index];
      const currentDue = new Date(current.dueDate);
      const newDue = new Date(currentDue.getTime() + hours * 3600 * 1000);
      
      current.dueDate = newDue.toISOString();
      if (current.status === 'completed') {
        current.status = 'pending';
        current.completedAt = null;
      }
      items[index] = current;
      storage.saveAll(items);

      return sendJson(res, 200, {
        success: true,
        message: `Deadline extended by ${hours} hours`,
        deadline: enrichDeadline(current)
      });
    }

    // 5c. GET /api/deadlines/:id (Retrieve single deadline)
    if (method === 'GET' && pathParts.length === 1) {
      return sendJson(res, 200, {
        success: true,
        deadline: enrichDeadline(items[index])
      });
    }

    // 5d. PUT /api/deadlines/:id (Update deadline)
    if (method === 'PUT' && pathParts.length === 1) {
      const body = await parseJsonBody(req);
      const current = items[index];

      if (body.title) current.title = String(body.title).trim();
      if (body.courseCode) current.courseCode = String(body.courseCode).trim().toUpperCase();
      if (body.courseName) current.courseName = String(body.courseName).trim();
      if (body.category) current.category = body.category;
      if (body.dueDate) current.dueDate = new Date(body.dueDate).toISOString();
      if (body.priority) current.priority = body.priority;
      if (body.description !== undefined) current.description = String(body.description).trim();
      if (body.reminderHoursBefore !== undefined) current.reminderHoursBefore = parseInt(body.reminderHoursBefore, 10);
      if (body.status) {
        current.status = body.status;
        current.completedAt = body.status === 'completed' ? new Date().toISOString() : null;
      }

      items[index] = current;
      storage.saveAll(items);

      return sendJson(res, 200, {
        success: true,
        message: 'Deadline updated successfully',
        deadline: enrichDeadline(current)
      });
    }

    // 5e. DELETE /api/deadlines/:id (Delete deadline)
    if (method === 'DELETE' && pathParts.length === 1) {
      const deleted = items.splice(index, 1)[0];
      storage.saveAll(items);

      return sendJson(res, 200, {
        success: true,
        message: 'Deadline deleted successfully',
        deadline: deleted
      });
    }

    return sendJson(res, 400, {
      success: false,
      error: `Unsupported endpoint or method: ${method} ${pathname}`
    });

  } catch (err) {
    console.error('[Deadlines API Error]:', err);
    return sendJson(res, 500, {
      success: false,
      error: 'Internal Server Error: ' + err.message
    });
  }
}

module.exports = {
  handleDeadlinesApi,
  getInitialSeedDeadlines
};
