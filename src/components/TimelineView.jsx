import React from 'react';
import { Check } from 'lucide-react';

const TimelineView = ({ phases, currentPhaseIndex, completedPhases, onPhaseSelect }) => {
  return (
    <div className="mb-12 relative">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary-500 transition-all duration-1000 ease-out"
          style={{ width: `${(currentPhaseIndex / (phases.length - 1)) * 100}%` }}
        />
      </div>
      
      <div className="relative flex justify-between items-center">
        {phases.map((phase, idx) => {
          const isActive = idx === currentPhaseIndex;
          const isCompleted = completedPhases.includes(phase.id);
          const isLocked = idx > 0 && !completedPhases.includes(phases[idx-1].id);

          return (
            <div key={phase.id} className="flex flex-col items-center">
              <button
                onClick={() => onPhaseSelect(idx)}
                disabled={isLocked}
                className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 z-10 border-4
                  ${isActive 
                    ? 'bg-primary-600 text-white border-primary-100 scale-125 shadow-xl ring-4 ring-primary-500/20' 
                    : isCompleted
                      ? 'bg-white text-primary-600 border-primary-500 shadow-md'
                      : 'bg-white text-slate-400 border-slate-100 shadow-sm'
                  }
                  ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
                `}
              >
                {isCompleted ? <Check className="w-6 h-6 stroke-[3]" /> : phase.icon}
              </button>
              
              <div className={`mt-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
                {phase.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineView;
