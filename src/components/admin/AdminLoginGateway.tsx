import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, ArrowRight, RefreshCw, AlertCircle, Mail, UserCheck, KeyRound, Eye, EyeOff, CheckCircle2, Sparkles, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiClient';

export const AdminLoginGateway: React.FC = () => {
  const { loginSuccess } = useAuth();
  
  // Setup vs Login Mode
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isSetupMode, setIsSetupMode] = useState(false);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Setup form state
  const [setupEmail, setSetupEmail] = useState('admin@karmetra.in');
  const [setupFullName, setSetupFullName] = useState('Master Administrator');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await api.getAdminSetupStatus();
      if (!res.isConfigured) {
        setIsSetupMode(true);
        if (res.adminEmail) {
          setSetupEmail(res.adminEmail);
        }
      } else {
        setIsSetupMode(false);
        if (res.adminEmail) {
          setEmail(res.adminEmail);
        }
      }
    } catch {
      // If error occurs, default to login mode
      setIsSetupMode(false);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Invalid admin credentials.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.adminLogin({ email: trimmedEmail, password: trimmedPassword });
      if (res.success && res.token && res.user) {
        loginSuccess(res.token, res.user);
      } else {
        setError('Invalid admin credentials.');
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('not configured') || err.message.includes('locked') || err.message.includes('Too many'))) {
        setError(err.message);
      } else {
        setError('Invalid admin credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedEmail = setupEmail.trim();
    const trimmedPassword = setupPassword.trim();
    const trimmedConfirm = setupConfirmPassword.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid administrative email address.');
      return;
    }

    if (trimmedPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.adminSetup({
        email: trimmedEmail,
        password: trimmedPassword,
        fullName: setupFullName.trim() || 'Master Administrator'
      });

      if (res.success && res.token && res.user) {
        setSuccessMessage('Master Admin credentials configured and encrypted successfully!');
        setTimeout(() => {
          loginSuccess(res.token, res.user);
        }, 1000);
      } else {
        setError(res.message || 'Failed to initialize Master Admin credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Initialization failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-white text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
        <p className="text-xs text-slate-400">Verifying Master Admin security gateway...</p>
      </div>
    );
  }

  // --- ONE-TIME MASTER ADMIN SETUP FLOW ---
  if (isSetupMode) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-slate-900 border border-teal-500/40 rounded-3xl shadow-2xl text-white text-center space-y-6 animate-in fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-full text-xs font-semibold">
          <KeyRound className="w-3.5 h-3.5" />
          <span>One-Time Initial Security Setup</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Initialize Master Administrator
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Choose your Master Admin email and password. Your password will be securely hashed with bcrypt on the backend and never stored in plaintext.
          </p>
        </div>

        {error && (
          <div id="admin-setup-error-alert" className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center justify-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        <form id="admin-setup-form" onSubmit={handleAdminSetup} className="space-y-4 text-left">
          <div>
            <label htmlFor="setup-email-input" className="block text-xs font-bold text-slate-300 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                id="setup-email-input"
                type="email"
                value={setupEmail}
                onChange={(e) => { setSetupEmail(e.target.value); setError(null); }}
                placeholder="admin@karmetra.in"
                autoComplete="email"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="setup-name-input" className="block text-xs font-bold text-slate-300 mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                id="setup-name-input"
                type="text"
                value={setupFullName}
                onChange={(e) => { setSetupFullName(e.target.value); setError(null); }}
                placeholder="Master Administrator"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="setup-password-input" className="block text-xs font-bold text-slate-300">
                Choose Master Password (min 8 characters)
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                id="setup-password-input"
                type={showPassword ? 'text' : 'password'}
                value={setupPassword}
                onChange={(e) => { setSetupPassword(e.target.value); setError(null); }}
                placeholder="Enter strong password..."
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500 transition-all font-mono"
              />
            </div>
            {setupPassword && (
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      setupPassword.length < 8 ? 'w-1/3 bg-red-500' :
                      setupPassword.length < 12 ? 'w-2/3 bg-amber-500' : 'w-full bg-emerald-500'
                    }`} 
                  />
                </div>
                <span className={
                  setupPassword.length < 8 ? 'text-red-400' :
                  setupPassword.length < 12 ? 'text-amber-400' : 'text-emerald-400'
                }>
                  {setupPassword.length < 8 ? 'Too short' : setupPassword.length < 12 ? 'Good' : 'Strong'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="setup-confirm-input" className="block text-xs font-bold text-slate-300 mb-1.5">
              Confirm Master Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                id="setup-confirm-input"
                type={showPassword ? 'text' : 'password'}
                value={setupConfirmPassword}
                onChange={(e) => { setSetupConfirmPassword(e.target.value); setError(null); }}
                placeholder="Re-enter password to confirm..."
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500 transition-all font-mono"
              />
            </div>
            {setupConfirmPassword && (
              <p className={`text-[11px] mt-1.5 ${setupPassword === setupConfirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
                {setupPassword === setupConfirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          <button
            id="admin-setup-submit-btn"
            type="submit"
            disabled={loading || setupPassword.length < 8 || setupPassword !== setupConfirmPassword}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            <span>{loading ? 'Initializing Security...' : 'Complete Secure Setup & Launch Console'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>

        <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-teal-400" />
          <span>Bcrypt cost factor 12 • No plaintext password is ever stored or logged</span>
        </div>
      </div>
    );
  }

  // --- STANDARD ADMIN LOGIN FLOW ---
  return (
    <div className="max-w-xl mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-white text-center space-y-6 animate-in fade-in">
      <div className="w-16 h-16 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-center mx-auto text-teal-400">
        <ShieldCheck className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          KarMetra Administration Console
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Authorized Master Admin login to govern PAN-India operations, certifications, and employer verifications.
        </p>
      </div>

      {error && (
        <div id="admin-login-error-alert" className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center justify-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form id="admin-login-form" onSubmit={handleAdminAuth} className="space-y-4 text-left">
        <div>
          <label htmlFor="admin-email-input" className="block text-xs font-bold text-slate-300 mb-1.5">
            Admin Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              id="admin-email-input"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="admin@karmetra.in"
              autoComplete="username"
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label htmlFor="admin-password-input" className="block text-xs font-bold text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              id="admin-password-input"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="••••••••••••"
              autoComplete="current-password"
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500 transition-all"
            />
          </div>
        </div>

        <button
          id="admin-signin-btn"
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <UserCheck className="w-4 h-4" />
          )}
          <span>{loading ? 'Authenticating...' : 'Sign In to Admin Console'}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </form>

      <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3 text-teal-500/70" />
        <span>End-to-end encrypted administrative channel • KarMetra Security Protocol</span>
      </div>
    </div>
  );
};
