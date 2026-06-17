import { insforge } from "./insforge";

export interface GmailCredentials {
  email: string;
  accessToken: string;
  refreshToken: string | null;
  isMock: boolean;
  updatedAt: string;
}

// Refreshes the Google OAuth token using the refresh token
export async function refreshGmailToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId) {
    console.warn("[Gmail Helper] No GOOGLE_CLIENT_ID set, cannot refresh token.");
    return null;
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[Gmail Helper] Refresh token request failed:", errorText);
      return null;
    }

    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error("[Gmail Helper] Exception refreshing token:", err);
    return null;
  }
}

// Resolves and validates Gmail credentials, refreshing them if necessary
export async function getValidGmailToken(params: {
  gmailAccessToken?: string | null;
  gmailRefreshToken?: string | null;
  userId?: string | null;
}): Promise<{ accessToken: string | null; isNew: boolean }> {
  let { gmailAccessToken, gmailRefreshToken, userId } = params;

  // 1. If direct access token is passed, test it first
  if (gmailAccessToken) {
    const isValid = await testGmailToken(gmailAccessToken);
    if (isValid) {
      return { accessToken: gmailAccessToken, isNew: false };
    }
  }

  // 2. If it's invalid, and we have a refresh token (Preview Mode / local storage)
  if (gmailRefreshToken) {
    console.log("[Gmail Helper] Direct token invalid or missing, attempting refresh via client refresh token...");
    const newAccessToken = await refreshGmailToken(gmailRefreshToken);
    if (newAccessToken) {
      return { accessToken: newAccessToken, isNew: true };
    }
  }

  // 3. If we are in Real authenticated mode, look up in PostgreSQL database
  if (userId) {
    try {
      const { data: userData } = await insforge.database
        .from("users")
        .select("gmail_credentials")
        .eq("id", userId)
        .maybeSingle();

      const creds = userData?.gmail_credentials as GmailCredentials | undefined;
      if (creds) {
        // Test database access token
        if (creds.accessToken) {
          const isValid = await testGmailToken(creds.accessToken);
          if (isValid) {
            return { accessToken: creds.accessToken, isNew: false };
          }
        }

        // Database token is invalid/expired. Prevent loop if recently updated
        const lastUpdated = creds.updatedAt ? new Date(creds.updatedAt).getTime() : 0;
        const now = Date.now();
        const wasRecentlyUpdated = (now - lastUpdated) < 5 * 60 * 1000; // 5 minutes

        if (wasRecentlyUpdated) {
          console.warn("[Gmail Helper] Token is invalid/expired but was refreshed within the last 5 minutes. Skipping refresh to prevent loop.");
          return { accessToken: null, isNew: false };
        }

        // Refresh it using refresh token from db
        if (creds.refreshToken) {
          console.log("[Gmail Helper] Database token expired, refreshing via DB refresh token for user:", userId);
          const newAccessToken = await refreshGmailToken(creds.refreshToken);
          if (newAccessToken) {
            // Update database with new credentials
            const updatedCreds = {
              ...creds,
              accessToken: newAccessToken,
              updatedAt: new Date().toISOString()
            };
            await insforge.database
              .from("users")
              .update({ gmail_credentials: updatedCreds })
              .eq("id", userId);
            
            return { accessToken: newAccessToken, isNew: true };
          }
        }
      }
    } catch (e) {
      console.error("[Gmail Helper] Error fetching/updating user credentials from DB:", e);
    }
  }

  return { accessToken: null, isNew: false };
}

// Quick check to see if token works
async function testGmailToken(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      const errTxt = await res.text();
      console.warn("[Gmail Helper] testGmailToken failed profile check:", res.status, errTxt);
    }
    return res.ok;
  } catch {
    return false;
  }
}

// Fetch unread emails helper
export async function fetchGoogleEmails(accessToken: string) {  try {
    const listRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox category:primary is:unread&maxResults=5", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!listRes.ok) {
      const errBody = await listRes.text();
      console.error("[Gmail Helper Fetch] Google API error details:", errBody);
      throw new Error(`Gmail list failed: ${listRes.statusText} - Details: ${errBody}`);
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
          id: msg.id,
          from,
          subject,
          snippet,
          date: dateVal
        });
      }
    }
    return emails;
  } catch (err) {
    console.error("[Gmail Helper Fetch] Failed to fetch live Google emails:", err);
    return [];
  }
}

// Create a Gmail draft
export async function createGmailDraft(accessToken: string, to: string, subject: string, body: string): Promise<boolean> {
  try {
    const emailLines = [
      `To: ${to}`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      body
    ];
    const email = emailLines.join('\r\n');
    const raw = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: { raw }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Gmail Helper Draft] Failed to create draft:", errText);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Gmail Helper Draft] Exception creating draft:", err);
    return false;
  }
}

// Search Gmail emails
export async function searchGmailEmails(accessToken: string, query: string) {  try {
    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!listRes.ok) {
      throw new Error(`Gmail search failed: ${listRes.statusText}`);
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
          dateVal = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        emails.push({
          id: msg.id,
          from,
          subject,
          snippet,
          date: dateVal
        });
      }
    }
    return emails;
  } catch (err) {
    console.error("[Gmail Helper Search] Failed to search Google emails:", err);
    return [];
  }
}

// List Gmail emails (all or unread)
export async function listGmailEmails(accessToken: string, maxResults = 10, includeRead = true) {  try {
    const q = includeRead ? "" : "is:unread";
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
    const listRes = await fetch(url, {
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
          dateVal = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        emails.push({
          id: msg.id,
          from,
          subject,
          snippet,
          date: dateVal
        });
      }
    }
    return emails;
  } catch (err) {
    console.error("[Gmail Helper ListAll] Failed to fetch Google emails:", err);
    return [];
  }
}

// Fetch the full content/body of a specific email
export async function getGmailEmail(accessToken: string, messageId: string) {  try {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch email: ${res.statusText}`);
    }
    const detail = await res.json();
    const headers = detail.payload?.headers || [];
    const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown Sender";
    const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
    
    let body = "";
    if (detail.payload?.parts) {
      const findTextPart = (parts: any[]): string => {
        for (const part of parts) {
          if (part.mimeType === "text/plain" && part.body?.data) {
            return Buffer.from(part.body.data, "base64").toString("utf-8");
          }
          if (part.parts) {
            const bodyText = findTextPart(part.parts);
            if (bodyText) return bodyText;
          }
        }
        return "";
      };
      body = findTextPart(detail.payload.parts);
      if (!body && detail.payload.body?.data) {
        body = Buffer.from(detail.payload.body.data, "base64").toString("utf-8");
      }
    } else if (detail.payload?.body?.data) {
      body = Buffer.from(detail.payload.body.data, "base64").toString("utf-8");
    }

    if (!body) {
      body = detail.snippet || "";
    }

    let dateVal = "Unknown";
    const internalDate = detail.internalDate;
    if (internalDate) {
      dateVal = new Date(parseInt(internalDate)).toLocaleString();
    }

    return {
      id: messageId,
      from,
      subject,
      body,
      date: dateVal
    };
  } catch (err) {
    console.error("[Gmail Helper Get] Failed to fetch email detail:", err);
    return null;
  }
}

// Send a Gmail email directly
export async function sendGmailEmail(accessToken: string, to: string, subject: string, body: string): Promise<boolean> {
  try {
    const emailLines = [
      `To: ${to}`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      body
    ];
    const email = emailLines.join('\r\n');
    const raw = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Gmail Helper Send] Failed to send email:", errText);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Gmail Helper Send] Exception sending email:", err);
    return false;
  }
}

// List Google Calendar events from primary calendar
export async function listGoogleCalendarEvents(accessToken: string, maxResults = 15) {  try {
    const timeMin = new Date().toISOString();
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=${maxResults}&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(timeMin)}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      throw new Error(`Failed to list calendar events: ${res.statusText}`);
    }
    const data = await res.json();
    const items = data.items || [];
    return items.map((item: any) => ({
      id: item.id,
      summary: item.summary || "(No Title)",
      description: item.description || "",
      start: item.start?.dateTime || item.start?.date || "",
      end: item.end?.dateTime || item.end?.date || "",
      location: item.location || "",
      attendees: item.attendees?.map((a: any) => a.email) || []
    }));
  } catch (err) {
    console.error("[Calendar Helper List] Failed to fetch calendar events:", err);
    return [];
  }
}

// Create a Google Calendar event
export async function createGoogleCalendarEvent(
  accessToken: string,
  summary: string,
  startISO: string,
  endISO: string,
  description?: string,
  location?: string
): Promise<boolean> {  try {
    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        summary,
        description,
        location,
        start: { dateTime: startISO },
        end: { dateTime: endISO }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Calendar Helper Create] Failed to create event:", errText);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Calendar Helper Create] Exception creating calendar event:", err);
    return false;
  }
}

// Delete a Google Calendar event
export async function deleteGoogleCalendarEvent(accessToken: string, eventId: string): Promise<boolean> {  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Calendar Helper Delete] Failed to delete event:", errText);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Calendar Helper Delete] Exception deleting calendar event:", err);
    return false;
  }
}
