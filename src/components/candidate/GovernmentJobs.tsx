import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Bookmark, 
  Bell, 
  Filter, 
  GraduationCap, 
  DollarSign, 
  Users, 
  Sparkles, 
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { GovernmentVacancy } from '../../types';
import { govtJobService } from '../../services/govtJobService';
import { useAuth } from '../../context/AuthContext';
import { GovernmentJobDetailModal } from './GovernmentJobDetailModal';
import { GovtJobAlertsModal } from './GovtJobAlertsModal';

const POPULAR_STATES = [
  'All',
  'All India',
  'Uttar Pradesh',
  'Maharashtra',
  'Bihar',
  'Rajasthan',
  'Karnataka',
  'Delhi NCR',
  'Madhya Pradesh',
  'Tamil Nadu',
  'West Bengal'
];

const JOB_TYPES = [
  'All',
  'Central',
  'State',
  'Railway',
  'Defense',
  'Banking',
  'Healthcare',
  'PSU',
  'Teaching'
];

export const GovernmentJobs: React.FC = () => {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState<GovernmentVacancy[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedEducation, setSelectedEducation] = useState<string>('All');
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);
  const [selectedVacancy, setSelectedVacancy] = useState<GovernmentVacancy | null>(null);
  const [showAlertsModal, setShowAlertsModal] = useState<boolean>(false);

  const token = localStorage.getItem('km_auth_token') || '';

  const loadVacancies = async () => {
    setLoading(true);
    try {
      const data = await govtJobService.getGovtJobs({
        state: selectedState,
        jobType: selectedType,
        minEducation: selectedEducation,
        search: searchTerm
      });
      setVacancies(data);

      if (token && user) {
        const savedData = await govtJobService.getSavedGovtJobs(token);
        setSavedIds(savedData.savedIds || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVacancies();
  }, [selectedState, selectedType, selectedEducation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadVacancies();
  };

  const handleToggleSave = async (id: string) => {
    if (!token) {
      alert('Please log in as candidate to bookmark government jobs.');
      return;
    }
    try {
      const res = await govtJobService.toggleSaveGovtJob(id, token);
      if (res.saved) {
        setSavedIds(prev => [...prev, id]);
      } else {
        setSavedIds(prev => prev.filter(item => item !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredList = vacancies.filter(v => {
    if (showSavedOnly && !savedIds.includes(v.id)) return false;
    return true;
  });

  const totalPostsCount = vacancies.reduce((acc, v) => acc + (v.totalVacancies || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Hero */}
      <div className="bg-gradient-to-br from-[#082142] to-[#0d3463] text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Building2 className="w-3 h-3 text-amber-400" />
                Verified Public Recruitment
              </span>
              <span className="text-xs font-bold text-teal-300">
                {totalPostsCount.toLocaleString()} Total Active Openings
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Government Job Vacancies & Sarkari Naukri
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore state-wise verified government job notifications across Central, State, Railways, Defense, Healthcare, and Banking with direct official application portals.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setShowAlertsModal(true)}
              className="flex-1 md:flex-none px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span>Get Job Alerts</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Transparency Disclaimer Banner */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900">Official Portal Redirection:</span>
          <p className="text-[11px] leading-relaxed">
            KarMetra connects job seekers directly to official Government Department & Commission recruitment portals. All applications and fee submissions occur directly on authorized Government servers.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search government post, department, AIIMS, Railway, SSC, Police..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600 font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors cursor-pointer"
          >
            Search Vacancies
          </button>
        </form>

        {/* State Filter Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              Filter by State / Region
            </span>

            {user && (
              <button
                type="button"
                onClick={() => setShowSavedOnly(!showSavedOnly)}
                className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1 rounded-xl border transition-all cursor-pointer ${
                  showSavedOnly
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${showSavedOnly ? 'fill-amber-500' : ''}`} />
                <span>Saved Jobs ({savedIds.length})</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {POPULAR_STATES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedState(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedState === s
                    ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Sector Type Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Sector:</span>
          {JOB_TYPES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                selectedType === t
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Vacancy Cards List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Fetching latest verified government openings...</span>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-bold text-slate-600">No Government Vacancies Found</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting your state or sector filters to view all listings.</p>
          <button
            onClick={() => { setSelectedState('All'); setSelectedType('All'); setSearchTerm(''); setShowSavedOnly(false); }}
            className="mt-4 px-4 py-2 bg-teal-50 text-teal-700 font-bold text-xs rounded-xl border border-teal-200"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((v) => {
            const isSaved = savedIds.includes(v.id);
            return (
              <div
                key={v.id}
                className="bg-white border border-slate-200 hover:border-teal-300 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all group"
              >
                <div className="flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      v.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : v.status === 'Upcoming'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      ● {v.status}
                    </span>

                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-200">
                      {v.jobType}
                    </span>

                    <span className="bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-600" />
                      {v.state}
                    </span>

                    <span className="text-[11px] font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {v.totalVacancies.toLocaleString()} Posts
                    </span>
                  </div>

                  <div>
                    <h3 
                      onClick={() => setSelectedVacancy(v)}
                      className="text-base sm:text-lg font-black text-slate-900 group-hover:text-teal-700 transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <span>{v.title}</span>
                      {v.titleHi && <span className="text-xs font-normal text-slate-500 hidden sm:inline">({v.titleHi})</span>}
                    </h3>

                    <p className="text-xs font-bold text-teal-800 mt-0.5">
                      {v.department} {v.organization && `• ${v.organization}`}
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Eligibility</span>
                      <span className="font-semibold text-slate-800 line-clamp-1">{v.qualificationRequired}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Age Limit</span>
                      <span className="font-semibold text-slate-800 line-clamp-1">{v.ageLimit || 'Standard'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Pay Scale</span>
                      <span className="font-semibold text-slate-800 line-clamp-1">{v.salaryScale || 'Standard Pay'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Application Deadline</span>
                      <span className="font-bold text-red-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {v.applicationLastDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Right */}
                <div className="flex flex-wrap md:flex-col items-stretch sm:items-center gap-2 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="flex items-center gap-2 w-full">
                    {user && (
                      <button
                        onClick={() => handleToggleSave(v.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSaved 
                            ? 'bg-amber-50 border-amber-300 text-amber-600' 
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
                        }`}
                        title={isSaved ? 'Remove Bookmark' : 'Save Vacancy'}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500' : ''}`} />
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedVacancy(v)}
                      className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <a
                    href={v.applyOnlineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Apply Online</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vacancy Detail Modal */}
      {selectedVacancy && (
        <GovernmentJobDetailModal
          vacancy={selectedVacancy}
          isSaved={savedIds.includes(selectedVacancy.id)}
          onToggleSave={user ? handleToggleSave : undefined}
          onClose={() => setSelectedVacancy(null)}
        />
      )}

      {/* Alert Preferences Modal */}
      {showAlertsModal && (
        <GovtJobAlertsModal onClose={() => setShowAlertsModal(false)} />
      )}
    </div>
  );
};
