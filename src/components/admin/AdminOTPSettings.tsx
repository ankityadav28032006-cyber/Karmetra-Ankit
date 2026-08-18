import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Play, 
  Lock, 
  Zap, 
  Terminal, 
  Radio, 
  Clock, 
  Sliders,
  Check,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { OTPAdminConfigView, OTPDiagnosticReport, OTPDiagnosticCheck } from '../../types';

export const AdminOTPSettings: React.FC = () => {
  const [config, setConfig] = useState<OTPAdminConfigView | null>(null);
  const [report, setReport] = useState<OTPDiagnosticReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [testing, setTesting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminOtpConfig();
      setConfig(res.config);
    } catch (err: any) {
      setError(err.message || 'Failed to load OTP configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setTesting(true);
    setError(null);
    try {
      const res = await api.runAdminOtpDiagnostics();
      setReport(res.report);
    } catch (err: any) {
      setError(err.message || 'Failed to execute diagnostic test suite');
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Settings → Authentication → OTP Configuration</span>
          </div>

          <h1 className="text-xl sm:text-3xl font-black tracking-tight">
            Secure OTP Subsystem & Gateway Gateway Settings
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Manage SMS providers (Fast2SMS / MSG91), inspect environment safety parameters, verify zero-leakage security rules, and run the automated 15-point verification test checklist.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleRunDiagnostics}
              disabled={testing}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{testing ? 'Executing 15 Verification Checks...' : 'Run Automated 15-Point Safety Checklist'}</span>
            </button>

            <button
              onClick={fetchConfig}
              disabled={loading}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Environment & Mode Status + Provider Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Environment & Mode Safety */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-teal-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Environment & Mode Status</h2>
            </div>
            {config && (
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                config.appEnv === 'production' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {config.appEnv} mode
              </span>
            )}
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">Environment (`APP_ENV`):</span>
              <strong className="text-white font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                {config?.appEnv || 'development'}
              </strong>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div>
                <span className="text-slate-400 block">OTP Demo Mode (`OTP_DEMO_MODE`):</span>
                <span className="text-[10px] text-slate-500">
                  {config?.appEnv === 'production' 
                    ? 'Forced to false automatically in production' 
                    : 'Safe Sandbox enabled for testing without SMS cost'}
                </span>
              </div>
              <strong className={`font-mono px-2 py-0.5 rounded text-[11px] font-bold ${
                config?.otpDemoMode 
                  ? 'bg-amber-500/20 text-amber-300' 
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {config?.otpDemoMode ? 'ENABLED (SANDBOX)' : 'DISABLED (LIVE SMS)'}
              </strong>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">Production Safety Guard:</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Secret Exposure Enforced</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Provider & Gateway Status */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-teal-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">SMS Gateway Configuration</h2>
            </div>
            {config && (
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                config.providerStatus === 'Connected'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-700 text-slate-300'
              }`}>
                Status: {config.providerStatus}
              </span>
            )}
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">Primary Provider (`SMS_PROVIDER`):</span>
              <strong className="text-white font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                {config?.smsProvider || 'fast2sms'}
              </strong>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">Fast2SMS Gateway Credentials:</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  config?.fast2smsConfigured ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {config?.fast2smsConfigured ? 'Configured (Masked)' : 'Not Configured'}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                  config?.fast2smsTemplateConfigured ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800 text-slate-500'
                }`}>
                  {config?.fast2smsTemplateConfigured ? 'Template Set' : 'Default Route'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">MSG91 Secondary Gateway:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                config?.msg91Configured ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {config?.msg91Configured ? 'Configured (Masked)' : 'Not Configured'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Card 3: Security & Rate Limiting Parameters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Sliders className="w-5 h-5 text-teal-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Security & Anti-Abuse Parameters</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400">OTP Expiration Window</span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono">{config?.otpExpirySeconds || 300}</span>
              <span className="text-slate-400 text-xs">seconds ({Math.round((config?.otpExpirySeconds || 300) / 60)} min)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400">Resend Cooldown Timer</span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono">{config?.otpResendCooldownSeconds || 30}</span>
              <span className="text-slate-400 text-xs">seconds</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400">Maximum Verification Attempts</span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono">{config?.otpMaxAttempts || 5}</span>
              <span className="text-slate-400 text-xs">attempts before lockout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic Checklist Section */}
      {report && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                15-Point Automated OTP Safety & Architecture Report
              </h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
              report.overallStatus === 'passed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              Overall: {report.overallStatus}
            </span>
          </div>

          <div className="space-y-2.5">
            {report.checks.map((check: OTPDiagnosticCheck) => (
              <div 
                key={check.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  {check.status === 'passed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : check.status === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="text-white font-bold block">{check.title}</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">{check.details}</p>
                  </div>
                </div>

                <span className={`self-start sm:self-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  check.status === 'passed'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : check.status === 'warning'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {check.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
