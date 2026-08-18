import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Video, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  PlusCircle, 
  Search, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { EmployerTab } from './EmployerNavigation';

interface EmployerDashboardProps {
  onNavigate: (tab: EmployerTab) => void;
  onOpenLogin: () => void;
}

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({ onNavigate, onOpenLogin }) => {
  const { user, employerProfile, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();

  const [stats, setStats] = useState<any>({
    activeJobs: 0,
    totalApplicants: 0,
    shortlisted: 0,
    interviewsScheduled: 0,
    recentApplicants: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'employer') {
      setLoading(false);
      return;
    }

    api.getEmployerStats()
      .then(res => setStats(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user]);

  if (!isAuthenticated || user?.role !== 'employer') {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto shadow-xs">
        <Briefcase className="w-12 h-12 text-teal-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">
          {language === 'hi' ? 'नियोक्ता पोर्टल लॉगिन' : 'Employer & Recruiter Portal'}
        </h3>
        <p className="text-xs text-slate-500">
          {language === 'hi'
            ? 'अपनी कंपनी की रिक्तियां पोस्ट करें और सत्यापित कौशल वाले उम्मीदवारों को हायर करें।'
            : 'Post jobs across pan-India, search verified candidates with skill certificates, and schedule video interviews.'}
        </p>
        <button
          onClick={onOpenLogin}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md"
        >
          {language === 'hi' ? 'नियोक्ता लॉगिन / साइन-अप' : 'Employer Login / Sign Up'}
        </button>
      </div>
    );
  }

  const isVerified = employerProfile?.verificationStatus === 'verified';

  return (
    <div className="space-y-6 pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>KarMetra Verified Recruiter Console</span>
          </div>

          <h1 className="text-xl sm:text-3xl font-black">
            {employerProfile?.companyName || 'Your Company'}
          </h1>
          <p className="text-teal-100/80 text-xs sm:text-sm">
            {language === 'hi'
              ? 'अखिल भारतीय स्तर पर प्रमाणित आईटी, गैर-आईटी, व्यावसायिक एवं ट्रेड उम्मीदवारों को तेजी से नियुक्त करें।'
              : 'Directly hire pre-assessed candidates holding verified skill credentials. Boost interview-to-offer ratio by 4x.'}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onNavigate('post-job')}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-2 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'hi' ? 'नई नौकरी पोस्ट करें' : 'Post a New Vacancy'}</span>
            </button>

            <button
              onClick={() => onNavigate('talent-search')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm rounded-xl backdrop-blur flex items-center gap-2 transition-all"
            >
              <Search className="w-4 h-4 text-teal-300" />
              <span>{language === 'hi' ? 'सत्यापित टैलेंट खोजें' : 'Search Talent Pool'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verification Notice if not verified */}
      {!isVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-amber-900">
                {employerProfile?.verificationStatus === 'pending'
                  ? 'Verification Documents Submitted (Under Review by Trust Desk)'
                  : 'Company Verification Required for Priority Candidate Matching'}
              </h4>
              <p className="text-[11px] text-amber-700">
                Submit your GSTIN / PAN / Incorporation certificate to earn the KarMetra Verified Employer badge.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('profile')}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl shrink-0 transition-colors shadow-xs"
          >
            Submit Documents
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('jobs')}
          className="p-5 bg-white border border-slate-200 hover:border-teal-400 rounded-2xl shadow-xs transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">{language === 'hi' ? 'सक्रिय रिक्तियां' : 'Active Vacancies'}</span>
            <Briefcase className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.activeJobs || 0}</p>
          <span className="text-[10px] text-teal-700 font-semibold block">Manage Job Posts →</span>
        </div>

        <div 
          onClick={() => onNavigate('applicants')}
          className="p-5 bg-white border border-slate-200 hover:border-teal-400 rounded-2xl shadow-xs transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">{language === 'hi' ? 'कुल आवेदन' : 'Total Applicants'}</span>
            <Users className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.totalApplicants || 0}</p>
          <span className="text-[10px] text-teal-700 font-semibold block">Open Pipeline →</span>
        </div>

        <div 
          onClick={() => onNavigate('applicants')}
          className="p-5 bg-white border border-slate-200 hover:border-teal-400 rounded-2xl shadow-xs transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">{language === 'hi' ? 'शॉर्टलिस्टेड' : 'Shortlisted Candidates'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{stats.shortlisted || 0}</p>
          <span className="text-[10px] text-emerald-700 font-semibold block">Review Shortlist →</span>
        </div>

        <div 
          onClick={() => onNavigate('applicants')}
          className="p-5 bg-white border border-slate-200 hover:border-teal-400 rounded-2xl shadow-xs transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">{language === 'hi' ? 'इंटरव्यू निर्धारित' : 'Interviews Scheduled'}</span>
            <Video className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-teal-700">{stats.interviewsScheduled || 0}</p>
          <span className="text-[10px] text-teal-700 font-semibold block">Google Meet Schedule →</span>
        </div>
      </div>

      {/* Recent Candidate Applications Preview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {language === 'hi' ? 'हाल ही में आए आवेदन' : 'Recent Candidate Applications'}
            </h3>
            <p className="text-xs text-slate-500">Real-time candidate submissions with verified credentials</p>
          </div>
          <button
            onClick={() => onNavigate('applicants')}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <span>View all applicants</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.recentApplicants && stats.recentApplicants.length > 0 ? (
          <div className="space-y-2.5">
            {stats.recentApplicants.slice(0, 4).map((app: any) => (
              <div
                key={app.id}
                onClick={() => onNavigate('applicants')}
                className="p-3.5 bg-slate-50 hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{app.candidateName}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{app.jobTitle} • Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {app.status}
                  </span>
                  <span className="text-teal-700 font-bold text-xs">Review →</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs space-y-1">
            <Users className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-medium">No applications received yet.</p>
            <p className="text-[11px]">Post your first job vacancy to start receiving qualified candidate resumes.</p>
          </div>
        )}
      </div>
    </div>
  );
};
