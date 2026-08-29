import React, { useState } from 'react';
import { 
  Sparkles, 
  Mic, 
  Send, 
  Calendar, 
  Tag, 
  Target, 
  AlertCircle, 
  Activity, 
  CheckCircle2, 
  ArrowRight,
  MessageSquare,
  Clock,
  Volume2
} from 'lucide-react';
import { 
  JournalEntry, 
  Memory, 
  TimelineThread, 
  UserProfile, 
  AIActivityStep 
} from '../types';
import { analyzeEntryApi, synthesizeTimelineApi } from '../services/api';
import { saveUserEntity } from '../lib/firebase';
import { VoiceRecorderModal } from './VoiceRecorderModal';

interface CheckinViewProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onCheckinComplete: (entry: JournalEntry, memory: Memory, thread?: TimelineThread) => void;
  onNavigateToReflection: (entry: JournalEntry) => void;
  onNavigateToTimeline: () => void;
  onAddActivityStep: (step: AIActivityStep) => void;
  recentEntries: JournalEntry[];
  recentMemories: Memory[];
  existingThreads: TimelineThread[];
}

const QUICK_MOOD_PROMPTS = [
  { label: 'Avoidant / Stalled', text: "I'm avoiding my project again and feeling friction to get started." },
  { label: 'Taking a Tiny Step', text: "Decided to complete just one tiny 5-minute task to break the resistance." },
  { label: 'Relieved & Momentum', text: "Completed the core module. That was much easier than I thought." },
  { label: 'Overwhelmed', text: "Feeling overwhelmed by the sheer number of open loops today." },
  { label: 'Grateful & Clear', text: "Feeling grounded after taking a walk and clearing my mind." }
];

export const CheckinView: React.FC<CheckinViewProps> = ({
  userProfile,
  onOpenAuth,
  onCheckinComplete,
  onNavigateToReflection,
  onNavigateToTimeline,
  onAddActivityStep,
  recentEntries,
  recentMemories,
  existingThreads
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'voice' | 'quick_reflection'>('text');
  const [voiceDuration, setVoiceDuration] = useState<number | undefined>(undefined);
  const [lastSavedEntry, setLastSavedEntry] = useState<JournalEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) return;

    if (!userProfile) {
      onOpenAuth();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // 1. Structured Gemini Analysis
      const { analysis, activityStep: analysisStep } = await analyzeEntryApi(
        content.trim(),
        inputMode,
        userProfile.uid
      );
      onAddActivityStep(analysisStep);

      const entryId = `entry_${Date.now()}`;
      const nowIso = new Date().toISOString();

      const newEntry: JournalEntry = {
        id: entryId,
        userId: userProfile.uid,
        content: content.trim(),
        inputMode,
        createdAt: nowIso,
        analysis,
        voiceDurationSeconds: voiceDuration
      };

      // 2. Personal Memory extraction
      const memoryId = `mem_${Date.now()}`;
      const newMemory: Memory = {
        id: memoryId,
        userId: userProfile.uid,
        entryId,
        timestamp: nowIso,
        content: content.trim(),
        themes: analysis.themes || [],
        goals: analysis.goals || [],
        concerns: analysis.concerns || [],
        behavioral_signals: analysis.behavioral_signals || [],
        importance: analysis.importance || 0.8
      };

      // 3. Persist safely
      await saveUserEntity(userProfile.uid, 'journalEntries', entryId, newEntry);
      await saveUserEntity(userProfile.uid, 'memories', memoryId, newMemory);

      // 4. Longitudinal Timeline Synthesizer
      let synthesizedThread: TimelineThread | undefined;
      try {
        const allMemoriesForSynthesis = [newMemory, ...recentMemories.slice(0, 10)];
        const { thread, activityStep: synthesisStep } = await synthesizeTimelineApi(
          { content: newEntry.content, analysis: newEntry.analysis },
          allMemoriesForSynthesis,
          existingThreads,
          userProfile.uid
        );
        if (thread) {
          const threadId = thread.id || `thread_${Date.now()}`;
          const threadToSave = { ...thread, id: threadId, userId: userProfile.uid, updatedAt: nowIso };
          synthesizedThread = threadToSave;
          await saveUserEntity(userProfile.uid, 'timelineThreads', threadId, threadToSave);
        }
      } catch (synthErr) {
        console.warn('Longitudinal synthesis notice:', synthErr);
      }

      setLastSavedEntry(newEntry);
      onCheckinComplete(newEntry, newMemory, synthesizedThread);
      setContent('');
      setInputMode('text');
      setVoiceDuration(undefined);
    } catch (err: any) {
      console.error('Check-in submission failed:', err);
      setError(err.message || 'Failed to analyze and save your journal check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceComplete = (transcriptText: string, durationSeconds: number) => {
    setContent(transcriptText);
    setInputMode('voice');
    setVoiceDuration(durationSeconds);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Title & Core Thesis Banner */}
      <div className="text-center sm:text-left sm:flex sm:items-end sm:justify-between border-b border-stone-200/80 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Frictionless Reflection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            How are you feeling right now?
          </h1>
          <p className="text-sm text-stone-500 mt-1 max-w-xl">
            Type or speak freely. Gemini analyzes emotional tone, extracts searchable memory, and connects this moment to your evolving timeline.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center justify-center sm:justify-end space-x-2 text-xs text-stone-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Main Check-in Input Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-6 transition-all hover:border-stone-300">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Prompt Starters */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            <span className="text-stone-400 font-medium whitespace-nowrap">Quick Starters:</span>
            {QUICK_MOOD_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setContent(prompt.text);
                  setInputMode('quick_reflection');
                }}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-stone-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-200 border border-transparent text-stone-600 transition-all font-medium"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              id="journal-input-textarea"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's weighing on your mind, what did you accomplish, or what resistance are you facing? (e.g., 'I keep avoiding starting my project because of self-doubt...')"
              className="w-full p-4 rounded-xl bg-[#FAF9F6] border border-stone-200 text-stone-800 placeholder-stone-400 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
            />

            {inputMode === 'voice' && voiceDuration && (
              <div className="absolute top-3 right-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 text-xs font-medium border border-amber-200">
                <Volume2 className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                <span>Voice Note ({voiceDuration}s)</span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              {/* Voice Check-in Button */}
              <button
                id="voice-checkin-btn"
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs sm:text-sm transition-colors border border-stone-200"
              >
                <Mic className="w-4 h-4 text-amber-600" />
                <span>60s Voice Input</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                id="submit-journal-btn"
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-sm shadow-stone-300"
              >
                {isSubmitting ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Reflect & Synthesize</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Voice Recorder Modal */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscriptComplete={handleVoiceComplete}
      />

      {/* Last Saved Structured Result Card (Real-time Gemini Extraction) */}
      {lastSavedEntry && lastSavedEntry.analysis && (
        <div className="bg-gradient-to-br from-amber-50/70 to-stone-50 rounded-2xl p-6 border border-amber-200/80 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Reflection Analyzed & Stored in Personal Memory
              </h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white text-amber-900 border border-amber-200 font-semibold shadow-2xs">
              Mood: {lastSavedEntry.analysis.mood}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tone & Themes */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Emotional Tone & Themes
              </div>
              <p className="text-sm text-stone-700 italic bg-white p-3 rounded-xl border border-stone-200/60">
                "{lastSavedEntry.analysis.emotional_tone}"
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(lastSavedEntry.analysis.themes || []).map((t, idx) => (
                  <span key={idx} className="inline-flex items-center space-x-1 px-2.5 py-0.8 rounded-md bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200">
                    <Tag className="w-3 h-3 text-amber-600" />
                    <span>{t}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Concerns & Behavioral Signals */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Signals & Unresolved Threads
              </div>
              <div className="bg-white p-3 rounded-xl border border-stone-200/60 space-y-1.5 text-xs text-stone-700">
                {lastSavedEntry.analysis.concerns && lastSavedEntry.analysis.concerns.length > 0 && (
                  <div>
                    <span className="font-semibold text-rose-700">Obstacles:</span>{' '}
                    {lastSavedEntry.analysis.concerns.join(', ')}
                  </div>
                )}
                {lastSavedEntry.analysis.behavioral_signals && (
                  <div>
                    <span className="font-semibold text-amber-700">Pattern Signals:</span>{' '}
                    {lastSavedEntry.analysis.behavioral_signals.join(', ')}
                  </div>
                )}
                {lastSavedEntry.analysis.goals && lastSavedEntry.analysis.goals.length > 0 && (
                  <div>
                    <span className="font-semibold text-emerald-700">Active Goals:</span>{' '}
                    {lastSavedEntry.analysis.goals.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action to Continue in Multi-turn Reflection */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-200/60">
            <span className="text-xs text-stone-500">
              Timeline Thread and Personal Memory updated automatically.
            </span>
            <div className="flex items-center space-x-2">
              <button
                id="view-timeline-after-save-btn"
                onClick={onNavigateToTimeline}
                className="px-3.5 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 text-stone-800 text-xs font-semibold transition-colors"
              >
                View Timeline Synthesis →
              </button>
              <button
                id="continue-reflection-btn"
                onClick={() => onNavigateToReflection(lastSavedEntry)}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Continue with Gemini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent History Feed */}
      {recentEntries.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-stone-900">
              Recent Personal Journal Entries
            </h2>
            <span className="text-xs text-stone-400 font-medium">
              {recentEntries.length} memories stored
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentEntries.slice(0, 4).map((entry) => (
              <div
                key={entry.id}
                className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    {entry.analysis?.mood && (
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[11px] font-medium">
                        {entry.analysis.mood}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-800 line-clamp-3 leading-relaxed">
                    "{entry.content}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {(entry.analysis?.themes || []).slice(0, 2).map((t, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => onNavigateToReflection(entry)}
                    className="text-amber-700 hover:text-amber-900 font-medium text-xs flex items-center space-x-1"
                  >
                    <span>Reflect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
