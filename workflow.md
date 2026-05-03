# 🗳️ Election Process Education Assistant — Implementation Workflow

## Overview

This document describes the complete implementation workflow: how data flows through the system, how each component is built, how the Claude API is integrated, and the sequence in which everything is assembled.

---

## 1. High-Level Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│                                                                 │
│  ┌──────────────┐   ┌──────────────────┐   ┌───────────────┐  │
│  │  Country     │   │  Election Phase   │   │   Quiz &      │  │
│  │  Selector    │   │  Timeline Viewer  │   │  Scenarios    │  │
│  └──────┬───────┘   └────────┬─────────┘   └──────┬────────┘  │
│         │                    │                      │           │
│         └────────────────────┼──────────────────────┘           │
│                              │                                  │
│                    ┌─────────▼──────────┐                       │
│                    │   App State Layer   │                       │
│                    │ (country, phase,    │                       │
│                    │  chatHistory, score)│                       │
│                    └─────────┬──────────┘                       │
│                              │                                  │
│              ┌───────────────▼────────────────┐                 │
│              │       Chat Assistant Panel      │                 │
│              │  (user input → Claude API call) │                 │
│              └───────────────┬────────────────┘                 │
└──────────────────────────────┼─────────────────────────────────┘
                               │
               ┌───────────────▼────────────────┐
               │        CLAUDE API              │
               │  POST /v1/messages             │
               │  model: claude-sonnet-4-...    │
               │  system: [neutrality prompt]   │
               │  messages: [chat history]      │
               └───────────────┬────────────────┘
                               │
               ┌───────────────▼────────────────┐
               │       RESPONSE HANDLER          │
               │  • Parse text / JSON blocks     │
               │  • Update chat history          │
               │  • Trigger UI updates           │
               └────────────────────────────────┘
```

---

## 2. Project File Structure

```
election-education/
│
├── index.html                   # Entry point (single-file artifact)
│
├── /src
│   ├── App.jsx                  # Root component, routing, global state
│   │
│   ├── /components
│   │   ├── Header.jsx           # Country selector + progress indicator
│   │   ├── Sidebar.jsx          # Phase navigator + glossary shortcut
│   │   ├── TimelineView.jsx     # Visual horizontal/vertical timeline
│   │   ├── PhaseCard.jsx        # Expandable phase detail block
│   │   ├── QuizBlock.jsx        # Per-phase multiple choice quiz
│   │   ├── ScenarioExplorer.jsx # "What if?" hypothetical panel
│   │   ├── ChatPanel.jsx        # Floating Claude AI chat interface
│   │   ├── GlossaryModal.jsx    # Searchable terms modal
│   │   └── ProgressBar.jsx      # Visual completion tracker
│   │
│   ├── /data
│   │   ├── countries.json       # Country metadata + electoral system type
│   │   ├── phases.json          # All election phases + descriptions per country
│   │   ├── glossary.json        # 100+ election terms + definitions
│   │   └── quizzes.json         # Per-phase quiz questions + answers
│   │
│   ├── /api
│   │   ├── claude.js            # Claude API wrapper (fetch + error handling)
│   │   └── prompts.js           # All system prompts and prompt templates
│   │
│   └── /utils
│       ├── storage.js           # window.storage read/write helpers
│       └── formatters.js        # Text parsing, highlight helpers
```

---

## 3. Step-by-Step Implementation Workflow

---

### STEP 1 — Set Up App State & Country Selector

**What to build:** The root `App` component with global state and the country selection landing screen.

**State shape:**
```javascript
const initialState = {
  country: null,           // "USA" | "India" | "UK" | "Germany" | "Australia"
  currentPhase: 0,         // Index into phases array
  chatHistory: [],         // [ { role, content } ]
  quizScores: {},          // { phaseId: score }
  glossaryOpen: false,
  userLevel: "beginner",   // "beginner" | "intermediate" | "expert"
  completedPhases: []      // Array of completed phase IDs
};
```

**Flow:**
```
App loads → Check window.storage for saved session
     ↓
If saved session → restore state and skip to saved phase
     ↓
If no session → Show country selector screen
     ↓
User selects country → Load phases.json for that country
     ↓
Render Timeline + first PhaseCard
```

**Key code — country selector:**
```javascript
const countries = [
  { id: "USA",       label: "🇺🇸 United States", system: "Electoral College" },
  { id: "India",     label: "🇮🇳 India",          system: "First Past The Post" },
  { id: "UK",        label: "🇬🇧 United Kingdom", system: "Westminster FPTP" },
  { id: "Germany",   label: "🇩🇪 Germany",        system: "Mixed-Member PR" },
  { id: "Australia", label: "🇦🇺 Australia",      system: "Preferential Voting" }
];
```

---

### STEP 2 — Build the Election Timeline Component

**What to build:** A visual, scrollable, interactive timeline showing all election phases.

**Data contract (phases.json):**
```json
{
  "USA": [
    {
      "id": "pre-election",
      "label": "Pre-Election",
      "icon": "📋",
      "color": "#3B82F6",
      "duration": "6–18 months before election day",
      "summary": "Voter registration opens, candidates declare...",
      "steps": [
        "Election date announced",
        "Voter registration deadlines set",
        "Candidate filing period opens",
        "Primary elections held"
      ],
      "keyDates": { "typical_start": "18 months prior", "deadline": "varies by state" }
    }
  ]
}
```

**Render logic:**
```
Load phases for selected country
     ↓
Render horizontal timeline (desktop) / vertical list (mobile)
     ↓
Each phase node = circle icon + label + color band
     ↓
Active phase = highlighted + expanded PhaseCard below timeline
     ↓
Completed phases = checkmark overlay
     ↓
Click phase node → set currentPhase → expand PhaseCard
```

**Timeline node states:**
- `locked` — not yet reached (grayed out)
- `active` — currently selected (highlighted ring)
- `completed` — finished quiz (green checkmark)

---

### STEP 3 — Build Phase Detail Cards

**What to build:** Expandable cards that explain each election phase in depth.

**PhaseCard structure:**
```
┌─────────────────────────────────────────┐
│  Phase Icon + Title + Duration Badge    │
├─────────────────────────────────────────┤
│  Summary paragraph (plain language)     │
│                                         │
│  📌 Key Steps (numbered list)           │
│  📅 Typical Timeline                    │
│  ⚖️  Legal Framework (expandable)       │
│  🌍  Country-specific note              │
├─────────────────────────────────────────┤
│  [Ask Claude about this phase] button   │
│  [Take the Quiz] button                 │
└─────────────────────────────────────────┘
```

**"Ask Claude about this phase" button flow:**
```
User clicks button
     ↓
ChatPanel opens (if not already open)
     ↓
Pre-fill: "Tell me more about the [Phase Name] phase in [Country]"
     ↓
Send to Claude API → display response in chat
```

---

### STEP 4 — Integrate the Claude API

**What to build:** The core AI engine — `claude.js` wrapper + system prompts.

#### 4.1 System Prompt Engineering

```javascript
// prompts.js

export const buildSystemPrompt = (country, phase, userLevel) => `
You are an expert, politically neutral civics educator specializing in election processes.

Your role:
- Explain election processes clearly, accurately, and without political bias
- Focus on the procedural and legal mechanics of elections
- Adapt your language to a ${userLevel} audience
- When discussing ${country}'s election system, provide country-specific accuracy
- Currently, the user is learning about the "${phase}" phase of the election process

Rules you must follow:
1. Never express opinions on political parties, candidates, or political ideologies
2. Always distinguish between "how elections work" vs "political debate about elections"
3. If asked about contested or disputed claims, present the official/legal position only
4. Keep responses concise (under 200 words) unless the user asks for more detail
5. End every response with a follow-up suggestion question the user might want to ask next
6. If asked something outside election education, politely redirect back to the topic

Format guidelines:
- Use simple numbered lists for step-by-step processes
- Bold key terms on first use
- Use examples from real elections only when they illustrate mechanics (not controversy)
`;
```

#### 4.2 API Call Wrapper

```javascript
// claude.js

export async function askClaude({ messages, country, phase, userLevel }) {
  const systemPrompt = buildSystemPrompt(country, phase, userLevel);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages  // Full conversation history
    })
  });

  const data = await response.json();

  if (data.error) throw new Error(data.error.message);

  return data.content
    .filter(block => block.type === "text")
    .map(block => block.text)
    .join("\n");
}
```

#### 4.3 Quiz Generation via Claude

```javascript
// Dynamically generate quiz questions for any phase
export async function generateQuiz({ country, phase }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are a quiz generator. Return ONLY valid JSON. No preamble, no markdown.`,
      messages: [{
        role: "user",
        content: `Generate 3 multiple choice questions about the "${phase}" phase 
                  of ${country}'s election process. 
                  
                  Return this exact JSON structure:
                  {
                    "questions": [
                      {
                        "id": "q1",
                        "question": "...",
                        "options": ["A", "B", "C", "D"],
                        "correct": 0,
                        "explanation": "..."
                      }
                    ]
                  }`
      }]
    })
  });

  const data = await response.json();
  const raw = data.content[0].text;
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}
```

---

### STEP 5 — Build the Chat Panel

**What to build:** A floating, collapsible chat interface for free-form Q&A.

**Chat panel states:**
```
Collapsed (FAB button visible) 
     ↓ click ↓
Expanded panel (350px wide, 500px tall)
     ↓
Message input at bottom
     ↓
Send → add to history → call askClaude() → stream response
     ↓
Response appears with typing indicator
     ↓
Suggested follow-up questions appear as chips below response
```

**Conversation history management:**
```javascript
// Always maintain full history for context
const sendMessage = async (userText) => {
  const newHistory = [
    ...chatHistory,
    { role: "user", content: userText }
  ];
  setChatHistory(newHistory);
  setIsLoading(true);

  const reply = await askClaude({
    messages: newHistory,
    country,
    phase: phases[currentPhase].label,
    userLevel
  });

  setChatHistory([...newHistory, { role: "assistant", content: reply }]);
  setIsLoading(false);

  // Persist to storage
  await window.storage.set("chatHistory", JSON.stringify(newHistory));
};
```

**Suggested questions (pre-seeded per phase):**
```javascript
const suggestedQuestions = {
  "pre-election": [
    "How do I register to vote?",
    "What is a primary election?",
    "How are electoral districts decided?"
  ],
  "voting-day": [
    "What ID do I need to vote?",
    "What happens if I make a mistake on my ballot?",
    "Can I vote early or by mail?"
  ]
  // ... per phase
};
```

---

### STEP 6 — Quiz & Knowledge Check Flow

**What to build:** Per-phase quizzes that unlock the next phase.

**Quiz flow:**
```
User clicks "Take the Quiz" on a PhaseCard
     ↓
Generate 3 questions (static JSON or Claude-generated)
     ↓
Display one question at a time
     ↓
User selects answer → immediate feedback (correct/incorrect + explanation)
     ↓
After 3 questions → show score (e.g., "2/3 correct")
     ↓
If score ≥ 2 → mark phase as completed → unlock next phase
If score < 2 → "Review this phase" button + option to retry
     ↓
Save score to window.storage
```

**Score storage:**
```javascript
await window.storage.set(
  "quizScores",
  JSON.stringify({ ...quizScores, [phaseId]: score })
);
```

---

### STEP 7 — Scenario Explorer ("What If?")

**What to build:** An AI-powered panel where users explore hypothetical election scenarios.

**Pre-built scenario prompts (shown as cards):**
```
┌─────────────────────────────────┐
│ 🤔 What if no candidate wins    │
│    a majority?                  │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 🤔 What if the election results │
│    are disputed?                │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 🤔 What if a candidate dies     │
│    before election day?         │
└─────────────────────────────────┘
```

**Flow:**
```
User clicks scenario card (or types custom scenario)
     ↓
Send to Claude with specialized system prompt:
"Explain the legal/procedural outcome of this scenario 
 in [country]'s election system. Be factual, neutral, 
 and cite the relevant law or constitutional provision."
     ↓
Display answer in expandable card format
     ↓
"Ask a follow-up" option opens chat panel with context loaded
```

---

### STEP 8 — Persistent Session Storage

**What to build:** Save and restore user progress across sessions.

**Storage schema:**
```javascript
// Keys stored via window.storage
{
  "session": {
    "country": "India",
    "currentPhase": 2,
    "completedPhases": ["pre-election", "campaign"],
    "userLevel": "beginner",
    "lastVisited": "2025-05-03T10:30:00Z"
  },
  "chatHistory": "[...]",   // JSON stringified array
  "quizScores": "{...}"     // JSON stringified object
}
```

**Session restore logic:**
```javascript
useEffect(() => {
  const restoreSession = async () => {
    try {
      const saved = await window.storage.get("session");
      if (saved) {
        const session = JSON.parse(saved.value);
        dispatch({ type: "RESTORE_SESSION", payload: session });
      }
    } catch {
      // No saved session — start fresh
    }
  };
  restoreSession();
}, []);
```

---

### STEP 9 — Glossary Modal

**What to build:** A searchable, AI-enhanced glossary of election terms.

**Glossary entry format:**
```json
{
  "term": "Electoral College",
  "simple": "A group of representatives who cast the official votes for president in the USA.",
  "full": "A body of 538 electors established by the US Constitution...",
  "related": ["swing state", "faithless elector", "popular vote"],
  "countries": ["USA"]
}
```

**"Explain Simply" button:**
- Sends term to Claude: *"Explain [term] as if I'm 12 years old, in 2 sentences."*
- Replaces definition with simplified version inline

---

### STEP 10 — Final Integration & QA Checklist

**Assembly order:**
1. ✅ App shell + state management
2. ✅ Country selector + data loading
3. ✅ Timeline component (static data)
4. ✅ PhaseCard component (static data)
5. ✅ Claude API wrapper + prompts
6. ✅ Chat panel with history
7. ✅ Quiz flow (static JSON)
8. ✅ Quiz generation via Claude (dynamic fallback)
9. ✅ Scenario explorer
10. ✅ Storage persistence
11. ✅ Glossary modal
12. ✅ Mobile responsiveness pass
13. ✅ Error states (API fail, loading, empty)
14. ✅ Demo data seeded (India journey pre-completed for demo)

**QA scenarios to test:**
- Country switch mid-session (should reset phase, keep chat)
- API timeout (show "Try again" gracefully)
- Quiz retry flow
- Mobile chat panel usability
- Glossary search with no results
- Scenario explorer with custom input
- Session restore after browser refresh

---

## 4. API Prompt Library Reference

| Prompt | Purpose | Output Type |
|--------|---------|-------------|
| `buildSystemPrompt(country, phase, level)` | Core chat grounding | System message |
| `generateQuiz(country, phase)` | Dynamic quiz questions | JSON |
| `explainTerm(term, level)` | Glossary simplification | Text |
| `exploreScenario(scenario, country)` | Hypothetical outcomes | Text |
| `summarizePhase(phase, country)` | Phase overview cards | Text |

---

## 5. Error Handling Strategy

```javascript
// Wrapper with fallback for all Claude calls
const safeAskClaude = async (params) => {
  try {
    return await askClaude(params);
  } catch (error) {
    if (error.message.includes("overloaded")) {
      return "I'm a bit busy right now. Please try again in a moment.";
    }
    if (error.message.includes("rate_limit")) {
      return "You've asked a lot of great questions! Please wait 30 seconds.";
    }
    return "Something went wrong. Please refresh and try again.";
  }
};
```

---

## 6. Demo Script (Hackathon Presentation)

**Duration: 3 minutes**

1. **(0:00–0:20)** Open app → show landing with country selector → select 🇮🇳 India
2. **(0:20–0:50)** Walk through the visual timeline → click "Nomination Phase" → show PhaseCard detail
3. **(0:50–1:30)** Open chat → ask *"How does the ECI handle candidate disqualification?"* → show Claude response
4. **(1:30–2:00)** Take the Phase Quiz → answer questions → show score + explanation
5. **(2:00–2:30)** Open Scenario Explorer → click *"What if results are disputed?"* → show outcome
6. **(2:30–3:00)** Switch to 🇩🇪 Germany → show different electoral system content → close with glossary search for "proportional representation"
