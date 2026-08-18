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
  X,
  FileCheck,
  Eye,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { EmployerProfile } from '../../types';

export const AdminEmployerVerification: React.FC = () => {
  const { language } = useLanguage();
  const [employers, setEmployers] = useState<EmployerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('Pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Decision Modal State
  const [selectedEmployer, setSelectedEmployer] = useState<EmployerProfile | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<'Verified' | 'Rejected' | 'Suspended'>('Verified');
  const [decisionReason, setDecisionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  const fetchEmployers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminEmployers();
      setEmployers(res.employers || []);
    } catch (err) {
      console.error('Error loading employers for verification:', err);
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
    setDecisionReason(
      status === 'Verified'
        ? 'Business documents, GSTIN and authorized representative credentials verified successfully.'
        : status === 'Rejected'
        ? 'Business proof or GSTIN details could not be authenticated.'
        : 'Suspended pending further regulatory review.'
    );
  };

  const handleConfirmDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployer) return;

    setSubmitting(true);
    try {
      await api.verifyEmployer(selectedEmployer.id, decisionStatus, decisionReason);
      setEmployers(prev => prev.map(e => e.id === selectedEmployer.id ? { 
        ...e, 
        verificationStatus: decisionStatus as any, 
        verificationReason: decisionReason 
      } : e));
      setSelectedEmployer(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update employer verification status');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployers = employers.filter(emp => {
    if (filterStatus !== 'all') {
      const st = (emp.verificationStatus || 'Pending').toLowerCase();
      if (filterStatus.toLowerCase() === 'pending' && (st === 'pending' || st === 'under review')) {
        // match
      } else if (st !== filterStatus.toLowerCase()) {
        return false;
      }
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

  const pendingCount = employers.filter(e => !e.verificationStatus || e.verificationStatus === 'Pending' || e.verificationStatus === 'Under Review').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
        <div>
          <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-400" />
            <span>Employer Verification & KYC Governance</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Authenticate corporate entity registrations, GSTIN, PAN, and authorized company credentials across India.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{pendingCount} Pending Verification</span>
          </div>
          <button
            onClick={fetchEmployers}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'Pending', label: `Pending Review (${pendingCount})` },
            { id: 'Verified', label: 'Verified Employers' },
            { id: 'Rejected', label: 'Rejected' },
            { id: 'all', label: `All Entities (${employers.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === tab.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, GSTIN, city..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
          />
        </div>
      </div>

      {/* Verification Listing */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-500">Retrieving employer verification queue...</p>
        </div>
      ) : filteredEmployers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <FileCheck className="w-12 h-12 text-teal-600/30 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Employers in this Queue</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All submitted documentation has been processed, or no employers match the selected filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEmployers.map(emp => {
            const isVerified = emp.verificationStatus === 'Verified';
            const isRejected = emp.verificationStatus === 'Rejected';
            const isPending = !emp.verificationStatus || emp.verificationStatus === 'Pending' || emp.verificationStatus === 'Under Review';

            return (
              <div 
                key={emp.id} 
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all space-y-4 ${
                  isPending ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-teal-400 font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                      {emp.companyName ? emp.companyName.substring(0, 2).toUpperCase() : 'CO'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black text-slate-900">{emp.companyName || 'Unnamed Business'}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isVerified ? 'bg-emerald-100 text-emerald-800' :
                          isRejected ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {emp.verificationStatus || 'Pending Review'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{emp.industry || 'General Industry'}</span>
                        <span>•</span>
                        <span>{emp.companyType || 'Private Limited'}</span>
                        {emp.city && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-400" /> {emp.city}, {emp.state}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenDecision(emp, 'Verified')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                        isVerified 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isVerified ? 'Verified' : 'Approve'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenDecision(emp, 'Rejected')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                        isRejected 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{isRejected ? 'Rejected' : 'Reject'}</span>
                    </button>
                  </div>
                </div>

                {/* Details & Documents Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">GSTIN / Registration</span>
                    <span className="font-mono font-bold text-slate-800">{emp.gstNumber || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">PAN Number</span>
                    <span className="font-mono font-bold text-slate-800">{emp.panNumber || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Recruiter Contact</span>
                    <span className="text-slate-800 font-medium">{emp.recruiterName || 'Representative'} ({emp.recruiterPhone || 'N/A'})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Official Email</span>
                    <span className="text-slate-800 font-medium truncate block">{emp.recruiterEmail || emp.website || 'N/A'}</span>
                  </div>
                </div>

                {/* Uploaded Documents Showcase */}
                {emp.documents && emp.documents.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 block">Submitted Verification Proofs:</span>
                    <div className="flex flex-wrap gap-2">
                      {emp.documents.map((doc, dIdx) => (
                        <a
                          key={dIdx}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-teal-700 hover:bg-teal-50 transition-colors shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-600" />
                          <span>{doc.name || doc.type || 'Document'}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {emp.verificationReason && (
                  <div className="p-2.5 bg-slate-100 rounded-lg text-xs text-slate-600 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span><strong>Admin Note:</strong> {emp.verificationReason}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Decision Modal */}
      {selectedEmployer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <span>Confirm Verification: {selectedEmployer.companyName}</span>
              </h3>
              <button
                onClick={() => setSelectedEmployer(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Decision Verdict</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Verified', 'Rejected', 'Suspended'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setDecisionStatus(st)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        decisionStatus === st
                          ? st === 'Verified' ? 'bg-emerald-600 text-white border-emerald-600'
                            : st === 'Rejected' ? 'bg-red-600 text-white border-red-600'
                            : 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Audit Note / Reason</label>
                <textarea
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  rows={3}
                  placeholder="State the audit rationale or correction required..."
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedEmployer(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {submitting ? 'Updating...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
