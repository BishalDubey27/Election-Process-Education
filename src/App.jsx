import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CountrySelector from './components/CountrySelector';
import TimelineView from './components/TimelineView';
import PhaseCard from './components/PhaseCard';
import ChatPanel from './components/ChatPanel';
import QuizBlock from './components/QuizBlock';
import phasesData from './data/phases.json';
import quizzesData from './data/quizzes.json';
import { trackEvent } from './firebase';
import { ChevronLeft, GraduationCap, MessageSquare, BookOpen, User } from 'lucide-react';

const SESSION_KEY = 'civicguide_session';

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(state) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // storage quota exceeded — silently ignore
  }
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

function App() {
  const [state, setState] = useState(() => {
    const saved = loadSession();
    return saved ? { ...DEFAULT_STATE, ...saved, isChatOpen: false, isQuizActive: false } : DEFAULT_STATE;
  });

  // Persist session on every state change (excluding transient UI flags)
  useEffect(() => {
    const { isChatOpen, isQuizActive, ...persistable } = state;
    saveSession(persistable);
  }, [state]);

  const currentPhases = useMemo(
    () => (state.country ? phasesData[state.country.id] || [] : []),
    [state.country]
  );

  const currentPhase = currentPhases[state.currentPhaseIndex];

  const handleCountrySelect = useCallback((country) => {
    setState(prev => ({ ...prev, country, currentPhaseIndex: 0, completedPhases: [], quizScores: {}, chatHistory: [] }));
    trackEvent('country_selected', { country_id: country.id });
  }, []);

  const handlePhaseSelect = useCallback((index) => {
    setState(prev => ({ ...prev, currentPhaseIndex: index, isQuizActive: false }));
  }, []);

  const handleUpdateHistory = useCallback((newHistory) => {
    setState(prev => ({ ...prev, chatHistory: newHistory }));
  }, []);

  const handleTakeQuiz = useCallback(() => {
    setState(prev => ({ ...prev, isQuizActive: true }));
    trackEvent('quiz_started', { phase_id: currentPhase?.id });
  }, [currentPhase]);

  const handleQuizComplete = useCallback((score) => {
    const phase = currentPhases[state.currentPhaseIndex];
    setState(prev => ({
      ...prev,
      isQuizActive: false,
      completedPhases: [...new Set([...prev.completedPhases, phase.id])],
      quizScores: { ...prev.quizScores, [phase.id]: score },
    }));
    trackEvent('quiz_completed', { phase_id: phase?.id, score });
  }, [currentPhases, state.currentPhaseIndex]);

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

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-muted/20 backdrop-blur-xl p-6 sticky top-0 h-screen" aria-label="Sidebar navigation">
        <div className="flex items-center gap-2 mb-12">
          <GraduationCap className="w-8 h-8 text-primary-600" aria-hidden="true" />
          <span className="font-bold text-xl">CivicGuide</span>
        </div>

        <nav className="flex-1 space-y-2" aria-label="Main navigation">
          <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-primary-100 text-primary-900 font-semibold shadow-sm" aria-current="page">
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

        <div className="pt-6 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white" aria-hidden="true">
              <User className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">Explorer</span>
              <span className="text-xs text-muted-foreground capitalize">{state.userLevel} Level</span>
            </div>
          </div>
        </div>
      </aside>

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
              <span className="text-2xl" role="img" aria-label={state.country.label}>{state.country.flag}</span>
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

      {/* Floating Chat Button - Mobile */}
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
