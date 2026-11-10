/**
 * Educational Institution Management Information System (IMS) - Normalized Relational Data
 * Based on Schema Specifications from:
 * - IEEE 7384005: ER Entities (Students, Teachers, Depts, Majors, Classes, Courses, Scores, Placements)
 * - IEEE 10058674: Student Module (Admissions, Promotions, Research Papers, Internships, Events)
 * - IEEE 10516390: Multi-role communication & central database
 */

const IMS_INITIAL_DATA = {
  departments: [
    { id: 'dept-cse', code: 'CSE', name: 'Computer Science and Engineering', head: 'Dr. Aris Thorne' },
    { id: 'dept-aids', code: 'AIDS', name: 'Artificial Intelligence & Data Science', head: 'Dr. Elena Rostova' },
    { id: 'dept-ece', code: 'ECE', name: 'Electronics and Communication', head: 'Dr. Marcus Vance' },
    { id: 'dept-me', code: 'ME', name: 'Mechanical & Mechatronics Engineering', head: 'Dr. Sarah Lin' }
  ],

  majors: [
    { id: 'maj-cse-core', deptId: 'dept-cse', name: 'B.Tech Computer Science', degree: 'Undergraduate' },
    { id: 'maj-ai-ds', deptId: 'dept-aids', name: 'B.Tech AI & Data Analytics', degree: 'Undergraduate' },
    { id: 'maj-ece-iot', deptId: 'dept-ece', name: 'B.Tech Embedded Systems & IoT', degree: 'Undergraduate' },
    { id: 'maj-robotics', deptId: 'dept-me', name: 'B.Tech Robotics & Automation', degree: 'Undergraduate' }
  ],

  classes: [
    { id: 'cls-cse-2023', name: 'CSE-Alpha (Batch 2023-2027)', currentSemester: 6, counselorId: 't-101' },
    { id: 'cls-aids-2023', name: 'AIDS-Prime (Batch 2023-2027)', currentSemester: 6, counselorId: 't-102' },
    { id: 'cls-ece-2024', name: 'ECE-Omega (Batch 2024-2028)', currentSemester: 4, counselorId: 't-103' },
    { id: 'cls-cse-2022', name: 'CSE-Senior (Batch 2022-2026)', currentSemester: 8, counselorId: 't-101' }
  ],

  teachers: [
    { id: 't-101', name: 'Prof. Donald Knuth Jr.', department: 'CSE', email: 'd.knuth@ims.edu', title: 'Senior Professor' },
    { id: 't-102', name: 'Dr. Barbara Liskov', department: 'AIDS', email: 'b.liskov@ims.edu', title: 'Associate Professor' },
    { id: 't-103', name: 'Dr. Claude Shannon', department: 'ECE', email: 'c.shannon@ims.edu', title: 'Department Chair' },
    { id: 't-104', name: 'Dr. Ada Lovelace', department: 'CSE', email: 'a.lovelace@ims.edu', title: 'Assistant Professor' }
  ],

  courses: [
    { id: 'c-301', code: 'CS301', name: 'Distributed Systems & Cloud Computing', credits: 4, type: 'Core', dept: 'CSE', instructorId: 't-101' },
    { id: 'c-302', code: 'AI302', name: 'Deep Learning & Neural Architectures', credits: 4, type: 'Core', dept: 'AIDS', instructorId: 't-102' },
    { id: 'c-303', code: 'CS303', name: 'Database Internal Engine Design', credits: 3, type: 'Core', dept: 'CSE', instructorId: 't-104' },
    { id: 'c-304', code: 'EC204', name: 'Microcontrollers & Cyber-Physical Systems', credits: 4, type: 'Lab & Theory', dept: 'ECE', instructorId: 't-103' },
    { id: 'c-305', code: 'OE305', name: 'Technology Entrepreneurship & Ethics', credits: 2, type: 'Open Elective', dept: 'CSE', instructorId: 't-101' }
  ],

  students: [
    {
      id: 'stu-1001',
      rollNo: '2023CSE001',
      name: 'Devin Vance',
      email: 'devin.vance@student.ims.edu',
      deptId: 'dept-cse',
      majorId: 'maj-cse-core',
      classId: 'cls-cse-2023',
      admissionYear: 2023,
      currentSemester: 6,
      cgpa: 9.42,
      totalCreditsEarned: 132,
      academicStatus: 'Regular',
      promotionStatus: 'Promoted to Sem 6',
      transferHistory: 'Direct Admission via Merit Rank #142',
      scores: [
        { courseCode: 'CS301', courseName: 'Distributed Systems', internal: 28, assignments: 19, exam: 48, total: 95, grade: 'O', gpa: 10.0 },
        { courseCode: 'AI302', courseName: 'Deep Learning', internal: 27, assignments: 18, exam: 45, total: 90, grade: 'A+', gpa: 9.0 },
        { courseCode: 'CS303', courseName: 'Database Engines', internal: 29, assignments: 20, exam: 47, total: 96, grade: 'O', gpa: 10.0 }
      ],
      placement: {
        status: 'Placed',
        company: 'NVIDIA AI Labs',
        role: 'Systems Software Engineer Intern / FTE',
        ctc: '32.5 LPA',
        offerDate: '2026-03-15'
      },
      events: [
        { name: 'IEEE International Student Hackathon 2025', type: 'Hackathon', outcome: 'First Place Winner ($5,000)' },
        { name: 'Kaggle Grandmaster Summit', type: 'Workshop', outcome: 'Certificate of Excellence' }
      ],
      projectsAndPublications: [
        { title: 'High-Throughput Vector Indexing for Distributed RAG', type: 'Research Paper', venue: 'IEEE Trans. on Knowledge & Data Eng. (Under Review)', guide: 'Prof. Donald Knuth Jr.' },
        { title: 'Autonomous Drone Swarm Telemetry System', type: 'Capstone Project', venue: 'Annual Tech Expo 2025', guide: 'Dr. Claude Shannon' }
      ]
    },
    {
      id: 'stu-1002',
      rollNo: '2023AID014',
      name: 'Aria Chen',
      email: 'aria.chen@student.ims.edu',
      deptId: 'dept-aids',
      majorId: 'maj-ai-ds',
      classId: 'cls-aids-2023',
      admissionYear: 2023,
      currentSemester: 6,
      cgpa: 9.15,
      totalCreditsEarned: 128,
      academicStatus: 'Regular',
      promotionStatus: 'Promoted to Sem 6',
      transferHistory: 'Direct Admission via All India Exam Rank #310',
      scores: [
        { courseCode: 'AI302', courseName: 'Deep Learning', internal: 30, assignments: 20, exam: 48, total: 98, grade: 'O', gpa: 10.0 },
        { courseCode: 'CS301', courseName: 'Distributed Systems', internal: 26, assignments: 17, exam: 44, total: 87, grade: 'A', gpa: 8.5 }
      ],
      placement: {
        status: 'Placed',
        company: 'Google DeepMind Research',
        role: 'Research Associate Intern',
        ctc: '38.0 LPA',
        offerDate: '2026-02-10'
      },
      events: [
        { name: 'NeurIPS Workshop on Foundation Models', type: 'Conference', outcome: 'Poster Presentation' },
        { name: 'ACM ICPC Regional Semifinals', type: 'Coding Contest', outcome: 'Rank 12' }
      ],
      projectsAndPublications: [
        { title: 'Self-Supervised Contrastive Representation for Medical Imaging', type: 'Published Paper', venue: 'IEEE CVPR Workshop 2025', guide: 'Dr. Barbara Liskov' }
      ]
    },
    {
      id: 'stu-1003',
      rollNo: '2022CSE089',
      name: 'Kavita Patel',
      email: 'kavita.p@student.ims.edu',
      deptId: 'dept-cse',
      majorId: 'maj-cse-core',
      classId: 'cls-cse-2022',
      admissionYear: 2022,
      currentSemester: 8,
      cgpa: 8.78,
      totalCreditsEarned: 168,
      academicStatus: 'Graduating Senior',
      promotionStatus: 'Promoted to Final Sem 8',
      transferHistory: 'Internal Branch Transfer from ECE in Sem 3 (Merit CGPA 9.2)',
      scores: [
        { courseCode: 'CS301', courseName: 'Distributed Systems', internal: 25, assignments: 18, exam: 42, total: 85, grade: 'A', gpa: 8.5 },
        { courseCode: 'OE305', courseName: 'Tech Entrepreneurship', internal: 29, assignments: 19, exam: 46, total: 94, grade: 'O', gpa: 10.0 }
      ],
      placement: {
        status: 'Placed',
        company: 'Microsoft Azure Core',
        role: 'Software Development Engineer 1',
        ctc: '28.0 LPA',
        offerDate: '2025-11-20'
      },
      events: [
        { name: 'Microsoft Imagine Cup National Finals', type: 'Competition', outcome: '2nd Runner Up' }
      ],
      projectsAndPublications: [
        { title: 'Decentralized Identity Verification for University Credentials', type: 'Capstone Project', venue: 'IMS Campus Deployment', guide: 'Dr. Ada Lovelace' }
      ]
    },
    {
      id: 'stu-1004',
      rollNo: '2024ECE045',
      name: 'Rohan Deshmukh',
      email: 'rohan.d@student.ims.edu',
      deptId: 'dept-ece',
      majorId: 'maj-ece-iot',
      classId: 'cls-ece-2024',
      admissionYear: 2024,
      currentSemester: 4,
      cgpa: 7.85,
      totalCreditsEarned: 84,
      academicStatus: 'Regular',
      promotionStatus: 'Promoted to Sem 4',
      transferHistory: 'Lateral Entry Admission',
      scores: [
        { courseCode: 'EC204', courseName: 'Microcontrollers & CPS', internal: 24, assignments: 16, exam: 39, total: 79, grade: 'B+', gpa: 7.5 }
      ],
      placement: {
        status: 'Eligible',
        company: 'Texas Instruments',
        role: 'Hardware Firmware Engineering Trainee',
        ctc: 'Pending Interview Round 2',
        offerDate: '—'
      },
      events: [
        { name: 'National Embedded Systems Expo', type: 'Exhibition', outcome: 'Best Hardware Prototype' }
      ],
      projectsAndPublications: [
        { title: 'Sub-gigahertz Mesh Network for Campus Emergency Beaconing', type: 'Mini Project', venue: 'Department Tech Day', guide: 'Dr. Claude Shannon' }
      ]
    },
    {
      id: 'stu-1005',
      rollNo: '2023CSE052',
      name: 'Sophia Martinez',
      email: 's.martinez@student.ims.edu',
      deptId: 'dept-cse',
      majorId: 'maj-cse-core',
      classId: 'cls-cse-2023',
      admissionYear: 2023,
      currentSemester: 6,
      cgpa: 8.92,
      totalCreditsEarned: 126,
      academicStatus: 'Regular',
      promotionStatus: 'Promoted to Sem 6',
      transferHistory: 'State Counseling Direct Admission',
      scores: [
        { courseCode: 'CS301', courseName: 'Distributed Systems', internal: 27, assignments: 18, exam: 45, total: 90, grade: 'A+', gpa: 9.0 },
        { courseCode: 'CS303', courseName: 'Database Engines', internal: 26, assignments: 17, exam: 43, total: 86, grade: 'A', gpa: 8.5 }
      ],
      placement: {
        status: 'Interviewing',
        company: 'Amazon AWS',
        role: 'Cloud Support / SDE Intern',
        ctc: 'Expected 24 LPA',
        offerDate: '—'
      },
      events: [
        { name: 'AWS Cloud Practitioner Bootcamp', type: 'Certification', outcome: 'Certified AWS Solutions Architect' }
      ],
      projectsAndPublications: [
        { title: 'Multi-Tenant Serverless Orchestration for Higher Education SIS', type: 'Research Paper', venue: 'IEEE CloudNet 2025', guide: 'Prof. Donald Knuth Jr.' }
      ]
    }
  ],

  announcements: [
    {
      id: 'ann-1',
      title: 'Spring 2026 Comprehensive Semester Grade Publication',
      author: 'Office of Controller of Examinations',
      date: '2026-04-10',
      priority: 'High',
      content: 'Grades for all B.Tech and M.Tech core and elective modules are now finalized in the Central Database layer. Students can view transcripts and review score breakdowns.'
    },
    {
      id: 'ann-2',
      title: 'Campus Recruitment Drive - Phase 2 Registration Open',
      author: 'Placement & Training Directorate',
      date: '2026-04-15',
      priority: 'Important',
      content: 'Eligible students with CGPA >= 7.5 and no active backlogs are invited to register for upcoming placement drives by Microsoft, NVIDIA, and Cisco.'
    },
    {
      id: 'ann-3',
      title: 'Call for Papers: IEEE Student Technical Symposium',
      author: 'Dean of Research & Sponsored Projects',
      date: '2026-04-18',
      priority: 'Normal',
      content: 'Submissions are invited for student capstone and research papers. Selected works will receive institutional publication funding.'
    }
  ]
};
