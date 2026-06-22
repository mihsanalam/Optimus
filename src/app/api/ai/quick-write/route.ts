import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { format, prompt, tone, customApiKey, styleProfile } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "Gemini API key is required. Please set it in settings or environment."
      }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    let instruction = "";
    if (styleProfile) {
      instruction = `You are tasked with writing content in a very specific style.
      
Here is the exact writing style you MUST adopt:
"${styleProfile}"

Now, based on that style, `;
      if (format === "email") {
        instruction += `write a professional email about: "${prompt}". Return the subject line on the first line starting with "Subject: " and then the body of the email.`;
      } else if (format === "post") {
        instruction += `write a clean social media post (LinkedIn/Twitter) about: "${prompt}". Include relevant hashtags.`;
      } else if (format === "ideas") {
        instruction += `brainstorm a list of 5 creative ideas or next steps for: "${prompt}". Make it highly actionable.`;
      } else {
        instruction += `write a short draft responding to the prompt: "${prompt}".`;
      }
    } else {
      if (format === "email") {
        instruction = `Write a professional email about: "${prompt}". Use a ${tone} tone. Return the subject line on the first line starting with "Subject: " and then the body of the email.`;
      } else if (format === "post") {
        instruction = `Write a clean social media post (LinkedIn/Twitter) about: "${prompt}". Use a ${tone} tone and include relevant hashtags.`;
      } else if (format === "ideas") {
        instruction = `Brainstorm a list of 5 creative ideas or next steps for: "${prompt}". Use a ${tone} tone and make it highly actionable.`;
      } else {
        instruction = `Write a short draft responding to the prompt: "${prompt}". Use a ${tone} tone.`;
      }
    }

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
            text: text,
            modelUsed: modelName
          });
        }
      } catch (err: any) {
        console.warn(`[Quick Write fallback] Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error("All attempt models failed to compile writing output");
  } catch (err: any) {
    console.error("[Quick Write API] Error:", err);

    // Check if error is related to quota or rate limits
    const isRateLimit = err.message?.toLowerCase().includes("quota") || 
                        err.message?.toLowerCase().includes("limit") ||
                        err.message?.toLowerCase().includes("429") ||
                        err.message?.toLowerCase().includes("request");

    if (isRateLimit) {
      // Safely parse request body again to extract prompt details
      let prompt = "";
      let format = "email";
      let tone = "professional";
      try {
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        prompt = body.prompt || "";
        format = body.format || "email";
        tone = body.tone || "professional";
      } catch (e) {
        // Ignore
      }

      let fallbackText = "";
      if (format === "email") {
        fallbackText = `Subject: Quick Follow-up regarding: ${prompt}\n\nHi there,\n\nI wanted to reach out regarding "${prompt}". Let's connect soon to discuss the details and align on our next steps.\n\nBest regards,\n[Your Name]`;
      } else if (format === "post") {
        fallbackText = `🚀 Excited to share some thoughts on: ${prompt}! \n\nFocusing on quality and execution makes all the difference. What are your thoughts?\n\n#Professional #Growth #Productivity`;
      } else {
        fallbackText = `Here is a quick draft regarding "${prompt}" (written in a ${tone} tone):\n\n1. Define primary objectives clearly.\n2. Coordinate with key stakeholders.\n3. Implement iterative feedback loops.\n4. Measure and analyze performance indicators.\n5. Optimize resource allocation.`;
      }

      return NextResponse.json({
        success: true,
        text: `🤖 **[Optimus Quick-Write - Sandbox Fallback]** (Gemini API key currently rate-limited)\n\n${fallbackText}`,
        modelUsed: "sandbox-fallback"
      });
    }

    return NextResponse.json({ success: false, error: err.message || "Failed to generate copy" }, { status: 500 });
  }
}
