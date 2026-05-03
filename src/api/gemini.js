import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function askGemini({ message, history = [], country, phase, userLevel }) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: `You are an expert election education assistant. 
      Your goal is to explain the ${phase} of the election process in ${country} to a ${userLevel} level audience. 
      Maintain strict neutrality. Do not favor any political party or candidate. 
      Focus on procedural, historical, and factual information. 
      If asked for an opinion, politely decline and steer the conversation back to how the system works.`
    });

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function generateQuiz(topic, count = 5) {
  const prompt = `Generate a quiz with ${count} multiple-choice questions about ${topic} in the context of elections. 
  Return the response as a JSON array of objects with 'question', 'options' (array of 4), 'correct' (index 0-3), and 'explanation' fields. 
  Keep the tone educational and neutral.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Basic cleanup in case of markdown formatting
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    return null;
  }
}
