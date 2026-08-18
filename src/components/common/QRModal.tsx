import React, { useState } from 'react';
import { QrCode, Search, CheckCircle2, XCircle, Award, X, ShieldCheck, Download, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, initialCode = '' }) => {
  const { language } = useLanguage();
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const cleanCode = code.trim();
    if (!cleanCode) {
      setError(language === 'hi' ? 'कृपया प्रमाणपत्र कोड दर्ज करें' : 'Please enter certificate code');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyCertificate(cleanCode);
      setResult(res);
    } catch (err: any) {
      setError(err.message || (language === 'hi' ? 'प्रमाणपत्र नहीं मिला या अमान्य है' : 'Certificate ID not found or invalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative">
        
        {/* Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-sm">
              {language === 'hi' ? 'करमेत्रा आधिकारिक प्रमाणपत्र सत्यापन' : 'KarMetra Official Certificate Verification'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            {language === 'hi'
              ? 'उम्मीदवार के कौशल प्रमाणपत्र की प्रामाणिकता जांचने के लिए प्रमाणपत्र कोड (उदा. KM-2026-XXXXX) दर्ज करें।'
              : 'Enter the KarMetra Certificate Verification Code (e.g. KM-2026-XXXXX) to verify candidate credentials and skill scores in real-time.'}
          </p>

          <form onSubmit={handleVerify} className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="KM-2026-XXXXX-XXXX"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-600 focus:bg-white focus:outline-hidden uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'सत्यापित करें' : 'Verify'}</span>
            </button>
          </form>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-5 bg-gradient-to-br from-teal-50/80 to-white border-2 border-teal-200 rounded-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-teal-700 font-bold text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>{language === 'hi' ? 'सत्यापित आधिकारिक क्रेडेंशियल' : 'Verified Official Credential'}</span>
                  </div>
                  <h4 className="text-base font-black text-slate-900">{result.courseTitle}</h4>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  result.status === 'Valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-teal-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Candidate Name</span>
                  <span className="font-bold text-slate-800">{result.candidateName}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-teal-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Assessment Score</span>
                  <span className="font-bold text-teal-700">{result.certificate?.scorePercentage}% Score</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-teal-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Issue Date</span>
                  <span className="font-bold text-slate-800">{result.issueDate}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-teal-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Credential ID</span>
                  <span className="font-bold font-mono text-slate-800 text-[11px]">{result.certificate?.verificationCode}</span>
                </div>
              </div>

              {result.skills && result.skills.length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Skills Validated</span>
                  <div className="flex flex-wrap gap-1">
                    {result.skills.map((s: string, idx: number) => (
                      <span key={idx} className="bg-teal-100/70 text-teal-800 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
