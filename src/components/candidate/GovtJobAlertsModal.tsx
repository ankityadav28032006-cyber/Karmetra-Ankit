import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle2, ShieldCheck, Mail, Smartphone, Save } from 'lucide-react';
import { GovtJobAlertPreference } from '../../types';
import { govtJobService } from '../../services/govtJobService';

interface GovtJobAlertsModalProps {
  onClose: () => void;
  onSaved?: () => void;
}

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

const JOB_TYPES = [
  'Central',
  'State',
  'PSU',
  'Banking',
  'Railway',
  'Defense',
  'Healthcare',
  'Teaching'
];

const EDUCATION_LEVELS = [
  '10th Pass',
  '12th Pass',
  'ITI / Diploma',
  'Graduate (BA/B.Sc/B.Com)',
  'B.Tech / BE',
  'Post Graduate / Master',
  'Medical / Nursing Degree'
];

export const GovtJobAlertsModal: React.FC<GovtJobAlertsModalProps> = ({ onClose, onSaved }) => {
  const [preferredStates, setPreferredStates] = useState<string[]>(['All India']);
  const [preferredJobTypes, setPreferredJobTypes] = useState<string[]>(['Central', 'State']);
  const [preferredEducation, setPreferredEducation] = useState<string[]>(['Graduate (BA/B.Sc/B.Com)']);
  const [emailAlerts, setEmailAlerts] = useState<boolean>(true);
  const [smsAlerts, setSmsAlerts] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const token = localStorage.getItem('km_auth_token') || '';

  useEffect(() => {
    if (token) {
      govtJobService.getAlertPreferences(token).then(prefs => {
        if (prefs) {
          setPreferredStates(prefs.preferredStates || ['All India']);
          setPreferredJobTypes(prefs.preferredJobTypes || ['Central', 'State']);
          setPreferredEducation(prefs.preferredEducation || ['Graduate (BA/B.Sc/B.Com)']);
          setEmailAlerts(prefs.emailAlerts ?? true);
          setSmsAlerts(prefs.smsAlerts ?? false);
        }
      });
    }
  }, [token]);

  const toggleState = (state: string) => {
    if (state === 'All India') {
      setPreferredStates(['All India']);
      return;
    }
    const filtered = preferredStates.filter(s => s !== 'All India');
    if (filtered.includes(state)) {
      const next = filtered.filter(s => s !== state);
      setPreferredStates(next.length === 0 ? ['All India'] : next);
    } else {
      setPreferredStates([...filtered, state]);
    }
  };

  const toggleJobType = (type: string) => {
    if (preferredJobTypes.includes(type)) {
      setPreferredJobTypes(preferredJobTypes.filter(t => t !== type));
    } else {
      setPreferredJobTypes([...preferredJobTypes, type]);
    }
  };

  const toggleEducation = (edu: string) => {
    if (preferredEducation.includes(edu)) {
      setPreferredEducation(preferredEducation.filter(e => e !== edu));
    } else {
      setPreferredEducation([...preferredEducation, edu]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: GovtJobAlertPreference = {
        userId: '',
        preferredStates,
        preferredJobTypes,
        preferredEducation,
        emailAlerts,
        smsAlerts,
        updatedAt: new Date().toISOString()
      };
      await govtJobService.saveAlertPreferences(payload, token);
      setSavedSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Government Job Alerts</h3>
              <p className="text-xs text-slate-500">Get notified when new public vacancies match your criteria</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-base font-black text-slate-900">Alert Preferences Saved!</h4>
            <p className="text-xs text-slate-500">You will receive timely updates whenever verified government posts match your choices.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* Preferred States */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">
                1. Target States & Regions
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
                {INDIAN_STATES.map(s => {
                  const isSelected = preferredStates.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleState(s)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Job Types */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">
                2. Government Job Categories / Sectors
              </label>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map(t => {
                  const isSelected = preferredJobTypes.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleJobType(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Education Qualifications */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">
                3. Your Educational Qualification
              </label>
              <div className="flex flex-wrap gap-1.5">
                {EDUCATION_LEVELS.map(edu => {
                  const isSelected = preferredEducation.includes(edu);
                  return (
                    <button
                      key={edu}
                      type="button"
                      onClick={() => toggleEducation(edu)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {edu}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Channels */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block font-bold text-slate-800">
                4. Notification Channels
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="accent-teal-600"
                  />
                  <Mail className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold text-slate-800">Email Digest</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsAlerts}
                    onChange={(e) => setSmsAlerts(e.target.checked)}
                    className="accent-teal-600"
                  />
                  <Smartphone className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold text-slate-800">SMS / WhatsApp</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
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
                <span>{saving ? 'Saving...' : 'Set Alert Preferences'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
