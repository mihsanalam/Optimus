import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { content, platform } = await request.json();
    if (!content || !platform) return NextResponse.json({ error: 'Content and platform are required' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    let prompt = "";
    if (platform === "linkedin") {
      prompt = `Write a professional, engaging LinkedIn post based on the following article. Include a strong hook, key takeaways, and relevant hashtags. Do not use generic corporate jargon, keep it authentic. Return only the post text.\n\nArticle:\n${content}`;
    } else if (platform === "twitter") {
      prompt = `Write a compelling Twitter thread based on the following article. Number each tweet (e.g. 1/X). Start with a strong hook tweet that summarizes the most interesting part. Return only the thread text.\n\nArticle:\n${content}`;
    } else {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const modelsToTry = ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return NextResponse.json({ success: true, text: result.response.text(), modelUsed: modelName });
      } catch (err: any) {
        console.warn(`[Social API fallback] Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error("All fallback models failed.");
  } catch (error: any) {
    console.error('Social API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate post: ' + error.message }, { status: 500 });
  }
}
