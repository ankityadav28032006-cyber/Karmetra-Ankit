import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Search, 
  Calendar, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  X, 
  Save, 
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { GovernmentVacancy } from '../../types';
import { govtJobService } from '../../services/govtJobService';

const INDIAN_STATES = [
  'All India',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi NCR'
];

const GOVT_JOB_TYPES = [
  'Central',
  'State',
  'PSU',
  'Banking',
  'Railway',
  'Defense',
  'Healthcare',
  'Teaching',
  'Police / Defense'
];

export const AdminGovtJobs: React.FC = () => {
  const [vacancies, setVacancies] = useState<GovernmentVacancy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [editingVacancy, setEditingVacancy] = useState<Partial<GovernmentVacancy> | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const token = localStorage.getItem('km_auth_token') || '';

  const loadVacancies = async () => {
    setLoading(true);
    try {
      const data = await govtJobService.getAllAdminGovtJobs(token);
      setVacancies(data);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load government jobs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVacancies();
  }, []);

  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    setEditingVacancy({
      title: '',
      titleHi: '',
      department: '',
      organization: '',
      jobType: 'Central',
      state: 'All India',
      totalVacancies: 100,
      qualificationRequired: '10th / 12th / Graduate',
      ageLimit: '18 - 30 Years',
      salaryScale: 'Level-4 (₹25,500 - ₹81,100)',
      applicationStartDate: today,
      applicationLastDate: nextMonth,
      examDate: 'To be notified',
      officialWebsiteUrl: 'https://',
      notificationPdfUrl: '',
      applyOnlineUrl: 'https://',
      status: 'Active',
      description: 'Official recruitment notice by Government authority. Apply directly on the official portal.',
      selectionProcess: '1. Computer Based Test (CBT)\n2. Skill / Trade Test\n3. Document Verification'
    });
  };

  const handleOpenEdit = (v: GovernmentVacancy) => {
    setEditingVacancy({ ...v });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVacancy || !editingVacancy.title?.trim() || !editingVacancy.department?.trim()) return;

    setSaving(true);
    setStatusMessage(null);
    try {
      await govtJobService.saveAdminGovtJob(editingVacancy, token);
      setStatusMessage({ type: 'success', text: `Vacancy "${editingVacancy.title}" saved successfully.` });
      setEditingVacancy(null);
      await loadVacancies();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save government vacancy' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete government vacancy "${title}"?`)) return;

    try {
      await govtJobService.deleteAdminGovtJob(id, token);
      setStatusMessage({ type: 'success', text: `Vacancy "${title}" removed.` });
      await loadVacancies();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete vacancy' });
    }
  };

  const filtered = vacancies.filter(v => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = v.title.toLowerCase().includes(q) || 
      v.department.toLowerCase().includes(q) || 
      v.organization.toLowerCase().includes(q);
    const matchesState = selectedState === 'All' || v.state === selectedState;
    const matchesStatus = selectedStatus === 'All' || v.status === selectedStatus;
    return matchesSearch && matchesState && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-amber-600" />
              Public Service Recruitment
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {vacancies.length} Vacancies Listed
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Government Job Vacancies Management</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Publish authentic government job notifications state-wise across Central, State, Railway, Defense, PSU, and Healthcare lines with official application portal links.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={loadVacancies}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex-1 md:flex-none px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Government Vacancy</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by role, department, or organization..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600 font-medium"
          />
        </div>

        <div>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600 font-medium"
          >
            <option value="All">All States / Regions</option>
            {INDIAN_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active (Open for Application)</option>
            <option value="Upcoming">Upcoming (Notification Released)</option>
            <option value="Closed">Closed / Completed</option>
          </select>
        </div>
      </div>

      {/* Vacancies List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading government vacancies...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-bold text-slate-600">No vacancies match your criteria</p>
          <p className="text-xs text-slate-400 mt-1">Adjust your filters or add a new government job vacancy.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((v) => (
            <div
              key={v.id}
              className="bg-white border border-slate-200 hover:border-teal-300 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all"
            >
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    v.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : v.status === 'Upcoming'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {v.status}
                  </span>

                  <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-200">
                    {v.jobType}
                  </span>

                  <span className="bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-600" />
                    {v.state}
                  </span>

                  <span className="text-[10px] font-bold text-slate-500">
                    {v.totalVacancies.toLocaleString()} Posts
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>{v.title}</span>
                    {v.titleHi && <span className="text-xs font-normal text-slate-500">({v.titleHi})</span>}
                  </h3>
                  <p className="text-xs font-bold text-teal-800">{v.department} • {v.organization}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-600 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Eligibility</span>
                    <span className="font-semibold">{v.qualificationRequired}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Age Limit</span>
                    <span className="font-semibold">{v.ageLimit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Pay Scale</span>
                    <span className="font-semibold">{v.salaryScale}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Last Date</span>
                    <span className="font-semibold text-red-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {v.applicationLastDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap md:flex-col items-center gap-2 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <a
                  href={v.applyOnlineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Portal</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(v)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(v.id, v.title)}
                    className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Add Modal */}
      {editingVacancy && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                  {editingVacancy.id ? 'Edit Vacancy' : 'New Government Notification'}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {editingVacancy.id ? editingVacancy.title : 'Publish Government Vacancy'}
                </h3>
              </div>
              <button
                onClick={() => setEditingVacancy(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Job Title / Post Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingVacancy.title || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, title: e.target.value })}
                    placeholder="e.g. Staff Nurse Recruitment 2026 / Assistant Station Master"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingVacancy.department || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, department: e.target.value })}
                    placeholder="e.g. AIIMS Delhi / Railway Recruitment Board (RRB)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Organization / Authority</label>
                  <input
                    type="text"
                    value={editingVacancy.organization || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, organization: e.target.value })}
                    placeholder="e.g. Ministry of Health & Family Welfare / Indian Railways"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Job Type / Sector</label>
                  <select
                    value={editingVacancy.jobType || 'Central'}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, jobType: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  >
                    {GOVT_JOB_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">State / Jurisdiction</label>
                  <select
                    value={editingVacancy.state || 'All India'}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, state: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  >
                    {INDIAN_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Vacancies (Openings)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingVacancy.totalVacancies || 1}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, totalVacancies: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recruitment Status</label>
                  <select
                    value={editingVacancy.status || 'Active'}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, status: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600 font-bold"
                  >
                    <option value="Active">Active (Accepting Applications)</option>
                    <option value="Upcoming">Upcoming (Notification Released)</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Minimum Education Qualification</label>
                  <input
                    type="text"
                    value={editingVacancy.qualificationRequired || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, qualificationRequired: e.target.value })}
                    placeholder="e.g. B.Sc Nursing / 12th Pass / Graduate in any discipline"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age Bracket</label>
                  <input
                    type="text"
                    value={editingVacancy.ageLimit || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, ageLimit: e.target.value })}
                    placeholder="e.g. 18 - 35 Years (Age relaxation applicable)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Salary / Pay Scale</label>
                  <input
                    type="text"
                    value={editingVacancy.salaryScale || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, salaryScale: e.target.value })}
                    placeholder="e.g. Pay Level-7 (₹44,900 - ₹1,42,400)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Application Last Date</label>
                  <input
                    type="date"
                    value={editingVacancy.applicationLastDate || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, applicationLastDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Official Apply URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={editingVacancy.applyOnlineUrl || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, applyOnlineUrl: e.target.value })}
                    placeholder="https://official-government-recruitment-portal.gov.in"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    * KarMetra connects candidates directly to authorized government recruitment portals. Never input third-party or unofficial URLs.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Notification PDF Link (Optional)</label>
                  <input
                    type="url"
                    value={editingVacancy.notificationPdfUrl || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, notificationPdfUrl: e.target.value })}
                    placeholder="https://official-site.gov.in/advt.pdf"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam Date / Timeline</label>
                  <input
                    type="text"
                    value={editingVacancy.examDate || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, examDate: e.target.value })}
                    placeholder="e.g. October 2026 / To be announced"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Selection Process Summary</label>
                  <textarea
                    rows={3}
                    value={editingVacancy.selectionProcess || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, selectionProcess: e.target.value })}
                    placeholder="1. Written Examination (CBT)\n2. Physical / Skill Test\n3. Interview\n4. Document Verification"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Description & Overview</label>
                  <textarea
                    rows={3}
                    value={editingVacancy.description || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, description: e.target.value })}
                    placeholder="Provide overview of post duties, category reservation quotas, and instructions for applicants..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingVacancy(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Publishing...' : 'Save Vacancy'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
