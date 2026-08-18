import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  PlayCircle, 
  CheckCircle2, 
  Lock, 
  Award, 
  Clock, 
  BookOpen, 
  Search, 
  Sparkles, 
  ArrowLeft, 
  ChevronRight, 
  CheckSquare, 
  AlertCircle,
  FileCheck,
  QrCode,
  Share2,
  Download,
  RotateCcw,
  Volume2,
  FileText,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { Course, Module, Lesson, AssessmentQuestion, Certificate } from '../../types';
import { CourseVideoPlayer } from '../common/CourseVideoPlayer';
import { generateCertificatePDF } from '../../services/certificateService';

interface CandidateLearningProps {
  onOpenLogin: () => void;
  selectedCourseInit?: Course | null;
  onOpenVerifyQR?: (code: string) => void;
}

export const CandidateLearning: React.FC<CandidateLearningProps> = ({
  onOpenLogin,
  selectedCourseInit = null,
  onOpenVerifyQR
}) => {
  const { user, candidateProfile, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  // Active Course Experience State
  const [activeCourse, setActiveCourse] = useState<Course | null>(selectedCourseInit);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  
  // Assessment State
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [examTimeLeft, setExamTimeLeft] = useState(300); // 5 minutes default
  const [examResult, setExamResult] = useState<any>(null);
  const [submittingExam, setSubmittingExam] = useState(false);

  // Earned Certificates State
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (search) params.search = search;
      const res = await api.getCourses(params);
      setCourses(res.courses || []);

      if (isAuthenticated && user?.role === 'candidate') {
        const certRes = await api.getCandidateCertificates().catch(() => ({ certificates: [] }));
        setCertificates(certRes.certificates || []);
      }
    } catch (err) {
      console.error('Error fetching courses/certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [selectedCategory]);

  // Exam timer countdown
  useEffect(() => {
    let timer: any;
    if (isTakingExam && examTimeLeft > 0) {
      timer = setInterval(() => {
        setExamTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTakingExam, examTimeLeft]);

  const handleStartCourse = (course: Course) => {
    setActiveCourse(course);
    setIsTakingExam(false);
    setExamResult(null);
    if (course.modules && course.modules.length > 0) {
      const firstMod = course.modules[0];
      setActiveModule(firstMod);
      if (firstMod.lessons && firstMod.lessons.length > 0) {
        setActiveLesson(firstMod.lessons[0]);
      }
    }
  };

  const handleCompleteLesson = async (lessonId: string) => {
    if (!completedLessonIds.includes(lessonId)) {
      const updated = [...completedLessonIds, lessonId];
      setCompletedLessonIds(updated);
      if (isAuthenticated && activeCourse) {
        try {
          await api.updateCourseProgress(activeCourse.id, lessonId);
        } catch (err) {
          console.error('Progress sync error:', err);
        }
      }
    }
  };

  const handleStartAssessment = () => {
    if (!isAuthenticated) {
      onOpenLogin();
      return;
    }
    setIsTakingExam(true);
    setExamAnswers({});
    const duration = (activeCourse?.assessment?.timeLimitMinutes || 5) * 60;
    setExamTimeLeft(duration);
    setExamResult(null);
  };

  const handleSelectAnswer = (questionId: string, optionIdx: number) => {
    setExamAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const handleSubmitAssessment = async () => {
    if (!activeCourse) return;
    setSubmittingExam(true);
    try {
      const res = await api.submitAssessment(activeCourse.id, examAnswers);
      setExamResult(res);
      setIsTakingExam(false);

      if (res.certificate) {
        setCertificates(prev => {
          const exists = prev.some(c => c.id === res.certificate.id);
          return exists ? prev : [res.certificate, ...prev];
        });
      }
    } catch (err) {
      console.error('Error submitting exam:', err);
    } finally {
      setSubmittingExam(false);
    }
  };

  const handleDownloadCertificate = async (cert: Certificate | any) => {
    try {
      setDownloadingCertId(cert.id || cert.verificationCode);
      await generateCertificatePDF({
        candidateName: cert.candidateName || candidateProfile?.fullName || user?.fullName || 'Candidate',
        courseTitle: cert.courseTitle || activeCourse?.title || 'Professional Certification',
        courseTitleHi: cert.courseTitleHi,
        verificationCode: cert.verificationCode || `KM-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        issueDate: cert.issueDate || new Date().toISOString().split('T')[0],
        scorePercentage: cert.scorePercentage ?? 80,
        scoreMarks: cert.scoreMarks ?? 12,
        totalMarks: cert.totalMarks ?? 15,
        skills: cert.skills || activeCourse?.skillsTaught || [activeCourse?.title || 'Certified Skills'],
        status: cert.status || 'ACTIVE & VALID'
      });
    } catch (error) {
      console.error('Failed to generate certificate:', error);
    } finally {
      setDownloadingCertId(null);
    }
  };

  // 1. Active Course / Exam Screen
  if (activeCourse) {
    const questions = activeCourse.assessment?.questions || [];
    const passingPct = activeCourse.assessment?.passingPercentage || activeCourse.passingPercentage || 80;
    
    // Check total lessons and completed lessons count
    const totalLessons = activeCourse.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
    const completedLessonsCount = activeCourse.modules?.reduce(
      (acc, m) => acc + (m.lessons?.filter(l => completedLessonIds.includes(l.id)).length || 0), 
      0
    ) || 0;
    const isAllLessonsCompleted = totalLessons > 0 && completedLessonsCount >= totalLessons;

    // Check if certificate exists for this course
    const existingCert = certificates.find(c => c.courseId === activeCourse.id);
    const hasPassedRequirement = Boolean(existingCert || (examResult && examResult.isPassed && examResult.percentage >= passingPct));

    return (
      <div className="space-y-6 pb-12">
        {/* Top Header Breadcrumb & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => { setActiveCourse(null); setIsTakingExam(false); setExamResult(null); }}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'hi' ? 'सभी पाठ्यक्रमों पर वापस जाएं' : 'Back to Course Catalog'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 bg-teal-50 text-teal-800 rounded-full border border-teal-200">
              {activeCourse.category}
            </span>
            <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
              {activeCourse.level}
            </span>
          </div>
        </div>

        {isTakingExam ? (
          /* Proctored Assessment Exam Screen */
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl max-w-3xl mx-auto space-y-6 animate-in fade-in">
            {/* Exam Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md">
                  Proctored Certification Assessment
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  {activeCourse.title}
                </h2>
                <p className="text-xs text-slate-500">
                  Passing criteria: Minimum {passingPct}% required to unlock official certificate.
                </p>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-black">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>{Math.floor(examTimeLeft / 60)}:{(examTimeLeft % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm pt-0.5">
                      {q.question}
                    </h4>
                  </div>

                  <div className="space-y-2 pl-8">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = examAnswers[q.id] === optIdx;
                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectAnswer(q.id, optIdx)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer font-medium transition-all ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                              isSelected ? 'border-white bg-white text-teal-700 font-bold' : 'border-slate-300'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Answered {Object.keys(examAnswers).length} of {questions.length} questions
              </span>

              <button
                onClick={handleSubmitAssessment}
                disabled={submittingExam || Object.keys(examAnswers).length === 0}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submittingExam ? 'Grading Assessment...' : (language === 'hi' ? 'मूल्यांकन जमा करें' : 'Submit & Generate Certificate')}</span>
              </button>
            </div>
          </div>
        ) : examResult ? (
          /* Assessment Result Screen */
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl max-w-2xl mx-auto text-center space-y-6 animate-in zoom-in-95">
            {examResult.isPassed ? (
              <>
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
                    Assessment Passed Successfully!
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 mt-2">Congratulations!</h2>
                  <p className="text-xs text-slate-600 mt-1">
                    You scored <strong className="text-emerald-700">{examResult.percentage}%</strong> ({examResult.score}/{examResult.totalMarks} marks)
                  </p>
                </div>

                {/* Digital Certificate Card */}
                {examResult.certificate && (
                  <div className="p-6 bg-gradient-to-br from-teal-50 via-white to-teal-50/50 border-2 border-teal-300 rounded-2xl text-left space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-teal-200/80 pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                          KarMetra Verified Credential
                        </span>
                        <h3 className="text-base font-black text-slate-900">{examResult.certificate.courseTitle}</h3>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-teal-700 text-white font-black flex items-center justify-center text-sm shadow-xs">
                        KM
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Candidate</span>
                        <strong className="text-slate-800">{examResult.certificate.candidateName}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Score</span>
                        <strong className="text-emerald-700">{examResult.certificate.scorePercentage}% Verified</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Credential ID</span>
                        <span className="font-mono text-slate-800 font-bold text-[11px]">{examResult.certificate.verificationCode}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                        <span className="text-emerald-700 font-bold">Active & Valid</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                      <button
                        onClick={() => onOpenVerifyQR && onOpenVerifyQR(examResult.certificate.verificationCode)}
                        className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Inspect QR Record</span>
                      </button>

                      <button
                        onClick={() => handleDownloadCertificate(examResult.certificate)}
                        disabled={downloadingCertId === examResult.certificate.id}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>{downloadingCertId === examResult.certificate.id ? 'Generating PDF...' : 'Download Certificate'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <RotateCcw className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full">
                    Passing Threshold Not Reached
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 mt-2">Score: {examResult.percentage}%</h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                    You needed {passingPct}% to qualify for the verified credential. Review the video modules and re-attempt the assessment anytime.
                  </p>
                </div>

                <button
                  onClick={handleStartAssessment}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry Assessment'}
                </button>
              </>
            )}

            <div>
              <button
                onClick={() => setExamResult(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Return to Course Lessons
              </button>
            </div>
          </div>
        ) : (
          /* Normal LMS Video & Lesson Player */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Video Player & Content */}
            <div className="lg:col-span-8 space-y-4">
              <CourseVideoPlayer
                videoUrl={activeLesson?.videoUrl || activeLesson?.videoUrlHi || 'https://www.youtube.com/embed/dQw4w9WgXcQ'}
                title={activeLesson?.title || activeCourse.title}
                durationMinutes={activeLesson?.durationMinutes || 15}
                onLessonComplete={() => activeLesson && handleCompleteLesson(activeLesson.id)}
                isCompleted={Boolean(activeLesson && completedLessonIds.includes(activeLesson.id))}
              />

              {/* Verified Certificate Unlock Notification Bar */}
              {hasPassedRequirement && existingCert && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-900">Certificate Unlocked & Verified</h4>
                      <p className="text-[11px] text-emerald-700">
                        Score: {existingCert.scorePercentage}% • ID: {existingCert.verificationCode}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadCertificate(existingCert)}
                    disabled={downloadingCertId === existingCert.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingCertId === existingCert.id ? 'Generating...' : 'Download Certificate'}</span>
                  </button>
                </div>
              )}

              {/* Lesson Description & Details */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">{activeCourse.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{activeCourse.description}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Skills Covered:</span>
                    <div className="flex flex-wrap gap-1">
                      {(activeCourse.skillsTaught || [activeCourse.title]).map((sk, idx) => (
                        <span key={idx} className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasPassedRequirement && existingCert ? (
                      <button
                        onClick={() => handleDownloadCertificate(existingCert)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Certificate</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleStartAssessment}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Award className="w-4 h-4" />
                        <span>{language === 'hi' ? 'प्रमाणन परीक्षा दें' : 'Take Skill Assessment'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Module Syllabus & Navigation */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-900 text-xs">Course Curriculum</h3>
                <span className="text-[11px] text-slate-400">
                  {completedLessonsCount}/{totalLessons} lessons completed
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-teal-600 h-full transition-all duration-300"
                  style={{ width: totalLessons > 0 ? `${(completedLessonsCount / totalLessons) * 100}%` : '0%' }}
                />
              </div>

              <div className="space-y-3">
                {activeCourse.modules?.map((mod, modIdx) => (
                  <div key={mod.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">
                        {modIdx + 1}. {mod.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{mod.lessons?.length || 0} lessons</span>
                    </div>

                    <div className="p-1 space-y-1">
                      {mod.lessons?.map((les, lesIdx) => {
                        const isSelected = activeLesson?.id === les.id;
                        const isDone = completedLessonIds.includes(les.id);
                        return (
                          <div
                            key={les.id}
                            onClick={() => { setActiveModule(mod); setActiveLesson(les); }}
                            className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'bg-teal-50 text-teal-900 font-bold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <PlayCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span className="truncate text-[11px]">{les.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0 ml-2">{les.durationMinutes}m</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Assessment Launcher / Certificate Download Button in Sidebar */}
              <div className="pt-2">
                {hasPassedRequirement && existingCert ? (
                  <button
                    onClick={() => handleDownloadCertificate(existingCert)}
                    disabled={downloadingCertId === existingCert.id}
                    className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingCertId === existingCert.id ? 'Generating PDF...' : 'Download Certificate'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartAssessment}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>{language === 'hi' ? 'अंतिम प्रमाणन मूल्यांकन' : 'Final Assessment & Certificate'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Catalog View (59+ Courses Catalog)
  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white space-y-3 shadow-lg">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-semibold">
          <GraduationCap className="w-3.5 h-3.5 text-teal-300" />
          <span>KarMetra Learning & Certification Engine</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-black">
          {language === 'hi' ? '59+ प्रमाणित व्यावसायिक एवं तकनीकी पाठ्यक्रम' : '59+ Certified Skill & Technology Courses'}
        </h1>
        <p className="text-teal-100/80 text-xs sm:text-sm max-w-xl">
          {language === 'hi'
            ? 'पाठ्यक्रम पूरा करें, प्रत्यक्ष परीक्षा दें और वास्तविक क्यूआर कोड आधारित क्रेडेंशियल अर्जित करें जो नियोक्ताओं द्वारा मान्य हैं।'
            : 'Master in-demand vocational and technical skills, take timed assessments, and earn verifiable credentials linked to your KarMetra candidate profile.'}
        </p>
      </div>

      {/* Earned Certificates Section (If any) */}
      {certificates.length > 0 && (
        <div className="bg-white border border-teal-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Your Verified Credentials ({certificates.length})</h3>
                <p className="text-[11px] text-slate-500">Official certificates ready for download or employer sharing</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {certificates.map(cert => (
              <div 
                key={cert.id} 
                className="p-3.5 rounded-2xl border border-teal-100 bg-teal-50/40 hover:bg-teal-50/80 transition-colors flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-teal-700 font-bold">
                    <span>{cert.verificationCode}</span>
                    <span className="text-emerald-700">Verified ({cert.scorePercentage}%)</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs mt-1 line-clamp-1">{cert.courseTitle}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Issued: {cert.issueDate}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-teal-100">
                  <button
                    onClick={() => onOpenVerifyQR && onOpenVerifyQR(cert.verificationCode)}
                    className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Verify</span>
                  </button>

                  <button
                    onClick={() => handleDownloadCertificate(cert)}
                    disabled={downloadingCertId === cert.id}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingCertId === cert.id ? 'PDF...' : 'Download Certificate'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Pills & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses (e.g. Data Analytics, Power BI, Python, Electrician)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:border-teal-600 focus:outline-hidden"
            />
          </div>
          <button
            onClick={fetchCourses}
            className="px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Search
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
          {['All', 'Data & Analytics', 'Software & IT', 'Business & Sales', 'Human Resources', 'Creative & Design', 'Operations & Trades'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedCategory === cat ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400 bg-white rounded-2xl">
            Loading courses...
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400 bg-white rounded-2xl">
            No courses found matching criteria.
          </div>
        ) : (
          courses.map(course => {
            const hasCert = certificates.some(c => c.courseId === course.id);
            return (
              <div
                key={course.id}
                onClick={() => handleStartCourse(course)}
                className="bg-white border border-slate-200 hover:border-teal-400 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="h-40 bg-slate-900 relative overflow-hidden">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute top-2 right-2">
                    <span className="bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {course.level}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs font-bold">
                    <span className="bg-teal-600 px-2 py-0.5 rounded text-[10px] uppercase">
                      {course.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {course.durationHours} hrs
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors leading-snug">
                        {course.title}
                      </h3>
                      {hasCert && (
                        <span className="shrink-0 ml-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black">
                          PASSED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  {(course.skillsTaught || [course.title]).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(course.skillsTaught || [course.title]).slice(0, 3).map((sk, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-teal-700 font-bold flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>{hasCert ? 'Cert Unlocked' : 'Verified Cert'}</span>
                    </span>

                    <button className="px-3 py-1 bg-teal-600 group-hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition-colors">
                      {language === 'hi' ? 'पाठ्यक्रम देखें' : 'Start Course'} →
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
