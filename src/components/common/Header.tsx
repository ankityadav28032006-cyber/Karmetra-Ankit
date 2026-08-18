import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  Globe, 
  Bell, 
  LogOut, 
  User, 
  Menu, 
  X,
  QrCode,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useAuth, PortalType } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { KarMetraLogo } from './KarMetraLogo';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenQRVerify: () => void;
  onOpenLogin: () => void;
  onOpenSupport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenQRVerify,
  onOpenLogin,
  onOpenSupport
}) => {
  const { user, candidateProfile, employerProfile, activePortal, setActivePortal, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      api.getNotifications()
        .then(res => {
          const unread = (res.notifications || []).filter(n => !n.isRead).length;
          setUnreadCount(unread);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const handlePortalSwitch = (portal: PortalType) => {
    setActivePortal(portal);
    setMobileMenuOpen(false);
  };

  const getUserDisplayName = () => {
    if (user?.role === 'candidate') return candidateProfile?.fullName || 'Candidate';
    if (user?.role === 'employer') return employerProfile?.companyName || 'Recruiter';
    if (user?.role === 'admin') return 'Super Admin';
    return 'User';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-teal-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => handlePortalSwitch(activePortal)} 
              className="flex items-center cursor-pointer group"
            >
              <KarMetraLogo size="md" />
            </div>

            {/* Portal Badges / Switchers */}
            <div className="hidden lg:flex items-center ml-4 pl-4 border-l border-slate-200 gap-1 bg-slate-100/80 p-1 rounded-xl">
              <button
                id="portal-switch-main"
                onClick={() => handlePortalSwitch('main')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePortal === 'main'
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="karmetra.in Main Portal"
              >
                <Globe className="w-3.5 h-3.5 text-teal-600" />
                <span>{language === 'hi' ? 'मुख्य वेबसाइट' : 'Main Portal'}</span>
              </button>

              <button
                id="portal-switch-candidate"
                onClick={() => handlePortalSwitch('candidate')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePortal === 'candidate'
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="job.karmetra.in"
              >
                <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                <span>{language === 'hi' ? 'उम्मीदवार' : 'Candidate'}</span>
              </button>

              <button
                id="portal-switch-employer"
                onClick={() => handlePortalSwitch('employer')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePortal === 'employer'
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="recruiter.karmetra.in"
              >
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>{language === 'hi' ? 'नियोक्ता' : 'Recruiter'}</span>
              </button>

              <button
                id="portal-switch-admin"
                onClick={() => handlePortalSwitch('admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePortal === 'admin'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="admin.karmetra.in"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Helpline Fast-Dial */}
            <a
              href="tel:9049217304"
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded-lg transition-colors"
              title="Official KarMetra Helpline"
            >
              <span className="text-[10px] text-teal-600 font-normal">Helpline:</span>
              <span className="font-mono">9049217304</span>
            </a>
            
            {/* Certificate QR Lookup Button */}
            <button
              id="header-btn-verify-cert"
              onClick={onOpenQRVerify}
              title={language === 'hi' ? 'प्रमाणपत्र सत्यापित करें' : 'Verify Certificate'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-teal-700 bg-slate-100/70 hover:bg-teal-50 border border-slate-200/80 rounded-lg transition-colors"
            >
              <QrCode className="w-4 h-4 text-teal-600" />
              <span className="hidden md:inline">{language === 'hi' ? 'सत्यापन' : 'Verify QR'}</span>
            </button>

            {/* Language Toggle (Hindi / English) */}
            <button
              id="header-btn-lang-toggle"
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50/80 border border-teal-200/80 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-teal-600" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Notification Bell */}
            {isAuthenticated && (
              <button
                id="header-btn-notifications"
                onClick={onOpenNotifications}
                className="relative p-2 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                title={language === 'hi' ? 'सूचनाएं' : 'Notifications'}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth / Profile Area */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-300 text-teal-800 font-bold flex items-center justify-center text-xs uppercase">
                    {getUserDisplayName().charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-[10px] text-teal-600 font-medium capitalize">
                      {user?.role}
                    </p>
                  </div>
                </div>

                <button
                  id="header-btn-logout"
                  onClick={logout}
                  title={t.common.logout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="header-btn-login"
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm shadow-teal-600/20 transition-all hover:scale-[1.02]"
              >
                <User className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'लॉगिन / साइन-अप' : 'Login / Sign Up'}</span>
              </button>
            )}

            {/* Mobile Menu Trigger */}
            <button
              id="header-btn-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2 animate-in slide-in-from-top-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">
            {language === 'hi' ? 'एप्लिकेशन स्विच करें' : 'Switch Application'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              id="mobile-portal-main"
              onClick={() => handlePortalSwitch('main')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold gap-1 ${
                activePortal === 'main'
                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                  : 'border-slate-200 text-slate-700'
              }`}
            >
              <Globe className="w-4 h-4 text-teal-600" />
              <span>Main Portal</span>
            </button>

            <button
              id="mobile-portal-candidate"
              onClick={() => handlePortalSwitch('candidate')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold gap-1 ${
                activePortal === 'candidate'
                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                  : 'border-slate-200 text-slate-700'
              }`}
            >
              <Smartphone className="w-4 h-4 text-teal-600" />
              <span>Candidate</span>
            </button>

            <button
              id="mobile-portal-employer"
              onClick={() => handlePortalSwitch('employer')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold gap-1 ${
                activePortal === 'employer'
                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                  : 'border-slate-200 text-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Recruiter</span>
            </button>

            <button
              id="mobile-portal-admin"
              onClick={() => handlePortalSwitch('admin')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold gap-1 ${
                activePortal === 'admin'
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'border-slate-200 text-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 text-xs text-slate-600 px-2">
            <a
              href="tel:9049217304"
              className="flex items-center justify-between p-2 bg-teal-50 text-teal-800 font-bold rounded-xl border border-teal-200"
            >
              <span>Helpline: 9049217304</span>
              <span className="text-[10px] text-teal-600 font-normal">Mumbai Office</span>
            </a>
            <div className="flex items-center justify-between">
              <button onClick={onOpenSupport} className="text-teal-700 font-semibold hover:underline">
                {language === 'hi' ? 'सहायता एवं संपर्क' : 'Help & Support Desk'}
              </button>
              <span className="text-[11px] text-slate-400 font-mono">karmetra.in</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
