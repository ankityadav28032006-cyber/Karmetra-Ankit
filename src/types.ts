export type UserRole = 'candidate' | 'employer' | 'admin';
export type AdminRoleType = 'MASTER_ADMIN' | 'ADMIN' | 'MODERATOR';
export type AdminRole = 'MASTER_ADMIN' | 'ADMIN' | 'MODERATOR';

export type JobCategory = 'IT' | 'Non-IT' | 'Business' | 'Blue Collar';
export type WorkMode = 'In-Office' | 'Remote' | 'Hybrid' | 'Field';
export type JobType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Internship' | 'Freelance' | 'Temporary';
export type ApplicationStatus = 
  | 'Applied' 
  | 'Under Review' 
  | 'Shortlisted' 
  | 'Contacted' 
  | 'Interview Scheduled' 
  | 'Interview Completed' 
  | 'Selected' 
  | 'Rejected' 
  | 'Joined';

export type VerificationStatus = 'Pending' | 'Under Review' | 'Verified' | 'Rejected' | 'Suspended';
export type JobPostStatus = 'Draft' | 'Pending Approval' | 'Active' | 'Paused' | 'Closed' | 'Rejected';
export type CertificateStatus = 'Valid' | 'Revoked';
export type SupportTicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';

export interface User {
  id: string;
  mobile: string;
  role: UserRole;
  adminRole?: AdminRoleType;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  isRegistered: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OTPRecord {
  mobile: string;
  otp: string;
  salt?: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  role: UserRole;
}

export interface OTPAdminConfigView {
  appEnv: 'development' | 'production';
  otpDemoMode: boolean;
  smsProvider: 'fast2sms' | 'msg91' | 'console';
  providerStatus: 'Configured' | 'Not Configured' | 'Connected' | 'Error';
  fast2smsConfigured: boolean;
  fast2smsTemplateConfigured: boolean;
  msg91Configured: boolean;
  msg91TemplateConfigured: boolean;
  otpExpirySeconds: number;
  otpMaxAttempts: number;
  otpResendCooldownSeconds: number;
  testPhoneNumberSet: boolean;
  fallbackEnabled: boolean;
  productionReady: boolean;
  productionErrors: string[];
}

export interface OTPDiagnosticCheck {
  id: string;
  title: string;
  category: 'security' | 'architecture' | 'provider' | 'lifecycle';
  passed: boolean;
  status: 'passed' | 'warning' | 'failed';
  details: string;
}

export interface OTPDiagnosticReport {
  timestamp: string;
  overallStatus: 'passed' | 'warning' | 'failed';
  environment: 'development' | 'production';
  demoModeActive: boolean;
  checks: OTPDiagnosticCheck[];
}

export interface CandidateProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  mobile: string;
  avatarUrl?: string;
  dob?: string;
  gender?: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  experienceType: 'Fresher' | 'Experienced';
  totalExperienceYears: number;
  currentDesignation?: string;
  industry?: string;
  expectedSalaryMin: number;
  expectedSalaryMax: number;
  preferredJobTypes: JobType[];
  preferredWorkModes: WorkMode[];
  preferredLocations: string[];
  highestQualification: string;
  degreeName: string;
  institute: string;
  passingYear: number;
  skills: string[];
  resumeUrl?: string;
  resumeFileName?: string;
  resumeUpdatedAt?: string;
  isProfileComplete: boolean;
  privacyShowPhone: boolean;
  jobAlertPreferences?: GovtJobAlertPreference;
  createdAt: string;
  updatedAt: string;
}

export interface EmployerProfile {
  id: string;
  userId: string;
  companyName: string;
  logoUrl?: string;
  industry: string;
  companyType: string;
  website?: string;
  gstNumber?: string;
  businessDescription?: string;
  recruiterName: string;
  recruiterDesignation: string;
  recruiterEmail: string;
  recruiterMobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  verificationStatus: VerificationStatus;
  verificationReason?: string;
  documents: {
    id: string;
    type: string;
    url: string;
    name: string;
    uploadedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface JobBenefitDetail {
  id: string;
  name: string;
  category: 'insurance' | 'leaves' | 'allowances' | 'bonuses' | 'facilities' | 'other';
  included: boolean;
  amount?: string;
  note?: string;
}

export interface BlueCollarJobRequirements {
  bikeRequired: boolean;
  drivingLicenceRequired: boolean;
  ownVehicleRequired: boolean;
  smartphoneRequired: boolean;
  androidRequired: boolean;
  petrolReimbursement: boolean;
  deliveryAllowance: boolean;
}

export interface JobPost {
  id: string;
  employerId: string;
  companyName: string;
  companyLogo?: string;
  isCompanyVerified: boolean;
  title: string;
  department: string;
  subCategory?: string;
  category: JobCategory;
  jobType: JobType;
  workMode: WorkMode;
  locationCity: string;
  locationState: string;
  multipleLocations?: string[];
  address?: string;
  latitude: number;
  longitude: number;
  salaryMin: number;
  salaryMax: number;
  salaryPeriod: 'Month' | 'Year' | 'Day';
  salaryAnnualMin?: number;
  salaryAnnualMax?: number;
  salaryMonthly?: number;
  salaryType?: 'Fixed' | 'Variable' | 'Hourly' | 'Monthly' | 'Annual' | 'Fixed + Incentive';
  fixedSalary?: number;
  variableSalary?: number;
  incentive?: string;
  performanceBonus?: string;
  joiningBonus?: string;
  attendanceBonus?: string;
  experienceMinYears: number;
  experienceMaxYears: number;
  educationRequired: string;
  educationPreferred?: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  preferredCertificates: string[];
  languagesRequired?: string[];
  genderRequirement?: 'Any' | 'Male' | 'Female' | 'Other';
  ageMin?: number;
  ageMax?: number;
  vacancies: number;
  description: string;
  responsibilities: string[];
  requirements: string[];
  preferredCandidateProfile?: string;
  benefits: string[];
  detailedBenefits?: JobBenefitDetail[];
  blueCollarRequirements?: BlueCollarJobRequirements;
  workingHours: string;
  joiningTimeline: string;
  applicationDeadline: string;
  status: JobPostStatus;
  quotaType?: 'free' | 'paid';
  paymentStatus?: 'Free' | 'Pending' | 'Paid' | 'Failed';
  paymentId?: string;
  adminFeedback?: string;
  viewsCount: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  candidateId: string;
  employerId: string;
  status: ApplicationStatus;
  statusHistory: {
    status: ApplicationStatus;
    updatedAt: string;
    note?: string;
  }[];
  resumeUrl: string;
  coverMessage?: string;
  answers?: Record<string, string>;
  matchScore: number;
  recruiterNotes?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  employerId: string;
  candidateName: string;
  companyName: string;
  jobTitle: string;
  dateTime: string;
  interviewerName: string;
  interviewType: 'Video Call (Google Meet)' | 'Telephonic' | 'In-Person';
  meetingLink?: string;
  instructions: string;
  status: 'Scheduled' | 'Completed' | 'Rescheduled' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CourseLesson {
  id: string;
  moduleId: string;
  title: string;
  titleHi?: string;
  description: string;
  descriptionHi?: string;
  durationMinutes: number;
  videoSource?: 'youtube' | 'url' | 'upload';
  videoUrl: string;
  videoUrlHi?: string;
  thumbnailUrl?: string;
  resources?: { name: string; url: string; type: string }[];
  isPublished?: boolean;
  order: number;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  titleHi?: string;
  order: number;
  lessons: CourseLesson[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  questionHi?: string;
  options: string[];
  optionsHi?: string[];
  correctOptionIndex: number;
  explanation?: string;
  explanationHi?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  marks: number;
}

export interface CourseAssessment {
  id: string;
  courseId: string;
  title: string;
  titleHi?: string;
  timeLimitMinutes: number;
  passingPercentage: number;
  totalMarks?: number;
  maxAttempts: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  questions: QuizQuestion[];
}

export type Lesson = CourseLesson;
export type Module = CourseModule;
export type AssessmentQuestion = QuizQuestion;

export interface Course {
  id: string;
  title: string;
  titleHi: string;
  category: string;
  categoryHi: string;
  subcategory?: string;
  description: string;
  descriptionHi: string;
  thumbnailUrl: string;
  level: CourseLevel;
  durationHours: number;
  passingPercentage: number;
  isPublished: boolean;
  featured?: boolean;
  enrolledCount: number;
  completedCount: number;
  modules: CourseModule[];
  assessment?: CourseAssessment;
  skillsTaught: string[];
  learningObjectives?: string[];
  careerOutcomes?: string[];
  prerequisites?: string[];
  accessType?: 'free' | 'paid';
  coursePrice?: number;
  isPaid?: boolean;
  price?: number;
  certificateEnabled?: boolean;
  certificateFeeType?: 'free' | 'paid';
  isCertificatePaid?: boolean;
  certificatePrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgress {
  id: string;
  candidateId: string;
  courseId: string;
  completedLessonIds: string[];
  completedModuleIds: string[];
  lastAccessedLessonId?: string;
  isCompleted: boolean;
  completedAt?: string;
  updatedAt: string;
}

export interface AssessmentAttempt {
  id: string;
  candidateId: string;
  courseId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  attemptNumber: number;
  answers: Record<string, number>;
  completedAt: string;
}

export interface Certificate {
  id: string;
  verificationCode: string; // e.g. KM-2026-XXXXX
  candidateId: string;
  candidateName: string;
  courseId: string;
  courseTitle: string;
  courseTitleHi?: string;
  skills: string[];
  scoreMarks?: number;
  totalMarks?: number;
  scorePercentage: number;
  issueDate: string;
  status: CertificateStatus;
  isPaid?: boolean;
  paymentId?: string;
  receiptNumber?: string;
  qrCodeData?: string;
  revocationReason?: string;
  qrDataUrl?: string;
}

export interface ResumeEducationItem {
  id?: string;
  degree: string;
  field?: string;
  fieldOfStudy?: string;
  institute: string;
  passingYear?: string | number;
  startYear?: string | number;
  endYear?: string | number;
  grade?: string;
}

export interface ResumeExperienceItem {
  id?: string;
  title: string;
  company: string;
  role?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  startYear?: string | number;
  endYear?: string | number;
  isCurrent?: boolean;
  description?: string;
  highlights?: string[];
}

export interface ResumeProjectItem {
  id?: string;
  title: string;
  techStack?: string[];
  technologies?: string;
  description: string;
  liveLink?: string;
  link?: string;
}

export interface ResumeCertificationItem {
  id?: string;
  name: string;
  issuer: string;
  year?: string | number;
}

export interface ResumeData {
  id: string;
  userId: string;
  versionTitle: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  city?: string;
  state?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  avatarUrl?: string;
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
    avatarUrl?: string;
  };
  careerObjective: string;
  preferredJobRole?: string;
  targetRole?: string;
  experienceLevel?: string;
  education: ResumeEducationItem[];
  experience: ResumeExperienceItem[];
  skills: string[];
  projects: ResumeProjectItem[];
  certifications?: (ResumeCertificationItem | string)[];
  certificates?: (ResumeCertificationItem | string)[];
  languages: string[];
  achievements?: string[];
  atsScore?: number;
  createdAt: string;
  updatedAt: string;
}

export type PaymentType = 'job_posting' | 'certificate';
export type PaymentStatus = 'Created' | 'Pending' | 'Paid' | 'Success' | 'Failed' | 'Refunded' | 'Cancelled';

export interface PaymentInvoiceData {
  receiptNumber: string;
  invoiceDate: string;
  paymentId?: string;
  orderId?: string;
  customerName: string;
  customerMobile?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  billingType?: string;
  companyName?: string;
  itemName?: string;
  description?: string;
  sacCode?: string;
  baseAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  currency?: string;
  paymentMethod?: string;
  status?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  platformDetails?: {
    companyName: string;
    brandName: string;
    headOffice: string;
    helpline: string;
    email: string;
    website: string;
    gstin: string;
  };
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userName?: string;
  userMobile?: string;
  userEmail?: string;
  employerId?: string;
  candidateId?: string;
  paymentType: PaymentType;
  targetId: string;
  title: string;
  amount: number; // Subtotal before GST
  gst: number; // GST amount
  gstRate?: number; // e.g. 18%
  total: number; // Final payable
  currency: string;
  gateway: string;
  gatewayTransactionId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  receiptNumber?: string;
  status: PaymentStatus;
  createdAt: string;
  verifiedDate?: string;
  verifiedAt?: string;
  failedReason?: string;
  metadata?: any;
  invoiceData?: PaymentInvoiceData;
}


export interface MonetizationSettings {
  freeJobsPerWeek: number;
  paidJobPrice: number;
  gstPercentage: number;
  certificatePrice: number;
  freeJobCandidateReach: number;
  premiumCandidateReach: number;
  paidJobPostingEnabled: boolean;
  certificatePaymentEnabled: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  titleHi?: string;
  message: string;
  messageHi?: string;
  type: 'job' | 'application' | 'interview' | 'learning' | 'certificate' | 'system' | 'verification' | 'govt_job';
  targetUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userRole: UserRole;
  userName: string;
  userContact: string;
  subject: string;
  category: string;
  message: string;
  status: SupportTicketStatus;
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportItem {
  id: string;
  reporterUserId: string;
  reporterRole: UserRole;
  targetType: 'job' | 'employer' | 'candidate';
  targetId: string;
  targetTitle: string;
  reason: string;
  details: string;
  status: 'Open' | 'Under Investigation' | 'Resolved' | 'Dismissed';
  adminActionTaken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DynamicJobCategory {
  id: string;
  name: string;
  nameHi?: string;
  icon?: string;
  description?: string;
  subCategories: string[];
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type GovtVacancyStatus = 'Draft' | 'Published' | 'Expired' | 'Closed';

export interface CategoryWiseVacancy {
  category: string;
  count: number;
}

export interface GovernmentVacancy {
  id: string;
  title: string;
  titleHi?: string;
  department: string;
  departmentHi?: string;
  state: string;
  district?: string;
  recruitmentAuthority: string;
  vacancyNumber: string;
  totalVacancies: number;
  categoryWiseVacancies?: CategoryWiseVacancy[] | string;
  postName: string;
  jobDescription: string;
  eligibility: string;
  minEducation: string;
  maxEducation?: string;
  ageLimit: string;
  ageRelaxation?: string;
  experience?: string;
  requiredSkills: string[];
  salary: string;
  applicationStartDate: string;
  applicationLastDate: string;
  examDate?: string;
  admitCardDate?: string;
  resultDate?: string;
  applicationFee: string;
  officialNotificationUrl: string;
  officialApplyUrl: string;
  officialWebsite: string;
  importantDocuments: string[];
  selectionProcess: string;
  jobType: string;
  status: GovtVacancyStatus;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GovtJobAlertPreference {
  userId?: string;
  states?: string[];
  preferredStates?: string[];
  educationLevels?: string[];
  preferredEducation?: string[];
  categories?: string[];
  preferredJobTypes?: string[];
  departments?: string[];
  departmentInterests?: string[];
  alertEnabled?: boolean;
  emailAlerts?: boolean;
  smsAlerts?: boolean;
  whatsappAlerts?: boolean;
  notificationChannels?: {
    inApp?: boolean;
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
  };
  frequency?: 'instant' | 'daily' | 'weekly';
  minSalary?: number;
  updatedAt?: string;
}

export interface MatchedGovtVacancy {
  vacancy: GovernmentVacancy;
  matchScore: number;
  matchReasons: string[];
  isStateMatch: boolean;
  isEducationMatch: boolean;
  isDepartmentMatch: boolean;
  isClosingSoon: boolean;
  daysLeft: number;
}

export interface MatchedGovtJobsResponse {
  success: boolean;
  matchedVacancies: MatchedGovtVacancy[];
  stats: {
    totalMatched: number;
    stateSpecificCount: number;
    centralCount: number;
    closingSoonCount: number;
    userPreferences: {
      states: string[];
      educationLevels: string[];
      departments: string[];
      inferredState?: string;
      inferredEducation?: string;
      alertEnabled: boolean;
    };
  };
  unreadAlertCount: number;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}
