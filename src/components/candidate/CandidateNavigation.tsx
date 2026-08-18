import React from 'react';
import { LayoutDashboard, Home, Briefcase, GraduationCap, FileCheck, User, Sparkles, Building2 } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';

export type CandidateTab = 'dashboard' | 'home' | 'jobs' | 'govt-jobs' | 'learning' | 'applications' | 'profile' | 'resume';

interface CandidateNavigationProps {
  activeTab: CandidateTab;
  setActiveTab: (tab: CandidateTab) => void;
  applicationsCount?: number;
}

export const CandidateNavigation: React.FC<CandidateNavigationProps> = ({
  activeTab,
  setActiveTab,
  applicationsCount = 0
}) => {
  const { language, t } = useLanguage();

  const navItems = [
    { id: 'dashboard' as CandidateTab, label: t?.candidateNav?.dashboard || (language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'), icon: LayoutDashboard },
    { id: 'home' as CandidateTab, label: t?.candidateNav?.home || (language === 'hi' ? 'मुख्य पृष्ठ' : 'Home'), icon: Home },
    { id: 'jobs' as CandidateTab, label: t?.candidateNav?.jobs || (language === 'hi' ? 'नौकरियां' : 'Jobs'), icon: Briefcase },
    { id: 'govt-jobs' as CandidateTab, label: language === 'hi' ? 'सरकारी भर्ती' : 'Govt Jobs', icon: Building2, highlight: true },
    { id: 'resume' as CandidateTab, label: language === 'hi' ? 'AI रिज्यूमे' : 'AI Resume', icon: Sparkles },
    { id: 'learning' as CandidateTab, label: t?.candidateNav?.learning || (language === 'hi' ? 'सीखें' : 'Learning'), icon: GraduationCap },
    { id: 'applications' as CandidateTab, label: t?.candidateNav?.applications || (language === 'hi' ? 'आवेदन' : 'Applications'), icon: FileCheck, badge: applicationsCount },
    { id: 'profile' as CandidateTab, label: t?.candidateNav?.profile || (language === 'hi' ? 'प्रोफ़ाइल' : 'Profile'), icon: User }
  ];

  return (
    <div className="bg-white border-t sm:border-t-0 sm:border-b border-slate-200 sticky bottom-0 sm:top-16 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        <nav className="flex items-center justify-around sm:justify-start sm:gap-2 py-1.5 sm:py-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`candidate-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'text-teal-700 bg-teal-50 sm:bg-teal-600 sm:text-white shadow-xs'
                    : item.highlight
                    ? 'text-teal-700 bg-teal-50/50 hover:bg-teal-100 hover:text-teal-900'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.highlight && !isActive ? 'text-teal-600' : ''}`} />
                <span className="text-[10px] sm:text-xs tracking-tight">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="sm:ml-1.5 px-1.5 py-0.2 bg-teal-700 sm:bg-white text-white sm:text-teal-800 text-[9px] font-extrabold rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
