import { 
  AnalysisResult, 
  TimelineThread, 
  NudgeDecision, 
  PolicyCheckResult, 
  NudgeRecord, 
  ChatMessage, 
  AIActivityStep,
  JournalEntry,
  Memory,
  UserPreferences
} from '../types';

export async function analyzeEntryApi(content: string, inputMode: 'text' | 'voice' | 'quick_reflection' = 'text', userId?: string): Promise<{
  analysis: AnalysisResult;
  activityStep: AIActivityStep;
}> {
  const response = await fetch('/api/analyze-entry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, inputMode, userId })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to analyze check-in.');
  }

  return response.json();
}

export async function synthesizeTimelineApi(
  currentEntry: { content: string; analysis?: AnalysisResult },
  recentMemories: Memory[],
  existingThreads: TimelineThread[],
  userId?: string
): Promise<{
  thread: TimelineThread;
  activityStep: AIActivityStep;
}> {
  const response = await fetch('/api/synthesize-timeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentEntry, recentMemories, existingThreads, userId })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to synthesize timeline.');
  }

  return response.json();
}

export async function evaluateNudgeApi(params: {
  userId: string;
  preferences: UserPreferences;
  recentEntries: JournalEntry[];
  activeMemories: Memory[];
  activeThreads: TimelineThread[];
  pastNudges: NudgeRecord[];
  simulatedHoursSinceLastCheckin?: number;
  currentLocalHour?: number;
}): Promise<{
  decision: NudgeDecision;
  policyResult: PolicyCheckResult;
  nudgeRecord: NudgeRecord;
  activityStep: AIActivityStep;
}> {
  const response = await fetch('/api/evaluate-nudge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to evaluate nudge decision.');
  }

  return response.json();
}

export async function multiTurnReflectionApi(params: {
  userId?: string;
  currentEntry?: JournalEntry | null;
  relevantMemories?: Memory[];
  messages: { sender: 'user' | 'gemini'; text: string }[];
}): Promise<{
  responseMessage: ChatMessage;
  modelUsed: string;
}> {
  const response = await fetch('/api/multi-turn-reflection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate reflection response.');
  }

  return response.json();
}

export async function getSystemStatusApi(): Promise<{
  status: string;
  geminiConfigured: boolean;
  primaryModel: string;
  modelsLadder: string[];
  secretManagerMode: string;
}> {
  const response = await fetch('/api/system-status');
  if (!response.ok) {
    throw new Error('Failed to fetch system status.');
  }
  return response.json();
}
