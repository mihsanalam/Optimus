import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = `Provide a concise, 3-bullet point summary of the following article. Format the response as a markdown list.\n\n${content}`;
    
    const modelsToTry = ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return NextResponse.json({ success: true, text: result.response.text(), modelUsed: modelName });
      } catch (err: any) {
        console.warn(`[Summary API fallback] Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error("All fallback models failed.");
  } catch (error: any) {
    console.error('Summary API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate summary: ' + error.message }, { status: 500 });
  }
}
