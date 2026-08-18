import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Bookmark, 
  Share2, 
  CheckCircle2, 
  FileText, 
  AlertTriangle, 
  GraduationCap, 
  DollarSign, 
  Users,
  ShieldCheck,
  Check
} from 'lucide-react';
import { GovernmentVacancy } from '../../types';

interface GovernmentJobDetailModalProps {
  vacancy: GovernmentVacancy;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  onClose: () => void;
}

export const GovernmentJobDetailModal: React.FC<GovernmentJobDetailModalProps> = ({
  vacancy,
  isSaved = false,
  onToggleSave,
  onClose
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${vacancy.title} - KarMetra Govt Vacancy`,
        text: `Check out ${vacancy.title} at ${vacancy.department} (${vacancy.totalVacancies} Posts)`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 text-slate-900 space-y-6">
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                vacancy.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : vacancy.status === 'Upcoming'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                ● {vacancy.status}
              </span>

              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-200">
                {vacancy.jobType}
              </span>

              <span className="bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-600" />
                {vacancy.state}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {vacancy.title}
            </h2>

            <p className="text-xs font-bold text-teal-800">
              {vacancy.department} {vacancy.organization && `• ${vacancy.organization}`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onToggleSave && (
              <button
                onClick={() => onToggleSave(vacancy.id)}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  isSaved
                    ? 'bg-amber-50 border-amber-300 text-amber-600'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
                }`}
                title={isSaved ? 'Remove Bookmark' : 'Save Vacancy'}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500' : ''}`} />
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl border border-slate-200 transition-colors cursor-pointer"
              title="Share"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Highlight Stats Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
              <Users className="w-3 h-3 text-teal-600" />
              Total Openings
            </span>
            <span className="text-base font-black text-slate-900">{vacancy.totalVacancies.toLocaleString()} Posts</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-600" />
              Pay Scale
            </span>
            <span className="font-bold text-slate-900 line-clamp-1">{vacancy.salaryScale || 'Standard Scale'}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-blue-600" />
              Education
            </span>
            <span className="font-bold text-slate-900 line-clamp-1">{vacancy.qualificationRequired}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-red-500" />
              Last Date
            </span>
            <span className="font-bold text-red-600">{vacancy.applicationLastDate}</span>
          </div>
        </div>

        {/* Important Dates Timeline */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
          <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            Important Recruitment Dates
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block">Application Start Date</span>
              <span className="font-bold text-slate-800">{vacancy.applicationStartDate || 'Active Now'}</span>
            </div>

            <div className="p-2.5 bg-red-50/50 rounded-xl border border-red-100">
              <span className="text-[10px] text-red-400 font-bold block">Last Date to Submit Online</span>
              <span className="font-bold text-red-700">{vacancy.applicationLastDate}</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block">Exam / Assessment Date</span>
              <span className="font-bold text-slate-800">{vacancy.examDate || 'To be announced'}</span>
            </div>
          </div>
        </div>

        {/* Eligibility & Age Limit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5">
            <h4 className="font-bold text-slate-900">Minimum Educational Qualification</h4>
            <p className="text-slate-600 leading-relaxed">{vacancy.qualificationRequired}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5">
            <h4 className="font-bold text-slate-900">Age Criteria & Relaxation</h4>
            <p className="text-slate-600 leading-relaxed">{vacancy.ageLimit || 'As per Government Rules'}</p>
          </div>
        </div>

        {/* Selection Process */}
        {vacancy.selectionProcess && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              Selection Stages / Examination Pattern
            </h4>
            <div className="text-slate-600 whitespace-pre-line leading-relaxed pl-1">
              {vacancy.selectionProcess}
            </div>
          </div>
        )}

        {/* Description / Summary */}
        {vacancy.description && (
          <div className="text-xs text-slate-600 space-y-1">
            <h4 className="font-bold text-slate-900">Notification Overview</h4>
            <p className="whitespace-pre-line leading-relaxed">{vacancy.description}</p>
          </div>
        )}

        {/* Official Advisory & Disclaimer */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-950 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Official Government Notice Transparency</span>
            <p className="text-amber-800 leading-relaxed">
              KarMetra provides authentic, consolidated public recruitment alerts. Applications must be completed exclusively through the official Government agency portal linked below. KarMetra never asks for application fees for Government posts.
            </p>
          </div>
        </div>

        {/* Direct Action Links Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {vacancy.notificationPdfUrl && (
              <a
                href={vacancy.notificationPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>View Official PDF</span>
              </a>
            )}

            {vacancy.officialWebsiteUrl && (
              <a
                href={vacancy.officialWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <Building2 className="w-4 h-4" />
                <span>Dept Website</span>
              </a>
            )}
          </div>

          <a
            href={vacancy.applyOnlineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-7 py-3 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Apply on Official Portal</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
