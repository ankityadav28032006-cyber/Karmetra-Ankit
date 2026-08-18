import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Building2, 
  Briefcase, 
  GraduationCap, 
  Award, 
  HelpCircle, 
  Bell, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  FileText
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { AdminTab } from './AdminNavigation';

interface AdminDashboardProps {
  onNavigate: (tab: AdminTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const [stats, setStats] = useState<any>({
    totalCandidates: 0,
    totalEmployers: 0,
    activeJobs: 0,
    totalCourses: 0,
    verifiedCertificates: 0,
    pendingEmployers: 0,
    pendingJobs: 0,
    openTickets: 0,
    recentAudits: []
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.getAdminStats();
      if (res) {
        setStats(res);
      }
    } catch (err: any) {
      console.error('Failed to load admin stats', err);
      setErrorMessage(err.message || 'Failed to load admin statistics. Please check your admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {errorMessage && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-amber-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={fetchStats}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KarMetra Trust, Quality & Platform Control</span>
          </div>

          <h1 className="text-xl sm:text-3xl font-black tracking-tight">
            Master Administration & Moderation Console
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Maintain high employer credibility through GSTIN/PAN verification, moderate job listings, manage LMS courses, monitor certificate issuances, and resolve support grievances.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              onClick={() => onNavigate('employers')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Building2 className="w-4 h-4" />
              <span>Verify Employers ({stats.pendingEmployers || 0} Pending)</span>
            </button>

            <button
              onClick={() => onNavigate('courses')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <GraduationCap className="w-4 h-4 text-teal-400" />
              <span>LMS Course Studio</span>
            </button>

            <button
              onClick={() => onNavigate('broadcast')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Send Broadcast Alert</span>
            </button>

            <button
              onClick={() => onNavigate('settings')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>OTP & Auth Subsystem</span>
            </button>
          </div>
        </div>
      </div>

      {/* Actionable Alerts / Pending Attention Bar */}
      {(stats.pendingEmployers > 0 || stats.openTickets > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.pendingEmployers > 0 && (
            <div 
              onClick={() => onNavigate('employers')}
              className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition-all text-xs"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-300">{stats.pendingEmployers} Company Verifications Pending</h4>
                  <p className="text-[11px] text-amber-200/80">Review GST / PAN documents to prevent fraud</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </div>
          )}

          {stats.openTickets > 0 && (
            <div 
              onClick={() => onNavigate('support')}
              className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-red-500/20 transition-all text-xs"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-red-300">{stats.openTickets} User Grievances / Support Inquiries</h4>
                  <p className="text-[11px] text-red-200/80">Candidates & recruiters requiring prompt resolution</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-red-400" />
            </div>
          )}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div 
          onClick={() => onNavigate('employers')}
          className="p-5 bg-slate-900 border border-slate-800 hover:border-teal-500 rounded-2xl shadow-xs transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Registered Employers</span>
            <Building2 className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-white">{stats.totalEmployers || 0}</p>
          <span className="text-[10px] text-teal-400 font-semibold block">
            {stats.pendingEmployers || 0} Pending Verification →
          </span>
        </div>

        <div 
          onClick={() => onNavigate('jobs')}
          className="p-5 bg-slate-900 border border-slate-800 hover:border-teal-500 rounded-2xl shadow-xs transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Active Job Posts</span>
            <Briefcase className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-white">{stats.activeJobs || 0}</p>
          <span className="text-[10px] text-teal-400 font-semibold block">Moderate Openings →</span>
        </div>

        <div 
          onClick={() => onNavigate('courses')}
          className="p-5 bg-slate-900 border border-slate-800 hover:border-teal-500 rounded-2xl shadow-xs transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">LMS Skill Modules</span>
            <GraduationCap className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-white">{stats.totalCourses || 0}</p>
          <span className="text-[10px] text-teal-400 font-semibold block">Course Studio →</span>
        </div>

        <div 
          onClick={() => onNavigate('certificates')}
          className="p-5 bg-slate-900 border border-slate-800 hover:border-teal-500 rounded-2xl shadow-xs transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Verified Certificates</span>
            <Award className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{stats.verifiedCertificates || 0}</p>
          <span className="text-[10px] text-emerald-400 font-semibold block">Certificate Registry →</span>
        </div>
      </div>

      {/* Quick Navigation Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        
        <div 
          onClick={() => onNavigate('employers')}
          className="p-5 bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl space-y-2 cursor-pointer transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-sm">Employer KYC Verification</h3>
          <p className="text-slate-400 text-xs">
            Review GSTIN certificates, PAN cards, and business incorporation documents to approve legitimate recruiters.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('courses')}
          className="p-5 bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl space-y-2 cursor-pointer transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
            <GraduationCap className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-sm">Skill Curriculum & Quizzes</h3>
          <p className="text-slate-400 text-xs">
            Publish courses with bilingual video lessons and configure pass marks for auto-generating verifiable certificates.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('broadcast')}
          className="p-5 bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl space-y-2 cursor-pointer transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
            <Bell className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-sm">Targeted System Broadcasts</h3>
          <p className="text-slate-400 text-xs">
            Send immediate announcements, hiring drive alerts, or policy updates directly to in-app notification centers.
          </p>
        </div>
      </div>

      {/* Recent Admin Audit Logs Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-sm">Recent Moderation & System Activity</h3>
            <p className="text-xs text-slate-400">Chronological ledger of admin interventions</p>
          </div>
          <button
            onClick={() => onNavigate('audit')}
            className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
          >
            <span>View Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.recentAudits && stats.recentAudits.length > 0 ? (
          <div className="space-y-2">
            {stats.recentAudits.slice(0, 5).map((log: any) => (
              <div
                key={log.id}
                className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{log.action}</span>
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                      {log.targetType}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{log.details}</p>
                </div>

                <div className="text-right text-[11px] text-slate-400">
                  <p>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-slate-400 font-medium">{new Date(log.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            <FileText className="w-8 h-8 mx-auto text-slate-600 mb-1" />
            <p>No audit events recorded yet today.</p>
          </div>
        )}
      </div>
    </div>
  );
};
