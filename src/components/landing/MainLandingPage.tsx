import React, { useState } from 'react';
import { 
  Briefcase, 
  Building2, 
  GraduationCap, 
  ShieldCheck, 
  Search, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  PhoneCall, 
  CheckCircle2, 
  Users, 
  QrCode, 
  FileText, 
  Award, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Landmark,
  Shield,
  Zap
} from 'lucide-react';
import { DOMAIN_CONFIG, navigateToPortal } from '../../utils/domainConfig';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';

interface MainLandingPageProps {
  onOpenQRVerify: (code?: string) => void;
  onOpenSupport: () => void;
  onSelectCandidateApp: () => void;
  onSelectRecruiterApp: () => void;
}

export const MainLandingPage: React.FC<MainLandingPageProps> = ({
  onOpenQRVerify,
  onOpenSupport,
  onSelectCandidateApp,
  onSelectRecruiterApp
}) => {
  const { setActivePortal } = useAuth();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [verifyCodeInput, setVerifyCodeInput] = useState('');

  const stats = [
    { label: 'Active Job Openings', value: '18,500+', icon: Briefcase, color: 'text-teal-400' },
    { label: 'Verified Corporate Employers', value: '2,900+', icon: Building2, color: 'text-blue-400' },
    { label: 'LMS Skill Certifications', value: '45,000+', icon: GraduationCap, color: 'text-purple-400' },
    { label: 'Direct Placement Rate', value: '98.4%', icon: TrendingUp, color: 'text-emerald-400' }
  ];

  const sectors = [
    { name: 'IT & Software Development', count: '4,210 jobs', icon: Zap },
    { name: 'BFSI & Private Banking', count: '3,150 jobs', icon: Landmark },
    { name: 'Corporate Sales & Marketing', count: '2,890 jobs', icon: TrendingUp },
    { name: 'Govt & Public Sector Alerts', count: '1,420 notifications', icon: Award },
    { name: 'Logistics, Supply & Operations', count: '3,800 jobs', icon: Briefcase },
    { name: 'Healthcare & Pharma', count: '1,120 jobs', icon: ShieldCheck }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSelectCandidateApp();
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCodeInput.trim()) {
      onOpenQRVerify(verifyCodeInput.trim());
    }
  };

  return (
    <div className="space-y-16 pb-12">
      
      {/* Subdomain Notice / Production Banner */}
      <div className="bg-gradient-to-r from-teal-950/80 via-slate-900 to-blue-950/80 border border-teal-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
          </span>
          <span>
            <strong>KarMetra Enterprise Hub:</strong> Running across 4 dedicated high-speed subdomains on <code className="text-teal-300 font-mono">karmetra.in</code>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`tel:${DOMAIN_CONFIG.helplinePhone}`}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 rounded-lg font-bold transition-colors font-mono"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{DOMAIN_CONFIG.helplinePhoneDisplay}</span>
          </a>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative text-center max-w-4xl mx-auto space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>National Employment &amp; Skill Development Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
          Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-200 to-blue-400">Verified Skills</span> Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-300">Direct Careers</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The unified digital employment ecosystem connecting job seekers, certified skill academies, and verified corporate recruiters across India.
        </p>

        {/* Universal Search Bar */}
        <form 
          onSubmit={handleSearchSubmit}
          className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-2xl border border-teal-100 flex flex-col md:flex-row gap-2 max-w-3xl mx-auto text-slate-900"
        >
          <div className="flex-1 flex items-center gap-2 px-3 py-2 border-b md:border-b-0 md:border-r border-slate-200">
            <Search className="w-4 h-4 text-teal-600 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, skill, or department..."
              className="w-full text-xs font-medium focus:outline-none bg-transparent"
            />
          </div>

          <div className="flex-1 flex items-center gap-2 px-3 py-2 border-b md:border-b-0 border-slate-200">
            <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Location: Mumbai, Delhi, Bengaluru, Remote..."
              className="w-full text-xs font-medium focus:outline-none bg-transparent"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
          >
            <span>Search 18,500+ Jobs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Dual Portal Gateway Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        
        {/* Gateway 1: Candidate App (job.karmetra.in) */}
        <div className="group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-teal-500/30 hover:border-teal-400/60 rounded-3xl p-6 sm:p-8 space-y-6 transition-all shadow-xl hover:shadow-teal-900/20">
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <span className="px-3 py-1 bg-teal-500/10 text-teal-300 text-[11px] font-mono font-bold rounded-full border border-teal-500/30">
              job.karmetra.in
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">For Job Seekers &amp; Students</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Build your ATS-friendly resume, learn in-demand industry skills, take verified tests, and receive real-time alerts for private &amp; government vacancies.
            </p>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>1-Click Apply to verified IT, Non-IT &amp; Blue-collar jobs</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>AI Resume Builder with auto-generated PDF download</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Instant WhatsApp &amp; SMS Government Job notifications</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>QR-Verifiable Skill Certificates &amp; LMS Course Badges</span>
            </li>
          </ul>

          <button
            onClick={onSelectCandidateApp}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all group-hover:scale-[1.01]"
          >
            <span>Launch Candidate App (job.karmetra.in)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Gateway 2: Employer App (recruiter.karmetra.in) */}
        <div className="group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-blue-500/30 hover:border-blue-400/60 rounded-3xl p-6 sm:p-8 space-y-6 transition-all shadow-xl hover:shadow-blue-900/20">
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center">
              <Building2 className="w-7 h-7" />
            </div>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-300 text-[11px] font-mono font-bold rounded-full border border-blue-500/30">
              recruiter.karmetra.in
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">For Employers &amp; Recruiters</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Hire pre-assessed, verified candidates across India. Post unlimited job requirements, manage applicant pipelines, and schedule interviews effortlessly.
            </p>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Post job openings with salary ranges &amp; skill requirements</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Filter applicants by verified test scores &amp; education</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Integrated video interview scheduling &amp; candidate messaging</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Verified corporate badge &amp; GSTIN trust authentication</span>
            </li>
          </ul>

          <button
            onClick={onSelectRecruiterApp}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all group-hover:scale-[1.01]"
          >
            <span>Launch Recruiter Suite (recruiter.karmetra.in)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center space-y-1.5">
              <Icon className={`w-6 h-6 mx-auto ${stat.color}`} />
              <p className="text-2xl sm:text-3xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Key Hiring Sectors */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Explore Careers by Industry</h3>
          <button 
            onClick={onSelectCandidateApp}
            className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Browse All Categories</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectors.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <div 
                key={idx}
                onClick={onSelectCandidateApp}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/40 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-teal-500/20 text-slate-300 group-hover:text-teal-400 flex items-center justify-center transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">{sec.name}</h4>
                    <p className="text-[11px] text-slate-400">{sec.count}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick QR Certificate Verification Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-teal-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-lg">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400">
            <QrCode className="w-4 h-4" />
            <span>Instant LMS Certificate Verification</span>
          </div>
          <h3 className="text-xl font-bold text-white">Verify Candidate Credential Authenticity</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Employers and academic institutions can verify any KarMetra certified certificate in real time using the 8-digit verification code or QR scanner.
          </p>
        </div>

        <form onSubmit={handleVerifySubmit} className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={verifyCodeInput}
            onChange={(e) => setVerifyCodeInput(e.target.value.toUpperCase())}
            placeholder="Enter Code (e.g. KM-8F29A)"
            className="px-4 py-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-mono tracking-wider focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Certificate</span>
          </button>
        </form>
      </div>

      {/* Corporate Helpline & Mumbai Head Office Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider block">
            National Enterprise Support
          </span>
          <h3 className="text-xl font-bold text-white">Need Assistance with Candidate or Recruiter Onboarding?</h3>
          <p className="text-xs text-slate-300">
            Our enterprise grievance officers and employment counselors are available across all Indian business hours.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a
            href={`tel:${DOMAIN_CONFIG.helplinePhone}`}
            className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call Helpline: {DOMAIN_CONFIG.helplinePhoneDisplay}</span>
          </a>

          <button
            onClick={onOpenSupport}
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700"
          >
            Open Helpdesk Ticket
          </button>
        </div>
      </div>

    </div>
  );
};
