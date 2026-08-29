/**
 * Core type definitions for DAYMARK
 */

export interface AnalysisResult {
  mood: string;
  emotions: string[];
  key_events: string[];
  themes: string[];
  goals: string[];
  concerns: string[];
  behavioral_signals: string[];
  emotional_tone: string;
  importance: number; // 0.0 to 1.0
}

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  inputMode: 'text' | 'voice' | 'quick_reflection';
  createdAt: string; // ISO date string
  analysis?: AnalysisResult;
  voiceDurationSeconds?: number;
}

export interface Memory {
  id: string;
  userId: string;
  entryId: string;
  timestamp: string;
  content: string;
  themes: string[];
  goals: string[];
  concerns: string[];
  behavioral_signals: string[];
  importance: number;
}

export interface TimelineThreadNode {
  id: string;
  date: string;
  summary: string;
  stage: 'trigger' | 'avoidance' | 'small_action' | 'breakthrough' | 'recurrence' | 'progress' | 'reflection';
  theme: string;
  sourceMemoryId?: string;
  quote?: string;
}

export interface TimelineThread {
  id: string;
  userId: string;
  title: string;
  theme: string;
  pattern: string; // e.g. "fear → avoidance → small action → progress → recurrence"
  insight: string;
  groundedEvidence: string[];
  updatedAt: string;
  progression: TimelineThreadNode[];
  status: 'active' | 'resolved' | 'evolving';
}

export type InterventionType = 
  | 'voice_checkin'
  | 'micro_step_prompt'
  | 'reflective_question'
  | 'grounding_pause'
  | 'progress_recall';

export type FrictionLevel = 'ultra_low' | 'low' | 'medium';

export type NudgeStatus = 'pending' | 'sent' | 'opened' | 'dismissed' | 'ignored' | 'responded' | 'completed';

export interface NudgeDecision {
  should_nudge: boolean;
  reason: string;
  intervention_type: InterventionType;
  friction_level: FrictionLevel;
  confidence: number;
  message?: string;
  suggestedAction?: string;
}

export interface PolicyCheckResult {
  passed: boolean;
  violations: string[];
  checks: {
    optInCheck: boolean;
    quietHoursCheck: boolean;
    maxNudgesPerDayCheck: boolean;
    minSpacingCheck: boolean;
    responsibleAiToneCheck: boolean;
    noDiagnosisOrGuiltCheck: boolean;
  };
  notes: string;
}

export interface NudgeRecord {
  id: string;
  userId: string;
  timestamp: string;
  reason: string;
  intervention_type: InterventionType;
  friction_level: FrictionLevel;
  confidence: number;
  message: string;
  suggestedAction?: string;
  status: NudgeStatus;
  policyResult: PolicyCheckResult;
  outcome?: string;
  outcomeTimestamp?: string;
  simulatedHoursSinceLastCheckin?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
  groundedMemoryReferences?: string[];
}

export interface Conversation {
  id: string;
  userId: string;
  journalEntryId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface UserPreferences {
  nudgesEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "08:00"
  maxNudgesPerDay: number;
  preferredInput: 'text' | 'voice' | 'any';
  personalizationLevel: 'standard' | 'high' | 'minimal';
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt: string;
  preferences: UserPreferences;
}

export interface AIActivityStep {
  id: string;
  title: string;
  type: 'analysis' | 'retrieval' | 'synthesis' | 'evaluation' | 'policy' | 'nudge';
  timestamp: string;
  status: 'success' | 'filtered' | 'skipped' | 'running';
  metadata: {
    modelUsed?: string;
    memoriesRetrieved?: number;
    themesIdentified?: string[];
    interventionSelected?: string;
    policyPassed?: boolean;
    executionTimeMs?: number;
    notes?: string;
  };
}

export interface AdaptationStats {
  totalNudges: number;
  responseRate: number; // percentage 0-100
  effectiveInterventions: { type: InterventionType; count: number; responseRate: number }[];
  preferredTimeSlot: string;
  frictionPreference: string;
}
