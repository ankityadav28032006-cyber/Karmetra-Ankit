import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Bookmark, 
  BookmarkCheck, 
  Filter, 
  Building2, 
  CheckCircle2, 
  Send, 
  X, 
  Sparkles, 
  Navigation,
  ShieldCheck,
  Car,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';
import { api, apiClient } from '../../services/apiClient';
import { JobPost } from '../../types';

interface CandidateJobsProps {
  onOpenLogin: () => void;
  selectedJobInit?: JobPost | null;
}

export const CandidateJobs: React.FC<CandidateJobsProps> = ({ onOpenLogin, selectedJobInit = null }) => {
  const { user, candidateProfile, isAuthenticated } = useAuth();
  const { language } = useLanguage();

  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(selectedJobInit);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [viewOnlySaved, setViewOnlySaved] = useState(false);
  const [aiRecommendationsActive, setAiRecommendationsActive] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [radiusKm, setRadiusKm] = useState<number>(0);
  const [userCoords, setUserCoords] = useState<{ lat?: number; lng?: number }>({});

  // Route & Distance state for selected job
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationText: string; summary: string } | null>(null);

  // Application submission state
  const [isApplying, setIsApplying] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setAiRecommendationsActive(false);
    try {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (workMode) params.workMode = workMode;
      if (radiusKm > 0 && userCoords.lat && userCoords.lng) {
        params.radiusKm = radiusKm;
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
      }

      const res = await api.getJobs(params);
      setJobs(res.jobs || []);

      if (isAuthenticated) {
        const savedRes = await api.getSavedJobs().catch(() => ({ savedJobIds: [] }));
        setSavedJobIds(savedRes.savedJobIds || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIRecommendations = async () => {
    if (!isAuthenticated) {
      onOpenLogin();
      return;
    }
    setAiLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; recommendations: any[] }>('/candidate/recommended-jobs');
      if (res && res.recommendations && res.recommendations.length > 0) {
        const recommendedJobs = res.recommendations.map(r => ({
          ...r.job,
          aiScore: r.matchScore,
          matchReasons: r.matchReasons
        }));
        setJobs(recommendedJobs);
        setAiRecommendationsActive(true);
        if (recommendedJobs[0]) {
          setSelectedJob(recommendedJobs[0]);
        }
      } else {
        fetchJobs();
      }
    } catch (err) {
      console.error('Failed to load AI recommendations:', err);
      fetchJobs();
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [category, workMode, radiusKm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setRadiusKm(25); // default 25km radius
        },
        () => {
          if (candidateProfile?.latitude && candidateProfile?.longitude) {
            setUserCoords({ lat: candidateProfile.latitude, lng: candidateProfile.longitude });
            setRadiusKm(25);
          }
        }
      );
    }
  };

  // Calculate distance & route from candidate to selected job
  const handleCalculateDistance = async (job: JobPost) => {
    setCalculatingRoute(true);
    setRouteInfo(null);
    try {
      const originLat = userCoords.lat || candidateProfile?.latitude || 12.9716;
      const originLng = userCoords.lng || candidateProfile?.longitude || 77.5946;
      const destLat = job.latitude || (job.locationCity === 'Mumbai' ? 19.0760 : job.locationCity === 'Delhi' ? 28.6139 : 12.9716);
      const destLng = job.longitude || (job.locationCity === 'Mumbai' ? 72.8777 : job.locationCity === 'Delhi' ? 77.2090 : 77.5946);

      const res = await apiClient.post<{
        success: boolean;
        distanceKm: number;
        durationText: string;
        summary: string;
      }>('/location/route-distance', {
        originLat,
        originLng,
        destLat,
        destLng,
        travelMode: 'DRIVE'
      });

      if (res && res.success) {
        setRouteInfo({
          distanceKm: res.distanceKm,
          durationText: res.durationText,
          summary: res.summary
        });
      }
    } catch (err) {
      console.error('Route calculation error:', err);
    } finally {
      setCalculatingRoute(false);
    }
  };

  const handleToggleSave = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onOpenLogin();
      return;
    }
    try {
      const res = await api.toggleSaveJob(jobId);
      if (res.isSaved) {
        setSavedJobIds(prev => [...prev, jobId]);
      } else {
        setSavedJobIds(prev => prev.filter(id => id !== jobId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calculateMatchPercentage = (job: any) => {
    if (job.aiScore) return job.aiScore;
    if (!job.skillsRequired || job.skillsRequired.length === 0) return 75;
    if (!candidateProfile?.skills || candidateProfile.skills.length === 0) return 60;

    const candSkills = candidateProfile.skills.map((s: string) => s.toLowerCase());
    const matches = job.skillsRequired.filter((s: string) => candSkills.some((cs: string) => cs.includes(s.toLowerCase()) || s.toLowerCase().includes(cs)));
    const pct = Math.round((matches.length / job.skillsRequired.length) * 100);
    return Math.max(50, Math.min(98, pct));
  };

  const handleOpenApply = (job: JobPost) => {
    if (!isAuthenticated) {
      onOpenLogin();
      return;
    }
    setSelectedJob(job);
    setIsApplying(true);
    setApplySuccess(false);
    setApplyError(null);
    setScreeningAnswers({});
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setApplyError(null);
    try {
      await api.applyJob(selectedJob.id, coverNote, screeningAnswers);
      setApplySuccess(true);
    } catch (err: any) {
      setApplyError(err.message || 'Failed to submit application');
    }
  };

  const displayedJobs = viewOnlySaved 
    ? jobs.filter(j => savedJobIds.includes(j.id))
    : jobs;

  return (
    <div className="space-y-5 pb-12">
      
      {/* Top Search & Filter Control Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === 'hi' ? 'पद, कौशल या कंपनी खोजें (उदा. React, Sales, Electrician)...' : 'Search job title, skills, or company...'}
              className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:border-teal-600 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Search className="w-4 h-4" />
            <span>{language === 'hi' ? 'खोजें' : 'Search'}</span>
          </button>
        </form>

        {/* Quick Filter Badges & AI Recommendation Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => { setAiRecommendationsActive(false); setCategory(''); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                !aiRecommendationsActive && category === '' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {language === 'hi' ? 'सभी श्रेणियां' : 'All Roles'}
            </button>
            <button
              onClick={() => { setAiRecommendationsActive(false); setCategory('IT'); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                !aiRecommendationsActive && category === 'IT' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              IT & Tech
            </button>
            <button
              onClick={() => { setAiRecommendationsActive(false); setCategory('Non-IT'); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                !aiRecommendationsActive && category === 'Non-IT' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Non-IT & Ops
            </button>
            <button
              onClick={() => { setAiRecommendationsActive(false); setCategory('Business'); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                !aiRecommendationsActive && category === 'Business' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Business & Sales
            </button>
            <button
              onClick={() => { setAiRecommendationsActive(false); setCategory('Blue Collar'); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                !aiRecommendationsActive && category === 'Blue Collar' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Blue Collar & Trades
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Recommendation Button */}
            <button
              onClick={fetchAIRecommendations}
              disabled={aiLoading}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all border ${
                aiRecommendationsActive
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100'
              }`}
            >
              {aiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-teal-500" />}
              <span>AI Recommended Jobs</span>
            </button>

            {/* GPS Radius Filter */}
            <button
              onClick={handleUseMyLocation}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold border ${
                radiusKm > 0
                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-teal-600" />
              <span>{radiusKm > 0 ? `${radiusKm}km Radar` : (language === 'hi' ? 'आस-पास के जॉब' : 'Nearby Radar')}</span>
            </button>

            {/* Saved Jobs View Toggle */}
            {isAuthenticated && (
              <button
                onClick={() => setViewOnlySaved(!viewOnlySaved)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold border ${
                  viewOnlySaved
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                <span>{language === 'hi' ? 'सहेजे गए' : 'Saved'} ({savedJobIds.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Jobs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Job Cards List */}
        <div className={`${selectedJob ? 'lg:col-span-6 xl:col-span-5' : 'lg:col-span-12'} space-y-3`}>
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              {displayedJobs.length} {language === 'hi' ? 'सत्यापित नौकरियां उपलब्ध' : 'Verified Opportunities'}
              {aiRecommendationsActive && <span className="ml-1 text-teal-700 font-bold">• AI Matched</span>}
            </span>
            <span className="text-[11px] font-medium text-teal-700">Sorted by relevance</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              Loading verified jobs...
            </div>
          ) : displayedJobs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-2">
              <Briefcase className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p className="text-xs font-semibold text-slate-600">
                {language === 'hi' ? 'कोई नौकरी नहीं मिली' : 'No matching jobs found'}
              </p>
              <p className="text-[11px]">Try adjusting your search criteria or radius</p>
            </div>
          ) : (
            displayedJobs.map(job => {
              const isSaved = savedJobIds.includes(job.id);
              const matchPct = calculateMatchPercentage(job);
              const isSelected = selectedJob?.id === job.id;

              return (
                <div
                  key={job.id}
                  onClick={() => {
                    setSelectedJob(job);
                    setRouteInfo(null);
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-teal-50/40 border-teal-500 shadow-sm ring-1 ring-teal-500'
                      : 'bg-white border-slate-200 hover:border-teal-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900 hover:text-teal-700 transition-colors">
                          {job.title}
                        </h3>
                        {matchPct >= 80 && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            {matchPct}% Match
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 font-semibold flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.companyName}</span>
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleToggleSave(job.id, e)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title={isSaved ? 'Remove Bookmark' : 'Save Job'}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-600 fill-amber-600" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-700">
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      ₹{(job.salaryMin / 100000).toFixed(1)} - {(job.salaryMax / 100000).toFixed(1)} LPA
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="font-semibold">{job.city}</span>
                    </span>
                    <span>•</span>
                    <span className="capitalize font-semibold">{job.workMode}</span>
                  </div>

                  {job.skillsRequired && (
                    <div className="flex flex-wrap gap-1">
                      {job.skillsRequired.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                      {job.skillsRequired.length > 3 && (
                        <span className="text-[10px] text-slate-500 font-medium self-center">
                          +{job.skillsRequired.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">{job.applicantsCount || 0} applicants</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenApply(job); }}
                      className="text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-3 py-1 rounded-lg transition-colors"
                    >
                      {language === 'hi' ? 'तुरंत आवेदन करें' : 'Apply Now'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Job View (Sticky on Desktop) */}
        {selectedJob && (
          <div className="lg:col-span-6 xl:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs sticky top-24 max-h-[85vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  {selectedJob.category}
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">{selectedJob.title}</h2>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>{selectedJob.companyName}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="lg:hidden p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Salary</span>
                <span className="font-bold text-slate-900">₹{(selectedJob.salaryMin / 100000).toFixed(1)}-{(selectedJob.salaryMax / 100000).toFixed(1)} LPA</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Location</span>
                <span className="font-bold text-slate-900">{selectedJob.city}, {selectedJob.state}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Experience</span>
                <span className="font-bold text-slate-900">{selectedJob.experienceMin}-{selectedJob.experienceMax} Years</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Mode</span>
                <span className="font-bold text-slate-900 capitalize">{selectedJob.workMode}</span>
              </div>
            </div>

            {/* GPS Route & Commute Distance Calculator */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Car className="w-4 h-4 text-teal-600" />
                  <span>Commute & Distance Calculator</span>
                </div>
                <button
                  onClick={() => handleCalculateDistance(selectedJob)}
                  disabled={calculatingRoute}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1"
                >
                  {calculatingRoute ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3 text-teal-600" />}
                  <span>Calculate Distance</span>
                </button>
              </div>

              {routeInfo && (
                <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900">{routeInfo.summary}</p>
                    <p className="text-[11px] text-teal-800">Estimated Travel: ~{routeInfo.durationText}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-teal-700 text-white font-black text-xs rounded-md">
                    {routeInfo.distanceKm} km
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2 text-xs text-slate-800 leading-relaxed">
              <h4 className="font-bold text-slate-900 text-sm">Role Description</h4>
              <p className="whitespace-pre-line">{selectedJob.description}</p>
            </div>

            {/* Required Skills */}
            {selectedJob.skillsRequired && selectedJob.skillsRequired.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.skillsRequired.map((skill, idx) => (
                    <span key={idx} className="bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold px-2.5 py-1 rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred Certificates */}
            {selectedJob.preferredCertificates && selectedJob.preferredCertificates.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>KarMetra Preferred Certification</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Candidates holding verified certificates in: <strong>{selectedJob.preferredCertificates.join(', ')}</strong> will receive priority interview slots.
                </p>
              </div>
            )}

            {/* Apply Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={(e) => handleToggleSave(selectedJob.id, e)}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Bookmark className="w-4 h-4" />
                <span>{savedJobIds.includes(selectedJob.id) ? 'Saved' : 'Save'}</span>
              </button>

              <button
                onClick={() => handleOpenApply(selectedJob)}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Send className="w-4 h-4" />
                <span>{language === 'hi' ? 'आवेदन करें' : 'Apply for this Job'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Direct Application Submission Modal */}
      {isApplying && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative">
            <div className="p-4 bg-teal-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  {language === 'hi' ? 'नौकरी के लिए आवेदन करें' : 'Submit Job Application'}
                </h3>
                <p className="text-xs text-teal-100">{selectedJob.title} • {selectedJob.companyName}</p>
              </div>
              <button onClick={() => setIsApplying(false)} className="p-1 text-teal-100 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {applySuccess ? (
                <div className="text-center py-6 space-y-3 animate-in zoom-in-95">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {language === 'hi' ? 'आवेदन सफलतापूर्वक जमा हुआ!' : 'Application Submitted Successfully!'}
                  </h4>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    {language === 'hi'
                      ? 'नियोक्ता आपकी प्रोफ़ाइल की समीक्षा करेगा और साक्षात्कार के लिए सूचित करेगा।'
                      : 'The employer has received your resume and skill profile. Check your Applications tab for live stage updates.'}
                  </p>
                  <button
                    onClick={() => setIsApplying(false)}
                    className="px-6 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
                  {applyError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
                      {applyError}
                    </div>
                  )}

                  {/* Profile info preview */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{candidateProfile?.fullName || user?.mobile}</span>
                      <span className="text-[10px] text-teal-700 font-bold">Candidate Profile Linked</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Resume Attached: <strong className="text-slate-900">{candidateProfile?.resumeUrl ? 'Active Resume.pdf' : 'Default Profile PDF'}</strong>
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {language === 'hi' ? 'कवर संदेश / नोट (वैकल्पिक)' : 'Cover Message / Note to Hiring Manager'}
                    </label>
                    <textarea
                      rows={3}
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Highlight your key achievements and why you are a great fit..."
                      className="w-full p-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{language === 'hi' ? 'आवेदन भेजें' : 'Send Application'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
