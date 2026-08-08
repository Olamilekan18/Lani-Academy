export type View =
  | "home"
  | "courses"
  | "course-detail"
  | "corporate"
  | "applications"
  | "learner"
  | "facilitator"
  | "admin"
  | "verify"
  | "signup"
  | "organization"
  | "about"
  | "certification"
  | "resources"
  | "contact"
  | "calendar"
  | "profile"
  | "pathways";

export type DeliveryMode =
  | "Self-paced"
  | "Instructor-led"
  | "Virtual"
  | "Physical"
  | "Hybrid"
  | "In-plant";

export type CourseStatus =
  | "Open"
  | "Coming Soon"
  | "Application Required"
  | "Corporate Only"
  | "Sold Out"
  | "Archived";

export type ThematicArea = {
  id: string;
  name: string;
  summary: string;
  audience: string;
  accent: string;
};

export type CourseModule = {
  title: string;
  lessons: string[];
};

export type Course = {
  id: string;
  title: string;
  code: string;
  category: string;
  thematicArea: string;
  type: "Open Programme" | "Certification Prep" | "Bootcamp" | "Corporate" | "Sponsored";
  level: "Foundation" | "Intermediate" | "Advanced" | "Executive";
  deliveryModes: DeliveryMode[];
  duration: string;
  price: number;
  certification: string;
  status: CourseStatus;
  startDate: string;
  endDate: string;
  image: string;
  shortDescription: string;
  fullDescription: string;
  outcomes: string[];
  audience: string[];
  modules: CourseModule[];
  facilitator: string;
  materials: string[];
  assessment: string;
  seats: number;
  enrolled: number;
  featured: boolean;
  videoUrl?: string;
  materialFiles?: { name: string; url: string }[];
};

export type Enrollment = {
  id: string;
  courseId: string;
  learnerName: string;
  learnerEmail: string;
  progress: number;
  completedLessons: string[];
  paymentStatus: "Successful" | "Pending" | "Manual Review";
  enrolledAt: string;
};

export type Transaction = {
  id: string;
  courseId: string;
  learnerEmail: string;
  amount: number;
  gateway: "Paystack" | "Flutterwave" | "Bank Transfer";
  status: "Pending" | "Successful" | "Failed" | "Refunded" | "Manually Confirmed";
  receiptNumber: string;
  createdAt: string;
};

export type CertificateType =
  | "Completion"
  | "Participation"
  | "Professional Preparation"
  | "Executive Programme"
  | "Corporate Training";

export type Certificate = {
  id: string;
  learnerName: string;
  learnerEmail: string;
  courseId: string;
  courseTitle: string;
  issueDate: string;
  status: "Issued" | "Revoked";
  type?: CertificateType;
};

export type CorporateLead = {
  id: string;
  organisation: string;
  sector: string;
  contactName: string;
  email: string;
  phone: string;
  thematicArea: string;
  participants: number;
  deliveryMode: DeliveryMode;
  preferredDate: string;
  need: string;
  stage: "New" | "Contacted" | "Proposal Sent" | "Negotiation" | "Won" | "Lost";
  createdAt: string;
};

export type ApplicationStatus =
  | "Submitted"
  | "Under Review"
  | "Shortlisted"
  | "Rejected"
  | "Accepted"
  | "Waitlisted";

export type ProgrammeApplication = {
  id: string;
  programmeType: string;
  applicantName: string;
  email: string;
  phone: string;
  location: string;
  organisation: string;
  motivation: string;
  status: ApplicationStatus;
  score: number;
  createdAt: string;
  attachments?: { name: string; url: string }[];
};

export type CmsAsset = {
  id: string;
  name: string;
  type: "Banner" | "Flyer" | "Brochure" | "Video" | "Testimonial";
  placement: string;
  owner: string;
  status: "Draft" | "Scheduled" | "Published";
  url?: string;
};

// ─── New LMS Types ───────────────────────────────────────────

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
};

export type Quiz = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number; // percentage
  timeLimitMinutes: number;
  dueDate: string;
};

export type QuizAttempt = {
  id: string;
  quizId: string;
  learnerEmail: string;
  learnerName: string;
  answers: number[];
  score: number;
  passed: boolean;
  submittedAt: string;
};

export type Assignment = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
};

export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  courseId: string;
  learnerEmail: string;
  learnerName: string;
  submittedAt: string;
  content: string;
  score: number | null;
  feedback: string;
  status: "Submitted" | "Graded" | "Returned";
};

export type Announcement = {
  id: string;
  courseId: string;
  courseTitle: string;
  authorName: string;
  authorRole: "facilitator" | "admin";
  title: string;
  body: string;
  createdAt: string;
};

export type CalendarEvent = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  type: "Live Class" | "Assessment Deadline" | "Workshop" | "Orientation" | "Webinar";
  date: string;
  time: string;
  venue: string;
  meetingLink?: string;
};

export type Notification = {
  id: string;
  type: "enrollment" | "payment" | "certificate" | "announcement" | "assessment" | "reminder";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  learnerEmail?: string;
};

export type FacilitatorAssignment = {
  facilitatorEmail: string;
  facilitatorName: string;
  courseId: string;
  courseTitle: string;
  assignedAt: string;
};

export type PromoCode = {
  code: string;
  description: string;
  discountPercent: number;
  active: boolean;
  expiresAt: string | null;
  maxUses: number;
  uses: number;
};

export type SurveyQuestion = {
  id: string;
  prompt: string;
};

export type Survey = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  type: "Pre" | "Post" | "Feedback";
  questions: SurveyQuestion[];
};

export type SurveyResponse = {
  id: string;
  surveyId: string;
  courseId: string;
  learnerEmail: string;
  learnerName: string;
  ratings: number[];
  comment: string;
  submittedAt: string;
};

export type AttendanceRecord = {
  sessionId: string;
  learnerEmail: string;
  learnerName: string;
  courseId: string;
  status: "Present" | "Absent";
  recordedAt?: string;
};

export type AnalyticsEvent = {
  id: string;
  type: "view" | "checkout_start" | "checkout_complete";
  courseId: string | null;
  learnerEmail: string | null;
  createdAt: string;
};

export type Pathway = {
  id: string;
  title: string;
  description: string;
  image: string;
  courseIds: string[];
  price: number;
  featured: boolean;
  published: boolean;
  createdAt: string;
};

export type DiscussionPost = {
  id: string;
  courseId: string;
  courseTitle: string;
  authorEmail: string;
  authorName: string;
  authorRole: string;
  body: string;
  parentId?: string | null;
  createdAt: string;
};

export type ContentItem = {
  id: string;
  type: "Article" | "Guide" | "Brochure" | "Flyer";
  title: string;
  excerpt: string;
  body: string;
  category: string;
  imageUrl: string;
  fileUrl: string;
  author: string;
  published: boolean;
  createdAt: string;
};
