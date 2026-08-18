import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { db } from './db';
import { OTPService } from './otp/OTPService';
import { OTPDiagnostics } from './otp/OTPDiagnostics';
import { generateToken, requireAuth, requireRole, requireAdminRole, optionalAuth, AuthenticatedRequest } from './authMiddleware';
import { razorpayService } from './razorpayService';
import { 
  getAdminAuthConfig, 
  verifyPasswordHash, 
  hashPassword,
  isRateLimited, 
  recordFailedAttempt, 
  resetFailedAttempts 
} from './adminAuth';
import {
  User, CandidateProfile, EmployerProfile, JobPost, JobApplication,
  Interview, Certificate, CourseProgress, AssessmentAttempt, UserRole, Course,
  ResumeData, PaymentRecord, PaymentInvoiceData, MonetizationSettings, CourseLesson, CourseAssessment
} from '../src/types';
import { INITIAL_SKILLS } from './seedData';

export const apiRouter = Router();

// Configure Multer for secure local file storage
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max limit
});

const photoUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for photos
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG and WEBP image formats are allowed'));
    }
  }
});

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// ============================================================================
// ============================================================================
// 1. AUTH & OTP APIS (SAFE DEVELOPMENT & PRODUCTION OTP ARCHITECTURE)
// ============================================================================

// GET /api/auth/otp-config (Public config - no secrets)
apiRouter.get('/auth/otp-config', (_req, res) => {
  const otpService = OTPService.getInstance();
  const config = otpService.getConfig();
  res.json({
    appEnv: config.appEnv,
    isDevelopment: config.appEnv === 'development' && config.otpDemoMode,
    cooldownSeconds: config.otpResendCooldownSeconds,
    expiresInSeconds: config.otpExpirySeconds
  });
});

// POST /api/auth/send-otp
apiRouter.post('/auth/send-otp', async (req, res) => {
  try {
    const { mobile, role } = req.body;

    if (!mobile || !role || !['candidate', 'employer'].includes(role)) {
      return res.status(400).json({ error: 'Valid 10-digit mobile number and role are required' });
    }

    const cleanMobile = mobile.toString().replace(/\D/g, '').slice(-10);
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const otpService = OTPService.getInstance();
    const sendResult = await otpService.sendOTP(cleanMobile, role as UserRole, clientIp);

    res.json({
      success: true,
      message: sendResult.message,
      mobile: sendResult.mobile,
      provider: sendResult.provider,
      isDevelopment: sendResult.isDevelopment,
      cooldownSeconds: sendResult.cooldownSeconds,
      expiresInSeconds: sendResult.expiresInSeconds,
      // devOtp is populated ONLY when appEnv === 'development' and otpDemoMode === true
      devOtp: sendResult.devOtp
    });
  } catch (err: any) {
    console.error('[Send OTP Error]:', err.message);
    const status = err.message.includes('wait') || err.message.includes('Too many') ? 429 : 400;
    res.status(status).json({ error: err.message || 'Failed to send OTP. Please try again.' });
  }
});

// POST /api/auth/verify-otp
apiRouter.post('/auth/verify-otp', (req, res) => {
  try {
    const { mobile, otp, role } = req.body;

    if (!mobile || !otp || !role) {
      return res.status(400).json({ error: 'Mobile number, OTP, and role are required' });
    }

    const cleanMobile = mobile.toString().replace(/\D/g, '').slice(-10);
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const otpService = OTPService.getInstance();
    otpService.verifyOTP(cleanMobile, otp, role as UserRole, clientIp);

    // Find or create user
    let user = db.getUserByMobileAndRole(cleanMobile, role as UserRole);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = db.createUser({
        id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        mobile: cleanMobile,
        role: role as UserRole,
        isRegistered: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    const token = generateToken(user);

    // Fetch associated profile
    let profile: CandidateProfile | EmployerProfile | undefined;
    if (role === 'candidate') {
      profile = db.getCandidateByUserId(user.id);
    } else if (role === 'employer') {
      profile = db.getEmployerByUserId(user.id);
    }

    res.json({
      success: true,
      token,
      user,
      profile,
      isNewUser: !profile || !(profile as any).isProfileComplete
    });
  } catch (err: any) {
    console.error('[Verify OTP Error]:', err.message);
    res.status(400).json({ error: err.message || 'Verification failed. Please try again.' });
  }
});

// POST /api/auth/logout
apiRouter.post('/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.user) {
    db.logAdminAction(
      req.user.id,
      req.user.fullName || req.user.mobile,
      'USER_LOGOUT',
      'auth',
      req.user.id,
      `User ${req.user.mobile} (${req.user.role}) logged out successfully`
    );
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/admin-setup-status
apiRouter.get('/auth/admin-setup-status', (_req, res) => {
  const authConfig = getAdminAuthConfig();
  res.json({
    isConfigured: authConfig.isConfigured,
    adminEmail: authConfig.isConfigured ? authConfig.adminEmail : 'admin@karmetra.in'
  });
});

// POST /api/auth/admin-setup - One-Time Secure Master Admin Initialization
apiRouter.post('/auth/admin-setup', async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown-ip';
  const { email, password, fullName } = req.body;

  const currentConfig = getAdminAuthConfig();
  if (currentConfig.isConfigured) {
    return res.status(400).json({ 
      error: 'Master Admin account is already configured. One-time setup is disabled.' 
    });
  }

  const inputEmail = (email || '').trim();
  const inputPassword = (password || '').trim();
  const inputName = (fullName || 'Master Administrator').trim();

  // Validate Email
  if (!inputEmail || !inputEmail.includes('@') || !inputEmail.includes('.')) {
    return res.status(400).json({ error: 'Please enter a valid administrative email address.' });
  }

  // Validate Password: Minimum 8 characters
  if (!inputPassword || inputPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters in length.' });
  }

  try {
    // Generate secure bcrypt password hash (salt rounds 12)
    const passwordHash = await hashPassword(inputPassword);

    // Store ONLY the password hash and email on the backend database
    db.setAdminAuth({
      email: inputEmail,
      passwordHash,
      fullName: inputName
    });

    // Populate process.env for runtime synchronization
    process.env.ADMIN_EMAIL = inputEmail;
    process.env.ADMIN_PASSWORD_HASH = passwordHash;

    // Create or update Master Admin user record
    let adminUser = db.getUserById('admin-master-01');
    if (!adminUser) {
      adminUser = {
        id: 'admin-master-01',
        mobile: '9999999999',
        role: 'admin',
        adminRole: 'MASTER_ADMIN',
        fullName: inputName,
        email: inputEmail,
        isRegistered: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.createUser(adminUser);
    } else {
      adminUser.role = 'admin';
      adminUser.adminRole = 'MASTER_ADMIN';
      adminUser.email = inputEmail;
      adminUser.fullName = inputName;
      adminUser.isActive = true;
      adminUser.updatedAt = new Date().toISOString();
      db.updateUser(adminUser.id, adminUser);
    }

    // Reset rate limiting
    resetFailedAttempts(clientIp);
    resetFailedAttempts(inputEmail);

    // Log admin audit action (NEVER logging plaintext password or hash)
    db.logAdminAction(
      adminUser.id,
      adminUser.fullName || 'Master Admin',
      'MASTER_ADMIN_SETUP_INITIALIZED',
      'auth',
      adminUser.id,
      `Master Administrator account (${inputEmail}) initialized with bcrypt password hash from IP ${clientIp}`
    );

    // Generate authenticated 30-day JWT session token
    const token = generateToken(adminUser, 30 * 24 * 60 * 60 * 1000);

    // Return success without exposing the plaintext password or password hash
    res.json({
      success: true,
      message: 'Master Admin account initialized successfully.',
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        fullName: adminUser.fullName,
        role: adminUser.role,
        adminRole: adminUser.adminRole,
        mobile: adminUser.mobile
      }
    });
  } catch (err: any) {
    console.error('Error during Master Admin setup:', err);
    res.status(500).json({ error: 'Failed to initialize Master Admin credentials. Please try again.' });
  }
});

// POST /api/auth/admin-login
apiRouter.post('/auth/admin-login', async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown-ip';
  const { username, email, password } = req.body;

  const authConfig = getAdminAuthConfig();
  if (!authConfig.isConfigured) {
    return res.status(500).json({ 
      error: 'Admin authentication is not configured. Please configure the required server environment variables.' 
    });
  }

  const inputEmail = (email || username || '').trim();
  const inputPassword = (password || '').trim();

  // Rate Limiting Check
  const ipLock = isRateLimited(clientIp);
  const emailLock = inputEmail ? isRateLimited(inputEmail) : { isLocked: false };

  if (ipLock.isLocked || emailLock.isLocked) {
    const remaining = Math.max(ipLock.remainingSeconds || 0, emailLock.remainingSeconds || 0);
    return res.status(429).json({ 
      error: `Too many failed login attempts. Access is locked for security. Please try again in ${remaining} seconds.` 
    });
  }

  if (!inputEmail || !inputPassword) {
    recordFailedAttempt(clientIp);
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  // Strict email check against configured ADMIN_EMAIL
  const isEmailMatch = inputEmail.toLowerCase() === authConfig.adminEmail!.toLowerCase();
  
  // Verify password hash / secret
  const isPasswordValid = isEmailMatch && await verifyPasswordHash(
    inputPassword, 
    authConfig.passwordHash || authConfig.adminSecret
  );

  if (!isEmailMatch || !isPasswordValid) {
    const ipRecord = recordFailedAttempt(clientIp);
    recordFailedAttempt(inputEmail);

    // Audit log failed attempt (NEVER logging passwords or hashes)
    db.logAdminAction(
      'unauthenticated',
      'Security Gatekeeper',
      'ADMIN_LOGIN_FAILED',
      'auth',
      inputEmail,
      `Failed admin login attempt for ${inputEmail} from IP ${clientIp} (${ipRecord.attemptsLeft} attempts remaining)`
    );

    if (ipRecord.locked) {
      return res.status(429).json({ 
        error: 'Too many failed login attempts. Account access is temporarily locked for 15 minutes.' 
      });
    }

    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  // Reset rate limiting on successful login
  resetFailedAttempts(clientIp);
  resetFailedAttempts(inputEmail);

  // Retrieve or create authenticated Master Admin profile
  let adminUser = db.getUserById('admin-master-01');
  if (!adminUser) {
    adminUser = {
      id: 'admin-master-01',
      mobile: '9999999999',
      role: 'admin',
      adminRole: 'MASTER_ADMIN',
      fullName: 'Master Admin',
      email: authConfig.adminEmail!,
      isRegistered: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.createUser(adminUser);
  } else {
    adminUser.role = 'admin';
    adminUser.adminRole = 'MASTER_ADMIN';
    adminUser.email = authConfig.adminEmail!;
    adminUser.isActive = true;
    adminUser.updatedAt = new Date().toISOString();
    db.updateUser(adminUser.id, adminUser);
  }

  // Generate authenticated JWT session token (30 days validity)
  const token = generateToken(adminUser, 30 * 24 * 60 * 60 * 1000);

  // Audit log successful authentication
  db.logAdminAction(
    adminUser.id,
    adminUser.fullName || 'Master Admin',
    'ADMIN_LOGIN_SUCCESS',
    'auth',
    adminUser.id,
    `MASTER_ADMIN (${adminUser.email}) authenticated successfully into Admin Console from IP ${clientIp}`
  );

  res.json({
    success: true,
    token,
    user: {
      id: adminUser.id,
      email: adminUser.email,
      fullName: adminUser.fullName,
      role: adminUser.role,
      adminRole: adminUser.adminRole,
      mobile: adminUser.mobile
    }
  });
});

// GET /api/auth/me
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  let profile: CandidateProfile | EmployerProfile | undefined;

  if (user.role === 'candidate') {
    profile = db.getCandidateByUserId(user.id);
  } else if (user.role === 'employer') {
    profile = db.getEmployerByUserId(user.id);
  }

  res.json({
    user,
    profile
  });
});

// POST /api/auth/delete-account
apiRouter.post('/auth/delete-account', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  // Anonymize user records per security instructions
  db.updateUser(user.id, {
    fullName: 'Deleted User',
    isActive: false,
    email: undefined
  });

  if (user.role === 'candidate') {
    const candidate = db.getCandidateByUserId(user.id);
    if (candidate) {
      db.saveCandidateProfile({
        ...candidate,
        fullName: 'Anonymous Candidate',
        email: 'deleted@karmetra.internal',
        mobile: '0000000000',
        resumeUrl: undefined,
        resumeFileName: undefined
      });
    }
  }

  res.json({ success: true, message: 'Account successfully anonymized and deactivated' });
});

// ============================================================================
// 2. CANDIDATE APIS
// ============================================================================

// GET /api/candidate/profile
apiRouter.get('/candidate/profile', optionalAuth, (req: AuthenticatedRequest, res) => {
  if (!req.user || req.user.role !== 'candidate') {
    return res.json({ profile: null });
  }
  const profile = db.getCandidateByUserId(req.user.id);
  res.json({ profile: profile || null });
});

// POST /api/candidate/profile
apiRouter.post('/candidate/profile', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const body = req.body;
    const existing = db.getCandidateByUserId(user.id);

    const profileId = existing?.id || `cand-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const updatedProfile: CandidateProfile = {
      id: profileId,
      userId: user.id,
      fullName: body.fullName || existing?.fullName || user.fullName || 'Candidate',
      email: body.email || existing?.email || '',
      mobile: user.mobile,
      avatarUrl: body.avatarUrl || existing?.avatarUrl,
      dob: body.dob || existing?.dob,
      gender: body.gender || existing?.gender,
      city: body.city || existing?.city || 'Bengaluru',
      state: body.state || existing?.state || 'Karnataka',
      latitude: body.latitude ?? existing?.latitude ?? 12.9716,
      longitude: body.longitude ?? existing?.longitude ?? 77.5946,
      experienceType: body.experienceType || existing?.experienceType || 'Fresher',
      totalExperienceYears: Number(body.totalExperienceYears ?? existing?.totalExperienceYears ?? 0),
      currentDesignation: body.currentDesignation || existing?.currentDesignation || '',
      industry: body.industry || existing?.industry || '',
      expectedSalaryMin: Number(body.expectedSalaryMin ?? existing?.expectedSalaryMin ?? 25000),
      expectedSalaryMax: Number(body.expectedSalaryMax ?? existing?.expectedSalaryMax ?? 45000),
      preferredJobTypes: body.preferredJobTypes || existing?.preferredJobTypes || ['Full-Time'],
      preferredWorkModes: body.preferredWorkModes || existing?.preferredWorkModes || ['In-Office', 'Hybrid'],
      preferredLocations: body.preferredLocations || existing?.preferredLocations || [body.city || 'Bengaluru'],
      highestQualification: body.highestQualification || existing?.highestQualification || 'Graduate',
      degreeName: body.degreeName || existing?.degreeName || '',
      institute: body.institute || existing?.institute || '',
      passingYear: Number(body.passingYear ?? existing?.passingYear ?? 2024),
      skills: body.skills || existing?.skills || [],
      resumeUrl: body.resumeUrl || existing?.resumeUrl,
      resumeFileName: body.resumeFileName || existing?.resumeFileName,
      resumeUpdatedAt: existing?.resumeUpdatedAt,
      isProfileComplete: true,
      privacyShowPhone: body.privacyShowPhone !== undefined ? body.privacyShowPhone : (existing?.privacyShowPhone ?? true),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.saveCandidateProfile(updatedProfile);
    db.updateUser(user.id, { isRegistered: true, fullName: updatedProfile.fullName, email: updatedProfile.email });

    res.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    console.error('Save candidate profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/candidate/upload-photo & /api/profile/upload-photo
const handlePhotoUploadRoute = (req: AuthenticatedRequest, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    let profile = db.getCandidateByUserId(user.id);
    if (!profile) {
      profile = {
        id: `cand-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        userId: user.id,
        fullName: user.fullName || 'Candidate',
        email: user.email || '',
        mobile: user.mobile,
        avatarUrl: fileUrl,
        city: 'Bengaluru',
        state: 'Karnataka',
        experienceType: 'Fresher',
        totalExperienceYears: 0,
        currentDesignation: '',
        industry: '',
        expectedSalaryMin: 25000,
        expectedSalaryMax: 45000,
        preferredJobTypes: ['Full-Time'],
        preferredWorkModes: ['In-Office', 'Hybrid'],
        preferredLocations: ['Bengaluru'],
        highestQualification: 'Graduate',
        degreeName: 'Bachelor Degree',
        institute: 'University',
        passingYear: 2024,
        skills: [],
        isProfileComplete: false,
        privacyShowPhone: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      profile.avatarUrl = fileUrl;
      profile.updatedAt = new Date().toISOString();
    }

    db.saveCandidateProfile(profile);
    db.updateUser(user.id, { avatarUrl: fileUrl });

    res.json({
      success: true,
      avatarUrl: fileUrl,
      fileName: req.file.originalname,
      message: 'Profile photo uploaded successfully'
    });
  } catch (err: any) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload profile photo' });
  }
};

apiRouter.post('/candidate/upload-photo', requireAuth, photoUpload.single('photo'), handlePhotoUploadRoute);
apiRouter.post('/profile/upload-photo', requireAuth, photoUpload.single('photo'), handlePhotoUploadRoute);

// POST /api/candidate/upload-photo-base64 (Live camera snapshots & cropped photos)
apiRouter.post(['/candidate/upload-photo-base64', '/profile/upload-photo-base64'], requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { base64Data, filename } = req.body;
    if (!base64Data || typeof base64Data !== 'string') {
      return res.status(400).json({ error: 'Missing image data' });
    }

    const matches = base64Data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image format. Must be a base64 encoded image.' });
    }

    const rawExt = matches[1].toLowerCase();
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
    const allowed = ['jpg', 'jpeg', 'png', 'webp'];
    if (!allowed.includes(ext)) {
      return res.status(400).json({ error: 'Only JPG, PNG, and WEBP formats are supported.' });
    }

    const buffer = Buffer.from(matches[2], 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image size exceeds maximum limit of 5MB.' });
    }

    const uniqueName = `photo-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueName);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;
    const user = req.user!;
    let profile = db.getCandidateByUserId(user.id);
    if (!profile) {
      profile = {
        id: `cand-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        userId: user.id,
        fullName: user.fullName || 'Candidate',
        email: user.email || '',
        mobile: user.mobile,
        avatarUrl: fileUrl,
        city: 'Bengaluru',
        state: 'Karnataka',
        experienceType: 'Fresher',
        totalExperienceYears: 0,
        currentDesignation: '',
        industry: '',
        expectedSalaryMin: 25000,
        expectedSalaryMax: 45000,
        preferredJobTypes: ['Full-Time'],
        preferredWorkModes: ['In-Office', 'Hybrid'],
        preferredLocations: ['Bengaluru'],
        highestQualification: 'Graduate',
        degreeName: 'Bachelor Degree',
        institute: 'University',
        passingYear: 2024,
        skills: [],
        isProfileComplete: false,
        privacyShowPhone: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      profile.avatarUrl = fileUrl;
      profile.updatedAt = new Date().toISOString();
    }

    db.saveCandidateProfile(profile);
    db.updateUser(user.id, { avatarUrl: fileUrl });

    res.json({
      success: true,
      avatarUrl: fileUrl,
      fileName: filename || uniqueName,
      message: 'Photo captured and saved successfully'
    });
  } catch (err: any) {
    console.error('Base64 photo upload error:', err);
    res.status(500).json({ error: 'Failed to process camera photo' });
  }
});

// DELETE /api/candidate/photo & /api/profile/photo
const handlePhotoDeleteRoute = (req: AuthenticatedRequest, res: any) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = db.getCandidateByUserId(user.id);
    if (profile && profile.avatarUrl) {
      if (profile.avatarUrl.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), profile.avatarUrl.substring(1));
        if (fs.existsSync(localPath)) {
          try { fs.unlinkSync(localPath); } catch {}
        }
      }
      profile.avatarUrl = '';
      profile.updatedAt = new Date().toISOString();
      db.saveCandidateProfile(profile);
    }

    db.updateUser(user.id, { avatarUrl: '' });
    res.json({ success: true, message: 'Profile photo removed successfully' });
  } catch (err: any) {
    console.error('Photo delete error:', err);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
};

apiRouter.delete('/candidate/photo', requireAuth, handlePhotoDeleteRoute);
apiRouter.delete('/profile/photo', requireAuth, handlePhotoDeleteRoute);

// POST /api/candidate/upload-resume
apiRouter.post('/candidate/upload-resume', requireAuth, requireRole('candidate'), upload.single('resume'), (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    const user = req.user!;
    const profile = db.getCandidateByUserId(user.id);
    if (!profile) {
      return res.status(400).json({ error: 'Profile must be initialized before uploading resume' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    profile.resumeUrl = fileUrl;
    profile.resumeFileName = req.file.originalname;
    profile.resumeUpdatedAt = new Date().toISOString();

    db.saveCandidateProfile(profile);

    res.json({
      success: true,
      resumeUrl: fileUrl,
      resumeFileName: req.file.originalname,
      message: 'Resume uploaded successfully'
    });
  } catch (err: any) {
    console.error('Resume upload error:', err);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
});

// GET /api/candidate/saved-jobs
apiRouter.get('/candidate/saved-jobs', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  const profile = db.getCandidateByUserId(req.user!.id);
  if (!profile) return res.json({ savedJobIds: [], jobs: [] });

  const savedJobIds = db.getSavedJobs(profile.id);
  const jobs = db.getAllJobs().filter(j => savedJobIds.includes(j.id));
  res.json({ savedJobIds, jobs });
});

// POST /api/candidate/saved-jobs/toggle
apiRouter.post('/candidate/saved-jobs/toggle', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  const { jobId } = req.body;
  const profile = db.getCandidateByUserId(req.user!.id);
  if (!profile || !jobId) return res.status(400).json({ error: 'Invalid request' });

  const isSaved = db.toggleSavedJob(profile.id, jobId);
  res.json({ success: true, isSaved, jobId });
});

// GET /api/candidate/applications
apiRouter.get('/candidate/applications', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  const profile = db.getCandidateByUserId(req.user!.id);
  if (!profile) return res.json({ applications: [] });

  const apps = db.getApplicationsByCandidate(profile.id);
  const enriched = apps.map(app => {
    const job = db.getJobById(app.jobId);
    const employer = db.getEmployerById(app.employerId);
    const interviews = db.getInterviewsByCandidate(profile.id).filter(i => i.applicationId === app.id);
    return {
      ...app,
      job,
      employer,
      interviews
    };
  });

  res.json({ applications: enriched });
});

// POST /api/candidate/applications/apply
apiRouter.post('/candidate/applications/apply', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  try {
    const { jobId, coverMessage, answers } = req.body;
    const profile = db.getCandidateByUserId(req.user!.id);

    if (!profile) {
      return res.status(400).json({ error: 'Please complete your candidate profile before applying' });
    }

    const job = db.getJobById(jobId);
    if (!job || job.status !== 'Active') {
      return res.status(400).json({ error: 'Job is not open for applications' });
    }

    // Check if already applied
    const existing = db.getApplicationsByCandidate(profile.id).find(a => a.jobId === jobId);
    if (existing) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    // Calculate match score
    const matchScore = db.calculateMatchScore(profile, job);

    const application: JobApplication = {
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      jobId: job.id,
      candidateId: profile.id,
      employerId: job.employerId,
      status: 'Applied',
      statusHistory: [
        {
          status: 'Applied',
          updatedAt: new Date().toISOString(),
          note: 'Application submitted by candidate'
        }
      ],
      resumeUrl: profile.resumeUrl || '',
      coverMessage,
      answers,
      matchScore,
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.saveApplication(application);

    // Send real-time notification to employer
    const employer = db.getEmployerById(job.employerId);
    if (employer) {
      db.createNotification({
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId: employer.userId,
        title: `New Application for ${job.title}`,
        titleHi: `${job.title} के लिए नया आवेदन प्राप्त हुआ`,
        message: `${profile.fullName} applied for ${job.title} (Match Score: ${matchScore}%)`,
        messageHi: `${profile.fullName} ने ${job.title} पद के लिए आवेदन किया है।`,
        type: 'application',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    res.json({ success: true, application });
  } catch (err: any) {
    console.error('Apply job error:', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// GET /api/candidate/interviews
apiRouter.get('/candidate/interviews', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  const profile = db.getCandidateByUserId(req.user!.id);
  if (!profile) return res.json({ interviews: [] });

  const interviews = db.getInterviewsByCandidate(profile.id);
  res.json({ interviews });
});

// GET /api/candidate/certificates
apiRouter.get(['/candidate/certificates', '/candidate/learning/certificates'], optionalAuth, (req: AuthenticatedRequest, res) => {
  if (!req.user || req.user.role !== 'candidate') {
    return res.json({ certificates: [] });
  }
  const profile = db.getCandidateByUserId(req.user.id);
  if (!profile) return res.json({ certificates: [] });

  const certificates = db.getCertificatesByCandidate(profile.id);
  res.json({ certificates });
});

// GET /api/candidate/learning/courses
apiRouter.get('/candidate/learning/courses', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  const profile = db.getCandidateByUserId(req.user!.id);
  const courses = db.getAllCourses().filter(c => c.isPublished);
  const progressList = profile ? db.getAllCandidateProgress(profile.id) : [];

  const enriched = courses.map(course => {
    const progress = progressList.find(p => p.courseId === course.id);
    return {
      ...course,
      progress: progress || null
    };
  });

  res.json({ courses: enriched });
});

// POST /api/candidate/learning/progress
apiRouter.post('/candidate/learning/progress', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  try {
    const { courseId, lessonId, moduleId } = req.body;
    const profile = db.getCandidateByUserId(req.user!.id);
    if (!profile) return res.status(400).json({ error: 'Profile not found' });

    let progress = db.getCourseProgress(profile.id, courseId);
    if (!progress) {
      progress = {
        id: `prog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        candidateId: profile.id,
        courseId,
        completedLessonIds: [],
        completedModuleIds: [],
        isCompleted: false,
        updatedAt: new Date().toISOString()
      };
    }

    if (lessonId && !progress.completedLessonIds.includes(lessonId)) {
      progress.completedLessonIds.push(lessonId);
      progress.lastAccessedLessonId = lessonId;
    }

    if (moduleId && !progress.completedModuleIds.includes(moduleId)) {
      progress.completedModuleIds.push(moduleId);
    }

    progress.updatedAt = new Date().toISOString();
    db.saveCourseProgress(progress);

    res.json({ success: true, progress });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record progress' });
  }
});

// POST /api/candidate/learning/assessments/submit
apiRouter.post('/candidate/learning/assessments/submit', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  try {
    const { courseId, answers } = req.body; // answers: Record<string, number> (questionId -> selectedOptionIndex)
    const profile = db.getCandidateByUserId(req.user!.id);
    if (!profile) return res.status(400).json({ error: 'Candidate profile required' });

    const course = db.getCourseById(courseId);
    if (!course || !course.assessment) {
      return res.status(400).json({ error: 'Course or assessment not found' });
    }

    const assessment = course.assessment;
    let earnedMarks = 0;
    let totalMarks = 0;

    assessment.questions.forEach(q => {
      totalMarks += q.marks || 1;
      if (answers && answers[q.id] === q.correctOptionIndex) {
        earnedMarks += q.marks || 1;
      }
    });

    const percentage = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 100;
    const passingThreshold = Number(assessment.passingPercentage) || 80;
    const isPassed = percentage >= passingThreshold;

    const attempts = db.getAssessmentAttempts(profile.id, courseId);
    const attempt: AssessmentAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      candidateId: profile.id,
      courseId,
      score: earnedMarks,
      totalMarks,
      percentage,
      isPassed,
      attemptNumber: attempts.length + 1,
      answers: answers || {},
      completedAt: new Date().toISOString()
    };

    db.saveAssessmentAttempt(attempt);

    let certificate: Certificate | undefined;
    const existingCert = db.getCertificatesByCandidate(profile.id).find(c => c.courseId === courseId);

    if (isPassed) {
      // Update course completion progress
      let prog = db.getCourseProgress(profile.id, courseId);
      if (prog) {
        prog.isCompleted = true;
        prog.completedAt = new Date().toISOString();
        db.saveCourseProgress(prog);
      }

      if (existingCert && existingCert.isPaid) {
        certificate = existingCert;
      }
    }

    res.json({
      success: true,
      isPassed,
      score: earnedMarks,
      totalMarks,
      percentage,
      attempt,
      isEligibleForCertificate: isPassed,
      requiresPayment: isPassed && (!existingCert || !existingCert.isPaid),
      certificateFee: 29,
      certificate: (existingCert && existingCert.isPaid) ? existingCert : undefined
    });
  } catch (err: any) {
    console.error('Submit assessment error:', err);
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
});

// POST /api/candidate/learning/certificates/create-order
apiRouter.post('/candidate/learning/certificates/create-order', requireAuth, requireRole('candidate'), async (req: AuthenticatedRequest, res) => {
  try {
    const { courseId } = req.body;
    const profile = db.getCandidateByUserId(req.user!.id);
    if (!profile) return res.status(400).json({ error: 'Candidate profile required' });

    const course = db.getCourseById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Validate passing attempt (>=80%)
    const attempts = db.getAssessmentAttempts(profile.id, courseId);
    const passingAttempt = attempts.find(a => a.isPassed && a.percentage >= 80);
    if (!passingAttempt) {
      return res.status(400).json({ 
        error: 'You must pass the course assessment with at least 80% before requesting a certificate.' 
      });
    }

    // Check if certificate is already issued and paid
    const existingCert = db.getCertificatesByCandidate(profile.id).find(c => c.courseId === courseId);
    if (existingCert && existingCert.isPaid) {
      return res.json({
        success: true,
        alreadyPaid: true,
        certificate: existingCert,
        message: 'Certificate is already unlocked and available for download.'
      });
    }

    const settings = db.getMonetizationSettings();
    const certificatePrice = settings.certificatePrice || 29;
    const amountInPaise = certificatePrice * 100; // ₹29 = 2900 paise

    const rzpOrder = await razorpayService.createOrder({
      amountInPaise,
      currency: 'INR',
      receipt: `rcpt_cert_${courseId.substring(0, 8)}_${profile.id.substring(0, 6)}`,
      notes: {
        courseId,
        candidateId: profile.id,
        userId: req.user!.id,
        courseTitle: course.title
      }
    });

    const paymentRecord: PaymentRecord = {
      id: rzpOrder.orderId,
      userId: req.user!.id,
      userName: profile.fullName,
      userEmail: req.user!.email,
      userMobile: req.user!.mobile,
      candidateId: profile.id,
      paymentType: 'certificate',
      targetId: courseId,
      title: `Verified Certificate: ${course.title}`,
      amount: certificatePrice,
      gst: 0,
      gstRate: 0,
      total: certificatePrice,
      currency: 'INR',
      gateway: 'Razorpay',
      gatewayTransactionId: '',
      razorpayOrderId: rzpOrder.orderId,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    db.createPaymentRecord(paymentRecord);

    res.json({
      success: true,
      alreadyPaid: false,
      order: paymentRecord,
      razorpayOrder: rzpOrder,
      courseTitle: course.title,
      amount: certificatePrice,
      pricing: {
        baseAmount: certificatePrice,
        gstRate: 0,
        gstAmount: 0,
        totalAmount: certificatePrice
      }
    });
  } catch (err: any) {
    console.error('Create certificate order error:', err);
    res.status(500).json({ error: err.message || 'Failed to create certificate order' });
  }
});

// ============================================================================
// 3. EMPLOYER APIS
// ============================================================================

// GET /api/employer/profile
apiRouter.get('/employer/profile', requireAuth, requireRole('employer'), (req: AuthenticatedRequest, res) => {
  const profile = db.getEmployerByUserId(req.user!.id);
  res.json({ profile: profile || null });
});

// POST /api/employer/profile
apiRouter.post('/employer/profile', requireAuth, requireRole('employer'), (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const body = req.body;
    const existing = db.getEmployerByUserId(user.id);

    const profileId = existing?.id || `emp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const updatedProfile: EmployerProfile = {
      id: profileId,
      userId: user.id,
      companyName: body.companyName || existing?.companyName || 'Company Name',
      logoUrl: body.logoUrl || existing?.logoUrl || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=120&auto=format&fit=crop&q=80',
      industry: body.industry || existing?.industry || 'Technology',
      companyType: body.companyType || existing?.companyType || 'Private Limited',
      website: body.website || existing?.website,
      gstNumber: body.gstNumber || existing?.gstNumber,
      businessDescription: body.businessDescription || existing?.businessDescription || '',
      recruiterName: body.recruiterName || existing?.recruiterName || user.fullName || 'Recruiter',
      recruiterDesignation: body.recruiterDesignation || existing?.recruiterDesignation || 'HR Manager',
      recruiterEmail: body.recruiterEmail || existing?.recruiterEmail || '',
      recruiterMobile: user.mobile,
      address: body.address || existing?.address || '',
      city: body.city || existing?.city || 'Bengaluru',
      state: body.state || existing?.state || 'Karnataka',
      pincode: body.pincode || existing?.pincode || '560001',
      latitude: body.latitude ?? existing?.latitude ?? 12.9716,
      longitude: body.longitude ?? existing?.longitude ?? 77.5946,
      verificationStatus: existing?.verificationStatus || 'Under Review',
      verificationReason: existing?.verificationReason,
      documents: body.documents || existing?.documents || [],
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.saveEmployerProfile(updatedProfile);
    db.updateUser(user.id, { isRegistered: true, fullName: updatedProfile.recruiterName });

    res.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    console.error('Save employer profile error:', err);
    res.status(500).json({ error: 'Failed to update company profile' });
  }
});

// POST /api/employer/upload-document
apiRouter.post('/employer/upload-document', requireAuth, requireRole('employer'), upload.single('document'), (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No document uploaded' });
    const { docType } = req.body;
    const profile = db.getEmployerByUserId(req.user!.id);
    if (!profile) return res.status(400).json({ error: 'Employer profile not found' });

    const fileUrl = `/uploads/${req.file.filename}`;
    const newDoc = {
      id: `doc-${Date.now()}`,
      type: docType || 'GST/PAN Certificate',
      url: fileUrl,
      name: req.file.originalname,
      uploadedAt: new Date().toISOString()
    };

    profile.documents.push(newDoc);
    profile.verificationStatus = 'Under Review';
    db.saveEmployerProfile(profile);

    res.json({ success: true, document: newDoc, message: 'Document submitted for verification' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// GET /api/employer/dashboard-stats
apiRouter.get('/employer/dashboard-stats', requireAuth, requireRole('employer'), (req: AuthenticatedRequest, res) => {
  const profile = db.getEmployerByUserId(req.user!.id);
  if (!profile) {
    return res.json({
      activeJobsCount: 0,
      totalApplicantsCount: 0,
      shortlistedCount: 0,
      interviewsCount: 0,
      selectedCount: 0,
      verificationStatus: 'Pending'
    });
  }

  const jobs = db.getJobsByEmployer(profile.id);
  const activeJobs = jobs.filter(j => j.status === 'Active');
  const apps = db.getApplicationsByEmployer(profile.id);
  const shortlisted = apps.filter(a => ['Shortlisted', 'Contacted', 'Interview Scheduled', 'Interview Completed', 'Selected'].includes(a.status));
  const interviews = db.getInterviewsByEmployer(profile.id);
  const selected = apps.filter(a => ['Selected', 'Joined'].includes(a.status));

  res.json({
    activeJobsCount: activeJobs.length,
    totalJobsCount: jobs.length,
    totalApplicantsCount: apps.length,
    shortlistedCount: shortlisted.length,
    interviewsCount: interviews.length,
    selectedCount: selected.length,
    verificationStatus: profile.verificationStatus
  });
});

// GET /api/employer/jobs
apiRouter.get('/employer/jobs', requireAuth, requireRole('employer'), (req: AuthenticatedRequest, res) => {
  const profile = db.getEmployerByUserId(req.user!.id);
  if (!profile) return res.json({ jobs: [] });

  const jobs = db.getJobsByEmployer(profile.id);
  res.json({ jobs });
});

// POST /api/employer/jobs
apiRouter.post('/employer/jobs', requireAuth, requireRole('employer'), async (req: AuthenticatedRequest, res) => {
  try {
    const profile = db.getEmployerByUserId(req.user!.id);
    if (!profile) return res.status(400).json({ error: 'Employer profile required' });

    const body = req.body;
    const jobId = body.id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const existing = db.getJobById(jobId);

    const isVerified = profile.verificationStatus === 'Verified';
    const isDraft = body.status === 'Draft';

    // Check weekly free quota
    const postingStatus = db.getEmployerFreePostingStatus(profile.id);

    let quotaType: 'free' | 'paid' = 'free';
    let paymentStatus: 'Free' | 'Pending' | 'Paid' | 'Failed' = 'Free';
    let initialStatus: JobPost['status'] = 'Draft';

    if (isDraft) {
      initialStatus = 'Draft';
      quotaType = existing?.quotaType || 'free';
      paymentStatus = existing?.paymentStatus || 'Pending';
    } else if (existing && existing.paymentStatus === 'Paid') {
      // Already paid job post
      quotaType = 'paid';
      paymentStatus = 'Paid';
      initialStatus = 'Pending Approval';
    } else if (postingStatus.hasFreeJobAvailable) {
      // Uses 1 free job listing per week
      quotaType = 'free';
      paymentStatus = 'Free';
      initialStatus = 'Pending Approval';
    } else {
      // Requires Razorpay payment (₹299 + 18% GST = ₹352.82)
      quotaType = 'paid';
      paymentStatus = 'Pending';
      initialStatus = 'Draft';
    }

    const jobPost: JobPost = {
      id: jobId,
      employerId: profile.id,
      companyName: profile.companyName,
      companyLogo: profile.logoUrl,
      isCompanyVerified: isVerified,
      title: body.title,
      department: body.department || 'General',
      category: body.category || 'IT',
      jobType: body.jobType || 'Full-Time',
      workMode: body.workMode || 'In-Office',
      locationCity: body.locationCity || profile.city,
      locationState: body.locationState || profile.state,
      address: body.address || profile.address,
      latitude: body.latitude ?? profile.latitude ?? 12.9716,
      longitude: body.longitude ?? profile.longitude ?? 77.5946,
      salaryMin: Number(body.salaryMin || 20000),
      salaryMax: Number(body.salaryMax || 40000),
      salaryPeriod: body.salaryPeriod || 'Month',
      experienceMinYears: Number(body.experienceMinYears || 0),
      experienceMaxYears: Number(body.experienceMaxYears || 3),
      educationRequired: body.educationRequired || 'Graduate',
      requiredSkills: Array.isArray(body.requiredSkills) ? body.requiredSkills : (body.requiredSkills ? body.requiredSkills.split(',').map((s: string) => s.trim()) : []),
      preferredCertificates: Array.isArray(body.preferredCertificates) ? body.preferredCertificates : [],
      vacancies: Number(body.vacancies || 1),
      description: body.description || '',
      responsibilities: Array.isArray(body.responsibilities) ? body.responsibilities : (body.responsibilities ? body.responsibilities.split('\n').filter(Boolean) : []),
      requirements: Array.isArray(body.requirements) ? body.requirements : (body.requirements ? body.requirements.split('\n').filter(Boolean) : []),
      benefits: Array.isArray(body.benefits) ? body.benefits : (body.benefits ? body.benefits.split('\n').filter(Boolean) : []),
      workingHours: body.workingHours || 'Standard Shift',
      joiningTimeline: body.joiningTimeline || 'Immediate',
      applicationDeadline: body.applicationDeadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: initialStatus,
      quotaType,
      paymentStatus,
      viewsCount: existing?.viewsCount || 0,
      applicationsCount: existing?.applicationsCount || 0,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.saveJob(jobPost);

    // If payment required (not draft and not free quota and not already paid)
    if (!isDraft && quotaType === 'paid' && paymentStatus !== 'Paid') {
      const baseAmount = 299;
      const gstRate = 18;
      const gstAmount = 53.82;
      const totalAmount = 352.82;
      const amountInPaise = 35282;

      const rzpOrder = await razorpayService.createOrder({
        amountInPaise,
        currency: 'INR',
        receipt: `rcpt_job_${jobPost.id.substring(0, 16)}`,
        notes: {
          jobId: jobPost.id,
          employerId: profile.id,
          userId: req.user!.id,
          companyName: profile.companyName
        }
      });

      const paymentRecord: PaymentRecord = {
        id: rzpOrder.orderId,
        userId: req.user!.id,
        userName: profile.companyName,
        userEmail: req.user!.email,
        userMobile: req.user!.mobile,
        employerId: profile.id,
        paymentType: 'job_posting',
        targetId: jobPost.id,
        title: `Job Listing Fee: ${jobPost.title}`,
        amount: baseAmount,
        gst: gstAmount,
        gstRate,
        total: totalAmount,
        currency: 'INR',
        gateway: 'Razorpay',
        gatewayTransactionId: '',
        razorpayOrderId: rzpOrder.orderId,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      db.createPaymentRecord(paymentRecord);

      return res.json({
        success: true,
        job: jobPost,
        requiresPayment: true,
        isFreeQuota: false,
        order: paymentRecord,
        razorpayOrder: rzpOrder,
        pricing: {
          baseAmount,
          gstRate,
          gstAmount,
          totalAmount
        },
        message: 'Weekly free job listing quota utilized. Please complete payment of ₹352.82 to submit this job for review.'
      });
    }

    res.json({
      success: true,
      job: jobPost,
      requiresPayment: false,
      isFreeQuota: quotaType === 'free',
      message: isDraft 
        ? 'Job draft saved successfully.' 
        : 'Job vacancy submitted for KarMetra Admin Quality Review!'
    });
  } catch (err: any) {
    console.error('Save job error:', err);
    res.status(500).json({ error: err.message || 'Failed to post job' });
  }
});

// PATCH /api/employer/jobs/:id/status
apiRouter.patch('/employer/jobs/:id/status', requireAuth, requireRole('employer'), (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const profile = db.getEmployerByUserId(req.user!.id);
  const job = db.getJobById(id);

  if (!job || !profile || job.employerId !== profile.id) {
    return res.status(404).json({ error: 'Job post not found' });
  }

  job.status = status;
  db.saveJob(job);
  res.json({ success: true, job });
});

// GET /api/employer/applicants
apiRouter.get('/employer/applicants', requireAuth, requireRole('employer'), (req: AuthenticatedRequest, res) => {
  const profile = db.getEmployerByUserId(req.user!.id);
  if (!profile) return res.json({ applicants: [] });

  const apps = db.getApplicationsByEmployer(profile.id);
  const enriched = apps.map(app => {
    const candidate = db.getCandidateById(app.candidateId);
    const job = db.getJobById(app.jobId);
    const certs = candidate ? db.getCertificatesByCandidate(candidate.id) : [];
    const interviews = db.getInterviewsByEmployer(profile.id).filter(i => i.applicationId === app.id);

    // Mask phone if privacy enabled and not shortlisted
    const isContactVisible = candidate?.privacyShowPhone && ['Shortlisted', 'Contacted', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Joined'].includes(app.status);

    return {
      ...app,
      jobTitle: job?.title || 'Unknown Job',
      candidate: candidate ? {
        ...candidate,
        mobile: isContactVisible ? candidate.mobile : 'XXXXXXXX' + candidate.mobile.slice(-2),
        certificates: certs
      } : null,
      interviews
    };
  });

  res.json({ applicants: enriched });
});

// PATCH /api/employer/applications/:id/status
apiRouter.patch('/employer/applications/:id/status', requireAuth, requireRole('employer'), (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const profile = db.getEmployerByUserId(req.user!.id);
    const app = db.getApplicationById(id);

    if (!app || !profile || app.employerId !== profile.id) {
      return res.status(404).json({ error: 'Application not found' });
    }

    app.status = status;
    app.statusHistory.push({
      status,
      updatedAt: new Date().toISOString(),
      note: note || `Application status updated to ${status}`
    });
    app.updatedAt = new Date().toISOString();
    db.saveApplication(app);

    // Notify Candidate in real-time
    const candidate = db.getCandidateById(app.candidateId);
    const job = db.getJobById(app.jobId);

    if (candidate) {
      db.createNotification({
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId: candidate.userId,
        title: `Application Update: ${status}`,
        titleHi: `आवेदन अपडेट: ${status}`,
        message: `${profile.companyName} updated your application for ${job?.title || 'Job'} to "${status}".`,
        messageHi: `${profile.companyName} ने आपके आवेदन की स्थिति को "${status}" में अपडेट किया है।`,
        type: 'application',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    res.json({ success: true, application: app });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// POST /api/employer/interviews/schedule
apiRouter.post('/employer/interviews/schedule', requireAuth, requireRole('employer'), (req: AuthenticatedRequest, res) => {
  try {
    const { applicationId, dateTime, interviewerName, interviewType, instructions, meetingLink } = req.body;
    const profile = db.getEmployerByUserId(req.user!.id);
    const app = db.getApplicationById(applicationId);

    if (!app || !profile || app.employerId !== profile.id) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const candidate = db.getCandidateById(app.candidateId);
    const job = db.getJobById(app.jobId);

    // Use provided Google Meet URL or generate a valid room link
    const finalMeetingLink = meetingLink || `https://meet.google.com/km-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;

    const interview: Interview = {
      id: `int-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      applicationId: app.id,
      jobId: app.jobId,
      candidateId: app.candidateId,
      employerId: profile.id,
      candidateName: candidate?.fullName || 'Candidate',
      companyName: profile.companyName,
      jobTitle: job?.title || 'Job Position',
      dateTime: dateTime || new Date(Date.now() + 86400000 * 2).toISOString(),
      interviewerName: interviewerName || profile.recruiterName,
      interviewType: interviewType || 'Video Call (Google Meet)',
      meetingLink: finalMeetingLink,
      instructions: instructions || 'Please join 5 minutes before scheduled time with updated resume.',
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.saveInterview(interview);

    // Update application stage to Interview Scheduled
    app.status = 'Interview Scheduled';
    app.statusHistory.push({
      status: 'Interview Scheduled',
      updatedAt: new Date().toISOString(),
      note: `Interview scheduled for ${new Date(interview.dateTime).toLocaleString()}`
    });
    db.saveApplication(app);

    // Send real-time notification to Candidate
    if (candidate) {
      db.createNotification({
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId: candidate.userId,
        title: `Interview Scheduled with ${profile.companyName}`,
        titleHi: `${profile.companyName} के साथ साक्षात्कार निर्धारित हुआ`,
        message: `Your interview for ${job?.title} is set for ${new Date(interview.dateTime).toLocaleString()}. Join link available in Applications tab.`,
        messageHi: `${job?.title} के लिए आपका साक्षात्कार निर्धारित किया गया है। विवरण आवेदन टैब में देखें।`,
        type: 'interview',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    res.json({ success: true, interview });
  } catch (err: any) {
    console.error('Schedule interview error:', err);
    res.status(500).json({ error: 'Failed to schedule interview' });
  }
});

// GET /api/employer/candidates/search
apiRouter.get('/employer/candidates/search', requireAuth, requireRole('employer'), (req: AuthenticatedRequest, res) => {
  const { skill, certificate, location, experienceMin, experienceMax, search } = req.query;
  const candidates = db.getAllCandidates().filter(c => c.isProfileComplete);

  const results = candidates.filter(cand => {
    if (search) {
      const q = String(search).toLowerCase();
      const matchName = cand.fullName.toLowerCase().includes(q);
      const matchCity = cand.city.toLowerCase().includes(q);
      const matchSkills = cand.skills.some(s => s.toLowerCase().includes(q));
      if (!matchName && !matchCity && !matchSkills) return false;
    }

    if (skill) {
      const skillStr = String(skill).toLowerCase();
      const hasSkill = cand.skills.some(s => s.toLowerCase().includes(skillStr));
      if (!hasSkill) return false;
    }

    if (location) {
      const locStr = String(location).toLowerCase();
      if (!cand.city.toLowerCase().includes(locStr) && !cand.state.toLowerCase().includes(locStr)) {
        return false;
      }
    }

    if (experienceMin && cand.totalExperienceYears < Number(experienceMin)) return false;
    if (experienceMax && cand.totalExperienceYears > Number(experienceMax)) return false;

    if (certificate) {
      const certStr = String(certificate).toLowerCase();
      const certs = db.getCertificatesByCandidate(cand.id);
      const hasCert = certs.some(c => c.courseTitle.toLowerCase().includes(certStr) || c.skills.some(cs => cs.toLowerCase().includes(certStr)));
      if (!hasCert) return false;
    }

    return true;
  });

  const enriched = results.map(c => {
    const certs = db.getCertificatesByCandidate(c.id);
    return {
      ...c,
      mobile: c.privacyShowPhone ? c.mobile : 'XXXXXXXX' + c.mobile.slice(-2),
      certificates: certs
    };
  });

  res.json({ candidates: enriched, total: enriched.length });
});

// ============================================================================
// 4. PUBLIC & SHARED APIS
// ============================================================================

// GET /api/jobs (Search & GPS Radar Filter)
apiRouter.get('/jobs', (req, res) => {
  const { q, category, workMode, minSalary, experience, lat, lon, maxDistanceKm, sort } = req.query;
  let jobs = db.getAllJobs().filter(j => j.status === 'Active');

  if (q) {
    const query = String(q).toLowerCase();
    jobs = jobs.filter(j => 
      j.title.toLowerCase().includes(query) ||
      j.companyName.toLowerCase().includes(query) ||
      j.locationCity.toLowerCase().includes(query) ||
      j.requiredSkills.some(s => s.toLowerCase().includes(query))
    );
  }

  if (category && category !== 'All') {
    jobs = jobs.filter(j => j.category === category);
  }

  if (workMode && workMode !== 'All') {
    jobs = jobs.filter(j => j.workMode === workMode);
  }

  if (minSalary) {
    jobs = jobs.filter(j => j.salaryMax >= Number(minSalary));
  }

  if (experience !== undefined && experience !== '') {
    const exp = Number(experience);
    jobs = jobs.filter(j => j.experienceMinYears <= exp && j.experienceMaxYears >= exp);
  }

  // Calculate distance if GPS coords provided
  let enrichedJobs = jobs.map(j => {
    let distanceKm: number | undefined;
    if (lat && lon && j.latitude && j.longitude) {
      distanceKm = db.calculateDistanceKm(Number(lat), Number(lon), j.latitude, j.longitude);
    }
    return {
      ...j,
      distanceKm
    };
  });

  // Filter by max distance
  if (maxDistanceKm && lat && lon) {
    const maxDist = Number(maxDistanceKm);
    enrichedJobs = enrichedJobs.filter(j => j.distanceKm !== undefined && j.distanceKm <= maxDist);
  }

  // Sort
  if (sort === 'distance' && lat && lon) {
    enrichedJobs.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  } else if (sort === 'salary') {
    enrichedJobs.sort((a, b) => b.salaryMax - a.salaryMax);
  } else if (sort === 'latest') {
    enrichedJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({ jobs: enrichedJobs, total: enrichedJobs.length });
});

// GET /api/jobs/:id
apiRouter.get('/jobs/:id', (req, res) => {
  const job = db.getJobById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  job.viewsCount = (job.viewsCount || 0) + 1;
  db.saveJob(job);

  const employer = db.getEmployerById(job.employerId);
  res.json({ job, employer });
});

// GET /api/courses
apiRouter.get('/courses', (req, res) => {
  const { category, search } = req.query;
  let courses = db.getAllCourses().filter(c => c.isPublished);

  if (category && category !== 'All') {
    courses = courses.filter(c => c.category === category);
  }

  if (search) {
    const query = String(search).toLowerCase();
    courses = courses.filter(c => 
      c.title.toLowerCase().includes(query) ||
      (c.titleHi && c.titleHi.includes(query)) ||
      c.skillsTaught.some(s => s.toLowerCase().includes(query))
    );
  }

  res.json({ courses, total: courses.length });
});

// GET /api/courses/:id
apiRouter.get('/courses/:id', (req, res) => {
  const course = db.getCourseById(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json({ course });
});

// GET /api/certificates/verify/:code
apiRouter.get('/certificates/verify/:code', (req, res) => {
  const { code } = req.params;
  const cert = db.getCertificateByCode(code);
  if (!cert) {
    return res.status(404).json({ verified: false, error: 'Certificate ID not found or invalid' });
  }

  const candidate = db.getCandidateById(cert.candidateId);
  const course = db.getCourseById(cert.courseId);

  res.json({
    verified: cert.status === 'Valid',
    certificate: cert,
    candidateName: cert.candidateName,
    courseTitle: cert.courseTitle,
    issueDate: cert.issueDate,
    status: cert.status,
    skills: cert.skills,
    revocationReason: cert.revocationReason
  });
});

// GET /api/skills
apiRouter.get('/skills', (_req, res) => {
  res.json({ skills: INITIAL_SKILLS });
});

// GET /api/notifications
apiRouter.get('/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  const notifs = db.getNotificationsByUser(req.user!.id);
  res.json({ notifications: notifs });
});

// PATCH /api/notifications/:id/read
apiRouter.patch('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
  db.markNotificationRead(req.params.id, req.user!.id);
  res.json({ success: true });
});

// PATCH /api/notifications/read-all
apiRouter.patch('/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res) => {
  db.markAllNotificationsRead(req.user!.id);
  res.json({ success: true });
});

// POST /api/support/tickets
apiRouter.post('/support/tickets', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { subject, category, message } = req.body;

  const ticket = db.saveSupportTicket({
    id: `tick-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId: user.id,
    userRole: user.role,
    userName: user.fullName || user.mobile,
    userContact: user.mobile,
    subject: subject || 'General Query',
    category: category || 'Support',
    message: message || '',
    status: 'Open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  res.json({ success: true, ticket });
});

// POST /api/reports
apiRouter.post('/reports', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { targetType, targetId, targetTitle, reason, details } = req.body;

  const report = db.saveReport({
    id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    reporterUserId: user.id,
    reporterRole: user.role,
    targetType: targetType || 'job',
    targetId: targetId || '',
    targetTitle: targetTitle || 'Item',
    reason: reason || 'Suspicious Activity',
    details: details || '',
    status: 'Open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  res.json({ success: true, report });
});

// ============================================================================
// 5. ADMIN CONTROL PANEL APIS
// ============================================================================

// GET /api/admin/overview-stats and /api/admin/stats
const handleAdminStats = (_req: AuthenticatedRequest, res: Response) => {
  const candidates = db.getAllCandidates();
  const employers = db.getAllEmployers();
  const pendingEmployers = employers.filter(e => e.verificationStatus === 'Under Review' || e.verificationStatus === 'Pending');
  const jobs = db.getAllJobs();
  const pendingJobs = jobs.filter(j => j.status === 'Pending Approval');
  const activeJobs = jobs.filter(j => j.status === 'Active');
  const apps = db.getApplications();
  const courses = db.getAllCourses();
  const certificates = db.getAllCertificates();
  const tickets = db.getSupportTickets().filter(t => t.status === 'Open');
  const reports = db.getReports().filter(r => r.status === 'Open');
  const audits = db.getAuditLogs().slice(0, 10);

  res.json({
    totalCandidates: candidates.length,
    totalEmployers: employers.length,
    pendingEmployersCount: pendingEmployers.length,
    totalJobsCount: jobs.length,
    pendingJobsCount: pendingJobs.length,
    totalApplicationsCount: apps.length,
    totalCoursesCount: courses.length,
    certificatesIssuedCount: certificates.length,
    openTicketsCount: tickets.length,
    openReportsCount: reports.length,
    // Direct UI property aliases
    activeJobs: activeJobs.length,
    pendingEmployers: pendingEmployers.length,
    pendingJobs: pendingJobs.length,
    totalCourses: courses.length,
    verifiedCertificates: certificates.filter(c => c.status === 'Valid').length || certificates.length,
    openTickets: tickets.length,
    openReports: reports.length,
    recentAudits: audits
  });
};

apiRouter.get('/admin/overview-stats', requireAuth, requireRole('admin'), handleAdminStats);
apiRouter.get('/admin/stats', requireAuth, requireRole('admin'), handleAdminStats);

// GET /api/admin/employers
apiRouter.get('/admin/employers', requireAuth, requireRole('admin'), (_req, res) => {
  const employers = db.getAllEmployers();
  res.json({ employers });
});

// POST /api/admin/employers/:id/verify
apiRouter.post('/admin/employers/:id/verify', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, reason } = req.body; // 'Verified' | 'Rejected' | 'Suspended'
  const employer = db.getEmployerById(id);

  if (!employer) return res.status(404).json({ error: 'Employer not found' });
  if (status === 'Rejected' && !reason) {
    return res.status(400).json({ error: 'Rejection reason is mandatory' });
  }

  employer.verificationStatus = status;
  employer.verificationReason = reason;
  db.saveEmployerProfile(employer);

  // Log admin audit
  db.logAdminAction(
    req.user!.id,
    req.user!.fullName || 'Admin',
    `Employer Verification: ${status}`,
    'Employer',
    employer.id,
    `Company "${employer.companyName}" marked as ${status}. Reason: ${reason || 'Approved'}`
  );

  // Notify employer
  db.createNotification({
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId: employer.userId,
    title: `Company Verification: ${status}`,
    titleHi: `कंपनी सत्यापन स्थिति: ${status}`,
    message: status === 'Verified' ? 'Your corporate account has been verified!' : `Verification was rejected: ${reason}`,
    messageHi: status === 'Verified' ? 'आपका कंपनी खाता सफलतापूर्वक सत्यापित हो गया है!' : `सत्यापन अस्वीकृत: ${reason}`,
    type: 'verification',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, employer });
});

// GET /api/admin/jobs
apiRouter.get('/admin/jobs', requireAuth, requireRole('admin'), (_req, res) => {
  const jobs = db.getAllJobs();
  res.json({ jobs });
});

// POST /api/admin/jobs/:id/moderate
apiRouter.post('/admin/jobs/:id/moderate', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, adminFeedback } = req.body;
  const job = db.getJobById(id);

  if (!job) return res.status(404).json({ error: 'Job not found' });

  job.status = status;
  job.adminFeedback = adminFeedback;
  db.saveJob(job);

  db.logAdminAction(
    req.user!.id,
    req.user!.fullName || 'Admin',
    `Job Moderation: ${status}`,
    'Job',
    job.id,
    `Job "${job.title}" marked as ${status}`
  );

  res.json({ success: true, job });
});

// GET /api/admin/candidates
apiRouter.get('/admin/candidates', requireAuth, requireRole('admin'), (_req, res) => {
  const candidates = db.getAllCandidates();
  res.json({ candidates });
});

// GET /api/admin/courses
apiRouter.get('/admin/courses', requireAuth, requireRole('admin'), (_req, res) => {
  const courses = db.getAllCourses();
  res.json({ courses });
});

// POST /api/admin/courses
apiRouter.post('/admin/courses', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  try {
    const body = req.body as Course;
    const courseId = body.id || `course-${Date.now()}`;
    const existing = db.getCourseById(courseId);

    const course: Course = {
      id: courseId,
      title: body.title || 'Untitled Course',
      titleHi: body.titleHi || body.title || 'नया कोर्स',
      category: body.category || 'IT',
      categoryHi: body.categoryHi || 'आईटी',
      subcategory: body.subcategory || '',
      description: body.description || '',
      descriptionHi: body.descriptionHi || '',
      thumbnailUrl: body.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
      level: body.level || 'Beginner',
      durationHours: Number(body.durationHours || 10),
      passingPercentage: Number(body.passingPercentage || 80),
      isPublished: body.isPublished !== undefined ? body.isPublished : true,
      featured: body.featured || false,
      enrolledCount: existing?.enrolledCount || 0,
      completedCount: existing?.completedCount || 0,
      skillsTaught: body.skillsTaught || [body.title],
      learningObjectives: body.learningObjectives || [],
      careerOutcomes: body.careerOutcomes || [],
      prerequisites: body.prerequisites || [],
      accessType: body.accessType || (body.isPaid ? 'paid' : 'free'),
      coursePrice: Number(body.coursePrice || body.price || 0),
      isPaid: body.accessType === 'paid' || Boolean(body.isPaid),
      price: Number(body.coursePrice || body.price || 0),
      certificateEnabled: body.certificateEnabled !== undefined ? body.certificateEnabled : true,
      certificateFeeType: body.certificateFeeType || (body.isCertificatePaid ? 'paid' : 'free'),
      isCertificatePaid: body.certificateFeeType === 'paid' || Boolean(body.isCertificatePaid),
      certificatePrice: Number(body.certificatePrice || 0),
      modules: body.modules || [],
      assessment: body.assessment,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.saveCourse(course);

    db.logAdminAction(
      req.user!.id,
      req.user!.fullName || 'Admin',
      existing ? 'Course Updated' : 'Course Created',
      'Course',
      course.id,
      `Course "${course.title}" saved with ${course.modules?.length || 0} modules`
    );

    res.json({ success: true, course });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save course' });
  }
});

// POST /api/admin/courses/:id/duplicate
apiRouter.post('/admin/courses/:id/duplicate', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const existing = db.getCourseById(id);
    if (!existing) return res.status(404).json({ error: 'Course not found' });

    const newId = `course-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const clonedModules = (existing.modules || []).map((m, mIdx) => ({
      ...m,
      id: `mod-${Date.now()}-${mIdx}`,
      courseId: newId,
      lessons: (m.lessons || []).map((l, lIdx) => ({
        ...l,
        id: `les-${Date.now()}-${mIdx}-${lIdx}`,
        moduleId: `mod-${Date.now()}-${mIdx}`
      }))
    }));

    const clonedAssessment = existing.assessment ? {
      ...existing.assessment,
      id: `assess-${newId}`,
      courseId: newId,
      questions: (existing.assessment.questions || []).map((q, qIdx) => ({
        ...q,
        id: `q-${Date.now()}-${qIdx}`
      }))
    } : undefined;

    const duplicatedCourse: Course = {
      ...existing,
      id: newId,
      title: `${existing.title} (Copy)`,
      titleHi: existing.titleHi ? `${existing.titleHi} (प्रतिलिपि)` : undefined as any,
      isPublished: false,
      enrolledCount: 0,
      completedCount: 0,
      modules: clonedModules,
      assessment: clonedAssessment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.saveCourse(duplicatedCourse);

    db.logAdminAction(
      req.user!.id,
      req.user!.fullName || 'Admin',
      'Course Duplicated',
      'Course',
      newId,
      `Course "${existing.title}" duplicated to "${duplicatedCourse.title}"`
    );

    res.json({ success: true, course: duplicatedCourse });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to duplicate course' });
  }
});

// PATCH /api/admin/courses/:id/publish
apiRouter.patch('/admin/courses/:id/publish', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const course = db.getCourseById(id);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const { isPublished } = req.body;
  course.isPublished = isPublished !== undefined ? Boolean(isPublished) : !course.isPublished;
  course.updatedAt = new Date().toISOString();
  db.saveCourse(course);

  db.logAdminAction(
    req.user!.id,
    req.user!.fullName || 'Admin',
    course.isPublished ? 'Course Published' : 'Course Unpublished',
    'Course',
    id,
    `Course "${course.title}" set to ${course.isPublished ? 'Published' : 'Draft'}`
  );

  res.json({ success: true, course });
});

// DELETE /api/admin/courses/:id
apiRouter.delete('/admin/courses/:id', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const deleted = db.deleteCourse(id);
  if (!deleted) return res.status(404).json({ error: 'Course not found' });

  db.logAdminAction(req.user!.id, req.user!.fullName || 'Admin', 'Course Deleted', 'Course', id, `Course ID ${id} deleted`);
  res.json({ success: true, message: 'Course removed' });
});

// POST /api/admin/courses/upload-media
apiRouter.post('/admin/courses/upload-media', requireAuth, requireRole('admin'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No media file provided' });
  res.json({
    success: true,
    url: `/uploads/${req.file.filename}`,
    filename: req.file.originalname
  });
});

// GET /api/admin/certificates
apiRouter.get('/admin/certificates', requireAuth, requireRole('admin'), (_req, res) => {
  const certs = db.getAllCertificates();
  res.json({ certificates: certs });
});

// POST /api/admin/certificates/:id/status
apiRouter.post('/admin/certificates/:id/status', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const cert = db.getAllCertificates().find(c => c.id === id || c.verificationCode === id);

  if (!cert) return res.status(404).json({ error: 'Certificate not found' });

  cert.status = status;
  cert.revocationReason = reason;
  db.saveCertificate(cert);

  db.logAdminAction(
    req.user!.id,
    req.user!.fullName || 'Admin',
    `Certificate Status: ${status}`,
    'Certificate',
    cert.verificationCode,
    `Certificate ${cert.verificationCode} status set to ${status}. Reason: ${reason || 'Admin Action'}`
  );

  res.json({ success: true, certificate: cert });
});

// GET /api/admin/support-tickets
apiRouter.get('/admin/support-tickets', requireAuth, requireRole('admin'), (_req, res) => {
  const tickets = db.getSupportTickets();
  res.json({ tickets });
});

// PATCH /api/admin/support-tickets/:id
apiRouter.patch('/admin/support-tickets/:id', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, adminReply } = req.body;
  const ticket = db.getSupportTickets().find(t => t.id === id);

  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  ticket.status = status || ticket.status;
  ticket.adminReply = adminReply || ticket.adminReply;
  db.saveSupportTicket(ticket);

  res.json({ success: true, ticket });
});

// GET /api/admin/reports
apiRouter.get('/admin/reports', requireAuth, requireRole('admin'), (_req, res) => {
  const reports = db.getReports();
  res.json({ reports });
});

// PATCH /api/admin/reports/:id
apiRouter.patch('/admin/reports/:id', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, adminActionTaken } = req.body;
  const report = db.getReports().find(r => r.id === id);

  if (!report) return res.status(404).json({ error: 'Report not found' });

  report.status = status || report.status;
  report.adminActionTaken = adminActionTaken || report.adminActionTaken;
  db.saveReport(report);

  res.json({ success: true, report });
});

// POST /api/admin/notifications/broadcast
apiRouter.post('/admin/notifications/broadcast', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { targetRole, title, titleHi, message, messageHi } = req.body;
  const users = db['data'].users.filter((u: User) => targetRole === 'all' || u.role === targetRole);

  users.forEach((u: User) => {
    db.createNotification({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: u.id,
      title: title || 'KarMetra Announcement',
      titleHi: titleHi || 'करमेत्रा आधिकारिक सूचना',
      message: message || '',
      messageHi: messageHi || '',
      type: 'system',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  });

  db.logAdminAction(
    req.user!.id,
    req.user!.fullName || 'Admin',
    'Broadcast Notification',
    'Notification',
    targetRole || 'all',
    `Sent notification "${title}" to ${users.length} users`
  );

  res.json({ success: true, sentCount: users.length });
});

// GET /api/admin/audit-logs
apiRouter.get('/admin/audit-logs', requireAuth, requireRole('admin'), (_req, res) => {
  const logs = db.getAuditLogs();
  res.json({ logs });
});

// GET /api/admin/otp-config (Admin view of OTP subsystem - no secrets exposed)
apiRouter.get('/admin/otp-config', requireAuth, requireRole('admin'), (_req, res) => {
  const otpService = OTPService.getInstance();
  const adminView = otpService.getAdminConfigView();
  res.json({ config: adminView });
});

// POST /api/admin/otp-test-diagnostics (Runs 15-point OTP safety checklist)
apiRouter.post('/admin/otp-test-diagnostics', requireAuth, requireRole('admin'), async (_req, res) => {
  const report = await OTPDiagnostics.runDiagnostics();
  res.json({ report });
});

// ============================================================================
// 10. PROFILE PHOTO UPLOAD & MANAGEMENT
// ============================================================================

// POST /api/profile/upload-photo
apiRouter.post('/api/profile/upload-photo', requireAuth, (req: AuthenticatedRequest, res) => {
  photoUpload.single('photo')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Failed to upload image. Allowed formats: JPG, PNG, WEBP (Max 5MB).' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Please select an image file to upload' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    const userId = req.user!.id;

    if (req.user!.role === 'candidate') {
      let candidate = db.getCandidateByUserId(userId);
      if (!candidate) {
        candidate = {
          id: `cand-${Date.now()}`,
          userId,
          fullName: req.user!.fullName || 'Candidate',
          email: req.user!.email || '',
          mobile: req.user!.mobile,
          avatarUrl: photoUrl,
          city: '',
          state: '',
          experienceType: 'Fresher',
          totalExperienceYears: 0,
          expectedSalaryMin: 0,
          expectedSalaryMax: 0,
          preferredJobTypes: ['Full-Time'],
          preferredWorkModes: ['In-Office'],
          preferredLocations: [],
          highestQualification: 'Graduate',
          degreeName: '',
          institute: '',
          passingYear: new Date().getFullYear(),
          skills: [],
          isProfileComplete: false,
          privacyShowPhone: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        candidate.avatarUrl = photoUrl;
        candidate.updatedAt = new Date().toISOString();
      }
      db.saveCandidateProfile(candidate);
      return res.json({ success: true, avatarUrl: photoUrl, candidate });
    } else if (req.user!.role === 'employer') {
      let employer = db.getEmployerByUserId(userId);
      if (employer) {
        employer.logoUrl = photoUrl;
        employer.updatedAt = new Date().toISOString();
        db.saveEmployerProfile(employer);
      }
      return res.json({ success: true, logoUrl: photoUrl, employer });
    }

    res.json({ success: true, photoUrl });
  });
});

// DELETE /api/profile/photo
apiRouter.delete('/api/profile/photo', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  if (req.user!.role === 'candidate') {
    const candidate = db.getCandidateByUserId(userId);
    if (candidate) {
      candidate.avatarUrl = '';
      candidate.updatedAt = new Date().toISOString();
      db.saveCandidateProfile(candidate);
    }
    return res.json({ success: true, avatarUrl: '' });
  } else if (req.user!.role === 'employer') {
    const employer = db.getEmployerByUserId(userId);
    if (employer) {
      employer.logoUrl = '';
      employer.updatedAt = new Date().toISOString();
      db.saveEmployerProfile(employer);
    }
    return res.json({ success: true, logoUrl: '' });
  }
  res.json({ success: true });
});

// ============================================================================
// 11. AI RESUME BUILDER & GEMINI ATS INTEGRATION
// ============================================================================

// POST /api/resume/ai-enhance
apiRouter.post('/resume/ai-enhance', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { action, targetRole, inputData } = req.body;
    // action: 'generate_summary' | 'improve_objective' | 'improve_experience' | 'suggest_skills' | 'ats_optimize'

    const ai = getGeminiClient();

    if (ai) {
      try {
        let systemPrompt = 'You are KarMetra’s senior AI career strategist and ATS optimization expert. Improve wording using impactful action verbs, quantifiable metrics, and clean formatting. Strictly do not invent false credentials; enhance what the candidate provides.';
        let userPrompt = '';

        if (action === 'generate_summary') {
          userPrompt = `Target Job Role: ${targetRole || 'Professional'}\nCandidate Profile Details:\n${JSON.stringify(inputData, null, 2)}\n\nWrite a compelling 3-4 sentence professional ATS resume summary highlighting core strengths, competencies, and value proposition.`;
        } else if (action === 'improve_objective') {
          userPrompt = `Target Job Role: ${targetRole || 'Professional'}\nCurrent Career Objective: "${inputData?.careerObjective || inputData}"\n\nRewrite this career objective to be modern, action-driven, and tailored for top employers.`;
        } else if (action === 'improve_experience') {
          userPrompt = `Job Title: ${inputData?.title || targetRole}\nCompany: ${inputData?.company || 'Organization'}\nCurrent Description: "${inputData?.description || ''}"\n\nEnhance this work experience with 3-4 bullet points using powerful action verbs, industry keywords, and ATS structure. Return as clean bullet points.`;
        } else if (action === 'suggest_skills') {
          userPrompt = `Job Role / Field: ${targetRole || 'General'}\nCurrent Skills: ${(inputData?.skills || []).join(', ')}\n\nSuggest 8-10 high-demand, complementary technical and professional skills for this career path in JSON array format: ["Skill1", "Skill2"]`;
        } else if (action === 'improve_full_resume') {
          userPrompt = `Candidate Profile & Resume Data:\n${JSON.stringify(inputData, null, 2)}\n\nAnalyze this candidate's genuine profile details. Suggest ATS-optimized headline, enhanced professional summary, polished work experience bullet points, and key recommended skills. Strictly maintain truthful representation of candidate data without fabricating false credentials. Return response in clean JSON format: { "headline": "...", "summary": "...", "improvedExperience": [...], "suggestedSkills": [...] }`;
        } else {
          userPrompt = `Review this resume content and provide ATS enhancement suggestions:\n${JSON.stringify(inputData, null, 2)}`;
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${systemPrompt}\n\n${userPrompt}`
        });

        const enhancedText = response.text || '';
        return res.json({ success: true, result: enhancedText });
      } catch (geminiErr: any) {
        console.warn('Gemini API call failed or rate limited, falling back to local ATS engine:', geminiErr.message);
      }
    }

    // Fallback Rule-Based ATS Enhancement Engine
    let fallbackResult = '';
    const role = targetRole || 'Professional';

    if (action === 'generate_summary') {
      const skillsStr = Array.isArray(inputData?.skills) && inputData.skills.length > 0 ? inputData.skills.slice(0, 4).join(', ') : 'core domain expertise';
      fallbackResult = `Results-driven and certified ${role} with a proven foundation in ${skillsStr}. Adept at cross-functional execution, delivering scalable solutions, and driving operational excellence in fast-paced professional environments. Dedicated to continuous learning and achieving strategic business benchmarks.`;
    } else if (action === 'improve_objective') {
      fallbackResult = `Ambitious and certified ${role} seeking to leverage demonstrated proficiency in industry workflows, analytical problem solving, and modern technical stacks to drive impactful results at a progressive organization.`;
    } else if (action === 'improve_experience') {
      fallbackResult = `• Spearheaded end-to-end execution of operational deliverables, optimizing workflow turnaround time by 22%.\n• Collaborated with cross-functional team leads to maintain high quality standards and SLA compliance.\n• Implemented structured reporting mechanisms, resolving blockers and improving efficiency metrics across key project milestones.`;
    } else if (action === 'suggest_skills') {
      const defaultSkillMap: Record<string, string[]> = {
        'Data Analyst': ['SQL Querying', 'Tableau Dashboards', 'Python Pandas', 'Advanced Excel (VLOOKUP/XLOOKUP)', 'Data Cleaning', 'Power BI', 'Business Intelligence', 'Statistical Modeling'],
        'Full Stack Developer': ['React.js', 'TypeScript', 'Node.js Express', 'RESTful API Design', 'PostgreSQL', 'Tailwind CSS', 'Git & CI/CD', 'Docker'],
        'Sales Executive': ['B2B Sales Pipeline', 'Lead Qualification', 'CRM Management', 'Cold Calling & Prospecting', 'Client Negotiations', 'Revenue Forecasting', 'Relationship Building'],
        'HR Specialist': ['Talent Acquisition', 'Onboarding Workflows', 'Statutory Compliance', 'HRMS Management', 'Performance Appraisal', 'Employee Relations', 'Payroll Management']
      };
      const matchingKey = Object.keys(defaultSkillMap).find(k => role.toLowerCase().includes(k.toLowerCase())) || 'Data Analyst';
      fallbackResult = JSON.stringify(defaultSkillMap[matchingKey]);
    } else if (action === 'improve_full_resume') {
      fallbackResult = JSON.stringify({
        headline: `Certified ${role} | Results-Driven Professional`,
        summary: `Dedicated ${role} equipped with verified credentials, hands-on domain competency, and strong collaborative communication skills.`,
        improvedExperience: [
          `Delivered daily operational goals adhering to highest quality and timeline standards.`,
          `Partnered effectively across departments to streamline workflows and improve productivity.`
        ],
        suggestedSkills: ['Communication', 'Problem Solving', 'Task Management', 'Quality Assurance']
      });
    } else {
      fallbackResult = `ATS Verified: Structured layout optimized with standard headings, quantifiable metrics, and verified KarMetra skill competencies.`;
    }

    res.json({ success: true, result: fallbackResult });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI Enhancement failed' });
  }
});

// GET /api/resume/list
apiRouter.get('/resume/list', optionalAuth, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.json({ resumes: [] });
  }
  const resumes = db.getResumesByUserId(req.user.id);
  res.json({ resumes });
});

// GET /api/resume/:id
apiRouter.get('/resume/:id', optionalAuth, (req: AuthenticatedRequest, res) => {
  const resume = db.getResumeById(req.params.id);
  if (!resume) {
    return res.status(404).json({ error: 'Resume not found' });
  }
  if (req.user && resume.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json({ resume });
});

// POST /api/resume/save
apiRouter.post('/resume/save', optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id || req.body.userId || 'guest-user';
    const resumeData: ResumeData = {
      ...req.body,
      id: req.body.id || `res-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      versionTitle: req.body.versionTitle || 'Default Resume',
      createdAt: req.body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = db.saveResume(resumeData);
    res.json({ success: true, resume: saved });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save resume' });
  }
});

// DELETE /api/resume/:id
apiRouter.delete('/resume/:id', optionalAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || 'guest-user';
  const success = db.deleteResume(req.params.id, userId);
  res.json({ success });
});

// ============================================================================
// 12. EMPLOYER FREE POSTING PLAN & PAYMENT MONETIZATION
// ============================================================================

// ============================================================================
// 12. RAZORPAY PAYMENT MONETIZATION & INVOICING APIS
// ============================================================================

// GET /api/payments/config
apiRouter.get('/payments/config', (_req, res) => {
  res.json({
    provider: 'razorpay',
    keyId: razorpayService.getPublicKeyId(),
    isConfigured: razorpayService.isConfigured()
  });
});

// GET /api/employer/posting-status
apiRouter.get('/employer/posting-status', requireAuth, requireRole('employer'), (req: AuthenticatedRequest, res) => {
  const employer = db.getEmployerByUserId(req.user!.id);
  if (!employer) return res.status(400).json({ error: 'Employer profile required' });

  const status = db.getEmployerFreePostingStatus(employer.id);
  res.json(status);
});

// POST /api/payments/create-order
apiRouter.post('/payments/create-order', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { paymentType, targetId, title, metadata } = req.body;
    const settings = db.getMonetizationSettings();

    let baseAmount = 0;
    let gstRate = 0;
    let gstAmount = 0;
    let totalAmount = 0;
    let amountInPaise = 0;
    let orderTitle = title || '';

    if (paymentType === 'job_posting') {
      const employer = db.getEmployerByUserId(req.user!.id);
      if (!employer) return res.status(400).json({ error: 'Employer profile required' });

      // Check weekly free quota
      const quotaStatus = db.getEmployerFreePostingStatus(employer.id);
      if (quotaStatus.hasFreeJobAvailable) {
        return res.json({
          success: true,
          requiresPayment: false,
          isFreeQuota: true,
          message: 'Weekly free job listing quota available. No payment required.'
        });
      }

      baseAmount = settings.paidJobPrice || 299;
      gstRate = settings.gstPercentage || 18;
      gstAmount = Math.round((baseAmount * gstRate / 100) * 100) / 100;
      totalAmount = Math.round((baseAmount + gstAmount) * 100) / 100;
      amountInPaise = Math.round(totalAmount * 100); // 35282 paise
      orderTitle = orderTitle || 'KarMetra Verified Employer Job Listing';
    } else if (paymentType === 'certificate') {
      const candidate = db.getCandidateByUserId(req.user!.id);
      if (!candidate) return res.status(400).json({ error: 'Candidate profile required' });

      if (!targetId) return res.status(400).json({ error: 'Course ID is required for certificate payment' });

      // Validate candidate has passed assessment with >=80%
      const attempts = db.getAssessmentAttempts(candidate.id, targetId);
      const passing = attempts.find(a => a.isPassed && a.percentage >= 80);
      if (!passing) {
        return res.status(400).json({ 
          error: 'Certificate eligibility requirement not met: You must pass the assessment with 80% or higher.' 
        });
      }

      // Check if already paid
      const existingCert = db.getCertificatesByCandidate(candidate.id).find(c => c.courseId === targetId);
      if (existingCert && existingCert.isPaid) {
        return res.json({
          success: true,
          requiresPayment: false,
          alreadyPaid: true,
          certificate: existingCert,
          message: 'Certificate is already purchased and available for download.'
        });
      }

      baseAmount = settings.certificatePrice || 29;
      gstRate = 0;
      gstAmount = 0;
      totalAmount = baseAmount;
      amountInPaise = Math.round(totalAmount * 100); // 2900 paise
      orderTitle = orderTitle || 'KarMetra Official Skill Certificate & Badge';
    } else {
      return res.status(400).json({ error: 'Invalid payment type requested' });
    }

    const rzpOrder = await razorpayService.createOrder({
      amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${paymentType.substring(0, 4)}_${Date.now()}`,
      notes: {
        userId: req.user!.id,
        paymentType,
        targetId: targetId || '',
        ...metadata
      }
    });

    const paymentRecord: PaymentRecord = {
      id: rzpOrder.orderId,
      userId: req.user!.id,
      userName: req.user!.fullName || req.user!.email,
      userEmail: req.user!.email,
      userMobile: req.user!.mobile,
      employerId: req.user!.role === 'employer' ? db.getEmployerByUserId(req.user!.id)?.id : undefined,
      candidateId: req.user!.role === 'candidate' ? db.getCandidateByUserId(req.user!.id)?.id : undefined,
      paymentType,
      targetId: targetId || rzpOrder.orderId,
      title: orderTitle,
      amount: baseAmount,
      gst: gstAmount,
      gstRate,
      total: totalAmount,
      currency: 'INR',
      gateway: 'Razorpay',
      gatewayTransactionId: '',
      razorpayOrderId: rzpOrder.orderId,
      status: 'Pending',
      metadata: metadata || {},
      createdAt: new Date().toISOString()
    };

    db.createPaymentRecord(paymentRecord);

    res.json({
      success: true,
      requiresPayment: true,
      order: paymentRecord,
      razorpayOrder: rzpOrder,
      keyId: rzpOrder.keyId,
      amount: totalAmount,
      amountInPaise,
      pricing: {
        baseAmount,
        gstRate,
        gstAmount,
        totalAmount
      }
    });
  } catch (err: any) {
    console.error('Create payment order error:', err);
    res.status(500).json({ error: err.message || 'Failed to create payment order' });
  }
});

// POST /api/payments/verify
apiRouter.post('/payments/verify', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { 
      orderId, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      gatewayTransactionId 
    } = req.body;

    const rzpOrderId = razorpay_order_id || orderId;
    const rzpPaymentId = razorpay_payment_id || gatewayTransactionId;
    const rzpSignature = razorpay_signature;

    let payment = db.getPaymentByRazorpayOrderId(rzpOrderId) || db.getPaymentById(orderId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment order record not found' });
    }

    if (payment.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized payment verification' });
    }

    // Idempotency: If already marked Paid/Success, return directly
    if (payment.status === 'Paid' || payment.status === 'Success') {
      return res.json({ 
        success: true, 
        verified: true, 
        payment, 
        invoice: payment.invoiceData,
        message: 'Payment has already been confirmed.'
      });
    }

    // Cryptographic Signature Verification
    if (rzpPaymentId && rzpSignature) {
      const isValid = razorpayService.verifyPaymentSignature({
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: rzpPaymentId,
        razorpaySignature: rzpSignature
      });

      if (!isValid) {
        db.updatePaymentStatus(payment.id, 'Failed', rzpPaymentId, {
          failedReason: 'Signature mismatch verification failed'
        });
        return res.status(400).json({ error: 'Payment verification failed: Invalid transaction signature' });
      }
    }

    const verifiedPaymentId = rzpPaymentId || `TXN-${Date.now()}`;
    const receiptNum = db.generateReceiptNumber();

    // Construct professional Tax Invoice data
    const invoiceData: PaymentInvoiceData = {
      receiptNumber: receiptNum,
      invoiceDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      paymentId: verifiedPaymentId,
      orderId: rzpOrderId,
      customerName: payment.userName || req.user!.fullName || 'Valued Customer',
      customerEmail: payment.userEmail || req.user!.email,
      customerPhone: payment.userMobile || req.user!.mobile || '',
      billingType: payment.paymentType === 'job_posting' ? 'Employer Enterprise Listing' : 'Candidate Verified Skill Credential',
      itemName: payment.title,
      baseAmount: payment.amount,
      gstRate: payment.gstRate || (payment.paymentType === 'job_posting' ? 18 : 0),
      gstAmount: payment.gst || 0,
      totalAmount: payment.total,
      currency: 'INR',
      status: 'PAID',
      platformDetails: {
        companyName: 'KarMetra Talent Technologies Private Limited',
        brandName: 'KarMetra Enterprise Jobs & Credentialing',
        headOffice: 'KarMetra Head Office, Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051',
        helpline: '+91 90492 17304',
        email: 'billing@karmetra.in',
        website: 'https://karmetra.in',
        gstin: '27AAACK1234M1Z5'
      }
    };

    // Update payment record in database
    const updatedPayment = db.updatePaymentStatus(payment.id, 'Paid', verifiedPaymentId, {
      razorpayPaymentId: verifiedPaymentId,
      razorpaySignature: rzpSignature || '',
      receiptNumber: receiptNum,
      verifiedAt: new Date().toISOString(),
      invoiceData
    });

    let issuedCertificate: Certificate | undefined;

    // Handle Job Posting Payment: Submit for Admin Approval (quality moderation required)
    if (payment.paymentType === 'job_posting' && payment.targetId) {
      const job = db.getJobById(payment.targetId);
      if (job) {
        job.paymentStatus = 'Paid';
        job.quotaType = 'paid';
        job.paymentId = payment.id;
        job.status = 'Pending Approval'; // Submitted for Admin Quality Approval
        job.updatedAt = new Date().toISOString();
        db.saveJob(job);

        // Notify employer
        db.createNotification({
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          userId: req.user!.id,
          title: 'Payment Successful - Job Submitted for Approval',
          titleHi: 'भुगतान सफल - नौकरी अनुमोदन के लिए प्रस्तुत की गई',
          message: `Payment of ₹${payment.total} for "${job.title}" confirmed (Receipt: ${receiptNum}). Your job vacancy is now under Admin review.`,
          messageHi: `"${job.title}" के लिए ₹${payment.total} का भुगतान स्वीकृत हुआ। आपकी नौकरी एडमिन समीक्षा के अंतर्गत है।`,
          type: 'system',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Handle Certificate Payment: Issue official Certificate & Unlock Download
    if (payment.paymentType === 'certificate' && payment.targetId) {
      const courseId = payment.targetId;
      const candidate = db.getCandidateByUserId(req.user!.id);
      const course = db.getCourseById(courseId);

      if (candidate && course) {
        const attempts = db.getAssessmentAttempts(candidate.id, courseId);
        const bestPassingAttempt = attempts.find(a => a.isPassed && a.percentage >= 80) || attempts[0];
        const scoreMarks = bestPassingAttempt?.score || 15;
        const totalMarks = bestPassingAttempt?.totalMarks || 15;
        const scorePercentage = bestPassingAttempt?.percentage || 100;

        const uniqueCode = `KM-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        
        issuedCertificate = {
          id: `cert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          verificationCode: uniqueCode,
          candidateId: candidate.id,
          candidateName: candidate.fullName,
          courseId: course.id,
          courseTitle: course.title,
          courseTitleHi: course.titleHi,
          skills: course.skillsTaught || [course.title],
          scoreMarks,
          totalMarks,
          scorePercentage,
          issueDate: new Date().toISOString().split('T')[0],
          status: 'Valid',
          isPaid: true,
          paymentId: payment.id,
          receiptNumber: receiptNum,
          qrCodeData: `https://karmetra.in/verify/${uniqueCode}`
        };

        db.saveCertificate(issuedCertificate);

        // Notify candidate
        db.createNotification({
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          userId: req.user!.id,
          title: `Verified Certificate Unlocked: ${course.title}`,
          titleHi: `प्रमाणपत्र जारी: ${course.titleHi || course.title}`,
          message: `Congratulations! Your verified certificate is now unlocked and ready for download. Code: ${uniqueCode}`,
          messageHi: `बधाई हो! आपका सत्यापित प्रमाणपत्र अब डाउनलोड के लिए उपलब्ध है। कोड: ${uniqueCode}`,
          type: 'certificate',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      verified: true,
      payment: updatedPayment,
      invoice: invoiceData,
      certificate: issuedCertificate,
      message: 'Payment verified and entitlement granted successfully.'
    });
  } catch (err: any) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
});

// POST /api/payments/webhook
apiRouter.post('/payments/webhook', (req: any, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (signature && process.env.RAZORPAY_WEBHOOK_SECRET) {
      const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn('Invalid Razorpay webhook signature received');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`Received Razorpay webhook event: ${event}`);

    if (event === 'order.paid' || event === 'payment.captured') {
      const paymentEntity = payload?.payment?.entity;
      const orderEntity = payload?.order?.entity;
      const rzpOrderId = paymentEntity?.order_id || orderEntity?.id;
      const rzpPaymentId = paymentEntity?.id;

      if (rzpOrderId) {
        const payment = db.getPaymentByRazorpayOrderId(rzpOrderId);
        if (payment && payment.status !== 'Paid') {
          db.updatePaymentStatus(payment.id, 'Paid', rzpPaymentId);
          console.log(`Payment order ${payment.id} marked as Paid via webhook`);
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;
      if (rzpOrderId) {
        const payment = db.getPaymentByRazorpayOrderId(rzpOrderId);
        if (payment && payment.status !== 'Paid') {
          db.updatePaymentStatus(payment.id, 'Failed', paymentEntity?.id, {
            failedReason: paymentEntity?.error_description || 'Payment failed at gateway'
          });
        }
      }
    }

    res.json({ status: 'ok', received: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

// GET /api/payments/receipt/:id
apiRouter.get('/payments/receipt/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const payment = db.getPaymentById(req.params.id) || db.getPaymentByRazorpayOrderId(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment record not found' });

  if (payment.userId !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const invoiceData: PaymentInvoiceData = payment.invoiceData || {
    receiptNumber: payment.receiptNumber || `INV-KM-${payment.id.substring(0, 8)}`,
    invoiceDate: new Date(payment.verifiedAt || payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    paymentId: payment.razorpayPaymentId || payment.gatewayTransactionId || payment.id,
    orderId: payment.razorpayOrderId || payment.id,
    customerName: payment.userName || 'Customer',
    customerEmail: payment.userEmail,
    customerPhone: payment.userMobile,
    billingType: payment.paymentType === 'job_posting' ? 'Employer Job Listing' : 'Candidate Certificate',
    itemName: payment.title,
    baseAmount: payment.amount,
    gstRate: payment.gstRate || (payment.paymentType === 'job_posting' ? 18 : 0),
    gstAmount: payment.gst || 0,
    totalAmount: payment.total,
    currency: payment.currency || 'INR',
    status: payment.status === 'Paid' || payment.status === 'Success' ? 'PAID' : payment.status.toUpperCase(),
    platformDetails: {
      companyName: 'KarMetra Talent Technologies Private Limited',
      brandName: 'KarMetra Enterprise Jobs & Credentialing',
      headOffice: 'KarMetra Head Office, Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051',
      helpline: '+91 90492 17304',
      email: 'billing@karmetra.in',
      website: 'https://karmetra.in',
      gstin: '27AAACK1234M1Z5'
    }
  };

  res.json({
    success: true,
    payment,
    invoice: invoiceData
  });
});

// GET /api/admin/payments
apiRouter.get('/admin/payments', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { status, type, search } = req.query;
  let payments = db.getPayments();

  if (status && status !== 'All') {
    payments = payments.filter(p => p.status.toLowerCase() === String(status).toLowerCase());
  }

  if (type && type !== 'All') {
    payments = payments.filter(p => p.paymentType === type);
  }

  if (search) {
    const q = String(search).toLowerCase();
    payments = payments.filter(p => 
      (p.id && p.id.toLowerCase().includes(q)) ||
      (p.razorpayOrderId && p.razorpayOrderId.toLowerCase().includes(q)) ||
      (p.razorpayPaymentId && p.razorpayPaymentId.toLowerCase().includes(q)) ||
      (p.userName && p.userName.toLowerCase().includes(q)) ||
      (p.userEmail && p.userEmail.toLowerCase().includes(q)) ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q))
    );
  }

  res.json({ payments, total: payments.length });
});

// ============================================================================
// 13. ADMIN MONETIZATION SETTINGS & REVENUE ANALYTICS
// ============================================================================

// GET /api/monetization/settings
apiRouter.get('/monetization/settings', (_req, res) => {
  const settings = db.getMonetizationSettings();
  res.json({ settings });
});

// PUT /api/monetization/settings
apiRouter.put('/monetization/settings', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const updated = db.updateMonetizationSettings(req.body);
  db.logAdminAction(
    req.user!.id,
    req.user!.fullName || 'Admin',
    'Update Monetization Settings',
    'Settings',
    'Monetization',
    `Updated pricing: Job ₹${updated.paidJobPrice}, GST ${updated.gstPercentage}%, Cert ₹${updated.certificatePrice}`
  );
  res.json({ success: true, settings: updated });
});

// GET /api/monetization/stats
apiRouter.get('/monetization/stats', requireAuth, requireRole('admin'), (_req, res) => {
  const payments = db.getPayments();
  const successful = payments.filter(p => p.status === 'Success');
  
  const jobPostingPayments = successful.filter(p => p.paymentType === 'job_posting');
  const certPayments = successful.filter(p => p.paymentType === 'certificate');

  const totalJobRevenue = jobPostingPayments.reduce((sum, p) => sum + p.total, 0);
  const totalCertRevenue = certPayments.reduce((sum, p) => sum + p.total, 0);
  const totalGstCollected = successful.reduce((sum, p) => sum + (p.gst || 0), 0);
  const totalGrossRevenue = totalJobRevenue + totalCertRevenue;

  const totalJobs = db.getAllJobs().length;
  const paidJobsCount = jobPostingPayments.length;
  const freeJobsCount = Math.max(0, totalJobs - paidJobsCount);

  res.json({
    totalGrossRevenue,
    totalJobRevenue,
    totalCertRevenue,
    totalGstCollected,
    totalTransactions: payments.length,
    successfulTransactions: successful.length,
    failedTransactions: payments.filter(p => p.status === 'Failed').length,
    paidJobsCount,
    freeJobsCount,
    recentPayments: payments.slice(0, 20)
  });
});

// GET /api/admin/payments
apiRouter.get('/admin/payments', requireAuth, requireRole('admin'), (_req, res) => {
  const payments = db.getPayments();
  res.json({ payments });
});

// ============================================================================
// 14. ADMIN COURSE LESSON & ASSESSMENT CURRICULUM MANAGEMENT
// ============================================================================

// POST /api/admin/courses/:id/lessons
apiRouter.post('/admin/courses/:id/lessons', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  try {
    const { moduleId, lesson } = req.body;
    const courseId = req.params.id;

    const newLesson: CourseLesson = {
      id: `les-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      moduleId: moduleId || `mod-${Date.now()}`,
      title: lesson.title || 'Untitled Lesson',
      titleHi: lesson.titleHi,
      description: lesson.description || '',
      descriptionHi: lesson.descriptionHi,
      durationMinutes: Number(lesson.durationMinutes) || 15,
      videoUrl: lesson.videoUrl || '',
      videoUrlHi: lesson.videoUrlHi,
      thumbnailUrl: lesson.thumbnailUrl,
      order: Number(lesson.order) || 1
    };

    const updatedCourse = db.addLessonToCourse(courseId, moduleId, newLesson);
    if (!updatedCourse) return res.status(404).json({ error: 'Course not found' });

    db.logAdminAction(
      req.user!.id,
      req.user!.fullName || 'Admin',
      'Add Course Lesson',
      'Course',
      courseId,
      `Added lesson "${newLesson.title}" to course ${updatedCourse.title}`
    );

    res.json({ success: true, course: updatedCourse });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add lesson' });
  }
});

// PUT /api/admin/courses/:id/lessons/:lessonId
apiRouter.put('/admin/courses/:id/lessons/:lessonId', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { id, lessonId } = req.params;
  const updatedCourse = db.updateLessonInCourse(id, lessonId, req.body);
  if (!updatedCourse) return res.status(404).json({ error: 'Lesson or Course not found' });

  res.json({ success: true, course: updatedCourse });
});

// DELETE /api/admin/courses/:id/lessons/:lessonId
apiRouter.delete('/admin/courses/:id/lessons/:lessonId', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { id, lessonId } = req.params;
  const updatedCourse = db.deleteLessonFromCourse(id, lessonId);
  if (!updatedCourse) return res.status(404).json({ error: 'Course not found' });

  res.json({ success: true, course: updatedCourse });
});

// PUT /api/admin/courses/:id/assessment
apiRouter.put('/admin/courses/:id/assessment', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const courseId = req.params.id;
  const assessment: CourseAssessment = {
    ...req.body,
    id: req.body.id || `assess-${courseId}`,
    courseId,
    timeLimitMinutes: Number(req.body.timeLimitMinutes) || 5,
    passingPercentage: Number(req.body.passingPercentage) || 80,
    maxAttempts: Number(req.body.maxAttempts) || 3
  };

  const updatedCourse = db.updateCourseAssessment(courseId, assessment);
  if (!updatedCourse) return res.status(404).json({ error: 'Course not found' });

  res.json({ success: true, course: updatedCourse });
});

// ============================================================================
// 15. LOCATION, ROUTING & AI JOB MATCHING ENGINE
// ============================================================================

// POST /api/location/route-distance
apiRouter.post('/location/route-distance', (req, res) => {
  try {
    const { originLat, originLon, destLat, destLon } = req.body;
    if (!originLat || !originLon || !destLat || !destLon) {
      return res.status(400).json({ error: 'Origin and destination coordinates are required' });
    }

    const straightLineKm = db.calculateDistanceKm(originLat, originLon, destLat, destLon);
    // Estimated road travel (approx 1.25x spherical distance)
    const roadDistanceKm = Math.round((straightLineKm * 1.25) * 10) / 10;

    // Speeds: Walking = 4.8 km/h, Bike = 24 km/h, Car = 38 km/h
    const walkMins = Math.round((roadDistanceKm / 4.8) * 60);
    const bikeMins = Math.round((roadDistanceKm / 24) * 60);
    const carMins = Math.round((roadDistanceKm / 38) * 60);

    res.json({
      straightLineKm,
      roadDistanceKm,
      travelTimes: {
        walk: { minutes: walkMins, label: `${walkMins} mins walk` },
        bike: { minutes: bikeMins, label: `${bikeMins} mins bike` },
        car: { minutes: carMins, label: `${carMins} mins car` }
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Routing calculation failed' });
  }
});

// GET /api/candidate/recommended-jobs
apiRouter.get('/candidate/recommended-jobs', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  const profile = db.getCandidateByUserId(req.user!.id);
  const allJobs = db.getAllJobs().filter(j => j.status === 'Active');

  if (!profile) {
    return res.json({ jobs: allJobs.slice(0, 10).map(j => ({ ...j, matchScore: 80 })) });
  }

  const scoredJobs = allJobs.map(job => {
    let distanceKm: number | undefined;
    if (profile.latitude && profile.longitude && job.latitude && job.longitude) {
      distanceKm = db.calculateDistanceKm(profile.latitude, profile.longitude, job.latitude, job.longitude);
    }

    return {
      ...job,
      matchScore: db.calculateMatchScore(profile, job),
      distanceKm
    };
  });

  scoredJobs.sort((a, b) => b.matchScore - a.matchScore);
  res.json({ jobs: scoredJobs });
});

// GET /api/employer/jobs/:id/matched-candidates
apiRouter.get('/employer/jobs/:id/matched-candidates', requireAuth, requireRole('employer'), (req: AuthenticatedRequest, res) => {
  const jobId = req.params.id;
  const settings = db.getMonetizationSettings();
  const limit = settings.freeJobCandidateReach || 25;

  const matched = db.getMatchedCandidatesForJob(jobId, limit);
  res.json({ matchedCandidates: matched, limit });
});

// GET /api/verify/:code
apiRouter.get('/verify/:code', (req, res) => {
  const code = req.params.code;
  const cert = db.getCertificateByCode(code);

  if (!cert) {
    return res.status(404).json({ error: 'Certificate credential not found' });
  }

  const course = db.getCourseById(cert.courseId);

  res.json({
    verified: true,
    certificate: {
      ...cert,
      status: 'ACTIVE & VALID',
      courseLevel: course?.level || 'All Levels',
      verifiedDate: cert.issueDate,
      issuingAuthority: 'KarMetra Skill Certification Directorate'
    }
  });
});

// ============================================================================
// 14. DYNAMIC JOB CATEGORIES (ADMIN & PUBLIC API)
// ============================================================================

// GET /api/categories
apiRouter.get('/categories', (req, res) => {
  try {
    const showAll = req.query.all === 'true';
    const categories = showAll ? db.getAllCategories() : db.getActiveCategories();
    res.json({ success: true, categories });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch job categories' });
  }
});

// POST /api/admin/categories
apiRouter.post('/admin/categories', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  try {
    const { name, nameHi, icon, description, subCategories, isActive, order } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const newCategory = {
      id: req.body.id || `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      nameHi: nameHi || '',
      icon: icon || 'Briefcase',
      description: description || '',
      subCategories: Array.isArray(subCategories) ? subCategories : [],
      isActive: isActive !== false,
      order: typeof order === 'number' ? order : db.getAllCategories().length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = db.saveCategory(newCategory);
    res.json({ success: true, category: saved });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create job category' });
  }
});

// PUT /api/admin/categories/:id
apiRouter.put('/admin/categories/:id', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  try {
    const category = db.getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Job category not found' });
    }

    const updated = db.saveCategory({
      ...category,
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, category: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update job category' });
  }
});

// DELETE /api/admin/categories/:id
apiRouter.delete('/admin/categories/:id', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  try {
    const success = db.deleteCategory(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Job category not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete job category' });
  }
});

// ============================================================================
// 15. GOVERNMENT JOB VACANCIES (STATE-WISE & PAN-INDIA)
// ============================================================================

// GET /api/govt-jobs (Public / Candidates)
apiRouter.get('/govt-jobs', (req, res) => {
  try {
    let vacancies = db.getPublishedGovtVacancies();
    const { state, search, jobType, minEducation } = req.query;

    if (state && typeof state === 'string' && state !== 'All') {
      vacancies = vacancies.filter(v => 
        v.state.toLowerCase() === state.toLowerCase() || 
        v.state.toLowerCase() === 'all india'
      );
    }

    if (jobType && typeof jobType === 'string' && jobType !== 'All') {
      vacancies = vacancies.filter(v => v.jobType.toLowerCase() === jobType.toLowerCase());
    }

    if (minEducation && typeof minEducation === 'string' && minEducation !== 'All') {
      vacancies = vacancies.filter(v => v.minEducation.toLowerCase() === minEducation.toLowerCase());
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      vacancies = vacancies.filter(v => 
        v.title.toLowerCase().includes(q) ||
        (v.titleHi && v.titleHi.toLowerCase().includes(q)) ||
        v.department.toLowerCase().includes(q) ||
        v.state.toLowerCase().includes(q) ||
        v.postName.toLowerCase().includes(q) ||
        v.recruitmentAuthority.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, vacancies, total: vacancies.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch government vacancies' });
  }
});

// GET /api/govt-jobs/:id
apiRouter.get('/govt-jobs/:id', (req, res) => {
  try {
    const vacancy = db.getGovtVacancyById(req.params.id);
    if (!vacancy) {
      return res.status(404).json({ error: 'Government vacancy not found' });
    }
    db.incrementGovtVacancyViews(req.params.id);
    res.json({ success: true, vacancy });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch vacancy details' });
  }
});

// POST /api/govt-jobs/:id/save (Candidate bookmark toggle)
apiRouter.post('/govt-jobs/:id/save', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  try {
    const candidate = db.getCandidateByUserId(req.user!.id);
    const candidateId = candidate ? candidate.id : req.user!.id;
    const vacancyId = req.params.id;

    const savedIds = db.getSavedGovtVacancyIds(candidateId);
    const isSaved = savedIds.includes(vacancyId);

    if (isSaved) {
      db.unsaveGovtJobForCandidate(candidateId, vacancyId);
      res.json({ success: true, saved: false, message: 'Removed from saved government vacancies' });
    } else {
      db.saveGovtJobForCandidate(candidateId, vacancyId);
      res.json({ success: true, saved: true, message: 'Government vacancy saved successfully' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle saved government vacancy' });
  }
});

// GET /api/candidate/saved-govt-jobs
apiRouter.get('/candidate/saved-govt-jobs', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  try {
    const candidate = db.getCandidateByUserId(req.user!.id);
    const candidateId = candidate ? candidate.id : req.user!.id;
    const savedVacancies = db.getSavedGovtVacancies(candidateId);
    const savedIds = db.getSavedGovtVacancyIds(candidateId);

    res.json({ success: true, savedVacancies, savedIds });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch saved government vacancies' });
  }
});

// GET /api/candidate/govt-alerts
apiRouter.get('/candidate/govt-alerts', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  try {
    const prefs = db.getGovtAlertPreferences(req.user!.id);
    res.json({
      success: true,
      preferences: prefs || {
        enabled: true,
        preferredStates: [],
        categories: [],
        qualification: 'All',
        notificationChannels: { inApp: true, whatsapp: false, email: false }
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch alert preferences' });
  }
});

// PUT /api/candidate/govt-alerts
apiRouter.put('/candidate/govt-alerts', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  try {
    db.saveGovtAlertPreferences(req.user!.id, req.body);
    // Also trigger auto notification check if alerts are enabled
    if (req.body.alertEnabled !== false && req.body.emailAlerts !== false) {
      db.triggerGovtJobNotificationsForUser(req.user!.id);
    }
    res.json({ success: true, preferences: req.body });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update alert preferences' });
  }
});

// GET /api/candidate/matched-govt-jobs (State, Qualification & Preference Cross-Referencing Engine)
apiRouter.get('/api/candidate/matched-govt-jobs', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  try {
    const data = db.getMatchedGovtVacanciesForUser(req.user!.id);
    const notifs = db.getNotificationsByUser(req.user!.id);
    const unreadGovtNotifs = notifs.filter(n => n.type === 'govt_job' && !n.isRead).length;

    res.json({
      success: true,
      matchedVacancies: data.matchedVacancies,
      stats: data.stats,
      unreadAlertCount: unreadGovtNotifs
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to cross-reference matched government vacancies' });
  }
});

// Allow without redundant /api prefix as well for robust routing
apiRouter.get('/candidate/matched-govt-jobs', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  try {
    const data = db.getMatchedGovtVacanciesForUser(req.user!.id);
    const notifs = db.getNotificationsByUser(req.user!.id);
    const unreadGovtNotifs = notifs.filter(n => n.type === 'govt_job' && !n.isRead).length;

    res.json({
      success: true,
      matchedVacancies: data.matchedVacancies,
      stats: data.stats,
      unreadAlertCount: unreadGovtNotifs
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to cross-reference matched government vacancies' });
  }
});

// POST /api/candidate/govt-alerts/trigger-notifications
apiRouter.post('/candidate/govt-alerts/trigger-notifications', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res) => {
  try {
    const outcome = db.triggerGovtJobNotificationsForUser(req.user!.id);
    res.json({ success: true, ...outcome });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate matched govt job notifications' });
  }
});

// GET /api/admin/govt-jobs (Admin - all vacancies)
apiRouter.get('/admin/govt-jobs', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  try {
    const vacancies = db.getAllGovtVacancies();
    res.json({ success: true, vacancies, total: vacancies.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin government vacancies' });
  }
});

// POST /api/admin/govt-jobs
apiRouter.post('/admin/govt-jobs', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  try {
    const {
      title, titleHi, department, departmentHi, state, district,
      recruitmentAuthority, vacancyNumber, totalVacancies, categoryWiseVacancies,
      postName, jobDescription, eligibility, minEducation, maxEducation,
      ageLimit, ageRelaxation, experience, requiredSkills, salary,
      applicationStartDate, applicationLastDate, examDate, admitCardDate,
      resultDate, applicationFee, officialNotificationUrl, officialApplyUrl,
      officialWebsite, importantDocuments, selectionProcess, jobType, status
    } = req.body;

    if (!title || !department || !state || !officialApplyUrl) {
      return res.status(400).json({ error: 'Title, Department, State, and Official Apply URL are required' });
    }

    const newVacancy = {
      id: req.body.id || `govt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      titleHi: titleHi || '',
      department,
      departmentHi: departmentHi || '',
      state,
      district: district || 'All Districts',
      recruitmentAuthority: recruitmentAuthority || department,
      vacancyNumber: vacancyNumber || `VAC-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      totalVacancies: Number(totalVacancies) || 1,
      categoryWiseVacancies: Array.isArray(categoryWiseVacancies) ? categoryWiseVacancies : [],
      postName: postName || title,
      jobDescription: jobDescription || '',
      eligibility: eligibility || '',
      minEducation: minEducation || '10th Pass',
      maxEducation: maxEducation || 'Graduate',
      ageLimit: ageLimit || '18 to 35 Years',
      ageRelaxation: ageRelaxation || 'As per Government Rules',
      experience: experience || 'Fresher Eligible',
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      salary: salary || 'As per Pay Matrix Level',
      applicationStartDate: applicationStartDate || new Date().toISOString(),
      applicationLastDate: applicationLastDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      examDate: examDate || 'To be announced',
      admitCardDate: admitCardDate || '',
      resultDate: resultDate || '',
      applicationFee: applicationFee || 'As per official notification',
      officialNotificationUrl: officialNotificationUrl || officialApplyUrl,
      officialApplyUrl,
      officialWebsite: officialWebsite || officialApplyUrl,
      importantDocuments: Array.isArray(importantDocuments) ? importantDocuments : ['10th Marksheet', 'Identity Proof', 'Category Certificate'],
      selectionProcess: selectionProcess || 'Written Exam -> Document Verification',
      jobType: jobType || 'State Government',
      status: status || 'Published',
      viewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = db.saveGovtVacancy(newVacancy);
    res.json({ success: true, vacancy: saved });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create government vacancy' });
  }
});

// PUT /api/admin/govt-jobs/:id
apiRouter.put('/admin/govt-jobs/:id', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  try {
    const vacancy = db.getGovtVacancyById(req.params.id);
    if (!vacancy) {
      return res.status(404).json({ error: 'Government vacancy not found' });
    }

    const updated = db.saveGovtVacancy({
      ...vacancy,
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, vacancy: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update government vacancy' });
  }
});

// DELETE /api/admin/govt-jobs/:id
apiRouter.delete('/admin/govt-jobs/:id', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  try {
    const success = db.deleteGovtVacancy(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Government vacancy not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete government vacancy' });
  }
});


