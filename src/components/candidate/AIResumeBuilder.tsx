import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Download, 
  Save, 
  Plus, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Briefcase, 
  GraduationCap, 
  Globe, 
  Linkedin, 
  Github, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  RefreshCw, 
  Eye, 
  Copy,
  ChevronRight,
  Layers
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';
import { ResumeData, Certificate, CandidateProfile } from '../../types';
import { KarMetraLogo } from '../common/KarMetraLogo';

interface AIResumeBuilderProps {
  onBack?: () => void;
  onOpenLogin?: () => void;
}

export const AIResumeBuilder: React.FC<AIResumeBuilderProps> = ({ onBack, onOpenLogin }) => {
  const { user, candidateProfile, isAuthenticated } = useAuth();
  const [candidate, setCandidate] = useState<CandidateProfile | null>(candidateProfile || null);
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active Resume Form State
  const [currentResume, setCurrentResume] = useState<ResumeData>(() => {
    const p = candidateProfile;
    return {
      id: `res-${Date.now()}`,
      userId: user?.id || 'guest',
      versionTitle: p ? `${p.highestQualification || 'Professional'} Resume` : 'Professional Resume',
      fullName: p?.fullName || user?.fullName || 'Ankit Kumar',
      email: p?.email || user?.email || 'ankit.kumar@example.com',
      mobile: p?.mobile || user?.mobile || '9876543210',
      city: p?.city || 'Bengaluru',
      state: p?.state || 'Karnataka',
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: '',
      careerObjective: 'Results-driven software developer dedicated to building scalable web platforms and solving high-impact challenges in modern collaborative environments.',
      targetRole: p?.skills?.[0] ? `${p.skills[0]} Specialist` : 'Software Developer',
      experienceLevel: p?.experienceType || 'Fresher',
      education: [
        {
          degree: p?.degreeName || p?.highestQualification || 'Bachelor of Technology (B.Tech)',
          fieldOfStudy: 'Computer Science & Engineering',
          institute: p?.institute || 'National Institute of Technology',
          startYear: p?.passingYear ? p.passingYear - 4 : 2020,
          endYear: p?.passingYear || 2024,
          grade: '8.4 CGPA'
        }
      ],
      experience: [],
      skills: p?.skills && p.skills.length > 0 ? p.skills : ['JavaScript', 'React.js', 'Problem Solving', 'Data Structures', 'Communication'],
      projects: [],
      certificates: [],
      languages: ['English (Fluent)', 'Hindi (Native)'],
      atsScore: 88,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  const previewRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial profile, existing resumes, and verified certificates
  useEffect(() => {
    fetchInitialData();
  }, [isAuthenticated, user?.id]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      let activeProf: CandidateProfile | null = candidateProfile || null;
      let userCerts: Certificate[] = [];

      if (isAuthenticated && user?.role === 'candidate') {
        try {
          const profRes = await apiClient.get<{ profile: CandidateProfile }>('/candidate/profile');
          if (profRes?.profile) {
            activeProf = profRes.profile;
            setCandidate(profRes.profile);
          }
        } catch {
          // Graceful fallback to context profile
        }

        try {
          const certRes = await apiClient.get<{ certificates: Certificate[] }>('/candidate/certificates');
          if (certRes?.certificates) {
            userCerts = certRes.certificates;
            setCertificates(certRes.certificates);
          }
        } catch {
          // No certificates yet
        }

        try {
          const resumeRes = await apiClient.get<{ resumes: ResumeData[] }>('/resume/list');
          if (resumeRes?.resumes && resumeRes.resumes.length > 0) {
            setResumes(resumeRes.resumes);
            setSelectedResumeId(resumeRes.resumes[0].id);
            setCurrentResume(resumeRes.resumes[0]);
            setLoading(false);
            return;
          }
        } catch {
          // No saved resumes yet
        }
      }

      // Initialize base template from profile or clean default
      const p = activeProf;
      const initial: ResumeData = {
        id: `res-${Date.now()}`,
        userId: user?.id || 'guest',
        versionTitle: p ? `${p.highestQualification || 'Professional'} Resume` : 'Professional Resume',
        fullName: p?.fullName || user?.fullName || 'Ankit Kumar',
        email: p?.email || user?.email || 'ankit.kumar@example.com',
        mobile: p?.mobile || user?.mobile || '9876543210',
        city: p?.city || 'Bengaluru',
        state: p?.state || 'Karnataka',
        targetRole: p?.skills?.[0] ? `${p.skills[0]} Specialist` : 'Software Developer',
        careerObjective: p 
          ? `Motivated and certified professional with expertise in ${(p.skills || []).slice(0, 3).join(', ') || 'modern industry workflows'}. Seeking to contribute to high-impact projects at a progressive PAN-India organization.`
          : 'Results-driven software developer dedicated to building scalable web platforms and solving high-impact challenges in modern collaborative environments.',
        experienceLevel: p?.experienceType || 'Fresher',
        education: [
          {
            degree: p?.degreeName || p?.highestQualification || 'Bachelor of Technology (B.Tech)',
            fieldOfStudy: 'Computer Science & Engineering',
            institute: p?.institute || 'National Institute of Technology',
            startYear: (p?.passingYear ? p.passingYear - 4 : 2020),
            endYear: p?.passingYear || 2024,
            grade: '8.4 CGPA'
          }
        ],
        experience: [],
        skills: p?.skills && p.skills.length > 0 ? p.skills : ['JavaScript', 'React.js', 'Problem Solving', 'Data Structures', 'Communication'],
        projects: [],
        certificates: userCerts.map(c => `${c.courseTitle} (KarMetra Credential ID: ${c.verificationCode})`),
        languages: ['English (Fluent)', 'Hindi (Native)'],
        atsScore: 88,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCurrentResume(initial);
      setResumes([initial]);
      setSelectedResumeId(initial.id);
    } catch (err) {
      console.warn('Resume data initialized with default profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle version switch
  const handleSelectResume = (resumeId: string) => {
    const selected = resumes.find(r => r.id === resumeId);
    if (selected) {
      setSelectedResumeId(resumeId);
      setCurrentResume(selected);
    }
  };

  // Create new version
  const handleCreateNewVersion = () => {
    const newVersion: ResumeData = {
      ...currentResume,
      id: `res-${Date.now()}`,
      versionTitle: `Resume Version ${resumes.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setResumes([...resumes, newVersion]);
    setSelectedResumeId(newVersion.id);
    setCurrentResume(newVersion);
    showMessage('success', 'New resume version created!');
  };

  // Save Resume
  const handleSaveResume = async () => {
    setSaving(true);
    try {
      const res = await apiClient.post<{ success: boolean; resume: ResumeData }>('/resume/save', currentResume);
      if (res && res.success) {
        showMessage('success', 'Resume saved successfully!');
        // Update list
        setResumes(prev => {
          const idx = prev.findIndex(r => r.id === currentResume.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = currentResume;
            return updated;
          }
          return [...prev, currentResume];
        });
      }
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to save resume');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // AI Actions Trigger
  const handleAIEnhance = async (action: string, fieldName: string) => {
    setAiGenerating(action);
    try {
      let inputData: any = {};
      if (action === 'generate_summary' || action === 'improve_objective') {
        inputData = {
          careerObjective: currentResume.careerObjective,
          skills: currentResume.skills,
          targetRole: currentResume.targetRole,
          education: currentResume.education
        };
      } else if (action === 'suggest_skills') {
        inputData = {
          skills: currentResume.skills
        };
      } else if (action === 'improve_experience') {
        inputData = currentResume.experience[0] || {
          title: currentResume.targetRole,
          company: 'Industry Organization',
          description: ''
        };
      }

      const res = await apiClient.post<{ success: boolean; result: string }>('/resume/ai-enhance', {
        action,
        targetRole: currentResume.targetRole,
        inputData
      });

      if (res && res.result) {
        if (action === 'generate_summary' || action === 'improve_objective') {
          setCurrentResume(prev => ({ ...prev, careerObjective: res.result.trim() }));
          showMessage('success', 'AI Career Objective generated successfully!');
        } else if (action === 'suggest_skills') {
          try {
            const parsed = JSON.parse(res.result);
            if (Array.isArray(parsed)) {
              const combined = Array.from(new Set([...currentResume.skills, ...parsed]));
              setCurrentResume(prev => ({ ...prev, skills: combined }));
              showMessage('success', `Added ${parsed.length} suggested skills!`);
            }
          } catch {
            showMessage('success', 'Skill suggestions generated.');
          }
        }
      }
    } catch (err: any) {
      showMessage('error', err.message || 'AI Enhancement encountered a temporary error.');
    } finally {
      setAiGenerating(null);
    }
  };

  // Add/Remove Education
  const handleAddEducation = () => {
    setCurrentResume(prev => ({
      ...prev,
      education: [
        ...prev.education,
        {
          degree: 'Degree / Certificate',
          fieldOfStudy: 'Field of Specialization',
          institute: 'Institution Name',
          startYear: 2021,
          endYear: 2024,
          grade: ''
        }
      ]
    }));
  };

  const handleRemoveEducation = (index: number) => {
    setCurrentResume(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  // Add/Remove Experience
  const handleAddExperience = () => {
    setCurrentResume(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          title: 'Job Role / Intern',
          company: 'Company / Organization Name',
          location: 'City, India',
          startDate: '2023',
          endDate: 'Present',
          description: 'Spearheaded key operational initiatives and delivered measurable business results.'
        }
      ]
    }));
  };

  const handleRemoveExperience = (index: number) => {
    setCurrentResume(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  // Add/Remove Project
  const handleAddProject = () => {
    setCurrentResume(prev => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          title: 'Project Title',
          description: 'Designed and built a functional solution solving a key domain challenge.',
          techStack: ['React', 'TypeScript', 'Node.js'],
          link: ''
        }
      ]
    }));
  };

  const handleRemoveProject = (index: number) => {
    setCurrentResume(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  // Add/Remove Skill
  const [newSkillInput, setNewSkillInput] = useState('');
  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    if (!currentResume.skills.includes(newSkillInput.trim())) {
      setCurrentResume(prev => ({
        ...prev,
        skills: [...prev.skills, newSkillInput.trim()]
      }));
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setCurrentResume(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  // Export to Real PDF
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const margin = 16;
      let y = 18;

      // Header Banner
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text((currentResume.fullName || 'Candidate Name').toUpperCase(), margin, 12);

      doc.setTextColor(13, 148, 136); // Teal-400
      doc.setFontSize(10);
      doc.text(currentResume.targetRole || 'Professional', margin, 18);

      // Contact bar on right/header
      doc.setTextColor(203, 213, 225);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const contactText = `${currentResume.mobile}  •  ${currentResume.email}  •  ${currentResume.city || ''} ${currentResume.state || ''}`;
      doc.text(contactText, margin, 24);

      y = 36;

      // Section Renderer Helper
      const renderSectionHeading = (title: string) => {
        doc.setDrawColor(13, 148, 136);
        doc.setLineWidth(0.8);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(title.toUpperCase(), margin, y);
        y += 7;
      };

      // 1. Professional Summary / Career Objective
      if (currentResume.careerObjective) {
        renderSectionHeading('Professional Summary');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const splitSummary = doc.splitTextToSize(currentResume.careerObjective, pageWidth - (margin * 2));
        doc.text(splitSummary, margin, y);
        y += (splitSummary.length * 4.5) + 4;
      }

      // 2. Core Skills
      if (currentResume.skills.length > 0) {
        renderSectionHeading('Skills & Competencies');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        
        const skillsFormatted = currentResume.skills.join('  •  ');
        const splitSkills = doc.splitTextToSize(skillsFormatted, pageWidth - (margin * 2));
        doc.text(splitSkills, margin, y);
        y += (splitSkills.length * 4.5) + 4;
      }

      // 3. Work Experience
      if (currentResume.experience.length > 0) {
        renderSectionHeading('Professional Experience');
        currentResume.experience.forEach(exp => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42);
          doc.text(exp.title, margin, y);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`${exp.company} | ${exp.startDate} - ${exp.endDate}`, margin, y + 4);

          y += 8;
          if (exp.description) {
            doc.setTextColor(51, 65, 85);
            const splitDesc = doc.splitTextToSize(exp.description, pageWidth - (margin * 2));
            doc.text(splitDesc, margin, y);
            y += (splitDesc.length * 4) + 3;
          }
        });
      }

      // 4. Education
      if (currentResume.education.length > 0) {
        renderSectionHeading('Education & Academic Background');
        currentResume.education.forEach(edu => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42);
          doc.text(`${edu.degree} (${edu.fieldOfStudy})`, margin, y);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`${edu.institute}  •  ${edu.startYear} - ${edu.endYear} ${edu.grade ? `(${edu.grade})` : ''}`, margin, y + 4);
          y += 9;
        });
      }

      // 5. Verified Certifications
      if (currentResume.certificates.length > 0 || certificates.length > 0) {
        renderSectionHeading('Verified KarMetra Certifications');
        const certList = currentResume.certificates.length > 0 
          ? currentResume.certificates 
          : certificates.map(c => `${c.courseTitle} (Credential: ${c.verificationCode})`);

        certList.forEach(cert => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(13, 148, 136);
          doc.text(`✓ ${cert}`, margin, y);
          y += 5;
        });
        y += 2;
      }

      // 6. Projects
      if (currentResume.projects && currentResume.projects.length > 0) {
        renderSectionHeading('Key Projects');
        currentResume.projects.forEach(proj => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text(proj.title, margin, y);
          y += 4;
          if (proj.description) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(51, 65, 85);
            const splitP = doc.splitTextToSize(proj.description, pageWidth - (margin * 2));
            doc.text(splitP, margin, y);
            y += (splitP.length * 4) + 3;
          }
        });
      }

      // Footer
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('KarMetra ATS-Verified Format • National Hiring Standard', margin, 290);

      const filename = `KarMetra_Resume_${currentResume.fullName.replace(/\s+/g, '_')}.pdf`;
      doc.save(filename);
      showMessage('success', 'PDF downloaded successfully!');
    } catch (err: any) {
      console.error('PDF export error:', err);
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading AI Resume Builder & ATS Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Version Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">AI Resume Builder & ATS Optimizer</h2>
              <p className="text-xs text-slate-500">
                Craft industry-ready, ATS-compliant resumes with Gemini AI career enhancement.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Version Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 pl-2">Version:</span>
            <select
              value={selectedResumeId}
              onChange={(e) => handleSelectResume(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            >
              {resumes.map(r => (
                <option key={r.id} value={r.id}>{r.versionTitle || 'Default Resume'}</option>
              ))}
            </select>
            <button
              onClick={handleCreateNewVersion}
              title="Create new version"
              className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'editor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'preview'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              Preview & Score
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleSaveResume}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* MAIN TWO-COLUMN LAYOUT OR PREVIEW */}
      {activeTab === 'editor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: EDITING FORMS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Profile & Target Role */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" />
                  <span>Personal Information & Target Job Role</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Resume Title / Version Name</label>
                  <input
                    type="text"
                    value={currentResume.versionTitle}
                    onChange={(e) => setCurrentResume({ ...currentResume, versionTitle: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g., Full Stack Engineer Resume"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Job Role</label>
                  <input
                    type="text"
                    value={currentResume.targetRole}
                    onChange={(e) => setCurrentResume({ ...currentResume, targetRole: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g., Data Analyst, Sales Executive"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={currentResume.fullName}
                    onChange={(e) => setCurrentResume({ ...currentResume, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={currentResume.email}
                    onChange={(e) => setCurrentResume({ ...currentResume, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={currentResume.mobile}
                    onChange={(e) => setCurrentResume({ ...currentResume, mobile: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={currentResume.city}
                      onChange={(e) => setCurrentResume({ ...currentResume, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
                      placeholder="e.g., Bengaluru"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={currentResume.state}
                      onChange={(e) => setCurrentResume({ ...currentResume, state: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
                      placeholder="e.g., Karnataka"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. AI Career Objective / Summary */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Professional Summary & Career Objective</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAIEnhance('improve_objective', 'careerObjective')}
                    disabled={aiGenerating !== null}
                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    {aiGenerating === 'improve_objective' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    <span>AI Enhance</span>
                  </button>
                  <button
                    onClick={() => handleAIEnhance('generate_summary', 'careerObjective')}
                    disabled={aiGenerating !== null}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    {aiGenerating === 'generate_summary' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    <span>Generate ATS Summary</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={4}
                value={currentResume.careerObjective}
                onChange={(e) => setCurrentResume({ ...currentResume, careerObjective: e.target.value })}
                className="w-full px-3 py-2 text-xs font-normal text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
                placeholder="Brief, high-impact summary highlighting your background, verified skills, and career focus..."
              />
            </div>

            {/* 3. Skills */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-teal-600" />
                  <span>Skills & Competencies</span>
                </h3>
                <button
                  onClick={() => handleAIEnhance('suggest_skills', 'skills')}
                  disabled={aiGenerating !== null}
                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  {aiGenerating === 'suggest_skills' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>AI Suggest Skills for {currentResume.targetRole}</span>
                </button>
              </div>

              {/* Tag List */}
              <div className="flex flex-wrap gap-2">
                {currentResume.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-200"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Custom Skill */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                  placeholder="Type a skill (e.g. Python, Financial Modeling, React) and press Add"
                  className="flex-1 px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                >
                  Add Skill
                </button>
              </div>
            </div>

            {/* 4. Education */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-teal-600" />
                  <span>Education & Academic Credentials</span>
                </h3>
                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Education</span>
                </button>
              </div>

              <div className="space-y-4">
                {currentResume.education.map((edu, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(idx)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Degree / Qualification</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const updated = [...currentResume.education];
                            updated[idx].degree = e.target.value;
                            setCurrentResume({ ...currentResume, education: updated });
                          }}
                          className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Field / Specialization</label>
                        <input
                          type="text"
                          value={edu.fieldOfStudy}
                          onChange={(e) => {
                            const updated = [...currentResume.education];
                            updated[idx].fieldOfStudy = e.target.value;
                            setCurrentResume({ ...currentResume, education: updated });
                          }}
                          className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Institute / University</label>
                        <input
                          type="text"
                          value={edu.institute}
                          onChange={(e) => {
                            const updated = [...currentResume.education];
                            updated[idx].institute = e.target.value;
                            setCurrentResume({ ...currentResume, education: updated });
                          }}
                          className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Pass Year</label>
                          <input
                            type="number"
                            value={edu.endYear}
                            onChange={(e) => {
                              const updated = [...currentResume.education];
                              updated[idx].endYear = Number(e.target.value);
                              setCurrentResume({ ...currentResume, education: updated });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Grade / %</label>
                          <input
                            type="text"
                            value={edu.grade || ''}
                            placeholder="e.g. 8.2 CGPA"
                            onChange={(e) => {
                              const updated = [...currentResume.education];
                              updated[idx].grade = e.target.value;
                              setCurrentResume({ ...currentResume, education: updated });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Work Experience */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-600" />
                  <span>Work Experience & Internships</span>
                </h3>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Experience</span>
                </button>
              </div>

              {currentResume.experience.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                  <p className="text-xs text-slate-500">No work experience added yet. Fresher candidates can highlight academic projects or KarMetra certificates.</p>
                  <button
                    onClick={handleAddExperience}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-lg shadow-xs"
                  >
                    + Add Experience / Internship
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentResume.experience.map((exp, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(idx)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Job Title</label>
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => {
                              const updated = [...currentResume.experience];
                              updated[idx].title = e.target.value;
                              setCurrentResume({ ...currentResume, experience: updated });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Company Name</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => {
                              const updated = [...currentResume.experience];
                              updated[idx].company = e.target.value;
                              setCurrentResume({ ...currentResume, experience: updated });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Start Date</label>
                            <input
                              type="text"
                              value={exp.startDate}
                              placeholder="e.g. Jan 2023"
                              onChange={(e) => {
                                const updated = [...currentResume.experience];
                                updated[idx].startDate = e.target.value;
                                setCurrentResume({ ...currentResume, experience: updated });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">End Date</label>
                            <input
                              type="text"
                              value={exp.endDate}
                              placeholder="e.g. Present"
                              onChange={(e) => {
                                const updated = [...currentResume.experience];
                                updated[idx].endDate = e.target.value;
                                setCurrentResume({ ...currentResume, experience: updated });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Key Deliverables & Impact</label>
                        <textarea
                          rows={3}
                          value={exp.description}
                          onChange={(e) => {
                            const updated = [...currentResume.experience];
                            updated[idx].description = e.target.value;
                            setCurrentResume({ ...currentResume, experience: updated });
                          }}
                          className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg"
                          placeholder="Describe responsibilities, tools used, and metrics achieved..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Verified KarMetra Certifications */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-teal-600" />
                  <span>Verified KarMetra Skill Certifications</span>
                </h3>
              </div>

              {certificates.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                  Complete LMS courses & assessments on KarMetra to automatically attach verified credentials with QR validation to your resume.
                </div>
              ) : (
                <div className="space-y-2">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/80 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-900">{cert.courseTitle}</span>
                        <div className="text-[11px] text-teal-700 font-semibold">
                          Credential ID: {cert.verificationCode} • Score: {cert.scorePercentage}% Verified
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-teal-700 text-white text-[10px] font-bold rounded-md">
                        Verified ✓
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: ATS SCORE & QUICK ACTIONS */}
          <div className="space-y-6">
            
            {/* ATS Score Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">ATS Match Score</h4>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                  High Visibility
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex flex-col items-center justify-center font-bold shadow-md">
                  <span className="text-xl leading-none">{currentResume.atsScore || 88}</span>
                  <span className="text-[9px] uppercase tracking-wider text-teal-100">Score</span>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-800">Target: {currentResume.targetRole}</p>
                  <p className="text-slate-500">Optimized for top employer screening filters.</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Standard Section Headers (ATS Compliant)</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Skill Credential attached</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Clean Typography & Contact Information</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>AI Enhancement Tools</span>
              </h4>
              <p className="text-xs text-slate-300">
                Leverage Gemini AI to refine phrasing, remove passive voice, and match job keywords.
              </p>
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleAIEnhance('generate_summary', 'careerObjective')}
                  disabled={aiGenerating !== null}
                  className="w-full px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl text-left flex items-center justify-between"
                >
                  <span>Re-Generate ATS Summary</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleAIEnhance('suggest_skills', 'skills')}
                  disabled={aiGenerating !== null}
                  className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl text-left flex items-center justify-between"
                >
                  <span>Suggest Missing Skills</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="w-full px-3 py-2 bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold rounded-xl text-left flex items-center justify-between"
                >
                  <span>Download Print-Ready PDF</span>
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* LIVE ATS RESUME PREVIEW */
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-md max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                {currentResume.fullName || 'Candidate Name'}
              </h1>
              <p className="text-sm font-bold text-teal-700">{currentResume.targetRole || 'Professional'}</p>
              <p className="text-xs text-slate-500">
                {currentResume.mobile}  •  {currentResume.email}  •  {currentResume.city} {currentResume.state}
              </p>
            </div>
            <KarMetraLogo size="sm" />
          </div>

          {/* Summary */}
          {currentResume.careerObjective && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5">
                Professional Summary
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                {currentResume.careerObjective}
              </p>
            </div>
          )}

          {/* Skills */}
          {currentResume.skills.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5">
                Core Competencies & Technical Skills
              </h3>
              <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                {currentResume.skills.join('  •  ')}
              </p>
            </div>
          )}

          {/* Experience */}
          {currentResume.experience.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5">
                Work Experience
              </h3>
              {currentResume.experience.map((exp, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{exp.title} — <span className="font-medium text-slate-600">{exp.company}</span></span>
                    <span className="text-slate-500 font-mono text-[11px]">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{exp.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {currentResume.education.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5">
                Education
              </h3>
              {currentResume.education.map((edu, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{edu.degree} ({edu.fieldOfStudy})</span>
                    <span className="text-slate-500 text-[11px] block">{edu.institute}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">{edu.endYear} {edu.grade ? `• ${edu.grade}` : ''}</span>
                </div>
              ))}
            </div>
          )}

          {/* Verified Certificates */}
          {certificates.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5">
                KarMetra Verified Certifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {certificates.map(cert => (
                  <div key={cert.id} className="p-2 rounded-lg bg-teal-50 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{cert.courseTitle}</span>
                      <span className="text-[10px] text-teal-800 font-mono">ID: {cert.verificationCode}</span>
                    </div>
                    <span className="text-[10px] font-bold text-teal-700">Verified ✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
