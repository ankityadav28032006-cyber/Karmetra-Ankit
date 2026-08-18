import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Clock, 
  Calendar, 
  Video, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { JobApplication, Interview } from '../../types';

interface CandidateApplicationsProps {
  onOpenLogin: () => void;
  onJoinInterview: (interview: Interview) => void;
  onNavigateJobs: () => void;
}

const STAGES = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Contacted',
  'Interview Scheduled',
  'Interview Completed',
  'Selected',
  'Joined'
];

export const CandidateApplications: React.FC<CandidateApplicationsProps> = ({
  onOpenLogin,
  onJoinInterview,
  onNavigateJobs
}) => {
  const { user, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'candidate') {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [appsRes, intsRes] = await Promise.all([
          api.getCandidateApplications().catch(() => ({ applications: [] })),
          api.getCandidateInterviews().catch(() => ({ interviews: [] }))
        ]);
        setApplications(appsRes.applications || []);
        setInterviews(intsRes.interviews || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  if (!isAuthenticated || user?.role !== 'candidate') {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto shadow-xs">
        <FileCheck className="w-12 h-12 text-teal-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">
          {language === 'hi' ? 'आवेदन स्थिति देखने के लिए उम्मीदवार लॉगिन करें' : 'Candidate Login Required'}
        </h3>
        <p className="text-xs text-slate-500">
          {language === 'hi'
            ? 'अपनी नौकरियों के लाइव स्टेटस और गूगल मीट इंटरव्यू की जानकारी प्राप्त करें।'
            : 'Sign in with your Candidate account to track real-time hiring progress and scheduled interviews.'}
        </p>
        <button
          onClick={onOpenLogin}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
        >
          {language === 'hi' ? 'लॉगिन / साइन-अप' : 'Candidate Login / Register'}
        </button>
      </div>
    );
  }

  const getStageIndex = (status: string) => {
    const idx = STAGES.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900">
            {language === 'hi' ? 'आपके नौकरी आवेदन एवं इंटरव्यू' : 'Your Job Applications & Scheduled Interviews'}
          </h2>
          <p className="text-xs text-slate-500">
            {applications.length} active applications • {interviews.length} upcoming interviews
          </p>
        </div>

        <button
          onClick={onNavigateJobs}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs"
        >
          {language === 'hi' ? 'और नौकरियां देखें' : 'Browse More Jobs'}
        </button>
      </div>

      {/* Scheduled Video Interviews Section */}
      {interviews.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <Video className="w-5 h-5 text-emerald-600" />
            <h3>{language === 'hi' ? 'आगामी गूगल मीट वीडियो इंटरव्यू' : 'Upcoming Google Meet Video Interviews'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviews.map(interview => (
              <div key={interview.id} className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-3 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{interview.jobTitle}</h4>
                    <p className="text-xs text-slate-600 font-semibold flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{interview.companyName}</span>
                    </p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {interview.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <strong>{new Date(interview.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Interviewer: {interview.interviewerName}</span>
                  </div>
                </div>

                <button
                  onClick={() => onJoinInterview(interview)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Video className="w-4 h-4" />
                  <span>{language === 'hi' ? 'गूगल मीट में प्रवेश करें' : 'Join Google Meet Call'}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Loading your applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-2">
            <FileCheck className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
            <p className="text-xs font-bold text-slate-700">
              {language === 'hi' ? 'आपने अभी तक किसी नौकरी के लिए आवेदन नहीं किया है' : 'You have not applied to any jobs yet'}
            </p>
            <button
              onClick={onNavigateJobs}
              className="mt-2 text-xs font-bold text-teal-700 hover:underline"
            >
              Explore Job Openings →
            </button>
          </div>
        ) : (
          applications.map(app => {
            const currentIdx = getStageIndex(app.status);
            const isRejected = app.status === 'Rejected';

            return (
              <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      Application ID: #{app.id.slice(-6)}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 mt-1">{app.jobTitle}</h3>
                    <p className="text-xs text-slate-600 font-semibold flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{app.companyName}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isRejected 
                        ? 'bg-red-100 text-red-800'
                        : app.status === 'Selected' || app.status === 'Joined'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-teal-100 text-teal-800'
                    }`}>
                      {app.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* 8-Stage Progress Tracker Visual */}
                {!isRejected && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Hiring Pipeline Progress:
                    </span>
                    
                    {/* Visual Progress Bar */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-center">
                      {STAGES.map((stg, sIdx) => {
                        const isPast = sIdx < currentIdx;
                        const isCurrent = sIdx === currentIdx;
                        return (
                          <div key={stg} className="space-y-1">
                            <div className={`h-2 rounded-full transition-all ${
                              isPast
                                ? 'bg-emerald-500'
                                : isCurrent
                                ? 'bg-teal-600 animate-pulse'
                                : 'bg-slate-200'
                            }`} />
                            <span className={`text-[9px] block leading-tight font-medium ${
                              isCurrent ? 'font-bold text-teal-800' : isPast ? 'text-emerald-700' : 'text-slate-400'
                            }`}>
                              {stg}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Employer Note feedback if any */}
                {app.employerNotes && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-slate-700 block">Recruiter Feedback / Notes:</span>
                    <p className="text-slate-600">{app.employerNotes}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
