import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  ShieldCheck, 
  Receipt, 
  Percent, 
  Save, 
  RefreshCw, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building2,
  GraduationCap
} from 'lucide-react';
import { api } from '../../services/apiClient';

export const AdminMonetization: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    freeJobPostsPerMonth: 2,
    paidJobPrice: 299,
    gstPercentage: 18,
    certificatePrice: 29,
    isMonetizationActive: true
  });
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, settingsRes, paymentsRes] = await Promise.all([
        api.getMonetizationStats().catch(() => null),
        api.getMonetizationSettings().catch(() => ({ settings: null })),
        api.getAdminPayments().catch(() => ({ payments: [] }))
      ]);

      if (statsRes) setStats(statsRes);
      if (settingsRes?.settings) setSettings(settingsRes.settings);
      if (paymentsRes?.payments) setPayments(paymentsRes.payments);
    } catch (err) {
      console.error('Failed to load monetization data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await api.updateMonetizationSettings(settings);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.gatewayTransactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'ALL') return matchesSearch;
    if (filterType === 'JOB') return matchesSearch && p.paymentType === 'job_posting';
    if (filterType === 'CERT') return matchesSearch && p.paymentType === 'certificate';
    if (filterType === 'SUCCESS') return matchesSearch && p.status === 'Success';
    return matchesSearch;
  });

  const exportCSV = () => {
    const headers = ['Order ID', 'Type', 'Title', 'Base Amount', 'GST', 'Total (INR)', 'Status', 'Gateway Ref', 'Date'];
    const rows = filteredPayments.map(p => [
      p.id,
      p.paymentType,
      `"${p.title?.replace(/"/g, '""') || ''}"`,
      p.amount,
      p.gst,
      p.total,
      p.status,
      p.gatewayTransactionId,
      new Date(p.createdAt).toLocaleString('en-IN')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `karmetra-transactions-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-500/20 text-teal-400 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black">Monetization & GST Finance Engine</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage job posting rates, statutory 18% GST rules, certificate verification fees, and review live transaction records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Stats</span>
          </button>
        </div>
      </div>

      {/* Revenue KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600 uppercase">Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{(stats?.totalGrossRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {stats?.successfulTransactions || 0} Successful Transactions
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600 uppercase">Employer Job Revenue</span>
            <Building2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700">
            ₹{(stats?.totalJobRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {stats?.paidJobsCount || 0} Paid Vacancies • {stats?.freeJobsCount || 0} Free Quota
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600 uppercase">Skill Certificate Revenue</span>
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">
            ₹{(stats?.totalCertRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Nominal verification & physical credential fees
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600 uppercase">Statutory GST (18%)</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">
            ₹{(stats?.totalGstCollected || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Compliant PAN-India tax records
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Pricing & Rule Configuration */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-600" />
              <span>Platform Pricing Configuration</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Updates take effect immediately on all employer and candidate checkout flows.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Employer Free Job Quota (Per Month)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.freeJobPostsPerMonth}
                  onChange={(e) => setSettings({ ...settings, freeJobPostsPerMonth: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-hidden focus:border-teal-600"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-medium">free posts</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Employers get this many free job postings every 30 days before monetization kicks in.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Paid Job Post Base Price (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={settings.paidJobPrice}
                  onChange={(e) => setSettings({ ...settings, paidJobPrice: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-hidden focus:border-teal-600"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Base listing fee charged per job after free quota is consumed.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Statutory GST Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="28"
                  value={settings.gstPercentage}
                  onChange={(e) => setSettings({ ...settings, gstPercentage: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-hidden focus:border-teal-600"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Standard Government GST rate applied on invoices (Default: 18%).
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Candidate Certificate Credential Fee (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={settings.certificatePrice}
                  onChange={(e) => setSettings({ ...settings, certificatePrice: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-hidden focus:border-teal-600"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Set to 0 for 100% free candidate skill certification, or a nominal fee for physical badges.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              {saveSuccess ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Settings Saved Successfully!</span>
                </span>
              ) : <div />}

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Updating...' : 'Save Pricing Rules'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live Calculation Preview */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Checkout Price Preview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Sample employer checkout invoice based on active rules</p>
            </div>
            <span className="text-[10px] font-black uppercase text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
              GST Compliant
            </span>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-700">
              <span>Standard Job Vacancy Posting Fee</span>
              <strong className="text-slate-900">₹{settings.paidJobPrice.toFixed(2)}</strong>
            </div>

            <div className="flex items-center justify-between text-slate-700">
              <span>GST ({settings.gstPercentage}%)</span>
              <strong className="text-slate-900">
                ₹{((settings.paidJobPrice * settings.gstPercentage) / 100).toFixed(2)}
              </strong>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-black text-slate-900">
              <span>Total Payable Amount</span>
              <span className="text-teal-700 font-mono">
                ₹{(settings.paidJobPrice + (settings.paidJobPrice * settings.gstPercentage) / 100).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-teal-900 text-xs space-y-1">
            <h4 className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Transparent Billing System</span>
            </h4>
            <p className="text-[11px] text-teal-800 leading-relaxed">
              Employers are automatically informed of their remaining free vacancy balance. Invoices are recorded with GSTIN numbers, transaction reference codes, and real-time state synchronization.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-600" />
              <span>Transaction & Revenue Ledger</span>
            </h3>
            <p className="text-xs text-slate-500">
              Showing {filteredPayments.length} of {payments.length} total payment records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search Order ID, Ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-hidden"
            >
              <option value="ALL">All Types</option>
              <option value="JOB">Job Postings</option>
              <option value="CERT">Certificates</option>
              <option value="SUCCESS">Success Only</option>
            </select>

            <button
              onClick={exportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Item / Service</th>
                <th className="py-2.5 px-3">Base</th>
                <th className="py-2.5 px-3">GST</th>
                <th className="py-2.5 px-3">Total</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No transaction records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.id}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.paymentType === 'job_posting'
                          ? 'bg-teal-50 text-teal-800'
                          : 'bg-indigo-50 text-indigo-800'
                      }`}>
                        {p.paymentType === 'job_posting' ? 'Job Posting' : 'Certificate'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 truncate max-w-xs">{p.title}</td>
                    <td className="py-2.5 px-3 text-slate-600">₹{p.amount}</td>
                    <td className="py-2.5 px-3 text-slate-600">₹{p.gst}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">₹{p.total}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        p.status === 'Success'
                          ? 'bg-emerald-50 text-emerald-800'
                          : p.status === 'Pending'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-red-50 text-red-800'
                      }`}>
                        {p.status === 'Success' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
