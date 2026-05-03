import React from 'react';
import { MessageSquare, ClipboardCheck, Info, Clock, CheckCircle2 } from 'lucide-react';

const PhaseCard = ({ phase, onAskAI, onTakeQuiz }) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="p-10">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-inner-white" style={{ backgroundColor: `${phase.color}20` }}>
              {phase.icon}
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">{phase.label}</h2>
              <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
                <Clock className="w-4 h-4" />
                {phase.duration}
              </div>
            </div>
          </div>
        </div>

        <p className="text-lg text-slate-600 leading-relaxed mb-10 font-medium">
          {phase.summary}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {phase.steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-300">
              <CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0" />
              <span className="text-slate-700 font-semibold text-sm">{step}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 pt-8 border-t border-slate-100">
          <button 
            onClick={onAskAI}
            className="flex-1 min-w-[200px] flex items-center justify-center gap-3 bg-slate-900 text-white p-5 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 group shadow-lg"
          >
            <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Ask Assistant
          </button>
          
          <button 
            onClick={onTakeQuiz}
            className="flex-1 min-w-[200px] flex items-center justify-center gap-3 bg-white border-2 border-primary-100 text-primary-600 p-5 rounded-2xl font-bold hover:bg-primary-50 transition-all active:scale-95 group shadow-sm"
          >
            <ClipboardCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Take Knowledge Check
          </button>
        </div>
      </div>
      
      <div className="bg-primary-50/50 p-4 flex items-center gap-3 px-10">
        <Info className="w-4 h-4 text-primary-500" />
        <span className="text-xs font-bold text-primary-700 uppercase tracking-widest">Procedural Info Only • Unbiased Guidance</span>
      </div>
    </div>
  );
};

export default PhaseCard;
