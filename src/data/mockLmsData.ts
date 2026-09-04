import type {
  Quiz,
  QuizAttempt,
  Assignment,
  AssignmentSubmission,
  Announcement,
  CalendarEvent,
  Notification,
  FacilitatorAssignment,
  Enrollment,
  Transaction,
  Certificate,
  CorporateLead,
  ProgrammeApplication,
} from "../lib/types";

// ─── Mock Enrollments (for demo learner) ─────────────────────

export const mockEnrollments: Enrollment[] = [
  {
    id: "enr-demo-001",
    courseId: "digital-transformation-officer",
    learnerName: "Adewale Okonkwo",
    learnerEmail: "learner@lani.academy",
    progress: 68,
    completedLessons: [
      "What is Digital Transformation?",
      "Key Drivers and Trends",
      "AI and Machine Learning Essentials",
      "Cloud Computing Foundations",
      "Design Thinking for Innovation",
    ],
    paymentStatus: "Successful",
    enrolledAt: "2026-05-12",
  },
  {
    id: "enr-demo-002",
    courseId: "esg-sustainability-practitioner",
    learnerName: "Adewale Okonkwo",
    learnerEmail: "learner@lani.academy",
    progress: 35,
    completedLessons: [
      "Introduction to ESG Frameworks",
      "Environmental Metrics and Reporting",
    ],
    paymentStatus: "Successful",
    enrolledAt: "2026-05-28",
  },
  {
    id: "enr-demo-003",
    courseId: "tax-compliance-masterclass",
    learnerName: "Adewale Okonkwo",
    learnerEmail: "learner@lani.academy",
    progress: 100,
    completedLessons: [
      "Nigerian Tax Law Overview",
      "Corporate Tax Compliance",
      "VAT and Withholding Tax",
      "FIRS Audit Preparation",
      "Transfer Pricing Basics",
      "Tax Planning Strategies",
    ],
    paymentStatus: "Successful",
    enrolledAt: "2026-04-01",
  },
  {
    id: "enr-demo-004",
    courseId: "agribusiness-enterprise",
    learnerName: "Adewale Okonkwo",
    learnerEmail: "learner@lani.academy",
    progress: 12,
    completedLessons: ["Introduction to Agribusiness Value Chains"],
    paymentStatus: "Successful",
    enrolledAt: "2026-06-10",
  },
];

// ─── Mock Transactions ───────────────────────────────────────

export const mockTransactions: Transaction[] = [
  {
    id: "txn-demo-001",
    courseId: "digital-transformation-officer",
    learnerEmail: "learner@lani.academy",
    amount: 185000,
    gateway: "Paystack",
    status: "Successful",
    receiptNumber: "LANI-REC-482910",
    createdAt: "2026-05-12",
  },
  {
    id: "txn-demo-002",
    courseId: "esg-sustainability-practitioner",
    learnerEmail: "learner@lani.academy",
    amount: 145000,
    gateway: "Flutterwave",
    status: "Successful",
    receiptNumber: "LANI-REC-517823",
    createdAt: "2026-05-28",
  },
  {
    id: "txn-demo-003",
    courseId: "tax-compliance-masterclass",
    learnerEmail: "learner@lani.academy",
    amount: 120000,
    gateway: "Bank Transfer",
    status: "Manually Confirmed",
    receiptNumber: "LANI-REC-339174",
    createdAt: "2026-04-01",
  },
  {
    id: "txn-demo-004",
    courseId: "agribusiness-enterprise",
    learnerEmail: "learner@lani.academy",
    amount: 95000,
    gateway: "Paystack",
    status: "Successful",
    receiptNumber: "LANI-REC-601455",
    createdAt: "2026-06-10",
  },
  {
    id: "txn-demo-005",
    courseId: "digital-transformation-officer",
    learnerEmail: "funmi.adeyemi@apex.com",
    amount: 185000,
    gateway: "Paystack",
    status: "Successful",
    receiptNumber: "LANI-REC-710293",
    createdAt: "2026-05-15",
  },
  {
    id: "txn-demo-006",
    courseId: "esg-sustainability-practitioner",
    learnerEmail: "chidi.nwosu@frontier.ng",
    amount: 145000,
    gateway: "Flutterwave",
    status: "Pending",
    receiptNumber: "LANI-REC-820164",
    createdAt: "2026-06-02",
  },
];

// ─── Mock Certificates ───────────────────────────────────────

export const mockCertificates: Certificate[] = [
  {
    id: "LANI-CERT-4821",
    learnerName: "Adewale Okonkwo",
    learnerEmail: "learner@lani.academy",
    courseId: "tax-compliance-masterclass",
    courseTitle: "Tax Compliance Masterclass",
    issueDate: "2026-05-15",
    status: "Issued",
  },
];

// ─── Mock Corporate Leads ────────────────────────────────────

export const mockLeads: CorporateLead[] = [
  {
    id: "lead-demo-001",
    organisation: "Northern Assurance Corp",
    sector: "Financial Services",
    contactName: "Hauwa Ibrahim",
    email: "h.ibrahim@northernassurance.com",
    phone: "+234 803 445 7890",
    thematicArea: "Finance, Risk & Compliance",
    participants: 35,
    deliveryMode: "Hybrid",
    preferredDate: "2026-07-15",
    need: "Annual compliance refresher training for internal audit and risk teams across 3 regional offices.",
    stage: "Proposal Sent",
    createdAt: "2026-06-01",
  },
  {
    id: "lead-demo-002",
    organisation: "Apex Bank Plc",
    sector: "Financial Services",
    contactName: "Segun Ademola",
    email: "s.ademola@apexbank.com",
    phone: "+234 701 223 4567",
    thematicArea: "ICT & Digital Transformation",
    participants: 50,
    deliveryMode: "In-plant",
    preferredDate: "2026-08-01",
    need: "Digital transformation capability programme for branch managers and product teams.",
    stage: "New",
    createdAt: "2026-06-14",
  },
  {
    id: "lead-demo-003",
    organisation: "Frontier Minerals",
    sector: "Energy & Minerals",
    contactName: "Dr. Elizabeth Cole",
    email: "e.cole@frontierminerals.com",
    phone: "+234 802 998 1234",
    thematicArea: "Sustainability & ESG",
    participants: 20,
    deliveryMode: "Virtual",
    preferredDate: "2026-07-22",
    need: "ESG compliance and carbon reporting training for sustainability and operations teams.",
    stage: "Contacted",
    createdAt: "2026-06-08",
  },
];

// ─── Mock Programme Applications ─────────────────────────────

export const mockApplications: ProgrammeApplication[] = [
  {
    id: "app-demo-001",
    programmeType: "Graduate Employability Bootcamp",
    applicantName: "Amara Nwachukwu",
    email: "amara.nwachukwu@gmail.com",
    phone: "+234 812 345 6789",
    location: "Lagos, Nigeria",
    organisation: "Fresh Graduate",
    motivation:
      "I recently graduated from UNILAG with a degree in Economics and I am eager to develop practical skills in data analysis and project management that will make me competitive in the job market.",
    status: "Under Review",
    score: 78,
    createdAt: "2026-06-05",
  },
  {
    id: "app-demo-002",
    programmeType: "Agribusiness Incubation Programme",
    applicantName: "Musa Abdullahi",
    email: "musa.abdullahi@outlook.com",
    phone: "+234 803 456 7890",
    location: "Kano, Nigeria",
    organisation: "GreenFields Agro Ltd",
    motivation:
      "Our startup focuses on poultry value chain optimisation. We need structured mentorship and market access support to scale from 5,000 to 50,000 birds capacity.",
    status: "Shortlisted",
    score: 85,
    createdAt: "2026-06-02",
  },
  {
    id: "app-demo-003",
    programmeType: "Corporate Nomination – Leadership Academy",
    applicantName: "Funmilayo Adeyemi",
    email: "funmi.adeyemi@apex.com",
    phone: "+234 701 567 8901",
    location: "Abuja, Nigeria",
    organisation: "Apex Bank Plc",
    motivation:
      "Nominated by VP of People Operations for the executive leadership development track. Currently heading Digital Products division with 45 direct reports.",
    status: "Accepted",
    score: 92,
    createdAt: "2026-05-20",
  },
];

// ─── Facilitator Assignments ─────────────────────────────────

export const mockFacilitatorAssignments: FacilitatorAssignment[] = [
  {
    facilitatorEmail: "facilitator@lani.academy",
    facilitatorName: "Dr. Chinedu Okoro",
    courseId: "digital-transformation-officer",
    courseTitle: "Digital Transformation Officer Pathway",
    assignedAt: "2026-04-15",
  },
  {
    facilitatorEmail: "facilitator@lani.academy",
    facilitatorName: "Dr. Chinedu Okoro",
    courseId: "esg-sustainability-practitioner",
    courseTitle: "ESG & Sustainability Practitioner",
    assignedAt: "2026-05-01",
  },
  {
    facilitatorEmail: "facilitator@lani.academy",
    facilitatorName: "Dr. Chinedu Okoro",
    courseId: "tax-compliance-masterclass",
    courseTitle: "Tax Compliance Masterclass",
    assignedAt: "2026-03-10",
  },
];

// ─── All Enrolled Learners (for admin/facilitator views) ─────

export const mockAllEnrollments: Enrollment[] = [
  ...mockEnrollments,
  {
    id: "enr-demo-005",
    courseId: "digital-transformation-officer",
    learnerName: "Funmilayo Adeyemi",
    learnerEmail: "funmi.adeyemi@apex.com",
    progress: 45,
    completedLessons: [
      "What is Digital Transformation?",
      "Key Drivers and Trends",
      "AI and Machine Learning Essentials",
    ],
    paymentStatus: "Successful",
    enrolledAt: "2026-05-15",
  },
  {
    id: "enr-demo-006",
    courseId: "digital-transformation-officer",
    learnerName: "Chidi Nwosu",
    learnerEmail: "chidi.nwosu@frontier.ng",
    progress: 22,
    completedLessons: ["What is Digital Transformation?"],
    paymentStatus: "Successful",
    enrolledAt: "2026-05-20",
  },
  {
    id: "enr-demo-007",
    courseId: "esg-sustainability-practitioner",
    learnerName: "Hauwa Ibrahim",
    learnerEmail: "h.ibrahim@northernassurance.com",
    progress: 55,
    completedLessons: [
      "Introduction to ESG Frameworks",
      "Environmental Metrics and Reporting",
      "Social Impact Assessment",
    ],
    paymentStatus: "Successful",
    enrolledAt: "2026-05-30",
  },
  {
    id: "enr-demo-008",
    courseId: "esg-sustainability-practitioner",
    learnerName: "Chidi Nwosu",
    learnerEmail: "chidi.nwosu@frontier.ng",
    progress: 10,
    completedLessons: [],
    paymentStatus: "Pending",
    enrolledAt: "2026-06-02",
  },
  {
    id: "enr-demo-009",
    courseId: "tax-compliance-masterclass",
    learnerName: "Ngozi Eze",
    learnerEmail: "ngozi.eze@pwc.com",
    progress: 82,
    completedLessons: [
      "Nigerian Tax Law Overview",
      "Corporate Tax Compliance",
      "VAT and Withholding Tax",
      "FIRS Audit Preparation",
      "Transfer Pricing Basics",
    ],
    paymentStatus: "Successful",
    enrolledAt: "2026-04-05",
  },
];

// ─── Mock Quizzes ────────────────────────────────────────────

export const mockQuizzes: Quiz[] = [
  {
    id: "quiz-001",
    courseId: "digital-transformation-officer",
    courseTitle: "Digital Transformation Officer Pathway",
    title: "Module 1 Assessment: Digital Fundamentals",
    description: "Test your understanding of digital transformation concepts, AI, cloud computing and design thinking.",
    questions: [
      {
        id: "q1",
        question: "Which of the following is NOT a key driver of digital transformation?",
        options: ["Customer expectations", "Data analytics", "Manual bookkeeping", "Cloud computing"],
        correctIndex: 2,
      },
      {
        id: "q2",
        question: "What does 'AI' stand for in the context of digital transformation?",
        options: ["Automated Integration", "Artificial Intelligence", "Advanced Infrastructure", "Applied Innovation"],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "Which cloud deployment model offers resources shared across multiple organisations?",
        options: ["Private cloud", "Public cloud", "Hybrid cloud", "Community cloud"],
        correctIndex: 1,
      },
      {
        id: "q4",
        question: "Design Thinking primarily focuses on:",
        options: ["Cost reduction", "Human-centered problem solving", "Regulatory compliance", "Data warehousing"],
        correctIndex: 1,
      },
      {
        id: "q5",
        question: "Which of these is a key success metric for digital transformation initiatives?",
        options: ["Number of employees", "Customer adoption rate", "Office square footage", "Annual leave days"],
        correctIndex: 1,
      },
    ],
    passingScore: 60,
    timeLimitMinutes: 15,
    dueDate: "2026-07-01",
    dueTime: "23:59",
  },
  {
    id: "quiz-002",
    courseId: "esg-sustainability-practitioner",
    courseTitle: "ESG & Sustainability Practitioner",
    title: "ESG Frameworks & Reporting Assessment",
    description: "Evaluate your knowledge of ESG frameworks, environmental metrics and sustainability reporting standards.",
    questions: [
      {
        id: "q1",
        question: "What does ESG stand for?",
        options: [
          "Economic, Social, Governance",
          "Environmental, Social, Governance",
          "Environmental, Strategic, Growth",
          "Enterprise, Sustainability, Governance",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "Which framework is commonly used for sustainability reporting?",
        options: ["IFRS", "GRI Standards", "GAAP", "Basel III"],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "Scope 2 emissions refer to:",
        options: [
          "Direct emissions from company operations",
          "Indirect emissions from purchased energy",
          "Emissions from the supply chain",
          "Emissions from employee commuting",
        ],
        correctIndex: 1,
      },
    ],
    passingScore: 70,
    timeLimitMinutes: 10,
    dueDate: "2026-07-10",
    dueTime: "17:00",
  },
  {
    id: "quiz-003",
    courseId: "tax-compliance-masterclass",
    courseTitle: "Tax Compliance Masterclass",
    title: "Nigerian Tax Law Final Examination",
    description: "Comprehensive assessment covering corporate tax, VAT, withholding tax, and FIRS audit procedures.",
    questions: [
      {
        id: "q1",
        question: "The Companies Income Tax Act (CITA) applies to:",
        options: [
          "Only foreign companies",
          "All companies registered in Nigeria",
          "Only listed companies",
          "Only SMEs",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "Standard VAT rate in Nigeria is currently:",
        options: ["5%", "7.5%", "10%", "15%"],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "Which body administers federal taxes in Nigeria?",
        options: ["CBN", "SEC", "FIRS", "EFCC"],
        correctIndex: 2,
      },
      {
        id: "q4",
        question: "Transfer pricing rules primarily address:",
        options: [
          "Employee salaries",
          "Transactions between related parties",
          "Import duties",
          "Property taxes",
        ],
        correctIndex: 1,
      },
    ],
    passingScore: 75,
    timeLimitMinutes: 20,
    dueDate: "2026-05-30",
    dueTime: "23:59",
  },
];

// ─── Mock Quiz Attempts ──────────────────────────────────────

export const mockQuizAttempts: QuizAttempt[] = [
  {
    id: "attempt-001",
    quizId: "quiz-003",
    learnerEmail: "learner@lani.academy",
    learnerName: "Adewale Okonkwo",
    answers: [1, 1, 2, 1],
    score: 100,
    passed: true,
    submittedAt: "2026-05-14",
  },
];

// ─── Mock Assignments ────────────────────────────────────────

export const mockAssignments: Assignment[] = [
  {
    id: "asgn-001",
    courseId: "digital-transformation-officer",
    courseTitle: "Digital Transformation Officer Pathway",
    title: "Digital Strategy Case Study Analysis",
    description:
      "Analyse the provided case study of a Nigerian bank's digital transformation journey. Identify key success factors, challenges, and propose a 12-month roadmap for a similar institution.",
    dueDate: "2026-07-15",
    dueTime: "23:59",
    maxScore: 100,
  },
  {
    id: "asgn-002",
    courseId: "esg-sustainability-practitioner",
    courseTitle: "ESG & Sustainability Practitioner",
    title: "ESG Impact Report Draft",
    description:
      "Prepare a draft ESG impact report for a hypothetical mining company operating in West Africa. Include environmental metrics, social impact indicators, and governance structure.",
    dueDate: "2026-07-20",
    dueTime: "23:59",
    maxScore: 100,
  },
];

// ─── Mock Assignment Submissions ─────────────────────────────

export const mockSubmissions: AssignmentSubmission[] = [
  {
    id: "sub-001",
    assignmentId: "asgn-001",
    courseId: "digital-transformation-officer",
    learnerEmail: "funmi.adeyemi@apex.com",
    learnerName: "Funmilayo Adeyemi",
    submittedAt: "2026-06-15",
    content: "Attached: Digital_Strategy_Analysis_Apex_Bank.pdf — 12-page case study analysis with SWOT matrix, stakeholder mapping, and phased implementation roadmap.",
    score: null,
    feedback: "",
    status: "Submitted",
  },
  {
    id: "sub-002",
    assignmentId: "asgn-001",
    courseId: "digital-transformation-officer",
    learnerEmail: "learner@lani.academy",
    learnerName: "Adewale Okonkwo",
    submittedAt: "2026-06-12",
    content: "Attached: DT_CaseStudy_Adewale.pdf — Comprehensive analysis of GTBank digital transformation with comparative framework for regional banks.",
    score: 82,
    feedback: "Excellent analysis of strategic drivers. Strong SWOT application. Consider deeper exploration of change management resistance factors in your roadmap.",
    status: "Graded",
  },
  {
    id: "sub-003",
    assignmentId: "asgn-002",
    courseId: "esg-sustainability-practitioner",
    learnerEmail: "h.ibrahim@northernassurance.com",
    learnerName: "Hauwa Ibrahim",
    submittedAt: "2026-06-16",
    content: "Attached: ESG_Report_Draft_NorthernAssurance.pdf — Draft report covering Scope 1-3 emissions, community impact metrics, and board diversity indicators.",
    score: null,
    feedback: "",
    status: "Submitted",
  },
];

// ─── Mock Announcements ──────────────────────────────────────

export const mockAnnouncements: Announcement[] = [
  {
    id: "ann-001",
    courseId: "digital-transformation-officer",
    courseTitle: "Digital Transformation Officer Pathway",
    authorName: "Dr. Chinedu Okoro",
    authorRole: "facilitator",
    title: "Live Workshop Session — Saturday 21st June",
    body: "Dear cohort, our next interactive workshop on 'Building a Digital Roadmap for Your Organisation' is scheduled for Saturday 21st June at 10:00 AM WAT. Please join via the Microsoft Teams link in your dashboard. Come prepared with your draft roadmaps.",
    createdAt: "2026-06-16",
  },
  {
    id: "ann-002",
    courseId: "digital-transformation-officer",
    courseTitle: "Digital Transformation Officer Pathway",
    authorName: "LANI Academy Admin",
    authorRole: "admin",
    title: "Module 2 Materials Now Available",
    body: "Module 2 learning materials including video lectures, case study PDFs, and practical templates have been uploaded to your course player. Please begin working through them before the assessment deadline on 1st July.",
    createdAt: "2026-06-14",
  },
  {
    id: "ann-003",
    courseId: "esg-sustainability-practitioner",
    courseTitle: "ESG & Sustainability Practitioner",
    authorName: "Dr. Chinedu Okoro",
    authorRole: "facilitator",
    title: "Guest Speaker: Carbon Markets Expert",
    body: "We have arranged a special guest session with Dr. Amina Bello, a leading carbon markets expert from the African Development Bank. The session will cover practical carbon credit strategies for West African enterprises. Date: Thursday 26th June, 2:00 PM WAT.",
    createdAt: "2026-06-15",
  },
  {
    id: "ann-004",
    courseId: "tax-compliance-masterclass",
    courseTitle: "Tax Compliance Masterclass",
    authorName: "Dr. Chinedu Okoro",
    authorRole: "facilitator",
    title: "Congratulations — Course Completed!",
    body: "Congratulations to all learners who have completed the Tax Compliance Masterclass! Your certificates are now available for download in your Learner Dashboard. We encourage you to explore our advanced FIRS Audit Specialist programme as your next step.",
    createdAt: "2026-05-16",
  },
];

// ─── Mock Calendar Events ────────────────────────────────────

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: "evt-001",
    courseId: "digital-transformation-officer",
    courseTitle: "Digital Transformation Officer Pathway",
    title: "Live Workshop: Digital Roadmap Building",
    type: "Live Class",
    date: "2026-06-21",
    time: "10:00 AM WAT",
    venue: "Microsoft Teams",
    meetingLink: "https://teams.microsoft.com/meet/lani-dt-workshop",
  },
  {
    id: "evt-002",
    courseId: "digital-transformation-officer",
    courseTitle: "Digital Transformation Officer Pathway",
    title: "Module 1 Quiz Deadline",
    type: "Assessment Deadline",
    date: "2026-07-01",
    time: "11:59 PM WAT",
    venue: "Online (LMS Portal)",
  },
  {
    id: "evt-003",
    courseId: "esg-sustainability-practitioner",
    courseTitle: "ESG & Sustainability Practitioner",
    title: "Guest Speaker: Carbon Markets with Dr. Bello",
    type: "Webinar",
    date: "2026-06-26",
    time: "2:00 PM WAT",
    venue: "Zoom",
    meetingLink: "https://zoom.us/j/lani-esg-guest",
  },
  {
    id: "evt-004",
    courseId: "digital-transformation-officer",
    courseTitle: "Digital Transformation Officer Pathway",
    title: "Case Study Assignment Due",
    type: "Assessment Deadline",
    date: "2026-07-15",
    time: "11:59 PM WAT",
    venue: "Online (LMS Portal)",
  },
  {
    id: "evt-005",
    courseId: "esg-sustainability-practitioner",
    courseTitle: "ESG & Sustainability Practitioner",
    title: "ESG Report Draft Submission",
    type: "Assessment Deadline",
    date: "2026-07-20",
    time: "11:59 PM WAT",
    venue: "Online (LMS Portal)",
  },
  {
    id: "evt-006",
    courseId: "agribusiness-enterprise",
    courseTitle: "Agribusiness Enterprise Development",
    title: "Field Visit Orientation",
    type: "Orientation",
    date: "2026-06-25",
    time: "9:00 AM WAT",
    venue: "LANI Academy, 53b Adekunle Fajuyi Way, Ikeja GRA, Lagos",
  },
];

// ─── Mock Notifications ──────────────────────────────────────

export const mockNotifications: Notification[] = [
  {
    id: "notif-001",
    type: "announcement",
    title: "New Announcement in Digital Transformation",
    body: "Dr. Chinedu Okoro posted: Live Workshop Session — Saturday 21st June",
    read: false,
    createdAt: "2026-06-16T14:30:00",
  },
  {
    id: "notif-002",
    type: "assessment",
    title: "Assignment Graded",
    body: "Your Digital Strategy Case Study has been graded. Score: 82/100",
    read: false,
    createdAt: "2026-06-15T10:00:00",
  },
  {
    id: "notif-003",
    type: "certificate",
    title: "Certificate Ready for Download",
    body: "Your Tax Compliance Masterclass certificate (LANI-CERT-4821) is ready.",
    read: true,
    createdAt: "2026-05-15T16:00:00",
  },
  {
    id: "notif-004",
    type: "enrollment",
    title: "Enrolment Confirmed",
    body: "You have been enrolled in Agribusiness Enterprise Development.",
    read: true,
    createdAt: "2026-06-10T09:00:00",
  },
  {
    id: "notif-005",
    type: "reminder",
    title: "Upcoming: ESG Guest Speaker Session",
    body: "Don't miss the carbon markets session with Dr. Amina Bello on 26th June.",
    read: false,
    createdAt: "2026-06-17T08:00:00",
  },
  {
    id: "notif-006",
    type: "payment",
    title: "Payment Confirmed",
    body: "Payment of ₦95,000 for Agribusiness Enterprise confirmed via Paystack.",
    read: true,
    createdAt: "2026-06-10T09:05:00",
  },
];
