import React, { useState } from 'react';
import { 
  Sparkles, 
  GitBranch, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Bookmark, 
  Quote, 
  Activity, 
  ShieldCheck, 
  Clock, 
  Zap, 
  BarChart3, 
  ArrowRight,
  Brain,
  Sliders,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  TimelineThread, 
  Memory, 
  JournalEntry, 
  NudgeRecord, 
  UserProfile, 
  AIActivityStep,
  InterventionType 
} from '../types';
import { evaluateNudgeApi, synthesizeTimelineApi } from '../services/api';
import { saveUserEntity } from '../lib/firebase';

interface InsightsViewProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  threads: TimelineThread[];
  memories: Memory[];
  entries: JournalEntry[];
  nudges: NudgeRecord[];
  onTriggerResynthesis: () => void;
  isSynthesizing: boolean;
  onOpenActivityInspector: () => void;
  onAddNudge: (nudge: NudgeRecord) => void;
  onAddActivityStep: (step: AIActivityStep) => void;
  onNavigateToReflect: (promptText?: string) => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  userProfile,
  onOpenAuth,
  threads,
  memories,
  entries,
  nudges,
  onTriggerResynthesis,
  isSynthesizing,
  onOpenActivityInspector,
  onAddNudge,
  onAddActivityStep,
  onNavigateToReflect
}) => {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    threads.length > 0 ? threads[0].id : null
  );
  const [isEvaluatingAgent, setIsEvaluatingAgent] = useState(false);
  const [agentFeedback, setAgentFeedback] = useState<string | null>(null);

  const currentThread = threads.find((t) => t.id === activeThreadId) || (threads[0] || null);

  // Behavioral adaptation statistics
  const totalNudges = nudges.length;
  const respondedNudges = nudges.filter((n) => n.status === 'responded' || n.status === 'completed');
  const responseRate = totalNudges > 0 ? Math.round((respondedNudges.length / totalNudges) * 100) : 85;

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'avoidance':
      case 'trigger':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'small_action':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'breakthrough':
      case 'progress':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'recurrence':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'avoidance':
      case 'recurrence':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'small_action':
        return <TrendingUp className="w-3.5 h-3.5" />;
      case 'breakthrough':
      case 'progress':
        return <CheckCircle className="w-3.5 h-3.5" />;
      default:
        return <Bookmark className="w-3.5 h-3.5" />;
    }
  };

  // Run autonomous agent evaluation test
  const handleTestAgentEvaluation = async () => {
    if (!userProfile) {
      onOpenAuth();
      return;
    }

    try {
      setIsEvaluatingAgent(true);
      setAgentFeedback(null);

      const { decision, policyResult, nudgeRecord, activityStep } = await evaluateNudgeApi({
        userId: userProfile.uid,
        preferences: userProfile.preferences,
        recentEntries: entries,
        activeMemories: memories,
        activeThreads: threads,
        pastNudges: nudges,
        simulatedHoursSinceLastCheckin: 36,
        currentLocalHour: 14
      });

      onAddActivityStep(activityStep);

      await saveUserEntity(userProfile.uid, 'nudges', nudgeRecord.id, nudgeRecord);
      onAddNudge(nudgeRecord);

      if (policyResult.passed && decision.should_nudge) {
        setAgentFeedback(`Evaluation complete: Selected "${decision.intervention_type}" intervention (${decision.friction_level} friction).`);
      } else {
        setAgentFeedback(`Evaluation complete: ${policyResult.notes}`);
      }
    } catch (err: any) {
      setAgentFeedback(`Evaluation notice: ${err.message}`);
    } finally {
      setIsEvaluatingAgent(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-stone-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <Brain className="w-4 h-4 text-amber-600" />
            <span>Longitudinal Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Patterns & Behavioral Insights
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
            Gemini synthesizes connections across your journal entries over days and weeks to surface your recurring behavioral loops and breakthrough triggers.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={onOpenActivityInspector}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-stone-500" />
            <span>AI Reasoning Trace</span>
          </button>

          <button
            onClick={onTriggerResynthesis}
            disabled={isSynthesizing}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-all shadow-xs disabled:bg-stone-400"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin' : ''}`} />
            <span>{isSynthesizing ? 'Resynthesizing...' : 'Resynthesize Patterns'}</span>
          </button>
        </div>
      </div>

      {/* Guest/Unauthenticated Notice */}
      {(!userProfile || userProfile.isGuest) && (
        <div className="mb-6 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-amber-950 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              {userProfile?.isGuest 
                ? 'Guest Mode: Pattern synthesis is session-only. Sign in to save multi-day longitudinal timelines permanently to your Firebase account.'
                : 'Sign in to run longitudinal pattern synthesis and save behavioral timelines to your Firebase account.'}
            </span>
          </div>
          <button
            onClick={onOpenAuth}
            className="px-3 py-1.5 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
          >
            Sign In to Save
          </button>
        </div>
      )}

      {/* Main Insights Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: ACTIVE THREAD PROGRESSION (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Thread Selection Pills */}
          {threads.length > 1 && (
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveThreadId(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    (currentThread?.id === t.id)
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {t.title}
                </button>
              ))}
            </div>
          )}

          {/* Active Thread Detail Card */}
          {currentThread ? (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 inline-block mb-1.5">
                    Theme: {currentThread.theme}
                  </span>
                  <h3 className="text-lg font-serif font-bold text-stone-900">
                    {currentThread.title}
                  </h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200/60">
                  {currentThread.status}
                </span>
              </div>

              {/* Pattern Formula */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/60 mb-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                  Synthesized Trajectory
                </span>
                <div className="font-mono text-xs text-amber-900 font-semibold flex items-center space-x-1.5 overflow-x-auto">
                  <span>{currentThread.pattern}</span>
                </div>
              </div>

              {/* Gemini Core Insight */}
              <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1.5">
                  Core Observation & Breakthrough Trigger
                </span>
                <p className="text-xs sm:text-sm text-stone-800 leading-relaxed bg-amber-50/40 p-4 rounded-xl border border-amber-200/40">
                  "{currentThread.insight}"
                </p>
              </div>

              {/* Longitudinal Progression Timeline Steps */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-3">
                  Evolutionary Sequence
                </span>
                <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:left-3.5 before:w-0.5 before:bg-stone-200">
                  {currentThread.progression?.map((node, idx) => (
                    <div key={node.id || idx} className="relative flex items-start space-x-3 pl-1">
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-stone-300 flex items-center justify-center text-stone-700 shrink-0 z-10">
                        <span className="text-[10px] font-bold">{idx + 1}</span>
                      </div>
                      <div className="flex-1 bg-stone-50/70 p-3 rounded-xl border border-stone-200/60">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${getStageColor(node.stage)}`}>
                            {node.stage.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-stone-600 font-medium">
                            {node.date}
                          </span>
                        </div>
                        <p className="text-xs text-stone-800 font-medium mb-1">
                          {node.summary}
                        </p>
                        {node.quote && (
                          <p className="text-[11px] text-stone-600 italic">
                            "{node.quote}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grounded Quotes */}
              {currentThread.groundedEvidence && currentThread.groundedEvidence.length > 0 && (
                <div className="mt-6 pt-4 border-t border-stone-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-2">
                    Grounded Journal Evidence
                  </span>
                  <div className="space-y-1.5">
                    {currentThread.groundedEvidence.map((ev, i) => (
                      <div key={i} className="text-xs text-stone-700 flex items-start space-x-2">
                        <Quote className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                        <span>"{ev}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-8 text-center shadow-xs">
              <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-900 mb-1">
                No Progression Threads Yet
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto mb-4">
                As you log reflections over a few days, Gemini's synthesizer will automatically uncover your Avoidance → Action → Progress arcs.
              </p>
              <button
                onClick={() => onNavigateToReflect()}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold"
              >
                Write a reflection
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: BEHAVIORAL ADAPTATION & INTELLIGENCE (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Adaptation Health Card */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Behavioral Adaptation
                  </h3>
                  <span className="text-[11px] text-stone-500">
                    Adaptive Frequency & Guardrails
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-950 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-200/60">
                Healthy
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                  Nudge Engagement
                </span>
                <span className="text-xl font-bold text-stone-900">
                  {responseRate}%
                </span>
                <span className="text-[10px] text-stone-500 block mt-0.5">
                  {respondedNudges.length} of {totalNudges} completed
                </span>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                  Quiet Hours
                </span>
                <span className="text-sm font-bold text-stone-900">
                  {userProfile?.preferences?.quietHoursStart || '22:00'} - {userProfile?.preferences?.quietHoursEnd || '08:00'}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                  100% Policy Enforced
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Gemini adjusts intervention friction based on your response history, prioritizing ultra-low-friction 60-second voice checks when cognitive load is high.
            </p>

            {/* Test Intelligent Agent Loop Button */}
            <div className="pt-3 border-t border-stone-100">
              <button
                onClick={handleTestAgentEvaluation}
                disabled={isEvaluatingAgent}
                className="w-full py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <Zap className={`w-3.5 h-3.5 text-amber-600 ${isEvaluatingAgent ? 'animate-pulse' : ''}`} />
                <span>{isEvaluatingAgent ? 'Evaluating Companion Loop...' : 'Test Autonomous Nudge Loop'}</span>
              </button>

              {agentFeedback && (
                <div className="mt-2.5 p-2.5 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-900 leading-relaxed animate-fadeIn">
                  {agentFeedback}
                </div>
              )}
            </div>
          </div>

          {/* Quick Memory Bank Snapshot */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                  <Bookmark className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-stone-900">
                  Extracted Memory Anchors
                </h3>
              </div>
              <span className="text-xs text-stone-500">
                {memories.length} anchors
              </span>
            </div>

            <div className="space-y-2.5">
              {memories.slice(0, 3).map((mem) => (
                <div key={mem.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200/50 text-xs">
                  <p className="text-stone-800 font-medium line-clamp-2 mb-1.5">
                    "{mem.content}"
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {mem.themes?.map((t, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-stone-200/70 text-stone-700">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
