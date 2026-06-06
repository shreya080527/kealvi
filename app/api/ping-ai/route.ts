import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function GET() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Say 'it works' and nothing else."
  });

  return Response.json({
    reply: response.text
  });
}