import React, { useState, useMemo, useCallback } from 'react';
import { X, Search, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import glossaryData from '../data/glossary.json';

const GlossaryPanel = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return glossaryData;
    return glossaryData.filter(
      (g) =>
        g.term.toLowerCase().includes(q) ||
        g.simple.toLowerCase().includes(q) ||
        (g.related || []).some((r) => r.toLowerCase().includes(q))
    );
  }, [query]);

  const toggle = useCallback((term) => {
    setExpanded((prev) => (prev === term ? null : term));
  }, []);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Election Glossary"
      className="fixed inset-0 lg:inset-auto lg:bottom-6 lg:left-6 lg:w-[380px] lg:h-[580px] bg-background lg:rounded-3xl shadow-2xl flex flex-col border border-border z-50 overflow-hidden animate-in slide-in-from-left duration-300"
    >
      {/* Header */}
      <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-slate-900 text-white shrink-0">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5" aria-hidden="true" />
          <div>
            <h3 className="font-bold text-sm">Election Glossary</h3>
            <p className="text-[10px] opacity-70 uppercase tracking-widest font-black">{glossaryData.length} terms</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close glossary"
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms..."
            aria-label="Search glossary"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Terms list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No terms found for "{query}"
          </div>
        )}

        {filtered.map((item) => (
          <div
            key={item.term}
            className="rounded-2xl border border-border overflow-hidden"
          >
            <button
              onClick={() => toggle(item.term)}
              aria-expanded={expanded === item.term}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors"
            >
              <div>
                <p className="font-bold text-sm text-slate-900">{item.term}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.simple}</p>
              </div>
              {expanded === item.term
                ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 ml-2" aria-hidden="true" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" aria-hidden="true" />
              }
            </button>

            {expanded === item.term && (
              <div className="px-4 pb-4 space-y-3 border-t border-border bg-muted/20 animate-in fade-in duration-200">
                <p className="text-sm text-slate-700 leading-relaxed pt-3">{item.full}</p>

                {item.countries?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.countries.map((c) => (
                      <span key={c} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {item.related?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Related</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.related.map((r) => (
                        <span key={r} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlossaryPanel;
