import React, { useState } from 'react';
import { Check, X, ArrowRight, RotateCcw, Trophy } from 'lucide-react';

const QuizBlock = ({ questions, onComplete, onReview }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // Guard: empty or missing questions
  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground text-sm">No quiz questions available for this phase.</p>
        <button
          onClick={onReview}
          className="px-6 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
        >
          Back to Phase
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  const handleOptionSelect = (idx) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    if (idx === currentQuestion.correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResult(false);
  };

  if (showResult) {
    const passed = score >= questions.length * 0.6;
    return (
      <div className="p-8 text-center space-y-6 animate-in zoom-in duration-500">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${passed ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
          {passed ? <Trophy className="w-10 h-10" /> : <RotateCcw className="w-10 h-10" />}
        </div>
        <div>
          <h3 className="text-2xl font-bold">{passed ? 'Congratulations!' : 'Keep Learning!'}</h3>
          <p className="text-muted-foreground mt-2">You scored {score} out of {questions.length}</p>
        </div>
        <div className="flex gap-4 justify-center">
          <button onClick={handleRestart} className="px-6 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
          {passed ? (
            <button onClick={() => onComplete(score)} className="px-6 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors flex items-center gap-2">
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={onReview} className="px-6 py-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition-colors">
              Review Phase
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-center">
        <span className="text-xs font-black uppercase tracking-widest text-primary-600">Question {currentIdx + 1} of {questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= currentIdx ? 'bg-primary-500' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      <h3 className="text-xl font-bold leading-tight">{currentQuestion.question}</h3>

      <div className="grid grid-cols-1 gap-3">
        {currentQuestion.options.map((option, idx) => {
          let styles = "bg-white border-border";
          if (isAnswered) {
            if (idx === currentQuestion.correct) styles = "bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500";
            else if (idx === selectedOption) styles = "bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500";
            else styles = "bg-white border-border opacity-50";
          } else {
            styles = "bg-white border-border hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer";
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionSelect(idx)}
              disabled={isAnswered}
              className={`p-4 rounded-xl border text-left flex justify-between items-center ${styles}`}
            >
              <span className="font-medium">{option}</span>
              {isAnswered && idx === currentQuestion.correct && <Check className="w-5 h-5 text-green-500" />}
              {isAnswered && idx === selectedOption && idx !== currentQuestion.correct && <X className="w-5 h-5 text-red-500" />}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="animate-in fade-in slide-in-from-top duration-300">
          <div className="p-4 rounded-xl bg-primary-50 border border-primary-100 mb-6">
            <p className="text-sm text-primary-900 leading-relaxed"><span className="font-bold">Explanation:</span> {currentQuestion.explanation}</p>
          </div>
          <button 
            onClick={handleNext}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
          >
            {currentIdx < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizBlock;
