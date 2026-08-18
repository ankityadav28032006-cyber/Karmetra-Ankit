import React, { useEffect, useState } from 'react';
import { 
  Briefcase, 
  GraduationCap, 
  Video, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  PlayCircle, 
  ExternalLink, 
  UserCheck, 
  ChevronRight, 
  BookOpen, 
  Award, 
  MapPin, 
  IndianRupee, 
  TrendingUp, 
  ShieldCheck, 
  FileCheck,
  AlertCircle,
  RefreshCw,
  Eye,
  Filter,
  Bell,
  Sliders,
  Bookmark,
  Send,
  Zap,
  PieChart as ChartIcon
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { govtJobService } from '../../services/govtJobService';
import { JobApplication, Course, Interview, JobPost, GovernmentVacancy, MatchedGovtVacancy, MatchedGovtJobsResponse } from '../../types';
import { GovernmentJobDetailModal } from './GovernmentJobDetailModal';
import { GovtJobAlertsModal } from './GovtJobAlertsModal';

interface CandidateDashboardProps {
  onNavigate: (tab: 'home' | 'dashboard' | 'jobs' | 'govt-jobs' | 'learning' | 'applications' | 'profile' | 'resume') => void;
  onSelectJob: (job: JobPost) => void;
  onSelectCourse: (course: Course) => void;
  onJoinInterview: (interview: Interview) => void;
  onOpenLogin: () => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  onNavigate,
  onSelectJob,
  onSelectCourse,
  onJoinInterview,
  onOpenLogin
}) => {
  const { user, candidateProfile, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [jobsMap, setJobsMap] = useState<Record<string, JobPost>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'govt_jobs' | 'jobs' | 'courses' | 'interviews'>('all');

  // State-based Government Vacancy Cross-Referencing State
  const [matchedGovtData, setMatchedGovtData] = useState<MatchedGovtJobsResponse | null>(null);
  const [loadingGovtMatches, setLoadingGovtMatches] = useState(false);
  const [savedGovtJobIds, setSavedGovtJobIds] = useState<Set<string>>(new Set());
  const [selectedGovtVacancy, setSelectedGovtVacancy] = useState<GovernmentVacancy | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [govtSubFilter, setGovtSubFilter] = useState<'all' | 'state' | 'central' | 'closing_soon' | 'high_match'>('all');
  const [scanningAlerts, setScanningAlerts] = useState(false);
  const [scanAlertNotice, setScanAlertNotice] = useState<string | null>(null);

  const token = localStorage.getItem('km_auth_token') || '';

  const fetchData = async () => {
    try {
      if (isAuthenticated && user?.role === 'candidate') {
        const [appsRes, coursesRes, intsRes, jobsRes, govtMatchRes, savedGovtRes] = await Promise.all([
          api.getCandidateApplications().catch(() => ({ applications: [] })),
          api.getCandidateCourses().catch(() => ({ courses: [] })),
          api.getCandidateInterviews().catch(() => ({ interviews: [] })),
          api.getJobs({ limit: 50 }).catch(() => ({ jobs: [] })),
          token ? govtJobService.getMatchedGovtJobs(token).catch(() => null) : Promise.resolve(null),
          token ? govtJobService.getSavedGovtJobs(token).catch(() => ({ savedVacancies: [], savedIds: [] })) : Promise.resolve({ savedVacancies: [], savedIds: [] })
        ]);

        setApplications(appsRes.applications || []);
        setCourses(coursesRes.courses || []);
        setInterviews(intsRes.interviews || []);
        if (govtMatchRes) {
          setMatchedGovtData(govtMatchRes);
        }
        if (savedGovtRes?.savedIds) {
          setSavedGovtJobIds(new Set(savedGovtRes.savedIds));
        }

        const map: Record<string, JobPost> = {};
        (jobsRes.jobs || []).forEach((j: JobPost) => {
          map[j.id] = j;
        });
        setJobsMap(map);
      } else {
        // Fallback for public demo
        const [coursesRes, jobsRes, rawGovtJobs] = await Promise.all([
          api.getCourses({ limit: 6 }).catch(() => ({ courses: [] })),
          api.getJobs({ limit: 6 }).catch(() => ({ jobs: [] })),
          govtJobService.getGovtJobs().catch(() => [])
        ]);
        setCourses(coursesRes.courses || []);
        const map: Record<string, JobPost> = {};
        (jobsRes.jobs || []).forEach((j: JobPost) => {
          map[j.id] = j;
        });
        setJobsMap(map);

        if (rawGovtJobs.length > 0) {
          const demoMatches: MatchedGovtVacancy[] = rawGovtJobs.slice(0, 8).map((v, idx) => ({
            vacancy: v,
            matchScore: Math.max(70, 98 - idx * 4),
            matchReasons: [
              v.state.toLowerCase() === 'all india' ? 'Pan-India Vacancy' : `State Match: ${v.state}`,
              `Qualification: ${v.minEducation}`,
              `Sector: ${v.jobType}`
            ],
            isStateMatch: true,
            isEducationMatch: true,
            isDepartmentMatch: true,
            isClosingSoon: idx % 3 === 0,
            daysLeft: 12 + idx * 3
          }));

          setMatchedGovtData({
            success: true,
            matchedVacancies: demoMatches,
            stats: {
              totalMatched: demoMatches.length,
              stateSpecificCount: demoMatches.filter(m => m.vacancy.state.toLowerCase() !== 'all india').length,
              centralCount: demoMatches.filter(m => m.vacancy.state.toLowerCase() === 'all india').length,
              closingSoonCount: demoMatches.filter(m => m.isClosingSoon).length,
              userPreferences: {
                states: ['Maharashtra', 'All India'],
                educationLevels: ['Graduate (BA/B.Sc/B.Com)', '12th Pass'],
                departments: ['Central', 'State', 'Police Bharti', 'Railway'],
                inferredState: 'Maharashtra',
                inferredEducation: 'Graduate',
                alertEnabled: true
              }
            },
            unreadAlertCount: 2
          });
        }
      }
    } catch (err) {
      console.error('Failed to load candidate dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [isAuthenticated]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleToggleSaveGovtJob = async (vacancyId: string) => {
    if (!isAuthenticated) {
      onOpenLogin();
      return;
    }
    try {
      const res = await govtJobService.toggleSaveGovtJob(vacancyId, token);
      setSavedGovtJobIds(prev => {
        const next = new Set(prev);
        if (res.saved) {
          next.add(vacancyId);
        } else {
          next.delete(vacancyId);
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to save govt job:', err);
    }
  };

  const handleTriggerLiveScan = async () => {
    if (!isAuthenticated) {
      onOpenLogin();
      return;
    }
    setScanningAlerts(true);
    setScanAlertNotice(null);
    try {
      const res = await govtJobService.triggerGovtAlertScan(token);
      if (res && res.success) {
        setScanAlertNotice(
          language === 'hi'
            ? `स्कैन पूरा हुआ! ${res.createdCount > 0 ? `${res.createdCount} नए भर्ती अलर्ट भेजे गए।` : 'सभी सक्रिय भर्तियां पहले से अद्यतित हैं।'}`
            : `Scan complete! ${res.createdCount > 0 ? `Sent ${res.createdCount} new vacancy alerts to your inbox.` : 'All matching vacancies are up to date.'}`
        );
        fetchData();
      }
    } catch (err) {
      setScanAlertNotice('Scan failed. Please try again.');
    } finally {
      setScanningAlerts(false);
      setTimeout(() => setScanAlertNotice(null), 5000);
    }
  };

  // Filter in-progress or enrolled courses
  const inProgressCourses = courses.filter(c => {
    if (c.progress) {
      return !c.progress.isCompleted;
    }
    return false;
  });

  // If no enrolled courses yet, show first few featured courses as starter recommendations
  const displayCourses = inProgressCourses.length > 0 ? inProgressCourses : courses.slice(0, 3);

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Shortlisted':
      case 'Selected':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
      case 'Interview Scheduled':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'Under Review':
        return 'bg-amber-500/10 text-amber-700 border-amber-200';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-700 border-rose-200';
      default:
        return 'bg-teal-500/10 text-teal-700 border-teal-200';
    }
  };

  // Overall course completion calculations for Recharts Donut
  let totalLessonsSum = 0;
  let completedLessonsSum = 0;

  displayCourses.forEach(c => {
    const completed = c.progress?.completedLessonIds?.length || 0;
    const total = c.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 6;
    completedLessonsSum += completed;
    totalLessonsSum += total;
  });

  const overallCompletionRate = totalLessonsSum > 0
    ? Math.round((completedLessonsSum / totalLessonsSum) * 100)
    : (courses.length > 0 ? 35 : 0);

  const donutChartData = [
    {
      name: language === 'hi' ? 'पूर्ण किए गए पाठ' : 'Completed Lessons',
      value: completedLessonsSum > 0 ? completedLessonsSum : (overallCompletionRate > 0 ? overallCompletionRate : 1),
      color: '#10b981'
    },
    {
      name: language === 'hi' ? 'शेष पाठ' : 'Remaining Lessons',
      value: Math.max(0, (totalLessonsSum > 0 ? (totalLessonsSum - completedLessonsSum) : (100 - overallCompletionRate))),
      color: '#e2e8f0'
    }
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* ========================================================================= */}
      {/* DASHBOARD HEADER & WELCOME CARD */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        {/* Background decorative subtle circles */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-300" />
                {language === 'hi' ? 'अभ्यर्थी डैशबोर्ड' : 'Candidate Dashboard'}
              </span>
              {isAuthenticated && candidateProfile?.isProfileComplete && (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {language === 'hi' ? 'सत्यापित प्रोफ़ाइल' : 'Verified Profile'}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              {language === 'hi' ? 'नमस्ते,' : 'Welcome back,'}{' '}
              <span className="text-teal-400">
                {candidateProfile?.fullName || user?.fullName || (language === 'hi' ? 'अभ्यर्थी' : 'Candidate')}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              {language === 'hi'
                ? 'आपके सभी सक्रिय आवेदन, आगामी गूगल मीट इंटरव्यू और चल रहे कौशल पाठ्यक्रमों का त्वरित सारांश।'
                : 'Your live snapshot of active job applications, upcoming interview schedules, and enrolled skill courses.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
              <span className="hidden sm:inline">{language === 'hi' ? 'ताज़ा करें' : 'Refresh'}</span>
            </button>

            {!isAuthenticated ? (
              <button
                onClick={onOpenLogin}
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
              >
                <span>{language === 'hi' ? 'लॉगिन करें' : 'Sign In / Register'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onNavigate('jobs')}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
              >
                <Briefcase className="w-4 h-4" />
                <span>{language === 'hi' ? 'नई नौकरियां खोजें' : 'Explore Openings'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
          {/* Card 1: Matched Govt Jobs (High Priority) */}
          <div 
            onClick={() => setActiveFilter('govt_jobs')}
            className={`border p-4 rounded-2xl transition-all cursor-pointer group ${
              activeFilter === 'govt_jobs'
                ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/30'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {language === 'hi' ? 'सुमेलित सरकारी भर्ती' : 'Matched Govt Jobs'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{matchedGovtData?.stats.totalMatched || 0}</span>
              <span className="text-[11px] text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                {matchedGovtData?.stats.stateSpecificCount || 0} {language === 'hi' ? 'राज्य में' : 'in State'}
              </span>
            </div>
            <div className="mt-2 flex items-center text-[10px] text-amber-300/80 group-hover:text-amber-200 transition-colors">
              <span>{language === 'hi' ? 'राज्यवार अलर्ट देखें' : 'View matched state alerts'}</span>
              <ChevronRight className="w-3 h-3 ml-0.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Applied Jobs */}
          <div 
            onClick={() => setActiveFilter('jobs')}
            className={`border p-4 rounded-2xl transition-all cursor-pointer group ${
              activeFilter === 'jobs'
                ? 'bg-teal-950/40 border-teal-500 shadow-lg shadow-teal-950/30'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-teal-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">
                {language === 'hi' ? 'कुल आवेदन' : 'Applied Jobs'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{applications.length}</span>
              <span className="text-[11px] text-teal-400 font-medium">
                {applications.filter(a => a.status === 'Shortlisted').length} {language === 'hi' ? 'शॉर्टलिस्ट' : 'Shortlisted'}
              </span>
            </div>
            <div className="mt-2 flex items-center text-[10px] text-slate-400 group-hover:text-teal-300 transition-colors">
              <span>{language === 'hi' ? 'आवेदन देखें' : 'View all applications'}</span>
              <ChevronRight className="w-3 h-3 ml-0.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: In-progress Courses */}
          <div 
            onClick={() => setActiveFilter('courses')}
            className={`border p-4 rounded-2xl transition-all cursor-pointer group ${
              activeFilter === 'courses'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/30'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">
                {language === 'hi' ? 'कौशल पाठ्यक्रम' : 'In-progress Courses'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{inProgressCourses.length || courses.length}</span>
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                {overallCompletionRate}% {language === 'hi' ? 'पूर्ण' : 'Avg Progress'}
              </span>
            </div>
            <div className="mt-2 flex items-center text-[10px] text-slate-400 group-hover:text-emerald-300 transition-colors">
              <span>{language === 'hi' ? 'सीखना जारी रखें' : 'Continue learning'}</span>
              <ChevronRight className="w-3 h-3 ml-0.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Upcoming Interviews */}
          <div 
            onClick={() => setActiveFilter('interviews')}
            className={`border p-4 rounded-2xl transition-all cursor-pointer group ${
              activeFilter === 'interviews'
                ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-950/30'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-blue-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">
                {language === 'hi' ? 'आगामी इंटरव्यू' : 'Upcoming Interviews'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{interviews.length}</span>
              <span className="text-[11px] text-blue-400 font-medium">
                {language === 'hi' ? 'गूगल मीट तैयार' : 'Google Meet Ready'}
              </span>
            </div>
            <div className="mt-2 flex items-center text-[10px] text-slate-400 group-hover:text-blue-300 transition-colors">
              <span>{language === 'hi' ? 'शेड्यूल देखें' : 'View interview schedule'}</span>
              <ChevronRight className="w-3 h-3 ml-0.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* State-Based Alert Banner */}
      {matchedGovtData && matchedGovtData.matchedVacancies.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-teal-500/10 border border-amber-300/80 rounded-3xl p-5 shadow-sm text-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  {language === 'hi' ? 'राज्य स्तरीय सरकारी भर्ती अलर्ट सक्रिय' : 'State Government Job Alert Engine Active'}
                </h3>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full border border-amber-300">
                  {matchedGovtData.stats.totalMatched} {language === 'hi' ? 'सुमेलित रिक्तियां' : 'Matched Vacancies'}
                </span>
                {matchedGovtData.stats.closingSoonCount > 0 && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full border border-rose-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {matchedGovtData.stats.closingSoonCount} {language === 'hi' ? 'जल्द समाप्त' : 'Closing Soon'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                {language === 'hi'
                  ? `आपकी प्राथमिकताओं के आधार पर: राज्य (${matchedGovtData.stats.userPreferences.states.join(', ')}), योग्यता (${matchedGovtData.stats.userPreferences.educationLevels[0] || '12th/Graduate'}) एवं विभागों के अनुरूप सरकारी नौकरियां छांटी गई हैं।`
                  : `Cross-referenced against your target state (${matchedGovtData.stats.userPreferences.states.join(', ')}), qualification (${matchedGovtData.stats.userPreferences.educationLevels[0] || 'Graduate'}), and active vacancy database.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
            <button
              onClick={handleTriggerLiveScan}
              disabled={scanningAlerts}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102"
              title="Scan and dispatch notifications"
            >
              <Send className={`w-3.5 h-3.5 text-amber-600 ${scanningAlerts ? 'animate-spin' : ''}`} />
              <span>{scanningAlerts ? (language === 'hi' ? 'स्कैन हो रहा है...' : 'Scanning...') : (language === 'hi' ? 'अलर्ट स्कैन करें' : 'Scan & Notify')}</span>
            </button>

            <button
              onClick={() => setIsAlertModalOpen(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'अलर्ट प्राथमिकताएं बदलें' : 'Edit Criteria'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Notice feedback from scan */}
      {scanAlertNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{scanAlertNotice}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeFilter === 'all'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {language === 'hi' ? 'सभी सारांश' : 'All Sections'}
        </button>
        <button
          onClick={() => setActiveFilter('govt_jobs')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeFilter === 'govt_jobs'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-amber-700" />
          <span>{language === 'hi' ? 'सरकारी भर्ती अलर्ट' : 'Govt Job Matches'} ({matchedGovtData?.matchedVacancies.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveFilter('jobs')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeFilter === 'jobs'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'निजी नौकरी आवेदन' : 'Applied Jobs'} ({applications.length})</span>
        </button>
        <button
          onClick={() => setActiveFilter('courses')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeFilter === 'courses'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'पाठ्यक्रम' : 'In-progress Courses'} ({inProgressCourses.length || courses.length})</span>
        </button>
        <button
          onClick={() => setActiveFilter('interviews')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeFilter === 'interviews'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'इंटरव्यू' : 'Upcoming Interviews'} ({interviews.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: STATE GOVERNMENT JOB ALERTS & VACANCIES */}
      {/* ========================================================================= */}
      {(activeFilter === 'all' || activeFilter === 'govt_jobs') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">
                    {language === 'hi' ? 'राज्यवार सरकारी भर्ती अलर्ट एवं रिक्तियां' : 'State-wise Government Vacancies & Alerts'}
                  </h2>
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-[10px] font-bold">
                    {matchedGovtData?.matchedVacancies.length || 0} {language === 'hi' ? 'उपलब्ध' : 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {language === 'hi'
                    ? 'आपकी योग्यता, राज्य एवं विभाग प्राथमिकताओं के आधार पर ऑटो-क्रॉसरेफरेंस की गई भर्तियां'
                    : 'Personalized matching against your state, education degree, and preferred government departments'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => onNavigate('govt-jobs')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{language === 'hi' ? 'सभी सरकारी भर्तियां' : 'All Govt Jobs (16+)'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sub-filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setGovtSubFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                govtSubFilter === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {language === 'hi' ? 'सभी सुमेलित' : 'All Matched'} ({matchedGovtData?.matchedVacancies.length || 0})
            </button>
            <button
              onClick={() => setGovtSubFilter('state')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                govtSubFilter === 'state'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-3 h-3 text-amber-600" />
              <span>{matchedGovtData?.stats.userPreferences.states[0] || 'My State'} ({matchedGovtData?.stats.stateSpecificCount || 0})</span>
            </button>
            <button
              onClick={() => setGovtSubFilter('central')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                govtSubFilter === 'central'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3 h-3 text-blue-600" />
              <span>{language === 'hi' ? 'अखिल भारतीय / केंद्र' : 'Pan-India / Central'} ({matchedGovtData?.stats.centralCount || 0})</span>
            </button>
            <button
              onClick={() => setGovtSubFilter('closing_soon')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                govtSubFilter === 'closing_soon'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3 h-3 text-rose-500" />
              <span>{language === 'hi' ? 'जल्द समाप्त (<7 दिन)' : 'Closing Soon (<7 Days)'} ({matchedGovtData?.stats.closingSoonCount || 0})</span>
            </button>
            <button
              onClick={() => setGovtSubFilter('high_match')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                govtSubFilter === 'high_match'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-500" />
              <span>{language === 'hi' ? 'उच्च मिलान (85%+)' : 'Top Match (85%+)'}</span>
            </button>
          </div>

          {/* Matched Vacancies Grid */}
          {(() => {
            const list = (matchedGovtData?.matchedVacancies || []).filter(item => {
              if (govtSubFilter === 'state') {
                return item.isStateMatch && item.vacancy.state.toLowerCase() !== 'all india';
              }
              if (govtSubFilter === 'central') {
                return item.vacancy.state.toLowerCase() === 'all india';
              }
              if (govtSubFilter === 'closing_soon') {
                return item.isClosingSoon;
              }
              if (govtSubFilter === 'high_match') {
                return item.matchScore >= 85;
              }
              return true;
            });

            if (list.length === 0) {
              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">
                      {language === 'hi' ? 'इस फ़िल्टर में कोई भर्ती नहीं मिली' : 'No Vacancies Found in this Category'}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {language === 'hi'
                        ? 'अपनी प्राथमिकताओं को अपडेट करें या अन्य राज्यों और केंद्र स्तर की भर्तियां देखें।'
                        : 'Adjust your alert criteria or explore all available central and state recruitments.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setGovtSubFilter('all')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{language === 'hi' ? 'सभी सुमेलित देखें' : 'View All Matched'}</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {list.map(item => {
                  const v = item.vacancy;
                  const isSaved = savedGovtJobIds.has(v.id);
                  return (
                    <div
                      key={v.id}
                      className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div>
                        {/* Top Score and State Badges */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-emerald-600 fill-emerald-500" />
                              <span>{item.matchScore}% Match</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {v.state}
                            </span>
                          </div>

                          <button
                            onClick={() => handleToggleSaveGovtJob(v.id)}
                            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                              isSaved
                                ? 'bg-amber-50 border-amber-300 text-amber-700'
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-amber-600'
                            }`}
                            title={isSaved ? 'Saved' : 'Save vacancy'}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-600' : ''}`} />
                          </button>
                        </div>

                        {/* Title & Department */}
                        <h3 
                          onClick={() => setSelectedGovtVacancy(v)}
                          className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition-colors line-clamp-2 cursor-pointer"
                        >
                          {language === 'hi' && v.titleHi ? v.titleHi : v.title}
                        </h3>

                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{language === 'hi' && v.departmentHi ? v.departmentHi : v.department}</span>
                        </div>

                        {/* Match Reason Chips */}
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {item.matchReasons.slice(0, 3).map((reason, rIdx) => (
                            <span
                              key={rIdx}
                              className="px-2 py-0.5 bg-amber-50/80 text-amber-900 border border-amber-200/70 rounded-md text-[10px] font-medium truncate"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>

                        {/* Vacancy Key Details Box */}
                        <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block">{language === 'hi' ? 'कुल पद' : 'Total Vacancies'}</span>
                            <span className="font-extrabold text-slate-900">{v.totalVacancies.toLocaleString('en-IN')} Posts</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">{language === 'hi' ? 'वेतनमान' : 'Pay Scale'}</span>
                            <span className="font-semibold text-emerald-700 truncate block">{v.salary.split('(')[0]}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">{language === 'hi' ? 'न्यूनतम योग्यता' : 'Min Education'}</span>
                            <span className="font-medium text-slate-700 truncate block">{v.minEducation}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">{language === 'hi' ? 'अंतिम तिथि' : 'Last Date'}</span>
                            <span className={`font-bold block ${item.isClosingSoon ? 'text-rose-600' : 'text-slate-700'}`}>
                              {new Date(v.applicationLastDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedGovtVacancy(v)}
                          className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{language === 'hi' ? 'संपूर्ण विवरण' : 'View Details'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={v.officialApplyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <span>{language === 'hi' ? 'आवेदन पोर्टल' : 'Apply'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: APPLIED JOBS SUMMARY */}
      {/* ========================================================================= */}
      {(activeFilter === 'all' || activeFilter === 'jobs') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {language === 'hi' ? 'आवेदन की गई नौकरियां' : 'Applied Jobs'}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'hi'
                    ? 'आपके नवीनतम आवेदन और उनका लाइव भर्ती स्टेटस'
                    : 'Summary cards of your active applications and hiring pipelines'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('applications')}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>{language === 'hi' ? 'सभी देखें' : 'View All'} ({applications.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  {language === 'hi' ? 'कोई सक्रिय आवेदन नहीं मिला' : 'No Job Applications Yet'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {language === 'hi'
                    ? 'हजारों सत्यापित नियोक्ताओं से जुड़ें और 1-क्लिक में नौकरी के लिए आवेदन करें।'
                    : 'Discover verified jobs across IT, Business, and Operations and apply with one click.'}
                </p>
              </div>
              <button
                onClick={() => onNavigate('jobs')}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'नौकरियां खोजें' : 'Browse Openings'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {applications.slice(0, 6).map(app => {
                const job = jobsMap[app.jobId];
                return (
                  <div
                    key={app.id}
                    className="bg-white border border-slate-200 hover:border-teal-400 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div>
                      {/* Top status line */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(app.status)}`}>
                          {app.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(app.appliedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      {/* Job Title & Employer */}
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors line-clamp-1">
                        {app.jobTitle || job?.title || 'Position'}
                      </h3>

                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold truncate">{app.companyName || job?.companyName || 'Verified Employer'}</span>
                      </div>

                      {/* Quick Location & Salary */}
                      <div className="grid grid-cols-2 gap-2 mt-2.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                          <span className="truncate">{job?.locationCity || 'India'}</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-slate-700 truncate">
                          <IndianRupee className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>
                            {job ? `₹${(job.salaryMin / 100000).toFixed(1)}L - ${(job.salaryMax / 100000).toFixed(1)}L` : 'Negotiable'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{app.id.slice(-6).toUpperCase()}
                      </span>
                      <button
                        onClick={() => onNavigate('applications')}
                        className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>{language === 'hi' ? 'विवरण' : 'Track Status'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: IN-PROGRESS COURSES SUMMARY */}
      {/* ========================================================================= */}
      {(activeFilter === 'all' || activeFilter === 'courses') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {language === 'hi' ? 'चल रहे कौशल पाठ्यक्रम' : 'In-progress Courses'}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'hi'
                    ? 'अपने कौशल को बढ़ाएं और सरकारी/उद्योग-सत्यापित प्रमाणपत्र प्राप्त करें'
                    : 'Upskill with modular curriculum, quizzes, and verified certification'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('learning')}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>{language === 'hi' ? 'LMS लाइब्रेरी' : 'Explore All (59+)'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Recharts Donut Progress Summary Box */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-5 border border-emerald-500/20 shadow-md flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-5 w-full md:w-auto">
              {/* Donut Chart Container */}
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={50}
                      paddingAngle={3}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {donutChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="bg-slate-900 text-white text-[11px] p-2 rounded-lg border border-slate-700 shadow-lg">
                              <p className="font-bold">{data.name}</p>
                              <p className="text-emerald-400 font-semibold">{data.value} {language === 'hi' ? 'पाठ' : 'units'}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Percentage Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-black text-white leading-none">
                    {overallCompletionRate}%
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
                    {language === 'hi' ? 'पूर्ण' : 'Done'}
                  </span>
                </div>
              </div>

              {/* Progress Detail Metrics */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <ChartIcon className="w-3 h-3" />
                    {language === 'hi' ? 'कौशल प्रगति विश्लेषण' : 'Course Progress Analytics'}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-black text-white">
                  {language === 'hi' ? 'पाठ्यक्रम पूर्णता दर' : 'Overall Completion Rate'}
                </h3>

                <p className="text-xs text-slate-300">
                  {completedLessonsSum > 0
                    ? `${completedLessonsSum} of ${totalLessonsSum} ${language === 'hi' ? 'पाठ सफलतापूर्वक पूर्ण हुए' : 'lessons completed across enrolled tracks'}`
                    : (language === 'hi' ? 'सक्रिय पाठ्यक्रमों में सीखना जारी रखें और प्रमाणपत्र अनलॉक करें।' : 'Active modules enrolled with verified certificate criteria.')}
                </p>

                <div className="flex items-center gap-3 pt-1 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{language === 'hi' ? 'पूर्ण' : 'Completed'}: {completedLessonsSum || (overallCompletionRate > 0 ? `${overallCompletionRate}%` : '0')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                    <span>{language === 'hi' ? 'शेष' : 'Remaining'}: {Math.max(0, totalLessonsSum - completedLessonsSum) || (100 - overallCompletionRate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Action CTA */}
            <div className="w-full md:w-auto flex md:flex-col items-center sm:justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-700/80 pt-3 md:pt-0 md:pl-5">
              <button
                onClick={() => onNavigate('learning')}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer whitespace-nowrap"
              >
                <PlayCircle className="w-4 h-4" />
                <span>{language === 'hi' ? 'कौशल कक्षाएं जारी रखें' : 'Continue Courses'}</span>
              </button>

              <span className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                <Award className="w-3 h-3 text-amber-400" />
                <span>{language === 'hi' ? 'सरकारी व कॉर्पोरेट मान्यता' : 'Verified Certificates'}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayCourses.map(course => {
              const completedLessons = course.progress?.completedLessonIds?.length || 0;
              const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 6;
              const progressPct = Math.min(100, Math.round((completedLessons / (totalLessons || 1)) * 100));

              // Mini donut data for this individual course card
              const courseDonutData = [
                { name: 'Completed', value: progressPct > 0 ? progressPct : 15, color: '#10b981' },
                { name: 'Remaining', value: 100 - (progressPct > 0 ? progressPct : 15), color: '#e2e8f0' }
              ];

              return (
                <div
                  key={course.id}
                  className="bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2.5">
                    {/* Thumbnail & Category */}
                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center">
                      <img
                        src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60'}
                        alt={course.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
                        {course.category}
                      </span>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-600/90 text-white text-[10px] font-bold rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.durationHours}h
                      </span>
                    </div>

                    {/* Course Title */}
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {language === 'hi' && course.titleHi ? course.titleHi : course.title}
                    </h3>

                    {/* Mini Donut & Progress Section */}
                    <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={courseDonutData}
                              cx="50%"
                              cy="50%"
                              innerRadius={13}
                              outerRadius={19}
                              paddingAngle={2}
                              dataKey="value"
                              startAngle={90}
                              endAngle={-270}
                              stroke="none"
                            >
                              {courseDonutData.map((entry, index) => (
                                <Cell key={`card-cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-[9px] font-black text-slate-800">
                            {progressPct > 0 ? `${progressPct}%` : '0%'}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 font-medium">
                            {language === 'hi' ? 'मॉड्यूल प्रगति' : 'Course Progress'}
                          </span>
                          <span className="font-bold text-emerald-700">
                            {progressPct > 0 ? `${progressPct}%` : (language === 'hi' ? 'शुरू करें' : 'Enrolled')}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct > 0 ? progressPct : 15}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer CTA */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>{course.passingPercentage}% to pass</span>
                    </span>
                    <button
                      onClick={() => {
                        onSelectCourse(course);
                        onNavigate('learning');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'पढ़ना शुरू करें' : 'Resume'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: UPCOMING INTERVIEWS SUMMARY */}
      {/* ========================================================================= */}
      {(activeFilter === 'all' || activeFilter === 'interviews') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {language === 'hi' ? 'आगामी इंटरव्यू' : 'Upcoming Interviews'}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'hi'
                    ? 'नियोक्ताओं के साथ निर्धारित गूगल मीट और फेस-टू-फेस साक्षात्कार'
                    : 'Scheduled Google Meet sessions and recruiter interview slots'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('applications')}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>{language === 'hi' ? 'पूरा शेड्यूल' : 'Full Schedule'} ({interviews.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {interviews.length === 0 ? (
            <div className="bg-gradient-to-r from-blue-50/50 to-teal-50/50 border border-blue-100 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 mx-auto flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  {language === 'hi' ? 'कोई आगामी इंटरव्यू निर्धारित नहीं है' : 'No Upcoming Interviews Scheduled'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {language === 'hi'
                    ? 'जब कोई नियोक्ता आपके आवेदन को शॉर्टलिस्ट करेगा, तो आपका गूगल मीट इंटरव्यू लिंक यहाँ दिखाई देगा।'
                    : 'When recruiters shortlist your profile, scheduled Google Meet calls and calendar invites will appear right here.'}
                </p>
              </div>
              <button
                onClick={() => onNavigate('jobs')}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'नौकरियों में आवेदन करें' : 'Apply to More Jobs'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {interviews.map(interview => (
                <div
                  key={interview.id}
                  className="bg-white border border-blue-200 hover:border-blue-400 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2.5">
                    {/* Header Type & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                        <Video className="w-3 h-3 text-blue-600" />
                        {interview.interviewType || 'Google Meet'}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                        {interview.status}
                      </span>
                    </div>

                    {/* Role & Company */}
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors line-clamp-1">
                        {interview.jobTitle}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold truncate">{interview.companyName}</span>
                      </div>
                    </div>

                    {/* Date and Interviewer info */}
                    <div className="space-y-1.5 bg-blue-50/40 p-2.5 rounded-xl border border-blue-100/80 text-xs text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <strong className="font-semibold text-slate-900">
                          {new Date(interview.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <UserCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{interview.interviewerName || 'Hiring Manager'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Join Action */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onJoinInterview(interview)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'गूगल मीट में शामिल हों' : 'Join Google Meet Call'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Government Job Detail Modal */}
      {selectedGovtVacancy && (
        <GovernmentJobDetailModal
          vacancy={selectedGovtVacancy}
          isSaved={savedGovtJobIds.has(selectedGovtVacancy.id)}
          onToggleSave={(id) => handleToggleSaveGovtJob(id)}
          onClose={() => setSelectedGovtVacancy(null)}
        />
      )}

      {/* Government Job Alert Preferences Configuration Modal */}
      {isAlertModalOpen && (
        <GovtJobAlertsModal
          onClose={() => setIsAlertModalOpen(false)}
          onSaved={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
};
