import React from 'react';
import { Building2, Briefcase, Users, Video, ShieldCheck, ArrowRight, Sparkles, CheckCircle2, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';

interface EmployerLoginGatewayProps {
  onOpenLogin: () => void;
}

export const EmployerLoginGateway: React.FC<EmployerLoginGatewayProps> = ({ onOpenLogin }) => {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto my-8 space-y-6 animate-in fade-in">
      {/* Main Gateway Card */}
      <div className="bg-white border border-teal-100 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -z-10 opacity-70 pointer-events-none" />
        
        <div className="w-16 h-16 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-center mx-auto text-teal-700 shadow-sm">
          <Building2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>{language === 'hi' ? 'नियोक्ता एवं रिक्रूटर पोर्टल' : 'Employer & Recruiter Portal'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {language === 'hi' ? 'सत्यापित प्रतिभाओं को सीधे हायर करें' : 'Hire Skill-Verified Candidates'}
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            {language === 'hi'
              ? 'अखिल भारतीय स्तर पर नौकरियां पोस्ट करें, आधिकारिक डिजिटल प्रमाणपत्र वाले सत्यापित उम्मीदवारों को खोजें और वीडियो साक्षात्कार शेड्यूल करें।'
              : 'Post verified vacancies across Pan-India, search talent with authentic skill certificates, and conduct live structured video interviews.'}
          </p>
        </div>

        {/* Current status if logged in as candidate or other role */}
        {isAuthenticated && user?.role !== 'employer' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-900">
                {language === 'hi' ? 'वर्तमान में उम्मीदवार के रूप में लॉग इन हैं' : 'Currently signed in as Candidate'} ({user?.mobile})
              </p>
              <p className="text-xs text-amber-700">
                {language === 'hi'
                  ? 'नियोक्ता सुविधाओं (जॉब पोस्टिंग, आवेदक प्रबंधन) का उपयोग करने के लिए कृपया नियोक्ता खाते में लॉगिन करें।'
                  : 'To access recruiter tools (posting jobs, candidate screening, scheduling), please sign in with an employer account.'}
              </p>
            </div>
          </div>
        )}

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <Briefcase className="w-5 h-5 text-teal-600" />
            <p className="text-xs font-bold text-slate-900">
              {language === 'hi' ? 'जॉब पोस्टिंग' : 'Job Postings'}
            </p>
            <p className="text-[11px] text-slate-500">
              {language === 'hi' ? 'पैन-इंडिया लोकेशन और सैलरी' : 'Multi-location, salary filters & GPS'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <Users className="w-5 h-5 text-teal-600" />
            <p className="text-xs font-bold text-slate-900">
              {language === 'hi' ? 'प्रमाणित टैलेंट' : 'Certified Talent'}
            </p>
            <p className="text-[11px] text-slate-500">
              {language === 'hi' ? 'सत्यापित कौशल और टेस्ट स्कोर' : 'Verified QR certificates & scores'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <Video className="w-5 h-5 text-teal-600" />
            <p className="text-xs font-bold text-slate-900">
              {language === 'hi' ? 'वीडियो इंटरव्यू' : 'Video Interviews'}
            </p>
            <p className="text-[11px] text-slate-500">
              {language === 'hi' ? '1-क्लिक गूगल मीट शेड्यूलिंग' : 'Built-in interview scheduling & status'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            id="employer-gateway-login-btn"
            onClick={onOpenLogin}
            className="w-full sm:w-auto px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-700/20 flex items-center justify-center gap-2 mx-auto transition-all hover:scale-[1.02] cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>
              {language === 'hi' ? 'नियोक्ता लॉगिन / साइन-अप' : 'Employer Login / Sign Up with Mobile OTP'}
            </span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
