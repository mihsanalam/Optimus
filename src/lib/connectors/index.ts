import { insforge } from "@/lib/insforge";

export interface IntelligenceData {
  source: string;
  data: any[];
}

/**
 * Normalizes mixed array of data into a unified JSON format
 * suitable for the Gemini AI Prompt Engine
 */
export function normalizeIntelligenceData(rawData: IntelligenceData[]) {
  const unified: any[] = [];
  
  rawData.forEach((feed) => {
    feed.data.forEach((item: any) => {
      unified.push({
        sourceApp: feed.source,
        content: item.text || item.body || item.snippet || "",
        metadata: {
          title: item.subject || item.channel || item.title || "Untitled",
          timestamp: item.date || item.timestamp || new Date().toISOString(),
          sender: item.from || item.sender || "Unknown"
        }
      });
    });
  });

  return unified;
}

/**
 * Fetches Gmail Unread Messages
 */
export async function fetchGmailData(userId: string): Promise<IntelligenceData | null> {
  // 1. Get access token from InsForge database
  const { data: user, error } = await insforge.database
    .from("users")
    .select("gmail_credentials")
    .eq("id", userId)
    .single();

  if (error || !user?.gmail_credentials?.accessToken) {
    console.log(`[Connectors] No Gmail token for user ${userId}`);
    return null;
  }

  const token = user.gmail_credentials.accessToken;

  // Mock vs Real detection
  if (token.startsWith("mock_")) {
    return {
      source: "gmail",
      data: [
        { subject: "Mock Email 1", snippet: "This is a simulated email.", from: "Boss", date: new Date().toISOString() }
      ]
    };
  }

  // Real fetch to Google API
  try {
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox category:primary&maxResults=5", {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error("Gmail API error");
    
    const json = await res.json();
    const messages = json.messages || [];

    const draftRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts?maxResults=3", {
      headers: { Authorization: `Bearer ${token}` }
    });
    let draftMessages = [];
    if (draftRes.ok) {
      const draftJson = await draftRes.json();
      draftMessages = (draftJson.drafts || []).map((d: any) => d.message);
    }
    
    const allIds = [...messages, ...draftMessages].filter(Boolean);

    // Fetch individual message details for context (snippet)
    const detailedMessages = await Promise.all(
      allIds.map(async (m: any) => {
        try {
          const mRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const mData = await mRes.json();
          const headers = mData.payload?.headers || [];
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
          const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
          const labels = mData.labelIds || [];
          
          let status = "Read";
          if (labels.includes("UNREAD")) status = "Unread";
          if (labels.includes("DRAFT")) status = "Draft";
          
          return {
            id: m.id,
            subject: `[${status}] ${subject}`,
            snippet: mData.snippet || "No snippet available",
            from: from,
            date: new Date().toISOString()
          };
        } catch (e) {
          return null;
        }
      })
    );
    
    const validMessages = detailedMessages.filter(Boolean);

    return {
      source: "gmail",
      data: validMessages
    };
  } catch (e) {
    console.error("[Connectors] Failed to fetch Gmail:", e);
    return null;
  }
}

/**
 * Fetches Slack Mentions / Channels
 */
export async function fetchSlackData(userId: string): Promise<IntelligenceData | null> {
  const { data: conn, error } = await insforge.database
    .from("app_connections")
    .select("access_token")
    .eq("user_id", userId)
    .eq("app_name", "slack")
    .single();

  if (error || !conn?.access_token) return null;

  // Real API call logic would go here
  return {
    source: "slack",
    data: [
      { channel: "#engineering", text: "Please review the PR #1024", sender: "alex_dev", timestamp: new Date().toISOString() }
    ]
  };
}

/**
 * Fetches WhatsApp Messages
 */
export async function fetchWhatsAppData(userId: string): Promise<IntelligenceData | null> {
  const { data: conn, error } = await insforge.database
    .from("app_connections")
    .select("status")
    .eq("user_id", userId)
    .eq("app_name", "whatsapp")
    .single();

  if (error || conn?.status !== "connected") return null;

  return {
    source: "whatsapp",
    data: [
      { title: "Design Group", body: "Can we get the assets by 5PM?", sender: "+1234567890", timestamp: new Date().toISOString() }
    ]
  };
}
