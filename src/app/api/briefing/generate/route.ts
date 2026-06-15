import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { whatsappManager } from "@/lib/whatsappManager";
import { insforge } from "@/lib/insforge";
import { getValidGmailToken, fetchGoogleEmails } from "@/lib/gmailHelper";

// High fidelity fallback response in case Gemini API key is missing or fails
const getFallbackBriefing = (connectedApps: Record<string, boolean>, customInbox: any[] = []) => {
  const brief = [];
  const priorities = [];
  let importantCount = 0;
  let priorityCount = 0;
  let followUpsCount = 0;

  if (connectedApps.gmail) {
    const emails = customInbox.length > 0 ? customInbox : [
      { id: "msg-101", from: "Sarah Miller <sarah@millermedia.com>", subject: "Project specifications for redesign", snippet: "Hey! Just wanted to follow up on the website redesign spec. We need final feedback by Friday 3 PM...", date: "Today, 10:45 AM" },
      { id: "msg-102", from: "GitHub Alerts <noreply@github.com>", subject: "[GitHub] Build Success: Optimus workflow-pipeline", snippet: "All checks passed in build workflow. 12 steps executed successfully.", date: "Today, 9:15 AM" },
      { id: "msg-103", from: "Elena Rostova <elena.r@techround.org>", subject: "Guest speaker request: Technical Panel next Tuesday", snippet: "Hi Mihsan, we'd love to have you speak about AI agent coding. Please let me know your availability...", date: "Yesterday, 4:30 PM" }
    ];

    importantCount += emails.length;
    followUpsCount += Math.min(2, emails.length);
    
    brief.push({
      app: "gmail",
      title: "Gmail Communications Overview",
      summary: `Detected ${emails.length} unread threads. Latest from ${emails[0]?.from || "Unknown"}: "${emails[0]?.subject || ""}".`,
      time: "Updated 5m ago"
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
    const isLive = whatsappManager.getSession().status === "connected";

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
    priorityItems: priorities
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
    const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[Optimus Briefing API] Gemini API key not found. Using high-fidelity mock compiler.");
      return NextResponse.json(getFallbackBriefing(connectedApps, customInbox));
    }

    // 1. Resolve Gmail emails
    let gmailEmails = [];
    if (connectedApps.gmail) {
      const clientGmailToken = requestData.gmailAccessToken || null;
      const clientGmailRefreshToken = requestData.gmailRefreshToken || null;

      const { accessToken: resolvedToken } = await getValidGmailToken({
        gmailAccessToken: clientGmailToken,
        gmailRefreshToken: clientGmailRefreshToken,
        userId: userId
      });

      if (resolvedToken) {
        gmailEmails = await fetchGoogleEmails(resolvedToken);
      } else {
        gmailEmails = customInbox.length > 0 ? customInbox : [
          { id: "msg-101", from: "Sarah Miller <sarah@millermedia.com>", subject: "Project specifications for redesign", snippet: "Hey! Just wanted to follow up on the website redesign spec. We need final feedback by Friday 3 PM...", date: "Today, 10:45 AM" },
          { id: "msg-102", from: "GitHub Alerts <noreply@github.com>", subject: "[GitHub] Build Success: Optimus workflow-pipeline", snippet: "All checks passed in build workflow. 12 steps executed successfully.", date: "Today, 9:15 AM" },
          { id: "msg-103", from: "Elena Rostova <elena.r@techround.org>", subject: "Guest speaker request: Technical Panel next Tuesday", snippet: "Hi Mihsan, we'd love to have you speak about AI agent coding. Please let me know your availability...", date: "Yesterday, 4:30 PM" }
        ];
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
      const isLive = whatsappManager.getSession().status === "connected";
      rawDataSources.push(`
- WhatsApp Platform (Connected, Live Mode: ${isLive}):
  ${isLive 
    ? "Socket is fully active. Status: Connected. Live message logs show active pairing." 
    : "Sandbox Mode is active. Message: John asks if the mobile dashboard mockups are approved and says we need to run visual tests."}
  Message: Sarah Miller says thanks for the help.
      `);
    }

    if (connectedApps.slack) {
      rawDataSources.push(`
- Slack Platform (Connected):
  Mention: Team discussion in #engineering about next week's code freeze.
  Alert: Deployment completed for the syntonic repository on Render.
      `);
    }

    if (connectedApps.outlook) {
      rawDataSources.push(`
- Outlook Calendar (Connected):
  Event: Standup Sync at 9:00 AM.
  Event: Refactoring block at 1:00 PM for 2 hours.
      `);
    }

    if (rawDataSources.length === 0) {
      return NextResponse.json(getFallbackBriefing(connectedApps, customInbox));
    }

    // Initialize Gemini SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];
    let lastError: any = null;
    let text = "";

    const prompt = `
You are Optimus, an advanced AI workflow assistant.
Given the following raw notifications and state logs from connected platforms, analyze the information and generate:
1. Daily Brief: A short, high-fidelity summary for each connected platform. Include actionable summaries.
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
      "title": "Gmail Overview" or similar,
      "summary": "Short 1-2 sentence summary of what is happening",
      "time": "Updated Xm ago"
    }
  ],
  "priorityItems": [
    {
      "app": "gmail" | "whatsapp" | "slack" | "outlook",
      "title": "Short title of item",
      "time": "e.g. 10:45 AM",
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
    return NextResponse.json(getFallbackBriefing(connectedApps, customInbox));
  }
}
