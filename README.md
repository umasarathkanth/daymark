# DAYMARK

> **“Make a mark on your day.”**

DAYMARK is a calm, personal reflection space that transforms daily reflections into continuous longitudinal personal memory, discovers recurring behavioral cycles, and autonomously decides when and how to provide gentle, bounded, non-coercive support.

---

## System Architecture & Flow

```text
 ┌────────────────────────────────────────────────────────┐
 │                   React 19 Frontend                    │
 │ (Check-in, Timeline Thread, Reflection, Nudge Center)   │
 └──────────────────────────┬─────────────────────────────┘
                            │ Firebase Auth Token
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │               Node.js / Express Backend                │
 │  (Input Deserializer, Fallback Ladder, Policy Engine)  │
 └─────────────┬────────────────────────────┬─────────────┘
               │                            │
               ▼                            ▼
 ┌───────────────────────────┐ ┌──────────────────────────┐
 │     Cloud Firestore       │ │     Google Gemini        │
 │  (UID-Isolated Documents) │ │  (@google/genai SDK)     │
 │  - /users/{uid}/entries   │ │  - Structured Extraction │
 │  - /users/{uid}/memories  │ │  - Timeline Synthesizer  │
 │  - /users/{uid}/threads   │ │  - Nudge Behavioral Loop │
 │  - /users/{uid}/nudges    │ │  - Multi-Turn Reflection │
 └───────────────────────────┘ └────────────▲─────────────┘
                                            │
                               ┌────────────┴─────────────┐
                               │ Google Cloud Secret Mgr  │
                               │     GEMINI_API_KEY       │
                               └──────────────────────────┘
```

---

## Core Product Loops

### 1. The Journal Reflection Loop
```text
Text / Voice Check-in
         ↓
Gemini Structured Extraction (Mood, Emotions, Themes, Goals, Concerns, Signals)
         ↓
Searchable Personal Memory Created (users/{uid}/memories)
         ↓
Longitudinal Synthesizer (Historical Memory Retrieval + Pattern Detection)
         ↓
Timeline Thread Updated (users/{uid}/timelineThreads)
```

### 2. The Autonomous Behavioral Nudge Loop
```text
OBSERVE (Last check-in time, active avoidance loops, past outcome stats)
   ↓
REASON (Gemini evaluates behavioral friction and selects intervention type)
   ↓
POLICY CHECK (Deterministic guardrails: Opt-in, Quiet Hours, Max 2/day, No-guilt tone)
   ↓
ACT (Present ultra-low-friction touchpoint, e.g. 60s voice prompt)
   ↓
OUTCOME (Record sent → opened → responded → completed)
   ↓
ADAPT (Optimize future intervention selection from real user response rates)
```

---

## Mandatory Google Technologies Implemented

1. **Firebase Authentication**: Session management, Google Sign-in, Email/Password, and 1-Click Guest sessions with persistent Firebase UIDs.
2. **Multi-Turn Gemini Companion**: True multi-turn context-grounded conversation where Gemini retains previous turns without exposing internal tokens.
3. **User-Isolated Cloud Firestore**: All private reflections, memories, threads, and nudges are partitioned strictly under `/users/{uid}/*` and guarded with production Firestore Security Rules.
4. **Google Cloud Secret Manager**: Production-ready credential access for `GEMINI_API_KEY` keeping privileged secrets entirely off client browsers.

---

## Firestore Security Rules

Deployed in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## Local Development & Setup

### Prerequisites
- Node.js 20+
- A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd personal-gemini-journal
npm install
```

### 2. Environment Variables
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Populate `GEMINI_API_KEY="YOUR_API_KEY"`.

### 3. Run the Full-Stack Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Google Cloud Secret Manager Setup

```bash
# 1. Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# 2. Create the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 3. Add your Gemini API Key as secret version
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 4. Grant Cloud Run compute service account access
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Cloud Run Production Deployment

```bash
# 1. Build and deploy container directly to Cloud Run
gcloud run deploy personal-gemini-journal \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest

# 2. Apply the verification label for Cloud Run Challenge
gcloud run services update personal-gemini-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## Comprehensive Functional Walkthrough & Test Guide

Every interaction across the product has a verifiable test path:

### Test Case 1: 5-Day Avoidance & Progress Demo Arc
1. Click the **"Demo 5-Day Arc"** button in the top navigation bar.
2. Verify confetti triggers and confirmation toast appears.
3. Switch to the **Timeline Thread** tab.
4. **Expected Result**: Verify the longitudinal pattern displays `fear → avoidance → small action → progress → recurrence` with 5 milestone nodes (Day 1 through Day 12) grounded in user quotes.

### Test Case 2: Frictionless Journal Check-in & Gemini Analysis
1. Navigate to the **Check-in** tab.
2. Type: *"I spent 30 minutes cleaning my desk today instead of writing the core integration code."*
3. Click **"Reflect & Synthesize"**.
4. **Expected Result**: Structured analysis card appears with Emotional Tone, Extracted Themes ("Avoidance Loop", "Task Resistance"), and Behavioral Signals ("Productive Procrastination").

### Test Case 3: 60-Second Voice Check-in
1. In the Check-in tab, click **"60s Voice Input"**.
2. Grant microphone permission if prompted.
3. Speak a sentence into the microphone.
4. **Expected Result**: Audio wave visualizer pulses in real-time with volume levels, speech is transcribed live, and clicking **"Complete Voice Check-in"** populates the reflection for analysis.

### Test Case 4: Longitudinal Timeline Synthesis & Theme Filtering
1. Navigate to the **Timeline Thread** tab.
2. Click theme filter chips (e.g. *"Creative Resistance"*).
3. Type in the search box to search for *"helper function"*.
4. **Expected Result**: The node timeline and raw stored memories dynamically filter to matching items.

### Test Case 5: Multi-Turn Conversational Reflection
1. Navigate to the **Reflection** tab.
2. Select an active focus entry or choose *"All Memories & History"*.
3. Type or click a suggested prompt chip: *"How did taking a small action help me unblock my project in the past?"*
4. Click **Send**.
5. **Expected Result**: Gemini responds conversationally in 2-4 sentences, recalling Day 6's 10-minute helper function, displaying a *"Grounded in Memory"* evidence card without exposing chain-of-thought tokens.

### Test Case 6: Autonomous Nudge Agent Execution & Time Simulator
1. Navigate to the **Nudge Agent** tab.
2. In the Time Simulator sandbox, adjust the slider to **48 Hours** (simulating 2 days of missed check-ins).
3. Ensure local time is set to **14:00 (2:00 PM)**.
4. Click **"Run Nudge Agent Now"**.
5. **Expected Result**: The agent observes the 48-hour gap, reasons via Gemini, validates deterministic guardrails, and renders an active low-friction intervention card (e.g. 60-second voice prompt).

### Test Case 7: Deterministic Quiet Hours Policy Guardrail
1. In the Nudge Agent sandbox, drag the time slider to **23:00 (11:00 PM)**.
2. Click **"Run Nudge Agent Now"**.
3. **Expected Result**: The policy inspector catches the quiet hours violation (22:00 - 08:00) and safely blocks the nudge from interrupting the user.

### Test Case 8: Behavioral Outcome & Adaptation
1. On an active nudge card in the Nudge Center, click **"Done"** or **"60s Voice Note"**.
2. **Expected Result**: The status transitions from `sent` to `completed`/`responded`, confetti triggers, and the Behavioral Adaptation progress bar updates the engagement percentage.

### Test Case 9: Privacy, Responsible AI & Data Export
1. Navigate to the **Settings** tab.
2. Adjust quiet hours or daily frequency cap and click **"Save Settings"**.
3. Click **"Export Complete Archive (JSON)"**.
4. **Expected Result**: A complete JSON file containing all user profile data, journal entries, personal memories, and timeline threads is downloaded.
