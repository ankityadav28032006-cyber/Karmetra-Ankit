import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  ExternalLink, 
  Copy, 
  Server, 
  RefreshCw, 
  AlertCircle,
  Link2,
  Check,
  Shield,
  Layers
} from 'lucide-react';
import { DOMAIN_CONFIG } from '../../utils/domainConfig';
import { api } from '../../services/apiClient';

interface DnsRecord {
  type: 'A' | 'CNAME' | 'TXT';
  host: string;
  value: string;
  ttl: string;
  purpose: string;
  status: 'active' | 'ready';
}

export const AdminDomainSettings: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const subdomains = [
    {
      id: 'main',
      title: 'Main Website & Portal Hub',
      url: DOMAIN_CONFIG.publicAppUrl,
      subdomain: 'karmetra.in (Apex & www)',
      role: 'Public / All Users',
      badge: 'Public Landing & Discovery',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      description: 'Public showcase, job search discovery, LMS highlights, and portal routing.'
    },
    {
      id: 'candidate',
      title: 'Candidate / Job Seeker Application',
      url: DOMAIN_CONFIG.candidateAppUrl,
      subdomain: 'job.karmetra.in',
      role: 'Candidate / Job Seekers',
      badge: 'Job Seeker Suite',
      badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
      description: 'Dedicated portal for job seekers, OTP login, assessments, applications, and AI Resume.'
    },
    {
      id: 'employer',
      title: 'Employer & Recruiter Application',
      url: DOMAIN_CONFIG.recruiterAppUrl,
      subdomain: 'recruiter.karmetra.in',
      role: 'Employers / Recruiters',
      badge: 'Recruiter Suite',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      description: 'Dedicated portal for employers to post jobs, screen talent, and conduct interviews.'
    },
    {
      id: 'admin',
      title: 'Admin & Operations Security Panel',
      url: DOMAIN_CONFIG.adminAppUrl,
      subdomain: 'admin.karmetra.in',
      role: 'Super Admin Only',
      badge: 'Restricted Security Zone',
      badgeColor: 'bg-red-500/10 text-red-400 border-red-500/30',
      description: 'Restricted administrative control center. Requires master credentials and 2FA.'
    }
  ];

  const dnsRecords: DnsRecord[] = [
    {
      type: 'CNAME',
      host: 'job',
      value: 'cname.vercel-dns.com / cloudrun / custom ingress',
      ttl: '3600 (Auto)',
      purpose: 'Maps job.karmetra.in to Candidate App',
      status: 'ready'
    },
    {
      type: 'CNAME',
      host: 'recruiter',
      value: 'cname.vercel-dns.com / cloudrun / custom ingress',
      ttl: '3600 (Auto)',
      purpose: 'Maps recruiter.karmetra.in to Employer App',
      status: 'ready'
    },
    {
      type: 'CNAME',
      host: 'admin',
      value: 'cname.vercel-dns.com / cloudrun / custom ingress',
      ttl: '3600 (Auto)',
      purpose: 'Maps admin.karmetra.in to Admin Panel',
      status: 'ready'
    },
    {
      type: 'A',
      host: '@ (Apex)',
      value: '76.76.21.21 / Ingress IP',
      ttl: '3600 (Auto)',
      purpose: 'Maps karmetra.in to Main Landing Hub',
      status: 'ready'
    },
    {
      type: 'CNAME',
      host: 'www',
      value: 'karmetra.in',
      ttl: '3600 (Auto)',
      purpose: 'Redirects www.karmetra.in to Apex',
      status: 'ready'
    }
  ];

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunHealthCheck = async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch('/api/health').then(r => r.json());
      setHealthStatus(res);
    } catch (e: any) {
      setHealthStatus({ status: 'error', message: e.message });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    handleRunHealthCheck();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-400" />
              <h2 className="text-lg font-bold text-white">Production Domain &amp; Subdomain Architecture</h2>
            </div>
            <p className="text-xs text-slate-400">
              Topology configuration for <strong className="text-slate-200 font-mono">karmetra.in</strong> and its 3 dedicated subdomains.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunHealthCheck}
              disabled={checkingHealth}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
              <span>Verify Topology &amp; CORS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Production URLs Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subdomains.map((item) => (
          <div 
            key={item.id}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                  {item.badge}
                </span>
                <h3 className="text-sm font-bold text-white pt-1">{item.title}</h3>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SSL Ready</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between font-mono text-xs text-slate-200">
              <div className="flex items-center gap-2 truncate">
                <Link2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="truncate">{item.url}</span>
              </div>
              <button
                onClick={() => copyToClipboard(item.url, item.id)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Copy URL"
              >
                {copiedKey === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {item.description}
            </p>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Access Scope: <strong className="text-slate-300">{item.role}</strong></span>
              <span className="text-slate-500">Subdomain: <strong className="text-teal-400 font-mono">{item.subdomain}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* DNS Configuration Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-teal-400" />
            <span>Required DNS Records for karmetra.in Domain Registrar</span>
          </h3>
          <p className="text-xs text-slate-400">
            Add the following DNS records in your domain registrar (GoDaddy, Namecheap, Cloudflare, or Hostinger) to route each subdomain to the shared KarMetra backend:
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 font-semibold">
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Host / Name</th>
                <th className="py-2.5 px-3">Value / Target</th>
                <th className="py-2.5 px-3">TTL</th>
                <th className="py-2.5 px-3">Subdomain Purpose</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
              {dnsRecords.map((dns, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-400 font-bold">
                      {dns.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-white">{dns.host}</td>
                  <td className="py-3 px-3 text-slate-300 truncate max-w-xs">{dns.value}</td>
                  <td className="py-3 px-3 text-slate-400">{dns.ttl}</td>
                  <td className="py-3 px-3 font-sans text-slate-400">{dns.purpose}</td>
                  <td className="py-3 px-3 text-right font-sans">
                    <button
                      onClick={() => copyToClipboard(`${dns.type} ${dns.host} ${dns.value}`, `dns-${idx}`)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === `dns-${idx}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Security & CORS Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Production Security &amp; CORS Policy</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Strict Origin Matching:</strong> CORS only allows <code className="text-teal-300">karmetra.in</code>, <code className="text-teal-300">job.karmetra.in</code>, <code className="text-teal-300">recruiter.karmetra.in</code>, and <code className="text-teal-300">admin.karmetra.in</code>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>No Wildcard CORS with Credentials:</strong> Explicit origin verification with <code className="text-teal-300">credentials: true</code> for authenticated session cookies and headers.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Backend Role Enforcement:</strong> Tokens and endpoints strictly validate <code className="text-teal-300">candidate</code>, <code className="text-teal-300">employer</code>, and <code className="text-teal-300">admin</code> authorization.
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
            <Server className="w-4 h-4" />
            <span>Corporate Identity &amp; Support Info</span>
          </div>
          <div className="space-y-2 text-xs text-slate-300 font-mono">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 font-sans block text-[10px] uppercase">Official Helpline</span>
              <span className="text-white font-bold">{DOMAIN_CONFIG.helplinePhoneDisplay} ({DOMAIN_CONFIG.helplinePhone})</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 font-sans block text-[10px] uppercase">Mumbai Head Office</span>
              <span className="text-slate-200 text-[11px] font-sans">{DOMAIN_CONFIG.headOfficeAddress}, {DOMAIN_CONFIG.headOfficeCity}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
