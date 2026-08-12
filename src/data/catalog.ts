import type {
  Certificate,
  CmsAsset,
  CorporateLead,
  Course,
  DeliveryMode,
  Enrollment,
  ProgrammeApplication,
  Sme,
  ThematicArea,
  Transaction,
} from "../lib/types";

export const thematicAreas: ThematicArea[] = [
  {
    id: "management-leadership",
    name: "Management and Leadership",
    summary: "Executive readiness, performance leadership, governance, and practical management capability.",
    audience: "Managers, executives, supervisors, and public/private sector leaders",
    accent: "bg-lani-blue",
  },
  {
    id: "human-capital",
    name: "Human Capital Development",
    summary: "Workforce transformation, HR capability, culture, productivity, and team development.",
    audience: "HR teams, L&D leaders, people managers, and corporate academies",
    accent: "bg-lani-green",
  },
  {
    id: "finance-tax-compliance",
    name: "Finance, Tax and Compliance",
    summary: "Professional certification preparation, tax practice, risk, audit, and compliance skills.",
    audience: "Finance professionals, accountants, tax teams, and compliance officers",
    accent: "bg-lani-gold",
  },
  {
    id: "ict-digital",
    name: "ICT and Digital Transformation",
    summary: "Digital operations, data skills, automation, cloud productivity, and technology adoption.",
    audience: "Digital officers, operations teams, analysts, and technology leaders",
    accent: "bg-cyan-600",
  },
  {
    id: "fintech-innovation",
    name: "Fintech and Innovation",
    summary: "Fintech products, digital finance, risk controls, innovation strategy, and market readiness.",
    audience: "Fintech teams, banks, founders, product managers, and regulators",
    accent: "bg-indigo-600",
  },
  {
    id: "agriculture-agribusiness",
    name: "Agriculture and Agribusiness",
    summary: "Agribusiness enterprise, value chains, cooperative development, and market access.",
    audience: "Agribusinesses, SMEs, cooperatives, and development programmes",
    accent: "bg-emerald-600",
  },
  {
    id: "development-esg",
    name: "Development Sector and ESG",
    summary: "Programme design, monitoring and evaluation, sustainability, donor reporting, and social impact.",
    audience: "NGOs, development partners, ESG teams, and public sector programmes",
    accent: "bg-teal-700",
  },
  {
    id: "retail-sales",
    name: "Retail, Sales and Merchandising",
    summary: "Customer experience, sales execution, merchandising standards, and field productivity.",
    audience: "Retail operators, field teams, SMEs, and commercial managers",
    accent: "bg-lani-coral",
  },
];

export const deliveryModes: DeliveryMode[] = [
  "Self-paced",
  "Instructor-led",
  "Virtual",
  "Physical",
  "Hybrid",
  "In-plant",
];

const baseCourses: Course[] = [
  {
    id: "digital-transformation-officer",
    title: "Digital Transformation Officer Pathway",
    code: "LANI-DTO-401",
    category: "Professional Pathway",
    thematicArea: "ICT and Digital Transformation",
    type: "Open Programme",
    level: "Advanced",
    deliveryModes: ["Hybrid", "Virtual"],
    duration: "6 weeks",
    price: 185000,
    certification: "LANI Academy Digital Transformation Certificate",
    status: "Open",
    startDate: "2026-07-20",
    endDate: "2026-08-28",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    shortDescription:
      "Build practical capability to diagnose, design, and deploy digital transformation initiatives.",
    fullDescription:
      "A blended pathway for professionals responsible for technology adoption, process improvement, automation, and digital workforce readiness.",
    outcomes: [
      "Map digital maturity and operational bottlenecks",
      "Design transformation roadmaps tied to measurable business value",
      "Use data, automation, and cloud tools to improve delivery",
      "Build stakeholder adoption and governance plans",
    ],
    audience: ["Digital officers", "Operations managers", "Business analysts", "Transformation leads"],
    modules: [
      {
        title: "Digital maturity and strategy",
        lessons: ["Transformation drivers", "Readiness diagnostics", "Roadmap design"],
      },
      {
        title: "Data, automation, and delivery",
        lessons: ["Workflow automation", "Data-led decisions", "Adoption dashboards"],
      },
      {
        title: "Governance and change",
        lessons: ["Risk controls", "Stakeholder mapping", "Sustainability planning"],
      },
    ],
    facilitator: "LANI Digital Faculty",
    materials: ["Video lectures", "Transformation canvas", "Readiness checklist", "Case workbook"],
    assessment: "Capstone transformation plan and online quiz",
    seats: 40,
    enrolled: 27,
    featured: true,
  },
  {
    id: "corporate-leadership-workforce",
    title: "Corporate Leadership and Workforce Performance",
    code: "LANI-HCD-210",
    category: "Leadership Programme",
    thematicArea: "Human Capital Development",
    type: "Open Programme",
    level: "Executive",
    deliveryModes: ["Physical", "Hybrid", "In-plant"],
    duration: "3 days",
    price: 240000,
    certification: "Certificate of Executive Participation",
    status: "Open",
    startDate: "2026-07-08",
    endDate: "2026-07-10",
    image:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    shortDescription:
      "Strengthen leadership readiness, people management, and performance accountability.",
    fullDescription:
      "A practical leadership clinic for managers who need to align teams, sustain execution, and improve workplace productivity.",
    outcomes: [
      "Use performance conversations to improve accountability",
      "Design team operating rhythms and review routines",
      "Apply coaching methods for talent development",
      "Resolve team conflict with structured leadership tools",
    ],
    audience: ["Managers", "Supervisors", "HR business partners", "Executive teams"],
    modules: [
      {
        title: "Leadership operating system",
        lessons: ["Role clarity", "Execution routines", "Decision ownership"],
      },
      {
        title: "People and performance",
        lessons: ["Coaching", "Feedback loops", "Performance recovery plans"],
      },
      {
        title: "Culture and productivity",
        lessons: ["Engagement signals", "Team norms", "Sustained improvement"],
      },
    ],
    facilitator: "LANI Human Capital Faculty",
    materials: ["Leadership workbook", "Team diagnostic", "Feedback scripts"],
    assessment: "Participation, case exercise, and action plan",
    seats: 30,
    enrolled: 19,
    featured: true,
  },
  {
    id: "tax-compliance-professional",
    title: "Tax and Compliance Professional Route",
    code: "LANI-TAX-305",
    category: "Certification Preparation",
    thematicArea: "Finance, Tax and Compliance",
    type: "Certification Prep",
    level: "Intermediate",
    deliveryModes: ["Virtual", "Physical"],
    duration: "8 weeks",
    price: 160000,
    certification: "CITN, ICAN, ATSWA Preparatory Support",
    status: "Open",
    startDate: "2026-08-03",
    endDate: "2026-09-25",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
    shortDescription:
      "Prepare for tax, accounting, and compliance examinations with guided tuition and practice clinics.",
    fullDescription:
      "A structured certification preparation programme for professionals seeking stronger technical grounding in tax, audit, compliance, and financial reporting.",
    outcomes: [
      "Strengthen core tax and accounting concepts",
      "Practise exam-style questions and case scenarios",
      "Understand compliance controls and documentation",
      "Create a personal revision plan with tutor feedback",
    ],
    audience: ["Accountants", "Tax officers", "Finance associates", "Certification candidates"],
    modules: [
      {
        title: "Technical foundations",
        lessons: ["Tax principles", "Financial reporting", "Audit basics"],
      },
      {
        title: "Exam clinics",
        lessons: ["Past questions", "Time management", "Common pitfalls"],
      },
      {
        title: "Compliance practice",
        lessons: ["Controls", "Documentation", "Professional ethics"],
      },
    ],
    facilitator: "LANI Finance Faculty",
    materials: ["Study notes", "Question bank", "Revision planner"],
    assessment: "Weekly quizzes and mock exam",
    seats: 55,
    enrolled: 34,
    featured: true,
  },
  {
    id: "esg-sustainability-practitioner",
    title: "ESG and Sustainability Practitioner Programme",
    code: "LANI-ESG-320",
    category: "Professional Programme",
    thematicArea: "Development Sector and ESG",
    type: "Open Programme",
    level: "Intermediate",
    deliveryModes: ["Self-paced", "Virtual"],
    duration: "4 weeks",
    price: 125000,
    certification: "LANI ESG Practitioner Certificate",
    status: "Coming Soon",
    startDate: "2026-09-07",
    endDate: "2026-10-02",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    shortDescription:
      "Translate ESG goals into practical programmes, reporting routines, and measurable sustainability actions.",
    fullDescription:
      "A hands-on programme for professionals working on ESG, sustainability reporting, donor-funded programmes, and social impact initiatives.",
    outcomes: [
      "Identify material ESG issues and stakeholder expectations",
      "Build sustainability metrics and reporting templates",
      "Connect ESG action plans to enterprise and community value",
      "Prepare evidence for internal and external reporting",
    ],
    audience: ["ESG officers", "Programme managers", "CSR teams", "Development practitioners"],
    modules: [
      {
        title: "ESG foundations",
        lessons: ["Materiality", "Stakeholders", "Risk and opportunity"],
      },
      {
        title: "Measurement and reporting",
        lessons: ["Indicators", "Evidence capture", "Reporting cadence"],
      },
      {
        title: "Implementation clinic",
        lessons: ["Action planning", "Governance", "Review routines"],
      },
    ],
    facilitator: "LANI Development Faculty",
    materials: ["ESG checklist", "Indicator library", "Reporting template"],
    assessment: "ESG implementation plan",
    seats: 45,
    enrolled: 12,
    featured: true,
  },
  {
    id: "agribusiness-enterprise-development",
    title: "Agribusiness Enterprise Development",
    code: "LANI-AGR-118",
    category: "Enterprise Programme",
    thematicArea: "Agriculture and Agribusiness",
    type: "Sponsored",
    level: "Foundation",
    deliveryModes: ["Physical", "Hybrid"],
    duration: "5 weeks",
    price: 0,
    certification: "Sponsored Completion Certificate",
    status: "Application Required",
    startDate: "2026-07-29",
    endDate: "2026-09-02",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    shortDescription:
      "Support agribusiness founders with enterprise structure, value chain readiness, and market access.",
    fullDescription:
      "A sponsored cohort programme for emerging agribusinesses, cooperatives, and enterprise support organisations.",
    outcomes: [
      "Map value-chain gaps and enterprise opportunities",
      "Improve records, pricing, and working capital discipline",
      "Prepare route-to-market and partnership plans",
      "Pitch a practical growth plan to reviewers",
    ],
    audience: ["Agribusiness founders", "Cooperatives", "Young entrepreneurs", "Extension teams"],
    modules: [
      {
        title: "Enterprise readiness",
        lessons: ["Business model", "Records", "Costing and pricing"],
      },
      {
        title: "Value chain and market access",
        lessons: ["Input systems", "Aggregation", "Buyer readiness"],
      },
      {
        title: "Pitch and growth plan",
        lessons: ["Financial story", "Partnership asks", "Presentation practice"],
      },
    ],
    facilitator: "LANI Agribusiness Faculty",
    materials: ["Business profile template", "Pricing sheet", "Pitch guide"],
    assessment: "Application screening and growth pitch",
    seats: 60,
    enrolled: 0,
    featured: true,
  },
  {
    id: "fintech-product-risk",
    title: "Fintech Product and Risk Fundamentals",
    code: "LANI-FIN-207",
    category: "Innovation Programme",
    thematicArea: "Fintech and Innovation",
    type: "Bootcamp",
    level: "Intermediate",
    deliveryModes: ["Virtual", "Hybrid"],
    duration: "2 weeks",
    price: 95000,
    certification: "Fintech Fundamentals Certificate",
    status: "Open",
    startDate: "2026-08-17",
    endDate: "2026-08-28",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
    shortDescription:
      "Understand digital finance products, customer journeys, controls, risk, and regulatory expectations.",
    fullDescription:
      "A compact bootcamp for product, operations, and compliance teams working inside fintech and digital finance environments.",
    outcomes: [
      "Map fintech product journeys and risk points",
      "Design onboarding, KYC, and control workflows",
      "Read product metrics and customer behaviour signals",
      "Balance innovation speed with compliance discipline",
    ],
    audience: ["Fintech founders", "Product managers", "Banking teams", "Compliance officers"],
    modules: [
      {
        title: "Digital finance products",
        lessons: ["Product models", "User journeys", "Unit economics"],
      },
      {
        title: "Risk and compliance",
        lessons: ["KYC", "Fraud controls", "Regulatory obligations"],
      },
      {
        title: "Growth and measurement",
        lessons: ["Activation", "Retention", "Risk-adjusted growth"],
      },
    ],
    facilitator: "LANI Fintech Faculty",
    materials: ["Product canvas", "Risk checklist", "Metrics board"],
    assessment: "Product risk review and quiz",
    seats: 50,
    enrolled: 21,
    featured: true,
  },
  {
    id: "development-me-proposal",
    title: "Development Sector Proposal and M&E Clinic",
    code: "LANI-DEV-226",
    category: "Development Programme",
    thematicArea: "Development Sector and ESG",
    type: "Open Programme",
    level: "Intermediate",
    deliveryModes: ["Virtual", "Physical"],
    duration: "4 days",
    price: 145000,
    certification: "Proposal and M&E Clinic Certificate",
    status: "Open",
    startDate: "2026-07-15",
    endDate: "2026-07-18",
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
    shortDescription:
      "Move from programme idea to donor-ready proposal, results framework, and monitoring plan.",
    fullDescription:
      "A practical clinic for NGOs, programme teams, and development organisations building better proposals and implementation evidence systems.",
    outcomes: [
      "Frame problems, beneficiaries, and intervention logic",
      "Build results frameworks and monitoring indicators",
      "Prepare implementation workplans and budgets",
      "Strengthen donor-facing narrative and evidence",
    ],
    audience: ["NGO teams", "Programme officers", "M&E officers", "Grant writers"],
    modules: [
      {
        title: "Proposal architecture",
        lessons: ["Problem framing", "Theory of change", "Results logic"],
      },
      {
        title: "M&E system design",
        lessons: ["Indicators", "Data collection", "Learning loops"],
      },
      {
        title: "Budget and submission clinic",
        lessons: ["Budget logic", "Narrative polish", "Review checklist"],
      },
    ],
    facilitator: "LANI Development Faculty",
    materials: ["Proposal template", "M&E matrix", "Budget checklist"],
    assessment: "Reviewed proposal outline",
    seats: 35,
    enrolled: 22,
    featured: false,
  },
  {
    id: "retail-merchandising-excellence",
    title: "Retail and Merchandising Excellence",
    code: "LANI-RTM-144",
    category: "Commercial Skills",
    thematicArea: "Retail, Sales and Merchandising",
    type: "Corporate",
    level: "Foundation",
    deliveryModes: ["In-plant", "Physical"],
    duration: "2 days",
    price: 0,
    certification: "Corporate Participation Certificate",
    status: "Corporate Only",
    startDate: "2026-08-06",
    endDate: "2026-08-07",
    image:
      "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1200&q=80",
    shortDescription:
      "Train retail and field teams on selling discipline, shelf standards, and customer experience.",
    fullDescription:
      "A corporate programme for commercial teams that need consistent execution, improved customer handling, and stronger field productivity.",
    outcomes: [
      "Apply selling and customer engagement routines",
      "Improve merchandising standards and outlet visibility",
      "Track field productivity and route performance",
      "Create coaching routines for supervisors",
    ],
    audience: ["Retail teams", "Sales supervisors", "SME operators", "Field managers"],
    modules: [
      {
        title: "Commercial execution",
        lessons: ["Customer approach", "Sales conversion", "Objection handling"],
      },
      {
        title: "Merchandising standards",
        lessons: ["Shelf logic", "Visibility", "Outlet audit routines"],
      },
      {
        title: "Field productivity",
        lessons: ["Route plans", "Daily scorecards", "Supervisor coaching"],
      },
    ],
    facilitator: "LANI Commercial Faculty",
    materials: ["Field checklist", "Outlet audit sheet", "Supervisor guide"],
    assessment: "Practical demonstration and supervisor review",
    seats: 0,
    enrolled: 0,
    featured: false,
  },
];

// Working sample resources so the learner course player has functional
// accompanying materials and a playable lesson video out of the box. These are
// only used as defaults — as soon as a facilitator or admin uploads real files
// (which persist to Supabase), those take precedence.
//
// Materials are attached PER LESSON (each lesson gets its own PDF). Course- and
// module-level materials stay empty by default and are populated only when a
// facilitator/admin uploads them via the course editor.
const SAMPLE_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const SAMPLE_LESSON_PDF_URL =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

export const courses: Course[] = baseCourses.map((course) => ({
  ...course,
  videoUrl: course.videoUrl ?? SAMPLE_VIDEO_URL,
  materialFiles: course.materialFiles ?? [],
  modules: course.modules.map((m) => ({
    ...m,
    lessonMaterials:
      m.lessonMaterials && Object.keys(m.lessonMaterials).length
        ? m.lessonMaterials
        : Object.fromEntries(
            m.lessons.map((lesson) => [
              lesson,
              [{ name: `${lesson} — Notes.pdf`, url: SAMPLE_LESSON_PDF_URL }],
            ])
          ),
  })),
}));

export const applicationProgrammes = [
  {
    type: "Bootcamp",
    title: "Skills bootcamp",
    required: "Education level, skill interest, availability, and motivation statement",
  },
  {
    type: "Incubation",
    title: "Startup incubation",
    required: "Startup name, idea summary, sector, team size, and problem statement",
  },
  {
    type: "Acceleration",
    title: "Enterprise acceleration",
    required: "Product status, traction, revenue, funding need, and market opportunity",
  },
  {
    type: "Sponsored Training",
    title: "Sponsored learning cohort",
    required: "Demographics, eligibility, location, and sponsor criteria",
  },
  {
    type: "Corporate Nomination",
    title: "Corporate nomination",
    required: "Organisation, department, staff ID, nominated by, and approval status",
  },
  {
    type: "Certification Prep",
    title: "Certification preparation",
    required: "Professional body level, exam attempts, and preferred subject papers",
  },
];

export const corporateModels = [
  "In-plant",
  "Customised",
  "Executive",
  "Hybrid",
  "Virtual",
  "On-site embedded",
];

export const capabilityLifecycle = ["Diagnose", "Design", "Develop", "Deploy", "Sustain"];

export const initialEnrollments: Enrollment[] = [
  {
    id: "enr-001",
    courseId: "digital-transformation-officer",
    learnerName: "Amina Yusuf",
    learnerEmail: "amina.yusuf@example.com",
    progress: 68,
    completedLessons: [
      "Transformation drivers",
      "Readiness diagnostics",
      "Roadmap design",
      "Workflow automation",
      "Data-led decisions",
      "Adoption dashboards",
    ],
    paymentStatus: "Successful",
    enrolledAt: "2026-06-12",
  },
  {
    id: "enr-002",
    courseId: "tax-compliance-professional",
    learnerName: "Demo Learner",
    learnerEmail: "learner@lani.academy",
    progress: 100,
    completedLessons: [
      "Tax principles",
      "Financial reporting",
      "Audit basics",
      "Past questions",
      "Time management",
      "Common pitfalls",
      "Controls",
      "Documentation",
      "Professional ethics",
    ],
    paymentStatus: "Successful",
    enrolledAt: "2026-06-10",
  },
];

export const initialTransactions: Transaction[] = [
  {
    id: "txn-001",
    courseId: "digital-transformation-officer",
    learnerEmail: "amina.yusuf@example.com",
    amount: 185000,
    gateway: "Paystack",
    status: "Successful",
    receiptNumber: "LANI-RCPT-1001",
    createdAt: "2026-06-12",
  },
  {
    id: "txn-002",
    courseId: "tax-compliance-professional",
    learnerEmail: "learner@lani.academy",
    amount: 160000,
    gateway: "Flutterwave",
    status: "Successful",
    receiptNumber: "LANI-RCPT-1002",
    createdAt: "2026-06-10",
  },
];

export const initialCertificates: Certificate[] = [
  {
    id: "LANI-CERT-2026-001",
    learnerName: "Demo Learner",
    learnerEmail: "learner@lani.academy",
    courseId: "tax-compliance-professional",
    courseTitle: "Tax and Compliance Professional Route",
    issueDate: "2026-06-14",
    status: "Issued",
  },
];

export const initialCorporateLeads: CorporateLead[] = [
  {
    id: "lead-001",
    organisation: "Meridian Trust Bank",
    sector: "Financial services",
    contactName: "Bola Martins",
    email: "bola.martins@example.com",
    phone: "+234 800 111 2222",
    thematicArea: "Human Capital Development",
    participants: 120,
    deliveryMode: "Hybrid",
    preferredDate: "2026-08-12",
    need: "Leadership readiness and branch performance programme for middle managers.",
    stage: "Proposal Sent",
    createdAt: "2026-06-11",
  },
  {
    id: "lead-002",
    organisation: "GreenField Foods",
    sector: "Agribusiness",
    contactName: "Ife Adeyemi",
    email: "ife.adeyemi@example.com",
    phone: "+234 800 333 4444",
    thematicArea: "Agriculture and Agribusiness",
    participants: 45,
    deliveryMode: "In-plant",
    preferredDate: "2026-07-30",
    need: "Value chain, records, and commercial readiness for producer groups.",
    stage: "Contacted",
    createdAt: "2026-06-13",
  },
];

export const initialApplications: ProgrammeApplication[] = [
  {
    id: "app-001",
    programmeType: "Sponsored Training",
    applicantName: "Chinedu Okafor",
    email: "chinedu.okafor@example.com",
    phone: "+234 800 555 1212",
    location: "Lagos",
    organisation: "Self-employed",
    motivation: "I want to scale my cassava processing business and hire more local workers.",
    status: "Shortlisted",
    score: 82,
    createdAt: "2026-06-12",
  },
  {
    id: "app-002",
    programmeType: "Certification Prep",
    applicantName: "Mariam Bello",
    email: "mariam.bello@example.com",
    phone: "+234 800 777 9898",
    location: "Abuja",
    organisation: "Northstar Audit",
    motivation: "I need a structured revision plan for my next CITN attempt.",
    status: "Under Review",
    score: 71,
    createdAt: "2026-06-15",
  },
];

export const initialCmsAssets: CmsAsset[] = [
  {
    id: "asset-001",
    name: "Future-ready capability campaign banner",
    type: "Banner",
    placement: "Homepage hero",
    owner: "Content Manager",
    status: "Published",
  },
  {
    id: "asset-002",
    name: "Corporate capability brochure",
    type: "Brochure",
    placement: "Corporate training page",
    owner: "Sales Admin",
    status: "Scheduled",
  },
  {
    id: "asset-003",
    name: "Agribusiness sponsored cohort flyer",
    type: "Flyer",
    placement: "Application portal",
    owner: "Programme Team",
    status: "Draft",
  },
];

// Default Subject Matter Experts shown on the landing page. Admins can edit,
// add, or remove these from the Admin → Experts tab (changes persist to Supabase).
// Photos are free-to-use placeholder portraits — replace with real headshots.
export const initialSmes: Sme[] = [
  {
    id: "sme-001",
    name: "Dr. Amaka Obi",
    title: "Lead, Digital Transformation & ICT",
    expertise: "ICT and Digital Transformation",
    bio: "Amaka has spent 15 years helping banks and public institutions modernise their operations — from cloud migration and data analytics to Power Platform automation. She holds a Ph.D. in Information Systems and has led enterprise digital programmes across West Africa.",
    image: "https://images.unsplash.com/photo-1769636930016-5d9f0ca653aa?w=400&h=400&fit=crop&crop=faces&auto=format&q=70",
    published: true,
    createdAt: "2026-01-05",
  },
  {
    id: "sme-002",
    name: "Tunde Bakare",
    title: "Human Capital & Leadership Faculty",
    expertise: "Human Capital Development",
    bio: "A certified corporate trainer and executive coach, Tunde designs leadership and performance-management programmes for high-growth teams. He has facilitated over 200 workshops and specialises in turning strategy into everyday management practice.",
    image: "https://images.unsplash.com/photo-1769636929354-59165ba73c7e?w=400&h=400&fit=crop&crop=faces&auto=format&q=70",
    published: true,
    createdAt: "2026-01-06",
  },
  {
    id: "sme-003",
    name: "Fatima Bello",
    title: "Finance, Risk & Compliance Specialist",
    expertise: "Finance, Risk, Tax and Compliance",
    bio: "Fatima is a chartered accountant and former head of internal audit with deep expertise in tax, credit analysis and regulatory compliance. She translates complex financial controls into practical, exam-ready and workplace-ready training.",
    image: "https://images.unsplash.com/photo-1769636929388-99eff95d3bf1?w=400&h=400&fit=crop&crop=faces&auto=format&q=70",
    published: true,
    createdAt: "2026-01-07",
  },
  {
    id: "sme-004",
    name: "Samuel Adeyemi",
    title: "Agribusiness & Value Chain Advisor",
    expertise: "Agribusiness and Livelihoods",
    bio: "Samuel works with cooperatives and agro-processors to build resilient value chains. His sessions cover agribusiness planning, market access and cooperative governance, drawing on a decade of fieldwork across rural Nigeria and East Africa.",
    image: "https://images.unsplash.com/photo-1595211877493-41a4e5f236b3?w=400&h=400&fit=crop&crop=faces&auto=format&q=70",
    published: true,
    createdAt: "2026-01-08",
  },
  {
    id: "sme-005",
    name: "Grace Okafor",
    title: "Sustainability & ESG Practitioner",
    expertise: "Sustainability and ESG",
    bio: "Grace advises organisations on ESG strategy, climate risk and sustainable supply chains. A frequent conference speaker, she helps teams move from ESG reporting obligations to measurable, credible sustainability action.",
    image: "https://images.unsplash.com/photo-1769636929266-8057f2c5ed52?w=400&h=400&fit=crop&crop=faces&auto=format&q=70",
    published: true,
    createdAt: "2026-01-09",
  },
  {
    id: "sme-006",
    name: "Ngozi Eze",
    title: "Management & Strategy Consultant",
    expertise: "Management and Strategy Consulting",
    bio: "Ngozi partners with executive teams on strategic planning, business-process improvement and change management. She brings 12 years of consulting experience and a pragmatic, outcomes-first approach to capability building.",
    image: "https://images.unsplash.com/photo-1769636929130-56648d6e9c6d?w=400&h=400&fit=crop&crop=faces&auto=format&q=70",
    published: true,
    createdAt: "2026-01-10",
  },
];
