import React, { useState } from 'react';
import { 
  Sparkles, 
  PenLine, 
  Mic, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Lightbulb, 
  Compass, 
  Heart, 
  Quote,
  ChevronRight,
  Flame,
  Zap,
  Check,
  X
} from 'lucide-react';
import { 
  JournalEntry, 
  Memory, 
  TimelineThread, 
  NudgeRecord, 
  UserProfile 
} from '../types';
import { VoiceRecorderModal } from './VoiceRecorderModal';

interface HomeViewProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onContinueAsGuest?: () => void;
  onNavigateToReflect: (initialText?: string, autoOpenVoice?: boolean) => void;
  onNavigateToTimeline: () => void;
  onNavigateToInsights: () => void;
  onUpdateNudgeStatus?: (nudgeId: string, status: NudgeRecord['status'], outcome?: string) => void;
  entries: JournalEntry[];
  memories: Memory[];
  threads: TimelineThread[];
  nudges: NudgeRecord[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  userProfile,
  onOpenAuth,
  onContinueAsGuest,
  onNavigateToReflect,
  onNavigateToTimeline,
  onNavigateToInsights,
  onUpdateNudgeStatus,
  entries,
  memories,
  threads,
  nudges
}) => {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // 1. Check if user has reflected today
  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0];
  
  const todayEntries = entries.filter((entry) => {
    try {
      const entryDate = new Date(entry.createdAt).toISOString().split('T')[0];
      return entryDate === todayDateString;
    } catch {
      return false;
    }
  });

  const hasReflectedToday = todayEntries.length > 0;
  const latestTodayEntry = todayEntries[0] || null;
  const latestGeneralEntry = entries[0] || null;

  // 2. Derive prominent "Gemini Noticed" observation
  const activeThread = threads[0] || null;
  const highlightedMemory = memories.find((m) => m.importance >= 0.7) || memories[0] || null;

  const geminiObservation = highlightedMemory 
    ? highlightedMemory.content
    : (activeThread 
        ? activeThread.insight 
        : "Gemini is learning your personal baseline. As you share reflections, it will surface grounded observations on what unblocks you.");

  // 3. Active or Contextual Gentle Nudge
  const pendingNudge = nudges.find((n) => n.status === 'pending' || n.status === 'sent') || null;

  // 4. Time-based greeting
  const hour = today.getHours();
  let timeGreeting = "Good morning";
  if (hour >= 12 && hour < 17) {
    timeGreeting = "Good afternoon";
  } else if (hour >= 17) {
    timeGreeting = "Good evening";
  }

  const firstName = userProfile?.displayName ? userProfile.displayName.split(' ')[0] : 'friend';

  const formattedToday = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const handleVoiceCheckinComplete = (transcript: string, durationSeconds: number) => {
    setIsVoiceModalOpen(false);
    onNavigateToReflect(transcript);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      
      {/* 1. PRODUCT IDENTITY & INTRODUCTORY HEADER (Sits naturally above the Bento Grid) */}
      <div className="mb-10 pt-2 pb-7 border-b border-stone-200/80">
        
        {/* Brand Bar: DAYMARK + Tagline */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
          <div>
            <div className="flex items-baseline space-x-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[0.16em] text-stone-900 uppercase">
                DAYMARK
              </h1>
              <span className="hidden sm:inline-block text-stone-300 font-light text-xl">•</span>
              <p className="text-sm sm:text-base text-stone-500 font-serif italic tracking-normal">
                “Make a mark on your day.”
              </p>
            </div>
            <p className="text-xs text-stone-500 font-serif italic sm:hidden mt-1">
              “Make a mark on your day.”
            </p>
          </div>

          {/* Date and Daily Mark Status Badge */}
          <div className="flex items-center space-x-3 text-xs text-stone-600">
            <span className="font-medium">{formattedToday}</span>
            <span className="text-stone-300">•</span>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 shadow-2xs font-medium text-stone-700">
              {hasReflectedToday ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-stone-800">Marked for today</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-stone-700">Ready to reflect</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 2. PERSONAL CONTEXT & 3. PRIMARY DAILY ACTION */}
        <div className="mt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              {timeGreeting}, {firstName}.
            </h2>
            <p className="text-sm sm:text-base text-stone-600 font-serif italic mt-1.5">
              Take a moment to check in with yourself.
            </p>
          </div>

          {/* Primary Action: Write today's reflection */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="home-primary-write-reflection-btn"
              onClick={() => onNavigateToReflect()}
              className="inline-flex items-center space-x-2.5 px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition-all shadow-sm hover:shadow group cursor-pointer"
            >
              <PenLine className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
              <span>{hasReflectedToday ? "Continue today's reflection" : "Write today's reflection"}</span>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              id="home-quick-voice-btn"
              onClick={() => setIsVoiceModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-3 rounded-xl bg-white hover:bg-stone-50 text-stone-800 font-medium text-sm transition-all border border-stone-200/90 shadow-2xs cursor-pointer"
            >
              <Mic className="w-4 h-4 text-amber-600" />
              <span>60s Voice note</span>
            </button>
          </div>
        </div>

        {/* Quick starter reflection prompts (when not yet reflected today) */}
        {!hasReflectedToday && (
          <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-stone-200/40">
            <span className="text-xs text-stone-500 font-medium mr-1">Or start with:</span>
            {[
              "Feeling friction on my project",
              "Took a small action today",
              "Feeling clear and focused",
              "A bit overwhelmed"
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => onNavigateToReflect(prompt)}
                className="text-xs px-3 py-1.5 rounded-lg bg-stone-100/80 hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200/60 hover:border-amber-200 transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Unauthenticated exploration banner with explicit Continue as Guest alongside Sign In */}
        {!userProfile && (
          <div className="mt-5 p-3.5 bg-stone-100/80 border border-stone-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-stone-600 animate-fadeIn">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Explore DAYMARK with a temporary session, or sign in to save your personal reflections to Firebase.</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                id="home-banner-continue-guest-btn"
                onClick={onContinueAsGuest}
                className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-800 font-medium hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
              >
                Continue as Guest
              </button>
              <button
                id="home-banner-signin-btn"
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. EXISTING BENTO DASHBOARD (Begins directly after header and introductory section) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* CARD 1: TODAY'S CHECK-IN / PRIMARY CTA (Spans 7 cols on md) */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-stone-300 transition-all">
          {/* Subtle warm backdrop accent */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                  <PenLine className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold tracking-wider uppercase text-amber-900">
                  Today's Check-in
                </span>
              </div>
              <span className="text-[11px] text-stone-600">
                {hasReflectedToday ? 'Recorded' : 'Not started'}
              </span>
            </div>

            {hasReflectedToday && latestTodayEntry ? (
              <div className="mb-6">
                <h3 className="text-base font-semibold text-stone-900 mb-1.5">
                  "{latestTodayEntry.content.slice(0, 120)}{latestTodayEntry.content.length > 120 ? '...' : ''}"
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {latestTodayEntry.analysis?.mood && (
                    <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 text-xs font-medium">
                      Mood: {latestTodayEntry.analysis.mood}
                    </span>
                  )}
                  {latestTodayEntry.analysis?.emotional_tone && (
                    <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200/50 text-xs">
                      {latestTodayEntry.analysis.emotional_tone}
                    </span>
                  )}
                  {latestTodayEntry.inputMode === 'voice' && (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs flex items-center space-x-1">
                      <Mic className="w-3 h-3" />
                      <span>Voice note ({latestTodayEntry.voiceDurationSeconds || 60}s)</span>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <h3 className="text-lg font-serif font-bold text-stone-900 mb-2">
                  How are you doing right now?
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
                  Capture your current headspace. Whether it's friction, a quiet victory, or open thoughts, Gemini connects it to your story.
                </p>

                {/* Quick 1-click reflection chips */}
                <div className="flex flex-wrap gap-2">
                  {[
                    "Feeling friction on my project",
                    "Took a small action today",
                    "Feeling clear and focused",
                    "A bit overwhelmed"
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => onNavigateToReflect(prompt)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 hover:border-amber-200 transition-colors text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Primary CTA Buttons */}
          <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
            <button
              id="home-primary-reflect-btn"
              onClick={() => onNavigateToReflect()}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm transition-all shadow-sm hover:shadow group"
            >
              <span>{hasReflectedToday ? 'Continue reflection' : 'Start reflection'}</span>
              <ArrowRight className="w-4 h-4 text-stone-300 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              id="home-quick-voice-btn"
              onClick={() => setIsVoiceModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-800 font-medium text-xs sm:text-sm transition-all border border-stone-200/60"
            >
              <Mic className="w-4 h-4 text-amber-600" />
              <span>60s Voice check-in</span>
            </button>
          </div>
        </div>

        {/* CARD 2: GENTLE NUDGE (Spans 5 cols on md) */}
        <div className="md:col-span-5 bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold tracking-wider uppercase text-emerald-900">
                  Gentle Nudge
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-800 uppercase px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-200/60">
                Low Friction
              </span>
            </div>

            {pendingNudge ? (
              <div className="mt-2">
                <p className="text-xs font-semibold text-stone-500 mb-1">
                  Contextual Suggestion
                </p>
                <p className="text-sm font-medium text-stone-900 leading-relaxed mb-4 bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                  "{pendingNudge.message}"
                </p>
                {pendingNudge.suggestedAction && (
                  <p className="text-xs text-amber-800 font-medium mb-3">
                    → Suggested step: {pendingNudge.suggestedAction}
                  </p>
                )}
                
                {/* Nudge Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (onUpdateNudgeStatus) {
                        onUpdateNudgeStatus(pendingNudge.id, 'responded');
                      }
                      if (pendingNudge.intervention_type === 'voice_checkin') {
                        setIsVoiceModalOpen(true);
                      } else {
                        onNavigateToReflect(`Responding to nudge: ${pendingNudge.message}`);
                      }
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Act on nudge</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onUpdateNudgeStatus) {
                        onUpdateNudgeStatus(pendingNudge.id, 'dismissed');
                      }
                    }}
                    className="py-2 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-medium transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-xs font-semibold text-stone-500 mb-1">
                  Quiet Companion
                </p>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed mb-4">
                  {hasReflectedToday 
                    ? "Gemini noticed your check-in. All quiet hours and frequency limits are active—no unsolicited interruptions."
                    : "No pending reminders. Gemini gives you spacious time to check in when you are ready."}
                </p>
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60 text-xs text-stone-600 flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Need a 1-minute reset? A quick 60-second audio stream automatically structures your thoughts into memories.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 mt-4">
            <span>Adaptive AI Frequency: Active</span>
            <button 
              onClick={onNavigateToInsights}
              className="text-stone-700 hover:text-stone-900 font-medium hover:underline flex items-center space-x-1"
            >
              <span>View intelligence</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* CARD 3: GEMINI NOTICED (Spans 6 cols on md) */}
        <div className="md:col-span-6 bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-800">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold tracking-wider uppercase text-purple-900">
                  Gemini Noticed
                </span>
              </div>
              <span className="text-[11px] text-stone-600">
                Memory synthesis
              </span>
            </div>

            <p className="text-xs font-semibold text-stone-500 mb-1.5">
              Longitudinal Observation
            </p>
            <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/60 mb-4">
              <p className="text-sm font-medium text-stone-800 leading-relaxed">
                "{geminiObservation}"
              </p>
            </div>

            {highlightedMemory?.themes && highlightedMemory.themes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {highlightedMemory.themes.slice(0, 3).map((theme, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                    #{theme}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">
              {memories.length} memories retained
            </span>
            <button
              onClick={onNavigateToTimeline}
              className="text-amber-800 hover:text-amber-900 font-semibold inline-flex items-center space-x-1"
            >
              <span>Explore memory bank</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 4: YOUR PATTERN (Spans 6 cols on md) */}
        <div className="md:col-span-6 bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-800">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold tracking-wider uppercase text-blue-900">
                  Your Pattern
                </span>
              </div>
              <span className="text-[11px] text-stone-600">
                Behavioral Arc
              </span>
            </div>

            <p className="text-xs font-semibold text-stone-500 mb-1.5">
              Detected Progression
            </p>

            {activeThread ? (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-stone-900 mb-1">
                  {activeThread.title}
                </h4>
                <div className="p-3 bg-amber-50/70 border border-amber-200/50 rounded-xl mb-3">
                  <div className="text-xs font-mono font-medium text-amber-900 flex items-center space-x-1">
                    <span>{activeThread.pattern}</span>
                  </div>
                </div>
                <p className="text-xs text-stone-600 line-clamp-2">
                  {activeThread.insight}
                </p>
              </div>
            ) : (
              <div className="mb-4 bg-stone-50 p-4 rounded-xl border border-stone-200/60">
                <p className="text-xs text-stone-600 leading-relaxed">
                  Log a few check-ins to unlock your personal Avoidance → Progress trajectory. Gemini tracks subtle emotional transitions over time.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">
              {threads.length > 0 ? `${threads.length} active threads` : 'Pattern synthesizer active'}
            </span>
            <button
              onClick={onNavigateToInsights}
              className="text-blue-800 hover:text-blue-900 font-semibold inline-flex items-center space-x-1"
            >
              <span>View full Insights</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Voice Recorder Modal Trigger */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscriptComplete={handleVoiceCheckinComplete}
      />
    </div>
  );
};
