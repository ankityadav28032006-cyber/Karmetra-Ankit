import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  Building2, 
  Sparkles,
  Info
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';

export const AdminBroadcast: React.FC = () => {
  const { language } = useLanguage();
  const [targetAudience, setTargetAudience] = useState<'all' | 'candidates' | 'employers'>('all');
  const [type, setType] = useState<'system' | 'job' | 'learning' | 'verification'>('system');
  const [title, setTitle] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [message, setMessage] = useState('');
  const [messageHi, setMessageHi] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSubmitting(true);
    setSuccess(false);
    try {
      await api.broadcastNotification({
        targetAudience,
        type,
        title,
        titleHi: titleHi || title,
        message,
        messageHi: messageHi || message
      });
      setSuccess(true);
      setTitle('');
      setTitleHi('');
      setMessage('');
      setMessageHi('');
      alert('Broadcast notification dispatched across KarMetra network!');
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch broadcast');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs text-white">
        <h2 className="text-base font-black flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-400" />
          <span>Pan-India System Broadcast & In-App Alerts</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Dispatch real-time announcements, mega hiring drive alerts, or policy updates to mobile and web user notification drawers.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xs text-white">
        <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
          
          {/* Target Audience */}
          <div>
            <label className="font-bold text-slate-300 block mb-1.5">Target Audience *</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTargetAudience('all')}
                className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
                  targetAudience === 'all'
                    ? 'bg-teal-600 border-teal-500 text-white shadow-xs'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>All Users</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience('candidates')}
                className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
                  targetAudience === 'candidates'
                    ? 'bg-teal-600 border-teal-500 text-white shadow-xs'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Candidates Only</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience('employers')}
                className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
                  targetAudience === 'employers'
                    ? 'bg-teal-600 border-teal-500 text-white shadow-xs'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Employers Only</span>
              </button>
            </div>
          </div>

          {/* Notification Category */}
          <div>
            <label className="font-bold text-slate-300 block mb-1">Notification Category</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-teal-500"
            >
              <option value="system">System Announcement / General Notice</option>
              <option value="job">Special Hiring Drive / Mega Job Fair</option>
              <option value="learning">New Skill Course / LMS Release</option>
              <option value="verification">KYC & Compliance Advisory</option>
            </select>
          </div>

          {/* Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Alert Title (English) *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Pan-India Mega IT & Non-IT Hiring Drive"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-teal-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Alert Title (हिन्दी)</label>
              <input
                type="text"
                value={titleHi}
                onChange={(e) => setTitleHi(e.target.value)}
                placeholder="उदा. अखिल भारतीय विशाल भर्ती अभियान"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-teal-500"
              />
            </div>
          </div>

          {/* Message Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Message Body (English) *</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write clear details for the broadcast notification..."
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-teal-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Message Body (हिन्दी)</label>
              <textarea
                rows={4}
                value={messageHi}
                onChange={(e) => setMessageHi(e.target.value)}
                placeholder="विस्तृत संदेश हिन्दी में लिखें..."
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-teal-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Broadcasting...' : 'Dispatch Broadcast Alert'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
