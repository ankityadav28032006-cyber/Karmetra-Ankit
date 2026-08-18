import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Globe, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Save, 
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { EmployerProfile } from '../../types';

export const EmployerProfileView: React.FC = () => {
  const { employerProfile, updateEmployerState } = useAuth();
  const { language } = useLanguage();

  const [formData, setFormData] = useState<Partial<EmployerProfile>>({
    companyName: '',
    industry: 'Information Technology',
    companySize: '50-200',
    website: '',
    contactEmail: '',
    city: '',
    state: '',
    address: '',
    gstin: '',
    panNumber: '',
    description: ''
  });

  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (employerProfile) {
      setFormData(employerProfile);
    }
  }, [employerProfile]);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingDoc(true);
      try {
        const res = await api.uploadEmployerDoc(file, docType);
        if (res.profile) {
          updateEmployerState(res.profile);
        }
        alert(`${docType} document uploaded for admin trust verification!`);
      } catch (err: any) {
        alert(err.message || 'Upload failed');
      } finally {
        setUploadingDoc(false);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await api.updateEmployerProfile(formData);
      if (res.profile) {
        updateEmployerState(res.profile);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save company profile');
    } finally {
      setSaving(false);
    }
  };

  const isVerified = employerProfile?.verificationStatus === 'verified';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
            {formData.companyName?.charAt(0) || 'E'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">{formData.companyName || 'Company Profile'}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {employerProfile?.verificationStatus || 'unverified'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{formData.industry} • {formData.city}, {formData.state}</p>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Profile'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Company profile updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
        
        {/* Basic Company Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Company Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Company Legal Name *</label>
              <input
                type="text"
                required
                value={formData.companyName || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Industry Sector</label>
              <select
                value={formData.industry || 'Information Technology'}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option>Information Technology</option>
                <option>Financial Services & Banking</option>
                <option>Manufacturing & Logistics</option>
                <option>Healthcare & Biotech</option>
                <option>Retail & E-Commerce</option>
                <option>Construction & Engineering</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Company Website</label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Official Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail || ''}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="careers@company.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Location & Tax Identifiers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            <span>Headquarters & Registration Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">City *</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">State *</label>
              <input
                type="text"
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">GSTIN Number (15 Digits)</label>
              <input
                type="text"
                maxLength={15}
                value={formData.gstin || ''}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="29AAAAA0000A1Z5"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Company PAN (10 Digits)</label>
              <input
                type="text"
                maxLength={10}
                value={formData.panNumber || ''}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Verification Document Uploads */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Trust Verification Documents</span>
            </h3>
            <span className="text-[10px] font-bold text-teal-700">Reviewed by Admin Moderation Desk</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* GST Doc */}
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
              <FileCheck className="w-6 h-6 text-teal-600 mx-auto" />
              <p className="font-bold text-slate-800 text-xs">GST Registration Certificate</p>
              <label className="inline-block px-3 py-1.5 bg-teal-50 text-teal-800 rounded-lg font-bold cursor-pointer hover:bg-teal-100 transition-colors">
                <span>{uploadingDoc ? 'Uploading...' : 'Upload GST PDF'}</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg"
                  onChange={(e) => handleDocumentUpload(e, 'GST_CERTIFICATE')}
                  className="hidden"
                />
              </label>
            </div>

            {/* Incorporation Doc */}
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
              <FileCheck className="w-6 h-6 text-teal-600 mx-auto" />
              <p className="font-bold text-slate-800 text-xs">Certificate of Incorporation / PAN</p>
              <label className="inline-block px-3 py-1.5 bg-teal-50 text-teal-800 rounded-lg font-bold cursor-pointer hover:bg-teal-100 transition-colors">
                <span>{uploadingDoc ? 'Uploading...' : 'Upload Incorporation PDF'}</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg"
                  onChange={(e) => handleDocumentUpload(e, 'INCORPORATION')}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Company Profile</span>
        </button>
      </form>
    </div>
  );
};
