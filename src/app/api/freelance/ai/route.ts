import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { action, notes, contact, text: voiceText } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Gemini API key is not configured on the server." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We try multiple models in order of preferred options to avoid API limits or availability issues
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-pro"];
    let lastError: any = null;
    let text = "";

    if (action === "parse_voice_leads") {
      if (!voiceText) {
        return NextResponse.json({ success: false, error: "Transcription text is required for voice parsing." }, { status: 400 });
      }

      const prompt = `
You are the Optimus AI Lead Hunter.
Analyze the following voice transcription of a freelancer hunting clients. They will dictate information about one or more people/companies they want to contact (including name, profile url/linkedin, phone, email, website, and other details).

Extract this information into a structured JSON array of lead objects.
Fields per lead object:
- "name": string (full name of the person or business name if person name is not specified)
- "url": string (linkedin profile URL or other social profile if mentioned, default null)
- "phone": string (phone number, default null)
- "email": string (email address, default null)
- "website": string (website URL if mentioned, default null)
- "owner_name": string (name of the owner/decision maker if mentioned, default null)
- "category": string (category/industry, e.g., Fintech, Real Estate, E-commerce, default null)
- "what_need": string (what they need/service needed, e.g., Website Redesign, SEO optimization, App development, default null)
- "notes": string (brief summary of any other context, pain points, or notes mentioned for this person)

Important:
- Return ONLY valid JSON format.
- Wrap your response in an object with a "leads" key containing the array. Example: { "leads": [...] }
- Do not output markdown code blocks (e.g. \`\`\`json). Output raw JSON.
- If no leads can be found, return { "leads": [] }.

Here is the transcription:
"${voiceText}"
`;

      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const responseText = result.response.text().trim();
          
          // Clean JSON formatting if Gemini wraps it in markdown blocks
          const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          
          if (parsed && Array.isArray(parsed.leads)) {
            return NextResponse.json({ success: true, leads: parsed.leads });
          }
        } catch (err: any) {
          console.warn(`[AI Freelance Voice Hunter] Model ${modelName} failed:`, err.message);
          lastError = err;
        }
      }
      throw lastError || new Error("All generative models failed for voice hunt parsing");

    } else if (action === "summarize_notes") {
      if (!notes) {
        return NextResponse.json({ success: false, error: "Notes are required for summarization." }, { status: 400 });
      }

      const prompt = `
You are the Optimus AI CRM assistant.
Summarize the following client notes into a highly structured, bulleted format. 
Focus on:
1. Current status / recent progress
2. Action items & decisions made
3. Next steps & deadlines (if any)

Keep it very brief, professional, and formatted in Markdown.
Here are the client notes:
"${notes}"
`;

      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          text = result.response.text().trim();
          if (text) {
            return NextResponse.json({ success: true, summary: text });
          }
        } catch (err: any) {
          console.warn(`[AI Freelance Summary] Model ${modelName} failed:`, err.message);
          lastError = err;
        }
      }
      throw lastError || new Error("All generative models failed for summarization");

    } else if (action === "draft_pitch") {
      if (!contact) {
        return NextResponse.json({ success: false, error: "Contact details are required." }, { status: 400 });
      }

      const { name, url, phone, email, website, owner_name, category, what_need, notes: contactNotes } = contact;
      const prompt = `
You are Optimus, an elite freelance outreach specialist.
Write a personalized, highly engaging cold outreach pitch for this lead:
- Company/Name: ${name}
- Owner Name: ${owner_name || "N/A"}
- Category: ${category || "N/A"}
- Needs/Requirements: ${what_need || "N/A"}
- Email: ${email || "N/A"}
- Website: ${website || "N/A"}
- LinkedIn/URL: ${url || "N/A"}
- Details/Notes: ${contactNotes || "N/A"}

Goal: Write a compelling, customized message (around 150-250 words) that demonstrates value, references their business niche, category, and what they need/are looking for, and suggests a short 15-minute call.
Format: Return ONLY the ready-to-send draft email starting with a Subject line, and then the body of the email. Do not include any intro or outro commentary like "Here is your draft". Use placeholders like [Your Name] for the sender.
`;

      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          text = result.response.text().trim();
          if (text) {
            return NextResponse.json({ success: true, pitch: text });
          }
        } catch (err: any) {
          console.warn(`[AI Freelance Pitch] Model ${modelName} failed:`, err.message);
          lastError = err;
        }
      }
      throw lastError || new Error("All generative models failed for pitch generation");
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[Freelance AI Route Error] :", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
