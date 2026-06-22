import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { samples, customApiKey } = await request.json();
    
    if (!samples || samples.length === 0) {
      return NextResponse.json({ success: false, error: "Writing samples are required" }, { status: 400 });
    }

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "Gemini API key is required. Please set it in settings or environment."
      }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const instruction = `You are an expert linguist and copywriter. Analyze the following writing samples provided by the user.
Extract their exact writing style, including tone, vocabulary, sentence structure, formatting habits, and any unique quirks.
Output a highly specific, 3-4 sentence "Style Profile" that can be used as a system prompt to instruct an AI to write exactly like this person.
Do not include any introductory or concluding remarks, just the raw style profile.

Writing Samples:
"${samples}"`;

    const modelsToTry = ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];
    let lastError: any = null;
    let text = "";

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(instruction);
        text = result.response.text().trim();
        
        if (text) {
          return NextResponse.json({
            success: true,
            styleProfile: text,
            modelUsed: modelName
          });
        }
      } catch (err: any) {
        console.warn(`[Analyze Style fallback] Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error("All attempt models failed to analyze style");
  } catch (err: any) {
    console.error("[Analyze Style API] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to analyze writing style" }, { status: 500 });
  }
}
