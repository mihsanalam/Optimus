import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { context, platform, userInstructions } = await request.json();
    if (!context || !platform) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    let generatedReply = "";

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];
        let success = false;
        let lastError: any = null;

        const prompt = `
You are Optimus, a personal AI workflow assistant.
Write a message or reply to be sent via ${platform.toUpperCase()}.
Use the context below to inform your response:
"${context}"

${userInstructions ? `The user also specified the following instructions for this reply:\n"${userInstructions}"` : ""}

Make sure the tone matches the context. If it's email (Gmail or Outlook), include a relevant Subject: line at the very top. If it's a chat message (WhatsApp, Slack, Discord), keep it concise and direct without subject lines. Output only the message text itself.
`;

        for (const modelName of modelsToTry) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            generatedReply = result.response.text().trim();
            if (generatedReply) {
              success = true;
              break;
            }
          } catch (err: any) {
            console.warn(`[Compose compiler fallback] Model ${modelName} failed:`, err.message);
            lastError = err;
          }
        }

        if (!success) {
          throw lastError || new Error("All models failed to generate draft reply");
        }
      } catch (err) {
        console.error("[Compose API] Gemini AI error, using fallback:", err);
        generatedReply = getFallbackDraft(platform, context, userInstructions);
      }
    } else {
      generatedReply = getFallbackDraft(platform, context, userInstructions);
    }

    return NextResponse.json({ success: true, reply: generatedReply });
  } catch (err: any) {
    console.error("[Briefing Compose API] Error in drafting endpoint:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function getFallbackDraft(platform: string, context: string, userInstructions?: string) {
  const cleanPlatform = platform.toLowerCase();
  if (cleanPlatform === "gmail" || cleanPlatform === "outlook") {
    return `Subject: Re: Update regarding ${context.slice(0, 30)}...

Hi Team,

Thank you for the update. I have reviewed the briefing summary regarding: "${context}".

Let's sync up to finalize the next steps. I've noted the action items and deadlines.

${userInstructions ? `Notes on request: ${userInstructions}\n` : ""}
Best regards,
Operator`;
  } else {
    return `Hi, I got your message regarding "${context.slice(0, 40)}". ${
      userInstructions ? `Ref: ${userInstructions}` : "I am reviewing it now and will follow up shortly."
    }`;
  }
}
