import React from 'react';
import { 
  ShieldCheck, 
  Building2, 
  Briefcase, 
  GraduationCap, 
  Award, 
  HelpCircle, 
  Bell, 
  FileText, 
  LayoutDashboard, 
  Settings, 
  DollarSign,
  Layers,
  Landmark,
  Globe
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';

export type AdminTab = 
  | 'overview' 
  | 'employers' 
  | 'verification'
  | 'jobs' 
  | 'categories'
  | 'govt-jobs'
  | 'courses' 
  | 'certificates' 
  | 'monetization' 
  | 'support' 
  | 'broadcast' 
  | 'audit'
  | 'settings'
  | 'domains';

interface AdminNavigationProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  pendingVerifications?: number;
  pendingTickets?: number;
}

export const AdminNavigation: React.FC<AdminNavigationProps> = ({
  activeTab,
  setActiveTab,
  pendingVerifications = 0,
  pendingTickets = 0
}) => {
  const navItems = [
    { id: 'overview' as AdminTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'verification' as AdminTab, label: 'Employer Verification', icon: Building2, badge: pendingVerifications },
    { id: 'jobs' as AdminTab, label: 'Job Moderation', icon: Briefcase },
    { id: 'categories' as AdminTab, label: 'Job Categories', icon: Layers },
    { id: 'govt-jobs' as AdminTab, label: 'Govt Vacancies', icon: Landmark },
    { id: 'courses' as AdminTab, label: 'LMS Course Studio', icon: GraduationCap },
    { id: 'certificates' as AdminTab, label: 'Certificates Desk', icon: Award },
    { id: 'monetization' as AdminTab, label: 'Monetization & GST', icon: DollarSign },
    { id: 'support' as AdminTab, label: 'Support & Reports', icon: HelpCircle, badge: pendingTickets },
    { id: 'broadcast' as AdminTab, label: 'Broadcast Alerts', icon: Bell },
    { id: 'audit' as AdminTab, label: 'Audit Logs', icon: FileText },
    { id: 'domains' as AdminTab, label: 'Custom Subdomains & DNS', icon: Globe },
    { id: 'settings' as AdminTab, label: 'OTP & Auth Settings', icon: Settings },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 sticky top-16 z-30 shadow-md text-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        <nav className="flex items-center justify-start gap-1 sm:gap-2 py-2 overflow-x-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'verification' && activeTab === 'employers');
            return (
              <button
                key={item.id}
                id={`admin-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="tracking-tight">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="px-1.5 py-0.2 bg-red-500 text-white text-[9px] font-black rounded-full">
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
