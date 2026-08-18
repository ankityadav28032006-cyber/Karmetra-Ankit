import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from './db';
import { User, UserRole, AdminRole } from '../src/types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.ADMIN_SECRET;
  if (!secret) {
    // In production, fallback warning
    if (process.env.NODE_ENV === 'production') {
      console.warn('JWT_SECRET is not defined in environment variables! Using fallback signature key.');
    }
    return 'karmetra_jwt_secure_session_signing_secret_production_key_2026';
  }
  return secret;
}

export function generateToken(user: User, expiresInMs = 30 * 24 * 60 * 60 * 1000): string {
  const secret = getJwtSecret();
  const payload = {
    id: user.id,
    mobile: user.mobile,
    role: user.role,
    adminRole: user.adminRole || (user.role === 'admin' ? 'MASTER_ADMIN' : undefined),
    exp: Date.now() + expiresInMs
  };
  const str = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', secret).update(str).digest('hex');
  return Buffer.from(str, 'utf-8').toString('base64') + '.' + signature;
}

export function verifyToken(token: string): { id: string; mobile: string; role: UserRole; adminRole?: string; exp: number } | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const str = Buffer.from(parts[0], 'base64').toString('utf-8');
    const secret = getJwtSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(str).digest('hex');
    
    // Constant time comparison with length guard to prevent exceptions
    if (parts[1].length !== expectedSig.length) {
      return null;
    }
    if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(parts[1]))) {
      return null;
    }

    const payload = JSON.parse(str);
    if (!payload.exp || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        const user = db.getUserById(payload.id);
        if (user && user.isActive) {
          req.user = user;
        }
      }
    }
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session. Please log in again.' });
  }

  const user = db.getUserById(payload.id);
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Unauthorized: Account not found or suspended' });
  }

  req.user = user;
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Access restricted to ${allowedRoles.join(', ')}` });
    }
    // Strict check for admin portal: ensure user is an administrator
    if (allowedRoles.includes('admin')) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Access restricted to administrators' });
      }
    }
    next();
  };
}

export function requireAdminRole(...allowedAdminRoles: AdminRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Access restricted to administrators' });
    }
    const currentAdminRole = req.user.adminRole || 'ADMIN';
    if (allowedAdminRoles.length > 0 && !allowedAdminRoles.includes(currentAdminRole)) {
      return res.status(403).json({ 
        error: `Forbidden: This administrative action requires ${allowedAdminRoles.join(' or ')} permission.` 
      });
    }
    next();
  };
}

