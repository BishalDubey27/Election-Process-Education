import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import CountrySelector from './components/CountrySelector';
import TimelineView from './components/TimelineView';
import PhaseCard from './components/PhaseCard';
import ChatPanel from './components/ChatPanel';
import QuizBlock from './components/QuizBlock';
import phasesData from './data/phases.json';
import quizzesData from './data/quizzes.json';
import { trackEvent, saveProgressToCloud, loadProgressFromCloud } from './firebase';
import { ChevronLeft, GraduationCap, MessageSquare, BookOpen, User, Cloud, CloudOff } from 'lucide-react';

const SESSION_KEY = 'civicguide_session';

function loadLocalSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLocalSession(state) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch { /* quota exceeded */ }
}

const DEFAULT_STATE = {
  country: null,
  currentPhaseIndex: 0,
  completedPhases: [],
  chatHistory: [],
  quizScores: {},
  userLevel: 'beginner',
  isChatOpen: false,
  isQuizActive: false,
};

const USER_LEVELS = ['beginner', 'intermediate', 'advanced'];

function App() {
  const [state, setState] = useState(() => {
    const saved = loadLocalSession();
    return saved
      ? { ...DEFAULT_STATE, ...saved, isChatOpen: false, isQuizActive: false }
      : DEFAULT_STATE;
  });

  const [cloudSyncStatus, setCloudSyncStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  // Track whether the user has made an active selection since mount
  const userHasInteracted = useRef(false);

  // On mount: try to load from Firestore — only if user hasn't interacted yet
  useEffect(() => {
    loadProgressFromCloud().then((cloudData) => {
      if (cloudData && !userHasInteracted.current) {
        setState(prev => ({
          ...DEFAULT_STATE,
          ...cloudData,
          isChatOpen: false,
          isQuizActive: false,
        }));
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist locally on every state change
  useEffect(() => {
    const { isChatOpen, isQuizActive, chatHistory, ...persistable } = state;
    saveLocalSession(persistable);
  }, [state]);

  // Debounced cloud save (only meaningful fields)
  useEffect(() => {
    const { isChatOpen, isQuizActive, chatHistory, ...persistable } = state;
    if (!persistable.country) return;

    setCloudSyncStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await saveProgressToCloud(persistable);
        setCloudSyncStatus('saved');
      } catch {
        setCloudSyncStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [state]);

  const currentPhases = useMemo(
    () => (state.country ? phasesData[state.country.id] || [] : []),
    [state.country]
  );

  const currentPhase = currentPhases[state.currentPhaseIndex];

  const handleCountrySelect = useCallback((country) => {
    userHasInteracted.current = true;
    setState(prev => ({
      ...prev, country,
      currentPhaseIndex: 0,
      completedPhases: [],
      quizScores: {},
      chatHistory: [],
    }));
    trackEvent('country_selected', { country_id: country.id });
  }, []);

  const handlePhaseSelect = useCallback((index) => {
    setState(prev => ({ ...prev, currentPhaseIndex: index, isQuizActive: false }));
  }, []);

  const handleUpdateHistory = useCallback((newHistory) => {
    setState(prev => ({ ...prev, chatHistory: newHistory }));
  }, []);

  const handleTakeQuiz = useCallback(() => {
    setState(prev => {
      const phase = (prev.country ? phasesData[prev.country.id] || [] : [])[prev.currentPhaseIndex];
      trackEvent('quiz_started', { phase_id: phase?.id });
      return { ...prev, isQuizActive: true };
    });
  }, []);

  const handleQuizComplete = useCallback((score) => {
    setState(prev => {
      const phase = (prev.country ? phasesData[prev.country.id] || [] : [])[prev.currentPhaseIndex];
      if (!phase) return { ...prev, isQuizActive: false };
      trackEvent('quiz_completed', { phase_id: phase.id, score });
      return {
        ...prev,
        isQuizActive: false,
        completedPhases: [...new Set([...prev.completedPhases, phase.id])],
        quizScores: { ...prev.quizScores, [phase.id]: score },
      };
    });
  }, []);

  const progressPct = useMemo(
    () => currentPhases.length
      ? Math.round((state.completedPhases.length / currentPhases.length) * 100)
      : 0,
    [state.completedPhases.length, currentPhases.length]
  );

  const quizQuestions = useMemo(
    () => currentPhase
      ? (quizzesData[currentPhase.id] || quizzesData['pre-election'] || [])
      : [],
    [currentPhase]
  );

  // ── Landing page ──────────────────────────────────────────────────────────
  if (!state.country) {
    return (
      <div className="min-h-screen bg-background text-foreground selection:bg-primary-200">
        <header className="py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center">
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className="w-12 h-12 text-primary-600" aria-hidden="true" />
              <h1 className="text-3xl font-black tracking-tighter uppercase">CivicGuide</h1>
            </div>
            <p className="text-muted-foreground text-center max-w-lg">
              Democratizing election education through interactive, AI-powered guidance.
            </p>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6">
          <CountrySelector onSelect={handleCountrySelect} />
        </main>
      </div>
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground flex">

      {/* Sidebar */}
      <aside
        className="hidden lg:flex w-72 flex-col border-r border-border bg-muted/20 backdrop-blur-xl p-6 sticky top-0 h-screen"
        aria-label="Sidebar navigation"
      >
        <div className="flex items-center gap-2 mb-10">
          <GraduationCap className="w-8 h-8 text-primary-600" aria-hidden="true" />
          <span className="font-bold text-xl">CivicGuide</span>
        </div>

        <nav className="flex-1 space-y-2" aria-label="Main navigation">
          <button
            className="flex items-center gap-3 w-full p-3 rounded-xl bg-primary-100 text-primary-900 font-semibold shadow-sm"
            aria-current="page"
          >
            <BookOpen className="w-5 h-5" aria-hidden="true" />
            Learning Path
          </button>
          <button
            onClick={() => setState(prev => ({ ...prev, isChatOpen: true }))}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
          >
            <MessageSquare className="w-5 h-5" aria-hidden="true" />
            Ask Assistant
          </button>
        </nav>

        {/* User level selector */}
        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
            Learning Level
          </label>
          <div className="flex gap-1">
            {USER_LEVELS.map(level => (
              <button
                key={level}
                onClick={() => setState(prev => ({ ...prev, userLevel: level }))}
                aria-pressed={state.userLevel === level}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  state.userLevel === level
                    ? 'bg-primary-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* User card + cloud sync */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white" aria-hidden="true">
              <User className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">Explorer</span>
              <span className="text-xs text-muted-foreground capitalize">{state.userLevel} Level</span>
            </div>
          </div>

          {/* Cloud sync indicator */}
          <div className="flex items-center gap-2 px-1">
            {cloudSyncStatus === 'saving' && (
              <>
                <Cloud className="w-3.5 h-3.5 text-muted-foreground animate-pulse" aria-hidden="true" />
                <span className="text-xs text-muted-foreground">Saving to cloud…</span>
              </>
            )}
            {cloudSyncStatus === 'saved' && (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                <span className="text-xs text-emerald-600 font-medium">Progress saved</span>
              </>
            )}
            {cloudSyncStatus === 'error' && (
              <>
                <CloudOff className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="text-xs text-muted-foreground">Saved locally</span>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-20 border-b border-border px-8 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setState(prev => ({ ...prev, country: null }))}
              aria-label="Back to country selection"
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label={state.country.label}>
                {state.country.flag}
              </span>
              <h2 className="text-xl font-bold">{state.country.label} Election Journey</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Progress</span>
              <span className="text-sm font-black text-primary-600">{progressPct}%</span>
            </div>
            <div
              className="w-32 h-2 bg-muted rounded-full overflow-hidden hidden sm:block"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Course progress"
            >
              <div
                className="h-full bg-primary-500 transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <TimelineView
              phases={currentPhases}
              currentPhaseIndex={state.currentPhaseIndex}
              completedPhases={state.completedPhases}
              onPhaseSelect={handlePhaseSelect}
            />

            {state.isQuizActive ? (
              <div className="glass-morphism rounded-3xl overflow-hidden border border-primary-100 shadow-xl">
                <QuizBlock
                  questions={quizQuestions}
                  onComplete={handleQuizComplete}
                  onReview={() => setState(prev => ({ ...prev, isQuizActive: false }))}
                />
              </div>
            ) : (
              <PhaseCard
                phase={currentPhase}
                country={state.country}
                userLevel={state.userLevel}
                onAskAI={() => setState(prev => ({ ...prev, isChatOpen: true }))}
                onTakeQuiz={handleTakeQuiz}
              />
            )}
          </div>
        </div>
      </main>

      <ChatPanel
        isOpen={state.isChatOpen}
        onClose={() => setState(prev => ({ ...prev, isChatOpen: false }))}
        country={state.country}
        phase={currentPhase}
        userLevel={state.userLevel}
        history={state.chatHistory}
        onUpdateHistory={handleUpdateHistory}
      />

      {/* Floating chat button — mobile */}
      <button
        onClick={() => setState(prev => ({ ...prev, isChatOpen: true }))}
        aria-label="Open chat assistant"
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-40"
      >
        <MessageSquare className="w-6 h-6" aria-hidden="true" />
      </button>
    </div>
  );
}

export default App;
