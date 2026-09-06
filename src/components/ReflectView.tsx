import React, { useState, useEffect, useRef } from 'react';
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
  Volume2,
  Lock,
  RotateCcw,
  PenLine,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  JournalEntry, 
  Memory, 
  TimelineThread, 
  UserProfile, 
  AIActivityStep,
  ChatMessage,
  Conversation
} from '../types';
import { analyzeEntryApi, synthesizeTimelineApi, multiTurnReflectionApi } from '../services/api';
import { saveUserEntity } from '../lib/firebase';
import { VoiceRecorderModal } from './VoiceRecorderModal';

interface ReflectViewProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onCheckinComplete: (entry: JournalEntry, memory: Memory, thread?: TimelineThread) => void;
  onNavigateToTimeline: () => void;
  onAddActivityStep: (step: AIActivityStep) => void;
  recentEntries: JournalEntry[];
  recentMemories: Memory[];
  existingThreads: TimelineThread[];
  initialDraftText?: string;
  autoOpenVoice?: boolean;
}

const STARTER_PROMPTS = [
  { label: 'Avoidance & Resistance', text: "I find myself stalling on my core project and feeling subtle friction to begin." },
  { label: 'A 5-Minute Micro Step', text: "I committed to doing just 5 minutes of work to unfreeze the momentum." },
  { label: 'Relief & Breakthrough', text: "Once I pushed past the initial friction, the task felt light and manageable." },
  { label: 'Emotional Loop', text: "Feeling mentally drained by too many competing priorities and open tabs." },
  { label: 'Grateful & Grounded', text: "Taking a moment of quiet reflection to appreciate where things stand today." }
];

export const ReflectView: React.FC<ReflectViewProps> = ({
  userProfile,
  onOpenAuth,
  onCheckinComplete,
  onNavigateToTimeline,
  onAddActivityStep,
  recentEntries,
  recentMemories,
  existingThreads,
  initialDraftText = '',
  autoOpenVoice = false
}) => {
  const [content, setContent] = useState(initialDraftText);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(autoOpenVoice);
  const [inputMode, setInputMode] = useState<'text' | 'voice' | 'quick_reflection'>('text');
  const [voiceDuration, setVoiceDuration] = useState<number | undefined>(undefined);
  const [lastSavedEntry, setLastSavedEntry] = useState<JournalEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Companion chat state
  const [isCompanionExpanded, setIsCompanionExpanded] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Update initial text if passed
  useEffect(() => {
    if (initialDraftText) {
      setContent(initialDraftText);
    }
  }, [initialDraftText]);

  // Submit Reflection for Gemini Synthesis
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

      // 2. Extract Memory record
      const memoryId = `mem_${Date.now()}`;
      const newMemory: Memory = {
        id: memoryId,
        userId: userProfile.uid,
        entryId: entryId,
        timestamp: nowIso,
        content: content.trim(),
        themes: analysis.themes || [],
        goals: analysis.goals || [],
        concerns: analysis.concerns || [],
        behavioral_signals: analysis.behavioral_signals || [],
        importance: analysis.importance || 0.7
      };

      // 3. Persist safely
      await saveUserEntity(userProfile.uid, 'journalEntries', entryId, newEntry);
      await saveUserEntity(userProfile.uid, 'memories', memoryId, newMemory);

      // 4. Synthesize updated timeline thread
      let synthesizedThread: TimelineThread | undefined;
      const allMemoriesForSynthesis = [newMemory, ...recentMemories];

      if (allMemoriesForSynthesis.length >= 2) {
        try {
          const { thread, activityStep: threadStep } = await synthesizeTimelineApi(
            { content: newEntry.content, analysis: newEntry.analysis },
            allMemoriesForSynthesis,
            existingThreads,
            userProfile.uid
          );

          if (threadStep) onAddActivityStep(threadStep);

          if (thread) {
            const threadId = thread.id || `thread_${Date.now()}`;
            const safeThread = {
              ...thread,
              id: threadId,
              userId: userProfile.uid,
              updatedAt: new Date().toISOString()
            };
            synthesizedThread = safeThread;
            await saveUserEntity(userProfile.uid, 'timelineThreads', threadId, safeThread);
          }
        } catch (synthErr) {
          console.warn('Background thread synthesis note:', synthErr);
        }
      }

      setLastSavedEntry(newEntry);
      onCheckinComplete(newEntry, newMemory, synthesizedThread);

      // Seed initial companion chat message
      const initialGreeting: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: 'gemini',
        text: `I've saved your reflection and analyzed your state (${analysis.mood}). How would you like to explore what you're feeling further?`,
        timestamp: new Date().toISOString()
      };
      setChatMessages([initialGreeting]);
      setIsCompanionExpanded(true);

    } catch (err: any) {
      console.error('Reflection submission error:', err);
      setError(err.message || 'Failed to analyze reflection. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceComplete = (transcript: string, durationSeconds: number) => {
    setContent(transcript);
    setInputMode('voice');
    setVoiceDuration(durationSeconds);
    setIsVoiceModalOpen(false);
  };

  // Companion Chat Sending
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !userProfile) return;

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInput('');
    setIsChatSending(true);

    try {
      const { responseMessage } = await multiTurnReflectionApi({
        userId: userProfile.uid,
        currentEntry: lastSavedEntry || recentEntries[0] || null,
        relevantMemories: recentMemories.slice(0, 5),
        messages: updated.map((m) => ({ sender: m.sender, text: m.text }))
      });

      setChatMessages((prev) => [...prev, responseMessage]);

      // Save conversation state
      if (lastSavedEntry) {
        await saveUserEntity(userProfile.uid, 'conversations', `conv_${lastSavedEntry.id}`, {
          id: `conv_${lastSavedEntry.id}`,
          userId: userProfile.uid,
          journalEntryId: lastSavedEntry.id,
          title: `Reflection on ${new Date().toLocaleDateString()}`,
          updatedAt: new Date().toISOString(),
          messages: [...updated, responseMessage]
        });
      }
    } catch (chatErr) {
      console.error('Companion chat error:', chatErr);
    } finally {
      setIsChatSending(false);
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn">
      
      {/* Top Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/60 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Frictionless Reflection Space</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
          Reflect & Synthesize
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1.5">
          Speak or write freely. Gemini analyzes your emotional tone, extracts long-term patterns, and keeps your journey connected.
        </p>
        {userProfile?.isGuest && (
          <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-200 text-amber-900 text-[11px]">
            <span>Guest session: Reflections reset upon refresh.</span>
            <button
              onClick={onOpenAuth}
              className="underline font-semibold hover:text-stone-900 ml-1 cursor-pointer"
            >
              Sign in to save permanently
            </button>
          </div>
        )}
      </div>

      {/* Main Journal Writing Box */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 sm:p-8 mb-6">
        
        {/* Quick starter prompts */}
        <div className="mb-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-600 block mb-2">
            Starter Prompts (Click to fill)
          </span>
          <div className="flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setContent(p.text);
                  setInputMode('quick_reflection');
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 hover:border-amber-200 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <textarea
              id="reflect-content-textarea"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (inputMode !== 'voice') setInputMode('text');
              }}
              rows={5}
              placeholder="What's happening in your day? Where is there friction, avoidance, relief, or momentum?"
              className="w-full p-4 rounded-xl bg-stone-50/70 border border-stone-200 text-stone-900 placeholder:text-stone-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm leading-relaxed transition-all resize-none"
            />

            {/* Mode Indicator & Word count */}
            <div className="flex items-center justify-between text-[11px] text-stone-600 mt-1 px-1">
              <span>
                {inputMode === 'voice' && (
                  <span className="text-emerald-700 font-medium inline-flex items-center space-x-1">
                    <Mic className="w-3 h-3" />
                    <span>Voice transcript ({voiceDuration || 60}s)</span>
                  </span>
                )}
                {inputMode === 'quick_reflection' && "Guided reflection prompt"}
                {inputMode === 'text' && "Natural text stream"}
              </span>
              <span>{content.trim() ? `${content.trim().split(/\s+/).length} words` : '0 words'}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              id="reflect-voice-btn"
              onClick={() => setIsVoiceModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-800 font-medium text-xs sm:text-sm transition-all border border-stone-200/60"
            >
              <Mic className="w-4 h-4 text-amber-600" />
              <span>Record 60s Voice Note</span>
            </button>

            <button
              type="submit"
              id="reflect-submit-btn"
              disabled={isSubmitting || !content.trim()}
              className={`inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-all shadow-sm ${
                isSubmitting || !content.trim()
                  ? 'bg-stone-400 cursor-not-allowed'
                  : 'bg-stone-900 hover:bg-stone-800 active:scale-98'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Reflection...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Reflect & Synthesize</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* SYNTHESIZED RESULT CARD (When reflection is processed) */}
      {lastSavedEntry && lastSavedEntry.analysis && (
        <div className="bg-white rounded-2xl border border-amber-200/80 p-6 sm:p-7 shadow-xs mb-6 animate-fadeIn">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Reflection Saved & Synthesized
                </h3>
                <span className="text-[11px] text-stone-500">
                  Longitudinal memory extracted and synced
                </span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-semibold">
              Mood: {lastSavedEntry.analysis.mood}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/50">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                Emotional Tone
              </span>
              <span className="text-xs font-medium text-stone-800">
                {lastSavedEntry.analysis.emotional_tone || 'Reflective'}
              </span>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/50">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                Themes Identified
              </span>
              <div className="flex flex-wrap gap-1">
                {lastSavedEntry.analysis.themes?.slice(0, 2).map((t, i) => (
                  <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-stone-200/60 text-stone-700">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/50">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                Behavioral Signal
              </span>
              <span className="text-xs font-medium text-stone-800">
                {lastSavedEntry.analysis.behavioral_signals?.[0] || 'Progress Step'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setIsCompanionExpanded(!isCompanionExpanded)}
              className="text-xs font-semibold text-amber-800 hover:text-amber-900 inline-flex items-center space-x-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isCompanionExpanded ? 'Hide Companion Chat' : 'Deepen this Reflection with Gemini'}</span>
              {isCompanionExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onNavigateToTimeline}
              className="text-xs text-stone-600 hover:text-stone-900 font-medium hover:underline flex items-center space-x-1"
            >
              <span>View in Timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* COMPANION CONVERSATIONAL REFLECTION THREAD */}
      {isCompanionExpanded && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 animate-fadeIn">
          <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-stone-100">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Companion Reflection Thread
              </h3>
              <span className="text-[11px] text-stone-500">
                Grounded in your memories and emotional arc
              </span>
            </div>
          </div>

          {/* Chat message history */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 mb-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-stone-900 text-white rounded-br-xs'
                      : 'bg-stone-100 text-stone-800 border border-stone-200/70 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isChatSending && (
              <div className="flex justify-start">
                <div className="bg-stone-100 text-stone-500 p-3 rounded-2xl text-xs flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"></div>
                  <span>Gemini is reflecting...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat input box */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChatMessage();
                }
              }}
              placeholder="Ask Gemini to explore patterns, break down friction, or notice trends..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            <button
              onClick={handleSendChatMessage}
              disabled={isChatSending || !chatInput.trim()}
              className="p-2.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Voice Recorder Modal */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscriptComplete={handleVoiceComplete}
      />
    </div>
  );
};
