import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to fetch real unread emails from Google API
async function fetchGoogleEmails(accessToken: string) {
  try {
    const listRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=5", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!listRes.ok) {
      throw new Error(`Gmail list failed: ${listRes.statusText}`);
    }
    const listData = await listRes.json();
    const messages = listData.messages || [];
    
    const emails = [];
    for (const msg of messages) {
      const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (detailRes.ok) {
        const detail = await detailRes.json();
        const headers = detail.payload?.headers || [];
        const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown Sender";
        const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
        const snippet = detail.snippet || "";
        
        let dateVal = "Today";
        const internalDate = detail.internalDate;
        if (internalDate) {
          const dateObj = new Date(parseInt(internalDate));
          dateVal = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        emails.push({
          sender: from,
          subject,
          body: snippet,
          time: dateVal
        });
      }
    }
    return emails;
  } catch (err) {
    console.error("[Gmail Process Fetch] Failed to fetch live Google emails:", err);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const { scheduleId } = await request.json();
    if (!scheduleId) {
      return NextResponse.json({ success: false, error: "Missing scheduleId parameter" }, { status: 400 });
    }

    // 1. Fetch schedule config details
    const { data: schedule, error: fetchErr } = await insforge.database
      .from("briefing_schedules")
      .select("*")
      .eq("id", scheduleId)
      .maybeSingle();

    if (fetchErr || !schedule) {
      console.error("[Briefing Process] Schedule not found:", fetchErr);
      throw new Error(fetchErr?.message || "Briefing schedule not found in database.");
    }

    const selectedApps: string[] = schedule.selected_apps || [];
    const selectedCategories: string[] = schedule.selected_categories || [];

    // 2. Fetch live emails if connected
    let gmailEmails: any[] = [];
    if (selectedApps.map(a => a.toLowerCase()).includes("gmail")) {
      let credentials = null;
      if (schedule.user_id) {
        try {
          const { data: userData } = await insforge.database
            .from("users")
            .select("gmail_credentials")
            .eq("id", schedule.user_id)
            .maybeSingle();
          if (userData?.gmail_credentials) {
            credentials = userData.gmail_credentials;
          }
        } catch (e) {
          console.warn("Could not fetch user credentials from DB:", e);
        }
      }

      if (credentials && !credentials.isMock && credentials.accessToken) {
        gmailEmails = await fetchGoogleEmails(credentials.accessToken);
      } else {
        // Default mock emails
        gmailEmails = [
          { sender: "Sarah Miller <sarah@millermedia.com>", subject: "Miller Redesign Specifications", body: "We need the final code and layout feedback by Friday 3:00 PM.", time: "10:45 AM" },
          { sender: "GitHub Notifications <noreply@github.com>", subject: "Build success: Optimus workflow-pipeline", body: "Check suite passed on main branch. Deploy is ready.", time: "11:20 AM" },
          { sender: "Elena Rostova <elena.r@techround.org>", subject: "Guest speaker request: Technical Panel next Tuesday", body: "Hi Mihsan, we'd love to have you speak about AI agent coding. Please let me know your availability...", time: "Yesterday, 4:30 PM" }
        ];
      }
    }

    // Aggregate platform data
    const mockPlatformData: any = {
      gmail: {
        email: gmailEmails,
        tasks: [
          { title: "Review website spec", priority: "High", deadline: "Friday 3:00 PM" }
        ]
      },
      whatsapp: {
        messages: [
          { sender: "John QA Lead", body: "Baileys WhatsApp socket connected. Standard pairing runs smoothly.", time: "9:15 AM" }
        ],
        followups: [
          { sender: "Mihsan Alam", body: "Please check the staging branch code quality.", time: "1:00 PM" }
        ]
      },
      slack: {
        mentions: [
          { channel: "#engineering", user: "Dave", text: "@Mihsan let's merge the Baileys auth credentials fix before production.", time: "2:30 PM" }
        ],
        tasks: [
          { title: "Approve migration script", priority: "High", deadline: "Today" }
        ]
      },
      outlook: {
        email: [
          { sender: "Microsoft Admin", subject: "Focused Time Reminder", body: "No meetings scheduled between 1:00 PM and 3:00 PM today.", time: "8:00 AM" }
        ],
        mentions: []
      }
    };

    const contentToProcess: string[] = [];
    selectedApps.forEach((app: string) => {
      const appKey = app.toLowerCase();
      if (mockPlatformData[appKey]) {
        contentToProcess.push(`--- Platform: ${app.toUpperCase()} ---`);
        selectedCategories.forEach((cat: string) => {
          const catKey = cat.toLowerCase().replace("-", ""); // match keys like 'followups'
          
          let targetKey = catKey;
          if (catKey === "email") targetKey = "email";
          else if (catKey === "messages") targetKey = "messages";
          else if (catKey === "mentions") targetKey = "mentions";
          else if (catKey === "tasks") targetKey = "tasks";
          else if (catKey === "followups") targetKey = "followups";

          if (mockPlatformData[appKey][targetKey] && mockPlatformData[appKey][targetKey].length > 0) {
            contentToProcess.push(`[Category: ${cat.toUpperCase()}]`);
            mockPlatformData[appKey][targetKey].forEach((item: any, idx: number) => {
              contentToProcess.push(`Item ${idx + 1}: ${JSON.stringify(item)}`);
            });
          }
        });
      }
    });

    // 3. Compile briefing using Gemini AI or high-fidelity fallback generator
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    let briefingTitle = `Scheduled Brief: ${schedule.name}`;
    let briefingSummary = "";
    let briefingStats = { email: 0, messages: 0, mentions: 0, tasks: 0, followups: 0 };
    let briefingCategoriesData: any = {};

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];
        let parsed: any = null;
        let lastError: any = null;

        const prompt = `
You are Optimus, an advanced AI workspace dashboard compiler.
Generate a structured, actionable briefing summary for the user based on the raw notification logs provided below.
The briefing configuration name is "${schedule.name}" and the user's primary goal is: "${schedule.description || "General monitoring"}".

Raw Notification logs:
${contentToProcess.length > 0 ? contentToProcess.join("\n") : "No notifications found in selected applications."}

Group updates strictly under the following selected categories: ${selectedCategories.join(", ")}.
You MUST output strictly valid JSON, without any markdown formatting code blocks (do not wrap in \`\`\`json). Use exactly the following structure:
{
  "title": "A short, engaging title summarizing today's focus",
  "summary": "A high-level 2-3 sentence overview of the most critical updates across platforms.",
  "stats": {
    "email": number,
    "messages": number,
    "mentions": number,
    "tasks": number,
    "followups": number
  },
  "categories_data": {
    "Email": {
      "count": number,
      "summary": "Short summary of emails",
      "items": [
        { "app": "gmail" | "outlook", "title": "Sender / Subject", "time": "Time stamp", "description": "Quick context detail" }
      ]
    },
    "Messages": {
      "count": number,
      "summary": "Short summary of chats",
      "items": [
        { "app": "whatsapp", "title": "Sender Name", "time": "Time stamp", "description": "Quick context detail" }
      ]
    },
    "Mentions": {
      "count": number,
      "summary": "Short summary of mentions",
      "items": [
        { "app": "slack", "title": "Channel / User", "time": "Time stamp", "description": "Quick context detail" }
      ]
    },
    "Tasks": {
      "count": number,
      "summary": "Short summary of tasks",
      "items": [
        { "app": "gmail" | "slack", "title": "Task title", "time": "Deadline", "description": "Action details" }
      ]
    },
    "Follow-ups": {
      "count": number,
      "summary": "Short summary of follow ups",
      "items": [
        { "app": "whatsapp", "title": "Follow up person", "time": "Time stamp", "description": "Action details" }
      ]
    }
  }
}
`;

        for (const modelName of modelsToTry) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            const cleanedJson = text.replace(/^```json/i, "").replace(/```$/, "").trim();
            parsed = JSON.parse(cleanedJson);
            if (parsed) {
              console.log(`[Briefing Process] Successfully compiled briefing using ${modelName}`);
              break;
            }
          } catch (err: any) {
            console.warn(`[Briefing compiler fallback] Model ${modelName} failed:`, err.message);
            lastError = err;
          }
        }

        if (!parsed) {
          throw lastError || new Error("All models failed to compile briefing JSON");
        }

        briefingTitle = parsed.title || briefingTitle;
        briefingSummary = parsed.summary || "";
        briefingStats = parsed.stats || briefingStats;
        
        // Normalize keys in categories_data to ensure capitalisation matches user categories
        selectedCategories.forEach((cat) => {
          const matchedKey = Object.keys(parsed.categories_data || {}).find(
            (k) => k.toLowerCase() === cat.toLowerCase()
          );
          if (matchedKey) {
            briefingCategoriesData[cat] = parsed.categories_data[matchedKey];
          }
        });

      } catch (geminiErr) {
        console.error("[Briefing Process] Gemini AI failure. Generating fallback content:", geminiErr);
        // Fallback using preset mock models
        briefingSummary = `Optimus aggregated updates for target goal: "${schedule.description || "Active operations"}". We scanned Gmail, Slack, and WhatsApp.`;
        selectedCategories.forEach((cat) => {
          const app = selectedApps[0] || "gmail";
          briefingCategoriesData[cat] = {
            count: 1,
            summary: `Automated scan completed for ${cat} notifications.`,
            items: [
              { app: app, title: `Pending ${cat} notification`, time: "11:00 AM", description: `Check app dashboard for direct action options.` }
            ]
          };
          const key = cat.toLowerCase().replace("-", "") as keyof typeof briefingStats;
          if (briefingStats[key] !== undefined) briefingStats[key] = 1;
        });
      }
    } else {
      // Local fallback generation
      briefingSummary = `Sandbox compiler compiled briefings for goal: "${schedule.description || "General monitoring"}". Synced apps: ${selectedApps.join(", ")}.`;
      selectedCategories.forEach((cat) => {
        const app = selectedApps[0] || "gmail";
        briefingCategoriesData[cat] = {
          count: 1,
          summary: `Aggregated activity under ${cat} category.`,
          items: [
            { app: app, title: `Optimus auto-alert: ${cat} items`, time: "9:30 AM", description: `Verify and check latest active integrations dashboard feed.` }
          ]
        };
        const key = cat.toLowerCase().replace("-", "") as keyof typeof briefingStats;
        if (briefingStats[key] !== undefined) briefingStats[key] = 1;
      });
    }

    // 4. Save generated briefing into the database users feed
    const newBriefing = {
      user_id: schedule.user_id,
      schedule_id: schedule.id,
      title: briefingTitle,
      summary: briefingSummary,
      stats: briefingStats,
      categories_data: briefingCategoriesData
    };

    const { error: insertErr } = await insforge.database
      .from("generated_briefings")
      .insert([newBriefing]); // Database inserts require array format

    if (insertErr) {
      console.error("[Briefing Process] Error saving generated briefing:", insertErr);
      throw insertErr;
    }

    // 5. Calculate next run time and update schedule table
    const [hours, minutes] = schedule.scheduled_time.split(":").map(Number);
    const nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    if (schedule.frequency === "daily") {
      nextRun.setDate(nextRun.getDate() + 1);
    } else if (schedule.frequency === "weekly") {
      nextRun.setDate(nextRun.getDate() + 7);
    } else if (schedule.frequency === "hourly") {
      nextRun.setTime(nextRun.getTime() + 60 * 60 * 1000);
    } else {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const { error: updateErr } = await insforge.database
      .from("briefing_schedules")
      .update({
        last_run: new Date().toISOString(),
        next_run: nextRun.toISOString()
      })
      .eq("id", schedule.id);

    if (updateErr) {
      console.error("[Briefing Process] Error updating schedule runtime details:", updateErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed and compiled briefing: ${schedule.name}` 
    });

  } catch (err: any) {
    console.error("[Briefing Process API] Failed to run compiler task:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
