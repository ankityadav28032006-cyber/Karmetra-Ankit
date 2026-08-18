// Strongly-typed API client for KarMetra
import { DOMAIN_CONFIG } from '../utils/domainConfig';

// Resolves dynamically from VITE_API_BASE_URL or DOMAIN_CONFIG or relative '/api'
const metaEnv = (import.meta as any)?.env || {};
const BASE_URL = metaEnv.VITE_API_BASE_URL || DOMAIN_CONFIG.apiBaseUrl || '/api';


export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('karmetra_auth_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string> || {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !endpoint.startsWith('/auth/admin-login') && !endpoint.startsWith('/auth/verify-otp')) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('karmetra_auth_expired'));
      }
    }
    throw new ApiError(data.error || `HTTP ${response.status} error`, response.status, data);
  }

  return data as T;
}

export const api = {
  // Generic HTTP helpers
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) => 
    request<T>(endpoint, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: any) => 
    request<T>(endpoint, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

  // Auth
  getOtpConfig: () =>
    request<{ appEnv: 'development' | 'production'; isDevelopment: boolean; cooldownSeconds: number; expiresInSeconds: number }>('/auth/otp-config'),

  sendOtp: (mobile: string, role: string) => 
    request<{
      success: boolean;
      message: string;
      mobile: string;
      provider: string;
      isDevelopment: boolean;
      cooldownSeconds: number;
      expiresInSeconds: number;
      devOtp?: string;
    }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile, role })
    }),

  verifyOtp: (mobile: string, otp: string, role: string) =>
    request<{ success: boolean; token: string; user: any; profile: any; isNewUser: boolean }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile, otp, role })
    }),

  logout: () =>
    request<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST'
    }),

  getAdminSetupStatus: () =>
    request<{ isConfigured: boolean; adminEmail: string | null }>('/auth/admin-setup-status'),

  adminSetup: (data: { email: string; password: string; fullName?: string }) => {
    return request<{ success: boolean; message: string; token: string; user: any }>('/auth/admin-setup', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  adminLogin: (credentials: { email?: string; username?: string; password?: string }) => {
    return request<{ success: boolean; token: string; user: any }>('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  getMe: () => request<{ user: any; profile: any }>('/auth/me'),

  deleteAccount: () => request<{ success: boolean; message: string }>('/auth/delete-account', { method: 'POST' }),

  // Candidate
  getCandidateProfile: () => request<{ profile: any }>('/candidate/profile'),
  updateCandidateProfile: (profile: any) =>
    request<{ success: boolean; profile: any }>('/candidate/profile', {
      method: 'POST',
      body: JSON.stringify(profile)
    }),

  uploadCandidatePhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await fetch(`${BASE_URL}/candidate/upload-photo`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.error || 'Photo upload failed', response.status, data);
    return data as { success: boolean; avatarUrl: string; fileName: string; message: string };
  },

  uploadCandidatePhotoBase64: (base64Data: string, filename?: string) =>
    request<{ success: boolean; avatarUrl: string; fileName: string; message: string }>('/candidate/upload-photo-base64', {
      method: 'POST',
      body: JSON.stringify({ base64Data, filename })
    }),

  deleteCandidatePhoto: () =>
    request<{ success: boolean; message: string }>('/candidate/photo', {
      method: 'DELETE'
    }),

  uploadResume: async (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await fetch(`${BASE_URL}/candidate/upload-resume`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.error || 'Upload failed', response.status, data);
    return data;
  },

  uploadMedia: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media', file);
    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.error || 'Upload failed', response.status, data);
    return data;
  },
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.error || 'Upload failed', response.status, data);
    return data;
  },

  getSavedJobs: () => request<{ savedJobIds: string[]; jobs: any[] }>('/candidate/saved-jobs'),
  toggleSaveJob: (jobId: string) =>
    request<{ success: boolean; isSaved: boolean; jobId: string }>('/candidate/saved-jobs/toggle', {
      method: 'POST',
      body: JSON.stringify({ jobId })
    }),

  getCandidateApplications: () => request<{ applications: any[] }>('/candidate/applications'),
  applyJob: (jobId: string, coverMessage?: string, answers?: Record<string, string>) =>
    request<{ success: boolean; application: any }>('/candidate/applications/apply', {
      method: 'POST',
      body: JSON.stringify({ jobId, coverMessage, answers })
    }),

  getCandidateInterviews: () => request<{ interviews: any[] }>('/candidate/interviews'),
  getCandidateCertificates: () => request<{ certificates: any[] }>('/candidate/certificates'),
  getCandidateCourses: () => request<{ courses: any[] }>('/candidate/learning/courses'),
  updateLearningProgress: (courseId: string, lessonId?: string, moduleId?: string) =>
    request<{ success: boolean; progress: any }>('/candidate/learning/progress', {
      method: 'POST',
      body: JSON.stringify({ courseId, lessonId, moduleId })
    }),
  updateCourseProgress: (courseId: string, lessonId?: string, moduleId?: string) =>
    request<{ success: boolean; progress: any }>('/candidate/learning/progress', {
      method: 'POST',
      body: JSON.stringify({ courseId, lessonId, moduleId })
    }),

  submitAssessment: (courseId: string, answers: Record<string, number>) =>
    request<{ success: boolean; isPassed: boolean; score: number; totalMarks: number; percentage: number; attempt: any; certificate?: any }>(
      '/candidate/learning/assessments/submit',
      {
        method: 'POST',
        body: JSON.stringify({ courseId, answers })
      }
    ),

  // Employer
  getEmployerProfile: () => request<{ profile: any }>('/employer/profile'),
  updateEmployerProfile: (profile: any) =>
    request<{ success: boolean; profile: any }>('/employer/profile', {
      method: 'POST',
      body: JSON.stringify(profile)
    }),

  uploadEmployerDoc: async (file: File, docType: string) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('docType', docType);
    const response = await fetch(`${BASE_URL}/employer/upload-document`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.error || 'Upload failed', response.status, data);
    return data;
  },

  getEmployerStats: () => request<any>('/employer/dashboard-stats'),
  getEmployerJobs: () => request<{ jobs: any[] }>('/employer/jobs'),
  createOrUpdateJob: (job: any) =>
    request<{ 
      success: boolean; 
      job: any; 
      requiresPayment?: boolean; 
      isFreeQuota?: boolean; 
      order?: any; 
      razorpayOrder?: any; 
      pricing?: any;
      message?: string;
    }>('/employer/jobs', {
      method: 'POST',
      body: JSON.stringify(job)
    }),
  createJobPost: (job: any) =>
    request<{ 
      success: boolean; 
      job: any; 
      requiresPayment?: boolean; 
      isFreeQuota?: boolean; 
      order?: any; 
      razorpayOrder?: any; 
      pricing?: any;
      message?: string;
    }>('/employer/jobs', {
      method: 'POST',
      body: JSON.stringify(job)
    }),
  updateJobStatus: (id: string, status: string) =>
    request<{ success: boolean; job: any }>(`/employer/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  getEmployerApplicants: () => request<{ applicants: any[] }>('/employer/applicants'),
  updateApplicationStatus: (id: string, status: string, note?: string) =>
    request<{ success: boolean; application: any }>(`/employer/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note })
    }),

  scheduleInterview: (interviewData: any) =>
    request<{ success: boolean; interview: any }>('/employer/interviews/schedule', {
      method: 'POST',
      body: JSON.stringify(interviewData)
    }),

  searchCandidates: (params: Record<string, any>) => {
    const query = new URLSearchParams(params).toString();
    return request<{ candidates: any[]; total: number }>(`/employer/candidates/search?${query}`);
  },

  // Public & Shared
  getJobs: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ jobs: any[]; total: number }>(`/jobs?${query}`);
  },
  getJobDetails: (id: string) => request<{ job: any; employer: any }>(`/jobs/${id}`),

  getCourses: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ courses: any[]; total: number }>(`/courses?${query}`);
  },
  getCourseDetails: (id: string) => request<{ course: any }>(`/courses/${id}`),

  verifyCertificate: (code: string) => request<any>(`/certificates/verify/${code}`),
  getSkills: () => request<{ skills: string[] }>('/skills'),

  getNotifications: () => request<{ notifications: any[] }>('/notifications'),
  markNotificationRead: (id: string) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<{ success: boolean }>('/notifications/read-all', { method: 'PATCH' }),

  submitSupportTicket: (ticket: any) => request<any>('/support/tickets', { method: 'POST', body: JSON.stringify(ticket) }),
  submitReport: (report: any) => request<any>('/reports', { method: 'POST', body: JSON.stringify(report) }),

  // Admin
  getAdminStats: () => request<any>('/admin/overview-stats'),
  getAdminEmployers: () => request<{ employers: any[] }>('/admin/employers'),
  verifyEmployer: (id: string, status: string, reason?: string) =>
    request<any>(`/admin/employers/${id}/verify`, { method: 'POST', body: JSON.stringify({ status, reason }) }),

  getAdminJobs: () => request<{ jobs: any[] }>('/admin/jobs'),
  moderateJob: (id: string, status: string, adminFeedback?: string) =>
    request<any>(`/admin/jobs/${id}/moderate`, { method: 'POST', body: JSON.stringify({ status, adminFeedback }) }),

  getAdminCandidates: () => request<{ candidates: any[] }>('/admin/candidates'),
  getAdminCourses: () => request<{ courses: any[] }>('/admin/courses'),
  saveAdminCourse: (course: any) => request<any>('/admin/courses', { method: 'POST', body: JSON.stringify(course) }),
  deleteAdminCourse: (id: string) => request<any>(`/admin/courses/${id}`, { method: 'DELETE' }),
  duplicateAdminCourse: (id: string) => request<any>(`/admin/courses/${id}/duplicate`, { method: 'POST' }),
  publishAdminCourse: (id: string, isPublished: boolean) =>
    request<any>(`/admin/courses/${id}/publish`, { method: 'PATCH', body: JSON.stringify({ isPublished }) }),

  getAdminCertificates: () => request<{ certificates: any[] }>('/admin/certificates'),
  updateCertificateStatus: (id: string, status: string, reason?: string) =>
    request<any>(`/admin/certificates/${id}/status`, { method: 'POST', body: JSON.stringify({ status, reason }) }),

  getAdminTickets: () => request<{ tickets: any[] }>('/admin/support-tickets'),
  replyAdminTicket: (id: string, status: string, adminReply?: string) =>
    request<any>(`/admin/support-tickets/${id}`, { method: 'PATCH', body: JSON.stringify({ status, adminReply }) }),

  getAdminReports: () => request<{ reports: any[] }>('/admin/reports'),
  updateAdminReport: (id: string, status: string, adminActionTaken?: string) =>
    request<any>(`/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status, adminActionTaken }) }),

  broadcastNotification: (data: any) => request<any>('/admin/notifications/broadcast', { method: 'POST', body: JSON.stringify(data) }),
  getAdminAuditLogs: () => request<{ logs: any[] }>('/admin/audit-logs'),
  getAdminOtpConfig: () => request<{ config: any }>('/admin/otp-config'),
  runAdminOtpDiagnostics: () => request<{ report: any }>('/admin/otp-test-diagnostics', { method: 'POST' }),

  // Payments & Monetization
  getPaymentConfig: () => request<{ provider: string; keyId: string; isConfigured: boolean }>('/payments/config'),
  getPostingStatus: () => request<any>('/employer/posting-status'),
  createPaymentOrder: (data: { paymentType: 'job_posting' | 'certificate'; targetId?: string; title?: string; metadata?: any }) =>
    request<any>('/payments/create-order', { method: 'POST', body: JSON.stringify(data) }),
  createCertificatePaymentOrder: (courseId: string) =>
    request<any>('/candidate/learning/certificates/create-order', { method: 'POST', body: JSON.stringify({ courseId }) }),
  verifyPayment: (data: { 
    orderId: string; 
    razorpay_order_id?: string; 
    razorpay_payment_id?: string; 
    razorpay_signature?: string; 
    gatewayTransactionId?: string;
  }) =>
    request<{ success: boolean; verified: boolean; payment: any; invoice?: any; certificate?: any; message?: string }>('/payments/verify', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  getPaymentReceipt: (id: string) => request<{ success: boolean; payment: any; invoice: any }>(`/payments/receipt/${id}`),
  getMonetizationSettings: () => request<{ settings: any }>('/monetization/settings'),
  updateMonetizationSettings: (settings: any) =>
    request<{ success: boolean; settings: any }>('/monetization/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  getMonetizationStats: () => request<any>('/monetization/stats'),
  getAdminPayments: (params?: { status?: string; type?: string; search?: string }) => {
    const query = new URLSearchParams(params || {}).toString();
    return request<{ payments: any[]; total: number }>(`/admin/payments?${query}`);
  },
};

export const apiClient = api;

