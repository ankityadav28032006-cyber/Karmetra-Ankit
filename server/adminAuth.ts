import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { User, AdminRole } from '../src/types';

// Rate Limiting & Failed Attempt Store (in-memory with 15-minute sliding window)
interface FailedAttemptRecord {
  count: number;
  firstFailedAt: number;
  lockedUntil?: number;
}

const failedAttemptsMap = new Map<string, FailedAttemptRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const WINDOW_DURATION_MS = 15 * 60 * 1000;  // 15 minutes window

/**
 * Clean expired rate-limit records periodically
 */
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of failedAttemptsMap.entries()) {
    if (record.lockedUntil && record.lockedUntil < now) {
      failedAttemptsMap.delete(key);
    } else if (!record.lockedUntil && now - record.firstFailedAt > WINDOW_DURATION_MS) {
      failedAttemptsMap.delete(key);
    }
  }
}

/**
 * Check if the given identifier (IP or Email) is currently locked out
 */
export function isRateLimited(identifier: string): { isLocked: boolean; remainingSeconds?: number } {
  cleanupRateLimitStore();
  const record = failedAttemptsMap.get(identifier);
  if (!record || !record.lockedUntil) {
    return { isLocked: false };
  }

  const now = Date.now();
  if (record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { isLocked: true, remainingSeconds };
  }

  // Lockout expired
  failedAttemptsMap.delete(identifier);
  return { isLocked: false };
}

/**
 * Record a failed admin login attempt
 */
export function recordFailedAttempt(identifier: string): { locked: boolean; attemptsLeft: number } {
  const now = Date.now();
  let record = failedAttemptsMap.get(identifier);

  if (!record || (now - record.firstFailedAt > WINDOW_DURATION_MS && !record.lockedUntil)) {
    record = { count: 1, firstFailedAt: now };
  } else {
    record.count += 1;
  }

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    failedAttemptsMap.set(identifier, record);
    return { locked: true, attemptsLeft: 0 };
  }

  failedAttemptsMap.set(identifier, record);
  return { locked: false, attemptsLeft: MAX_FAILED_ATTEMPTS - record.count };
}

/**
 * Reset failed attempts upon successful authentication
 */
export function resetFailedAttempts(identifier: string) {
  failedAttemptsMap.delete(identifier);
}

/**
 * Securely verify plain password against a stored hash or configured password.
 * Supports bcrypt ($2a$, $2b$, $2y$), scrypt format (scrypt:salt:hex), or constant-time hash comparison.
 */
export async function verifyPasswordHash(password: string, storedHashOrPassword?: string): Promise<boolean> {
  if (!password || !storedHashOrPassword) return false;

  const trimmedPassword = password.trim();
  const hash = storedHashOrPassword.trim();

  // 1. Check bcrypt format ($2a$, $2b$, $2y$)
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    try {
      return await bcrypt.compare(trimmedPassword, hash);
    } catch (err) {
      console.error('Bcrypt comparison error:', err);
      return false;
    }
  }

  // 2. Check scrypt format (scrypt:salt:derivedHex)
  if (hash.startsWith('scrypt:')) {
    try {
      const parts = hash.split(':');
      if (parts.length === 3) {
        const salt = parts[1];
        const key = parts[2];
        const derivedKey = crypto.scryptSync(trimmedPassword, salt, 64);
        const expectedBuffer = Buffer.from(key, 'hex');
        if (derivedKey.length !== expectedBuffer.length) return false;
        return crypto.timingSafeEqual(derivedKey, expectedBuffer);
      }
    } catch (err) {
      console.error('Scrypt comparison error:', err);
      return false;
    }
  }

  // 3. Check SHA256 hex format (sha256:salt:hash or 64-char hex)
  if (hash.startsWith('sha256:') || hash.length === 64) {
    try {
      let salt = '';
      let targetHash = hash;
      if (hash.startsWith('sha256:')) {
        const parts = hash.split(':');
        salt = parts[1] || '';
        targetHash = parts[2] || '';
      }
      const computed = crypto.createHash('sha256').update(trimmedPassword + salt).digest('hex');
      if (computed.length !== targetHash.length) return false;
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(targetHash));
    } catch {
      return false;
    }
  }

  // 4. Fallback for environment variable set directly as plain string in non-production
  // Compare using timingSafeEqual to avoid timing side-channels
  try {
    const bufA = Buffer.from(trimmedPassword);
    const bufB = Buffer.from(hash);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Validate password requirements:
 * - minimum 10 characters
 * - at least 1 uppercase letter (A-Z)
 * - at least 1 lowercase letter (a-z)
 * - at least 1 number (0-9)
 * - at least 1 special character (!@#$%^&* etc.)
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (!password || password.length < 10) {
    return { isValid: false, message: 'Password must be at least 10 characters in length.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number (0-9).' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&* etc.).' };
  }
  return { isValid: true };
}

/**
 * Hash a password using bcrypt (cost factor 12)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password.trim(), salt);
}

/**
 * Verify whether Admin authentication environment variables or persistent setup is configured.
 */
export function getAdminAuthConfig(): {
  isConfigured: boolean;
  adminEmail?: string;
  passwordHash?: string;
  adminSecret?: string;
  fullName?: string;
  missingConfig?: string[];
  error?: string;
} {
  const adminEmail = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD;
  const adminSecret = process.env.ADMIN_SECRET;

  if (adminEmail && (passwordHash || adminSecret)) {
    return {
      isConfigured: true,
      adminEmail: adminEmail.trim(),
      passwordHash: passwordHash?.trim(),
      adminSecret: adminSecret?.trim(),
      fullName: 'Master Admin'
    };
  }

  const dbAdminAuth = db.getAdminAuth();
  if (dbAdminAuth && dbAdminAuth.email && dbAdminAuth.passwordHash) {
    return {
      isConfigured: true,
      adminEmail: dbAdminAuth.email.trim(),
      passwordHash: dbAdminAuth.passwordHash.trim(),
      fullName: dbAdminAuth.fullName || 'Master Admin'
    };
  }

  const missing: string[] = [];
  if (!adminEmail && (!dbAdminAuth || !dbAdminAuth.email)) missing.push('ADMIN_EMAIL');
  if (!passwordHash && !adminSecret && (!dbAdminAuth || !dbAdminAuth.passwordHash)) missing.push('ADMIN_PASSWORD_HASH');

  return {
    isConfigured: false,
    missingConfig: missing,
    error: `Admin authentication is not configured. Missing configuration: ${missing.join(', ')}. Please complete the Master Admin Initial Setup.`
  };
}
