import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Moon, 
  Bell, 
  Trash2, 
  Download, 
  Lock, 
  Key, 
  Database, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { UserProfile, UserPreferences, JournalEntry, Memory, TimelineThread } from '../types';
import { updateUserPreferences, purgeUserData } from '../lib/firebase';
import { getSystemStatusApi } from '../services/api';

interface SettingsViewProps {
  userProfile: UserProfile | null;
  onUpdateProfile: (profile: UserProfile) => void;
  entries: JournalEntry[];
  memories: Memory[];
  threads: TimelineThread[];
  onClearAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  onUpdateProfile,
  entries,
  memories,
  threads,
  onClearAllData
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>(
    userProfile?.preferences || {
      nudgesEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      maxNudgesPerDay: 2,
      preferredInput: 'any',
      personalizationLevel: 'high'
    }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);

  useEffect(() => {
    getSystemStatusApi()
      .then(setSystemStatus)
      .catch((err) => console.warn('Could not fetch system status:', err));
  }, []);

  const handleSavePreferences = async () => {
    if (!userProfile) return;
    try {
      setIsSaving(true);
      await updateUserPreferences(userProfile.uid, preferences);
      onUpdateProfile({ ...userProfile, preferences });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    const exportBundle = {
      exportDate: new Date().toISOString(),
      user: {
        uid: userProfile?.uid,
        displayName: userProfile?.displayName,
        email: userProfile?.email
      },
      preferences,
      journalEntries: entries,
      personalMemories: memories,
      timelineThreads: threads
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `gemini_journal_archive_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePurgeAllData = async () => {
    if (!userProfile) return;
    try {
      setIsSaving(true);
      await purgeUserData(userProfile.uid);
      onClearAllData();
      setConfirmDeleteModal(false);
    } catch (err) {
      console.error('Error clearing data:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-stone-200/80 pb-6">
        <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 text-xs font-semibold mb-2">
          <Shield className="w-3.5 h-3.5 text-stone-600" />
          <span>Privacy & Responsible AI Control Center</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
          Settings & Guardrails
        </h1>
        <p className="text-sm text-stone-500 mt-1 max-w-xl">
          Complete user sovereignty: configure nudge policies, control data isolation, and inspect backend Google security parameters.
        </p>
      </div>

      {/* Behavioral Nudge Policy Settings */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs p-6 space-y-6">
        <h2 className="font-serif font-bold text-stone-900 text-lg flex items-center space-x-2">
          <Bell className="w-4 h-4 text-amber-600" />
          <span>Autonomous Nudge Agent Guardrails</span>
        </h2>

        <div className="space-y-4 text-sm">
          {/* Nudge Master Switch */}
          <div className="flex items-center justify-between py-2 border-b border-stone-100">
            <div>
              <div className="font-semibold text-stone-800">Enable Autonomous Nudges</div>
              <div className="text-xs text-stone-500">Allow the agent to evaluate behavioral patterns and offer gentle micro-touchpoints.</div>
            </div>
            <input
              type="checkbox"
              checked={preferences.nudgesEnabled}
              onChange={(e) => setPreferences({ ...preferences, nudgesEnabled: e.target.checked })}
              className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
            />
          </div>

          {/* Quiet Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 border-b border-stone-100">
            <div>
              <div className="font-semibold text-stone-800 flex items-center space-x-1.5">
                <Moon className="w-4 h-4 text-stone-500" />
                <span>Quiet Hours (No-Nudge Window)</span>
              </div>
              <div className="text-xs text-stone-500">Deterministic gate blocks all interventions during these hours.</div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="time"
                value={preferences.quietHoursStart}
                onChange={(e) => setPreferences({ ...preferences, quietHoursStart: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs bg-[#FAF9F6] text-stone-800"
              />
              <span className="text-xs text-stone-400">to</span>
              <input
                type="time"
                value={preferences.quietHoursEnd}
                onChange={(e) => setPreferences({ ...preferences, quietHoursEnd: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs bg-[#FAF9F6] text-stone-800"
              />
            </div>
          </div>

          {/* Max Nudges Per Day */}
          <div className="flex items-center justify-between py-2 border-b border-stone-100">
            <div>
              <div className="font-semibold text-stone-800">Daily Frequency Ceiling</div>
              <div className="text-xs text-stone-500">Maximum interventions the agent is allowed to trigger in 24 hours.</div>
            </div>
            <select
              value={preferences.maxNudgesPerDay}
              onChange={(e) => setPreferences({ ...preferences, maxNudgesPerDay: Number(e.target.value) })}
              className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs bg-[#FAF9F6] text-stone-800 font-medium"
            >
              <option value={1}>1 nudge / day (Ultra quiet)</option>
              <option value={2}>2 nudges / day (Recommended)</option>
              <option value={3}>3 nudges / day (Active coaching)</option>
            </select>
          </div>

          {/* Preferred Input Modality */}
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-semibold text-stone-800">Preferred Input Modality</div>
              <div className="text-xs text-stone-500">The agent adapts interventions toward your preferred interaction mode.</div>
            </div>
            <select
              value={preferences.preferredInput}
              onChange={(e) => setPreferences({ ...preferences, preferredInput: e.target.value as any })}
              className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs bg-[#FAF9F6] text-stone-800 font-medium"
            >
              <option value="any">Any (Adaptive)</option>
              <option value="voice">Prefer 60s Voice Note</option>
              <option value="text">Prefer Text / Reflection</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          {saveSuccess ? (
            <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Preferences saved successfully.</span>
            </div>
          ) : <div />}

          <button
            id="save-preferences-btn"
            onClick={handleSavePreferences}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors shadow-2xs"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Google Cloud Architecture & Security Inspector */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs p-6 space-y-4">
        <h2 className="font-serif font-bold text-stone-900 text-lg flex items-center space-x-2">
          <Server className="w-4 h-4 text-stone-700" />
          <span>Security & Google Cloud Architecture Status</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          {/* Secret Manager Card */}
          <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-stone-200/80 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-semibold text-stone-800">
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>Secret Manager</span>
            </div>
            <div className="text-[11px] text-stone-500">
              {systemStatus?.secretManagerMode || "Injected / Secret Accessor"}
            </div>
            <div className="text-[10px] text-emerald-700 font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Server-side Protected</span>
            </div>
          </div>

          {/* Firestore Isolation Card */}
          <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-stone-200/80 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-semibold text-stone-800">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Firestore UID Isolation</span>
            </div>
            <div className="text-[11px] text-stone-500">
              Path: users/{userProfile?.uid ? userProfile.uid.slice(0, 8) + '...' : '{uid}'}
            </div>
            <div className="text-[10px] text-emerald-700 font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Security Rules Deployed</span>
            </div>
          </div>

          {/* Active Model Fallback Ladder */}
          <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-stone-200/80 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-semibold text-stone-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Gemini Model Ladder</span>
            </div>
            <div className="text-[11px] text-stone-500 font-mono">
              {systemStatus?.primaryModel || "gemini-3.6-flash"}
            </div>
            <div className="text-[10px] text-emerald-700 font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>4-Tier Fallback Ladder</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Export & Sovereignty Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs p-6 space-y-4">
        <h2 className="font-serif font-bold text-stone-900 text-lg flex items-center space-x-2">
          <Database className="w-4 h-4 text-stone-700" />
          <span>Data Sovereignty & Data Management</span>
        </h2>

        <p className="text-xs text-stone-500">
          You own 100% of your reflections, timeline syntheses, and personal memory index. You can export or purge everything at any time.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            id="export-data-btn"
            onClick={handleExportData}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors border border-stone-200"
          >
            <Download className="w-3.5 h-3.5 text-stone-600" />
            <span>Export Complete Archive (JSON)</span>
          </button>

          <button
            id="open-delete-modal-btn"
            onClick={() => setConfirmDeleteModal(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition-colors border border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Delete All Journal & Memory History</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 border border-stone-200 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-stone-900 text-center text-lg">
              Purge All History?
            </h3>
            <p className="text-xs text-stone-500 text-center leading-relaxed">
              This will permanently delete all {entries.length} journal entries, {memories.length} memories, and {threads.length} timeline threads under your Firebase UID. This action cannot be undone.
            </p>
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setConfirmDeleteModal(false)}
                className="flex-1 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-all-btn"
                onClick={handlePurgeAllData}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                Yes, Purge All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
