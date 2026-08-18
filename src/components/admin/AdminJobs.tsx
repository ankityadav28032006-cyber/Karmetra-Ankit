import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  PauseCircle, 
  PlayCircle, 
  MapPin, 
  Building2, 
  Search, 
  RefreshCw, 
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  X
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { JobPost } from '../../types';

export const AdminJobs: React.FC = () => {
  const { language } = useLanguage();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Moderation modal
  const [moderatingJob, setModeratingJob] = useState<JobPost | null>(null);
  const [moderationStatus, setModerationStatus] = useState<'Active' | 'Rejected' | 'Paused' | 'Closed'>('Active');
  const [adminFeedback, setAdminFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminJobs();
      setJobs(res.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleOpenModeration = (job: JobPost, status: 'Active' | 'Rejected' | 'Paused' | 'Closed') => {
    setModeratingJob(job);
    setModerationStatus(status);
    setAdminFeedback(status === 'Active' ? 'Job listing approved. Meets quality and non-discrimination guidelines.' : '');
  };

  const handleConfirmModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderatingJob) return;

    setSubmitting(true);
    try {
      await api.moderateJob(moderatingJob.id, moderationStatus, adminFeedback);
      setJobs(prev => prev.map(j => j.id === moderatingJob.id ? { ...j, status: moderationStatus as any, adminFeedback } : j));
      setModeratingJob(null);
      alert(`Job vacancy "${moderatingJob.title}" updated to ${moderationStatus}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to moderate job opening');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (filterCategory !== 'All' && job.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = job.title?.toLowerCase().includes(q);
      const matchCompany = job.companyName?.toLowerCase().includes(q);
      const matchCity = (job.locationCity || '')?.toLowerCase().includes(q);
      if (!matchTitle && !matchCompany && !matchCity) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
        <div>
          <h2 className="text-base font-black flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-teal-400" />
            <span>Job Vacancy Moderation & Quality Control</span>
          </h2>
          <p className="text-xs text-slate-400">
            Audit job listings across IT, Non-IT, Business, and Blue Collar categories
          </p>
        </div>

        <button
          onClick={fetchJobs}
          disabled={loading}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Listings</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex gap-1.5 overflow-x-auto">
          {['All', 'IT', 'Non-IT', 'Business', 'Blue Collar'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by job title, company..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500 text-xs"
          />
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
            Loading job listings...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
            <Briefcase className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-bold text-white text-xs">No job postings found</p>
          </div>
        ) : (
          filteredJobs.map(job => (
            <div
              key={job.id}
              className="bg-slate-900 border border-slate-800 hover:border-teal-500/60 rounded-2xl p-5 shadow-xs space-y-4 text-white transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 border border-teal-500/30 px-2 py-0.5 rounded">
                      {job.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      job.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      job.status === 'Pending Approval' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {job.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-white mt-1">{job.title}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.companyName}</span>
                    <span>•</span>
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.locationCity || 'Location'}, {job.locationState || ''} ({job.workMode})</span>
                  </p>
                </div>

                <div className="text-right text-xs">
                  <span className="font-bold text-teal-300 block">
                    ₹{(job.salaryMin / 100000).toFixed(1)} - {(job.salaryMax / 100000).toFixed(1)} LPA
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {job.applicationsCount || 0} applicants • {job.viewsCount || 0} views
                  </span>
                </div>
              </div>

              {/* Description Preview */}
              <p className="text-xs text-slate-300 line-clamp-2 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                {job.description}
              </p>

              {/* Skills and Certificates */}
              <div className="flex flex-wrap gap-1 text-[10px]">
                {job.requiredSkills?.map((s, idx) => (
                  <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    {s}
                  </span>
                ))}
              </div>

              {job.adminFeedback && (
                <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                  <strong>Moderator Feedback:</strong> {job.adminFeedback}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-2 text-xs border-t border-slate-800">
                <button
                  onClick={() => handleOpenModeration(job, 'Active')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Active</span>
                </button>

                <button
                  onClick={() => handleOpenModeration(job, 'Paused')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pause</span>
                </button>

                <button
                  onClick={() => handleOpenModeration(job, 'Rejected')}
                  className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Listing</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Job Moderation Modal */}
      {moderatingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 overflow-hidden text-white">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Moderate Job: {moderatingJob.title}</h3>
                <p className="text-xs text-slate-400">Target Status: <span className="font-bold text-teal-300">{moderationStatus}</span></p>
              </div>
              <button onClick={() => setModeratingJob(null)} className="p-1 text-slate-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmModeration} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Feedback to Recruiter *</label>
                <textarea
                  rows={4}
                  required
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  placeholder="Provide moderation feedback or reason for job status change..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModeratingJob(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{submitting ? 'Updating...' : 'Save Decision'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
