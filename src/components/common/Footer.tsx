import React from 'react';
import { 
  PhoneCall, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Lock, 
  ExternalLink, 
  Sparkles,
  Globe,
  Award,
  CheckCircle2
} from 'lucide-react';
import { DOMAIN_CONFIG } from '../../utils/domainConfig';
import { KarMetraLogo } from './KarMetraLogo';
import { useLanguage } from '../../locales/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface FooterProps {
  onOpenSupport?: () => void;
  onOpenQRVerify?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSupport, onOpenQRVerify }) => {
  const { language } = useLanguage();
  const { setActivePortal } = useAuth();

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-300 pt-12 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800/80">
          
          {/* Brand & Corporate Overview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <KarMetraLogo size="md" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              India's premier employment and skill development ecosystem. Empowering candidates with verified assessments and enabling direct recruitment for enterprise and MSME employers.
            </p>

            {/* Helpline and Mumbai Office Contact Card */}
            <div className="bg-slate-900/90 border border-teal-500/20 rounded-2xl p-4 space-y-2.5 max-w-sm shadow-inner">
              <div className="flex items-start gap-2.5 text-xs text-slate-200">
                <PhoneCall className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-400 block tracking-wider">
                    {language === 'hi' ? 'करमेत्रा राष्ट्रीय हेल्पलाइन' : 'Official KarMetra Helpline'}
                  </span>
                  <a 
                    href={`tel:${DOMAIN_CONFIG.helplinePhone}`}
                    className="text-sm font-black text-white hover:text-teal-300 font-mono transition-colors"
                  >
                    {DOMAIN_CONFIG.helplinePhoneDisplay} ({DOMAIN_CONFIG.helplinePhone})
                  </a>
                  <p className="text-[10px] text-slate-400">Mon - Sat: 9:00 AM – 7:00 PM IST</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-200 pt-1 border-t border-slate-800">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-400 block tracking-wider">
                    {language === 'hi' ? 'मुंबई मुख्यालय (Head Office)' : 'Mumbai Head Office'}
                  </span>
                  <p className="text-[11px] text-slate-300 font-medium leading-snug">
                    {DOMAIN_CONFIG.headOfficeAddress}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {DOMAIN_CONFIG.headOfficeCity}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subdomain Ecosystem Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span>Production Subdomains</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href={DOMAIN_CONFIG.publicAppUrl}
                  onClick={(e) => {
                    if (window.location.hostname.includes('run.app') || window.location.hostname.includes('localhost')) {
                      e.preventDefault();
                      setActivePortal('candidate');
                    }
                  }}
                  className="hover:text-teal-300 flex items-center justify-between group text-slate-300 transition-colors"
                >
                  <span>Main Portal</span>
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-teal-400">karmetra.in</span>
                </a>
              </li>
              <li>
                <a 
                  href={DOMAIN_CONFIG.candidateAppUrl}
                  onClick={(e) => {
                    if (window.location.hostname.includes('run.app') || window.location.hostname.includes('localhost')) {
                      e.preventDefault();
                      setActivePortal('candidate');
                    }
                  }}
                  className="hover:text-teal-300 flex items-center justify-between group text-slate-300 transition-colors"
                >
                  <span>Job Seeker App</span>
                  <span className="text-[10px] font-mono text-teal-400">job.karmetra.in</span>
                </a>
              </li>
              <li>
                <a 
                  href={DOMAIN_CONFIG.recruiterAppUrl}
                  onClick={(e) => {
                    if (window.location.hostname.includes('run.app') || window.location.hostname.includes('localhost')) {
                      e.preventDefault();
                      setActivePortal('employer');
                    }
                  }}
                  className="hover:text-teal-300 flex items-center justify-between group text-slate-300 transition-colors"
                >
                  <span>Employer Portal</span>
                  <span className="text-[10px] font-mono text-blue-400">recruiter.karmetra.in</span>
                </a>
              </li>
              <li>
                <a 
                  href={DOMAIN_CONFIG.adminAppUrl}
                  onClick={(e) => {
                    if (window.location.hostname.includes('run.app') || window.location.hostname.includes('localhost')) {
                      e.preventDefault();
                      setActivePortal('admin');
                    }
                  }}
                  className="hover:text-teal-300 flex items-center justify-between group text-slate-300 transition-colors"
                >
                  <span>Admin Security Panel</span>
                  <span className="text-[10px] font-mono text-red-400">admin.karmetra.in</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Candidate & Employer Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-teal-400" />
              <span>Key Features</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="hover:text-white transition-colors cursor-pointer" onClick={() => setActivePortal('candidate')}>
                AI Resume Builder
              </li>
              <li className="hover:text-white transition-colors cursor-pointer" onClick={() => setActivePortal('candidate')}>
                Government Job Alerts & Notifications
              </li>
              <li className="hover:text-white transition-colors cursor-pointer" onClick={() => setActivePortal('candidate')}>
                LMS Certified Skill Courses
              </li>
              <li className="hover:text-white transition-colors cursor-pointer" onClick={onOpenQRVerify}>
                QR Certificate Verification
              </li>
              <li className="hover:text-white transition-colors cursor-pointer" onClick={() => setActivePortal('employer')}>
                Post Verified Jobs & Candidate Pipeline
              </li>
            </ul>
          </div>

          {/* Trust & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Trust & Support</span>
            </h4>
            <div className="space-y-2 text-xs">
              <button
                onClick={onOpenSupport}
                className="w-full text-left text-slate-300 hover:text-teal-300 transition-colors"
              >
                Help Desk & Report Fraud
              </button>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <a href={`mailto:${DOMAIN_CONFIG.supportEmail}`} className="hover:text-white">
                  {DOMAIN_CONFIG.supportEmail}
                </a>
              </div>
              <div className="pt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>256-Bit SSL Encrypted HTTPS</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-teal-400">
                  <Lock className="w-3 h-3" />
                  <span>Subdomain Role Partitioning</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright & certifications */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            &copy; {new Date().getFullYear()} KarMetra Technologies Private Limited. All rights reserved. Registered under MCA &amp; MSME India.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Helpline: <strong className="text-slate-300 font-mono">9049217304</strong></span>
            <span>&bull;</span>
            <span>Mumbai Head Office</span>
            <span>&bull;</span>
            <span className="text-teal-400 font-mono">karmetra.in</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
