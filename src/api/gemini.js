import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Simple client-side rate limiter: max 5 requests per 60 seconds
const rateLimiter = (() => {
  const timestamps = [];
  const MAX_REQUESTS = 5;
  const WINDOW_MS = 60_000;
  return {
    check() {
      const now = Date.now();
      // Remove timestamps outside the window
      while (timestamps.length && now - timestamps[0] > WINDOW_MS) timestamps.shift();
      if (timestamps.length >= MAX_REQUESTS) {
        const waitSec = Math.ceil((WINDOW_MS - (now - timestamps[0])) / 1000);
        throw new Error(`RATE_LIMIT:${waitSec}`);
      }
      timestamps.push(now);
    },
  };
})();

/**
 * Validate and sanitize user input before sending to the API.
 * @param {string} input
 * @returns {string} sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== "string") throw new Error("INVALID_INPUT");
  const trimmed = input.trim();
  if (!trimmed) throw new Error("EMPTY_INPUT");
  if (trimmed.length > 1000) throw new Error("INPUT_TOO_LONG");
  return trimmed;
}

/**
 * Validate that a quiz array has the expected shape.
 * @param {unknown} data
 * @returns {boolean}
 */
function isValidQuizArray(data) {
  if (!Array.isArray(data) || data.length === 0) return false;
  return data.every(
    (q) =>
      typeof q.question === "string" &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correct === "number" &&
      q.correct >= 0 &&
      q.correct <= 3 &&
      typeof q.explanation === "string"
  );
}

/**
 * Send a chat message to Gemini and return the text response.
 */
export async function askGemini({ message, history = [], country, phase, userLevel }) {
  const safeMessage = sanitizeInput(message);
  rateLimiter.check();

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `You are an expert election education assistant.
Your goal is to explain the ${phase} of the election process in ${country} to a ${userLevel} level audience.
Maintain strict neutrality. Do not favor any political party or candidate.
Focus on procedural, historical, and factual information.
If asked for an opinion, politely decline and steer the conversation back to how the system works.`,
  });

  const chat = model.startChat({
    history,
    generationConfig: { maxOutputTokens: 1000 },
  });

  const result = await chat.sendMessage(safeMessage);
  return result.response.text();
}

/**
 * Generate quiz questions via Gemini with schema validation and fallback.
 * @param {string} topic
 * @param {number} count
 * @returns {Promise<Array|null>}
 */
export async function generateQuiz(topic, count = 5) {
  const prompt = `Generate a quiz with ${count} multiple-choice questions about "${topic}" in the context of elections.
Return ONLY a valid JSON array (no markdown, no code fences) of objects with these exact fields:
- "question": string
- "options": array of exactly 4 strings
- "correct": number (0-3, index of the correct option)
- "explanation": string
Keep the tone educational and neutral.`;

  try {
    rateLimiter.check();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    if (!isValidQuizArray(parsed)) {
      console.warn("generateQuiz: response failed schema validation");
      return null;
    }
    return parsed;
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    return null;
  }
}
