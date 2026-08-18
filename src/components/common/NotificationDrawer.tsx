import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, X, Briefcase, GraduationCap, Calendar, ShieldAlert, Building2, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { NotificationItem } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onNavigateTab }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifs();
    }
  }, [isOpen, user]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingle = async (n: NotificationItem) => {
    try {
      if (!n.isRead) {
        await api.markNotificationRead(n.id);
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
      }
      if (n.type === 'govt_job' && onNavigateTab) {
        onNavigateTab('govt-jobs');
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'govt_job':
        return <Building2 className="w-4 h-4 text-amber-600" />;
      case 'job':
        return <Briefcase className="w-4 h-4 text-teal-600" />;
      case 'interview':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'learning':
      case 'certificate':
        return <GraduationCap className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* Top bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              {language === 'hi' ? 'सूचनाएं एवं अलर्ट' : 'Notifications & Alerts'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-teal-50"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'hi' ? 'सभी पढ़ें' : 'Mark all read'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p className="text-xs font-medium">
                {language === 'hi' ? 'कोई नई सूचना नहीं है' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleMarkSingle(n)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  n.type === 'govt_job'
                    ? (n.isRead ? 'bg-amber-50/30 border-amber-200/60' : 'bg-gradient-to-r from-amber-50/90 to-orange-50/80 border-amber-300 text-slate-900 shadow-xs')
                    : (n.isRead ? 'bg-white border-slate-100 text-slate-600' : 'bg-teal-50/60 border-teal-200 text-slate-800 shadow-xs')
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${n.type === 'govt_job' ? 'bg-amber-100' : 'bg-teal-100/70'}`}>
                      {getNotifIcon(n.type)}
                    </div>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-teal-600 inline-block"></span>}
                      {language === 'hi' && n.titleHi ? n.titleHi : n.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed pl-8">
                  {language === 'hi' && n.messageHi ? n.messageHi : n.message}
                </p>
                {n.type === 'govt_job' && (
                  <div className="mt-2 pl-8 flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-900">
                    <span>{language === 'hi' ? 'भर्ती विवरण व आवेदन देखें' : 'View Vacancy & Apply'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
