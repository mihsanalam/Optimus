import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { whatsappManager } from "@/lib/whatsappManager";
import { getValidGmailToken } from "@/lib/gmailHelper";

// Inline Gmail email fetcher
async function fetchGmailEmails(accessToken: string): Promise<any[]> {
  try {
    const listRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=5",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!listRes.ok) return [];
    const listData = await listRes.json();
    const messages = listData.messages || [];
    const emails = [];
    for (const msg of messages) {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!detailRes.ok) continue;
      const detail = await detailRes.json();
      const headers = detail.payload?.headers || [];
      const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown";
      const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
      const snippet = detail.snippet || "";
      let date = "Today";
      if (detail.internalDate) {
        date = new Date(parseInt(detail.internalDate)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      emails.push({ from, subject, snippet, date });
    }
    return emails;
  } catch { return []; }
}

export async function POST(request: Request) {
  let body: any = {};
  try { body = await request.json(); } catch {}

  const userId = body.userId || null;
  const gmailAccessToken = body.gmailAccessToken || null;
  const gmailRefreshToken = body.gmailRefreshToken || null;

  // 1. Fetch real Gmail emails
  let gmailEmails: any[] = [];
  try {
    const { accessToken } = await getValidGmailToken({ gmailAccessToken, gmailRefreshToken, userId });
    if (accessToken) {
      gmailEmails = await fetchGmailEmails(accessToken);
    }
  } catch (e) {
    console.warn("[Quick Generate] Gmail fetch failed:", e);
  }

  // 2. Fallback mock emails if no real ones
  if (gmailEmails.length === 0) {
    gmailEmails = [];
  }

  // 3. Fetch WhatsApp messages
  let waMessages: any[] = [];
  try {
    const uid = userId || "default_user";
    const res = await whatsappManager.executeTool("whatsapp.fetch_recent_messages", {}, uid);
    if (res?.messages) waMessages = res.messages;
  } catch (e) {
    console.warn("[Quick Generate] WhatsApp fetch failed:", e);
  }

  if (waMessages.length === 0) {
    waMessages = [];
  }

  // 4. Build categories_data
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateLabel = now.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

  const emailItems = gmailEmails.map((e: any) => ({
    app: "gmail",
    title: e.subject || "(No Subject)",
    sender: e.from || "Unknown",
    subject: e.subject || "(No Subject)",
    time: e.date || timeStr,
    description: e.snippet || "",
    snippet: e.snippet || ""
  }));

  const waItems = waMessages.map((m: any) => ({
    app: "whatsapp",
    title: m.from || m.sender || "Unknown",
    sender: m.from || m.sender || "Unknown",
    time: m.time ? new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : timeStr,
    description: m.body || "",
    snippet: m.body || ""
  }));

  const taskItems = emailItems.filter((e: any) =>
    /review|task|deadline|urgent|complete|submit/i.test(e.title + " " + e.description)
  );

  const categories_data: any = {
    Email: {
      count: emailItems.length,
      summary: `${emailItems.length} unread emails including: ${emailItems.slice(0, 2).map((e: any) => e.title).join(", ")}.`,
      items: emailItems
    },
    Messages: {
      count: waItems.length,
      summary: `${waItems.length} WhatsApp messages from: ${waItems.slice(0, 2).map((m: any) => m.sender).join(", ")}.`,
      items: waItems
    },
    Mentions: {
      count: 0,
      summary: "No mentions found.",
      items: []
    },
    Tasks: {
      count: taskItems.length || 1,
      summary: "Action items identified from emails and messages.",
      items: taskItems.slice(0, 2).length > 0 ? taskItems.slice(0, 2) : emailItems.slice(0, 1)
    },
    "Follow-Ups": {
      count: waItems.length > 0 ? 1 : 0,
      summary: waItems.length > 0
        ? `Follow up with ${waItems[0]?.sender} regarding recent messages.`
        : "No follow-ups.",
      items: waItems.slice(0, 1)
    }
  };

  // 5. Try AI for title + summary (optional enhancement)
  let briefingTitle = `Intelligence Briefing — ${dateLabel}`;
  let briefingSummary = `Today's briefing covers ${emailItems.length} emails and ${waItems.length} WhatsApp messages. Key topics: ${emailItems.slice(0, 2).map((e: any) => e.title).join("; ")}.`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Generate a short briefing title (max 10 words) and a 2-sentence summary for:
Emails: ${emailItems.slice(0, 3).map((e: any) => e.title).join(", ")}
WhatsApp: ${waItems.slice(0, 2).map((m: any) => `${m.sender}: ${m.description}`).join(", ")}
Return ONLY valid JSON (no markdown): {"title": "...", "summary": "..."}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim().replace(/^```json/i, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(text);
      if (parsed.title) briefingTitle = parsed.title;
      if (parsed.summary) briefingSummary = parsed.summary;
    } catch (e) {
      console.warn("[Quick Generate] AI title/summary failed, using fallback:", e);
    }
  }

  // 6. Save to DB
  const newBriefing = {
    user_id: userId,
    schedule_id: null,
    title: briefingTitle,
    summary: briefingSummary,
    stats: {
      email: emailItems.length,
      messages: waItems.length,
      mentions: 0,
      tasks: categories_data.Tasks.count,
      followups: categories_data["Follow-Ups"].count
    },
    categories_data
  };

  const { data: saved, error: insertErr } = await insforge.database
    .from("generated_briefings")
    .insert([newBriefing])
    .select()
    .single();

  if (insertErr) {
    console.error("[Quick Generate] Insert error:", insertErr);
    return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, briefing: saved });
}
