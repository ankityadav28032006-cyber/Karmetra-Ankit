import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Video, 
  FileText, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { JobApplication, Interview } from '../../types';

interface EmployerApplicantsProps {
  initialJobFilter?: string | null;
  onLaunchInterviewModal?: (interview: Interview) => void;
}

const STAGES = [
  'All',
  'Applied',
  'Under Review',
  'Shortlisted',
  'Contacted',
  'Interview Scheduled',
  'Interview Completed',
  'Selected',
  'Joined',
  'Rejected'
];

export const EmployerApplicants: React.FC<EmployerApplicantsProps> = ({
  initialJobFilter = null,
  onLaunchInterviewModal
}) => {
  const { language } = useLanguage();
  const [applicants, setApplicants] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState('All');

  // Schedule Interview State
  const [schedulingApp, setSchedulingApp] = useState<JobApplication | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('11:00');
  const [interviewerName, setInterviewerName] = useState('Lead Hiring Manager');
  const [interviewType, setInterviewType] = useState('Google Meet Video');
  const [interviewNotes, setInterviewNotes] = useState('Please have your portfolio / certificate ready.');
  const [schedulingLoading, setSchedulingLoading] = useState(false);

  // Selected candidate drawer
  const [viewingApp, setViewingApp] = useState<JobApplication | null>(null);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const res = await api.getEmployerApplicants();
      setApplicants(res.applicants || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  const handleUpdateStatus = async (appId: string, status: string, notes?: string) => {
    try {
      await api.updateApplicationStatus(appId, status, notes);
      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: status as any } : a));
      if (viewingApp?.id === appId) {
        setViewingApp(prev => prev ? { ...prev, status: status as any } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update candidate status');
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingApp || !interviewDate) return;

    setSchedulingLoading(true);
    try {
      const combinedDateTime = `${interviewDate}T${interviewTime}:00`;
      const res = await api.scheduleInterview({
        applicationId: schedulingApp.id,
        candidateId: schedulingApp.candidateId,
        jobId: schedulingApp.jobId,
        dateTime: combinedDateTime,
        interviewType,
        interviewerName,
        instructions: interviewNotes
      });

      // Update candidate status to 'Interview Scheduled'
      await handleUpdateStatus(schedulingApp.id, 'Interview Scheduled', `Google Meet scheduled on ${combinedDateTime}`);
      setSchedulingApp(null);
      alert('Google Meet interview scheduled and candidate notified via SMS/Applet!');
    } catch (err: any) {
      alert(err.message || 'Failed to schedule interview');
    } finally {
      setSchedulingLoading(false);
    }
  };

  const displayedApplicants = applicants.filter(app => {
    if (initialJobFilter && app.jobId !== initialJobFilter) return false;
    if (selectedStage !== 'All' && app.status !== selectedStage) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900">
            {language === 'hi' ? 'उम्मीदवार भर्ती पाइपलाइन' : 'Candidate Applications & Review Desk'}
          </h2>
          <p className="text-xs text-slate-500">
            {applicants.length} total applications across all posted vacancies
          </p>
        </div>
      </div>

      {/* Stage Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
        {STAGES.map(stg => (
          <button
            key={stg}
            onClick={() => setSelectedStage(stg)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 ${
              selectedStage === stg
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {stg}
          </button>
        ))}
      </div>

      {/* Main Applicants List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Loading candidate applications...
          </div>
        ) : displayedApplicants.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
            <p className="text-xs font-bold text-slate-700">No applicants found under "{selectedStage}".</p>
          </div>
        ) : (
          displayedApplicants.map(app => {
            const isSelected = app.status === 'Selected' || app.status === 'Joined';
            const isRejected = app.status === 'Rejected';

            return (
              <div
                key={app.id}
                className="bg-white border border-slate-200 hover:border-teal-300 rounded-2xl p-5 shadow-xs space-y-4 transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-black text-sm flex items-center justify-center">
                      {app.candidateName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900">{app.candidateName}</h3>
                        {app.matchScore && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            {app.matchScore}% Match
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Applied for: <strong className="text-slate-800">{app.jobTitle}</strong></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      isRejected ? 'bg-red-100 text-red-800' : isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                    }`}>
                      {app.status}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Candidate details / Contact preview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Mobile</span>
                    <span className="font-semibold text-slate-800">{app.candidateMobile || 'Restricted until shortlisted'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Email</span>
                    <span className="font-semibold text-slate-800">{app.candidateEmail || 'Candidate Email'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Resume</span>
                    {app.resumeUrl ? (
                      <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="text-teal-700 font-bold underline flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 font-medium">KarMetra Standard Profile</span>
                    )}
                  </div>
                </div>

                {app.coverMessage && (
                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-700">Cover Note:</span> {app.coverMessage}
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Advance Stage:</span>
                    
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'Shortlisted')}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg font-bold"
                    >
                      Shortlist
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(app.id, 'Selected')}
                      className="px-2.5 py-1 bg-teal-50 text-teal-800 hover:bg-teal-100 rounded-lg font-bold"
                    >
                      Select & Offer
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(app.id, 'Rejected')}
                      className="px-2.5 py-1 bg-red-50 text-red-800 hover:bg-red-100 rounded-lg font-bold"
                    >
                      Reject
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setSchedulingApp(app);
                      setInterviewDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Schedule Google Meet</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Video Interview Modal */}
      {schedulingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative">
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Schedule Google Meet Interview</h3>
                <p className="text-xs text-emerald-100">Candidate: {schedulingApp.candidateName}</p>
              </div>
              <button onClick={() => setSchedulingApp(null)} className="p-1 text-emerald-100 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Interview Date *</label>
                  <input
                    type="date"
                    required
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Time (IST) *</label>
                  <input
                    type="time"
                    required
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Interviewer Name / Panel</label>
                <input
                  type="text"
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Instructions for Candidate</label>
                <textarea
                  rows={3}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-center gap-2">
                <Video className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Google Meet URL will be auto-generated and dispatched directly to the candidate's KarMetra console.</span>
              </div>

              <button
                type="submit"
                disabled={schedulingLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>{schedulingLoading ? 'Scheduling...' : 'Confirm & Send Invitation'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
