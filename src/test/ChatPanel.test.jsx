import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatPanel from '../components/ChatPanel';

// Mock the Gemini API and Firebase
vi.mock('../api/gemini', () => ({
  askGemini: vi.fn(),
}));
vi.mock('../firebase', () => ({
  trackEvent: vi.fn(),
}));

import { askGemini } from '../api/gemini';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  country: { id: 'USA', label: 'United States' },
  phase: { id: 'pre-election', label: 'Pre-Election' },
  userLevel: 'beginner',
  history: [],
  onUpdateHistory: vi.fn(),
};

describe('ChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Election Assistant')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ChatPanel {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ChatPanel {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Close chat'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows welcome message when history is empty', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(screen.getByText(/Hello! I'm your CivicGuide assistant/)).toBeInTheDocument();
  });

  it('disables send button when input is empty', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('enables send button when input has text', () => {
    render(<ChatPanel {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Type your question'), { target: { value: 'Hello' } });
    expect(screen.getByLabelText('Send message')).not.toBeDisabled();
  });

  it('calls onUpdateHistory with user message on send', async () => {
    askGemini.mockResolvedValue('Test response');
    render(<ChatPanel {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Type your question'), { target: { value: 'What is voting?' } });
    fireEvent.click(screen.getByLabelText('Send message'));
    expect(defaultProps.onUpdateHistory).toHaveBeenCalledWith([
      { role: 'user', parts: [{ text: 'What is voting?' }] },
    ]);
  });

  it('clears input after sending', async () => {
    askGemini.mockResolvedValue('Test response');
    render(<ChatPanel {...defaultProps} />);
    const input = screen.getByLabelText('Type your question');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByLabelText('Send message'));
    expect(input.value).toBe('');
  });

  it('shows error message when API call fails', async () => {
    askGemini.mockRejectedValue(new Error('Network error'));
    const onUpdateHistory = vi.fn();
    render(<ChatPanel {...defaultProps} onUpdateHistory={onUpdateHistory} />);
    fireEvent.change(screen.getByLabelText('Type your question'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByLabelText('Send message'));
    await waitFor(() => {
      const calls = onUpdateHistory.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.some(m => m.role === 'model' && m.parts[0].text.includes('error'))).toBe(true);
    });
  });

  it('shows rate limit error message', async () => {
    askGemini.mockRejectedValue(new Error('RATE_LIMIT:30'));
    const onUpdateHistory = vi.fn();
    render(<ChatPanel {...defaultProps} onUpdateHistory={onUpdateHistory} />);
    fireEvent.change(screen.getByLabelText('Type your question'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByLabelText('Send message'));
    await waitFor(() => {
      const calls = onUpdateHistory.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.some(m => m.role === 'model' && m.parts[0].text.includes('quickly'))).toBe(true);
    });
  });

  it('renders existing chat history', () => {
    const history = [
      { role: 'user', parts: [{ text: 'What is a primary?' }] },
      { role: 'model', parts: [{ text: 'A primary is a party election.' }] },
    ];
    render(<ChatPanel {...defaultProps} history={history} />);
    expect(screen.getByText('What is a primary?')).toBeInTheDocument();
    expect(screen.getByText('A primary is a party election.')).toBeInTheDocument();
  });
});
