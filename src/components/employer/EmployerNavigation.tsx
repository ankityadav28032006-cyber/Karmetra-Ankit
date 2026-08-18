import React from 'react';
import { LayoutDashboard, PlusCircle, Briefcase, Users, Search, Video, Building2 } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';

export type EmployerTab = 'dashboard' | 'post-job' | 'jobs' | 'applicants' | 'talent-search' | 'interviews' | 'profile';

interface EmployerNavigationProps {
  activeTab: EmployerTab;
  setActiveTab: (tab: EmployerTab) => void;
  applicantsCount?: number;
}

export const EmployerNavigation: React.FC<EmployerNavigationProps> = ({
  activeTab,
  setActiveTab,
  applicantsCount = 0
}) => {
  const { language } = useLanguage();

  const navItems = [
    { id: 'dashboard' as EmployerTab, label: language === 'hi' ? 'डैशबोर्ड' : 'Dashboard', icon: LayoutDashboard },
    { id: 'post-job' as EmployerTab, label: language === 'hi' ? 'जॉब पोस्ट करें' : 'Post Job', icon: PlusCircle },
    { id: 'jobs' as EmployerTab, label: language === 'hi' ? 'जॉब प्रबंधित करें' : 'Manage Jobs', icon: Briefcase },
    { id: 'applicants' as EmployerTab, label: language === 'hi' ? 'उम्मीदवार पाइपलाइन' : 'Applicants', icon: Users, badge: applicantsCount },
    { id: 'talent-search' as EmployerTab, label: language === 'hi' ? 'टैलेंट सर्च' : 'Talent Search', icon: Search },
    { id: 'profile' as EmployerTab, label: language === 'hi' ? 'कंपनी प्रोफ़ाइल' : 'Company Profile', icon: Building2 },
  ];

  return (
    <div className="bg-white border-t sm:border-t-0 sm:border-b border-slate-200 sticky bottom-0 sm:top-16 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        <nav className="flex items-center justify-around sm:justify-start sm:gap-2 py-1.5 sm:py-2 overflow-x-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`employer-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'text-teal-700 bg-teal-50 sm:bg-teal-700 sm:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
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
