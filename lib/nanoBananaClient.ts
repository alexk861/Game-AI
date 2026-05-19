import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateContentCandidates(topic: string, prompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          candidates: {
            type: Type.ARRAY,
            description: "A list of 3 content candidates generated for the topic.",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                body: { type: Type.STRING },
                platform: {
                  type: Type.STRING,
                  enum: ["Twitter", "LinkedIn", "Blog", "Instagram"],
                },
                tone: { type: Type.STRING },
                target_audience: { type: Type.STRING },
                hook: { type: Type.STRING },
              },
              required: ["title", "body", "platform", "tone", "target_audience", "hook"],
            },
          },
        },
        required: ["candidates"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response returned from Gemini API");
  }
  
  const parsed = JSON.parse(text);
  return parsed.candidates;
}
