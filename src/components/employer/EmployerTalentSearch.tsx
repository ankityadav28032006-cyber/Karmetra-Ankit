import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Plus,
  Send,
  User
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { CandidateProfile } from '../../types';

interface EmployerTalentSearchProps {
  onScheduleInterview?: (candidate: CandidateProfile) => void;
}

export const EmployerTalentSearch: React.FC<EmployerTalentSearchProps> = ({ onScheduleInterview }) => {
  const { language } = useLanguage();
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [skillsQuery, setSkillsQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [minExp, setMinExp] = useState(0);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (skillsQuery) params.skills = skillsQuery;
      if (cityQuery) params.city = cityQuery;
      if (minExp > 0) params.minExp = minExp;

      const res = await api.searchCandidates(params);
      setCandidates(res.candidates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [minExp]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCandidates();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white space-y-3 shadow-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-teal-300" />
          <span>Pan-India Verified Talent Pool</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-black">
          {language === 'hi' ? 'प्रमाणित उम्मीदवारों को सीधे खोजें' : 'Direct Search: Pre-Assessed & Certified Candidates'}
        </h1>
        <p className="text-teal-100/80 text-xs sm:text-sm max-w-xl">
          Search candidate database by multiple skills, verified LMS assessment scores, and city proximity.
        </p>
      </div>

      {/* Search Bar & Filters */}
      <form onSubmit={handleSearchSubmit} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={skillsQuery}
              onChange={(e) => setSkillsQuery(e.target.value)}
              placeholder="Search required skills (e.g. Python, Power BI, React, Electrician)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:border-teal-600 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="City (e.g. Bengaluru, Mumbai, Pune)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:border-teal-600 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Min Experience:</span>
            {[0, 1, 3, 5].map(exp => (
              <button
                key={exp}
                type="button"
                onClick={() => setMinExp(exp)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  minExp === exp ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {exp === 0 ? 'Any' : `${exp}+ yrs`}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Talent</span>
          </button>
        </div>
      </form>

      {/* Candidate Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Found {candidates.length} matching verified candidates</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Searching candidate database...
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-2">
            <User className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
            <p className="text-xs font-bold text-slate-700">No candidates match your criteria.</p>
            <p className="text-[11px]">Try broadening your skill keywords or city filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidates.map(cand => (
              <div
                key={cand.id}
                className="bg-white border border-slate-200 hover:border-teal-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-black text-sm flex items-center justify-center">
                        {cand.fullName?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{cand.fullName}</h3>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cand.city || 'Pan-India'}, {cand.state}</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg">
                      {cand.experienceYears || 0} yrs exp
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <span>Edu: <strong className="text-slate-800">{cand.highestEducation || 'Graduate'}</strong></span>
                    <span>•</span>
                    <span>Notice: <strong className="text-slate-800">{cand.noticePeriodDays || 30} days</strong></span>
                  </div>

                  {/* Skills tags */}
                  {cand.skills && cand.skills.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Verified Competencies</span>
                      <div className="flex flex-wrap gap-1">
                        {cand.skills.map((sk, idx) => (
                          <span key={idx} className="bg-teal-50 text-teal-800 border border-teal-100 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {cand.resumeUrl ? (
                    <a
                      href={cand.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 font-bold underline flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Resume</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">Profile Verified</span>
                  )}

                  <button
                    onClick={() => alert(`Direct connection initiated with ${cand.fullName}. Invitation dispatched.`)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1 transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>Invite to Job</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
