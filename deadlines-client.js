/**
 * Campus360 IMS - Deadline Reminder Module Client
 * Manages communication with the /api/deadlines REST API with automatic offline localStorage fallback.
 */

class DeadlineApiClient {
  constructor() {
    this.API_BASE = '/api/deadlines';
    this.STORAGE_KEY = 'IMS_DEADLINES_DATA_V1';
    this.notifiedIds = new Set();
  }

  // Check if backend API is reachable
  async isBackendAvailable() {
    try {
      if (!window.location.protocol.startsWith('http')) return false;
      const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // Local storage fallback data initialization
  getLocalData() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed reading localStorage deadlines:', e);
    }

    // Default seed deadlines if running purely client-side without backend
    const now = new Date();
    const offset = (h) => new Date(now.getTime() + h * 3600 * 1000).toISOString();

    const seeds = [
      {
        id: 'dl-101',
        title: 'Distributed Consensus & Raft Protocol Simulation',
        courseCode: 'CS301',
        courseName: 'Distributed Systems & Cloud Computing',
        category: 'Assignment',
        dueDate: offset(18),
        priority: 'High',
        status: 'pending',
        description: 'Implement leader election and log replication using Node.js or Python. Submit Git repository link and benchmark report.',
        assignedBy: 'Prof. Donald Knuth Jr.',
        reminderHoursBefore: 24,
        createdAt: offset(-48),
        completedAt: null
      },
      {
        id: 'dl-102',
        title: 'Neural Network Architecture Review & Presentation',
        courseCode: 'AI302',
        courseName: 'Deep Learning & Neural Architectures',
        category: 'Project',
        dueDate: offset(64),
        priority: 'High',
        status: 'pending',
        description: 'Prepare a 15-minute presentation comparing Vision Transformers (ViT) with ConvNeXt architectures on CIFAR-100.',
        assignedBy: 'Dr. Barbara Liskov',
        reminderHoursBefore: 48,
        createdAt: offset(-72),
        completedAt: null
      },
      {
        id: 'dl-103',
        title: 'IEEE Student Technical Paper Camera-Ready Submission',
        courseCode: 'RESEARCH',
        courseName: 'Campus Research & Sponsored Projects',
        category: 'Research',
        dueDate: offset(120),
        priority: 'Medium',
        status: 'pending',
        description: 'Submit camera-ready PDF and LaTeX source package for peer-reviewed papers accepted in IEEE CloudNet 2026.',
        assignedBy: 'Dean of Research',
        reminderHoursBefore: 48,
        createdAt: offset(-96),
        completedAt: null
      },
      {
        id: 'dl-104',
        title: 'Tier-1 Campus Recruitment Registration (NVIDIA & Microsoft)',
        courseCode: 'CAREER',
        courseName: 'Placement & Training Directorate',
        category: 'Placement',
        dueDate: offset(168),
        priority: 'High',
        status: 'pending',
        description: 'Upload updated resume dossier, GitHub profile link, and confirm zero active academic backlogs before slot booking closes.',
        assignedBy: 'Director of Placements',
        reminderHoursBefore: 72,
        createdAt: offset(-24),
        completedAt: null
      },
      {
        id: 'dl-105',
        title: 'B-Tree & LSM Storage Engine Benchmark Lab',
        courseCode: 'CS303',
        courseName: 'Database Internal Engine Design',
        category: 'Lab',
        dueDate: offset(-14),
        priority: 'Medium',
        status: 'pending',
        description: 'Run workload tests comparing B-Tree vs LSM-tree write amplification. Late submissions incur a 10% penalty.',
        assignedBy: 'Dr. Ada Lovelace',
        reminderHoursBefore: 24,
        createdAt: offset(-120),
        completedAt: null
      },
      {
        id: 'dl-106',
        title: 'Technology Entrepreneurship Case Analysis',
        courseCode: 'OE305',
        courseName: 'Technology Entrepreneurship & Ethics',
        category: 'Assignment',
        dueDate: offset(-96),
        priority: 'Low',
        status: 'completed',
        description: 'Submit 3-page ethical analysis on algorithmic transparency and data privacy in modern education platforms.',
        assignedBy: 'Prof. Donald Knuth Jr.',
        reminderHoursBefore: 24,
        createdAt: offset(-200),
        completedAt: offset(-100)
      }
    ];

    this.saveLocalData(seeds);
    return seeds;
  }

  saveLocalData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed writing localStorage deadlines:', e);
    }
  }

  enrichItem(d) {
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

  // 1. Get Summary Stats
  async getSummary() {
    try {
      const res = await fetch(`${this.API_BASE}/summary`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        return json.summary;
      }
    } catch (e) {
      // Fallback
    }

    const items = this.getLocalData().map(i => this.enrichItem(i));
    return {
      total: items.length,
      completed: items.filter(i => i.status === 'completed').length,
      pending: items.filter(i => i.status === 'pending').length,
      overdue: items.filter(i => i.isOverdue).length,
      dueSoon: items.filter(i => i.isDueSoon).length,
      highPriority: items.filter(i => i.priority === 'High' && i.status !== 'completed').length
    };
  }

  // 2. Get Deadlines with Filters
  async getDeadlines(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.category) params.set('category', filters.category);
      if (filters.course) params.set('course', filters.course);
      if (filters.search) params.set('search', filters.search);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.order) params.set('order', filters.order);

      const url = `${this.API_BASE}?${params.toString()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        return json.deadlines;
      }
    } catch (e) {
      // Fallback
    }

    let items = this.getLocalData().map(i => this.enrichItem(i));

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'due-soon') items = items.filter(i => i.isDueSoon);
      else if (filters.status === 'overdue') items = items.filter(i => i.isOverdue);
      else items = items.filter(i => i.status === filters.status);
    }
    if (filters.priority && filters.priority !== 'all') {
      items = items.filter(i => i.priority.toLowerCase() === filters.priority.toLowerCase());
    }
    if (filters.category && filters.category !== 'all') {
      items = items.filter(i => i.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.course && filters.course !== 'all') {
      items = items.filter(i => i.courseCode.toLowerCase() === filters.course.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.description && i.description.toLowerCase().includes(q)) ||
        i.courseCode.toLowerCase().includes(q)
      );
    }

    // Sort
    const sortBy = filters.sortBy || 'dueDate';
    const order = filters.order || 'asc';
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

    return items;
  }

  // 3. Create Deadline
  async createDeadline(payload) {
    try {
      const res = await fetch(this.API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        return json.deadline;
      }
    } catch (e) {
      // Fallback
    }

    const items = this.getLocalData();
    const newDeadline = {
      id: 'dl-' + Date.now().toString().slice(-6),
      title: payload.title,
      courseCode: (payload.courseCode || 'GENERAL').toUpperCase(),
      courseName: payload.courseName || 'General Campus Academic',
      category: payload.category || 'Assignment',
      dueDate: new Date(payload.dueDate).toISOString(),
      priority: payload.priority || 'Medium',
      status: 'pending',
      description: payload.description || '',
      assignedBy: payload.assignedBy || 'Faculty Coordinator',
      reminderHoursBefore: parseInt(payload.reminderHoursBefore, 10) || 24,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    items.unshift(newDeadline);
    this.saveLocalData(items);
    return this.enrichItem(newDeadline);
  }

  // 4. Update Deadline
  async updateDeadline(id, payload) {
    try {
      const res = await fetch(`${this.API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        return json.deadline;
      }
    } catch (e) {
      // Fallback
    }

    const items = this.getLocalData();
    const idx = items.findIndex(d => d.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...payload };
      this.saveLocalData(items);
      return this.enrichItem(items[idx]);
    }
    return null;
  }

  // 5. Toggle Status
  async toggleDeadline(id) {
    try {
      const res = await fetch(`${this.API_BASE}/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        return json.deadline;
      }
    } catch (e) {
      // Fallback
    }

    const items = this.getLocalData();
    const idx = items.findIndex(d => d.id === id);
    if (idx !== -1) {
      const isDone = items[idx].status === 'completed';
      items[idx].status = isDone ? 'pending' : 'completed';
      items[idx].completedAt = isDone ? null : new Date().toISOString();
      this.saveLocalData(items);
      return this.enrichItem(items[idx]);
    }
    return null;
  }

  // 6. Snooze / Postpone (+N hours)
  async snoozeDeadline(id, hours = 24) {
    try {
      const res = await fetch(`${this.API_BASE}/${id}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours })
      });
      if (res.ok) {
        const json = await res.json();
        return json.deadline;
      }
    } catch (e) {
      // Fallback
    }

    const items = this.getLocalData();
    const idx = items.findIndex(d => d.id === id);
    if (idx !== -1) {
      const curDue = new Date(items[idx].dueDate);
      const newDue = new Date(curDue.getTime() + hours * 3600 * 1000);
      items[idx].dueDate = newDue.toISOString();
      if (items[idx].status === 'completed') {
        items[idx].status = 'pending';
        items[idx].completedAt = null;
      }
      this.saveLocalData(items);
      return this.enrichItem(items[idx]);
    }
    return null;
  }

  // 7. Delete Deadline
  async deleteDeadline(id) {
    try {
      const res = await fetch(`${this.API_BASE}/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        return true;
      }
    } catch (e) {
      // Fallback
    }

    const items = this.getLocalData();
    const idx = items.findIndex(d => d.id === id);
    if (idx !== -1) {
      items.splice(idx, 1);
      this.saveLocalData(items);
      return true;
    }
    return false;
  }

  // 8. Reset to initial defaults
  async resetDeadlines() {
    try {
      const res = await fetch(`${this.API_BASE}/reset`, {
        method: 'POST'
      });
      if (res.ok) {
        const json = await res.json();
        return json.deadlines;
      }
    } catch (e) {
      // Fallback
    }

    localStorage.removeItem(this.STORAGE_KEY);
    return this.getLocalData().map(i => this.enrichItem(i));
  }

  // Helper: Format Countdown String
  static formatCountdown(dueDateIso, isCompleted) {
    if (isCompleted) {
      return { text: 'Completed', className: 'urgency-completed', icon: '✓' };
    }

    const now = new Date();
    const due = new Date(dueDateIso);
    const diffMs = due.getTime() - now.getTime();

    if (diffMs < 0) {
      const overdueMs = Math.abs(diffMs);
      const hours = Math.floor(overdueMs / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      const remHours = hours % 24;

      if (days > 0) {
        return { text: `Overdue by ${days}d ${remHours}h`, className: 'urgency-overdue', icon: '🚨' };
      }
      return { text: `Overdue by ${hours}h`, className: 'urgency-overdue', icon: '🚨' };
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;
    const remMinutes = totalMinutes % 60;

    if (days > 0) {
      const urgencyClass = days <= 2 ? 'urgency-due-soon' : 'urgency-upcoming';
      const icon = days <= 2 ? '⚡' : '⏳';
      return { text: `Due in ${days}d ${remHours}h`, className: urgencyClass, icon };
    }

    if (totalHours > 0) {
      return { text: `Due in ${totalHours}h ${remMinutes}m`, className: 'urgency-due-soon', icon: '⚡' };
    }

    return { text: `Due in ${totalMinutes}m`, className: 'urgency-due-soon', icon: '🔥' };
  }

  // Helper: Format Date String nicely
  static formatDateNice(isoString) {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  }

  // Desktop notification trigger
  checkAndNotify(deadlines) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    deadlines.forEach(d => {
      if (d.status === 'completed') return;
      if (this.notifiedIds.has(d.id)) return;

      const due = new Date(d.dueDate);
      const diffHours = (due.getTime() - Date.now()) / (3600 * 1000);

      // Trigger if due in less than 24 hours or overdue
      if (diffHours <= 24 && diffHours >= -2) {
        this.notifiedIds.add(d.id);
        const title = diffHours < 0 ? `🚨 Overdue: ${d.title}` : `⚡ Due Soon: ${d.title}`;
        const body = `${d.courseCode}: ${d.title}\nDue: ${DeadlineApiClient.formatDateNice(d.dueDate)}`;

        try {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: d.id
          });
        } catch (e) {
          console.warn('Could not spawn desktop notification:', e);
        }
      }
    });
  }
}

