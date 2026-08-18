import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Flag, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  User, 
  Mail, 
  Send,
  X
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { SupportTicket, ReportItem } from '../../types';

export const AdminSupport: React.FC = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'tickets' | 'reports'>('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Replying to ticket modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<string>('Resolved');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, rRes] = await Promise.all([
        api.getAdminTickets(),
        api.getAdminReports().catch(() => ({ reports: [] }))
      ]);
      setTickets(tRes.tickets || []);
      setReports(rRes.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenReply = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setReplyText(ticket.adminReply || '');
    setReplyStatus(ticket.status === 'Resolved' ? 'Resolved' : 'In Progress');
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setSubmitting(true);
    try {
      await api.replyAdminTicket(selectedTicket.id, replyStatus, replyText);
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: replyStatus as any, adminReply: replyText } : t));
      setSelectedTicket(null);
      alert('Support reply dispatched to user!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
        <div>
          <h2 className="text-base font-black flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-teal-400" />
            <span>Support Helpdesk & Grievance Moderation</span>
          </h2>
          <p className="text-xs text-slate-400">
            Address candidate & recruiter queries, fraud reports, and platform issues
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Desk</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'tickets'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Support Inquiries ({tickets.filter(t => t.status === 'Open').length} Open)</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Flag className="w-4 h-4 text-amber-400" />
          <span>Reported Content & Grievances ({reports.length})</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'tickets' ? (
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
              Loading support tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
              <p className="font-bold text-white text-xs">All clear!</p>
              <p className="text-[11px]">No open support tickets at the moment.</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <div
                key={ticket.id}
                className="bg-slate-900 border border-slate-800 hover:border-teal-500/60 rounded-2xl p-5 shadow-xs space-y-3 text-white transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold bg-slate-800 px-2 py-0.5 rounded text-teal-300 border border-slate-700">
                        {ticket.category || 'General'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        ticket.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300' :
                        ticket.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white mt-1">{ticket.subject}</h3>
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    <span className="font-semibold text-white block">{ticket.userName} ({ticket.userRole})</span>
                    <span>{ticket.userContact}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                  {ticket.message}
                </p>

                {ticket.adminReply && (
                  <div className="text-xs bg-teal-950/40 border border-teal-800/40 p-3 rounded-xl text-teal-200">
                    <strong className="block text-teal-400 font-bold mb-0.5">Admin Response:</strong>
                    {ticket.adminReply}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    Created: {new Date(ticket.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>

                  <button
                    onClick={() => handleOpenReply(ticket)}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{ticket.adminReply ? 'Update Reply' : 'Reply & Resolve'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Reports View */
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
              <p className="font-bold text-white text-xs">No pending reports</p>
              <p className="text-[11px]">No users or jobs have been flagged for investigation.</p>
            </div>
          ) : (
            reports.map(rep => (
              <div
                key={rep.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-3 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-red-400" />
                    <span className="font-bold text-sm">Flagged {rep.targetType}: {rep.targetTitle}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-300 font-bold uppercase rounded text-[10px]">
                    {rep.status}
                  </span>
                </div>
                <p className="text-slate-300"><strong>Reason:</strong> {rep.reason}</p>
                <p className="text-slate-400 bg-slate-800/40 p-2.5 rounded-lg">{rep.details}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 overflow-hidden text-white">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Reply to {selectedTicket.userName}</h3>
                <p className="text-xs text-slate-400">Subject: {selectedTicket.subject}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1 text-slate-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendReply} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Status after response</label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-teal-500"
                >
                  <option value="Resolved">Resolved</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Official Response Message *</label>
                <textarea
                  rows={5}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your official helpdesk response..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-teal-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Sending...' : 'Send Official Reply'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
