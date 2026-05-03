import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the @google/generative-ai module
vi.mock('@google/generative-ai', () => {
  const sendMessage = vi.fn();
  const startChat = vi.fn(() => ({ sendMessage }));
  const generateContent = vi.fn();
  const getGenerativeModel = vi.fn(() => ({ startChat, generateContent }));
  return {
    GoogleGenerativeAI: vi.fn(() => ({ getGenerativeModel })),
    _mocks: { sendMessage, startChat, generateContent, getGenerativeModel },
  };
});

import { askGemini, generateQuiz } from '../api/gemini';
import { GoogleGenerativeAI, _mocks } from '@google/generative-ai';

describe('askGemini', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws EMPTY_INPUT for blank message', async () => {
    await expect(askGemini({ message: '   ', history: [], country: 'USA', phase: 'Pre-Election', userLevel: 'beginner' }))
      .rejects.toThrow('EMPTY_INPUT');
  });

  it('throws INPUT_TOO_LONG for messages over 1000 chars', async () => {
    await expect(askGemini({ message: 'a'.repeat(1001), history: [], country: 'USA', phase: 'Pre-Election', userLevel: 'beginner' }))
      .rejects.toThrow('INPUT_TOO_LONG');
  });

  it('calls Gemini API and returns text', async () => {
    const fakeText = vi.fn(() => 'Gemini response');
    _mocks.sendMessage.mockResolvedValue({ response: { text: fakeText } });

    const result = await askGemini({ message: 'What is voting?', history: [], country: 'USA', phase: 'Pre-Election', userLevel: 'beginner' });
    expect(result).toBe('Gemini response');
    expect(_mocks.sendMessage).toHaveBeenCalledWith('What is voting?');
  });
});

describe('generateQuiz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed quiz array on valid response', async () => {
    const validQuiz = [
      { question: 'Q1?', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'Exp' },
    ];
    _mocks.generateContent.mockResolvedValue({
      response: { text: vi.fn(() => JSON.stringify(validQuiz)) },
    });

    const result = await generateQuiz('voting');
    expect(result).toEqual(validQuiz);
  });

  it('returns null when response is invalid JSON', async () => {
    _mocks.generateContent.mockResolvedValue({
      response: { text: vi.fn(() => 'not json') },
    });

    const result = await generateQuiz('voting');
    expect(result).toBeNull();
  });

  it('returns null when quiz schema is invalid', async () => {
    const badQuiz = [{ question: 'Q1?', options: ['A', 'B'], correct: 0 }]; // missing explanation, only 2 options
    _mocks.generateContent.mockResolvedValue({
      response: { text: vi.fn(() => JSON.stringify(badQuiz)) },
    });

    const result = await generateQuiz('voting');
    expect(result).toBeNull();
  });

  it('returns null on API error', async () => {
    _mocks.generateContent.mockRejectedValue(new Error('API error'));
    const result = await generateQuiz('voting');
    expect(result).toBeNull();
  });
});
