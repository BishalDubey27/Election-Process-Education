import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuizBlock from '../components/QuizBlock';

const mockQuestions = [
  {
    question: 'What is a primary election?',
    options: ['A final election', 'A party nomination vote', 'A recount', 'A census'],
    correct: 1,
    explanation: 'A primary is held within a party to select its nominee.',
  },
  {
    question: 'What is voter registration?',
    options: ['Paying to vote', 'Signing up on the voter list', 'Choosing a party', 'Getting a ballot'],
    correct: 1,
    explanation: 'Voter registration adds your name to the official list of eligible voters.',
  },
];

describe('QuizBlock', () => {
  it('renders the first question', () => {
    render(<QuizBlock questions={mockQuestions} onComplete={vi.fn()} onReview={vi.fn()} />);
    expect(screen.getByText('What is a primary election?')).toBeInTheDocument();
  });

  it('shows question counter', () => {
    render(<QuizBlock questions={mockQuestions} onComplete={vi.fn()} onReview={vi.fn()} />);
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
  });

  it('highlights correct answer after selection', () => {
    render(<QuizBlock questions={mockQuestions} onComplete={vi.fn()} onReview={vi.fn()} />);
    fireEvent.click(screen.getByText('A party nomination vote'));
    expect(screen.getByText('Explanation:')).toBeInTheDocument();
  });

  it('shows explanation after answering', () => {
    render(<QuizBlock questions={mockQuestions} onComplete={vi.fn()} onReview={vi.fn()} />);
    fireEvent.click(screen.getByText('A party nomination vote'));
    expect(screen.getByText(/A primary is held within a party/)).toBeInTheDocument();
  });

  it('advances to next question on Next click', () => {
    render(<QuizBlock questions={mockQuestions} onComplete={vi.fn()} onReview={vi.fn()} />);
    fireEvent.click(screen.getByText('A party nomination vote'));
    fireEvent.click(screen.getByText('Next Question'));
    expect(screen.getByText('What is voter registration?')).toBeInTheDocument();
  });

  it('shows result screen after last question', () => {
    render(<QuizBlock questions={mockQuestions} onComplete={vi.fn()} onReview={vi.fn()} />);
    // Answer Q1
    fireEvent.click(screen.getByText('A party nomination vote'));
    fireEvent.click(screen.getByText('Next Question'));
    // Answer Q2
    fireEvent.click(screen.getByText('Signing up on the voter list'));
    fireEvent.click(screen.getByText('Finish Quiz'));
    expect(screen.getByText(/You scored/)).toBeInTheDocument();
  });

  it('calls onComplete with score when passed', () => {
    const onComplete = vi.fn();
    render(<QuizBlock questions={mockQuestions} onComplete={onComplete} onReview={vi.fn()} />);
    fireEvent.click(screen.getByText('A party nomination vote'));
    fireEvent.click(screen.getByText('Next Question'));
    fireEvent.click(screen.getByText('Signing up on the voter list'));
    fireEvent.click(screen.getByText('Finish Quiz'));
    fireEvent.click(screen.getByText('Continue'));
    expect(onComplete).toHaveBeenCalledWith(2);
  });

  it('calls onReview when Review Phase is clicked after failing', () => {
    const onReview = vi.fn();
    render(<QuizBlock questions={mockQuestions} onComplete={vi.fn()} onReview={onReview} />);
    // Answer both wrong
    fireEvent.click(screen.getByText('A final election'));
    fireEvent.click(screen.getByText('Next Question'));
    fireEvent.click(screen.getByText('Paying to vote'));
    fireEvent.click(screen.getByText('Finish Quiz'));
    fireEvent.click(screen.getByText('Review Phase'));
    expect(onReview).toHaveBeenCalledTimes(1);
  });

  it('resets quiz on Retry click', () => {
    render(<QuizBlock questions={mockQuestions} onComplete={vi.fn()} onReview={vi.fn()} />);
    fireEvent.click(screen.getByText('A final election'));
    fireEvent.click(screen.getByText('Next Question'));
    fireEvent.click(screen.getByText('Paying to vote'));
    fireEvent.click(screen.getByText('Finish Quiz'));
    fireEvent.click(screen.getByText('Retry'));
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
  });
});
