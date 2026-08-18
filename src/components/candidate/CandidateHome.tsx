import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Building2, 
  TrendingUp, 
  ShieldCheck,
  ChevronRight,
  PlayCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { JobPost, Course, Certificate } from '../../types';

import { CandidateTab } from './CandidateNavigation';

interface CandidateHomeProps {
  onNavigate: (tab: CandidateTab) => void;
  onSelectJob: (job: JobPost) => void;
  onSelectCourse: (course: Course) => void;
  onOpenLogin: () => void;
}

export const CandidateHome: React.FC<CandidateHomeProps> = ({
  onNavigate,
  onSelectJob,
  onSelectCourse,
  onOpenLogin
}) => {
  const { user, candidateProfile, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();

  const [recommendedJobs, setRecommendedJobs] = useState<JobPost[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [jobsRes, coursesRes] = await Promise.all([
          api.getJobs({ limit: 4 }),
          api.getCourses({ limit: 4 })
        ]);
        setRecommendedJobs(jobsRes.jobs || []);
        setFeaturedCourses(coursesRes.courses || []);

        if (isAuthenticated && user?.role === 'candidate') {
          const certsRes = await api.getCandidateCertificates().catch(() => ({ certificates: [] }));
          setCertificates(certsRes.certificates || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, user]);

  const calculateProfileCompletion = () => {
    if (!candidateProfile) return 20;
    let score = 20;
    if (candidateProfile.fullName) score += 20;
    if (candidateProfile.skills && candidateProfile.skills.length >= 3) score += 25;
    if (candidateProfile.resumeUrl) score += 20;
    if (candidateProfile.highestEducation) score += 15;
    return Math.min(100, score);
  };

  const profilePct = calculateProfileCompletion();

  return (
    <div className="space-y-6 pb-12">
      
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-300 via-white to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>{language === 'hi' ? 'कौशल आधारित रोजगार मंच' : 'India\'s Direct Skill-to-Job Platform'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            {isAuthenticated ? (
              <span>
                {language === 'hi' ? 'नमस्ते' : 'Welcome back'}, <span className="text-teal-300">{candidateProfile?.fullName || 'Job Seeker'}</span>!
              </span>
            ) : (
              <span>{language === 'hi' ? 'सीखें, प्रमाणित हों और अपनी मनपसंद नौकरी पाएं' : 'Learn In-Demand Skills, Get Verified & Land Your Dream Job'}</span>
            )}
          </h1>

          <p className="text-teal-100/80 text-xs sm:text-sm leading-relaxed max-w-xl">
            {language === 'hi'
              ? '59+ मुफ्त व मान्यता प्राप्त पाठ्यक्रम, प्रत्यक्ष ऑनलाइन मूल्यांकन, डिजिटल क्यूआर प्रमाणपत्र और हजारों सत्यापित नौकरियां।'
              : 'Access 59+ certified vocational & tech courses, take rigorous online assessments, earn verified digital certificates, and apply directly to top recruiters.'}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onNavigate('jobs')}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Briefcase className="w-4 h-4" />
              <span>{language === 'hi' ? 'नौकरियां खोजें' : 'Browse Verified Jobs'}</span>
            </button>

            <button
              onClick={() => onNavigate('learning')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm rounded-xl backdrop-blur flex items-center gap-2 transition-all"
            >
              <GraduationCap className="w-4 h-4 text-teal-300" />
              <span>{language === 'hi' ? 'कौशल पाठ्यक्रम (LMS)' : 'Free LMS Courses'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Completion Bar for logged in candidates */}
      {isAuthenticated && user?.role === 'candidate' && profilePct < 100 && (
        <div className="bg-gradient-to-r from-amber-50 to-white border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between max-w-md">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                {language === 'hi' ? 'प्रोफ़ाइल पूर्णता स्थिति' : 'Profile Completeness'}
              </span>
              <span className="text-xs font-black text-amber-800">{profilePct}%</span>
            </div>
            <div className="w-full max-w-md bg-amber-200/60 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-amber-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${profilePct}%` }}
              />
            </div>
            <p className="text-[11px] text-amber-700">
              {language === 'hi'
                ? 'कौशल और रिज्यूमे जोड़ें ताकि रिक्रूटर्स आपको 3 गुना तेजी से शॉर्टलिस्ट कर सकें।'
                : 'Upload your resume and tag skills to increase recruiter shortlists by 3x.'}
            </p>
          </div>

          <button
            onClick={() => onNavigate('profile')}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shrink-0 transition-colors shadow-xs"
          >
            {language === 'hi' ? 'प्रोफ़ाइल पूरा करें' : 'Complete Profile'}
          </button>
        </div>
      )}

      {/* Earned Certificates Showcase */}
      {certificates.length > 0 && (
        <div className="bg-white border border-teal-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'hi' ? 'आपके अर्जित सत्यापित प्रमाणपत्र' : 'Your Verified Skill Credentials'}
              </h3>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              {certificates.length} Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {certificates.map(cert => (
              <div key={cert.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-slate-800 text-xs leading-snug">{cert.courseTitle}</h4>
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    {cert.scorePercentage}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{cert.verificationCode}</span>
                  <span>{new Date(cert.issueDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Pills Quick Filter */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          {language === 'hi' ? 'प्रमुख रोजगार श्रेणियां' : 'Explore High-Demand Sectors'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { title: 'IT & Software', desc: 'React, Node, Python, Cloud', icon: '💻', count: '1,420+ Jobs' },
            { title: 'Data & Analytics', desc: 'Power BI, SQL, Python, Excel', icon: '📊', count: '890+ Jobs' },
            { title: 'Business & HR', desc: 'Talent Acquisition, Sales, Ops', icon: '💼', count: '640+ Jobs' },
            { title: 'Blue-Collar & Logistics', desc: 'Electrician, CNC, Delivery', icon: '🔧', count: '2,150+ Jobs' }
          ].map((cat, idx) => (
            <div
              key={idx}
              onClick={() => onNavigate('jobs')}
              className="p-4 bg-white border border-slate-200 hover:border-teal-400 rounded-2xl cursor-pointer transition-all hover:shadow-sm group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">{cat.title}</h4>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{cat.desc}</p>
              <span className="inline-block mt-2 text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                {cat.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Jobs Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'hi' ? 'अनुशंसित नौकरियां' : 'Featured Job Openings'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'hi' ? 'सत्यापित नियोक्ताओं द्वारा प्रत्यक्ष अवसर' : 'Direct openings verified by KarMetra trust desk'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('jobs')}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <span>{language === 'hi' ? 'सभी देखें' : 'View all'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedJobs.map(job => (
            <div
              key={job.id}
              onClick={() => onSelectJob(job)}
              className="p-5 bg-white border border-slate-200 hover:border-teal-400 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 hover:text-teal-700 transition-colors">
                      {job.title}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.companyName}</span>
                    </p>
                  </div>
                  <span className="text-[11px] font-extrabold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg shrink-0">
                    ₹{(job.salaryMin / 100000).toFixed(1)} - {(job.salaryMax / 100000).toFixed(1)} LPA
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{job.city}, {job.state}</span>
                  </span>
                  <span>•</span>
                  <span className="capitalize">{job.workMode}</span>
                  <span>•</span>
                  <span>{job.experienceMin}-{job.experienceMax} yrs exp</span>
                </div>

                {job.skillsRequired && job.skillsRequired.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.skillsRequired.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                    {job.skillsRequired.length > 3 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{job.skillsRequired.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </span>
                <span className="font-bold text-teal-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>{language === 'hi' ? 'आवेदन करें' : 'View Details'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Courses from LMS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'hi' ? 'लोकप्रिय कौशल पाठ्यक्रम (LMS)' : 'Featured Certification Courses'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'hi' ? 'पाठ्यक्रम पूरा करें, परीक्षा पास करें और प्रमाणित हों' : 'Learn with expert video modules and get certified'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('learning')}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <span>{language === 'hi' ? 'सभी 59+ देखें' : 'View all 59+'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredCourses.map(course => (
            <div
              key={course.id}
              onClick={() => onSelectCourse(course)}
              className="bg-white border border-slate-200 hover:border-teal-400 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="h-32 bg-slate-800 relative overflow-hidden group">
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] font-bold">
                  <span className="bg-teal-600/90 backdrop-blur px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                    {course.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <PlayCircle className="w-3.5 h-3.5" />
                    {course.modules?.length || 3} Modules
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                    {course.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {course.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {course.durationHours} hrs • {course.level}
                  </span>
                  <span className="text-xs font-bold text-teal-700">
                    {language === 'hi' ? 'शुरू करें' : 'Start'} →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
