import React, { useState } from 'react';
import { 
  PlusCircle, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Award, 
  CheckCircle2, 
  Save, 
  Navigation,
  Sparkles,
  Plus,
  X,
  ShieldCheck,
  Eye,
  Gift,
  Bike,
  Smartphone,
  Calendar,
  Layers,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';
import { api } from '../../services/apiClient';
import { JobPost, JobCategory, JobType, WorkMode, JobBenefitDetail, BlueCollarJobRequirements } from '../../types';
import { categoryService, JobCategoryDefinition } from '../../services/categoryService';
import { launchRazorpayPayment } from '../../utils/razorpayCheckout';

interface EmployerPostJobProps {
  onSuccess: () => void;
}

const COMMON_CERTIFICATES = [
  'Data Analytics with Python Masterclass',
  'Power BI & Business Intelligence Certification',
  'Modern Full Stack React & Node.js',
  'Human Resources & Talent Acquisition Essentials',
  'B2B Enterprise Sales & Strategic Negotiation',
  'Digital Marketing & Performance Growth',
  'Tally Prime & GST Accounting Master',
  'Customer Support & Escalation Management'
];

const DEFAULT_BENEFITS: JobBenefitDetail[] = [
  { id: 'pf', name: 'Provident Fund (PF)', category: 'insurance', included: true, note: 'Statutory 12% employer matching contribution' },
  { id: 'esic', name: 'ESIC Healthcare', category: 'insurance', included: true, note: 'State health and dispensary coverage' },
  { id: 'health_insurance', name: 'Group Medical Insurance', category: 'insurance', included: true, amount: '₹5,00,000 cover' },
  { id: 'life_insurance', name: 'Group Term Life Insurance', category: 'insurance', included: false },
  { id: 'paid_leave', name: 'Paid Annual Leave', category: 'leaves', included: true, amount: '18 Days / Year' },
  { id: 'sick_casual_leave', name: 'Sick & Casual Leaves', category: 'leaves', included: true, amount: '12 Days / Year' },
  { id: 'weekly_off', name: 'Fixed 2 Days Weekly Off', category: 'leaves', included: true },
  { id: 'overtime', name: 'Overtime Pay (1.5x / 2.0x)', category: 'allowances', included: false },
  { id: 'food_meal', name: 'Subsidized Meal / Canteen', category: 'facilities', included: true },
  { id: 'travel_transport', name: 'Cab / Shuttle Transport', category: 'allowances', included: true },
  { id: 'petrol_allowance', name: 'Monthly Petrol Reimbursement', category: 'allowances', included: false, amount: '₹3.5 / KM' },
  { id: 'mobile_internet', name: 'Mobile & Internet Reimbursement', category: 'allowances', included: true, amount: '₹1,500 / month' },
  { id: 'shift_allowance', name: 'Night / Rotational Shift Allowance', category: 'allowances', included: false },
  { id: 'performance_bonus', name: 'Quarterly Performance Bonus', category: 'bonuses', included: true, amount: 'Up to 20%' },
  { id: 'joining_bonus', name: 'Early Joining Bonus', category: 'bonuses', included: false },
  { id: 'referral_bonus', name: 'Employee Referral Incentive', category: 'bonuses', included: true, amount: '₹15,000 / hire' },
  { id: 'festival_bonus', name: 'Diwali / Annual Bonus', category: 'bonuses', included: true },
  { id: 'accommodation', name: 'Company Accommodation / PG', category: 'facilities', included: false },
  { id: 'uniform', name: 'Company Uniform & Safety Gear', category: 'facilities', included: false }
];

export const EmployerPostJob: React.FC<EmployerPostJobProps> = ({ onSuccess }) => {
  const { employerProfile, user } = useAuth();
  const { language } = useLanguage();

  const [availableCategories, setAvailableCategories] = useState<JobCategoryDefinition[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [category, setCategory] = useState<string>('IT & Software');
  const [jobType, setJobType] = useState<JobType>('Full-Time');
  const [workMode, setWorkMode] = useState<WorkMode>('In-Office');
  const [locationCity, setLocationCity] = useState(employerProfile?.city || 'Bengaluru');
  const [locationState, setLocationState] = useState(employerProfile?.state || 'Karnataka');
  const [multipleLocations, setMultipleLocations] = useState<string>('');
  const [address, setAddress] = useState(employerProfile?.address || '');
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [vacancies, setVacancies] = useState(2);
  const [workingHours, setWorkingHours] = useState('9:30 AM - 6:30 PM (Mon - Fri)');
  const [joiningTimeline, setJoiningTimeline] = useState('Immediate to 30 Days');
  const [applicationDeadline, setApplicationDeadline] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Education & Experience
  const [educationRequired, setEducationRequired] = useState("Bachelor's Degree in relevant field");
  const [educationPreferred, setEducationPreferred] = useState("Master's or B.Tech / BCA / MCA / MBA");
  const [experienceMinYears, setExperienceMinYears] = useState(1);
  const [experienceMaxYears, setExperienceMaxYears] = useState(4);
  const [genderRequirement, setGenderRequirement] = useState<'Any' | 'Male' | 'Female' | 'Other'>('Any');
  const [ageMin, setAgeMin] = useState<number>(20);
  const [ageMax, setAgeMax] = useState<number>(40);
  const [languagesRequired, setLanguagesRequired] = useState('English, Hindi');

  // Compensation
  const [salaryPeriod, setSalaryPeriod] = useState<'Month' | 'Year' | 'Day'>('Year');
  const [salaryMin, setSalaryMin] = useState(450000);
  const [salaryMax, setSalaryMax] = useState(850000);
  const [salaryType, setSalaryType] = useState<'Fixed' | 'Variable' | 'Hourly' | 'Monthly' | 'Annual' | 'Fixed + Incentive'>('Annual');
  const [fixedSalary, setFixedSalary] = useState(500000);
  const [variableSalary, setVariableSalary] = useState(100000);
  const [incentive, setIncentive] = useState('Performance tied quarterly metric incentives');
  const [performanceBonus, setPerformanceBonus] = useState('Annual appraisal bonus');
  const [joiningBonus, setJoiningBonus] = useState('');
  const [attendanceBonus, setAttendanceBonus] = useState('');

  // Skills & Certificates
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['Problem Solving', 'Communication', 'Teamwork']);
  const [preferredSkills, setPreferredSkills] = useState<string[]>(['Project Coordination']);
  const [newSkill, setNewSkill] = useState('');
  const [preferredCertificates, setPreferredCertificates] = useState<string[]>([
    'Modern Full Stack React & Node.js'
  ]);

  // Descriptions
  const [description, setDescription] = useState('');
  const [responsibilitiesText, setResponsibilitiesText] = useState(
    '• Execute key business tasks according to company quality guidelines\n• Collaborate across departments to drive metric targets\n• Maintain clean reporting dashboards and client communications'
  );
  const [requirementsText, setRequirementsText] = useState(
    '• Strong grasp of domain fundamentals\n• Excellent verbal and written communication\n• Self-motivated with high attention to detail'
  );
  const [preferredProfile, setPreferredProfile] = useState('');

  // Benefits
  const [benefitsList, setBenefitsList] = useState<JobBenefitDetail[]>(DEFAULT_BENEFITS);

  // Blue-collar requirements
  const [blueCollar, setBlueCollar] = useState<BlueCollarJobRequirements>({
    bikeRequired: false,
    drivingLicenceRequired: false,
    ownVehicleRequired: false,
    smartphoneRequired: false,
    androidRequired: false,
    petrolReimbursement: false,
    deliveryAllowance: false
  });

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    categoryService.getCategories().then(cats => {
      if (cats && cats.length > 0) {
        setAvailableCategories(cats);
        if (!category) setCategory(cats[0].name);
      }
    }).catch(() => {});
  }, []);

  const handleAddSkill = () => {
    if (newSkill.trim() && !requiredSkills.includes(newSkill.trim())) {
      setRequiredSkills([...requiredSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skill));
  };

  const handleToggleBenefit = (id: string) => {
    setBenefitsList(prev => prev.map(b => b.id === id ? { ...b, included: !b.included } : b));
  };

  const handleUseGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          alert(`GPS Location Captured: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => alert('Unable to retrieve GPS coordinates. Please ensure location permission is allowed.')
      );
    }
  };

  const constructJobPayload = (status: 'Draft' | 'Pending Approval'): Partial<JobPost> => {
    const respList = responsibilitiesText
      .split('\n')
      .map(r => r.replace(/^[•\-\*]\s*/, '').trim())
      .filter(Boolean);

    const reqList = requirementsText
      .split('\n')
      .map(r => r.replace(/^[•\-\*]\s*/, '').trim())
      .filter(Boolean);

    const activeBenefitsNames = benefitsList.filter(b => b.included).map(b => b.name);

    return {
      title: title.trim(),
      department: department.trim() || 'General Operations',
      subCategory: subCategory.trim(),
      category,
      jobType,
      workMode,
      locationCity: locationCity.trim(),
      locationState: locationState.trim(),
      multipleLocations: multipleLocations ? multipleLocations.split(',').map(s => s.trim()).filter(Boolean) : [],
      address: address.trim(),
      latitude,
      longitude,
      vacancies: Number(vacancies) || 1,
      salaryMin: Number(salaryMin) || 0,
      salaryMax: Number(salaryMax) || 0,
      salaryPeriod,
      salaryType,
      fixedSalary: Number(fixedSalary) || 0,
      variableSalary: Number(variableSalary) || 0,
      incentive,
      performanceBonus,
      joiningBonus,
      attendanceBonus,
      experienceMinYears: Number(experienceMinYears) || 0,
      experienceMaxYears: Number(experienceMaxYears) || 0,
      educationRequired,
      educationPreferred,
      requiredSkills,
      preferredSkills,
      preferredCertificates,
      languagesRequired: languagesRequired ? languagesRequired.split(',').map(s => s.trim()).filter(Boolean) : [],
      genderRequirement,
      ageMin: Number(ageMin) || undefined,
      ageMax: Number(ageMax) || undefined,
      description: description.trim(),
      responsibilities: respList,
      requirements: reqList,
      preferredCandidateProfile: preferredProfile.trim(),
      benefits: activeBenefitsNames,
      detailedBenefits: benefitsList,
      blueCollarRequirements: category === 'Blue Collar' ? blueCollar : undefined,
      workingHours,
      joiningTimeline,
      applicationDeadline,
      status
    };
  };

  const handleSaveJob = async (status: 'Draft' | 'Pending Approval') => {
    if (!title.trim()) {
      setError('Please provide a descriptive Job Title.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a detailed Job Description.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = constructJobPayload(status);
      const res = await api.createJobPost(payload);
      if (res.job) {
        alert(
          status === 'Pending Approval'
            ? 'Job vacancy successfully submitted for KarMetra Admin Quality Review!'
            : 'Job draft saved successfully.'
        );
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit job posting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-teal-400" />
              <span>Create PAN-India Job Vacancy</span>
            </h2>
            <span className="text-[10px] font-black uppercase text-teal-400 bg-teal-950 border border-teal-500/30 px-2 py-0.5 rounded-full">
              Full Spectrum Hiring
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Target qualified talent across IT, Non-IT, Corporate, and Blue-Collar disciplines across India.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Job Preview</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Post Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSaveJob('Pending Approval'); }} className="space-y-6">
        
        {/* Section 1: Basic Role Identification */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Briefcase className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">1. Role & Discipline Identification</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Data Analyst, Area Sales Executive, Logistics Supervisor..."
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Hiring Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setCategory(newCat);
                  const found = availableCategories.find(c => c.name === newCat);
                  if (found && found.subCategories && found.subCategories.length > 0) {
                    setSubCategory(found.subCategories[0]);
                  }
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600 font-bold"
              >
                {availableCategories.length > 0 ? (
                  availableCategories.map(cat => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name} ({cat.sector})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Healthcare & Medical">Healthcare & Medical</option>
                    <option value="Skilled Trades & Technical">Skilled Trades & Technical</option>
                    <option value="Household & Domestic Services">Household & Domestic Services</option>
                    <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                    <option value="Logistics & Warehousing">Logistics & Warehousing</option>
                    <option value="Retail & eCommerce Operations">Retail & eCommerce Operations</option>
                    <option value="IT & Software Engineering">IT & Software Engineering</option>
                    <option value="Business, Finance & Sales">Business, Finance & Sales</option>
                    <option value="Blue Collar & Field Services">Blue Collar & Field Services</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Sub Category / Domain</label>
              <input
                type="text"
                list="subcategories-datalist"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="Select or type e.g. Staff Nurse, CNC Operator, Cook..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
              <datalist id="subcategories-datalist">
                {availableCategories.find(c => c.name === category)?.subCategories?.map(sc => (
                  <option key={sc} value={sc} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering, Sales, Supply Chain"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Employment Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              >
                <option value="Full-Time">Full-Time Regular</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contractual (Fixed Term)</option>
                <option value="Internship">Internship</option>
                <option value="Freelance">Freelance / Gig</option>
                <option value="Temporary">Temporary / Seasonal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Work Mode & Location */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">2. Work Mode & Location Mapping</h3>
            </div>
            <button
              type="button"
              onClick={handleUseGPS}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Capture GPS Coordinates</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Work Mode</label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              >
                <option value="In-Office">On-site / In-Office</option>
                <option value="Hybrid">Hybrid (Split days)</option>
                <option value="Remote">100% Remote / Work from Home</option>
                <option value="Field">Field Travel / On-Ground</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Primary City</label>
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="e.g. Bengaluru, Mumbai, Delhi NCR"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={locationState}
                onChange={(e) => setLocationState(e.target.value)}
                placeholder="e.g. Karnataka, Maharashtra"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Multiple Hiring Cities (Optional, comma-separated)</label>
              <input
                type="text"
                value={multipleLocations}
                onChange={(e) => setMultipleLocations(e.target.value)}
                placeholder="e.g. Pune, Hyderabad, Chennai, Ahmedabad"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Open Vacancies</label>
              <input
                type="number"
                min={1}
                value={vacancies}
                onChange={(e) => setVacancies(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Salary, Incentives & Benefits Structure */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <DollarSign className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">3. Compensation, Incentives & Statutory Benefits</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Salary Structure Type</label>
              <select
                value={salaryType}
                onChange={(e) => setSalaryType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              >
                <option value="Annual">Annual CTC (Per Annum)</option>
                <option value="Monthly">Monthly Fixed</option>
                <option value="Fixed + Incentive">Fixed + Performance Incentive</option>
                <option value="Hourly">Hourly Rate</option>
                <option value="Variable">Commission / Variable Only</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Min Salary (₹ / Year or Month)</label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Salary (₹ / Year or Month)</label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Fixed Component (₹)</label>
              <input
                type="number"
                value={fixedSalary}
                onChange={(e) => setFixedSalary(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Variable / Bonus Component (₹)</label>
              <input
                type="number"
                value={variableSalary}
                onChange={(e) => setVariableSalary(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Attendance / Joining Bonus</label>
              <input
                type="text"
                value={joiningBonus}
                onChange={(e) => setJoiningBonus(e.target.value)}
                placeholder="e.g. ₹20,000 upon 90 days completion"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>
          </div>

          {/* Benefits Toggle Matrix */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-teal-600" />
                <span>Employee Benefits & Statutory Perks Checklist</span>
              </label>
              <span className="text-[10px] text-slate-400">Click to toggle included perks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {benefitsList.map(b => (
                <div
                  key={b.id}
                  onClick={() => handleToggleBenefit(b.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                    b.included
                      ? 'bg-teal-50/80 border-teal-300 text-teal-950 font-semibold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-80'
                  }`}
                >
                  <div>
                    <span className="block text-xs">{b.name}</span>
                    {b.amount && <span className="text-[10px] text-teal-700 font-bold block">{b.amount}</span>}
                    {b.note && <span className="text-[9px] text-slate-500 line-clamp-1">{b.note}</span>}
                  </div>
                  <input
                    type="checkbox"
                    checked={b.included}
                    onChange={() => {}}
                    className="accent-teal-600 mt-0.5"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Blue-Collar Specific Requirements (Conditional) */}
        {category === 'Blue Collar' && (
          <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-amber-200 pb-3 text-amber-950">
              <Bike className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold">4. Blue-Collar Asset & Mobility Requirements</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {[
                { key: 'bikeRequired', label: 'Two-Wheeler / Bike Required' },
                { key: 'drivingLicenceRequired', label: 'Valid Driving License (DL)' },
                { key: 'ownVehicleRequired', label: 'Candidate Own Vehicle' },
                { key: 'smartphoneRequired', label: 'Smartphone with 4G/5G' },
                { key: 'androidRequired', label: 'Android OS Phone Required' },
                { key: 'petrolReimbursement', label: 'Petrol Reimbursement Provided' },
                { key: 'deliveryAllowance', label: 'Per-Delivery Trip Incentive' }
              ].map(item => (
                <label
                  key={item.key}
                  className="flex items-center gap-2 p-3 bg-white border border-amber-200 rounded-xl cursor-pointer font-medium text-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={(blueCollar as any)[item.key]}
                    onChange={(e) => setBlueCollar(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    className="accent-amber-600"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Qualifications, Experience & Skills */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">{category === 'Blue Collar' ? '5.' : '4.'} Candidate Qualifications & Skills</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Minimum Education</label>
              <input
                type="text"
                value={educationRequired}
                onChange={(e) => setEducationRequired(e.target.value)}
                placeholder="e.g. 10th Pass / 12th Pass / Graduate / B.Tech"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Min Experience (Years)</label>
              <input
                type="number"
                min={0}
                value={experienceMinYears}
                onChange={(e) => setExperienceMinYears(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Experience (Years)</label>
              <input
                type="number"
                min={0}
                value={experienceMaxYears}
                onChange={(e) => setExperienceMaxYears(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Gender Requirement</label>
              <select
                value={genderRequirement}
                onChange={(e) => setGenderRequirement(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              >
                <option value="Any">All Candidates Welcome</option>
                <option value="Male">Male Only (Specific Operational Shift)</option>
                <option value="Female">Female Diversity Hiring</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Age Bracket (Min - Max)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={ageMin}
                  onChange={(e) => setAgeMin(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={ageMax}
                  onChange={(e) => setAgeMax(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Languages Required</label>
              <input
                type="text"
                value={languagesRequired}
                onChange={(e) => setLanguagesRequired(e.target.value)}
                placeholder="e.g. Hindi, English, Kannada"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>
          </div>

          {/* Required Skills Tag Input */}
          <div className="pt-2">
            <label className="block font-bold text-slate-700 text-xs mb-1">Mandatory Technical / Operational Skills</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                placeholder="Type skill & press Add..."
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {requiredSkills.map((sk, idx) => (
                <span
                  key={idx}
                  className="bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                >
                  <span>{sk}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => handleRemoveSkill(sk)}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 6: Comprehensive Job Description & Responsibilities */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">{category === 'Blue Collar' ? '6.' : '5.'} Detailed Job Description & Responsibilities</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Overview / Company Introduction <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe your organization, team mission, and the core purpose of this open vacancy..."
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Key Responsibilities (One per line)
              </label>
              <textarea
                value={responsibilitiesText}
                onChange={(e) => setResponsibilitiesText(e.target.value)}
                rows={4}
                placeholder="• List core daily duties..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Requirements & Qualifications (One per line)
              </label>
              <textarea
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                rows={3}
                placeholder="• List experience criteria, certifications, tools..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl text-white shadow-md">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Jobs are moderated by KarMetra Admin before going fully public.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSaveJob('Draft')}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Submitting...' : 'Submit for Admin Approval'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* JOB PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-5 animate-in zoom-in-95 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                  Live Job Posting Preview
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">{title || 'Untitled Vacancy'}</h2>
                <p className="text-xs text-slate-500">
                  {employerProfile?.companyName || 'Verified Employer'} • {locationCity}, {locationState}
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-2xl">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Salary</span>
                <span className="font-bold text-emerald-700">₹{(salaryMin/100000).toFixed(1)}L - ₹{(salaryMax/100000).toFixed(1)}L</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Experience</span>
                <span className="font-bold text-slate-800">{experienceMinYears} - {experienceMaxYears} Yrs</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Work Mode</span>
                <span className="font-bold text-slate-800">{workMode}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Vacancies</span>
                <span className="font-bold text-slate-800">{vacancies} Openings</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-slate-900">Job Description</h4>
                <p className="text-slate-600 mt-1 whitespace-pre-line">{description || 'No description provided.'}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">Key Responsibilities</h4>
                <div className="text-slate-600 mt-1 whitespace-pre-line">{responsibilitiesText}</div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {requiredSkills.map((sk, idx) => (
                    <span key={idx} className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">Included Benefits & Perks</h4>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {benefitsList.filter(b => b.included).map(b => (
                    <span key={b.id} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                      ✓ {b.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={() => { setShowPreview(false); handleSaveJob('Pending Approval'); }}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Publish for Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
