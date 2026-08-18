import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  FileText, 
  Upload, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  Trash2, 
  Save, 
  Navigation,
  Plus,
  X,
  Sparkles,
  QrCode,
  Camera,
  Loader2,
  Image as ImageIcon,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { CandidateProfile, Certificate } from '../../types';
import { ProfilePhotoUploader } from './ProfilePhotoUploader';
import { generateCertificatePDF, generateCandidateCVPDF } from '../../services/certificateService';

interface CandidateProfileProps {
  onOpenVerifyQR?: (code: string) => void;
  onOpenResumeBuilder?: () => void;
}

const COMMON_SKILLS = [
  'React.js', 'Node.js', 'Python', 'SQL', 'Data Analytics', 'Power BI', 
  'Advanced Excel', 'Full Stack Development', 'Sales & BD', 'Digital Marketing', 
  'Recruitment & HR', 'Customer Support', 'Electrician', 'CNC Operator', 'Supply Chain'
];

export const CandidateProfileView: React.FC<CandidateProfileProps> = ({ onOpenVerifyQR, onOpenResumeBuilder }) => {
  const { user, candidateProfile, updateCandidateState } = useAuth();
  const { language } = useLanguage();

  const [formData, setFormData] = useState<Partial<CandidateProfile>>({
    fullName: '',
    email: '',
    mobile: user?.mobile || '',
    avatarUrl: '',
    city: '',
    state: '',
    pincode: '',
    experienceYears: 0,
    currentSalary: 0,
    expectedSalary: 0,
    noticePeriodDays: 30,
    highestEducation: 'Graduate',
    skills: [],
    showContactOnlyAfterShortlist: true
  });

  const [newSkill, setNewSkill] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    if (candidateProfile) {
      setFormData({
        ...candidateProfile,
        mobile: candidateProfile.mobile || user?.mobile || ''
      });
    }

    if (user?.role === 'candidate') {
      api.getCandidateCertificates()
        .then(res => setCertificates(res.certificates || []))
        .catch(() => {});
    }
  }, [candidateProfile, user]);

  const handlePhotoUploaded = (avatarUrl: string) => {
    setFormData(prev => ({ ...prev, avatarUrl }));
    if (candidateProfile) {
      updateCandidateState({ ...candidateProfile, avatarUrl });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePhotoRemoved = () => {
    setFormData(prev => ({ ...prev, avatarUrl: '' }));
    if (candidateProfile) {
      updateCandidateState({ ...candidateProfile, avatarUrl: '' });
    }
  };

  const handleUseGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setFormData(prev => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }));
          alert(`Location GPS captured: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        err => {
          alert('Unable to capture location. Please check browser location permissions.');
        }
      );
    }
  };

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !formData.skills?.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), trimmed]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: (prev.skills || []).filter(s => s !== skill)
    }));
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      setUploadingResume(true);
      try {
        const res = await api.uploadResume(file);
        setFormData(prev => ({ ...prev, resumeUrl: res.resumeUrl }));
        alert('Resume uploaded successfully!');
      } catch (err: any) {
        alert(err.message || 'Upload failed');
      } finally {
        setUploadingResume(false);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await api.updateCandidateProfile(formData);
      if (res.profile) {
        updateCandidateState(res.profile);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner & Profile Photo Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="w-full lg:w-auto">
          <ProfilePhotoUploader
            currentAvatarUrl={formData.avatarUrl}
            fullName={formData.fullName || user?.fullName || 'Candidate'}
            onPhotoUploaded={handlePhotoUploaded}
            onPhotoRemoved={handlePhotoRemoved}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
          <button
            type="button"
            onClick={() => generateCandidateCVPDF(formData, undefined, certificates)}
            className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download formatted Candidate CV PDF"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Download CV</span>
          </button>

          {onOpenResumeBuilder && (
            <button
              type="button"
              onClick={onOpenResumeBuilder}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>AI Resume Builder</span>
            </button>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : (language === 'hi' ? 'परिवर्तन सहेजें' : 'Save Changes')}</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile and photo updated successfully!</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* 1. Basic Details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />
            <span>Basic Personal Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={formData.fullName || ''}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full p-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rahul.sharma@example.com"
                className="w-full p-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">City</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Bengaluru"
                className="w-full p-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">State</label>
              <input
                type="text"
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Karnataka"
                className="w-full p-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">
              GPS Location: {formData.latitude ? `${formData.latitude.toFixed(2)}, ${formData.longitude?.toFixed(2)}` : 'Not set'}
            </span>
            <button
              type="button"
              onClick={handleUseGPS}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-teal-600" />
              <span>Capture Device Location</span>
            </button>
          </div>
        </div>

        {/* 2. Professional & Skills */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-teal-600" />
            <span>Professional Skills & Experience</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Total Experience (Years)</label>
              <input
                type="number"
                min="0"
                max="40"
                value={formData.experienceYears || 0}
                onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                className="w-full p-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Expected Salary (₹/month)</label>
              <input
                type="number"
                value={formData.expectedSalary || 0}
                onChange={(e) => setFormData({ ...formData, expectedSalary: Number(e.target.value) })}
                className="w-full p-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Highest Education</label>
              <select
                value={formData.highestEducation || 'Graduate'}
                onChange={(e) => setFormData({ ...formData, highestEducation: e.target.value })}
                className="w-full p-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
              >
                <option value="10th Pass">10th Pass</option>
                <option value="12th Pass">12th Pass / ITI</option>
                <option value="Diploma">Diploma</option>
                <option value="Graduate">Graduate (B.A, B.Sc, B.Com, B.Tech, etc.)</option>
                <option value="Post Graduate">Post Graduate (M.Tech, MBA, M.Sc, etc.)</option>
              </select>
            </div>
          </div>

          {/* Skill Badges & Input */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5 text-xs">Skills & Competencies</label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {(formData.skills || []).map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-800 text-xs font-bold rounded-xl border border-teal-200"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-teal-600 hover:text-rose-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(newSkill); } }}
                placeholder="Type skill & press Add..."
                className="flex-1 p-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={() => handleAddSkill(newSkill)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* 3. Resume & AI Builder Integration */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Resume & CV Management</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => generateCandidateCVPDF(formData, undefined, certificates)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>Download CV (PDF)</span>
              </button>

              {onOpenResumeBuilder && (
                <button
                  type="button"
                  onClick={onOpenResumeBuilder}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Build ATS Resume with AI</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Upload PDF / DOCX Resume</p>
                <p className="text-[11px] text-slate-500">Supports standard ATS resume formats (Max 10MB)</p>
              </div>
              <label className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-teal-600" />
                <span>{uploadingResume ? 'Uploading...' : 'Choose File'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeChange}
                  className="hidden"
                />
              </label>
            </div>

            {formData.resumeUrl && (
              <div className="pt-2 flex items-center gap-2 text-xs text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Active Resume uploaded and verified on profile</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Verified KarMetra Certifications */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Verified KarMetra LMS Credentials</span>
          </h3>

          {certificates.length === 0 ? (
            <p className="text-xs text-slate-500">
              No certifications earned yet. Complete courses in the Skills tab to earn verified badges.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certificates.map(cert => (
                <div key={cert.id} className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900">{cert.courseTitle}</h4>
                    <p className="text-[10px] text-teal-700 font-mono">ID: {cert.verificationCode}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {onOpenVerifyQR && (
                      <button
                        type="button"
                        onClick={() => onOpenVerifyQR(cert.verificationCode)}
                        className="p-1.5 bg-white text-teal-700 hover:bg-teal-100 rounded-lg shadow-xs cursor-pointer"
                        title="View QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => generateCertificatePDF(cert)}
                      className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs cursor-pointer"
                      title="Download Official Certificate PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
