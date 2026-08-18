import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  PlayCircle, 
  Award, 
  Search, 
  RefreshCw,
  Clock,
  BookOpen,
  X,
  Sparkles,
  Copy,
  Upload,
  Video,
  Youtube,
  DollarSign,
  Layers,
  HelpCircle,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Download,
  AlertCircle,
  FileText,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { Course, CourseModule, Lesson, QuizQuestion, CourseAssessment } from '../../types';
import { generateCertificatePDF } from '../../services/certificateService';
import { CourseVideoPlayer } from '../common/CourseVideoPlayer';

export const AdminCourses: React.FC = () => {
  const { language } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'curriculum' | 'assessment' | 'certificate' | 'preview'>('info');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all, published, draft, free, paid

  // Module & Lesson Editing State
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lesson: Partial<Lesson>; isNewLesson?: boolean } | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Assessment Question Editing State
  const [editingQuestion, setEditingQuestion] = useState<{ question: Partial<QuizQuestion>; index: number; isNewQuestion?: boolean } | null>(null);

  // Candidate Preview Course
  const [previewingCourse, setPreviewingCourse] = useState<Course | null>(null);
  const [previewActiveLesson, setPreviewActiveLesson] = useState<Lesson | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminCourses();
      setCourses(res.courses || []);
    } catch (err) {
      console.error('Error fetching admin courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const default15Questions: QuizQuestion[] = [
    {
      id: 'q1',
      question: 'What is the primary objective of understanding industry workflow standards?',
      questionHi: 'उद्योग कार्यप्रवाह मानकों को समझने का प्राथमिक उद्देश्य क्या है?',
      options: [
        'To ensure high code quality and smooth collaboration',
        'To write maximum lines of code',
        'To bypass security audits',
        'To eliminate documentation requirements'
      ],
      correctOptionIndex: 0,
      marks: 1,
      difficulty: 'Beginner',
      explanation: 'Industry standards ensure consistent quality, security, and smooth team collaboration.'
    },
    {
      id: 'q2',
      question: 'Which HTTP method is universally used to securely request read-only data?',
      questionHi: 'रीड-ओनली डेटा का सुरक्षित अनुरोध करने के लिए कौन सी HTTP विधि का उपयोग किया जाता है?',
      options: ['POST', 'GET', 'DELETE', 'PUT'],
      correctOptionIndex: 1,
      marks: 1,
      difficulty: 'Beginner',
      explanation: 'GET requests retrieve representation of specified resources without modifying server state.'
    },
    {
      id: 'q3',
      question: 'What does modern HTTPS provide over plain HTTP?',
      questionHi: 'आधुनिक HTTPS सादे HTTP की तुलना में क्या प्रदान करता है?',
      options: [
        'End-to-end TLS encryption and integrity verification',
        'Faster raw socket speed only',
        'Automatic database backups',
        'No browser cache'
      ],
      correctOptionIndex: 0,
      marks: 1,
      difficulty: 'Beginner',
      explanation: 'HTTPS encrypts data in transit using TLS to protect against interception and tampering.'
    },
    {
      id: 'q4',
      question: 'What is the primary benefit of responsive web design (RWD)?',
      questionHi: 'रिस्पॉन्सिव वेब डिज़ाइन (RWD) का प्राथमिक लाभ क्या है?',
      options: [
        'Seamless user experience across smartphones, tablets, and desktop displays',
        'Requires three separate websites to be maintained',
        'Removes need for CSS styling',
        'Locks viewport strictly to 1920px'
      ],
      correctOptionIndex: 0,
      marks: 1,
      difficulty: 'Beginner',
      explanation: 'RWD adapts layouts dynamically to any screen dimension using flexible grids and media queries.'
    },
    {
      id: 'q5',
      question: 'In version control (Git), what command safely incorporates changes from a feature branch into main?',
      questionHi: 'संस्करण नियंत्रण (Git) में, मुख्य शाखा में फीचर शाखा से परिवर्तन शामिल करने वाला कमांड कौन सा है?',
      options: ['git push --force', 'git merge', 'git reset --hard', 'git clean -df'],
      correctOptionIndex: 1,
      marks: 1,
      difficulty: 'Intermediate',
      explanation: 'git merge combines independent commit histories safely into target branch.'
    },
    {
      id: 'q6',
      question: 'Which status code indicates a successful HTTP request with returned payload?',
      questionHi: 'कौन सा स्टेटस कोड सफल HTTP अनुरोध को दर्शाता है?',
      options: ['200 OK', '404 Not Found', '500 Internal Error', '301 Moved Permanently'],
      correctOptionIndex: 0,
      marks: 1,
      difficulty: 'Beginner',
      explanation: '200 OK signals successful transmission and payload response.'
    },
    {
      id: 'q7',
      question: 'What is the function of an API Authentication Token (e.g. JWT)?',
      questionHi: 'एपीआई प्रमाणीकरण टोकन (जैसे JWT) का क्या कार्य है?',
      options: [
        'Cryptographically securely verifying client identity without transmitting credentials repeatedly',
        'To speed up CPU clock rate',
        'To convert HTML into PDF',
        'To format SQL queries'
      ],
      correctOptionIndex: 0,
      marks: 1,
      difficulty: 'Intermediate',
      explanation: 'JWT provides stateless, verifiable claims confirming user identity across distributed requests.'
    },
    {
      id: 'q8',
      question: 'Which data format is the most widely adopted lightweight standard for API data exchange?',
      questionHi: 'एपीआई डेटा विनिमय के लिए कौन सा डेटा प्रारूप सबसे व्यापक मानक है?',
      options: ['JSON (JavaScript Object Notation)', 'Raw Binary Hex', 'CSV without headers', 'RTF'],
      correctOptionIndex: 0,
      marks: 1,
      difficulty: 'Beginner',
      explanation: 'JSON is human-readable, lightweight, and universally supported across all programming languages.'
    },
    {
      id: 'q9',
      question: 'What is the role of continuous automated testing in modern deployment pipelines?',
      questionHi: 'आधुनिक परिनियोजन में निरंतर स्वचालित परीक्षण की क्या भूमिका है?',
      options: [
        'Catch regressions early before production release',
        'Increase software file size',
        'Slow down developer velocity intentionally',
        'Replace all documentation'
      ],
      correctOptionIndex: 0,
      marks: 1,
      difficulty: 'Intermediate',
      explanation: 'Automated tests validate functionality regressions and guard against software bugs in production.'
    },
    {
      id: 'q10',
      question: 'Why should sensitive environment secrets (API Keys, DB passwords) never be committed to Git?',
      questionHi: 'संवेदनशील कुंजियों (एपीआई की, पासवर्ड) को गिट में क्यों नहीं भेजना चाहिए?',
      options: [
        'They are publicly exposed and can lead to immediate security compromises',
        'Git will crash on long strings',
        'They make repository loading 10x slower',
        'They change file extensions'
      ],
      correctOptionIndex: 0,
      marks: 1,
      difficulty: 'Intermediate',
      explanation: 'Hardcoding secrets in public or private repositories makes them vulnerable to credential harvesting.'
    },
    {
      id: 'q11',
      question: 'What is asynchronous programming primarily designed to prevent in user applications?',
      questionHi: 'एसिंक्रोनस प्रोग्रामिंग मुख्य रूप से उपयोगकर्ता एप्लिकेशन में क्या रोकने के लिए डिज़ाइन की गई है?',
      options: [
        'Blocking the main UI execution thread during network or disk I/O operations',
        'Downloading images',
        'Creating functions with parameters',
        'Displaying error notifications'
      ],
      correctOptionIndex: 0,
      marks: 1,
      difficulty: 'Intermediate',
      explanation: 'Async execution offloads heavy I/O operations so the interface remains responsive.'
    },
    {
      id: 'q12',
      question: 'What is the main goal of database indexing?',
      questionHi: 'डेटाबेस इंडेक्सिंग का मुख्य लक्ष्य क्या है?',
      options: [
        'Significantly accelerate data query search retrieval times',
        'Encrypt table records',
        'Automatically delete duplicate users',
        'Reduce database storage to 0 bytes'
      ],
      correctOptionIndex: 0,
      marks: 1,
      difficulty: 'Intermediate',
      explanation: 'Indexes create efficient lookup tree data structures allowing fast search without full table scans.'
    },
    {
      id: 'q13',
      question: 'In software architecture, what does separation of concerns (SoC) promote?',
      questionHi: 'सॉफ्टवेयर आर्किटेक्चर में सेपरेशन ऑफ कंसर्न्स (SoC) क्या बढ़ावा देता है?',
      options: [
        'Modular, maintainable, and independently testable software components',
        'Writing all application logic inside a single 10,000 line file',
        'Removing type checking entirely',
        'Eliminating the database layer'
      ],
      correctOptionIndex: 0,
      marks: 1,
      difficulty: 'Advanced',
      explanation: 'SoC divides software into distinct sections, each addressing a separate concern for maintainability.'
    },
    {
      id: 'q14',
      question: 'Which of the following is essential for preventing SQL Injection attacks?',
      questionHi: 'एसक्यूएल इंजेक्शन हमलों को रोकने के लिए निम्नलिखित में से क्या आवश्यक है?',
      options: [
        'Using parameterized queries / prepared statements',
        'Concatenating raw user inputs directly into query strings',
        'Turning off database logging',
        'Disabling firewalls'
      ],
      correctOptionIndex: 0,
      marks: 1,
      difficulty: 'Advanced',
      explanation: 'Parameterized queries separate SQL command logic from untrusted user data inputs.'
    },
    {
      id: 'q15',
      question: 'What is the standard benchmark passing score for official KarMetra industry certification?',
      questionHi: 'आधिकारिक कारमेट्रा उद्योग प्रमाणन के लिए मानक बेंचमार्क उत्तीर्ण स्कोर क्या है?',
      options: ['80% and above', '33%', '50%', '10%'],
      correctOptionIndex: 0,
      marks: 1,
      difficulty: 'Beginner',
      explanation: 'KarMetra maintains an 80% passing threshold to guarantee proven job-ready competency.'
    }
  ];

  const handleCreateNew = () => {
    const newCourseId = `course-${Date.now()}`;
    const newModId = `mod-${Date.now()}-1`;
    const blank: Course = {
      id: newCourseId,
      title: '',
      titleHi: '',
      category: 'IT',
      categoryHi: 'आईटी',
      subcategory: 'Software Engineering',
      description: '',
      descriptionHi: '',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      level: 'Beginner',
      durationHours: 10,
      passingPercentage: 80,
      isPublished: false,
      featured: false,
      enrolledCount: 0,
      completedCount: 0,
      accessType: 'free',
      coursePrice: 0,
      isPaid: false,
      price: 0,
      certificateEnabled: true,
      certificateFeeType: 'free',
      isCertificatePaid: false,
      certificatePrice: 0,
      skillsTaught: ['Frontend', 'JavaScript', 'Problem Solving'],
      learningObjectives: [
        'Master fundamentals of modern software development workflow',
        'Build production-ready applications following clean code principles',
        'Pass proctored examination to earn verified KarMetra certificate'
      ],
      careerOutcomes: [
        'Junior Software Engineer',
        'Technical Associate',
        'Verified Pan-India Candidate'
      ],
      prerequisites: [
        'Basic computer literacy and internet access'
      ],
      modules: [
        {
          id: newModId,
          courseId: newCourseId,
          title: 'Module 1: Orientation & Foundations',
          titleHi: 'मॉड्यूल 1: मूलभूत बातें',
          order: 1,
          lessons: [
            {
              id: `les-${Date.now()}-1`,
              moduleId: newModId,
              title: 'Lesson 1.1: Introduction & Learning Path Overview',
              titleHi: 'पाठ 1.1: परिचय और अवलोकन',
              description: 'Comprehensive overview of syllabus, industry benchmarks, and certification criteria.',
              durationMinutes: 15,
              videoSource: 'youtube',
              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              order: 1,
              isPublished: true
            }
          ]
        }
      ],
      assessment: {
        id: `asm-${Date.now()}`,
        courseId: newCourseId,
        title: 'KarMetra Proctored Competency Assessment',
        titleHi: 'कारमेट्रा प्रमाणन मूल्यांकन',
        timeLimitMinutes: 5,
        passingPercentage: 80,
        totalMarks: 15,
        maxAttempts: 3,
        randomizeQuestions: true,
        randomizeOptions: false,
        questions: default15Questions
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setEditingCourse(blank);
    setIsNew(true);
    setActiveTab('info');
    setSelectedModuleId(newModId);
  };

  const handleDuplicateCourse = async (course: Course) => {
    if (!window.confirm(`Duplicate "${course.title}"? A full copy of curriculum, lessons, and 15-question quiz will be created.`)) return;
    try {
      setLoading(true);
      const res = await api.duplicateAdminCourse(course.id);
      if (res.course) {
        setCourses(prev => [res.course, ...prev]);
        alert(`Course successfully duplicated as "${res.course.title}"!`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate course');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (course: Course) => {
    const nextState = !course.isPublished;
    try {
      await api.publishAdminCourse(course.id, nextState);
      setCourses(prev => prev.map(c => c.id === course.id ? { ...c, isPublished: nextState } : c));
    } catch (err: any) {
      alert(err.message || 'Failed to update publication status');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this course and all associated modules?')) return;
    try {
      await api.deleteAdminCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete course');
    }
  };

  const handleSaveCourse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingCourse) return;

    // Validate titles & modules
    if (!editingCourse.title.trim()) {
      alert('Course Title is required');
      setActiveTab('info');
      return;
    }

    setSubmitting(true);
    try {
      // Ensure passing percentage is at least 80% default
      const finalCourse: Course = {
        ...editingCourse,
        passingPercentage: Number(editingCourse.passingPercentage) || 80,
        coursePrice: editingCourse.accessType === 'paid' ? Number(editingCourse.coursePrice || 0) : 0,
        isPaid: editingCourse.accessType === 'paid',
        price: editingCourse.accessType === 'paid' ? Number(editingCourse.coursePrice || 0) : 0,
        certificatePrice: editingCourse.certificateFeeType === 'paid' ? Number(editingCourse.certificatePrice || 0) : 0,
        isCertificatePaid: editingCourse.certificateFeeType === 'paid',
        updatedAt: new Date().toISOString()
      };

      await api.saveAdminCourse(finalCourse);
      await fetchCourses();
      setEditingCourse(null);
      setIsNew(false);
      alert('Course and all video modules saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save course');
    } finally {
      setSubmitting(false);
    }
  };

  // Video Upload Handler
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (e.g. 500MB)
    if (file.size > 500 * 1024 * 1024) {
      alert('Video file size exceeds 500MB limit.');
      return;
    }

    setUploadingVideo(true);
    setUploadProgress(15);

    try {
      const progressTimer = setInterval(() => {
        setUploadProgress(p => (p < 85 ? p + 15 : p));
      }, 400);

      const res = await api.uploadMedia(file);
      clearInterval(progressTimer);
      setUploadProgress(100);

      if (editingLesson) {
        setEditingLesson({
          ...editingLesson,
          lesson: {
            ...editingLesson.lesson,
            videoUrl: res.url,
            videoSource: 'upload'
          }
        });
      }
    } catch (err: any) {
      alert(err.message || 'Video upload failed');
    } finally {
      setUploadingVideo(false);
    }
  };

  // Module Handlers
  const handleAddModule = () => {
    if (!editingCourse) return;
    const newMod: CourseModule = {
      id: `mod-${Date.now()}-${(editingCourse.modules?.length || 0) + 1}`,
      courseId: editingCourse.id,
      title: `Module ${(editingCourse.modules?.length || 0) + 1}: New Curriculum Topic`,
      titleHi: `मॉड्यूल ${(editingCourse.modules?.length || 0) + 1}: नया विषय`,
      order: (editingCourse.modules?.length || 0) + 1,
      lessons: []
    };
    setEditingCourse({
      ...editingCourse,
      modules: [...(editingCourse.modules || []), newMod]
    });
    setSelectedModuleId(newMod.id);
  };

  const handleDeleteModule = (moduleId: string) => {
    if (!editingCourse) return;
    if (!window.confirm('Delete this module and all its lessons?')) return;
    const updated = (editingCourse.modules || []).filter(m => m.id !== moduleId);
    setEditingCourse({ ...editingCourse, modules: updated });
    if (selectedModuleId === moduleId) {
      setSelectedModuleId(updated[0]?.id || null);
    }
  };

  // Lesson Handlers
  const handleSaveLesson = () => {
    if (!editingCourse || !editingLesson) return;
    const { moduleId, lesson, isNewLesson } = editingLesson;
    if (!lesson.title?.trim() || !lesson.videoUrl?.trim()) {
      alert('Lesson Title and Video URL are required.');
      return;
    }

    const lessonData: Lesson = {
      id: lesson.id || `les-${Date.now()}`,
      moduleId: moduleId,
      title: lesson.title.trim(),
      titleHi: lesson.titleHi || '',
      description: lesson.description || '',
      durationMinutes: Number(lesson.durationMinutes) || 10,
      videoSource: lesson.videoSource || (lesson.videoUrl?.includes('youtube.com') || lesson.videoUrl?.includes('youtu.be') ? 'youtube' : 'url'),
      videoUrl: lesson.videoUrl.trim(),
      thumbnailUrl: lesson.thumbnailUrl || '',
      isPublished: lesson.isPublished !== undefined ? lesson.isPublished : true,
      order: Number(lesson.order) || 1
    };

    const modules = [...(editingCourse.modules || [])];
    const modIdx = modules.findIndex(m => m.id === moduleId);
    if (modIdx !== -1) {
      const lessons = [...(modules[modIdx].lessons || [])];
      if (isNewLesson) {
        lessons.push(lessonData);
      } else {
        const lesIdx = lessons.findIndex(l => l.id === lessonData.id);
        if (lesIdx !== -1) {
          lessons[lesIdx] = lessonData;
        } else {
          lessons.push(lessonData);
        }
      }
      modules[modIdx] = { ...modules[modIdx], lessons };
      setEditingCourse({ ...editingCourse, modules });
    }

    setEditingLesson(null);
  };

  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    if (!editingCourse) return;
    if (!window.confirm('Remove this video lesson from module?')) return;
    const modules = (editingCourse.modules || []).map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: (m.lessons || []).filter(l => l.id !== lessonId)
        };
      }
      return m;
    });
    setEditingCourse({ ...editingCourse, modules });
  };

  // Assessment Question Handlers
  const handleSaveQuestion = () => {
    if (!editingCourse || !editingQuestion) return;
    const { question, index, isNewQuestion } = editingQuestion;
    if (!question.question?.trim()) {
      alert('Question text cannot be empty');
      return;
    }

    const validOptions = (question.options || []).filter(Boolean);
    if (validOptions.length < 2) {
      alert('At least 2 options are required for a question.');
      return;
    }

    const currentQuestions = [...(editingCourse.assessment?.questions || [])];
    const newQ: QuizQuestion = {
      id: question.id || `q-${Date.now()}`,
      question: question.question.trim(),
      questionHi: question.questionHi || '',
      options: question.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctOptionIndex: question.correctOptionIndex ?? 0,
      marks: Number(question.marks) || 1,
      difficulty: question.difficulty || 'Beginner',
      explanation: question.explanation || '',
      explanationHi: question.explanationHi || ''
    };

    if (isNewQuestion) {
      currentQuestions.push(newQ);
    } else {
      currentQuestions[index] = newQ;
    }

    const totalMarks = currentQuestions.reduce((acc, q) => acc + (q.marks || 1), 0);

    setEditingCourse({
      ...editingCourse,
      assessment: {
        ...(editingCourse.assessment || {
          id: `asm-${editingCourse.id}`,
          courseId: editingCourse.id,
          title: 'Official Certification Quiz',
          timeLimitMinutes: 5,
          passingPercentage: 80,
          maxAttempts: 3,
          questions: []
        }),
        questions: currentQuestions,
        totalMarks: totalMarks
      }
    });

    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (index: number) => {
    if (!editingCourse) return;
    if (!window.confirm('Delete this assessment question?')) return;
    const questions = [...(editingCourse.assessment?.questions || [])];
    questions.splice(index, 1);
    const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);
    setEditingCourse({
      ...editingCourse,
      assessment: {
        ...(editingCourse.assessment as CourseAssessment),
        questions,
        totalMarks
      }
    });
  };

  const handlePopulate15Questions = () => {
    if (!editingCourse) return;
    if (!window.confirm('Load standard 15 proctored questions covering essential industry standards?')) return;
    setEditingCourse({
      ...editingCourse,
      assessment: {
        ...(editingCourse.assessment || {
          id: `asm-${editingCourse.id}`,
          courseId: editingCourse.id,
          title: 'Official Certification Quiz',
          timeLimitMinutes: 5,
          passingPercentage: 80,
          maxAttempts: 3,
          questions: []
        }),
        timeLimitMinutes: 5,
        passingPercentage: 80,
        totalMarks: 15,
        questions: default15Questions
      }
    });
  };

  // Filtered courses list
  const filteredCourses = courses.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.skillsTaught && c.skillsTaught.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory = filterCategory === 'all' || c.category.toLowerCase() === filterCategory.toLowerCase();
    
    let matchesStatus = true;
    if (filterStatus === 'published') matchesStatus = Boolean(c.isPublished);
    if (filterStatus === 'draft') matchesStatus = !c.isPublished;
    if (filterStatus === 'paid') matchesStatus = c.accessType === 'paid' || Boolean(c.isPaid);
    if (filterStatus === 'free') matchesStatus = c.accessType === 'free' || (!c.isPaid && !c.accessType);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header & Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  LMS Course & Video Studio
                </h2>
                <p className="text-xs text-slate-400">
                  Manage curriculum, YouTube/MP4 video streams, proctored quizzes, and certificate rules
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchCourses}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Refresh Courses"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Course</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Courses</span>
            <span className="text-xl font-black text-white mt-1 block">{courses.length}</span>
          </div>
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Published Active</span>
            <span className="text-xl font-black text-emerald-300 mt-1 block">
              {courses.filter(c => c.isPublished).length}
            </span>
          </div>
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Drafts</span>
            <span className="text-xl font-black text-amber-300 mt-1 block">
              {courses.filter(c => !c.isPublished).length}
            </span>
          </div>
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">Monetized / Paid</span>
            <span className="text-xl font-black text-teal-300 mt-1 block">
              {courses.filter(c => c.accessType === 'paid' || c.isPaid || c.isCertificatePaid).length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, skill (e.g. React, Python), or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="IT">IT & Software</option>
            <option value="Non-IT">Non-IT</option>
            <option value="Business">Business</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Blue Collar">Blue Collar</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
            <option value="free">Free Courses</option>
            <option value="paid">Paid Courses</option>
          </select>
        </div>
      </div>

      {/* Courses Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-16 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            <span>Loading courses from KarMetra LMS catalog...</span>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="col-span-full p-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <GraduationCap className="w-10 h-10 mx-auto text-slate-400" />
            <p className="font-bold text-slate-800 text-sm">No courses matching your filter</p>
            <p className="text-xs text-slate-500">Try adjusting your search criteria or create a new course.</p>
            <button
              onClick={handleCreateNew}
              className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 cursor-pointer"
            >
              + Create New Course
            </button>
          </div>
        ) : (
          filteredCourses.map(course => {
            const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
            const isPaidCourse = course.accessType === 'paid' || Boolean(course.isPaid);
            const isPaidCert = course.certificateFeeType === 'paid' || Boolean(course.isCertificatePaid);

            return (
              <div
                key={course.id}
                className="bg-white border border-slate-200 hover:border-teal-400 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Course Thumbnail & Status Badges */}
                <div className="relative h-40 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                  
                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/90 backdrop-blur text-teal-300 text-[10px] font-extrabold rounded-lg uppercase tracking-wider">
                    {course.category}
                  </span>

                  {/* Pricing Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {isPaidCourse ? (
                      <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded-lg shadow-xs">
                        ₹{course.coursePrice || course.price || 499}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-lg shadow-xs">
                        FREE
                      </span>
                    )}

                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                      course.isPublished ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {course.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs font-bold">
                    <span className="flex items-center gap-1 text-[11px] text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      {course.durationHours} hrs
                    </span>
                    <span className="text-[11px] text-teal-300 font-semibold">
                      {course.enrolledCount || 0} Learners
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-teal-700 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  {/* Skills tags */}
                  {(course.skillsTaught || [course.title]).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(course.skillsTaught || [course.title]).slice(0, 3).map((sk, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Curriculum Details Specs */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-teal-600" /> {course.modules?.length || 0} Modules ({totalLessons} videos)
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-teal-600" /> Pass: {course.passingPercentage || 80}%
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-teal-600" /> {course.assessment?.questions?.length || 15} Exam Qs (5 min)
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {isPaidCert ? `Cert: ₹${course.certificatePrice}` : 'Cert: Free'}
                    </span>
                  </div>

                  {/* Action Toolbar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => { setEditingCourse(course); setIsNew(false); setActiveTab('info'); }}
                      className="flex-1 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Open Course Studio"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Studio</span>
                    </button>

                    <button
                      onClick={() => handleTogglePublish(course)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        course.isPublished
                          ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                      title={course.isPublished ? 'Unpublish to Draft' : 'Publish to Candidates'}
                    >
                      {course.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleDuplicateCourse(course)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                      title="Duplicate Course (One-Click Clone)"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setPreviewingCourse(course);
                        const firstMod = course.modules?.[0];
                        const firstLes = firstMod?.lessons?.[0];
                        setPreviewActiveLesson(firstLes || null);
                      }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                      title="Preview as Candidate"
                    >
                      <PlayCircle className="w-4 h-4 text-teal-600" />
                    </button>

                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Comprehensive Full-Featured Course Studio Editor Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 my-4 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                    <span>{isNew ? 'Create LMS Certification Course' : `Course Studio: ${editingCourse.title || 'Untitled'}`}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      editingCourse.isPublished ? 'bg-teal-500/30 text-teal-300' : 'bg-amber-500/30 text-amber-300'
                    }`}>
                      {editingCourse.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Configure bilingual details, YouTube/MP4 video lessons, 15-question proctored quiz & certificate</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveCourse()}
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
                </button>

                <button
                  onClick={() => setEditingCourse(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="flex items-center gap-1 sm:gap-2 px-5 py-2.5 bg-slate-100 border-b border-slate-200 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'info' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>1. Overview & Pricing</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('curriculum')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'curriculum' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2. Video Curriculum ({editingCourse.modules?.length || 0} Mods)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('assessment')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'assessment' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>3. Proctored Quiz ({editingCourse.assessment?.questions?.length || 15} Qs)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('certificate')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'certificate' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>4. Certificate Rules & PDF Preview</span>
              </button>
            </div>

            {/* Tab Body Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800">
              
              {/* TAB 1: Course Info & Pricing */}
              {activeTab === 'info' && (
                <div className="space-y-6 animate-in fade-in">
                  
                  {/* Basic Titles */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-teal-700" />
                      <span>Course Title & Multilingual Metadata</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Course Title (English) *</label>
                        <input
                          type="text"
                          required
                          value={editingCourse.title || ''}
                          onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                          placeholder="e.g. Modern Full-Stack Web Development & Cloud"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-teal-600"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Course Title (हिन्दी)</label>
                        <input
                          type="text"
                          value={editingCourse.titleHi || ''}
                          onChange={(e) => setEditingCourse({ ...editingCourse, titleHi: e.target.value })}
                          placeholder="उदा. आधुनिक फुल-स्टैक वेब डेवलपमेंट"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-teal-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Category</label>
                        <select
                          value={editingCourse.category || 'IT'}
                          onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-teal-600"
                        >
                          <option value="IT">IT & Software</option>
                          <option value="Non-IT">Non-IT & Operations</option>
                          <option value="Business">Business & Sales</option>
                          <option value="Healthcare">Healthcare & Life Sciences</option>
                          <option value="Blue Collar">Blue Collar & Technical</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Subcategory</label>
                        <input
                          type="text"
                          value={editingCourse.subcategory || ''}
                          onChange={(e) => setEditingCourse({ ...editingCourse, subcategory: e.target.value })}
                          placeholder="e.g. Frontend Engineering, Data Analytics"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-teal-600"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Skill Level</label>
                        <select
                          value={editingCourse.level || 'Beginner'}
                          onChange={(e) => setEditingCourse({ ...editingCourse, level: e.target.value as any })}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-teal-600"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Course Description (English) *</label>
                        <textarea
                          rows={3}
                          required
                          value={editingCourse.description || ''}
                          onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                          placeholder="Detailed syllabus outline and target audience..."
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 leading-relaxed focus:border-teal-600"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Course Description (हिन्दी)</label>
                        <textarea
                          rows={3}
                          value={editingCourse.descriptionHi || ''}
                          onChange={(e) => setEditingCourse({ ...editingCourse, descriptionHi: e.target.value })}
                          placeholder="पाठ्यक्रम का विवरण हिन्दी में..."
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 leading-relaxed focus:border-teal-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Estimated Duration (Hours)</label>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={editingCourse.durationHours ?? 10}
                          onChange={(e) => setEditingCourse({ ...editingCourse, durationHours: Number(e.target.value) })}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-teal-600"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Thumbnail Cover Image URL</label>
                        <input
                          type="url"
                          value={editingCourse.thumbnailUrl || ''}
                          onChange={(e) => setEditingCourse({ ...editingCourse, thumbnailUrl: e.target.value })}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-teal-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Course Pricing & Monetization */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-700" />
                      <span>Access & Monetization Model</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                        <label className="font-bold text-slate-800 block">Course Access Type</label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="accessType"
                              checked={editingCourse.accessType !== 'paid' && !editingCourse.isPaid}
                              onChange={() => setEditingCourse({ ...editingCourse, accessType: 'free', isPaid: false, coursePrice: 0, price: 0 })}
                              className="text-teal-600"
                            />
                            <span className="font-semibold text-slate-800">100% Free Course</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="accessType"
                              checked={editingCourse.accessType === 'paid' || Boolean(editingCourse.isPaid)}
                              onChange={() => setEditingCourse({ ...editingCourse, accessType: 'paid', isPaid: true, coursePrice: 499, price: 499 })}
                              className="text-teal-600"
                            />
                            <span className="font-semibold text-slate-800">Paid Course</span>
                          </label>
                        </div>

                        {(editingCourse.accessType === 'paid' || editingCourse.isPaid) && (
                          <div className="pt-2 animate-in fade-in">
                            <label className="font-bold text-slate-700 block mb-1">Course Price (INR ₹)</label>
                            <input
                              type="number"
                              min={1}
                              value={editingCourse.coursePrice || editingCourse.price || 499}
                              onChange={(e) => setEditingCourse({ ...editingCourse, coursePrice: Number(e.target.value), price: Number(e.target.value) })}
                              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                            />
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                        <label className="font-bold text-slate-800 block">Certificate Issuance Fee</label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="certificateFeeType"
                              checked={editingCourse.certificateFeeType !== 'paid' && !editingCourse.isCertificatePaid}
                              onChange={() => setEditingCourse({ ...editingCourse, certificateFeeType: 'free', isCertificatePaid: false, certificatePrice: 0 })}
                              className="text-teal-600"
                            />
                            <span className="font-semibold text-slate-800">Free Verified Certificate</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="certificateFeeType"
                              checked={editingCourse.certificateFeeType === 'paid' || Boolean(editingCourse.isCertificatePaid)}
                              onChange={() => setEditingCourse({ ...editingCourse, certificateFeeType: 'paid', isCertificatePaid: true, certificatePrice: 199 })}
                              className="text-teal-600"
                            />
                            <span className="font-semibold text-slate-800">Paid Certificate Fee</span>
                          </label>
                        </div>

                        {(editingCourse.certificateFeeType === 'paid' || editingCourse.isCertificatePaid) && (
                          <div className="pt-2 animate-in fade-in">
                            <label className="font-bold text-slate-700 block mb-1">Certificate Fee (INR ₹)</label>
                            <input
                              type="number"
                              min={1}
                              value={editingCourse.certificatePrice || 199}
                              onChange={(e) => setEditingCourse({ ...editingCourse, certificatePrice: Number(e.target.value) })}
                              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skills Taught */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                    <label className="font-bold text-slate-800 block">Skills Taught & Competencies (comma separated)</label>
                    <input
                      type="text"
                      value={editingCourse.skillsTaught?.join(', ') || ''}
                      onChange={(e) => setEditingCourse({
                        ...editingCourse,
                        skillsTaught: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="e.g. React.js, TypeScript, REST APIs, SQL, System Design"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-teal-600"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {editingCourse.skillsTaught?.map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-teal-100 text-teal-800 rounded-lg text-[11px] font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Publication status */}
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <h5 className="font-black text-teal-950 text-xs">Catalog Publication Status</h5>
                      <p className="text-[11px] text-teal-800">
                        {editingCourse.isPublished ? 'This course is visible to all candidates on the LMS.' : 'This course is currently in draft mode.'}
                      </p>
                    </div>

                    <label className="flex items-center gap-2 font-bold text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editingCourse.isPublished)}
                        onChange={(e) => setEditingCourse({ ...editingCourse, isPublished: e.target.checked })}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                      <span>{editingCourse.isPublished ? 'Published' : 'Draft'}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: Curriculum & Video Modules */}
              {activeTab === 'curriculum' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-slate-900">Curriculum & Video Lesson Manager</h4>
                      <p className="text-[11px] text-slate-500">Organize modules, YouTube streams, uploaded MP4s, and duration timings</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddModule}
                      className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Module</span>
                    </button>
                  </div>

                  {/* Modules List */}
                  <div className="space-y-4">
                    {(!editingCourse.modules || editingCourse.modules.length === 0) ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                        <BookOpen className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                        <p className="font-bold text-slate-700">No modules yet</p>
                        <button
                          onClick={handleAddModule}
                          className="mt-2 px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          + Add First Module
                        </button>
                      </div>
                    ) : (
                      editingCourse.modules.map((mod, modIdx) => (
                        <div key={mod.id} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                          {/* Module Header */}
                          <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                              <span className="w-6 h-6 rounded-lg bg-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {modIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={mod.title}
                                onChange={(e) => {
                                  const updated = [...editingCourse.modules];
                                  updated[modIdx] = { ...updated[modIdx], title: e.target.value };
                                  setEditingCourse({ ...editingCourse, modules: updated });
                                }}
                                className="font-bold text-xs sm:text-sm text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-300 w-full max-w-md focus:border-teal-600"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingLesson({ moduleId: mod.id, lesson: { durationMinutes: 10, isPublished: true }, isNewLesson: true })}
                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Lesson</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteModule(mod.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                                title="Delete Module"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Lessons in Module */}
                          <div className="p-4 space-y-2">
                            {(!mod.lessons || mod.lessons.length === 0) ? (
                              <p className="text-xs text-slate-400 italic py-2 text-center">No lessons added to this module yet.</p>
                            ) : (
                              mod.lessons.map((les, lesIdx) => (
                                <div key={les.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2 hover:border-teal-300 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                                      {les.videoSource === 'youtube' ? <Youtube className="w-4 h-4 text-red-600" /> : <Video className="w-4 h-4" />}
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-slate-900 text-xs">{les.title}</h5>
                                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                        <span>{les.durationMinutes} mins</span>
                                        <span>•</span>
                                        <span className="font-mono text-teal-700 truncate max-w-[200px]">{les.videoUrl}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingLesson({ moduleId: mod.id, lesson: les, isNewLesson: false })}
                                      className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                      title="Edit Lesson"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLesson(mod.id, les.id)}
                                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                      title="Delete Lesson"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Proctored Assessment Studio (15 Questions, 5 Mins, 80% passing) */}
              {activeTab === 'assessment' && (
                <div className="space-y-6 animate-in fade-in">
                  
                  {/* Quiz Settings Header */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-teal-700" />
                          <span>Proctored Certification Assessment Configuration</span>
                        </h4>
                        <p className="text-[11px] text-slate-500">15 Industry-standard questions, 5-minute timed test, 80% passing threshold for verified certificate unlock.</p>
                      </div>

                      <button
                        type="button"
                        onClick={handlePopulate15Questions}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Populate Standard 15 Questions</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Time Limit (Minutes)</label>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={editingCourse.assessment?.timeLimitMinutes ?? 5}
                          onChange={(e) => setEditingCourse({
                            ...editingCourse,
                            assessment: {
                              ...(editingCourse.assessment as CourseAssessment),
                              timeLimitMinutes: Number(e.target.value)
                            }
                          })}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:border-teal-600"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Passing Benchmark (%) *</label>
                        <input
                          type="number"
                          min={50}
                          max={100}
                          value={editingCourse.assessment?.passingPercentage ?? 80}
                          onChange={(e) => setEditingCourse({
                            ...editingCourse,
                            passingPercentage: Number(e.target.value),
                            assessment: {
                              ...(editingCourse.assessment as CourseAssessment),
                              passingPercentage: Number(e.target.value)
                            }
                          })}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-emerald-800 focus:border-teal-600"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Total Marks</label>
                        <input
                          type="number"
                          readOnly
                          value={editingCourse.assessment?.questions?.reduce((acc, q) => acc + (q.marks || 1), 0) || 15}
                          className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Max Retake Attempts</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={editingCourse.assessment?.maxAttempts ?? 3}
                          onChange={(e) => setEditingCourse({
                            ...editingCourse,
                            assessment: {
                              ...(editingCourse.assessment as CourseAssessment),
                              maxAttempts: Number(e.target.value)
                            }
                          })}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:border-teal-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-black text-xs text-slate-900">
                        Exam Questions ({editingCourse.assessment?.questions?.length || 0})
                      </h5>

                      <button
                        type="button"
                        onClick={() => setEditingQuestion({
                          question: {
                            question: '',
                            options: ['', '', '', ''],
                            correctOptionIndex: 0,
                            marks: 1,
                            difficulty: 'Beginner'
                          },
                          index: editingCourse.assessment?.questions?.length || 0,
                          isNewQuestion: true
                        })}
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Question</span>
                      </button>
                    </div>

                    {(!editingCourse.assessment?.questions || editingCourse.assessment.questions.length === 0) ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                        <p className="text-xs text-slate-500">No questions in assessment quiz.</p>
                      </div>
                    ) : (
                      editingCourse.assessment.questions.map((q, qIdx) => (
                        <div key={q.id || qIdx} className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-300 transition-colors space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {qIdx + 1}
                              </span>
                              <div>
                                <h6 className="font-bold text-slate-900 text-xs sm:text-sm">{q.question}</h6>
                                {q.questionHi && (
                                  <p className="text-[11px] text-slate-500 mt-0.5">{q.questionHi}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                                {q.marks || 1} mark
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingQuestion({ question: q, index: qIdx, isNewQuestion: false })}
                                className="p-1 text-slate-500 hover:text-teal-700 rounded cursor-pointer"
                                title="Edit Question"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(qIdx)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                                title="Delete Question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Options grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-8">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className={`p-2 rounded-xl border text-xs flex items-center gap-2 ${
                                  q.correctOptionIndex === optIdx
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                                  q.correctOptionIndex === optIdx ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="flex-1 truncate">{opt}</span>
                                {q.correctOptionIndex === optIdx && (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: Certificate Settings & Live PDF Preview */}
              {activeTab === 'certificate' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-teal-700" />
                      <span>Official Verified Certificate & Credential Generation Rules</span>
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Upon completing all course modules and scoring ≥{editingCourse.passingPercentage || 80}% on the proctored assessment, candidates are automatically awarded an official KarMetra Certificate featuring an online verification QR code, unique Credential ID, and PAN-India credential validation.
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          await generateCertificatePDF({
                            candidateName: 'Dr. Arjun Verma',
                            courseTitle: editingCourse.title || 'Professional Certification',
                            verificationCode: `KM-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                            issueDate: new Date().toISOString().split('T')[0],
                            scorePercentage: editingCourse.passingPercentage || 80,
                            scoreMarks: 12,
                            totalMarks: 15,
                            skills: editingCourse.skillsTaught || [editingCourse.title || 'Certified Skills'],
                            status: 'ACTIVE & VALID'
                          });
                        }}
                        className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Generate & Test Official Certificate PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleSaveCourse()}
                disabled={submitting}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Saving Course...' : 'Save & Update LMS'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Video Lesson Sub-Modal */}
      {editingLesson && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 my-8">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Video className="w-4 h-4 text-teal-400" />
                <span>{editingLesson.isNewLesson ? 'Add Video Lesson' : 'Edit Video Lesson'}</span>
              </h4>
              <button onClick={() => setEditingLesson(null)} className="p-1 text-slate-400 hover:text-white rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lesson Title (English) *</label>
                <input
                  type="text"
                  required
                  value={editingLesson.lesson.title || ''}
                  onChange={(e) => setEditingLesson({
                    ...editingLesson,
                    lesson: { ...editingLesson.lesson, title: e.target.value }
                  })}
                  placeholder="e.g. Lesson 1.1: Foundations & Architecture"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-teal-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Video Source & URL *</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingLesson({
                        ...editingLesson,
                        lesson: { ...editingLesson.lesson, videoSource: 'youtube' }
                      })}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 ${
                        editingLesson.lesson.videoSource === 'youtube' || !editingLesson.lesson.videoSource
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      <span>YouTube URL</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingLesson({
                        ...editingLesson,
                        lesson: { ...editingLesson.lesson, videoSource: 'url' }
                      })}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 ${
                        editingLesson.lesson.videoSource === 'url'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>MP4 / Stream URL</span>
                    </button>

                    <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingVideo ? `Uploading (${uploadProgress}%)` : 'Upload MP4'}</span>
                      <input type="file" accept="video/mp4,video/webm" onChange={handleVideoFileUpload} className="hidden" />
                    </label>
                  </div>

                  <input
                    type="url"
                    required
                    value={editingLesson.lesson.videoUrl || ''}
                    onChange={(e) => setEditingLesson({
                      ...editingLesson,
                      lesson: { ...editingLesson.lesson, videoUrl: e.target.value }
                    })}
                    placeholder="https://www.youtube.com/watch?v=... or https://example.com/video.mp4"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Video Preview in Lesson Editor */}
              {editingLesson.lesson.videoUrl && (
                <div className="p-3 bg-slate-900 rounded-2xl space-y-2">
                  <span className="text-[10px] font-bold text-teal-300 uppercase">Live Player Preview</span>
                  <div className="rounded-xl overflow-hidden aspect-video">
                    <CourseVideoPlayer
                      videoUrl={editingLesson.lesson.videoUrl}
                      title={editingLesson.lesson.title || 'Preview'}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingLesson.lesson.durationMinutes ?? 15}
                    onChange={(e) => setEditingLesson({
                      ...editingLesson,
                      lesson: { ...editingLesson.lesson, durationMinutes: Number(e.target.value) }
                    })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="les-published"
                    checked={editingLesson.lesson.isPublished !== false}
                    onChange={(e) => setEditingLesson({
                      ...editingLesson,
                      lesson: { ...editingLesson.lesson, isPublished: e.target.checked }
                    })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <label htmlFor="les-published" className="font-bold text-slate-800">
                    Published
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingLesson(null)}
                className="px-4 py-2 bg-white text-slate-700 rounded-xl font-bold text-xs border border-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLesson}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
              >
                Save Lesson
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Assessment Question Sub-Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 my-8">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-teal-400" />
                <span>{editingQuestion.isNewQuestion ? 'Add Exam Question' : 'Edit Exam Question'}</span>
              </h4>
              <button onClick={() => setEditingQuestion(null)} className="p-1 text-slate-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Question (English) *</label>
                <textarea
                  rows={2}
                  required
                  value={editingQuestion.question.question || ''}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question: { ...editingQuestion.question, question: e.target.value }
                  })}
                  placeholder="Enter the assessment question text..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-teal-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Question (हिन्दी)</label>
                <textarea
                  rows={2}
                  value={editingQuestion.question.questionHi || ''}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question: { ...editingQuestion.question, questionHi: e.target.value }
                  })}
                  placeholder="प्रश्न हिन्दी में..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-teal-600"
                />
              </div>

              {/* 4 Options & Correct Answer Selector */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">4 Options (Select radio to set correct answer) *</label>
                {[0, 1, 2, 3].map((optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={editingQuestion.question.correctOptionIndex === optIdx}
                      onChange={() => setEditingQuestion({
                        ...editingQuestion,
                        question: { ...editingQuestion.question, correctOptionIndex: optIdx }
                      })}
                      className="w-4 h-4 text-teal-600"
                      title="Mark as correct answer"
                    />
                    <span className="w-5 font-bold text-slate-500 text-center">{String.fromCharCode(65 + optIdx)}</span>
                    <input
                      type="text"
                      required
                      value={editingQuestion.question.options?.[optIdx] || ''}
                      onChange={(e) => {
                        const opts = [...(editingQuestion.question.options || ['', '', '', ''])];
                        opts[optIdx] = e.target.value;
                        setEditingQuestion({
                          ...editingQuestion,
                          question: { ...editingQuestion.question, options: opts }
                        });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                      className="flex-1 p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={editingQuestion.question.marks ?? 1}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, marks: Number(e.target.value) }
                    })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={editingQuestion.question.difficulty || 'Beginner'}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, difficulty: e.target.value as any }
                    })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Explanation for Answer</label>
                <input
                  type="text"
                  value={editingQuestion.question.explanation || ''}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question: { ...editingQuestion.question, explanation: e.target.value }
                  })}
                  placeholder="Rationale explaining why the selected option is correct..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 bg-white text-slate-700 rounded-xl font-bold text-xs border border-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuestion}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Live Preview Modal */}
      {previewingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 my-4 max-h-[92vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 text-[10px] font-extrabold rounded">CANDIDATE VIEW PREVIEW</span>
                <h4 className="font-bold text-sm text-white">{previewingCourse.title}</h4>
              </div>
              <button onClick={() => setPreviewingCourse(null)} className="p-1 text-slate-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {previewActiveLesson ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-8 space-y-3">
                    <CourseVideoPlayer
                      videoUrl={previewActiveLesson.videoUrl}
                      title={previewActiveLesson.title}
                    />
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 text-sm">{previewActiveLesson.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{previewActiveLesson.description}</p>
                    </div>
                  </div>

                  <div className="lg:col-span-4 bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                    <h5 className="font-bold text-xs text-slate-900">Curriculum Lessons</h5>
                    <div className="space-y-2">
                      {previewingCourse.modules?.map(m => (
                        <div key={m.id} className="space-y-1">
                          <span className="text-[11px] font-bold text-teal-800">{m.title}</span>
                          {m.lessons?.map(l => (
                            <button
                              key={l.id}
                              onClick={() => setPreviewActiveLesson(l)}
                              className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                                previewActiveLesson.id === l.id ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                              }`}
                            >
                              <span className="truncate">{l.title}</span>
                              <span className="text-[10px] shrink-0 ml-1">{l.durationMinutes}m</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center">No lessons available to preview.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
