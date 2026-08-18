import { UserRole } from '../../src/types';

export type AppEnvironment = 'development' | 'production';
export type SMSProviderName = 'fast2sms' | 'msg91' | 'console';

export interface OTPServiceConfig {
  appEnv: AppEnvironment;
  otpDemoMode: boolean;
  smsProvider: SMSProviderName;
  fast2smsApiKey: string;
  fast2smsOtpTemplateId: string;
  msg91AuthKey: string;
  msg91TemplateId: string;
  msg91SenderId: string;
  otpExpirySeconds: number;
  otpMaxAttempts: number;
  otpResendCooldownSeconds: number;
  testPhoneNumber: string;
  enableFallback: boolean;
}

export interface StoredOTPRecord {
  mobile: string;
  hashedOtp: string;
  salt: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  role: UserRole;
  ip?: string;
  requestCountInWindow: number;
  windowStart: number;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  mobile: string;
  provider: string;
  isDevelopment: boolean;
  devOtp?: string; // ONLY provided when appEnv === 'development' and otpDemoMode === true
  cooldownSeconds: number;
  expiresInSeconds: number;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
}

export interface OTPAdminConfigView {
  appEnv: AppEnvironment;
  otpDemoMode: boolean;
  smsProvider: SMSProviderName;
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
