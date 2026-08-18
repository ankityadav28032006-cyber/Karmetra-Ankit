import React from 'react';
import { useAuth, PortalType } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { DOMAIN_CONFIG, getCurrentSubdomain, getPortalUrl } from '../../utils/domainConfig';
import { ShieldAlert, Lock, AlertTriangle, ArrowRight, Home, RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPortal?: PortalType;
  fallbackComponent?: React.ReactNode;
  onOpenLogin?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requiredPortal,
  fallbackComponent,
  onOpenLogin
}) => {
  const { user, isAuthenticated, isLoading, activePortal, setActivePortal, logout } = useAuth();
  const currentSubdomain = getCurrentSubdomain();

  // Show loading spinner during session verification
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-16 space-y-4">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">Verifying security credentials & access rights...</p>
      </div>
    );
  }

  // Check 1: Strict Admin Subdomain Lock
  // If user is accessing admin.karmetra.in or admin portal but is not an admin
  if (requiredPortal === 'admin' || (currentSubdomain === 'admin' && (!user || user.role !== 'admin'))) {
    if (!isAuthenticated) {
      return fallbackComponent ? <>{fallbackComponent}</> : (
        <div className="max-w-md mx-auto my-12 p-8 bg-slate-900 border border-red-500/30 rounded-2xl text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">KarMetra Master Administration</h2>
            <p className="text-xs text-slate-400 font-mono">admin.karmetra.in &bull; Private Security Subdomain</p>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            This administrative domain requires authorized credentials with cryptographic two-factor authentication. Unauthorized access attempts are monitored and logged.
          </p>
          {onOpenLogin ? (
            <button
              onClick={onOpenLogin}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Authenticate as Administrator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <a
              href={DOMAIN_CONFIG.publicAppUrl}
              className="inline-flex items-center gap-2 text-xs font-semibold text-teal-400 hover:text-teal-300"
            >
              <Home className="w-4 h-4" />
              <span>Return to Public Portal</span>
            </a>
          )}
        </div>
      );
    }

    if (user && user.role !== 'admin') {
      return (
        <div className="max-w-lg mx-auto my-12 p-8 bg-slate-900 border border-red-500/40 rounded-2xl text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Security Lockout: Insufficient Privileges</h2>
            <p className="text-xs text-red-400 font-medium">
              Logged in as {user.role.toUpperCase()} ({user.mobile})
            </p>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your current account does not have Administrative role clearance for <code className="text-red-300 font-mono bg-red-950 px-1.5 py-0.5 rounded">admin.karmetra.in</code>. Candidate and Recruiter sessions cannot cross over into the administrative panel.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={logout}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
            >
              Sign Out & Switch Account
            </button>
            <button
              onClick={() => setActivePortal(user.role === 'employer' ? 'employer' : 'candidate')}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              Go to Your {user.role === 'employer' ? 'Recruiter' : 'Job Seeker'} Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  // Check 2: Role Authorization
  if (allowedRoles.length > 0) {
    if (!isAuthenticated || !user) {
      return fallbackComponent ? <>{fallbackComponent}</> : (
        <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4 shadow-xl text-slate-900">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Authentication Required</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Please log in with your verified credentials to access this section.
          </p>
          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Sign In with Mobile OTP
            </button>
          )}
        </div>
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return (
        <div className="max-w-md mx-auto my-12 p-8 bg-white border border-amber-200 rounded-2xl text-center space-y-4 shadow-xl text-slate-900">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Role Restriction</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            This module is reserved for <strong>{allowedRoles.join(' / ')}</strong> accounts. You are currently logged in as a <strong>{user.role}</strong>.
          </p>
          <button
            onClick={() => setActivePortal(user.role === 'employer' ? 'employer' : 'candidate')}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl"
          >
            Return to Active Workspace
          </button>
        </div>
      );
    }
  }

  return <>{children}</>;
};
