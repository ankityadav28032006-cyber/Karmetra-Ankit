import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User, OTPRecord, CandidateProfile, EmployerProfile, JobPost,
  JobApplication, Interview, Course, CourseProgress, AssessmentAttempt,
  Certificate, NotificationItem, SupportTicket, ReportItem, AuditLog,
  UserRole, ApplicationStatus, ResumeData, PaymentRecord, MonetizationSettings,
  CourseLesson, CourseAssessment, DynamicJobCategory, GovernmentVacancy, GovtJobAlertPreference
} from '../src/types';
import { INITIAL_COURSES, INITIAL_JOB_POSTS } from './seedData';
import { INITIAL_DYNAMIC_CATEGORIES } from './seedCategories';
import { INITIAL_GOVERNMENT_VACANCIES } from './seedGovtJobs';

interface DatabaseSchema {
  users: User[];
  otps: OTPRecord[];
  candidates: CandidateProfile[];
  employers: EmployerProfile[];
  jobs: JobPost[];
  job_categories: DynamicJobCategory[];
  govt_vacancies: GovernmentVacancy[];
  saved_govt_jobs: { id: string; candidateId: string; vacancyId: string; savedAt: string }[];
  govt_alert_preferences: { userId: string; preferences: GovtJobAlertPreference; updatedAt: string }[];
  applications: JobApplication[];
  interviews: Interview[];
  saved_jobs: { id: string; candidateId: string; jobId: string; savedAt: string }[];
  saved_candidates: { id: string; employerId: string; candidateId: string; notes?: string; savedAt: string }[];
  courses: Course[];
  course_progress: CourseProgress[];
  assessment_attempts: AssessmentAttempt[];
  certificates: Certificate[];
  resumes: ResumeData[];
  payments: PaymentRecord[];
  monetization_settings: MonetizationSettings;
  notifications: NotificationItem[];
  support_tickets: SupportTicket[];
  reports: ReportItem[];
  audit_logs: AuditLog[];
  admin_auth?: {
    email: string;
    passwordHash: string;
    fullName?: string;
    updatedAt: string;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'karmetra.db.json');

class DatabaseEngine {
  private data: DatabaseSchema;
  private isInitialized = false;

  constructor() {
    this.data = this.getDefaultSchema();
    this.init();
  }

  private getDefaultSchema(): DatabaseSchema {
    const defaultAdmin: User = {
      id: 'admin-master-01',
      mobile: '9999999999',
      role: 'admin',
      adminRole: 'MASTER_ADMIN',
      fullName: 'KarMetra Super Admin',
      isRegistered: true,
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    };

    return {
      users: [defaultAdmin],
      otps: [],
      candidates: [],
      employers: [],
      jobs: [...INITIAL_JOB_POSTS],
      job_categories: [...INITIAL_DYNAMIC_CATEGORIES],
      govt_vacancies: [...INITIAL_GOVERNMENT_VACANCIES],
      saved_govt_jobs: [],
      govt_alert_preferences: [],
      applications: [],
      interviews: [],
      saved_jobs: [],
      saved_candidates: [],
      courses: [...INITIAL_COURSES],
      course_progress: [],
      assessment_attempts: [],
      certificates: [],
      resumes: [],
      payments: [],
      monetization_settings: {
        freeJobsPerWeek: 1,
        paidJobPrice: 299,
        gstPercentage: 18,
        certificatePrice: 29,
        freeJobCandidateReach: 25,
        premiumCandidateReach: 100,
        paidJobPostingEnabled: true,
        certificatePaymentEnabled: true
      },
      notifications: [],
      support_tickets: [],
      reports: [],
      audit_logs: []
    };
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const defaultAdmin: User = {
        id: 'admin-master-01',
        mobile: '9999999999',
        role: 'admin',
        adminRole: 'MASTER_ADMIN',
        fullName: 'KarMetra Super Admin',
        isRegistered: true,
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      };

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          ...this.getDefaultSchema(),
          ...parsed
        };
        // Ensure default admin user exists and has adminRole
        if (!this.data.users) this.data.users = [];
        this.data.users.forEach(u => {
          if (u.role === 'admin' && !u.adminRole) {
            u.adminRole = 'MASTER_ADMIN';
          }
        });
        if (!this.data.users.some(u => u.role === 'admin' || u.id === 'admin-master-01')) {
          this.data.users.push(defaultAdmin);
          this.save();
        } else {
          this.save();
        }
        // Ensure all 59+ courses exist even if existing file had fewer
        if (!this.data.courses || this.data.courses.length < INITIAL_COURSES.length) {
          const existingIds = new Set((this.data.courses || []).map(c => c.id));
          const toAdd = INITIAL_COURSES.filter(c => !existingIds.has(c.id));
          this.data.courses = [...(this.data.courses || []), ...toAdd];
          this.save();
        }
        // Ensure dynamic job categories exist
        if (!this.data.job_categories || this.data.job_categories.length < INITIAL_DYNAMIC_CATEGORIES.length) {
          const existingCatIds = new Set((this.data.job_categories || []).map(c => c.id));
          const catsToAdd = INITIAL_DYNAMIC_CATEGORIES.filter(c => !existingCatIds.has(c.id));
          this.data.job_categories = [...(this.data.job_categories || []), ...catsToAdd];
          this.save();
        }
        // Ensure government vacancies exist
        if (!this.data.govt_vacancies || this.data.govt_vacancies.length < INITIAL_GOVERNMENT_VACANCIES.length) {
          const existingGovtIds = new Set((this.data.govt_vacancies || []).map(g => g.id));
          const govtToAdd = INITIAL_GOVERNMENT_VACANCIES.filter(g => !existingGovtIds.has(g.id));
          this.data.govt_vacancies = [...(this.data.govt_vacancies || []), ...govtToAdd];
          this.save();
        }
        if (!this.data.saved_govt_jobs) this.data.saved_govt_jobs = [];
        if (!this.data.govt_alert_preferences) this.data.govt_alert_preferences = [];
      } else {
        this.data = this.getDefaultSchema();
        this.save();
      }
      this.isInitialized = true;
    } catch (err) {
      console.error('Error initializing database file, using memory backup:', err);
      this.data = this.getDefaultSchema();
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  // --- Auth & Users ---
  public getUserByMobileAndRole(mobile: string, role: UserRole): User | undefined {
    const user = this.data.users.find(u => u.mobile === mobile && u.role === role);
    if (user && user.role === 'admin' && !user.adminRole) {
      user.adminRole = 'MASTER_ADMIN';
    }
    return user;
  }

  public getUserById(id: string): User | undefined {
    const user = this.data.users.find(u => u.id === id);
    if (user && user.role === 'admin' && !user.adminRole) {
      user.adminRole = 'MASTER_ADMIN';
    }
    return user;
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return user;
  }

  // --- OTP Management ---
  public getOTPRecord(mobile: string, role: UserRole): OTPRecord | undefined {
    return this.data.otps.find(o => o.mobile === mobile && o.role === role);
  }

  public saveOTPRecord(record: OTPRecord) {
    const idx = this.data.otps.findIndex(o => o.mobile === record.mobile && o.role === record.role);
    if (idx >= 0) {
      this.data.otps[idx] = record;
    } else {
      this.data.otps.push(record);
    }
    this.save();
  }

  public removeOTPRecord(mobile: string, role: UserRole) {
    this.data.otps = this.data.otps.filter(o => !(o.mobile === mobile && o.role === role));
    this.save();
  }

  // --- Candidate Profiles ---
  public getCandidateByUserId(userId: string): CandidateProfile | undefined {
    return this.data.candidates.find(c => c.userId === userId);
  }

  public getCandidateById(id: string): CandidateProfile | undefined {
    return this.data.candidates.find(c => c.id === id);
  }

  public getAllCandidates(): CandidateProfile[] {
    return this.data.candidates;
  }

  public saveCandidateProfile(profile: CandidateProfile): CandidateProfile {
    const idx = this.data.candidates.findIndex(c => c.id === profile.id || c.userId === profile.userId);
    if (idx >= 0) {
      this.data.candidates[idx] = { ...this.data.candidates[idx], ...profile, updatedAt: new Date().toISOString() };
    } else {
      this.data.candidates.push(profile);
    }
    this.save();
    return profile;
  }

  // --- Employer Profiles ---
  public getEmployerByUserId(userId: string): EmployerProfile | undefined {
    return this.data.employers.find(e => e.userId === userId);
  }

  public getEmployerById(id: string): EmployerProfile | undefined {
    return this.data.employers.find(e => e.id === id);
  }

  public getAllEmployers(): EmployerProfile[] {
    return this.data.employers;
  }

  public saveEmployerProfile(profile: EmployerProfile): EmployerProfile {
    const idx = this.data.employers.findIndex(e => e.id === profile.id || e.userId === profile.userId);
    if (idx >= 0) {
      this.data.employers[idx] = { ...this.data.employers[idx], ...profile, updatedAt: new Date().toISOString() };
    } else {
      this.data.employers.push(profile);
    }
    this.save();
    return profile;
  }

  // --- Jobs ---
  public getAllJobs(): JobPost[] {
    return this.data.jobs;
  }

  public getJobById(id: string): JobPost | undefined {
    return this.data.jobs.find(j => j.id === id);
  }

  public getJobsByEmployer(employerId: string): JobPost[] {
    return this.data.jobs.filter(j => j.employerId === employerId);
  }

  public saveJob(job: JobPost): JobPost {
    const idx = this.data.jobs.findIndex(j => j.id === job.id);
    if (idx >= 0) {
      this.data.jobs[idx] = { ...this.data.jobs[idx], ...job, updatedAt: new Date().toISOString() };
    } else {
      this.data.jobs.push(job);
    }
    this.save();
    return job;
  }

  // --- Applications ---
  public getApplications(): JobApplication[] {
    return this.data.applications;
  }

  public getApplicationsByCandidate(candidateId: string): JobApplication[] {
    return this.data.applications.filter(a => a.candidateId === candidateId);
  }

  public getApplicationsByJob(jobId: string): JobApplication[] {
    return this.data.applications.filter(a => a.jobId === jobId);
  }

  public getApplicationsByEmployer(employerId: string): JobApplication[] {
    return this.data.applications.filter(a => a.employerId === employerId);
  }

  public getApplicationById(id: string): JobApplication | undefined {
    return this.data.applications.find(a => a.id === id);
  }

  public saveApplication(app: JobApplication): JobApplication {
    const idx = this.data.applications.findIndex(a => a.id === app.id);
    if (idx >= 0) {
      this.data.applications[idx] = { ...this.data.applications[idx], ...app, updatedAt: new Date().toISOString() };
    } else {
      this.data.applications.push(app);
      // Increment job application count
      const job = this.getJobById(app.jobId);
      if (job) {
        job.applicationsCount = (job.applicationsCount || 0) + 1;
      }
    }
    this.save();
    return app;
  }

  // --- Interviews ---
  public getInterviews(): Interview[] {
    return this.data.interviews;
  }

  public getInterviewsByCandidate(candidateId: string): Interview[] {
    return this.data.interviews.filter(i => i.candidateId === candidateId);
  }

  public getInterviewsByEmployer(employerId: string): Interview[] {
    return this.data.interviews.filter(i => i.employerId === employerId);
  }

  public saveInterview(interview: Interview): Interview {
    const idx = this.data.interviews.findIndex(i => i.id === interview.id);
    if (idx >= 0) {
      this.data.interviews[idx] = { ...this.data.interviews[idx], ...interview, updatedAt: new Date().toISOString() };
    } else {
      this.data.interviews.push(interview);
    }
    this.save();
    return interview;
  }

  // --- Saved Jobs ---
  public getSavedJobs(candidateId: string): string[] {
    return this.data.saved_jobs.filter(s => s.candidateId === candidateId).map(s => s.jobId);
  }

  public toggleSavedJob(candidateId: string, jobId: string): boolean {
    const idx = this.data.saved_jobs.findIndex(s => s.candidateId === candidateId && s.jobId === jobId);
    if (idx >= 0) {
      this.data.saved_jobs.splice(idx, 1);
      this.save();
      return false;
    } else {
      this.data.saved_jobs.push({
        id: `save-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        candidateId,
        jobId,
        savedAt: new Date().toISOString()
      });
      this.save();
      return true;
    }
  }

  // --- Courses & LMS ---
  public getAllCourses(): Course[] {
    return this.data.courses;
  }

  public getCourseById(id: string): Course | undefined {
    return this.data.courses.find(c => c.id === id);
  }

  public saveCourse(course: Course): Course {
    const idx = this.data.courses.findIndex(c => c.id === course.id);
    if (idx >= 0) {
      this.data.courses[idx] = { ...this.data.courses[idx], ...course, updatedAt: new Date().toISOString() };
    } else {
      this.data.courses.push(course);
    }
    this.save();
    return course;
  }

  public deleteCourse(id: string): boolean {
    const initialLen = this.data.courses.length;
    this.data.courses = this.data.courses.filter(c => c.id !== id);
    this.save();
    return this.data.courses.length < initialLen;
  }

  // --- Course Progress ---
  public getCourseProgress(candidateId: string, courseId: string): CourseProgress | undefined {
    return this.data.course_progress.find(p => p.candidateId === candidateId && p.courseId === courseId);
  }

  public getAllCandidateProgress(candidateId: string): CourseProgress[] {
    return this.data.course_progress.filter(p => p.candidateId === candidateId);
  }

  public saveCourseProgress(progress: CourseProgress): CourseProgress {
    const idx = this.data.course_progress.findIndex(p => p.candidateId === progress.candidateId && p.courseId === progress.courseId);
    if (idx >= 0) {
      this.data.course_progress[idx] = { ...this.data.course_progress[idx], ...progress, updatedAt: new Date().toISOString() };
    } else {
      this.data.course_progress.push(progress);
    }
    this.save();
    return progress;
  }

  // --- Assessment Attempts & Certificates ---
  public saveAssessmentAttempt(attempt: AssessmentAttempt): AssessmentAttempt {
    this.data.assessment_attempts.push(attempt);
    this.save();
    return attempt;
  }

  public getAssessmentAttempts(candidateId: string, courseId: string): AssessmentAttempt[] {
    return this.data.assessment_attempts.filter(a => a.candidateId === candidateId && a.courseId === courseId);
  }

  public getAllCertificates(): Certificate[] {
    return this.data.certificates;
  }

  public getCertificatesByCandidate(candidateId: string): Certificate[] {
    return this.data.certificates.filter(c => c.candidateId === candidateId);
  }

  public getCertificateByCode(code: string): Certificate | undefined {
    return this.data.certificates.find(c => c.verificationCode.toLowerCase() === code.trim().toLowerCase());
  }

  public getCertificateById(id: string): Certificate | undefined {
    return this.data.certificates.find(c => c.id === id || c.verificationCode.toLowerCase() === id.trim().toLowerCase());
  }


  public saveCertificate(cert: Certificate): Certificate {
    const idx = this.data.certificates.findIndex(c => c.id === cert.id || c.verificationCode === cert.verificationCode);
    if (idx >= 0) {
      this.data.certificates[idx] = { ...this.data.certificates[idx], ...cert };
    } else {
      this.data.certificates.push(cert);
    }
    this.save();
    return cert;
  }

  // --- Notifications ---
  public getNotificationsByUser(userId: string): NotificationItem[] {
    return this.data.notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createNotification(notification: NotificationItem): NotificationItem {
    this.data.notifications.unshift(notification);
    this.save();
    return notification;
  }

  public markNotificationRead(id: string, userId: string): boolean {
    const item = this.data.notifications.find(n => n.id === id && n.userId === userId);
    if (item) {
      item.isRead = true;
      this.save();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(userId: string) {
    this.data.notifications.forEach(n => {
      if (n.userId === userId) n.isRead = true;
    });
    this.save();
  }

  // --- Support & Reports ---
  public getSupportTickets(): SupportTicket[] {
    return this.data.support_tickets;
  }

  public saveSupportTicket(ticket: SupportTicket): SupportTicket {
    const idx = this.data.support_tickets.findIndex(t => t.id === ticket.id);
    if (idx >= 0) {
      this.data.support_tickets[idx] = { ...this.data.support_tickets[idx], ...ticket, updatedAt: new Date().toISOString() };
    } else {
      this.data.support_tickets.unshift(ticket);
    }
    this.save();
    return ticket;
  }

  public getReports(): ReportItem[] {
    return this.data.reports;
  }

  public saveReport(report: ReportItem): ReportItem {
    const idx = this.data.reports.findIndex(r => r.id === report.id);
    if (idx >= 0) {
      this.data.reports[idx] = { ...this.data.reports[idx], ...report, updatedAt: new Date().toISOString() };
    } else {
      this.data.reports.unshift(report);
    }
    this.save();
    return report;
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return this.data.audit_logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public logAdminAction(adminId: string, adminName: string, action: string, targetType: string, targetId: string, details: string) {
    this.data.audit_logs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      adminId,
      adminName,
      action,
      targetType,
      targetId,
      details,
      timestamp: new Date().toISOString()
    });
    this.save();
  }

  // --- Resumes Management ---
  public getResumesByUserId(userId: string): ResumeData[] {
    return (this.data.resumes || []).filter(r => r.userId === userId);
  }

  public getResumeById(id: string): ResumeData | undefined {
    return (this.data.resumes || []).find(r => r.id === id);
  }

  public saveResume(resume: ResumeData): ResumeData {
    if (!this.data.resumes) this.data.resumes = [];
    const idx = this.data.resumes.findIndex(r => r.id === resume.id);
    if (idx >= 0) {
      this.data.resumes[idx] = { ...this.data.resumes[idx], ...resume, updatedAt: new Date().toISOString() };
    } else {
      this.data.resumes.push(resume);
    }
    this.save();
    return resume;
  }

  public deleteResume(id: string, userId: string): boolean {
    if (!this.data.resumes) return false;
    const initialLen = this.data.resumes.length;
    this.data.resumes = this.data.resumes.filter(r => !(r.id === id && r.userId === userId));
    this.save();
    return this.data.resumes.length < initialLen;
  }

  // --- Payments & Monetization ---
  public getMonetizationSettings(): MonetizationSettings {
    if (!this.data.monetization_settings) {
      this.data.monetization_settings = {
        freeJobsPerWeek: 1,
        paidJobPrice: 299,
        gstPercentage: 18,
        certificatePrice: 29,
        freeJobCandidateReach: 25,
        premiumCandidateReach: 100,
        paidJobPostingEnabled: true,
        certificatePaymentEnabled: true
      };
      this.save();
    }
    return this.data.monetization_settings;
  }

  public updateMonetizationSettings(settings: Partial<MonetizationSettings>): MonetizationSettings {
    const current = this.getMonetizationSettings();
    this.data.monetization_settings = { ...current, ...settings };
    this.save();
    return this.data.monetization_settings;
  }

  public getPayments(): PaymentRecord[] {
    return (this.data.payments || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getPaymentById(id: string): PaymentRecord | undefined {
    return (this.data.payments || []).find(p => p.id === id);
  }

  public getPaymentByRazorpayOrderId(orderId: string): PaymentRecord | undefined {
    return (this.data.payments || []).find(p => p.razorpayOrderId === orderId || p.id === orderId);
  }

  public getPaymentByRazorpayPaymentId(paymentId: string): PaymentRecord | undefined {
    return (this.data.payments || []).find(p => p.razorpayPaymentId === paymentId);
  }

  public generateReceiptNumber(): string {
    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `INV-KM-${year}-${rand}`;
  }

  public savePayment(payment: PaymentRecord): PaymentRecord {
    if (!this.data.payments) this.data.payments = [];
    const idx = this.data.payments.findIndex(p => p.id === payment.id);
    if (idx >= 0) {
      this.data.payments[idx] = { ...this.data.payments[idx], ...payment };
    } else {
      this.data.payments.unshift(payment);
    }
    this.save();
    return payment;
  }

  public createPaymentRecord(payment: PaymentRecord): PaymentRecord {
    return this.savePayment(payment);
  }

  public updatePaymentStatus(
    id: string, 
    status: PaymentRecord['status'], 
    gatewayTxId?: string,
    extraFields?: Partial<PaymentRecord>
  ): PaymentRecord | undefined {
    const payment = this.getPaymentById(id);
    if (!payment) return undefined;
    payment.status = status;
    if (gatewayTxId) {
      payment.gatewayTransactionId = gatewayTxId;
      payment.razorpayPaymentId = gatewayTxId;
    }
    if (status === 'Paid' || status === 'Success') {
      payment.verifiedDate = new Date().toISOString();
      payment.verifiedAt = new Date().toISOString();
      if (!payment.receiptNumber) {
        payment.receiptNumber = this.generateReceiptNumber();
      }
    }
    if (extraFields) {
      Object.assign(payment, extraFields);
    }
    this.save();
    return payment;
  }

  public getEmployerFreePostingStatus(employerId: string) {
    const jobs = this.getJobsByEmployer(employerId);
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Find free jobs posted in last 7 days (non-paid quota)
    const recentFreeJobs = jobs.filter(j => {
      const createdTime = new Date(j.createdAt).getTime();
      const isFree = !j.quotaType || j.quotaType === 'free' || j.paymentStatus !== 'Paid';
      return createdTime >= sevenDaysAgo && isFree;
    });

    const settings = this.getMonetizationSettings();
    const freeJobsAllowed = settings.freeJobsPerWeek || 1;
    const freeJobsUsed = recentFreeJobs.length;
    const hasFreeJobAvailable = freeJobsUsed < freeJobsAllowed;
    
    let nextFreeDate: string | null = null;
    if (!hasFreeJobAvailable && recentFreeJobs.length > 0) {
      // Find oldest of recent free jobs and add 7 days
      const oldestRecentTime = Math.min(...recentFreeJobs.map(j => new Date(j.createdAt).getTime()));
      nextFreeDate = new Date(oldestRecentTime + (7 * 24 * 60 * 60 * 1000)).toISOString();
    }

    const basePrice = settings.paidJobPrice || 299;
    const gstRate = settings.gstPercentage || 18;
    const gstAmount = Math.round((basePrice * gstRate / 100) * 100) / 100;
    const totalPayable = Math.round((basePrice + gstAmount) * 100) / 100;

    return {
      freeJobsAllowed,
      freeJobsUsed,
      hasFreeJobAvailable,
      nextFreeDate,
      paidJobPrice: basePrice,
      gstPercentage: gstRate,
      gstAmount,
      totalPayable,
      freeCandidateReach: settings.freeJobCandidateReach,
      premiumCandidateReach: settings.premiumCandidateReach
    };
  }

  // --- Course Video Lesson Administration ---
  public addLessonToCourse(courseId: string, moduleId: string, lesson: CourseLesson): Course | undefined {
    const course = this.getCourseById(courseId);
    if (!course) return undefined;
    let mod = course.modules.find(m => m.id === moduleId);
    if (!mod) {
      // Create new module if needed
      mod = {
        id: moduleId || `mod-${Date.now()}`,
        courseId,
        title: 'Module 1: Curriculum Content',
        order: course.modules.length + 1,
        lessons: []
      };
      course.modules.push(mod);
    }
    mod.lessons.push(lesson);
    course.updatedAt = new Date().toISOString();
    this.saveCourse(course);
    return course;
  }

  public updateLessonInCourse(courseId: string, lessonId: string, updates: Partial<CourseLesson>): Course | undefined {
    const course = this.getCourseById(courseId);
    if (!course) return undefined;
    for (const mod of course.modules) {
      const idx = mod.lessons.findIndex(l => l.id === lessonId);
      if (idx >= 0) {
        mod.lessons[idx] = { ...mod.lessons[idx], ...updates };
        course.updatedAt = new Date().toISOString();
        this.saveCourse(course);
        return course;
      }
    }
    return undefined;
  }

  public deleteLessonFromCourse(courseId: string, lessonId: string): Course | undefined {
    const course = this.getCourseById(courseId);
    if (!course) return undefined;
    for (const mod of course.modules) {
      mod.lessons = mod.lessons.filter(l => l.id !== lessonId);
    }
    course.updatedAt = new Date().toISOString();
    this.saveCourse(course);
    return course;
  }

  public updateCourseAssessment(courseId: string, assessment: CourseAssessment): Course | undefined {
    const course = this.getCourseById(courseId);
    if (!course) return undefined;
    course.assessment = assessment;
    course.passingPercentage = assessment.passingPercentage || 80;
    course.updatedAt = new Date().toISOString();
    this.saveCourse(course);
    return course;
  }

  // --- Matching Engine ---
  public calculateMatchScore(candidate: CandidateProfile, job: JobPost): number {
    let score = 20; // Base score
    const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());
    const candidateCerts = this.getCertificatesByCandidate(candidate.id).map(c => c.courseTitle.toLowerCase());

    // Skills match (up to 40 pts)
    if (job.requiredSkills && job.requiredSkills.length > 0) {
      const matchCount = job.requiredSkills.filter(req => candidateSkills.some(cs => cs.includes(req.toLowerCase()) || req.toLowerCase().includes(cs))).length;
      const skillRatio = matchCount / job.requiredSkills.length;
      score += Math.round(skillRatio * 40);
    } else {
      score += 25;
    }

    // Preferred certificates match (up to 15 pts)
    if (job.preferredCertificates && job.preferredCertificates.length > 0) {
      const certMatches = job.preferredCertificates.filter(reqCert => candidateCerts.some(cc => cc.includes(reqCert.toLowerCase()) || reqCert.toLowerCase().includes(cc))).length;
      score += Math.min(15, certMatches * 8);
    } else if (candidateCerts.length > 0) {
      score += 8;
    }

    // Location / City match (up to 15 pts)
    if (candidate.city && job.locationCity && candidate.city.toLowerCase() === job.locationCity.toLowerCase()) {
      score += 15;
    } else if (candidate.preferredLocations && candidate.preferredLocations.some(l => l.toLowerCase() === job.locationCity?.toLowerCase())) {
      score += 10;
    }

    // Experience match (up to 10 pts)
    const exp = candidate.totalExperienceYears || 0;
    if (exp >= job.experienceMinYears && exp <= (job.experienceMaxYears || 10) + 2) {
      score += 10;
    } else if (exp >= job.experienceMinYears) {
      score += 6;
    }

    return Math.min(99, Math.max(25, score));
  }

  // Get Top matched candidates for a job (e.g. Free reach = 25, Premium = 100)
  public getMatchedCandidatesForJob(jobId: string, limit: number = 25) {
    const job = this.getJobById(jobId);
    if (!job) return [];
    const candidates = this.getAllCandidates();
    const scored = candidates.map(c => ({
      candidate: c,
      matchScore: this.calculateMatchScore(c, job)
    }));
    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored.slice(0, limit);
  }

  // --- Haversine Distance Calculation ---
  public calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of earth in KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  // ==========================================================================
  // --- Dynamic Job Categories ---
  // ==========================================================================

  public getAllCategories(): DynamicJobCategory[] {
    return (this.data.job_categories || []).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public getActiveCategories(): DynamicJobCategory[] {
    return this.getAllCategories().filter(c => c.isActive !== false);
  }

  public getCategoryById(id: string): DynamicJobCategory | undefined {
    return (this.data.job_categories || []).find(c => c.id === id);
  }

  public saveCategory(category: DynamicJobCategory): DynamicJobCategory {
    if (!this.data.job_categories) this.data.job_categories = [];
    const idx = this.data.job_categories.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      this.data.job_categories[idx] = { ...this.data.job_categories[idx], ...category, updatedAt: new Date().toISOString() };
    } else {
      this.data.job_categories.push(category);
    }
    this.save();
    return category;
  }

  public deleteCategory(id: string): boolean {
    if (!this.data.job_categories) return false;
    const initialLen = this.data.job_categories.length;
    this.data.job_categories = this.data.job_categories.filter(c => c.id !== id);
    if (this.data.job_categories.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // ==========================================================================
  // --- State-Wise Government Vacancies ---
  // ==========================================================================

  public getAllGovtVacancies(): GovernmentVacancy[] {
    return [...(this.data.govt_vacancies || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getPublishedGovtVacancies(): GovernmentVacancy[] {
    return this.getAllGovtVacancies().filter(v => v.status === 'Published');
  }

  public getGovtVacancyById(id: string): GovernmentVacancy | undefined {
    return (this.data.govt_vacancies || []).find(v => v.id === id);
  }

  public incrementGovtVacancyViews(id: string): void {
    const vacancy = this.getGovtVacancyById(id);
    if (vacancy) {
      vacancy.viewsCount = (vacancy.viewsCount || 0) + 1;
      this.save();
    }
  }

  public saveGovtVacancy(vacancy: GovernmentVacancy): GovernmentVacancy {
    if (!this.data.govt_vacancies) this.data.govt_vacancies = [];
    const idx = this.data.govt_vacancies.findIndex(v => v.id === vacancy.id);
    if (idx >= 0) {
      this.data.govt_vacancies[idx] = { ...this.data.govt_vacancies[idx], ...vacancy, updatedAt: new Date().toISOString() };
    } else {
      this.data.govt_vacancies.push(vacancy);
    }
    this.save();
    return vacancy;
  }

  public deleteGovtVacancy(id: string): boolean {
    if (!this.data.govt_vacancies) return false;
    const initialLen = this.data.govt_vacancies.length;
    this.data.govt_vacancies = this.data.govt_vacancies.filter(v => v.id !== id);
    if (this.data.govt_vacancies.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Saved Government Jobs for Candidates ---
  public saveGovtJobForCandidate(candidateId: string, vacancyId: string): boolean {
    if (!this.data.saved_govt_jobs) this.data.saved_govt_jobs = [];
    const exists = this.data.saved_govt_jobs.some(
      s => s.candidateId === candidateId && s.vacancyId === vacancyId
    );
    if (!exists) {
      this.data.saved_govt_jobs.push({
        id: `sgj-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        candidateId,
        vacancyId,
        savedAt: new Date().toISOString()
      });
      this.save();
    }
    return true;
  }

  public unsaveGovtJobForCandidate(candidateId: string, vacancyId: string): boolean {
    if (!this.data.saved_govt_jobs) return false;
    const initial = this.data.saved_govt_jobs.length;
    this.data.saved_govt_jobs = this.data.saved_govt_jobs.filter(
      s => !(s.candidateId === candidateId && s.vacancyId === vacancyId)
    );
    if (this.data.saved_govt_jobs.length !== initial) {
      this.save();
      return true;
    }
    return false;
  }

  public getSavedGovtVacancyIds(candidateId: string): string[] {
    return (this.data.saved_govt_jobs || [])
      .filter(s => s.candidateId === candidateId)
      .map(s => s.vacancyId);
  }

  public getSavedGovtVacancies(candidateId: string): GovernmentVacancy[] {
    const ids = new Set(this.getSavedGovtVacancyIds(candidateId));
    return (this.data.govt_vacancies || []).filter(v => ids.has(v.id));
  }

  // --- Candidate Government Alert Preferences ---
  public getGovtAlertPreferences(userId: string): GovtJobAlertPreference | null {
    const entry = (this.data.govt_alert_preferences || []).find(p => p.userId === userId);
    return entry ? entry.preferences : null;
  }

  public saveGovtAlertPreferences(userId: string, preferences: GovtJobAlertPreference): void {
    if (!this.data.govt_alert_preferences) this.data.govt_alert_preferences = [];
    const idx = this.data.govt_alert_preferences.findIndex(p => p.userId === userId);
    if (idx >= 0) {
      this.data.govt_alert_preferences[idx] = {
        userId,
        preferences,
        updatedAt: new Date().toISOString()
      };
    } else {
      this.data.govt_alert_preferences.push({
        userId,
        preferences,
        updatedAt: new Date().toISOString()
      });
    }
    this.save();
  }

  // --- State & Profile Based Government Vacancy Matching Engine ---
  public getMatchedGovtVacanciesForUser(userId: string) {
    const candidate = this.getCandidateByUserId(userId) || this.getCandidateById(userId);
    const alertPrefs = this.getGovtAlertPreferences(userId);
    const allGovtJobs = this.getPublishedGovtVacancies();

    // Determine target states
    let targetStates: string[] = [];
    if (alertPrefs?.preferredStates && alertPrefs.preferredStates.length > 0) {
      targetStates = alertPrefs.preferredStates;
    } else if (alertPrefs?.states && alertPrefs.states.length > 0) {
      targetStates = alertPrefs.states;
    } else if (candidate?.state) {
      targetStates = [candidate.state, 'All India'];
    } else {
      targetStates = ['All India', 'Maharashtra'];
    }

    // Determine target education levels
    let targetEducation: string[] = [];
    if (alertPrefs?.preferredEducation && alertPrefs.preferredEducation.length > 0) {
      targetEducation = alertPrefs.preferredEducation;
    } else if (alertPrefs?.educationLevels && alertPrefs.educationLevels.length > 0) {
      targetEducation = alertPrefs.educationLevels;
    } else if (candidate?.highestQualification) {
      targetEducation = [candidate.highestQualification];
    } else {
      targetEducation = ['Graduate (BA/B.Sc/B.Com)', '12th Pass'];
    }

    // Determine target job types / departments
    let targetDepartments: string[] = [];
    if (alertPrefs?.preferredJobTypes && alertPrefs.preferredJobTypes.length > 0) {
      targetDepartments = alertPrefs.preferredJobTypes;
    } else if (alertPrefs?.categories && alertPrefs.categories.length > 0) {
      targetDepartments = alertPrefs.categories;
    } else if (alertPrefs?.departments && alertPrefs.departments.length > 0) {
      targetDepartments = alertPrefs.departments;
    } else {
      targetDepartments = ['Central', 'State', 'Police Bharti', 'Railway', 'Banking', 'Defense'];
    }

    // Helper: Map education string to rank number (1 to 5)
    const getEduRank = (eduStr: string): number => {
      const lower = (eduStr || '').toLowerCase();
      if (lower.includes('10th') || lower.includes('matric')) return 1;
      if (lower.includes('12th') || lower.includes('intermediate') || lower.includes('hsc')) return 2;
      if (lower.includes('iti') || lower.includes('diploma')) return 3;
      if (lower.includes('graduate') || lower.includes('degree') || lower.includes('b.tech') || lower.includes('ba') || lower.includes('b.sc') || lower.includes('b.com') || lower.includes('be')) return 4;
      if (lower.includes('post graduate') || lower.includes('master') || lower.includes('m.tech') || lower.includes('mba') || lower.includes('phd')) return 5;
      return 3;
    };

    // Candidate highest education rank
    const candidateEduRank = Math.max(
      ...targetEducation.map(e => getEduRank(e)),
      candidate?.highestQualification ? getEduRank(candidate?.highestQualification) : 4
    );

    const now = Date.now();

    const scored = allGovtJobs.map(vacancy => {
      let score = 25; // Base qualification score
      const matchReasons: string[] = [];
      let isStateMatch = false;
      let isEducationMatch = false;
      let isDepartmentMatch = false;

      // 1. STATE MATCHING
      const vacState = (vacancy.state || '').toLowerCase();
      const isAllIndia = vacState === 'all india' || vacState === 'pan india' || vacState === 'central';
      const hasSpecificStateMatch = targetStates.some(ts => {
        const lowerTs = ts.toLowerCase();
        if (lowerTs === 'all india') return false;
        return vacState.includes(lowerTs) || lowerTs.includes(vacState);
      });

      if (hasSpecificStateMatch) {
        score += 40;
        isStateMatch = true;
        matchReasons.push(`State Match: ${vacancy.state}`);
      } else if (isAllIndia) {
        score += 30;
        isStateMatch = true;
        matchReasons.push('Pan-India / Central Vacancy');
      } else if (targetStates.includes('All India')) {
        score += 15;
        matchReasons.push(`${vacancy.state} State Opening`);
      }

      // 2. EDUCATION MATCHING
      const jobMinEduRank = getEduRank(vacancy.minEducation);
      const isExactEdu = targetEducation.some(te => {
        const lowerTe = te.toLowerCase();
        const lowerMin = (vacancy.minEducation || '').toLowerCase();
        return lowerMin.includes(lowerTe) || lowerTe.includes(lowerMin);
      });

      if (isExactEdu) {
        score += 25;
        isEducationMatch = true;
        matchReasons.push(`Qualification Match: ${vacancy.minEducation}`);
      } else if (candidateEduRank >= jobMinEduRank) {
        score += 20;
        isEducationMatch = true;
        matchReasons.push(`Eligible (Req: ${vacancy.minEducation})`);
      } else {
        score -= 10;
      }

      // 3. DEPARTMENT / JOB TYPE MATCHING
      const jobTypeLower = (vacancy.jobType || '').toLowerCase();
      const deptLower = (vacancy.department || '').toLowerCase();
      const hasDeptMatch = targetDepartments.some(td => {
        const lowerTd = td.toLowerCase();
        return jobTypeLower.includes(lowerTd) || lowerTd.includes(jobTypeLower) || deptLower.includes(lowerTd);
      });

      if (hasDeptMatch) {
        score += 15;
        isDepartmentMatch = true;
        matchReasons.push(`Sector: ${vacancy.jobType || vacancy.department}`);
      }

      // 4. DEADLINE / URGENCY
      let daysLeft = 30;
      let isClosingSoon = false;
      if (vacancy.applicationLastDate) {
        const lastDateTime = new Date(vacancy.applicationLastDate).getTime();
        daysLeft = Math.ceil((lastDateTime - now) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 7 && daysLeft >= 0) {
          isClosingSoon = true;
          score += 5;
          matchReasons.push(`⏰ Closing in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`);
        } else if (daysLeft < 0) {
          score -= 30; // Expired
        }
      }

      // Cap score between 30 and 99
      const finalScore = Math.min(99, Math.max(30, score));

      return {
        vacancy,
        matchScore: finalScore,
        matchReasons,
        isStateMatch,
        isEducationMatch,
        isDepartmentMatch,
        isClosingSoon,
        daysLeft: Math.max(0, daysLeft)
      };
    });

    // Sort by match score (highest first), then by daysLeft
    scored.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return a.daysLeft - b.daysLeft;
    });

    const stateSpecificCount = scored.filter(s => s.isStateMatch && s.vacancy.state.toLowerCase() !== 'all india').length;
    const centralCount = scored.filter(s => s.vacancy.state.toLowerCase() === 'all india').length;
    const closingSoonCount = scored.filter(s => s.isClosingSoon).length;

    return {
      matchedVacancies: scored,
      stats: {
        totalMatched: scored.length,
        stateSpecificCount,
        centralCount,
        closingSoonCount,
        userPreferences: {
          states: targetStates,
          educationLevels: targetEducation,
          departments: targetDepartments,
          inferredState: candidate?.state,
          inferredEducation: candidate?.highestQualification,
          alertEnabled: alertPrefs?.alertEnabled ?? true
        }
      }
    };
  }

  // --- Auto-trigger in-app Notifications for Matched Government Jobs ---
  public triggerGovtJobNotificationsForUser(userId: string) {
    const result = this.getMatchedGovtVacanciesForUser(userId);
    const topMatches = result.matchedVacancies.filter(m => m.matchScore >= 80).slice(0, 3);
    const existingNotifs = this.getNotificationsByUser(userId);

    let createdCount = 0;
    topMatches.forEach(item => {
      const v = item.vacancy;
      const alreadyNotified = existingNotifs.some(
        n => n.type === 'govt_job' && n.targetUrl?.includes(v.id)
      );

      if (!alreadyNotified) {
        const newNotif: NotificationItem = {
          id: `notif-govt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          userId,
          title: `🎯 Govt Job Alert: ${v.title}`,
          titleHi: `🎯 सरकारी भर्ती अलर्ट: ${v.titleHi || v.title}`,
          message: `${v.department} has announced ${v.totalVacancies.toLocaleString('en-IN')} posts for ${v.postName}. Matches your state (${v.state}) & qualification.`,
          messageHi: `${v.departmentHi || v.department} ने ${v.postName} के लिए ${v.totalVacancies.toLocaleString('en-IN')} पदों की भर्ती निकाली है। आपकी योग्यता और राज्य (${v.state}) से सुमेलित है।`,
          type: 'govt_job',
          targetUrl: `/candidate?tab=govt-jobs&id=${v.id}`,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        this.createNotification(newNotif);
        createdCount++;
      }
    });

    return { success: true, createdCount, totalMatches: result.matchedVacancies.length };
  }

  // --- Master Admin Auth & Setup Persistence ---
  public getAdminAuth(): { email: string; passwordHash: string; fullName?: string; updatedAt: string } | undefined {
    return this.data.admin_auth;
  }

  public setAdminAuth(auth: { email: string; passwordHash: string; fullName?: string }) {
    this.data.admin_auth = {
      email: auth.email.trim(),
      passwordHash: auth.passwordHash.trim(),
      fullName: auth.fullName?.trim() || 'Master Admin',
      updatedAt: new Date().toISOString()
    };
    this.save();
  }

  public isMasterAdminConfigured(): boolean {
    if (process.env.ADMIN_EMAIL && (process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET)) {
      return true;
    }
    return !!(this.data.admin_auth && this.data.admin_auth.email && this.data.admin_auth.passwordHash);
  }
}

export const db = new DatabaseEngine();
