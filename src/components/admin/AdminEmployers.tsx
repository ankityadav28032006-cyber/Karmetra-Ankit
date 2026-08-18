import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  Search, 
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Clock,
  X
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { EmployerProfile } from '../../types';

export const AdminEmployers: React.FC = () => {
  const { language } = useLanguage();
  const [employers, setEmployers] = useState<EmployerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected employer for verification decision modal
  const [selectedEmployer, setSelectedEmployer] = useState<EmployerProfile | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<'Verified' | 'Rejected' | 'Suspended'>('Verified');
  const [decisionReason, setDecisionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminEmployers();
      setEmployers(res.employers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployers();
  }, []);

  const handleOpenDecision = (emp: EmployerProfile, status: 'Verified' | 'Rejected' | 'Suspended') => {
    setSelectedEmployer(emp);
    setDecisionStatus(status);
    setDecisionReason(status === 'Verified' ? 'All business documentation verified with official records.' : '');
  };

  const handleConfirmDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployer) return;

    setSubmitting(true);
    try {
      await api.verifyEmployer(selectedEmployer.id, decisionStatus, decisionReason);
      setEmployers(prev => prev.map(e => e.id === selectedEmployer.id ? { ...e, verificationStatus: decisionStatus as any, verificationReason: decisionReason } : e));
      setSelectedEmployer(null);
      alert(`Employer ${selectedEmployer.companyName} marked as ${decisionStatus}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to update verification status');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployers = employers.filter(emp => {
    if (filterStatus !== 'all' && emp.verificationStatus?.toLowerCase() !== filterStatus.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = emp.companyName?.toLowerCase().includes(q);
      const matchGst = emp.gstNumber?.toLowerCase().includes(q);
      const matchEmail = emp.recruiterEmail?.toLowerCase().includes(q);
      const matchCity = emp.city?.toLowerCase().includes(q);
      if (!matchName && !matchGst && !matchEmail && !matchCity) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
        <div>
          <h2 className="text-base font-black flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-400" />
            <span>Employer KYC & Verification Desk</span>
          </h2>
          <p className="text-xs text-slate-400">
            Audit company registration documents, GSTIN numbers, and recruiter credentials
          </p>
        </div>

        <button
          onClick={fetchEmployers}
          disabled={loading}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex gap-1.5 overflow-x-auto">
          {['all', 'Pending', 'Verified', 'Rejected', 'Suspended'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-all whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, GSTIN, email..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500 text-xs"
          />
        </div>
      </div>

      {/* Employers List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
            Loading employer KYC applications...
          </div>
        ) : filteredEmployers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
            <Building2 className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-bold text-white text-xs">No employers found</p>
            <p className="text-[11px]">There are no employers matching the selected filter criteria.</p>
          </div>
        ) : (
          filteredEmployers.map(emp => {
            const isVerified = emp.verificationStatus === 'Verified';
            const isPending = emp.verificationStatus === 'Pending' || emp.verificationStatus === 'Under Review';
            const isRejected = emp.verificationStatus === 'Rejected' || emp.verificationStatus === 'Suspended';

            return (
              <div
                key={emp.id}
                className="bg-slate-900 border border-slate-800 hover:border-teal-500/60 rounded-2xl p-5 shadow-xs space-y-4 text-white transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 font-black text-lg flex items-center justify-center border border-teal-500/20">
                      {emp.companyName?.charAt(0) || 'E'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-white">{emp.companyName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          isPending ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {emp.verificationStatus || 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{emp.industry}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {emp.city}, {emp.state}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="font-mono text-slate-300 bg-slate-800 px-2 py-1 rounded text-[11px] block">
                      GST: {emp.gstNumber || 'NOT SUBMITTED'}
                    </span>
                  </div>
                </div>

                {/* Recruiter & Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Authorized Recruiter</span>
                    <span className="font-semibold text-white">{emp.recruiterName || 'Not Set'} ({emp.recruiterDesignation || 'HR'})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Contact Email</span>
                    <span className="font-semibold text-white">{emp.recruiterEmail || 'No email'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Website</span>
                    {emp.website ? (
                      <a href={emp.website} target="_blank" rel="noreferrer" className="text-teal-400 underline truncate block">
                        {emp.website}
                      </a>
                    ) : (
                      <span className="text-slate-400">Not provided</span>
                    )}
                  </div>
                </div>

                {/* Uploaded Documents */}
                {emp.documents && emp.documents.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Submitted Verification Documents</span>
                    <div className="flex flex-wrap gap-2">
                      {emp.documents.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{doc.name || doc.type}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-400/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    No verification documents uploaded yet.
                  </p>
                )}

                {emp.verificationReason && (
                  <div className="text-[11px] text-slate-400 bg-slate-800/80 p-2.5 rounded-lg">
                    <strong className="text-slate-300">Admin Audit Note:</strong> {emp.verificationReason}
                  </div>
                )}

                {/* Moderation Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-end gap-2 text-xs border-t border-slate-800">
                  <button
                    onClick={() => handleOpenDecision(emp, 'Verified')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Verify</span>
                  </button>

                  <button
                    onClick={() => handleOpenDecision(emp, 'Rejected')}
                    className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleOpenDecision(emp, 'Suspended')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Suspend</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Verification Decision Modal */}
      {selectedEmployer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 overflow-hidden text-white">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Update Verification: {selectedEmployer.companyName}</h3>
                <p className="text-xs text-slate-400">Target Status: <span className="font-bold text-teal-300">{decisionStatus}</span></p>
              </div>
              <button onClick={() => setSelectedEmployer(null)} className="p-1 text-slate-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDecision} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Audit Notes / Reason for Decision *</label>
                <textarea
                  rows={4}
                  required
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder="Explain why this employer was verified or rejected..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEmployer(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'Applying...' : 'Confirm Decision'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
