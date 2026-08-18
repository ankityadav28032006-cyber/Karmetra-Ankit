import crypto from 'crypto';
import { db } from '../db';
import { UserRole } from '../../src/types';
import {
  AppEnvironment,
  SMSProviderName,
  OTPServiceConfig,
  StoredOTPRecord,
  SendOTPResponse,
  VerifyOTPResponse,
  OTPAdminConfigView
} from './types';
import { BaseOTPProvider } from './providers/BaseProvider';
import { Fast2SMSProvider } from './providers/Fast2SMSProvider';
import { MSG91Provider } from './providers/MSG91Provider';
import { DevSandboxProvider } from './providers/DevSandboxProvider';

export class OTPService {
  private static instance: OTPService;

  private config: OTPServiceConfig;
  private fast2smsProvider: Fast2SMSProvider;
  private msg91Provider: MSG91Provider;
  private devSandboxProvider: DevSandboxProvider;

  // In-memory rate limiting map: mobile -> { requestCount: number, windowStart: number }
  private rateLimitMap: Map<string, { count: number; windowStart: number }> = new Map();

  private constructor() {
    this.config = this.loadConfig();
    this.fast2smsProvider = new Fast2SMSProvider(
      this.config.fast2smsApiKey,
      this.config.fast2smsOtpTemplateId
    );
    this.msg91Provider = new MSG91Provider(
      this.config.msg91AuthKey,
      this.config.msg91TemplateId,
      this.config.msg91SenderId
    );
    this.devSandboxProvider = new DevSandboxProvider();
  }

  public static getInstance(): OTPService {
    if (!OTPService.instance) {
      OTPService.instance = new OTPService();
    }
    return OTPService.instance;
  }

  public reloadConfig(): OTPServiceConfig {
    this.config = this.loadConfig();
    this.fast2smsProvider = new Fast2SMSProvider(
      this.config.fast2smsApiKey,
      this.config.fast2smsOtpTemplateId
    );
    this.msg91Provider = new MSG91Provider(
      this.config.msg91AuthKey,
      this.config.msg91TemplateId,
      this.config.msg91SenderId
    );
    return this.config;
  }

  private loadConfig(): OTPServiceConfig {
    const rawEnv = (process.env.APP_ENV || 'development').toLowerCase().trim();
    const appEnv: AppEnvironment = rawEnv === 'production' ? 'production' : 'development';

    // Critical Production Safety Rule:
    // If APP_ENV=production, OTP_DEMO_MODE MUST automatically be false!
    let otpDemoMode = process.env.OTP_DEMO_MODE === 'true';
    if (appEnv === 'production') {
      otpDemoMode = false;
    }

    const rawProvider = (process.env.SMS_PROVIDER || process.env.OTP_PROVIDER || 'fast2sms')
      .toLowerCase()
      .trim();
    const smsProvider: SMSProviderName =
      rawProvider === 'msg91' ? 'msg91' : rawProvider === 'console' ? 'console' : 'fast2sms';

    const fast2smsApiKey = process.env.FAST2SMS_API_KEY || '';
    const fast2smsOtpTemplateId = process.env.FAST2SMS_OTP_TEMPLATE_ID || '';
    const msg91AuthKey = process.env.MSG91_AUTH_KEY || '';
    const msg91TemplateId = process.env.MSG91_TEMPLATE_ID || '';
    const msg91SenderId = process.env.MSG91_SENDER_ID || 'KARMET';

    const otpExpirySeconds = parseInt(process.env.OTP_EXPIRY_SECONDS || '300', 10) || 300;
    const otpMaxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10) || 5;
    const otpResendCooldownSeconds =
      parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '30', 10) || 30;

    const testPhoneNumber = (process.env.TEST_PHONE_NUMBER || '').replace(/\D/g, '').slice(-10);
    const enableFallback = process.env.ENABLE_SMS_FALLBACK === 'true';

    return {
      appEnv,
      otpDemoMode,
      smsProvider,
      fast2smsApiKey,
      fast2smsOtpTemplateId,
      msg91AuthKey,
      msg91TemplateId,
      msg91SenderId,
      otpExpirySeconds,
      otpMaxAttempts,
      otpResendCooldownSeconds,
      testPhoneNumber,
      enableFallback
    };
  }

  public getConfig(): OTPServiceConfig {
    return { ...this.config };
  }

  /**
   * Generates a cryptographically random 6-digit OTP
   */
  public generateSecureOTP(): string {
    const num = crypto.randomInt(100000, 999999);
    return num.toString();
  }

  /**
   * Hashes an OTP using SHA-256 and a unique per-record salt
   */
  public hashOTP(otp: string, salt: string): string {
    return crypto
      .createHash('sha256')
      .update(otp + salt)
      .digest('hex');
  }

  /**
   * Generates a random cryptographic salt
   */
  private generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Production Safety Check
   */
  public checkProductionReadiness(): { ready: boolean; errors: string[] } {
    const errors: string[] = [];
    const { appEnv, smsProvider, fast2smsApiKey, msg91AuthKey, fast2smsOtpTemplateId, msg91TemplateId } = this.config;

    if (appEnv === 'production') {
      if (smsProvider === 'fast2sms') {
        if (!fast2smsApiKey || fast2smsApiKey.trim().length < 8) {
          errors.push('FAST2SMS_API_KEY is not configured or too short.');
        }
      } else if (smsProvider === 'msg91') {
        if (!msg91AuthKey || msg91AuthKey.trim().length < 8) {
          errors.push('MSG91_AUTH_KEY is not configured.');
        }
        if (!msg91TemplateId) {
          errors.push('MSG91_TEMPLATE_ID is required for MSG91 OTP route.');
        }
      } else {
        errors.push(`Invalid SMS provider '${smsProvider}' for production. Use 'fast2sms' or 'msg91'.`);
      }
    }

    return {
      ready: errors.length === 0,
      errors
    };
  }

  /**
   * Sends OTP according to current environment and mode
   */
  public async sendOTP(
    mobile: string,
    role: UserRole,
    ip?: string
  ): Promise<SendOTPResponse> {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      throw new Error('Please enter a valid 10-digit Indian mobile number');
    }

    const now = Date.now();
    const { appEnv, otpDemoMode, otpExpirySeconds, otpResendCooldownSeconds, otpMaxAttempts } =
      this.config;

    // Rate Limiting Check (Max 5 requests per 15-minute window per phone number)
    const windowMs = 15 * 60 * 1000;
    const rateData = this.rateLimitMap.get(cleanMobile) || { count: 0, windowStart: now };
    if (now - rateData.windowStart > windowMs) {
      rateData.count = 1;
      rateData.windowStart = now;
    } else {
      rateData.count += 1;
    }
    this.rateLimitMap.set(cleanMobile, rateData);

    if (rateData.count > 10) {
      this.logAudit(
        'system',
        'System OTP Gate',
        'OTP_RATE_LIMITED',
        'auth',
        cleanMobile,
        `Mobile +91 ${cleanMobile} exceeded rate limits (IP: ${ip || 'unknown'})`
      );
      throw new Error('Too many OTP requests. Please wait 15 minutes before trying again.');
    }

    // Check existing OTP record for cooldown and previous attempts
    const existing = db.getOTPRecord(cleanMobile, role);
    if (existing) {
      const timeSinceLast = now - existing.lastSentAt;
      const cooldownMs = otpResendCooldownSeconds * 1000;

      if (timeSinceLast < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - timeSinceLast) / 1000);
        throw new Error(`Please wait ${remainingSec} seconds before requesting a new OTP`);
      }

      if (existing.attempts >= otpMaxAttempts && existing.expiresAt > now) {
        this.logAudit(
          'system',
          'System OTP Gate',
          'OTP_MAX_ATTEMPTS_EXCEEDED',
          'auth',
          cleanMobile,
          `Too many failed attempts for mobile +91 ${cleanMobile}`
        );
        throw new Error('Maximum failed attempts reached. Please wait for the current OTP window to expire.');
      }
    }

    // Production Safety Enforcement:
    if (appEnv === 'production') {
      const readiness = this.checkProductionReadiness();
      if (!readiness.ready) {
        this.logAudit(
          'system',
          'System OTP Gate',
          'OTP_PROVIDER_ERROR',
          'auth',
          cleanMobile,
          `Production OTP failure: ${readiness.errors.join('; ')}`
        );
        throw new Error('Production OTP provider is not configured. Please contact administrator.');
      }
    }

    // Generate random 6-digit OTP
    const rawOtp = this.generateSecureOTP();
    const salt = this.generateSalt();
    const hashedOtp = this.hashOTP(rawOtp, salt);

    let providerUsed = 'dev-sandbox';
    let dispatchSuccess = false;
    let dispatchMessage = '';

    // Choose dispatch path
    if (appEnv === 'development' && otpDemoMode) {
      // Safe Development Mode: Do NOT dispatch real SMS
      const devRes = await this.devSandboxProvider.sendOTP(cleanMobile, rawOtp, { role });
      dispatchSuccess = devRes.success;
      dispatchMessage = devRes.message;
      providerUsed = this.devSandboxProvider.name;
    } else {
      // Production Mode (or Development with Live SMS configured)
      let primaryProvider: BaseOTPProvider =
        this.config.smsProvider === 'msg91' ? this.msg91Provider : this.fast2smsProvider;

      const res = await primaryProvider.sendOTP(cleanMobile, rawOtp, { role });
      if (res.success) {
        dispatchSuccess = true;
        dispatchMessage = res.message;
        providerUsed = primaryProvider.name;
      } else if (this.config.enableFallback) {
        // Fallback provider attempt (if primary failed and fallback enabled)
        const fallbackProvider: BaseOTPProvider =
          primaryProvider === this.fast2smsProvider ? this.msg91Provider : this.fast2smsProvider;

        if (fallbackProvider.isConfigured()) {
          console.warn(`[KarMetra OTP] Primary provider ${primaryProvider.name} failed. Attempting fallback ${fallbackProvider.name}...`);
          const fallbackRes = await fallbackProvider.sendOTP(cleanMobile, rawOtp, { role });
          if (fallbackRes.success) {
            dispatchSuccess = true;
            dispatchMessage = fallbackRes.message;
            providerUsed = fallbackProvider.name;
          } else {
            dispatchMessage = `Primary & Fallback SMS dispatch failed: ${res.message}; ${fallbackRes.message}`;
          }
        } else {
          dispatchMessage = res.message;
        }
      } else {
        dispatchMessage = res.message;
      }
    }

    if (!dispatchSuccess) {
      this.logAudit(
        'system',
        'System OTP Gate',
        'OTP_PROVIDER_ERROR',
        'auth',
        cleanMobile,
        `Failed to dispatch OTP to +91 ${cleanMobile} via ${providerUsed}: ${dispatchMessage}`
      );
      throw new Error(dispatchMessage || 'Failed to dispatch OTP via SMS Gateway. Please try again.');
    }

    // Save hashed OTP in database
    db.saveOTPRecord({
      mobile: cleanMobile,
      otp: hashedOtp, // Secure SHA-256 hash
      salt,
      expiresAt: now + otpExpirySeconds * 1000,
      attempts: 0,
      lastSentAt: now,
      role
    } as any);

    // Audit Log (NO plaintext OTP or secrets logged!)
    this.logAudit(
      'system',
      'System OTP Gate',
      'OTP_REQUESTED',
      'auth',
      cleanMobile,
      `OTP requested for +91 ${cleanMobile} (${role}) via ${providerUsed} in ${appEnv.toUpperCase()} mode`
    );

    const isDevelopment = appEnv === 'development' && otpDemoMode;

    return {
      success: true,
      message: `OTP sent successfully to +91 ${cleanMobile}`,
      mobile: cleanMobile,
      provider: providerUsed,
      isDevelopment,
      // ONLY return devOtp in Development Safe Mode:
      devOtp: isDevelopment ? rawOtp : undefined,
      cooldownSeconds: otpResendCooldownSeconds,
      expiresInSeconds: otpExpirySeconds
    };
  }

  /**
   * Verifies an OTP securely against stored SHA-256 hash
   */
  public verifyOTP(
    mobile: string,
    submittedOtp: string,
    role: UserRole,
    ip?: string
  ): VerifyOTPResponse {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    const cleanOtp = submittedOtp.trim();

    if (cleanMobile.length !== 10) {
      throw new Error('Invalid mobile number format');
    }
    if (cleanOtp.length !== 6) {
      throw new Error('Please enter the 6-digit OTP code');
    }

    const otpRecord = db.getOTPRecord(cleanMobile, role) as any;
    const now = Date.now();

    if (!otpRecord) {
      throw new Error('No active OTP request found for this number. Please request a new OTP.');
    }

    // Check expiry
    if (otpRecord.expiresAt < now) {
      db.removeOTPRecord(cleanMobile, role);
      this.logAudit(
        'system',
        'System OTP Gate',
        'OTP_EXPIRED',
        'auth',
        cleanMobile,
        `Expired OTP verification attempt for +91 ${cleanMobile} (${role})`
      );
      throw new Error('OTP has expired. Please request a new code.');
    }

    // Check max attempts
    if (otpRecord.attempts >= this.config.otpMaxAttempts) {
      db.removeOTPRecord(cleanMobile, role);
      this.logAudit(
        'system',
        'System OTP Gate',
        'OTP_MAX_ATTEMPTS_EXCEEDED',
        'auth',
        cleanMobile,
        `Max verification attempts exceeded for +91 ${cleanMobile} (${role})`
      );
      throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
    }

    // Verify hash
    let isValid = false;
    if (otpRecord.salt) {
      const computedHash = this.hashOTP(cleanOtp, otpRecord.salt);
      isValid = computedHash === otpRecord.otp;
    } else {
      // Legacy plaintext fallback for pre-migration records
      isValid = otpRecord.otp === cleanOtp;
    }

    if (!isValid) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      db.saveOTPRecord(otpRecord);
      const remaining = Math.max(0, this.config.otpMaxAttempts - otpRecord.attempts);

      this.logAudit(
        'system',
        'System OTP Gate',
        'OTP_VERIFIED_FAILURE',
        'auth',
        cleanMobile,
        `Invalid OTP entered for +91 ${cleanMobile} (${role}). Remaining attempts: ${remaining}`
      );

      throw new Error(`Invalid OTP. ${remaining} attempt(s) remaining.`);
    }

    // Success! Consume OTP immediately so it cannot be re-used
    db.removeOTPRecord(cleanMobile, role);

    this.logAudit(
      'system',
      'System OTP Gate',
      'OTP_VERIFIED_SUCCESS',
      'auth',
      cleanMobile,
      `OTP verified successfully for +91 ${cleanMobile} (${role}) (IP: ${ip || 'unknown'})`
    );

    return {
      success: true,
      message: 'OTP verified successfully'
    };
  }

  /**
   * Returns safe admin status view without exposing production API keys or tokens
   */
  public getAdminConfigView(): OTPAdminConfigView {
    const {
      appEnv,
      otpDemoMode,
      smsProvider,
      fast2smsApiKey,
      fast2smsOtpTemplateId,
      msg91AuthKey,
      msg91TemplateId,
      otpExpirySeconds,
      otpMaxAttempts,
      otpResendCooldownSeconds,
      testPhoneNumber,
      enableFallback
    } = this.config;

    const fast2smsConfigured = Boolean(fast2smsApiKey && fast2smsApiKey.trim().length > 6);
    const fast2smsTemplateConfigured = Boolean(fast2smsOtpTemplateId && fast2smsOtpTemplateId.trim().length > 0);
    const msg91Configured = Boolean(msg91AuthKey && msg91AuthKey.trim().length > 6);
    const msg91TemplateConfigured = Boolean(msg91TemplateId && msg91TemplateId.trim().length > 0);

    let providerStatus: 'Configured' | 'Not Configured' | 'Connected' | 'Error' = 'Not Configured';

    if (appEnv === 'development' && otpDemoMode) {
      providerStatus = 'Connected';
    } else if (smsProvider === 'fast2sms') {
      providerStatus = fast2smsConfigured ? 'Connected' : 'Not Configured';
    } else if (smsProvider === 'msg91') {
      providerStatus = msg91Configured && msg91TemplateConfigured ? 'Connected' : 'Not Configured';
    }

    const readiness = this.checkProductionReadiness();

    return {
      appEnv,
      otpDemoMode,
      smsProvider,
      providerStatus,
      fast2smsConfigured,
      fast2smsTemplateConfigured,
      msg91Configured,
      msg91TemplateConfigured,
      otpExpirySeconds,
      otpMaxAttempts,
      otpResendCooldownSeconds,
      testPhoneNumberSet: Boolean(testPhoneNumber && testPhoneNumber.length === 10),
      fallbackEnabled: enableFallback,
      productionReady: readiness.ready,
      productionErrors: readiness.errors
    };
  }

  /**
   * Safe audit log helper
   */
  private logAudit(
    adminId: string,
    adminName: string,
    action: string,
    targetType: string,
    targetId: string,
    details: string
  ) {
    try {
      db.logAdminAction(adminId, adminName, action, targetType, targetId, details);
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }
}
