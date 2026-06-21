import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are Optimus, the voice interface for a personal AI assistant. Interpret what the user wants and respond ONLY with valid JSON — no markdown, no explanation.

Response format:
{
  "action": "calendar|email|task|weather|brief|news|navigate|whatsapp|draft_social|draft_email|general",
  "response": "short friendly reply — 1 sentence max, will be spoken aloud",
  "data": {
    "taskName": "if creating a task",
    "page": "ai-agent|dashboard|briefings|workspace|integrations|alerts|news-reader|settings (if navigating)",
    "query": "search or filter query if relevant",
    "to": "recipient name, email, or phone number for whatsapp/draft_email",
    "message": "message body or draft content to send or draft",
    "subject": "subject line for emails",
    "topic": "topic for social media drafts",
    "platform": "social media platform, e.g. LinkedIn, Twitter (default: LinkedIn)"
  },
  "speak": true
}

Action rules:
- calendar    → wants to see schedule or events
- email       → wants inbox or email summary
- task        → creating or managing a task (extract the task name into data.taskName)
- weather     → asking about weather
- brief       → wants daily brief or "what's on today"
- news        → wants to see news or headlines (set data.page to "news-reader")
- navigate    → wants to go to a page (map to data.page carefully using the allowed pages)
- whatsapp    → wants to send a WhatsApp message. Extract recipient's name/phone to data.to and message content to data.message.
- draft_social→ wants to draft a social media post (LinkedIn, Twitter, etc.). Extract topic to data.topic and platform to data.platform.
- draft_email → wants to draft an email. Extract recipient to data.to, subject to data.subject, and email body to data.message.
- general     → conversation, questions, or anything else

Keep responses conversational, extremely helpful, and brief — they will be read aloud.`;

export async function POST(request: Request) {
  try {
    const { command } = await request.json();

    if (!command?.trim()) {
      return NextResponse.json({ error: 'No command provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: SYSTEM_PROMPT 
        });
        
        const result = await model.generateContent(command);
        const text = result.response.text();
        
        // Clean JSON formatting if Gemini wraps it in markdown blocks
        const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        return NextResponse.json(parsed);
      } catch (err: any) {
        console.warn(`[Voice API fallback] Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error("All fallback models failed.");

  } catch (error) {
    console.error('Voice command error:', error);
    return NextResponse.json({
      action: 'general',
      response: "Sorry, I missed that. I might be experiencing network issues. Try again.",
      data: {},
      speak: true,
    });
  }
}
