import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

const TimelineView = ({ phases, currentPhaseIndex, completedPhases, onPhaseSelect }) => {
  return (
    <div className="w-full overflow-x-auto pb-8 mb-8 no-scrollbar">
      <div className="flex items-center min-w-max px-4">
        {phases.map((phase, index) => {
          const isActive = index === currentPhaseIndex;
          const isCompleted = completedPhases.includes(phase.id);
          const isLocked = index > currentPhaseIndex && !isCompleted;

          return (
            <React.Fragment key={phase.id}>
              <button
                onClick={() => onPhaseSelect(index)}
                className={`flex flex-col items-center group transition-all duration-300 ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                disabled={isLocked}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 border-2 transition-all duration-300 ${
                    isActive
                      ? 'border-primary-500 bg-primary-50 ring-4 ring-primary-500/20 scale-110 shadow-lg shadow-primary-500/20'
                      : isCompleted
                      ? 'border-green-500 bg-green-50'
                      : 'border-muted bg-muted/30'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : isActive ? (
                    <span className="text-xl">{phase.icon}</span>
                  ) : (
                    <span className="text-xl opacity-60">{phase.icon}</span>
                  )}
                </div>
                <span
                  className={`text-sm font-medium transition-colors ${
                    isActive ? 'text-primary-700' : isCompleted ? 'text-green-700' : 'text-muted-foreground'
                  }`}
                >
                  {phase.label}
                </span>
              </button>
              
              {index < phases.length - 1 && (
                <div className="w-16 h-0.5 bg-muted mx-2 mt-[-24px] relative overflow-hidden">
                  <div 
                    className={`absolute inset-0 bg-primary-500 transition-all duration-700 ${
                      isCompleted ? 'translate-x-0' : '-translate-x-full'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineView;
