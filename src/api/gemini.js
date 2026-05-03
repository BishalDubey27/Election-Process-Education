import { GoogleGenerativeAI } from "@google/generative-ai";

// For production, you should use a backend to proxy requests and hide your API key.
// For this education assistant, we'll initialize with a placeholder.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_API_KEY";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const buildSystemPrompt = (country, phase, userLevel) => `
You are an expert, politically neutral civics educator specializing in election processes.

Your role:
- Explain election processes clearly, accurately, and without political bias.
- Focus on the procedural and legal mechanics of elections.
- Adapt your language to a ${userLevel} audience.
- When discussing ${country}'s election system, provide country-specific accuracy.
- Currently, the user is learning about the "${phase}" phase of the election process.

Rules you must follow:
1. Never express opinions on political parties, candidates, or political ideologies.
2. Always distinguish between "how elections work" vs "political debate about elections".
3. If asked about contested or disputed claims, present the official/legal position only.
4. Keep responses concise (under 200 words) unless the user asks for more detail.
5. End every response with a follow-up suggestion question the user might want to ask next.
6. If asked something outside election education, politely redirect back to the topic.
7. Use Markdown for formatting (bold, lists, etc.).
`;

export async function askGemini({ history, country, phase, userLevel, message }) {
  const systemPrompt = buildSystemPrompt(country, phase, userLevel);
  
  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I am ready to provide neutral, factual election education." }] },
      ...history
    ],
  });

  try {
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function generateQuiz({ country, phase }) {
  const prompt = `Generate 3 multiple choice questions about the "${phase}" phase of ${country}'s election process. 
  
  Return ONLY valid JSON in this format:
  {
    "questions": [
      {
        "id": "q1",
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "correct": 0,
        "explanation": "..."
      }
    ]
  }`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Clean JSON from possible markdown wrapping
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    throw error;
  }
}
