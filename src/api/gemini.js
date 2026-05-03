import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Simple client-side rate limiter: max 8 requests per 60 seconds
const rateLimiter = (() => {
  const timestamps = [];
  const MAX_REQUESTS = 8;
  const WINDOW_MS = 60_000;
  return {
    check() {
      const now = Date.now();
      while (timestamps.length && now - timestamps[0] > WINDOW_MS) timestamps.shift();
      if (timestamps.length >= MAX_REQUESTS) {
        const waitSec = Math.ceil((WINDOW_MS - (now - timestamps[0])) / 1000);
        throw new Error(`RATE_LIMIT:${waitSec}`);
      }
      timestamps.push(now);
    },
  };
})();

function sanitizeInput(input) {
  if (typeof input !== "string") throw new Error("INVALID_INPUT");
  const trimmed = input.trim();
  if (!trimmed) throw new Error("EMPTY_INPUT");
  if (trimmed.length > 1000) throw new Error("INPUT_TOO_LONG");
  return trimmed;
}

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
 * Send a chat message to Gemini 2.0 Flash and return the text response.
 */
export async function askGemini({ message, history = [], country, phase, userLevel }) {
  const safeMessage = sanitizeInput(message);
  rateLimiter.check();

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: `You are an expert election education assistant.
Your goal is to explain the ${phase} of the election process in ${country} to a ${userLevel} level audience.
Maintain strict neutrality. Do not favor any political party or candidate.
Focus on procedural, historical, and factual information.
If asked for an opinion, politely decline and steer the conversation back to how the system works.
Keep responses concise and clear — aim for 2-4 paragraphs maximum.`,
  });

  const chat = model.startChat({
    history,
    generationConfig: { maxOutputTokens: 1000 },
  });

  const result = await chat.sendMessage(safeMessage);
  return result.response.text();
}

/**
 * Generate an AI-powered deep-dive summary for a phase using Gemini 2.0 Flash.
 * @param {string} country
 * @param {string} phase
 * @param {string} userLevel
 * @returns {Promise<string>}
 */
export async function generatePhaseSummary(country, phase, userLevel) {
  rateLimiter.check();

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction:
      "You are a neutral, expert civic education writer. Provide factual, unbiased information about election processes.",
  });

  const prompt = `Write a concise, engaging educational summary (3-4 paragraphs) about the "${phase}" phase of the election process in ${country}, tailored for a ${userLevel} audience.
Include:
- What happens during this phase and why it matters
- Key actors involved (officials, parties, voters)
- One interesting or unique fact about how ${country} handles this phase
- Any common misconceptions to address

Keep the tone informative, neutral, and accessible. No markdown headers — just flowing paragraphs.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate quiz questions via Gemini 2.0 Flash with schema validation.
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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

/**
 * Translate text using Gemini 2.0 Flash (no separate API key needed).
 * @param {string} text
 * @param {string} targetLanguage  e.g. "Spanish", "French", "Hindi"
 * @returns {Promise<string>}
 */
export async function translateText(text, targetLanguage) {
  rateLimiter.check();

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Translate the following text to ${targetLanguage}. Return ONLY the translated text, no explanations or notes.\n\n${text}`;
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
