import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Navbar, NavTabType } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { HomeView } from './components/HomeView';
import { ReflectView } from './components/ReflectView';
import { TimelineView } from './components/TimelineView';
import { InsightsView } from './components/InsightsView';
import { SettingsView } from './components/SettingsView';
import { AiActivityModal } from './components/AiActivityModal';
import { seedDemoArc } from './components/DemoSeeder';
import { 
  UserProfile, 
  JournalEntry, 
  Memory, 
  TimelineThread, 
  NudgeRecord, 
  AIActivityStep 
} from './types';
import { 
  auth, 
  onAuthStateChanged, 
  signOut, 
  syncUserProfile, 
  getOrCreateGuestProfile,
  getUserEntities,
  saveUserEntity
} from './lib/firebase';
import { synthesizeTimelineApi } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTabType>('home');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core collections data state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [threads, setThreads] = useState<TimelineThread[]>([]);
  const [nudges, setNudges] = useState<NudgeRecord[]>([]);
  const [activitySteps, setActivitySteps] = useState<AIActivityStep[]>([]);
  
  // Navigation draft state for smooth transitions
  const [draftReflectText, setDraftReflectText] = useState<string>('');
  const [autoOpenVoiceReflect, setAutoOpenVoiceReflect] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Firebase Auth State Listener & Auto-Initializer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await syncUserProfile(user);
          setUserProfile(profile);
          await loadUserData(user.uid, profile);
        } catch (err) {
          console.warn('Notice syncing profile:', err);
        }
      } else {
        // Initialize persistent local guest profile cleanly
        const guestProfile = getOrCreateGuestProfile();
        setUserProfile(guestProfile);
        await loadUserData(guestProfile.uid, guestProfile);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load all user collections from isolated Firestore paths or local cache
  const loadUserData = async (uid: string, profile?: UserProfile | null) => {
    try {
      // 1. Journal entries
      const loadedEntries = await getUserEntities<JournalEntry>(uid, 'journalEntries');
      loadedEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEntries(loadedEntries);

      // 2. Personal memories
      const loadedMemories = await getUserEntities<Memory>(uid, 'memories');
      loadedMemories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setMemories(loadedMemories);

      // 3. Timeline threads
      const loadedThreads = await getUserEntities<TimelineThread>(uid, 'timelineThreads');
      loadedThreads.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      setThreads(loadedThreads);

      // 4. Nudges
      const loadedNudges = await getUserEntities<NudgeRecord>(uid, 'nudges');
      loadedNudges.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNudges(loadedNudges);

      // Auto seed demo if fresh account with no entries
      if (loadedEntries.length === 0 && (profile || userProfile)) {
        const seeded = await seedDemoArc(profile || userProfile!);
        setEntries(seeded.entries);
        setMemories(seeded.memories);
        setThreads([seeded.thread]);
        setNudges(seeded.nudges);
      }
    } catch (err) {
      console.warn('Notice loading user data:', err);
    }
  };

  const handleSeedDemoData = async () => {
    if (!userProfile) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      setIsProcessing(true);
      const seeded = await seedDemoArc(userProfile);
      setEntries(seeded.entries);
      setMemories(seeded.memories);
      setThreads([seeded.thread]);
      setNudges(seeded.nudges);

      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      showToast('Loaded 5-Day Avoidance & Progress Arc into Personal Memory!');
    } catch (err) {
      console.error('Demo seed error:', err);
      showToast('Failed to seed demo data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckinComplete = (entry: JournalEntry, memory: Memory, thread?: TimelineThread) => {
    setEntries((prev) => [entry, ...prev]);
    setMemories((prev) => [memory, ...prev]);
    if (thread) {
      setThreads((prev) => [thread, ...prev.filter((t) => t.id !== thread.id)]);
    }
    showToast('Reflection analyzed, timeline updated, and stored in personal memory!');
  };

  const handleUpdateNudgeStatus = async (nudgeId: string, status: NudgeRecord['status'], outcome?: string) => {
    if (!userProfile) return;
    const updatedNudges = nudges.map((n) => {
      if (n.id === nudgeId) {
        return {
          ...n,
          status,
          outcome: outcome || n.outcome,
          outcomeTimestamp: new Date().toISOString()
        };
      }
      return n;
    });
    setNudges(updatedNudges);

    // Update persistently
    const nudgeToUpdate = updatedNudges.find((n) => n.id === nudgeId);
    if (nudgeToUpdate) {
      await saveUserEntity(userProfile.uid, 'nudges', nudgeId, nudgeToUpdate);
    }
  };

  const handleTriggerResynthesis = async () => {
    if (!userProfile || memories.length === 0) return;
    try {
      setIsProcessing(true);
      const current = entries[0] || { content: memories[0].content };
      const { thread, activityStep } = await synthesizeTimelineApi(
        { content: current.content, analysis: current.analysis },
        memories.slice(0, 10),
        threads,
        userProfile.uid
      );
      setActivitySteps((prev) => [activityStep, ...prev]);
      const threadId = thread.id || `thread_${Date.now()}`;
      const toSave = { ...thread, id: threadId, userId: userProfile.uid, updatedAt: new Date().toISOString() };
      setThreads((prev) => [toSave, ...prev.filter((t) => t.id !== toSave.id)]);
      await saveUserEntity(userProfile.uid, 'timelineThreads', threadId, toSave);
      showToast('Longitudinal timeline pattern successfully re-synthesized!');
    } catch (err) {
      console.error('Resynthesis error:', err);
      showToast('Timeline resynthesis failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddActivityStep = (step: AIActivityStep) => {
    setActivitySteps((prev) => [step, ...prev.slice(0, 49)]);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUserProfile(null);
    setEntries([]);
    setMemories([]);
    setThreads([]);
    setNudges([]);
    showToast('Signed out successfully.');
  };

  const activeNudgesCount = nudges.filter((n) => n.status === 'sent' && n.policyResult.passed).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-800 font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Primary Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenActivity={() => setIsActivityModalOpen(true)}
        onSeedDemo={handleSeedDemoData}
        isProcessing={isProcessing}
        activeNudgesCount={activeNudgesCount}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl border border-stone-700 flex items-center space-x-2 animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Viewport Router */}
      <main className="flex-1 pb-16">
        
        {/* 1. HOME / TODAY (Default Landing) */}
        {activeTab === 'home' && (
          <HomeView
            userProfile={userProfile}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onNavigateToReflect={(initialText, autoVoice) => {
              setDraftReflectText(initialText || '');
              setAutoOpenVoiceReflect(!!autoVoice);
              setActiveTab('reflect');
            }}
            onNavigateToTimeline={() => setActiveTab('timeline')}
            onNavigateToInsights={() => setActiveTab('insights')}
            onUpdateNudgeStatus={handleUpdateNudgeStatus}
            entries={entries}
            memories={memories}
            threads={threads}
            nudges={nudges}
          />
        )}

        {/* 2. REFLECT (Focused Journaling Experience) */}
        {activeTab === 'reflect' && (
          <ReflectView
            userProfile={userProfile}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onCheckinComplete={handleCheckinComplete}
            onNavigateToTimeline={() => setActiveTab('timeline')}
            onAddActivityStep={handleAddActivityStep}
            recentEntries={entries}
            recentMemories={memories}
            existingThreads={threads}
            initialDraftText={draftReflectText}
            autoOpenVoice={autoOpenVoiceReflect}
          />
        )}

        {/* 3. TIMELINE (Chronological Journal & Searchable Memories) */}
        {activeTab === 'timeline' && (
          <TimelineView
            userProfile={userProfile}
            entries={entries}
            memories={memories}
            onSelectEntryForReflection={(entry) => {
              setDraftReflectText(`Deepening reflection on entry from ${new Date(entry.createdAt).toLocaleDateString()}: "${entry.content}"`);
              setActiveTab('reflect');
            }}
          />
        )}

        {/* 4. INSIGHTS (Longitudinal Patterns & Intelligence) */}
        {activeTab === 'insights' && (
          <InsightsView
            userProfile={userProfile}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            threads={threads}
            memories={memories}
            entries={entries}
            nudges={nudges}
            onTriggerResynthesis={handleTriggerResynthesis}
            isSynthesizing={isProcessing}
            onOpenActivityInspector={() => setIsActivityModalOpen(true)}
            onAddNudge={(n) => setNudges((prev) => [n, ...prev])}
            onAddActivityStep={handleAddActivityStep}
            onNavigateToReflect={(promptText) => {
              setDraftReflectText(promptText || '');
              setActiveTab('reflect');
            }}
          />
        )}

        {/* 5. SETTINGS (Utility & Preferences) */}
        {activeTab === 'settings' && (
          <SettingsView
            userProfile={userProfile}
            onUpdateProfile={(prof) => setUserProfile(prof)}
            entries={entries}
            memories={memories}
            threads={threads}
            onClearAllData={() => {
              setEntries([]);
              setMemories([]);
              setThreads([]);
              setNudges([]);
              showToast('All journal history and memory cleared.');
            }}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(profile) => {
          setUserProfile(profile);
          loadUserData(profile.uid, profile);
          showToast(`Signed in as ${profile.displayName}`);
        }}
      />

      {/* AI Activity Execution Inspector Modal */}
      <AiActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        activitySteps={activitySteps}
      />
    </div>
  );
}
