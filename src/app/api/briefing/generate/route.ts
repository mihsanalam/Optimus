import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { whatsappManager } from "@/lib/whatsappManager";
import { insforge } from "@/lib/insforge";
import { getValidGmailToken, fetchGoogleEmails } from "@/lib/gmailHelper";

// High fidelity fallback response in case Gemini API key is missing or fails
const getFallbackBriefing = (connectedApps: Record<string, boolean>, userId: string | null = null, realEmails: any[] | null = null) => {
  const brief = [];
  const priorities = [];
  let importantCount = 0;
  let priorityCount = 0;
  let followUpsCount = 0;
  let emails: any[] = [];

  if (connectedApps.gmail && realEmails) {
    emails = realEmails;

    importantCount += emails.length;
    followUpsCount += Math.min(2, emails.length);
    
    emails.forEach((email: any) => {
      brief.push({
        app: "gmail",
        title: email.subject || "Gmail Message",
        summary: `From: ${email.from}. ${email.snippet}`,
        time: email.date || "Today"
      });
    });

    // Populate priorities from the emails
    emails.forEach((email: any) => {
      const isUrgent = email.subject.toLowerCase().includes("urgent") || 
                       email.snippet.toLowerCase().includes("urgent") || 
                       email.snippet.toLowerCase().includes("feedback") || 
                       email.subject.toLowerCase().includes("spec") ||
                       email.subject.toLowerCase().includes("panel") ||
                       email.subject.toLowerCase().includes("request");
      
      if (isUrgent) {
        priorities.push({
          app: "gmail",
          title: email.subject,
          time: email.date || "Today",
          description: `From: ${email.from}. ${email.snippet}`,
          priority: email.subject.toLowerCase().includes("urgent") ? "Critical" : "High"
        });
        priorityCount++;
      }
    });

    if (priorities.length === 0 && emails.length > 0) {
      priorities.push({
        app: "gmail",
        title: emails[0].subject,
        time: emails[0].date || "Today",
        description: `From: ${emails[0].from}. ${emails[0].snippet}`,
        priority: "Medium"
      });
      priorityCount++;
    }
  }

  if (connectedApps.whatsapp) {
    priorityCount += 1;
    followUpsCount += 1;
    
    // Check if real socket is active to fetch real message counts
    const isLive = whatsappManager.getSession(userId || "default_user").status === "connected";

    brief.push({
      app: "whatsapp",
      title: "WhatsApp Activity Summary",
      summary: isLive 
        ? "Connected to active phone socket. Messages processed successfully. Ready to receive notifications."
        : "Sandbox simulation active. John requested a review of the mobile dashboard layouts.",
      time: "Updated Just now"
    });

    priorities.push({
      app: "whatsapp",
      title: isLive ? "Active WhatsApp Node" : "John - Layout Code Review",
      time: "9:15 AM",
      description: isLive 
        ? "Baileys session connected successfully. Listening to incoming message alerts."
        : "Verify mobile responsive adjustments and merge the layout branch.",
      priority: "Critical"
    });
  }

  if (connectedApps.slack) {
    importantCount += 1;
    brief.push({
      app: "slack",
      title: "Slack Workspace mentions",
      summary: "Aggregation shows team mentions in #engineering and #development. Pipeline build reports successful deployment.",
      time: "Updated 15m ago"
    });
  }

  if (connectedApps.outlook) {
    followUpsCount += 1;
    brief.push({
      app: "outlook",
      title: "Calendar Schedule Digest",
      summary: "No meetings scheduled before 1:00 PM. A 2-hour focus block is set for refactoring slot starting at 1:30 PM.",
      time: "Updated 1h ago"
    });
  }

  // Ensure we have at least some priorities if no apps are connected
  if (priorities.length === 0) {
    priorities.push({
      app: "optimus",
      title: "Configure Integrations",
      time: "Now",
      description: "Connect Gmail, WhatsApp, or Slack to begin compiling live briefs and priorities.",
      priority: "Medium"
    });
  }

  return {
    success: true,
    source: "fallback",
    stats: {
      importantCount,
      priorityCount,
      followUpsCount
    },
    todayBrief: brief,
    priorityItems: priorities,
    gmailEmails: emails
  };
};

export async function POST(request: Request) {
  let requestData: any = {};
  try {
    requestData = await request.json();
  } catch (e) {
    // Ignore parse error
  }
  
  const connectedApps = requestData.connectedApps || {};
  const customInbox = requestData.customInbox || [];
  const userId = requestData.userId || null;
  const customApiKey = requestData.customApiKey || null;

  try {
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    // We don't return early here if apiKey is missing. We will resolve real emails first, then fallback.

    // 1. Resolve Gmail emails
    let gmailEmails: any[] = [];
    let isGmailAuthenticated = false;
    if (connectedApps.gmail) {
      const clientGmailToken = requestData.gmailAccessToken || null;
      const clientGmailRefreshToken = requestData.gmailRefreshToken || null;

      const { accessToken: resolvedToken } = await getValidGmailToken({
        gmailAccessToken: clientGmailToken,
        gmailRefreshToken: clientGmailRefreshToken,
        userId: userId
      });
      
      if (resolvedToken) isGmailAuthenticated = true;

      if (resolvedToken) {
        gmailEmails = await fetchGoogleEmails(resolvedToken);
      }
    }

    // Prepare raw input data for Gemini prompt
    const rawDataSources: string[] = [];

    if (connectedApps.gmail && gmailEmails.length > 0) {
      const formattedEmails = gmailEmails.map((email: any, index: number) => {
        return `  ${index + 1}. From: ${email.from} | Subject: ${email.subject} | Snippet: ${email.snippet} | Time: ${email.date || "unknown"}`;
      }).join("\n");

      rawDataSources.push(`
- Gmail Platform (Connected):
${formattedEmails}
      `);
    }

    if (connectedApps.whatsapp) {
      const isLive = whatsappManager.getSession(userId || "default_user").status === "connected";
      if (isLive) {
        rawDataSources.push(`
- WhatsApp Platform (Connected, Live Mode: true):
  Socket is fully active. Status: Connected. Ready to sync messages.
        `);
      }
    }

    // Since Slack and Outlook do not have real API fetching implemented here yet,
    // we omit pushing fake data to avoid hallucinated dashboard entries.

    if (rawDataSources.length === 0) {
      // If we authenticated but there's literally no data, return empty state.
      if (userId && Object.keys(connectedApps).length > 0 && connectedApps.gmail && isGmailAuthenticated) {
        return NextResponse.json({
          success: true,
          source: "gemini",
          stats: { importantCount: 0, priorityCount: 0, followUpsCount: 0 },
          todayBrief: [],
          priorityItems: [],
          gmailEmails: []
        });
      }
      return NextResponse.json(getFallbackBriefing(connectedApps, userId, gmailEmails.length > 0 ? gmailEmails : null));
    }
    
    if (!apiKey) {
      console.warn("[Optimus Briefing API] Gemini API key not found. Using high-fidelity mock compiler.");
      return NextResponse.json(getFallbackBriefing(connectedApps, userId, gmailEmails));
    }

    // Initialize Gemini SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];
    let lastError: any = null;
    let text = "";

    const prompt = `
You are Optimus, an advanced AI workflow assistant.
Given the following raw notifications and state logs from connected platforms, analyze the information and generate:
1. Daily Brief: A list of short, high-fidelity summary items. For Gmail/emails, do NOT group them into a single overview item. Instead, create a separate item in the "todayBrief" array for each individual message. The "title" should be the message's Subject/Topic, the "summary" should describe the core message/request, the "app" should be "gmail" (or matching platform), and "time" should strictly follow the format: "DD Month YYYY _ HH:MM AM/PM" (e.g., "16 June 2026 _ 04:30 PM").
2. Priority Items: The top 2-3 most critical items requiring immediate attention. Include exact time, description, and importance level.
3. Stats counts: Realistic counts for Important items, Priority items, and Follow-ups based on the content.

You MUST return the response strictly as a JSON object. Do not include markdown code block syntax (like \`\`\`json). Return exactly this structure:
{
  "stats": {
    "importantCount": number,
    "priorityCount": number,
    "followUpsCount": number
  },
  "todayBrief": [
    {
      "app": "gmail" | "whatsapp" | "slack" | "outlook",
      "title": "Email subject or message topic",
      "summary": "Short 1-2 sentence summary of what is happening",
      "time": "e.g., 17 June 2026 _ 10:45 AM"
    }
  ],
  "priorityItems": [
    {
      "app": "gmail" | "whatsapp" | "slack" | "outlook",
      "title": "Short title of item",
      "time": "e.g. 17 June 2026 _ 10:45 AM",
      "description": "Short description of the item and why it matters",
      "priority": "High" | "Critical" | "Medium"
    }
  ]
}

Raw platform logs:
${rawDataSources.join("\n\n")}
`;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        text = result.response.text().trim();
        
        if (text) {
          // Clean code blocks if present
          const cleanedJson = text.replace(/^```json/i, "").replace(/```$/, "").trim();
          const parsedData = JSON.parse(cleanedJson);

          return NextResponse.json({
            success: true,
            source: "gemini",
            modelUsed: modelName,
            gmailEmails: gmailEmails,
            ...parsedData
          });
        }
      } catch (err: any) {
        console.warn(`[Briefing fallback] Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error("All attempt models failed to compile a briefing");

  } catch (err: any) {
    console.error("[Optimus Briefing API] Error compiling briefing with Gemini:", err);
    // Graceful fallback (using stored connectedApps)
    return NextResponse.json(getFallbackBriefing(connectedApps, userId, null));
  }
}
