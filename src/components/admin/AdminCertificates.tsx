import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  QrCode, 
  RefreshCw,
  ExternalLink,
  X
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { Certificate } from '../../types';

export const AdminCertificates: React.FC = () => {
  const { language } = useLanguage();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Valid' | 'Revoked'>('All');

  // Revocation modal
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [actionStatus, setActionStatus] = useState<'Valid' | 'Revoked'>('Revoked');
  const [revocationReason, setRevocationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminCertificates();
      setCertificates(res.certificates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleOpenAction = (cert: Certificate, status: 'Valid' | 'Revoked') => {
    setSelectedCert(cert);
    setActionStatus(status);
    setRevocationReason(status === 'Valid' ? 'Credential re-validated after audit confirmation.' : 'Assessment irregularity or integrity violation.');
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCert) return;

    setSubmitting(true);
    try {
      await api.updateCertificateStatus(selectedCert.id, actionStatus, revocationReason);
      setCertificates(prev => prev.map(c => c.id === selectedCert.id ? { ...c, status: actionStatus, revocationReason } : c));
      setSelectedCert(null);
      alert(`Certificate ${selectedCert.verificationCode} updated to ${actionStatus}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to update certificate status');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = certificates.filter(cert => {
    if (filterStatus !== 'All' && cert.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = cert.verificationCode?.toLowerCase().includes(q);
      const matchName = cert.candidateName?.toLowerCase().includes(q);
      const matchCourse = cert.courseTitle?.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchCourse) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
        <div>
          <h2 className="text-base font-black flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-400" />
            <span>Official Certificate Registry & Integrity Desk</span>
          </h2>
          <p className="text-xs text-slate-400">
            Monitor verified certificates, audit assessment scores, and manage revocations
          </p>
        </div>

        <button
          onClick={fetchCertificates}
          disabled={loading}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex gap-1.5">
          {(['All', 'Valid', 'Revoked'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
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
            placeholder="Search by Code, Candidate, Course..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500 text-xs"
          />
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden text-white shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading certificate registry...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-1">
            <Award className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-bold text-white text-xs">No certificates found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Verification ID</th>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Course / Skill</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map(cert => (
                  <tr key={cert.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-teal-300 text-[11px]">
                      {cert.verificationCode}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {cert.candidateName}
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate">
                      {cert.courseTitle}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400">
                      {cert.scorePercentage}%
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        cert.status === 'Valid' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {new Date(cert.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      {cert.status === 'Valid' ? (
                        <button
                          onClick={() => handleOpenAction(cert, 'Revoked')}
                          className="px-2 py-1 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded text-[10px] font-bold transition-all"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenAction(cert, 'Valid')}
                          className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white rounded text-[10px] font-bold transition-all"
                        >
                          Re-validate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revocation / Re-validation Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 overflow-hidden text-white">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Certificate Action: {selectedCert.verificationCode}</h3>
                <p className="text-xs text-slate-400">Target State: <span className="font-bold text-teal-300">{actionStatus}</span></p>
              </div>
              <button onClick={() => setSelectedCert(null)} className="p-1 text-slate-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAction} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Reason for Status Change *</label>
                <textarea
                  rows={4}
                  required
                  value={revocationReason}
                  onChange={(e) => setRevocationReason(e.target.value)}
                  placeholder="State formal reason for audit logs..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md"
                >
                  {submitting ? 'Applying...' : 'Save Certificate Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
