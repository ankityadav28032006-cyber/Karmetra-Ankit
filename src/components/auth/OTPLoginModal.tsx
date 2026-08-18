import React, { useState, useEffect } from 'react';
import { Smartphone, Shield, Lock, Mail, ArrowRight, RefreshCw, X, CheckCircle2, AlertCircle, Sparkles, Terminal, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';

interface OTPLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'candidate' | 'employer' | 'admin';
}

export const OTPLoginModal: React.FC<OTPLoginModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'candidate'
}) => {
  const { loginSuccess, setActivePortal } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'candidate' | 'employer' | 'admin'>(defaultRole);
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminFullName, setAdminFullName] = useState('Master Administrator');
  const [isAdminSetupMode, setIsAdminSetupMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState<boolean>(true);
  const [appEnv, setAppEnv] = useState<'development' | 'production'>('development');

  useEffect(() => {
    if (isOpen) {
      api.getOtpConfig()
        .then(res => {
          setIsDevMode(res.isDevelopment);
          setAppEnv(res.appEnv);
        })
        .catch(() => {
          setIsDevMode(true);
        });

      api.getAdminSetupStatus()
        .then(status => {
          if (!status.isConfigured) {
            setIsAdminSetupMode(true);
            if (status.adminEmail) setAdminEmail(status.adminEmail);
          } else {
            setIsAdminSetupMode(false);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveTab(defaultRole);
    setStep('mobile');
    setError(null);
    setSuccessMsg(null);
    setOtp('');
    setDevOtp(null);
    setAdminEmail('');
    setAdminPassword('');
    setAdminConfirmPassword('');
  }, [isOpen, defaultRole]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const clean = mobile.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setError(language === 'hi' ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.sendOtp(clean, activeTab);
      setStep('otp');
      setCooldown(res.cooldownSeconds || 30);
      setSuccessMsg(
        res.isDevelopment
          ? (language === 'hi' ? `डेवलपमेंट मोड: +91 ${clean} के लिए रैंडम OTP जनरेट किया गया` : `Development Mode: Dynamic OTP generated for +91 ${clean}`)
          : (language === 'hi' ? `+91 ${clean} पर SMS भेजा गया` : `OTP sent via SMS to +91 ${clean}`)
      );
      if (res.devOtp) {
        setDevOtp(res.devOtp);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError(language === 'hi' ? 'कृपया 6 अंकों का ओटीपी दर्ज करें' : 'Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
      const res = await api.verifyOtp(cleanMobile, cleanOtp, activeTab);
      if (res.success && res.token) {
        loginSuccess(res.token, res.user, res.profile);
        setActivePortal(activeTab);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || t.auth.invalidOtp);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const email = adminEmail.trim();
    const password = adminPassword.trim();
    if (!email || !password) {
      setError(language === 'hi' ? 'कृपया एडमिन ईमेल और पासवर्ड दर्ज करें' : 'Admin email and password are required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.adminLogin({ email, password });
      if (res.success && res.token && res.user) {
        loginSuccess(res.token, res.user);
        setActivePortal('admin');
        onClose();
      } else {
        setError(language === 'hi' ? 'अमान्य एडमिन क्रेडेंशियल' : 'Invalid admin credentials.');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('not initialized')) {
        setIsAdminSetupMode(true);
        setError(err.message);
      } else {
        setError(err.message || (language === 'hi' ? 'अमान्य एडमिन क्रेडेंशियल' : 'Invalid admin credentials.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const email = adminEmail.trim();
    const password = adminPassword.trim();
    const confirm = adminConfirmPassword.trim();

    if (!email || !email.includes('@')) {
      setError(language === 'hi' ? 'कृपया वैध एडमिन ईमेल दर्ज करें' : 'Please enter a valid administrative email.');
      return;
    }
    if (password.length < 8) {
      setError(language === 'hi' ? 'पासवर्ड कम से कम 8 वर्णों का होना चाहिए' : 'Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirm) {
      setError(language === 'hi' ? 'पासवर्ड मेल नहीं खाते' : 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.adminSetup({
        email,
        password,
        fullName: adminFullName.trim() || 'Master Administrator'
      });
      if (res.success && res.token && res.user) {
        setSuccessMsg(language === 'hi' ? 'मास्टर एडमिन सेटअप पूर्ण!' : 'Master Admin setup completed successfully!');
        setTimeout(() => {
          loginSuccess(res.token, res.user);
          setActivePortal('admin');
          onClose();
        }, 800);
      } else {
        setError(res.message || 'Failed to initialize Master Admin.');
      }
    } catch (err: any) {
      setError(err.message || 'Initialization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Banner */}
        <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 p-6 text-white text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
              {activeTab === 'admin' ? (
                <Shield className="w-6 h-6 text-teal-200" />
              ) : (
                <Smartphone className="w-6 h-6 text-teal-200" />
              )}
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              {activeTab === 'admin' 
                ? t.auth.adminLoginTitle 
                : activeTab === 'employer' 
                ? (language === 'hi' ? 'नियोक्ता भर्ती लॉगिन' : 'Employer & Recruiter Access')
                : (language === 'hi' ? 'उम्मीदवार जॉब लॉगिन' : 'Candidate Job & LMS Access')}
            </h2>
            <p className="text-xs text-teal-100/90 mt-1 max-w-xs mx-auto">
              {activeTab === 'admin'
                ? 'Master control & moderation console'
                : activeTab === 'employer'
                ? t.auth.welcomeEmployer
                : t.auth.welcomeCandidate}
            </p>

            {/* Development Mode Status Badge */}
            {isDevMode && activeTab !== 'admin' && (
              <div className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[10px] font-bold uppercase tracking-wider">
                <Terminal className="w-3 h-3" />
                <span>Development Mode (Safe Sandbox)</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1">
          <button
            type="button"
            onClick={() => { setActiveTab('candidate'); setStep('mobile'); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'candidate'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'hi' ? 'उम्मीदवार (Candidate)' : 'Candidate'}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('employer'); setStep('mobile'); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'employer'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'hi' ? 'नियोक्ता (Employer)' : 'Employer'}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'admin'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Admin Email & Password Login / Setup */}
          {activeTab === 'admin' ? (
            isAdminSetupMode ? (
              <form onSubmit={handleAdminSetupSubmit} className="space-y-3.5">
                <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-start gap-2">
                  <Shield className="w-4 h-4 shrink-0 text-teal-600 mt-0.5" />
                  <div>
                    <strong className="block font-bold">
                      {language === 'hi' ? 'मास्टर एडमिन प्रारंभिक सेटअप' : 'Master Admin Initial Setup'}
                    </strong>
                    <span className="text-[11px] text-teal-700">
                      {language === 'hi'
                        ? 'अपना मास्टर एडमिन ईमेल और सुरक्षित पासवर्ड सेट करें।'
                        : 'Configure your Master Admin email & secure password.'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'hi' ? 'एडमिन ईमेल' : 'Admin Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@karmetra.in"
                      autoComplete="email"
                      required
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-800 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'hi' ? 'मास्टर पासवर्ड (न्यूनतम 8 वर्ण)' : 'Master Password (min 8 characters)'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-800 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={adminConfirmPassword}
                      onChange={(e) => setAdminConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-800 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || adminPassword.length < 8 || adminPassword !== adminConfirmPassword}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  <span>{language === 'hi' ? 'सुरक्षित सेटअप पूर्ण करें' : 'Complete Master Admin Setup'}</span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdminSetupMode(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    {language === 'hi' ? 'पहले से कॉन्फ़िगर किया गया है? लॉगिन करें' : 'Already configured? Go to Login'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'hi' ? 'एडमिन ईमेल / यूज़रनेम' : 'Admin Email / Username'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@karmetra.in"
                      autoComplete="username"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-800 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'hi' ? 'पासवर्ड' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-800 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  <span>{t.auth.adminLoginBtn}</span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdminSetupMode(true)}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
                  >
                    {language === 'hi' ? 'मास्टर एडमिन सेटअप / पासवर्ड रीसेट' : 'Master Admin Initial Setup Wizard'}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Candidate & Employer OTP Flow */
            <>
              {step === 'mobile' ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t.auth.mobileNumber}
                    </label>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3.5 py-2.5 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-700 text-sm font-bold">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        required
                        autoFocus
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-sm font-bold tracking-wide text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {isDevMode && (
                    <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>Development Sandbox Active:</strong> SMS will not be sent to your phone. A randomized secure 6-digit OTP will be generated on screen for testing.
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || mobile.length !== 10}
                    className={`w-full py-3 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                      mobile.length === 10 && !isLoading
                        ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20 hover:scale-[1.01]'
                        : 'bg-slate-300 cursor-not-allowed text-slate-500'
                    }`}
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    <span>{t.auth.sendOtp}</span>
                  </button>

                  <p className="text-[11px] text-center text-slate-400 mt-3">
                    {t.auth.termsConsent}
                  </p>
                </form>
              ) : (
                /* Step 2: Enter OTP */
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      {t.auth.enterOtp}
                    </label>
                    <button
                      type="button"
                      onClick={() => setStep('mobile')}
                      className="text-[11px] font-semibold text-teal-700 hover:underline"
                    >
                      {language === 'hi' ? 'नंबर बदलें' : 'Change Number'}
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      required
                      autoFocus
                      className="w-full text-center tracking-[0.6em] text-2xl font-black py-3 bg-slate-50 border-2 border-slate-200 focus:border-teal-600 rounded-xl focus:bg-white focus:outline-hidden transition-all text-slate-900"
                    />
                  </div>

                  {/* Explicit Development Mode Box (Requirement 2 & 10) */}
                  {isDevMode && devOtp && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs shadow-xs animate-in fade-in">
                      <div className="flex items-center justify-between font-bold text-[11px] uppercase tracking-wider text-amber-800 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" />
                          DEVELOPMENT MODE
                        </span>
                        <span className="text-[10px] text-amber-700 font-normal">SMS Not Sent</span>
                      </div>
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-amber-200">
                        <span className="text-slate-600 font-medium">Random OTP: <strong className="font-mono text-base text-slate-900 ml-1">{devOtp}</strong></span>
                        <button
                          type="button"
                          onClick={() => setOtp(devOtp)}
                          className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-md transition-colors"
                        >
                          Auto-Fill
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className={`w-full py-3 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                      otp.length === 6 && !isLoading
                        ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20 hover:scale-[1.01]'
                        : 'bg-slate-300 cursor-not-allowed text-slate-500'
                    }`}
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{t.auth.verifyOtp}</span>
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    {cooldown > 0 ? (
                      <span className="text-slate-400 text-[11px]">
                        {t.auth.resendIn} <strong className="text-slate-700">{cooldown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={isLoading}
                        className="text-teal-700 font-bold hover:underline"
                      >
                        {t.auth.resendOtp}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

