import React from 'react';
import { Video, ExternalLink, Calendar, Clock, User, X, CheckCircle2, Shield } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { Interview } from '../../types';

interface GoogleMeetModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview | null;
}

export const GoogleMeetModal: React.FC<GoogleMeetModalProps> = ({ isOpen, onClose, interview }) => {
  const { language } = useLanguage();

  if (!isOpen || !interview) return null;

  const handleJoin = () => {
    if (interview.meetingLink) {
      window.open(interview.meetingLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative">
        
        {/* Banner */}
        <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-800 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-2">
            <Video className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold">
            {language === 'hi' ? 'गूगल मीट साक्षात्कार कक्ष' : 'Google Meet Video Interview'}
          </h3>
          <p className="text-xs text-emerald-100 mt-1">
            {interview.companyName} • {interview.jobTitle}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Calendar className="w-4 h-4 text-teal-600" />
                {language === 'hi' ? 'दिनांक एवं समय:' : 'Scheduled Time:'}
              </span>
              <strong className="text-slate-900 font-bold">
                {new Date(interview.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </strong>
            </div>

            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <User className="w-4 h-4 text-teal-600" />
                {language === 'hi' ? 'साक्षात्कारकर्ता:' : 'Interviewer:'}
              </span>
              <strong className="text-slate-900 font-bold">{interview.interviewerName}</strong>
            </div>

            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Shield className="w-4 h-4 text-teal-600" />
                {language === 'hi' ? 'प्रारूप:' : 'Format:'}
              </span>
              <strong className="text-emerald-700 font-bold">{interview.interviewType}</strong>
            </div>
          </div>

          {interview.instructions && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-1">
              <span className="font-bold block">
                {language === 'hi' ? 'विशेष निर्देश:' : 'Instructions from Recruiter:'}
              </span>
              <p>{interview.instructions}</p>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <button
              onClick={handleJoin}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Video className="w-4 h-4" />
              <span>{language === 'hi' ? 'गूगल मीट में प्रवेश करें' : 'Join Google Meet Now'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              {language === 'hi' ? 'बाद में जुड़ें' : 'Dismiss'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
