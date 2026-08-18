import React, { useState } from 'react';
import { HelpCircle, AlertTriangle, Send, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [tab, setTab] = useState<'support' | 'report'>('support');
  const [category, setCategory] = useState('Job Application Help');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Report fields
  const [targetType, setTargetType] = useState<'job' | 'employer' | 'candidate'>('job');
  const [targetTitle, setTargetTitle] = useState('');
  const [reportReason, setReportReason] = useState('Misleading Salary or Information');
  const [reportDetails, setReportDetails] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await api.submitSupportTicket({
        category,
        subject,
        message
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTitle.trim() || !reportDetails.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await api.submitReport({
        targetType,
        targetId: 'custom-target',
        targetTitle,
        reason: reportReason,
        details: reportDetails
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to file report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tab === 'support' ? (
              <HelpCircle className="w-5 h-5 text-teal-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-400" />
            )}
            <h3 className="font-bold text-sm">
              {tab === 'support'
                ? (language === 'hi' ? 'करमेत्रा सहायता डेस्क' : 'KarMetra Support Desk')
                : (language === 'hi' ? 'दुरुपयोग / धोखाधड़ी रिपोर्ट करें' : 'Report Abuse or Fraud')}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => { setTab('support'); setSuccess(false); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'support' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            {language === 'hi' ? 'सहायता टिकट (Help)' : 'Get Help'}
          </button>
          <button
            onClick={() => { setTab('report'); setSuccess(false); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'report' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            {language === 'hi' ? 'धोखाधड़ी रिपोर्ट (Report)' : 'Report Abuse'}
          </button>
        </div>

        {/* Quick Phone Helpline strip */}
        <div className="px-6 pt-4 pb-1">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-teal-700 block">Direct Telephone Support</span>
              <a href="tel:9049217304" className="text-xs font-black text-slate-900 font-mono hover:text-teal-700">
                +91 90492 17304 (9049217304)
              </a>
              <p className="text-[10px] text-slate-500">Mumbai Head Office &bull; Mon - Sat (9am - 7pm)</p>
            </div>
            <a
              href="tel:9049217304"
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg shadow-xs"
            >
              Call Now
            </a>
          </div>
        </div>

        <div className="p-6 pt-3">
          {success ? (
            <div className="text-center py-6 space-y-3 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">
                {language === 'hi' ? 'अनुरोध सफलतापूर्वक दर्ज हुआ' : 'Request Submitted Successfully'}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {language === 'hi'
                  ? 'हमारी सपोर्ट टीम 24 घंटे के भीतर आपके पंजीकृत संपर्क पर उत्तर देगी।'
                  : 'Our moderation and support team will review this within 24 hours.'}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl"
              >
                {language === 'hi' ? 'समाप्त' : 'Done'}
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {error}
                </div>
              )}

              {tab === 'support' ? (
                <form onSubmit={handleSubmitTicket} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option>Job Application Help</option>
                      <option>Course & Video Playback</option>
                      <option>Assessment & Certificate Issue</option>
                      <option>Employer Verification & Postings</option>
                      <option>Other Account Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief topic..."
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Detailed Message</label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please describe your issue with specific details..."
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'टिकट भेजें' : 'Submit Ticket'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    {(['job', 'employer', 'candidate'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTargetType(t)}
                        className={`py-2 rounded-xl border text-center font-bold capitalize ${
                          targetType === t ? 'bg-red-50 border-red-300 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {targetType === 'job' ? 'Job Title / Company' : targetType === 'employer' ? 'Company Name' : 'Candidate Name'}
                    </label>
                    <input
                      type="text"
                      value={targetTitle}
                      onChange={(e) => setTargetTitle(e.target.value)}
                      placeholder="Enter specific name or title..."
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Reason for Report</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option>Misleading Salary or Information</option>
                      <option>Asking Money for Job Offer (Fraud)</option>
                      <option>Fake Contact or Spam Recruiter</option>
                      <option>Inappropriate Behavior</option>
                      <option>Other Serious Violation</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Evidence & Description</label>
                    <textarea
                      rows={3}
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Explain the violation..."
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'रिपोर्ट दर्ज करें' : 'File Report to Admin'}</span>
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
