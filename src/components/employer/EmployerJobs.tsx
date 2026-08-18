import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  MapPin, 
  PlusCircle, 
  PauseCircle, 
  PlayCircle, 
  XCircle, 
  ExternalLink,
  Search,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { JobPost } from '../../types';

interface EmployerJobsProps {
  onPostNewJob: () => void;
  onViewApplicantsForJob?: (jobId: string) => void;
}

export const EmployerJobs: React.FC<EmployerJobsProps> = ({ onPostNewJob, onViewApplicantsForJob }) => {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchEmployerJobs = async () => {
    if (!isAuthenticated || user?.role !== 'employer') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getEmployerJobs();
      setJobs(res.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployerJobs();
  }, [isAuthenticated, user]);

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await api.updateJobStatus(jobId, newStatus);
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus as any } : j));
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const displayedJobs = filterStatus === 'all'
    ? jobs
    : jobs.filter(j => j.status === filterStatus);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900">
            {language === 'hi' ? 'आपकी कंपनी की जॉब पोस्टिंग्स' : 'Manage Posted Job Vacancies'}
          </h2>
          <p className="text-xs text-slate-500">
            {jobs.length} total job listings
          </p>
        </div>

        <button
          onClick={onPostNewJob}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Vacancy</span>
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 text-xs">
        {['all', 'active', 'paused', 'closed'].map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-all ${
              filterStatus === st
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Jobs Table / Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Loading your job posts...
          </div>
        ) : displayedJobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-2">
            <Briefcase className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
            <p className="text-xs font-bold text-slate-700">No job posts found in this category.</p>
            <button
              onClick={onPostNewJob}
              className="mt-2 text-xs font-bold text-teal-700 hover:underline"
            >
              Post your first job vacancy →
            </button>
          </div>
        ) : (
          displayedJobs.map(job => (
            <div
              key={job.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-teal-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {job.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      job.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {job.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 mt-1">{job.title}</h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.city}, {job.state} • {job.workMode}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-slate-900">
                    ₹{(job.salaryMin / 100000).toFixed(1)} - {(job.salaryMax / 100000).toFixed(1)} LPA
                  </span>
                  <p className="text-[11px] text-teal-700 font-bold mt-0.5">
                    {job.applicantsCount || 0} Applicants Received
                  </p>
                </div>
              </div>

              {/* Skills Tags */}
              {job.skillsRequired && (
                <div className="flex flex-wrap gap-1">
                  {job.skillsRequired.map((sk, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded">
                      {sk}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Change Status:</span>
                  {job.status === 'active' ? (
                    <button
                      onClick={() => handleStatusChange(job.id, 'paused')}
                      className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg font-bold flex items-center gap-1"
                    >
                      <PauseCircle className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(job.id, 'active')}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg font-bold flex items-center gap-1"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Activate</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleStatusChange(job.id, 'closed')}
                    className="px-2.5 py-1 bg-red-50 text-red-800 hover:bg-red-100 rounded-lg font-bold flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Close</span>
                  </button>
                </div>

                {onViewApplicantsForJob && (
                  <button
                    onClick={() => onViewApplicantsForJob(job.id)}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>View {job.applicantsCount || 0} Candidates</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
