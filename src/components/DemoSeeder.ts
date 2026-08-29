import { JournalEntry, Memory, TimelineThread, NudgeRecord, UserProfile } from '../types';
import { saveUserEntity } from '../lib/firebase';

export async function seedDemoArc(userProfile: UserProfile): Promise<{
  entries: JournalEntry[];
  memories: Memory[];
  thread: TimelineThread;
  nudges: NudgeRecord[];
}> {
  const uid = userProfile.uid;
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  // Day 1 (12 days ago)
  const day1Date = new Date(now - 12 * DAY_MS).toISOString();
  const day1Entry: JournalEntry = {
    id: `entry_demo_day1`,
    userId: uid,
    content: "I'm afraid to start my new software project. Keep staring at a blank editor and doubting whether I can actually architect this cleanly.",
    inputMode: 'text',
    createdAt: day1Date,
    analysis: {
      mood: 'Anxious / Hesitant',
      emotions: ['Fear', 'Self-Doubt', 'Hesitation'],
      key_events: ['Attempted to start new software project'],
      themes: ['Creative Resistance', 'Software Engineering', 'Self-Doubt'],
      goals: ['Begin project architecture'],
      concerns: ['Fear of failure', 'Overwhelmed by blank slate'],
      behavioral_signals: ['Blank screen paralysis', 'Overthinking'],
      emotional_tone: 'Hesitant and fearful of initial project complexity.',
      importance: 0.85
    }
  };

  const day1Memory: Memory = {
    id: `mem_demo_day1`,
    userId: uid,
    entryId: day1Entry.id,
    timestamp: day1Date,
    content: day1Entry.content,
    themes: ['Creative Resistance', 'Self-Doubt'],
    goals: ['Begin project architecture'],
    concerns: ['Fear of failure'],
    behavioral_signals: ['Blank screen paralysis'],
    importance: 0.85
  };

  // Day 3 (9 days ago)
  const day3Date = new Date(now - 9 * DAY_MS).toISOString();
  const day3Entry: JournalEntry = {
    id: `entry_demo_day3`,
    userId: uid,
    content: "I keep avoiding it. Spent two hours organizing my browser bookmarks and cleaning my desk instead of writing the first lines of code.",
    inputMode: 'text',
    createdAt: day3Date,
    analysis: {
      mood: 'Avoidant / Frustrated',
      emotions: ['Frustration', 'Guilt', 'Resistance'],
      key_events: ['Engaged in productive procrastination (cleaning, organizing)'],
      themes: ['Avoidance Loop', 'Work Resistance'],
      goals: ['Overcome procrastination'],
      concerns: ['Avoidance habit returning'],
      behavioral_signals: ['Productive procrastination', 'Task avoidance'],
      emotional_tone: 'Frustrated by avoidance and indirect delay tactics.',
      importance: 0.8
    }
  };

  const day3Memory: Memory = {
    id: `mem_demo_day3`,
    userId: uid,
    entryId: day3Entry.id,
    timestamp: day3Date,
    content: day3Entry.content,
    themes: ['Avoidance Loop', 'Work Resistance'],
    goals: ['Overcome procrastination'],
    concerns: ['Avoidance habit returning'],
    behavioral_signals: ['Productive procrastination'],
    importance: 0.8
  };

  // Day 6 (6 days ago)
  const day6Date = new Date(now - 6 * DAY_MS).toISOString();
  const day6Entry: JournalEntry = {
    id: `entry_demo_day6`,
    userId: uid,
    content: "I completed the first tiny task—decided to just write one 10-line helper function. That was easier than expected! Broke the heavy inertia.",
    inputMode: 'voice',
    createdAt: day6Date,
    voiceDurationSeconds: 45,
    analysis: {
      mood: 'Relieved / Hopeful',
      emotions: ['Relief', 'Encouragement', 'Satisfaction'],
      key_events: ['Wrote single helper function in 10 minutes', 'Overcame initial friction'],
      themes: ['Micro-Actions', 'Momentum Building', 'Friction Reduction'],
      goals: ['Maintain tiny daily steps'],
      concerns: [],
      behavioral_signals: ['Micro-task execution', 'Lowered activation threshold'],
      emotional_tone: 'Relieved and energized after discovering the power of tiny steps.',
      importance: 0.9
    }
  };

  const day6Memory: Memory = {
    id: `mem_demo_day6`,
    userId: uid,
    entryId: day6Entry.id,
    timestamp: day6Date,
    content: day6Entry.content,
    themes: ['Micro-Actions', 'Momentum Building'],
    goals: ['Maintain tiny daily steps'],
    concerns: [],
    behavioral_signals: ['Micro-task execution'],
    importance: 0.9
  };

  // Day 8 (4 days ago)
  const day8Date = new Date(now - 4 * DAY_MS).toISOString();
  const day8Entry: JournalEntry = {
    id: `entry_demo_day8`,
    userId: uid,
    content: "Wrote over 150 lines of code today and completed the primary data module. Feeling strong momentum and genuine confidence returning.",
    inputMode: 'text',
    createdAt: day8Date,
    analysis: {
      mood: 'Energized / Confident',
      emotions: ['Confidence', 'Focus', 'Accomplishment'],
      key_events: ['Shipped primary data module', 'Reached deep flow state'],
      themes: ['Flow State', 'Self-Efficacy', 'Execution'],
      goals: ['Complete full backend pipeline'],
      concerns: [],
      behavioral_signals: ['Deep work focus', 'High velocity execution'],
      emotional_tone: 'Empowered and optimistic about technical capability.',
      importance: 0.9
    }
  };

  const day8Memory: Memory = {
    id: `mem_demo_day8`,
    userId: uid,
    entryId: day8Entry.id,
    timestamp: day8Date,
    content: day8Entry.content,
    themes: ['Flow State', 'Self-Efficacy'],
    goals: ['Complete full backend pipeline'],
    concerns: [],
    behavioral_signals: ['Deep work focus'],
    importance: 0.9
  };

  // Day 12 (Current Day)
  const day12Date = new Date(now - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
  const day12Entry: JournalEntry = {
    id: `entry_demo_day12`,
    userId: uid,
    content: "Hit a tricky integration bug today and immediately felt that old resistance creeping back. I'm avoiding the project again.",
    inputMode: 'text',
    createdAt: day12Date,
    analysis: {
      mood: 'Hesitant / Stalled',
      emotions: ['Resistance', 'Familiar Hesitation', 'Fatigue'],
      key_events: ['Encountered unexpected integration bug'],
      themes: ['Avoidance Recurrence', 'Friction Triggers', 'Pattern Recognition'],
      goals: ['Unblock integration bug with minimal friction'],
      concerns: ['Falling back into multi-day avoidance'],
      behavioral_signals: ['Immediate retreat upon ambiguity', 'Recurrence of avoidance loop'],
      emotional_tone: 'Aware of the recurring resistance pattern upon hitting technical ambiguity.',
      importance: 0.95
    }
  };

  const day12Memory: Memory = {
    id: `mem_demo_day12`,
    userId: uid,
    entryId: day12Entry.id,
    timestamp: day12Date,
    content: day12Entry.content,
    themes: ['Avoidance Recurrence', 'Pattern Recognition'],
    goals: ['Unblock integration bug'],
    concerns: ['Falling back into multi-day avoidance'],
    behavioral_signals: ['Recurrence of avoidance loop'],
    importance: 0.95
  };

  const entries = [day12Entry, day8Entry, day6Entry, day3Entry, day1Entry];
  const memories = [day12Memory, day8Memory, day6Memory, day3Memory, day1Memory];

  // Synthesized Timeline Thread
  const demoThread: TimelineThread = {
    id: `thread_demo_avoidance_loop`,
    userId: uid,
    title: "Project Resistance & Micro-Action Recovery Loop",
    theme: "Creative Resistance & Execution",
    pattern: "fear → avoidance → small action → progress → recurrence",
    insight: "Your avoidance is not lack of capability, but a predictable response to ambiguity (such as a blank file or an integration bug). On Day 6, lowering the threshold to a single 10-minute micro-task completely dismantled the inertia. When recurrence happens today, the same micro-step strategy is your grounded path back to flow.",
    groundedEvidence: [
      'Day 1: "I\'m afraid to start my new software project."',
      'Day 3: "I keep avoiding it. Spent two hours organizing..."',
      'Day 6: "Completed the first tiny task... That was easier than expected!"',
      'Day 8: "Wrote over 150 lines... confidence returning."',
      'Day 12: "Hit a tricky integration bug... avoiding the project again."'
    ],
    updatedAt: new Date().toISOString(),
    status: 'active',
    progression: [
      {
        id: 'node_1',
        date: 'Day 1 (12 days ago)',
        summary: 'Faced with initial project blank slate; paralyzed by self-doubt.',
        stage: 'trigger',
        theme: 'Creative Resistance',
        quote: "I'm afraid to start my new software project."
      },
      {
        id: 'node_2',
        date: 'Day 3 (9 days ago)',
        summary: 'Engaged in productive procrastination to evade initial code setup.',
        stage: 'avoidance',
        theme: 'Avoidance Loop',
        quote: "I keep avoiding it. Spent two hours organizing..."
      },
      {
        id: 'node_3',
        date: 'Day 6 (6 days ago)',
        summary: 'Committed to a single 10-minute helper function; broke the resistance.',
        stage: 'small_action',
        theme: 'Micro-Actions',
        quote: "Completed the first tiny task... That was easier than expected!"
      },
      {
        id: 'node_4',
        date: 'Day 8 (4 days ago)',
        summary: 'Momentum cascaded into shipping the full core module with high flow.',
        stage: 'progress',
        theme: 'Flow State',
        quote: "Wrote over 150 lines of code today... confidence returning."
      },
      {
        id: 'node_5',
        date: 'Day 12 (Today)',
        summary: 'Encountered unexpected integration bug; old avoidance loop resurfaced.',
        stage: 'recurrence',
        theme: 'Pattern Recurrence',
        quote: "Hit a tricky integration bug... I'm avoiding the project again."
      }
    ]
  };

  // Demo past nudges showcasing behavioral adaptation
  const demoNudges: NudgeRecord[] = [
    {
      id: 'nudge_demo_1',
      userId: uid,
      timestamp: new Date(now - 7 * DAY_MS).toISOString(),
      reason: 'User was in 48h avoidance loop on project setup; offered micro voice prompt.',
      intervention_type: 'voice_checkin',
      friction_level: 'ultra_low',
      confidence: 0.94,
      message: 'You mentioned the project was weighing on you. Want to do a 60-second voice check-in instead of writing?',
      suggestedAction: '60s Voice Note',
      status: 'completed',
      policyResult: {
        passed: true,
        violations: [],
        checks: {
          optInCheck: true,
          quietHoursCheck: true,
          maxNudgesPerDayCheck: true,
          minSpacingCheck: true,
          responsibleAiToneCheck: true,
          noDiagnosisOrGuiltCheck: true
        },
        notes: 'Deterministic safety policies passed.'
      },
      outcome: 'User completed 45s voice note on Day 6 which broke the inertia.',
      outcomeTimestamp: new Date(now - 6 * DAY_MS).toISOString()
    },
    {
      id: 'nudge_demo_2',
      userId: uid,
      timestamp: new Date(now - 1 * DAY_MS).toISOString(),
      reason: 'Recurrence detected after integration bug report. Gentle touchpoint offered.',
      intervention_type: 'micro_step_prompt',
      friction_level: 'low',
      confidence: 0.91,
      message: 'Remembering how a 10-minute micro-task unblocked you last week. What is the single smallest console log you could add today?',
      suggestedAction: '1-Tap Micro Step',
      status: 'sent',
      policyResult: {
        passed: true,
        violations: [],
        checks: {
          optInCheck: true,
          quietHoursCheck: true,
          maxNudgesPerDayCheck: true,
          minSpacingCheck: true,
          responsibleAiToneCheck: true,
          noDiagnosisOrGuiltCheck: true
        },
        notes: 'Deterministic safety policies passed.'
      }
    }
  ];

  // Save everything safely
  for (const e of entries) {
    await saveUserEntity(uid, 'journalEntries', e.id, e);
  }
  for (const m of memories) {
    await saveUserEntity(uid, 'memories', m.id, m);
  }
  await saveUserEntity(uid, 'timelineThreads', demoThread.id, demoThread);
  for (const n of demoNudges) {
    await saveUserEntity(uid, 'nudges', n.id, n);
  }

  return {
    entries,
    memories,
    thread: demoThread,
    nudges: demoNudges
  };
}
