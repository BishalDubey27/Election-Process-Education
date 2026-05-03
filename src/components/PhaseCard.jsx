import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  MessageSquare, ClipboardCheck, Info, Clock,
  CheckCircle2, Sparkles, Languages, Volume2, Loader2, X
} from 'lucide-react';
import { generatePhaseSummary, translateText } from '../api/gemini';

const LANGUAGES = [
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'hi', label: 'Hindi' },
  { code: 'de', label: 'German' },
  { code: 'zh', label: 'Chinese' },
];

const PhaseCard = ({ phase, country, userLevel = 'beginner', onAskAI, onTakeQuiz }) => {
  const [aiSummary, setAiSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeLang, setActiveLang] = useState('');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef(null);

  const [isSpeaking, setIsSpeaking] = useState(false);

  // Reset all AI state when the phase changes
  useEffect(() => {
    setAiSummary('');
    setSummaryError('');
    setTranslatedText('');
    setActiveLang('');
    setShowLangMenu(false);
    // Cancel any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [phase.id]);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Close language menu on outside click
  useEffect(() => {
    if (!showLangMenu) return;
    const handleOutsideClick = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showLangMenu]);

  // --- AI Summary ---
  const handleAISummary = useCallback(async () => {
    if (aiSummary) { setAiSummary(''); return; }
    setIsSummaryLoading(true);
    setSummaryError('');
    try {
      const text = await generatePhaseSummary(
        country?.label || 'this country',
        phase.label,
        userLevel
      );
      setAiSummary(text);
    } catch (err) {
      setSummaryError(
        err.message?.startsWith('RATE_LIMIT')
          ? 'Too many requests — please wait a moment.'
          : 'Could not generate summary. Please try again.'
      );
    } finally {
      setIsSummaryLoading(false);
    }
  }, [aiSummary, country, phase.label, userLevel]);

  // --- Translation ---
  const handleTranslate = useCallback(async (lang) => {
    setShowLangMenu(false);
    if (activeLang === lang.code) { setTranslatedText(''); setActiveLang(''); return; }
    setIsTranslating(true);
    setActiveLang(lang.code);
    try {
      const source = aiSummary || phase.summary;
      const result = await translateText(source, lang.label);
      setTranslatedText(result);
    } catch {
      setTranslatedText('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  }, [activeLang, aiSummary, phase.summary]);

  // --- Text-to-Speech (Web Speech API) ---
  const handleSpeak = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const textToRead = translatedText || aiSummary || phase.summary;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, translatedText, aiSummary, phase.summary]);

  const displayText = translatedText || aiSummary || phase.summary;
  const activeLangLabel = LANGUAGES.find(l => l.code === activeLang)?.label;

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="p-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-6">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
              style={{ backgroundColor: `${phase.color}20` }}
              aria-hidden="true"
            >
              {phase.icon}
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">{phase.label}</h2>
              <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
                <Clock className="w-4 h-4" aria-hidden="true" />
                {phase.duration}
              </div>
            </div>
          </div>

          {/* Speak button */}
          {'speechSynthesis' in window && (
            <button
              onClick={handleSpeak}
              aria-label={isSpeaking ? 'Stop reading aloud' : 'Read aloud'}
              title={isSpeaking ? 'Stop' : 'Read aloud'}
              className={`p-3 rounded-2xl border transition-all ${
                isSpeaking
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-primary-300 hover:text-primary-600'
              }`}
            >
              <Volume2 className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Summary text */}
        <div className="mb-6 relative">
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            {displayText}
          </p>
          {activeLangLabel && translatedText && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                Translated to {activeLangLabel}
              </span>
              <button
                onClick={() => { setTranslatedText(''); setActiveLang(''); }}
                aria-label="Clear translation"
                className="text-muted-foreground hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* AI Summary panel */}
        {(isSummaryLoading || summaryError) && (
          <div className="mb-6 p-4 rounded-2xl bg-primary-50 border border-primary-100">
            {isSummaryLoading && (
              <div className="flex items-center gap-2 text-primary-700 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Generating AI deep-dive with Gemini 2.0…
              </div>
            )}
            {summaryError && (
              <p className="text-sm text-red-600">{summaryError}</p>
            )}
          </div>
        )}

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {phase.steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-300"
            >
              <CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0" aria-hidden="true" />
              <span className="text-slate-700 font-semibold text-sm">{step}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 pt-8 border-t border-slate-100">

          {/* Ask AI */}
          <button
            onClick={onAskAI}
            className="flex-1 min-w-[160px] flex items-center justify-center gap-3 bg-slate-900 text-white p-4 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 group shadow-lg"
          >
            <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform" aria-hidden="true" />
            Ask Assistant
          </button>

          {/* AI Deep-Dive */}
          <button
            onClick={handleAISummary}
            disabled={isSummaryLoading}
            aria-label={aiSummary ? 'Hide AI summary' : 'Generate AI deep-dive summary'}
            className={`flex-1 min-w-[160px] flex items-center justify-center gap-3 p-4 rounded-2xl font-bold transition-all active:scale-95 shadow-sm border-2 ${
              aiSummary
                ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
                : 'bg-white border-primary-200 text-primary-600 hover:bg-primary-50'
            } disabled:opacity-60`}
          >
            {isSummaryLoading
              ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              : <Sparkles className="w-5 h-5" aria-hidden="true" />
            }
            {aiSummary ? 'Hide AI Summary' : 'AI Deep-Dive'}
          </button>

          {/* Translate */}
          <div className="relative flex-1 min-w-[160px]" ref={langMenuRef}>
            <button
              onClick={() => setShowLangMenu(v => !v)}
              aria-haspopup="listbox"
              aria-expanded={showLangMenu}
              className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl font-bold transition-all active:scale-95 shadow-sm border-2 ${
                activeLang
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                  : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {isTranslating
                ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                : <Languages className="w-5 h-5" aria-hidden="true" />
              }
              {activeLangLabel ? `${activeLangLabel}` : 'Translate'}
            </button>

            {showLangMenu && (
              <div
                role="listbox"
                aria-label="Select language"
                className="absolute bottom-full mb-2 left-0 w-full bg-white border border-border rounded-2xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    role="option"
                    aria-selected={activeLang === lang.code}
                    onClick={() => handleTranslate(lang)}
                    className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-muted transition-colors ${
                      activeLang === lang.code ? 'text-primary-600 font-bold bg-primary-50' : 'text-slate-700'
                    }`}
                  >
                    {lang.label}
                    {activeLang === lang.code && ' ✓'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Take Quiz */}
          <button
            onClick={onTakeQuiz}
            className="flex-1 min-w-[160px] flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 p-4 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 group shadow-sm"
          >
            <ClipboardCheck className="w-5 h-5 group-hover:scale-110 transition-transform" aria-hidden="true" />
            Take Quiz
          </button>
        </div>
      </div>

      <div className="bg-primary-50/50 p-4 flex items-center gap-3 px-10">
        <Info className="w-4 h-4 text-primary-500" aria-hidden="true" />
        <span className="text-xs font-bold text-primary-700 uppercase tracking-widest">
          Procedural Info Only • Unbiased Guidance • Powered by Gemini 2.0
        </span>
      </div>
    </div>
  );
};

export default PhaseCard;
