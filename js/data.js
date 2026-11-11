// Campus360 - Comprehensive Campus Intelligence & Academic Data Store
// Provides persistent localStorage state, realistic seed data, and sync helpers

const Campus360Data = (function () {
  const STORAGE_KEY = 'campus360_system_state_v1';

  // Realistic seed data reflecting a full modern university ecosystem
  const defaultState = {
    currentRole: 'student', // 'student', 'staff', 'hod', 'admin', 'parent'
    currentUser: {
      id: 'STU-2024-042',
      name: 'Alex Turner',
      email: 'alex.turner@campus.edu',
      role: 'student',
      department: 'Computer Science & Engineering',
      batch: '2023-2027',
      semester: 5,
      section: 'A',
      rollNo: '22CS042',
      mentor: 'Dr. Arvind Sharma',
      cgpa: 8.74,
      attendanceOverall: 82.8,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      parentEmail: 'parent.alex@gmail.com',
      parentPhone: '+91 98765 43210',
      pendingProjects: 2,
      criticalAlerts: 1
    },
    roles: {
      student: {
        id: 'STU-2024-042',
        name: 'Alex Turner',
        email: 'alex.turner@campus.edu',
        role: 'student',
        title: 'B.Tech CSE - 5th Semester',
        avatarBadge: '🎓',
        initials: 'AT'
      },
      staff: {
        id: 'FAC-2018-108',
        name: 'Dr. Arvind Sharma',
        email: 'dr.sharma@campus.edu',
        role: 'staff',
        title: 'Associate Professor & Class Advisor',
        avatarBadge: '👨‍🏫',
        initials: 'AS'
      },
      hod: {
        id: 'HOD-CSE-001',
        name: 'Dr. Meenakshi Sundaram',
        email: 'hod.cse@campus.edu',
        role: 'hod',
        title: 'Head of Department - Computer Science',
        avatarBadge: '🏛️',
        initials: 'MS'
      },
      admin: {
        id: 'ADM-SYS-007',
        name: 'Campus Systems Administrator',
        email: 'admin@campus.edu',
        role: 'admin',
        title: 'Chief Academic Registrar & Operations',
        avatarBadge: '🛡️',
        initials: 'AD'
      },
      parent: {
        id: 'PAR-2024-042',
        name: 'Robert Turner',
        email: 'parent.alex@gmail.com',
        role: 'parent',
        title: "Parent / Guardian of Alex Turner (22CS042)",
        avatarBadge: '👨‍👩‍👦',
        initials: 'RT'
      }
    },
    // Academic Courses
    courses: [
      {
        code: 'CS301',
        name: 'Machine Learning & Neural Architectures',
        credits: 4,
        faculty: 'Dr. Arvind Sharma',
        cabin: 'Tech Tower C-302',
        email: 'dr.sharma@campus.edu',
        totalClasses: 42,
        attended: 38,
        absent: 3,
        od: 1,
        percentage: 90.5,
        status: 'safe', // safe, warning, critical
        targetMet: true,
        currentGrade: 'A+',
        gradePoints: 9,
        internal1: 46,
        internal2: 48,
        assignment: 19,
        color: '#3b82f6'
      },
      {
        code: 'CS302',
        name: 'Operating Systems & Kernel Engineering',
        credits: 4,
        faculty: 'Prof. Sneha Sen',
        cabin: 'Newton Block B-214',
        email: 'sneha.sen@campus.edu',
        totalClasses: 40,
        attended: 29,
        absent: 10,
        od: 1,
        percentage: 72.5,
        status: 'critical', // below 75% threshold!
        targetMet: false,
        currentGrade: 'B+',
        gradePoints: 7,
        internal1: 38,
        internal2: 41,
        assignment: 16,
        color: '#ef4444'
      },
      {
        code: 'CS303',
        name: 'Database Management & Distributed NoSQL',
        credits: 3,
        faculty: 'Dr. Rajesh Kumar',
        cabin: 'Tech Tower D-105',
        email: 'rajesh.kumar@campus.edu',
        totalClasses: 36,
        attended: 30,
        absent: 5,
        od: 1,
        percentage: 83.3,
        status: 'safe',
        targetMet: true,
        currentGrade: 'A',
        gradePoints: 8,
        internal1: 42,
        internal2: 44,
        assignment: 18,
        color: '#10b981'
      },
      {
        code: 'CS304',
        name: 'Computer Networks & Zero-Trust Security',
        credits: 3,
        faculty: 'Prof. David Miller',
        cabin: 'Turing Block A-201',
        email: 'david.miller@campus.edu',
        totalClasses: 35,
        attended: 27,
        absent: 7,
        od: 1,
        percentage: 77.1,
        status: 'warning', // close to 75%
        targetMet: true,
        currentGrade: 'A',
        gradePoints: 8,
        internal1: 40,
        internal2: 43,
        assignment: 17,
        color: '#f59e0b'
      },
      {
        code: 'CS305',
        name: 'Cloud Computing & Microservices DevOps',
        credits: 3,
        faculty: 'Dr. Priya Nair',
        cabin: 'Tech Tower C-405',
        email: 'priya.nair@campus.edu',
        totalClasses: 32,
        attended: 30,
        absent: 2,
        od: 0,
        percentage: 93.8,
        status: 'safe',
        targetMet: true,
        currentGrade: 'O',
        gradePoints: 10,
        internal1: 49,
        internal2: 50,
        assignment: 20,
        color: '#8b5cf6'
      },
      {
        code: 'CS306',
        name: 'Full Stack Web Architecture & UX Systems',
        credits: 3,
        faculty: 'Prof. Vikram Roy',
        cabin: 'Turing Block A-112',
        email: 'vikram.roy@campus.edu',
        totalClasses: 30,
        attended: 26,
        absent: 4,
        od: 0,
        percentage: 86.7,
        status: 'safe',
        targetMet: true,
        currentGrade: 'A+',
        gradePoints: 9,
        internal1: 45,
        internal2: 46,
        assignment: 19,
        color: '#06b6d4'
      }
    ],

    // Weekly Dynamic Timetable with Period Details & Room Change Alerts
    timetable: {
      Monday: [
        { period: 1, time: '09:00 - 09:50 AM', code: 'CS301', subject: 'Machine Learning', room: 'LH-301', faculty: 'Dr. Arvind Sharma', type: 'Lecture', roomChange: null, topic: 'Support Vector Machine Hyperplane' },
        { period: 2, time: '10:00 - 10:50 AM', code: 'CS302', subject: 'Operating Systems', room: 'LH-204', faculty: 'Prof. Sneha Sen', type: 'Lecture', roomChange: { isChanged: true, originalRoom: 'LH-102', newRoom: 'LH-204', reason: 'Projector Maintenance in LH-102', timestamp: 'Today 08:30 AM' }, topic: 'Page Replacement Algorithms (LRU & Optimal)' },
        { period: 3, time: '11:00 - 11:50 AM', code: 'CS303', subject: 'Database Management', room: 'LH-201', faculty: 'Dr. Rajesh Kumar', type: 'Lecture', roomChange: null, topic: 'B+ Tree Indexing & Hash Indices' },
        { period: 4, time: '12:00 - 12:50 PM', code: 'LUNCH', subject: 'Lunch & Recharge Break', room: 'Campus Cafeteria', faculty: '—', type: 'Break', roomChange: null, topic: 'Recharge' },
        { period: 5, time: '01:30 - 02:20 PM', code: 'CS304', subject: 'Computer Networks', room: 'LH-105', faculty: 'Prof. David Miller', type: 'Lecture', roomChange: null, topic: 'TCP Congestion Control (Tahoe & Reno)' },
        { period: 6, time: '02:30 - 04:20 PM', code: 'CS305P', subject: 'Cloud & DevOps Lab', room: 'Lab 4 - Turing Center', faculty: 'Dr. Priya Nair', type: 'Practical', roomChange: null, topic: 'Kubernetes Pod Deployment & Ingress Controller' }
      ],
      Tuesday: [
        { period: 1, time: '09:00 - 09:50 AM', code: 'CS304', subject: 'Computer Networks', room: 'LH-105', faculty: 'Prof. David Miller', type: 'Lecture', roomChange: null, topic: 'IP Subnetting & CIDR Notation' },
        { period: 2, time: '10:00 - 10:50 AM', code: 'CS301', subject: 'Machine Learning', room: 'LH-301', faculty: 'Dr. Arvind Sharma', type: 'Lecture', roomChange: null, topic: 'Convolutional Neural Networks (Conv2D & Pooling)' },
        { period: 3, time: '11:00 - 11:50 AM', code: 'CS306', subject: 'Full Stack Web Architecture', room: 'LH-202', faculty: 'Prof. Vikram Roy', type: 'Lecture', roomChange: null, topic: 'React Server Components & SSR' },
        { period: 4, time: '12:00 - 12:50 PM', code: 'LUNCH', subject: 'Lunch Break', room: 'Student Center', faculty: '—', type: 'Break', roomChange: null, topic: 'Break' },
        { period: 5, time: '01:30 - 03:20 PM', code: 'CS301P', subject: 'AI & Deep Learning Lab', room: 'High Performance Computing Lab', faculty: 'Dr. Arvind Sharma', type: 'Practical', roomChange: { isChanged: true, originalRoom: 'Lab 2', newRoom: 'HPC Lab (Tech Tower 4F)', reason: 'GPU Allocation for ResNet Training', timestamp: 'Yesterday 04:00 PM' }, topic: 'PyTorch Model Fine-Tuning with CUDA' },
        { period: 6, time: '03:30 - 04:20 PM', code: 'LIB', subject: 'Digital Library & Research', room: 'Central Library E-Wing', faculty: 'Dr. Anita Joshi', type: 'Library', roomChange: null, topic: 'IEEE Paper Review' }
      ],
      Wednesday: [
        { period: 1, time: '09:00 - 09:50 AM', code: 'CS302', subject: 'Operating Systems', room: 'LH-204', faculty: 'Prof. Sneha Sen', type: 'Lecture', roomChange: null, topic: 'Deadlock Detection & Banker Algorithm' },
        { period: 2, time: '10:00 - 10:50 AM', code: 'CS305', subject: 'Cloud Computing', room: 'LH-302', faculty: 'Dr. Priya Nair', type: 'Lecture', roomChange: null, topic: 'AWS Lambda & Serverless Microservices' },
        { period: 3, time: '11:00 - 11:50 AM', code: 'CS303', subject: 'Database Management', room: 'LH-201', faculty: 'Dr. Rajesh Kumar', type: 'Lecture', roomChange: null, topic: 'Distributed Sharding & MongoDB Replication' },
        { period: 4, time: '12:00 - 12:50 PM', code: 'LUNCH', subject: 'Lunch Break', room: 'Cafeteria', faculty: '—', type: 'Break', roomChange: null, topic: 'Lunch' },
        { period: 5, time: '01:30 - 02:20 PM', code: 'CS306', subject: 'Full Stack Web Architecture', room: 'LH-202', faculty: 'Prof. Vikram Roy', type: 'Lecture', roomChange: null, topic: 'JWT Authentication & Role-Based Access' },
        { period: 6, time: '02:30 - 04:20 PM', code: 'PROJ', subject: 'Capstone Project Studio', room: 'Innovation Hub Incubator', faculty: 'Mentor Panel', type: 'Studio', roomChange: null, topic: 'Sprint 3 Review & Prototype Demo' }
      ],
      Thursday: [
        { period: 1, time: '09:00 - 09:50 AM', code: 'CS301', subject: 'Machine Learning', room: 'LH-301', faculty: 'Dr. Arvind Sharma', type: 'Lecture', roomChange: null, topic: 'Recurrent Neural Networks & LSTM Gates' },
        { period: 2, time: '10:00 - 10:50 AM', code: 'CS304', subject: 'Computer Networks', room: 'LH-105', faculty: 'Prof. David Miller', type: 'Lecture', roomChange: null, topic: 'DNS, BGP Routing & Anycast' },
        { period: 3, time: '11:00 - 11:50 AM', code: 'CS302', subject: 'Operating Systems', room: 'LH-204', faculty: 'Prof. Sneha Sen', type: 'Lecture', roomChange: null, topic: 'Linux File System VFS & Ext4 Inodes' },
        { period: 4, time: '12:00 - 12:50 PM', code: 'LUNCH', subject: 'Lunch Break', room: 'Cafeteria', faculty: '—', type: 'Break', roomChange: null, topic: 'Lunch' },
        { period: 5, time: '01:30 - 03:20 PM', code: 'CS303P', subject: 'Database Systems Lab', room: 'Database Lab - Tech Tower 2F', faculty: 'Dr. Rajesh Kumar', type: 'Practical', roomChange: null, topic: 'PostgreSQL ACID Transactions & Isolation Levels' },
        { period: 6, time: '03:30 - 04:20 PM', code: 'MENT', subject: 'Faculty Mentor Consultation', room: 'Cabin C-302', faculty: 'Dr. Arvind Sharma', type: 'Mentorship', roomChange: null, topic: 'Internship & Attendance Review' }
      ],
      Friday: [
        { period: 1, time: '09:00 - 09:50 AM', code: 'CS305', subject: 'Cloud Computing', room: 'LH-302', faculty: 'Dr. Priya Nair', type: 'Lecture', roomChange: null, topic: 'Terraform Infrastructure as Code (IaC)' },
        { period: 2, time: '10:00 - 10:50 AM', code: 'CS306', subject: 'Full Stack Web Architecture', room: 'LH-202', faculty: 'Prof. Vikram Roy', type: 'Lecture', roomChange: null, topic: 'GraphQL Schema Design vs REST' },
        { period: 3, time: '11:00 - 11:50 AM', code: 'CS301', subject: 'Machine Learning', room: 'LH-301', faculty: 'Dr. Arvind Sharma', type: 'Lecture', roomChange: null, topic: 'Transformer Attention Mechanism (Self-Attention)' },
        { period: 4, time: '12:00 - 12:50 PM', code: 'LUNCH', subject: 'Lunch Break', room: 'Cafeteria', faculty: '—', type: 'Break', roomChange: null, topic: 'Lunch' },
        { period: 5, time: '01:30 - 02:20 PM', code: 'SEMN', subject: 'Technical Seminar / Industry Speaker', room: 'APJ Kalam Auditorium', faculty: 'Guest Speaker', type: 'Seminar', roomChange: null, topic: 'DeepMind Research: Scaling Multi-Agent Systems' },
        { period: 6, time: '02:30 - 04:20 PM', code: 'CLUB', subject: 'Club & Co-Curricular Activity', room: 'Student Activity Center', faculty: 'Club Leads', type: 'Activity', roomChange: null, topic: 'Hackathon HackNight Preparation' }
      ]
    },

    // Period-wise Class Log ("What happened in my last class")
    periodLogs: [
      {
        id: 'LOG-101',
        date: 'Today, 10 Nov 2026',
        period: 'Period 2 (10:00 AM)',
        courseCode: 'CS302',
        courseName: 'Operating Systems',
        faculty: 'Prof. Sneha Sen',
        room: 'LH-204 (Room Changed from LH-102)',
        topicTaught: 'Virtual Memory & Page Replacement Algorithms: FIFO vs Optimal vs LRU implementation with page fault frequency calculation.',
        keyTakeaways: 'Solved 3 numerical problems on Belady Anomaly and LRU stack implementation. Announced surprise quiz next Monday on Chapter 9.',
        materials: [
          { name: 'Lecture_09_Virtual_Memory_LRU.pdf', size: '2.4 MB', type: 'pdf', url: '#' },
          { name: 'Belady_Anomaly_Interactive_Sim.html', size: '150 KB', type: 'code', url: '#' }
        ],
        attendanceStatus: 'Present',
        studentMarked: true,
        submittedAt: '10:52 AM'
      },
      {
        id: 'LOG-102',
        date: 'Today, 10 Nov 2026',
        period: 'Period 1 (09:00 AM)',
        courseCode: 'CS301',
        courseName: 'Machine Learning',
        faculty: 'Dr. Arvind Sharma',
        room: 'LH-301',
        topicTaught: 'Support Vector Machines: Dual Formulation, Karush-Kuhn-Tucker (KKT) Conditions, and Kernel functions (RBF vs Polynomial).',
        keyTakeaways: 'Derived maximum margin classifier equation. Demonstrated RBF gamma and C parameter trade-offs in Python scikit-learn.',
        materials: [
          { name: 'SVM_Mathematical_Derivation.pdf', size: '3.1 MB', type: 'pdf', url: '#' },
          { name: 'svm_kernels_demo.ipynb', size: '420 KB', type: 'notebook', url: '#' }
        ],
        attendanceStatus: 'Present',
        studentMarked: true,
        submittedAt: '09:55 AM'
      },
      {
        id: 'LOG-103',
        date: 'Yesterday, 09 Nov 2026',
        period: 'Period 5 (01:30 PM)',
        courseCode: 'CS304',
        courseName: 'Computer Networks',
        faculty: 'Prof. David Miller',
        room: 'LH-105',
        topicTaught: 'Transport Layer Protocols: TCP 3-Way Handshake, TCP Fast Retransmit, and Congestion Avoidance algorithms.',
        keyTakeaways: 'Analyzed Wireshark packet capture PCAP files. Homework assigned: analyze SYN flood defense mechanism (SYN Cookies).',
        materials: [
          { name: 'TCP_Congestion_Control_Wireshark.pcap', size: '5.8 MB', type: 'data', url: '#' },
          { name: 'Homework_Assignment_3.pdf', size: '410 KB', type: 'pdf', url: '#' }
        ],
        attendanceStatus: 'Absent',
        studentMarked: false,
        submittedAt: '02:25 PM'
      },
      {
        id: 'LOG-104',
        date: 'Yesterday, 09 Nov 2026',
        period: 'Period 2 (10:00 AM)',
        courseCode: 'CS305',
        courseName: 'Cloud Computing',
        faculty: 'Dr. Priya Nair',
        room: 'LH-302',
        topicTaught: 'Containerization Architecture: Docker Engine cgroups and namespaces, multi-stage builds, and Docker Compose orchestration.',
        keyTakeaways: 'Built a 3-tier container stack (Node.js + Redis + Postgres). Lab challenge released for Friday.',
        materials: [
          { name: 'Docker_Production_Practices.slides.pdf', size: '4.2 MB', type: 'pdf', url: '#' },
          { name: 'docker-compose-production.yaml', size: '12 KB', type: 'code', url: '#' }
        ],
        attendanceStatus: 'Present',
        studentMarked: true,
        submittedAt: '10:55 AM'
      },
      {
        id: 'LOG-105',
        date: '08 Nov 2026',
        period: 'Period 3 (11:00 AM)',
        courseCode: 'CS303',
        courseName: 'Database Management',
        faculty: 'Dr. Rajesh Kumar',
        room: 'LH-201',
        topicTaught: 'Transaction Processing & Concurrency: Two-Phase Locking (2PL), Strict 2PL, Timestamp Ordering, and Deadlock prevention schemes.',
        keyTakeaways: 'Proved conflict serializability using precedence graphs. Prepared for upcoming Mid-Term 2.',
        materials: [
          { name: 'Transactions_and_2PL_DeepDive.pdf', size: '1.9 MB', type: 'pdf', url: '#' }
        ],
        attendanceStatus: 'On-Duty (OD)',
        studentMarked: true,
        submittedAt: '11:58 AM'
      }
    ],

    // Marks & Pending Projects Tracker
    marksData: {
      cgpaHistory: [
        { semester: 'Semester 1', sgpa: 8.60, credits: 21 },
        { semester: 'Semester 2', sgpa: 8.85, credits: 22 },
        { semester: 'Semester 3', sgpa: 8.55, credits: 23 },
        { semester: 'Semester 4', sgpa: 8.95, credits: 24 },
        { semester: 'Semester 5 (Current Est.)', sgpa: 8.78, credits: 20 }
      ],
      currentSemesterCourses: [
        { code: 'CS301', name: 'Machine Learning', credits: 4, internal1: 46, internal2: 48, assignment: 19, labModel: 48, totalInternal: 47.5, gradeExpected: 'A+', gradePoint: 9 },
        { code: 'CS302', name: 'Operating Systems', credits: 4, internal1: 38, internal2: 41, assignment: 16, labModel: 42, totalInternal: 39.5, gradeExpected: 'B+', gradePoint: 7 },
        { code: 'CS303', name: 'Database Management', credits: 3, internal1: 42, internal2: 44, assignment: 18, labModel: 45, totalInternal: 43.5, gradeExpected: 'A', gradePoint: 8 },
        { code: 'CS304', name: 'Computer Networks', credits: 3, internal1: 40, internal2: 43, assignment: 17, labModel: 44, totalInternal: 41.5, gradeExpected: 'A', gradePoint: 8 },
        { code: 'CS305', name: 'Cloud Computing', credits: 3, internal1: 49, internal2: 50, assignment: 20, labModel: 49, totalInternal: 49.5, gradeExpected: 'O', gradePoint: 10 },
        { code: 'CS306', name: 'Full Stack Web Dev', credits: 3, internal1: 45, internal2: 46, assignment: 19, labModel: 47, totalInternal: 45.8, gradeExpected: 'A+', gradePoint: 9 }
      ],
      pendingProjects: [
        {
          id: 'PRJ-501',
          title: 'Campus Food Surplus Redistribution & Logistics App',
          course: 'CS306 Full Stack Web Architecture',
          faculty: 'Prof. Vikram Roy',
          team: ['Alex Turner (Lead)', 'Sarah Chen', 'Karthik Raja'],
          deadline: '14 Nov 2026',
          daysLeft: 3,
          progress: 85,
          urgency: 'high',
          status: 'In Review',
          description: 'Full-stack MERN application connecting hostel mess leftovers with local certified NGOs.'
        },
        {
          id: 'PRJ-502',
          title: 'Autonomous Drone Obstacle Avoidance via YOLOv8 & ROS2',
          course: 'CS301 Machine Learning',
          faculty: 'Dr. Arvind Sharma',
          team: ['Alex Turner', 'Rohan Mehta'],
          deadline: '19 Nov 2026',
          daysLeft: 8,
          progress: 60,
          urgency: 'medium',
          status: 'In Progress',
          description: 'Edge AI inference on NVIDIA Jetson Nano for real-time indoor path planning.'
        },
        {
          id: 'PRJ-503',
          title: 'Microkernel IPC Benchmark & Zero-Copy Buffer Engine',
          course: 'CS302 Operating Systems',
          faculty: 'Prof. Sneha Sen',
          team: ['Alex Turner (Solo)'],
          deadline: '28 Nov 2026',
          daysLeft: 17,
          progress: 35,
          urgency: 'normal',
          status: 'Researching',
          description: 'Benchmarking context switches and shared memory queues against Linux pipes.'
        }
      ]
    },

    // Syllabus Tracker (Course -> Units -> Topics & Sub-topics)
    syllabusTracker: [
      {
        courseCode: 'CS301',
        courseName: 'Machine Learning & Neural Architectures',
        faculty: 'Dr. Arvind Sharma',
        units: [
          {
            unitNo: 1,
            title: 'Foundations of Machine Learning & Linear Models',
            topicsCovered: 5,
            totalTopics: 5,
            topics: [
              { name: 'Supervised vs Unsupervised Paradigms', facultyCovered: true, selfRevised: true },
              { name: 'Linear Regression & Cost Function Gradient Descent', facultyCovered: true, selfRevised: true },
              { name: 'Logistic Regression for Binary & Multiclass Classification', facultyCovered: true, selfRevised: true },
              { name: 'Ridge (L2) and Lasso (L1) Regularization', facultyCovered: true, selfRevised: true },
              { name: 'Bias-Variance Tradeoff & Model Evaluation Metrics', facultyCovered: true, selfRevised: true }
            ]
          },
          {
            unitNo: 2,
            title: 'Tree Models & Ensemble Learning',
            topicsCovered: 4,
            totalTopics: 4,
            topics: [
              { name: 'Decision Trees: ID3, C4.5, and CART Algorithms', facultyCovered: true, selfRevised: true },
              { name: 'Information Gain, Entropy, and Gini Impurity', facultyCovered: true, selfRevised: true },
              { name: 'Random Forests & Bagging Ensembles', facultyCovered: true, selfRevised: false },
              { name: 'Boosting Algorithms: AdaBoost, Gradient Boosting, XGBoost', facultyCovered: true, selfRevised: false }
            ]
          },
          {
            unitNo: 3,
            title: 'Support Vector Machines & Kernel Methods',
            topicsCovered: 3,
            totalTopics: 4,
            topics: [
              { name: 'Hyperplanes & Hard Margin Classification', facultyCovered: true, selfRevised: true },
              { name: 'Soft Margin Slack Variables & C Parameter', facultyCovered: true, selfRevised: false },
              { name: 'The Kernel Trick (Polynomial, RBF, Sigmoid)', facultyCovered: true, selfRevised: false },
              { name: 'Support Vector Regression (SVR)', facultyCovered: false, selfRevised: false }
            ]
          },
          {
            unitNo: 4,
            title: 'Deep Neural Networks & Architectures',
            topicsCovered: 2,
            totalTopics: 5,
            topics: [
              { name: 'Multilayer Perceptron (MLP) & Backpropagation Math', facultyCovered: true, selfRevised: false },
              { name: 'Convolutional Neural Networks (CNN) & Computer Vision', facultyCovered: true, selfRevised: false },
              { name: 'Recurrent Neural Networks (RNN) and LSTMs', facultyCovered: false, selfRevised: false },
              { name: 'Transformer Self-Attention & Vision Transformers', facultyCovered: false, selfRevised: false },
              { name: 'Generative AI: Autoencoders & Diffusion Basics', facultyCovered: false, selfRevised: false }
            ]
          },
          {
            unitNo: 5,
            title: 'Unsupervised Learning & Clustering',
            topicsCovered: 0,
            totalTopics: 4,
            topics: [
              { name: 'K-Means Clustering & Elbow Method', facultyCovered: false, selfRevised: false },
              { name: 'Hierarchical & DBSCAN Clustering', facultyCovered: false, selfRevised: false },
              { name: 'Principal Component Analysis (PCA) Dimensionality Reduction', facultyCovered: false, selfRevised: false },
              { name: 't-SNE and UMAP Embeddings', facultyCovered: false, selfRevised: false }
            ]
          }
        ]
      },
      {
        courseCode: 'CS302',
        courseName: 'Operating Systems & Kernel Engineering',
        faculty: 'Prof. Sneha Sen',
        units: [
          {
            unitNo: 1,
            title: 'Process Management & CPU Scheduling',
            topicsCovered: 4,
            totalTopics: 4,
            topics: [
              { name: 'Process Control Block (PCB) & Context Switching', facultyCovered: true, selfRevised: true },
              { name: 'Preemptive vs Non-Preemptive Scheduling Algorithms', facultyCovered: true, selfRevised: true },
              { name: 'Inter-Process Communication: Pipes & Shared Memory', facultyCovered: true, selfRevised: true },
              { name: 'POSIX Threads & Multi-Threading Models', facultyCovered: true, selfRevised: false }
            ]
          },
          {
            unitNo: 2,
            title: 'Process Synchronization & Deadlocks',
            topicsCovered: 4,
            totalTopics: 4,
            topics: [
              { name: 'Critical Section Problem & Peterson Solution', facultyCovered: true, selfRevised: true },
              { name: 'Mutex Locks & Counting Semaphores', facultyCovered: true, selfRevised: true },
              { name: 'Dining Philosophers & Classical Sync Problems', facultyCovered: true, selfRevised: false },
              { name: 'Deadlock Conditions & Banker Algorithm', facultyCovered: true, selfRevised: false }
            ]
          },
          {
            unitNo: 3,
            title: 'Memory Management & Virtual Memory',
            topicsCovered: 3,
            totalTopics: 4,
            topics: [
              { name: 'Paging Architecture, TLB & Multi-Level Page Tables', facultyCovered: true, selfRevised: true },
              { name: 'Segmentation & Protection Mechanisms', facultyCovered: true, selfRevised: false },
              { name: 'Demand Paging & Page Replacement (FIFO, LRU)', facultyCovered: true, selfRevised: false },
              { name: 'Thrashing & Working Set Model', facultyCovered: false, selfRevised: false }
            ]
          },
          {
            unitNo: 4,
            title: 'Storage & File System Implementation',
            topicsCovered: 1,
            totalTopics: 4,
            topics: [
              { name: 'Disk Scheduling Algorithms (SSTF, SCAN, C-LOOK)', facultyCovered: true, selfRevised: false },
              { name: 'Inode File Structure & Directory Allocation', facultyCovered: false, selfRevised: false },
              { name: 'Free Space Management & RAID Levels (0, 1, 5)', facultyCovered: false, selfRevised: false },
              { name: 'Journaling File Systems & Recovery', facultyCovered: false, selfRevised: false }
            ]
          },
          {
            unitNo: 5,
            title: 'Security & Virtualization',
            topicsCovered: 0,
            totalTopics: 3,
            topics: [
              { name: 'Access Control Matrix & Capability Lists', facultyCovered: false, selfRevised: false },
              { name: 'Hypervisors: Type 1 Bare Metal vs Type 2', facultyCovered: false, selfRevised: false },
              { name: 'OS-Level Virtualization & Linux Namespaces', facultyCovered: false, selfRevised: false }
            ]
          }
        ]
      }
    ],

    // Lab / Hall / Room Booking System
    venues: [
      {
        id: 'VEN-01',
        name: 'Turing AI & High-Performance Computing Lab',
        capacity: 70,
        type: 'Lab',
        location: 'Tech Tower 4th Floor (Room 401)',
        equipment: ['60x NVIDIA RTX 4090 Workstations', 'Dual 4K Laser Projectors', 'Gigabit Ethernet', 'Interactive Smartboard'],
        image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80',
        status: 'Available'
      },
      {
        id: 'VEN-02',
        name: 'Dr. APJ Abdul Kalam Grand Auditorium',
        capacity: 650,
        type: 'Auditorium',
        location: 'Main Administrative Complex Ground Floor',
        equipment: ['Surround Sound PA System', '40ft LED Video Wall', 'Motorized Stage Lighting', 'Live Stream Broadcasting Pod'],
        image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
        status: 'Partially Booked'
      },
      {
        id: 'VEN-03',
        name: 'Ramanujan Seminar Hall',
        capacity: 180,
        type: 'Seminar Hall',
        location: 'Science Block 2nd Floor',
        equipment: ['Dual Acoustic Mics', 'Projector & Screen', 'Centralized AC', 'Video Conferencing Zoom Room'],
        image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80',
        status: 'Available'
      },
      {
        id: 'VEN-04',
        name: 'IoT & Embedded Robotics Workshop',
        capacity: 45,
        type: 'Lab',
        location: 'Mechanical Block Wing B',
        equipment: ['Digital Oscilloscopes', '3D Printers', 'Soldering Stations', 'Raspberry Pi 5 & Jetson Kits'],
        image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        status: 'Available'
      },
      {
        id: 'VEN-05',
        name: 'Innovation & Club Discussion Room Alpha',
        capacity: 25,
        type: 'Discussion Room',
        location: 'Student Activity Hub 1F',
        equipment: ['Glass Whiteboard Walls', 'Meeting Pod', 'Coffee Station', 'Display Mirroring Screen'],
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
        status: 'Available'
      }
    ],

    // Bookings Registry
    bookings: [
      {
        id: 'BK-8901',
        venueId: 'VEN-01',
        venueName: 'Turing AI & High-Performance Computing Lab',
        bookedBy: 'Alex Turner (GDSC Club Lead)',
        applicantEmail: 'alex.turner@campus.edu',
        date: '12 Nov 2026',
        slot: '02:00 PM - 05:00 PM',
        purpose: 'Google Developer Student Club - GenAI Hackathon Hands-on Workshop',
        expectedAttendees: 55,
        status: 'Approved',
        approvedBy: 'Dr. Meenakshi Sundaram (HOD-CSE)',
        bookingPassCode: 'PASS-GDSC-8901',
        createdAt: '09 Nov 2026'
      },
      {
        id: 'BK-8902',
        venueId: 'VEN-03',
        venueName: 'Ramanujan Seminar Hall',
        bookedBy: 'Pooja Verma (Robotics Club Head)',
        applicantEmail: 'pooja.verma@campus.edu',
        date: '15 Nov 2026',
        slot: '10:00 AM - 01:00 PM',
        purpose: 'National Robotics Championship Orientation & Team Pitching',
        expectedAttendees: 120,
        status: 'Pending',
        approvedBy: 'Pending HOD Approval',
        bookingPassCode: 'PENDING-ROBO-8902',
        createdAt: '10 Nov 2026'
      },
      {
        id: 'BK-8903',
        venueId: 'VEN-02',
        venueName: 'Dr. APJ Abdul Kalam Grand Auditorium',
        bookedBy: 'Placement & Training Cell',
        applicantEmail: 'placement@campus.edu',
        date: '18 Nov 2026',
        slot: '09:00 AM - 04:00 PM',
        purpose: 'Annual Campus Recruitment Drive - Microsoft & Google Tech Keynote',
        expectedAttendees: 500,
        status: 'Approved',
        approvedBy: 'Dean of Student Affairs',
        bookingPassCode: 'PASS-PLACE-8903',
        createdAt: '05 Nov 2026'
      }
    ],

    // Unified Upcoming Sessions, Extra Classes & Announcements Feed
    announcements: [
      {
        id: 'ANN-301',
        title: '⚡ URGENT: Room Change for CS302 Operating Systems',
        category: 'Room Change Alert',
        priority: 'urgent',
        timestamp: 'Today, 08:30 AM',
        author: 'Department of Computer Science',
        content: 'Please note: Period 2 CS302 (Operating Systems) lecture scheduled for 10:00 AM today has been moved from LH-102 to LH-204 due to emergency projector and AC servicing.',
        badge: 'Room Shift',
        icon: 'notifications_active',
        color: '#ef4444'
      },
      {
        id: 'ANN-302',
        title: '🎯 Extra Remedial Doubt-Clearing Session: Machine Learning (SVM & Neural Nets)',
        category: 'Academic Session',
        priority: 'high',
        timestamp: 'Today, 07:15 AM',
        author: 'Dr. Arvind Sharma',
        content: 'Special doubt clearing and numerical problem-solving session for students scoring below 40 in Internal Assessment 1. Date: Thursday 04:30 PM - 05:45 PM in LH-301. All are welcome.',
        badge: 'Remedial Class',
        icon: 'school',
        color: '#3b82f6'
      },
      {
        id: 'ANN-303',
        title: '🌐 Distinguished Guest Lecture: Scaling Multi-Agent Systems in Production',
        category: 'Guest Lecture',
        priority: 'high',
        timestamp: 'Yesterday, 02:40 PM',
        author: 'IEEE Student Chapter & Envision Cell',
        content: 'Keynote address by Dr. K. Radhakrishnan (Senior AI Architect, Google DeepMind) on Friday 14 Nov at 01:30 PM in APJ Abdul Kalam Auditorium. Attendance is mandatory for 3rd and 4th year CSE students.',
        badge: 'Industry Talk',
        icon: 'mic',
        color: '#8b5cf6'
      },
      {
        id: 'ANN-304',
        title: '📅 Mid-Semester Assessment 2 Timetable Released',
        category: 'Examinations',
        priority: 'normal',
        timestamp: '08 Nov 2026',
        author: 'Office of the Controller of Examinations',
        content: 'The official schedule for IA-2 has been officially ratified. Exams commence on 25 Nov 2026. Hall tickets will be issued only to candidates having >= 75% aggregate attendance.',
        badge: 'Exam Cell',
        icon: 'calendar_month',
        color: '#10b981'
      },
      {
        id: 'ANN-305',
        title: '🚀 Smart India Hackathon & Envision 2026 Internal Nominations Open',
        category: 'Clubs & Competitions',
        priority: 'normal',
        timestamp: '06 Nov 2026',
        author: 'Centre for Innovation and Entrepreneurship',
        content: 'Teams of 6 (minimum 1 female member) can submit executive problem pitch decks via the innovation portal before 18 Nov. Winning teams represent our university at national finals.',
        badge: 'Hackathon',
        icon: 'emoji_events',
        color: '#f59e0b'
      }
    ],

    // Leave & On-Duty (OD) Requests
    leaves: [
      {
        id: 'LEV-401',
        studentName: 'Alex Turner',
        studentEmail: 'alex.turner@campus.edu',
        rollNo: '22CS042',
        type: 'On-Duty (OD)',
        category: 'Technical Symposium / Hackathon',
        fromDate: '14 Nov 2026',
        toDate: '15 Nov 2026',
        days: 2,
        reason: 'Representing University at Inter-College Hackathon at IIT Madras.',
        supportingDoc: 'IITM_Hackathon_Shortlist_Letter.pdf',
        status: 'Approved',
        timeline: [
          { step: 'Applied by Student', time: '08 Nov 11:20 AM', status: 'done' },
          { step: 'Faculty Mentor Endorsement (Dr. Sharma)', time: '08 Nov 02:45 PM', status: 'done' },
          { step: 'HOD Approval (Dr. Meenakshi)', time: '09 Nov 10:15 AM', status: 'done' },
          { step: 'Gate Pass & Attendance Exemption Issued', time: '09 Nov 10:30 AM', status: 'done' }
        ],
        gatePassId: 'GP-OD-2026-9812'
      },
      {
        id: 'LEV-402',
        studentName: 'Alex Turner',
        studentEmail: 'alex.turner@campus.edu',
        rollNo: '22CS042',
        type: 'Medical Leave',
        category: 'Health / Sickness',
        fromDate: '02 Nov 2026',
        toDate: '03 Nov 2026',
        days: 2,
        reason: 'Severe Viral Fever and acute dehydration (Doctor advised bed rest).',
        supportingDoc: 'Medical_Certificate_Apollo.pdf',
        status: 'Approved',
        timeline: [
          { step: 'Applied with Medical Certificate', time: '04 Nov 09:00 AM', status: 'done' },
          { step: 'Campus Medical Officer Verification', time: '04 Nov 11:30 AM', status: 'done' },
          { step: 'HOD Attendance Regularization', time: '05 Nov 03:00 PM', status: 'done' }
        ],
        gatePassId: 'GP-MED-2026-4412'
      },
      {
        id: 'LEV-403',
        studentName: 'Alex Turner',
        studentEmail: 'alex.turner@campus.edu',
        rollNo: '22CS042',
        type: 'Hostel Outing / Gate Pass',
        category: 'Family Visit / Personal',
        fromDate: '20 Nov 2026',
        toDate: '22 Nov 2026',
        days: 3,
        reason: 'Attending cousin sister wedding at home town.',
        supportingDoc: 'Parent_Consent_Letter.pdf',
        status: 'Pending',
        timeline: [
          { step: 'Applied by Student', time: '10 Nov 09:15 AM', status: 'done' },
          { step: 'Parent Verification OTP Call', time: '10 Nov 11:00 AM', status: 'done' },
          { step: 'Warden Clearance', time: 'Pending', status: 'pending' }
        ],
        gatePassId: 'GP-PENDING-7711'
      }
    ],

    // Support Tickets & Grievances
    tickets: [
      {
        id: 'TKT-901',
        title: 'Projector HDMI port flickering in LH-204',
        category: 'Infrastructure',
        priority: 'High',
        createdBy: 'alex.turner@campus.edu',
        date: '09 Nov 2026',
        status: 'In Progress',
        adminReply: 'Campus Maintenance technician assigned. Testing replacement cable today.',
        statusHistory: ['Open', 'In Progress']
      },
      {
        id: 'TKT-902',
        title: 'WiFi AP Eduroam dead zone in Central Library 2nd Floor reading hall',
        category: 'IT & Networking',
        priority: 'Normal',
        createdBy: 'alex.turner@campus.edu',
        date: '05 Nov 2026',
        status: 'Resolved',
        adminReply: 'Added an additional Cisco dual-band access point on Pillar 4. Signal coverage restored to 120 Mbps.',
        statusHistory: ['Open', 'In Progress', 'Resolved']
      },
      {
        id: 'TKT-903',
        title: 'Extended library hours request during semester examination weeks',
        category: 'Academic Facility',
        priority: 'Normal',
        createdBy: 'alex.turner@campus.edu',
        date: '02 Nov 2026',
        status: 'Approved',
        adminReply: 'Approved by Vice Chancellor. Library reading halls will stay open until 02:00 AM from 20 Nov.',
        statusHistory: ['Open', 'Approved']
      }
    ],

    // Campus Contacts & Emergency SOS Directory
    contacts: {
      emergency: [
        { title: 'Campus Security Main Gate (24x7)', number: '+91 44 2257 8888', shortDial: 'Ext. 100', icon: 'local_police', color: '#ef4444' },
        { title: 'Campus Health Center & Ambulance', number: '+91 44 2257 8899', shortDial: 'Ext. 108', icon: 'emergency', color: '#dc2626' },
        { title: 'Women Safety & Anti-Harassment Cell', number: '+91 44 2257 8877', shortDial: 'Ext. 109', icon: 'shield', color: '#ec4899' },
        { title: 'Anti-Ragging Helpline (Toll Free)', number: '1800-180-5522', shortDial: 'Ext. 112', icon: 'verified_user', color: '#f59e0b' },
        { title: 'Student Psychological Counseling Center', number: '+91 94450 12345', shortDial: 'Ext. 240', icon: 'psychology', color: '#8b5cf6' }
      ],
      departments: [
        {
          dept: 'Computer Science & Engineering',
          hod: 'Dr. Meenakshi Sundaram',
          office: 'Tech Tower Room C-101',
          email: 'hod.cse@campus.edu',
          phone: '+91 44 2257 4401',
          hours: '10:00 AM - 01:00 PM & 03:00 PM - 05:00 PM'
        },
        {
          dept: 'Office of the Controller of Examinations',
          hod: 'Dr. S. K. Narayanan',
          office: 'Administrative Block Wing 1F',
          email: 'coe@campus.edu',
          phone: '+91 44 2257 4410',
          hours: '09:30 AM - 04:30 PM'
        },
        {
          dept: 'Dean of Student Affairs & Hostels',
          hod: 'Prof. R. Baskaran',
          office: 'Student Activity Complex 2F',
          email: 'dean.sa@campus.edu',
          phone: '+91 44 2257 4425',
          hours: '02:00 PM - 05:00 PM'
        },
        {
          dept: 'Training & Corporate Placement Cell',
          hod: 'Dr. Ananya Ray',
          office: 'Placement Centre, Newton Block',
          email: 'placements@campus.edu',
          phone: '+91 44 2257 4450',
          hours: '09:00 AM - 06:00 PM'
        }
      ],
      faculty: [
        { name: 'Dr. Arvind Sharma', role: 'Associate Professor', courses: ['Machine Learning', 'AI Lab'], cabin: 'Tech Tower C-302', email: 'dr.sharma@campus.edu', phone: '+91 98110 54321', hours: 'Mon/Wed 03:30 - 05:00 PM' },
        { name: 'Prof. Sneha Sen', role: 'Assistant Professor (Sr. Grade)', courses: ['Operating Systems', 'Kernel Lab'], cabin: 'Newton Block B-214', email: 'sneha.sen@campus.edu', phone: '+91 98110 54322', hours: 'Tue/Thu 02:00 - 03:30 PM' },
        { name: 'Dr. Rajesh Kumar', role: 'Professor', courses: ['Database Management', 'NoSQL Lab'], cabin: 'Tech Tower D-105', email: 'rajesh.kumar@campus.edu', phone: '+91 98110 54323', hours: 'Wed/Fri 11:30 - 01:00 PM' },
        { name: 'Prof. David Miller', role: 'Associate Professor', courses: ['Computer Networks', 'Network Security'], cabin: 'Turing Block A-201', email: 'david.miller@campus.edu', phone: '+91 98110 54324', hours: 'Mon/Thu 10:00 - 11:30 AM' },
        { name: 'Dr. Priya Nair', role: 'Assistant Professor', courses: ['Cloud Computing', 'DevOps Lab'], cabin: 'Tech Tower C-405', email: 'priya.nair@campus.edu', phone: '+91 98110 54325', hours: 'Tue/Fri 03:00 - 04:30 PM' },
        { name: 'Prof. Vikram Roy', role: 'Assistant Professor', courses: ['Full Stack Web Architecture', 'UI/UX'], cabin: 'Turing Block A-112', email: 'vikram.roy@campus.edu', phone: '+91 98110 54326', hours: 'Wed/Fri 02:00 - 03:30 PM' }
      ]
    },

    // Modular Space for Extensibility & Future Dashboards
    customModules: [
      {
        id: 'MOD-TRANS',
        name: 'Smart Transit & Campus Shuttle GPS',
        icon: 'directions_bus',
        badge: 'Transit Hub',
        status: 'Active',
        description: 'Live GPS telemetry and arrival predictions for all 18 campus shuttle buses and hostel transit lines.',
        stats: '6 Active Routes • Next Arrival: 4 min',
        layoutType: 'map',
        color: '#3b82f6'
      },
      {
        id: 'MOD-MESS',
        name: 'Dining & Mess Nutrition Tracker',
        icon: 'restaurant',
        badge: 'Hostel Dining',
        status: 'Active',
        description: 'Daily chef curated menus, food quality rating, dietary calorie breakdown, and leave food rebate automation.',
        stats: 'Today Special: Paneer Butter Masala & Biryani • 4.8★',
        layoutType: 'grid',
        color: '#10b981'
      },
      {
        id: 'MOD-CAREER',
        name: 'Placement & Internship Accelerator',
        icon: 'work',
        badge: 'Career Hub',
        status: 'Active',
        description: 'Direct corporate recruitment portal with real-time eligibility checker, ATS resume optimizer, and mock interview scheduler.',
        stats: '24 Active Hiring Drives • 8 Shortlists Open',
        layoutType: 'list',
        color: '#8b5cf6'
      },
      {
        id: 'MOD-LIB',
        name: 'Digital Library & IEEE Resource Vault',
        icon: 'menu_book',
        badge: 'E-Library',
        status: 'Active',
        description: 'RFID automated book borrowing, remote access to IEEE Xplore, ScienceDirect, Springer, and quiet study desk bookings.',
        stats: '2 Books Issued • Due in 12 days • IEEE Proxy Connected',
        layoutType: 'grid',
        color: '#06b6d4'
      },
      {
        id: 'MOD-ALUMNI',
        name: 'Alumni Network & 1:1 Mentorship',
        icon: 'groups',
        badge: 'Networking',
        status: 'Active',
        description: 'Connect with over 15,000 alumni across Silicon Valley, Bangalore, and Europe for career mentoring, referrals, and thesis guidance.',
        stats: '1,420 Mentors Online • 3 Mock Interviews Completed',
        layoutType: 'network',
        color: '#f59e0b'
      }
    ]
  };

  // State initialization and persistence
  function loadState() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        return JSON.parse(serialized);
      }
    } catch (e) {
      console.warn('Campus360: Local storage read failed, using defaults.', e);
    }
    saveState(defaultState);
    return JSON.parse(JSON.stringify(defaultState));
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Campus360: Local storage write failed.', e);
    }
  }

  let currentState = loadState();

  return {
    getState: function () {
      return currentState;
    },
    save: function () {
      saveState(currentState);
    },
    resetToDefault: function () {
      currentState = JSON.parse(JSON.stringify(defaultState));
      saveState(currentState);
      return currentState;
    },
    setRole: function (roleKey) {
      if (currentState.roles[roleKey]) {
        currentState.currentRole = roleKey;
        currentState.currentUser = currentState.roles[roleKey];
        saveState(currentState);
        return currentState.currentUser;
      }
      return null;
    },
    addBooking: function (booking) {
      currentState.bookings.unshift(booking);
      saveState(currentState);
      return booking;
    },
    addLeaveRequest: function (leave) {
      currentState.leaves.unshift(leave);
      saveState(currentState);
      return leave;
    },
    addTicket: function (ticket) {
      currentState.tickets.unshift(ticket);
      saveState(currentState);
      return ticket;
    },
    addPeriodLog: function (log) {
      currentState.periodLogs.unshift(log);
      saveState(currentState);
      return log;
    },
    addAnnouncement: function (announcement) {
      currentState.announcements.unshift(announcement);
      saveState(currentState);
      return announcement;
    },
    addCustomModule: function (module) {
      currentState.customModules.push(module);
      saveState(currentState);
      return module;
    },
    toggleSyllabusTopic: function (courseCode, unitNo, topicName, type) {
      const course = currentState.syllabusTracker.find(c => c.courseCode === courseCode);
      if (course) {
        const unit = course.units.find(u => u.unitNo === unitNo);
        if (unit) {
          const topic = unit.topics.find(t => t.name === topicName);
          if (topic) {
            if (type === 'selfRevised') {
              topic.selfRevised = !topic.selfRevised;
            } else if (type === 'facultyCovered') {
              topic.facultyCovered = !topic.facultyCovered;
            }
            saveState(currentState);
            return topic;
          }
        }
      }
      return null;
    }
  };
})();

