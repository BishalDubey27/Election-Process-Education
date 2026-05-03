import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, Loader2 } from 'lucide-react';
import { askGemini } from '../api/gemini';
import { trackEvent } from '../firebase';

const MAX_INPUT_LENGTH = 1000;

const ChatPanel = ({ isOpen, onClose, country, phase, userLevel, history, onUpdateHistory }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSend = useCallback(async (e) => {
    e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;

    // Client-side input validation
    if (userMessage.length > MAX_INPUT_LENGTH) {
      setErrorBanner(`Message too long. Please keep it under ${MAX_INPUT_LENGTH} characters.`);
      return;
    }

    setErrorBanner('');
    setInput('');

    const newHistory = [...history, { role: 'user', parts: [{ text: userMessage }] }];
    onUpdateHistory(newHistory);
    setIsLoading(true);

    try {
      const response = await askGemini({
        history,
        country: country.label,
        phase: phase.label,
        userLevel,
        message: userMessage,
      });

      onUpdateHistory([...newHistory, { role: 'model', parts: [{ text: response }] }]);
      trackEvent('chat_message_sent', { country: country.id, phase: phase.id });
    } catch (error) {
      let errorMsg = "I'm sorry, I encountered an error. Please try again.";

      if (error.message?.startsWith('RATE_LIMIT:')) {
        const secs = error.message.split(':')[1];
        errorMsg = `You're sending messages too quickly. Please wait ${secs} seconds and try again.`;
      } else if (!import.meta.env.VITE_GEMINI_API_KEY) {
        errorMsg = 'Assistant is offline: Add your Gemini API key to the .env file to enable chat.';
      }

      onUpdateHistory([...newHistory, { role: 'model', parts: [{ text: errorMsg }] }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, history, country, phase, userLevel, onUpdateHistory]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Election Assistant Chat"
      className="fixed inset-0 lg:inset-auto lg:bottom-6 lg:right-6 lg:w-[400px] lg:h-[600px] bg-background lg:rounded-3xl shadow-2xl flex flex-col border border-border animate-in slide-in-from-right duration-300 z-50 overflow-hidden"
    >
      <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-primary-600 text-white">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6" aria-hidden="true" />
          <div>
            <h3 className="font-bold text-sm">Election Assistant</h3>
            <p className="text-[10px] opacity-80 uppercase tracking-widest font-black">Powered by Gemini</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {errorBanner && (
        <div role="alert" className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs font-medium">
          {errorBanner}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/10" aria-live="polite">
        {history.length === 0 && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto text-primary-600">
              <Bot className="w-8 h-8" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold">Hello! I'm your CivicGuide assistant.</p>
              <p className="text-xs text-muted-foreground px-8">
                Ask me anything about the {phase?.label} phase in {country?.label}. I provide neutral, factual information.
              </p>
            </div>
          </div>
        )}

        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-tr-none shadow-md'
                  : 'bg-white border border-border text-foreground rounded-tl-none shadow-sm'
              }`}
            >
              {msg.parts[0].text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start" aria-label="Assistant is typing">
            <div className="bg-white border border-border p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-600" aria-hidden="true" />
              <span className="text-xs text-muted-foreground">Gemini is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-border bg-background">
        <div className="relative">
          <label htmlFor="chat-input" className="sr-only">Type your question</label>
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={MAX_INPUT_LENGTH}
            placeholder="Type your question..."
            autoComplete="off"
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {input.length > MAX_INPUT_LENGTH * 0.9 && (
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {input.length}/{MAX_INPUT_LENGTH}
          </p>
        )}
      </form>
    </div>
  );
};

export default ChatPanel;
