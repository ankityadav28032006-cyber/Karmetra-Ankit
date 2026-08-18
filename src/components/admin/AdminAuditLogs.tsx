import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  User, 
  Activity
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { AuditLog } from '../../types';

export const AdminAuditLogs: React.FC = () => {
  const { language } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminAuditLogs();
      setLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(l => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAction = l.action?.toLowerCase().includes(q);
      const matchTarget = l.targetType?.toLowerCase().includes(q);
      const matchDetails = l.details?.toLowerCase().includes(q);
      const matchAdmin = l.adminName?.toLowerCase().includes(q);
      if (!matchAction && !matchTarget && !matchDetails && !matchAdmin) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
        <div>
          <h2 className="text-base font-black flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            <span>Administrative Audit Trail & Security Log</span>
          </h2>
          <p className="text-xs text-slate-400">
            Immutable chronological record of all KYC approvals, job moderation, course modifications, and certificates
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit actions, admins, targets..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden text-white shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit ledger...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-1">
            <FileText className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-bold text-white text-xs">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target Scope</th>
                  <th className="px-4 py-3">Details / Audit Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-[11px] whitespace-nowrap font-mono">
                      {new Date(l.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="px-4 py-3 font-bold text-teal-300">
                      {l.adminName || 'SuperAdmin'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {l.action}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {l.targetType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-[11px] max-w-md">
                      {l.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
