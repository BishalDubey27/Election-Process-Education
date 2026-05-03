import React from 'react';
import { Calendar, Info, Play, ClipboardList } from 'lucide-react';

const PhaseCard = ({ phase, onAskAI, onTakeQuiz }) => {
  if (!phase) return null;

  return (
    <div className="w-full animate-in slide-in-from-bottom duration-500">
      <div className="glass-morphism rounded-3xl p-8 shadow-xl border border-primary-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-4xl shadow-inner">
              {phase.icon}
            </div>
            <div>
              <h3 className="text-3xl font-bold text-foreground">{phase.label}</h3>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{phase.duration}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onAskAI}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-primary-200 text-primary-700 font-medium hover:bg-primary-50 transition-colors shadow-sm"
            >
              <Play className="w-4 h-4" />
              Ask AI
            </button>
            <button
              onClick={onTakeQuiz}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
            >
              <ClipboardList className="w-4 h-4" />
              Take Quiz
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <h4 className="text-lg font-semibold flex items-center gap-2 text-primary-800">
                <Info className="w-5 h-5" />
                Overview
              </h4>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {phase.summary}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-primary-800">Key Steps</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {phase.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-transparent hover:border-primary-100 transition-all">
                    <div className="mt-1 w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium text-foreground/80">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-primary-50/50 rounded-2xl p-6 border border-primary-100">
            <h4 className="text-lg font-semibold mb-4 text-primary-900">Did You Know?</h4>
            <div className="space-y-4 text-sm text-primary-800/80 leading-relaxed italic">
              <p>Understanding this phase is crucial because it ensures that only eligible citizens can influence the outcome of the election.</p>
              <div className="pt-4 border-t border-primary-100">
                <p className="font-bold not-italic text-primary-900 mb-1">Quick Tip:</p>
                <p className="not-italic">Check your local government website for specific deadlines in your region.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhaseCard;
