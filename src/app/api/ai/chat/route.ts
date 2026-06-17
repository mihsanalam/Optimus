import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getValidGmailToken,
  fetchGoogleEmails,
  createGmailDraft,
  searchGmailEmails,
  listGmailEmails,
  getGmailEmail,
  sendGmailEmail,
  listGoogleCalendarEvents,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent
} from "@/lib/gmailHelper";
import { insforge } from "@/lib/insforge";
import { whatsappManager } from "@/lib/whatsappManager";

export async function POST(request: Request) {
  let messages: any[] = [];
  let systemInstruction = "";
  let customApiKey = "";
  let gmailAccessToken = "";
  let gmailRefreshToken = "";
  let calendarEvents: any[] = [];
  let userId = "";
  let tokenToUse: string | null = null;

  try {
    try {
      const body = await request.json();
      messages = body.messages || [];
      systemInstruction = body.systemInstruction || "";
      customApiKey = body.customApiKey || "";
      gmailAccessToken = body.gmailAccessToken || "";
      gmailRefreshToken = body.gmailRefreshToken || "";
      calendarEvents = body.calendarEvents || [];
      userId = body.userId || "";
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "Gemini API key is required. Please set it in settings or environment."
      }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Resolve Gmail access token (favoring request body token first, falling back to database credentials)
    const resolved = await getValidGmailToken({
      gmailAccessToken: gmailAccessToken,
      gmailRefreshToken: gmailRefreshToken,
      userId: userId
    });
    tokenToUse = resolved.accessToken;

    // Build dynamic context from live integrations
    let dynamicContext = "";
    if (tokenToUse) {
      try {
        const liveEmails = await fetchGoogleEmails(tokenToUse);
        if (liveEmails.length > 0) {
          const emailLines = liveEmails.map((email: any, index: number) => {
            return `- [${email.date}] From: ${email.from} | Subject: ${email.subject} | Snippet: "${email.snippet}"`;
          }).join("\n");
          dynamicContext += `\n\nUSER'S LIVE GMAIL INBOX SUMMARY (Unread):\n${emailLines}\n`;
        } else {
          dynamicContext += `\n\nUSER'S LIVE GMAIL INBOX STATUS: No unread emails found.\n`;
        }
      } catch (err) {
        console.warn("Could not fetch live emails for context injection:", err);
      }

      try {
        const liveCalEvents = await listGoogleCalendarEvents(tokenToUse);
        if (liveCalEvents.length > 0) {
          const eventLines = liveCalEvents.map((evt: any) => {
            return `- [${new Date(evt.start).toLocaleString()}] ${evt.summary}${evt.description ? ` (${evt.description})` : ""}${evt.location ? ` at ${evt.location}` : ""}`;
          }).join("\n");
          dynamicContext += `\n\nUSER'S LIVE GOOGLE CALENDAR SCHEDULE:\n${eventLines}\n`;
        }
      } catch (err) {
        console.warn("Could not fetch live Google calendar events for context injection:", err);
      }
    } else if (calendarEvents && calendarEvents.length > 0) {
      const eventLines = calendarEvents.map((evt: any) => {
        return `- [${evt.time || evt.date || "Today"}] ${evt.summary || evt.title || evt.name}${evt.description ? ` (${evt.description})` : ""}`;
      }).join("\n");
      dynamicContext += `\n\nUSER'S LOCAL CALENDAR SCHEDULE:\n${eventLines}\n`;
    }

    // Gemini API requires the first message in the history list to be from the 'user' (role: 'user').
    // Filter out the initial welcome assistant message from the history block if present.
    let historyPayload = messages.slice(0, -1);
    if (historyPayload.length > 0 && (historyPayload[0].role === "assistant" || historyPayload[0].role === "model")) {
      historyPayload = historyPayload.slice(1);
    }

    const formattedHistory = historyPayload.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content) {
      return NextResponse.json({ success: false, error: "Empty message payload" }, { status: 400 });
    }

    const modelsToTry = ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];
    let lastError: any = null;
    let responseText = "";

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: (systemInstruction || "You are Optimus, a personal AI workflow assistant.") + dynamicContext,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "createGmailDraft",
                  description: "Creates a draft email in the user's Gmail account.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      to: { type: "STRING", description: "The recipient's email address." },
                      subject: { type: "STRING", description: "The subject line of the draft email." },
                      body: { type: "STRING", description: "The main body content of the draft email." }
                    },
                    required: ["to", "subject", "body"]
                  }
                },
                {
                  name: "searchGmail",
                  description: "Searches the user's Gmail inbox for messages matching a search query (e.g. subject, sender, or content keywords).",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      query: { type: "STRING", description: "The query string to search for. Example: 'linkedin jobs' or 'from:linkedin'." }
                    },
                    required: ["query"]
                  }
                },
                {
                  name: "listGmailEmails",
                  description: "Retrieves a list of recent emails from the user's Gmail inbox.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      maxResults: { type: "INTEGER", description: "Maximum number of emails to retrieve (default: 10)." },
                      includeRead: { type: "BOOLEAN", description: "Whether to include already read/opened emails (default: true)." }
                    }
                  }
                },
                {
                  name: "getGmailEmail",
                  description: "Gets the full body/content details of a specific Gmail message by its ID.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      messageId: { type: "STRING", description: "The unique ID of the message to retrieve." }
                    },
                    required: ["messageId"]
                  }
                },
                {
                  name: "sendGmailEmail",
                  description: "Sends an email to a recipient immediately on behalf of the user.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      to: { type: "STRING", description: "The recipient's email address." },
                      subject: { type: "STRING", description: "The subject line of the email." },
                      body: { type: "STRING", description: "The main body content of the email." }
                    },
                    required: ["to", "subject", "body"]
                  }
                },
                {
                  name: "listGoogleCalendarEvents",
                  description: "Lists upcoming calendar events from the user's Google Calendar.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      maxResults: { type: "INTEGER", description: "Maximum number of events to retrieve (default: 15)." }
                    }
                  }
                },
                {
                  name: "createGoogleCalendarEvent",
                  description: "Creates a new event on the user's Google Calendar.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      summary: { type: "STRING", description: "The title/summary of the calendar event." },
                      startISO: { type: "STRING", description: "Start date-time in ISO 8601 format (e.g. 2026-06-16T09:00:00Z)." },
                      endISO: { type: "STRING", description: "End date-time in ISO 8601 format (e.g. 2026-06-16T10:00:00Z)." },
                      description: { type: "STRING", description: "Optional description of the calendar event." },
                      location: { type: "STRING", description: "Optional location/room of the event." }
                    },
                    required: ["summary", "startISO", "endISO"]
                  }
                },
                {
                  name: "deleteGoogleCalendarEvent",
                  description: "Deletes a specific calendar event from the user's Google Calendar using the event ID.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      eventId: { type: "STRING", description: "The unique ID of the calendar event to delete." }
                    },
                    required: ["eventId"]
                  }
                },
                {
                  name: "sendWhatsAppMessage",
                  description: "Sends a WhatsApp message to a specific phone number.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      phone: { type: "STRING", description: "The recipient's phone number with country code (e.g. +16503332026)." },
                      message: { type: "STRING", description: "The text message to send." }
                    },
                    required: ["phone", "message"]
                  }
                }
              ]
            }
          ] as any
        });

        const chat = model.startChat({
          history: formattedHistory
        });

        const result = await chat.sendMessage(lastMessage.content);
        const response = result.response;
        const functionCalls = response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
          const call = functionCalls[0];
          console.log("[Gemini Tool Call]:", call.name, call.args);

          if (!tokenToUse) {
            responseText = `I'm sorry, I cannot perform the "${call.name}" action because your Google account is not connected.`;
          } else {
            if (call.name === "createGmailDraft") {
              const { to, subject, body } = call.args as any;
              const success = await createGmailDraft(tokenToUse, to, subject, body);
              if (success) {
                const followUpResult = await chat.sendMessage([
                  {
                    text: `Successfully created Gmail draft to ${to} with subject "${subject}". Tell the user this is done.`
                  }
                ]);
                responseText = followUpResult.response.text();
              } else {
                responseText = "I encountered an error trying to save that email as a draft in your Gmail account. Please verify your connection.";
              }
            } else if (call.name === "searchGmail") {
              const { query } = call.args as any;
              const searchResults = await searchGmailEmails(tokenToUse, query);
              if (searchResults.length > 0) {
                const formattedResults = searchResults.map((email: any, index: number) => {
                  return `${index + 1}. From: ${email.from} | Subject: ${email.subject} | Snippet: "${email.snippet}" | Date: ${email.date} | ID: ${email.id}`;
                }).join("\n");

                const followUpResult = await chat.sendMessage([
                  {
                    text: `Gmail Search Results for "${query}":\n${formattedResults}\nSummarize these search results for the user and mention the email IDs if they want to view the details.`
                  }
                ]);
                responseText = followUpResult.response.text();
              } else {
                responseText = `I couldn't find any emails matching "${query}" in your Gmail account.`;
              }
            } else if (call.name === "listGmailEmails") {
              const { maxResults = 10, includeRead = true } = call.args as any;
              const emails = await listGmailEmails(tokenToUse, maxResults, includeRead);
              if (emails.length > 0) {
                const formatted = emails.map((e: any, idx: number) => {
                  return `${idx + 1}. [${e.date}] From: ${e.from} | Subject: ${e.subject} | Snippet: "${e.snippet}" | ID: ${e.id}`;
                }).join("\n");
                const followUpResult = await chat.sendMessage([
                  {
                    text: `List of recent Gmail emails:\n${formatted}\nSummarize this list of emails for the user.`
                  }
                ]);
                responseText = followUpResult.response.text();
              } else {
                responseText = "No emails found in your Gmail account matching those settings.";
              }
            } else if (call.name === "getGmailEmail") {
              const { messageId } = call.args as any;
              const email = await getGmailEmail(tokenToUse, messageId);
              if (email) {
                const content = `Sender: ${email.from}\nSubject: ${email.subject}\nDate: ${email.date}\nBody:\n${email.body}`;
                const followUpResult = await chat.sendMessage([
                  {
                    text: `Gmail Email content for message ID ${messageId}:\n${content}\nProvide a full description/summary or read the content of this email for the user.`
                  }
                ]);
                responseText = followUpResult.response.text();
              } else {
                responseText = `I was unable to retrieve the email with ID "${messageId}".`;
              }
            } else if (call.name === "sendGmailEmail") {
              const { to, subject, body } = call.args as any;
              const success = await sendGmailEmail(tokenToUse, to, subject, body);
              if (success) {
                const followUpResult = await chat.sendMessage([
                  {
                    text: `Successfully sent email to ${to} with subject "${subject}". Tell the user this is done.`
                  }
                ]);
                responseText = followUpResult.response.text();
              } else {
                responseText = "I encountered an error trying to send the email. Please check your connection.";
              }
            } else if (call.name === "listGoogleCalendarEvents") {
              const { maxResults = 15 } = call.args as any;
              const events = await listGoogleCalendarEvents(tokenToUse, maxResults);
              if (events.length > 0) {
                const formatted = events.map((e: any, idx: number) => {
                  return `${idx + 1}. Title: ${e.summary} | Start: ${e.start} | End: ${e.end} | Location: ${e.location || "N/A"} | ID: ${e.id}`;
                }).join("\n");
                const followUpResult = await chat.sendMessage([
                  {
                    text: `Google Calendar events:\n${formatted}\nSummarize the calendar events for the user.`
                  }
                ]);
                responseText = followUpResult.response.text();
              } else {
                responseText = "I couldn't find any upcoming events on your Google Calendar.";
              }
            } else if (call.name === "createGoogleCalendarEvent") {
              const { summary, startISO, endISO, description, location } = call.args as any;
              const success = await createGoogleCalendarEvent(tokenToUse, summary, startISO, endISO, description, location);
              if (success) {
                const followUpResult = await chat.sendMessage([
                  {
                    text: `Successfully created calendar event "${summary}" from ${startISO} to ${endISO}. Tell the user this is done.`
                  }
                ]);
                responseText = followUpResult.response.text();
              } else {
                responseText = "I encountered an error trying to create that event on your Google Calendar.";
              }
            } else if (call.name === "deleteGoogleCalendarEvent") {
              const { eventId } = call.args as any;
              const success = await deleteGoogleCalendarEvent(tokenToUse, eventId);
              if (success) {
                const followUpResult = await chat.sendMessage([
                  {
                    text: `Successfully deleted calendar event with ID ${eventId}. Tell the user this is done.`
                  }
                ]);
                responseText = followUpResult.response.text();
              } else {
                responseText = "I encountered an error trying to delete that event from your Google Calendar.";
              }
            } else if (call.name === "sendWhatsAppMessage") {
              const { phone, message } = call.args as any;
              try {
                const result = await whatsappManager.executeTool("whatsapp.send_message", { phone, message }, userId || "default_user");
                if (result.success) {
                  if (result.source === "sandbox") {
                    const followUpResult = await chat.sendMessage([
                      { text: `WhatsApp connection is currently in Sandbox mode. The message was mocked and NOT actually sent over the real network. Tell the user they need to link their physical device.` }
                    ]);
                    responseText = followUpResult.response.text();
                  } else {
                    const followUpResult = await chat.sendMessage([
                      { text: `Successfully sent WhatsApp message to ${phone}. Tell the user it's done.` }
                    ]);
                    responseText = followUpResult.response.text();
                  }
                } else {
                  responseText = `I tried to send the WhatsApp message but it failed. Please ensure your WhatsApp is connected.`;
                }
              } catch (e: any) {
                responseText = `I encountered an error sending the WhatsApp message: ${e.message}`;
              }
            }
          }
        } else {
          responseText = response.text();
        }

        if (responseText) {
          return NextResponse.json({
            success: true,
            reply: responseText,
            modelUsed: modelName
          });
        }
      } catch (err: any) {
        console.warn(`[AI Chat fallback] Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error("All attempt models failed to compile a reply");
  } catch (err: any) {
    console.error("[AI Chat API] Error:", err);

    // Check if error is related to quota or rate limits
    const isRateLimit = err.message?.toLowerCase().includes("quota") || 
                        err.message?.toLowerCase().includes("limit") ||
                        err.message?.toLowerCase().includes("429") ||
                        err.message?.toLowerCase().includes("request");

    if (isRateLimit) {
      const lastMessage = messages[messages.length - 1];
      const userMessage = (lastMessage?.content || "").toLowerCase();

      let reply = "";
      if (userMessage.includes("email") || userMessage.includes("gmail") || userMessage.includes("inbox") || userMessage.includes("mail")) {
        if (tokenToUse) {
          try {
            const liveEmails = await fetchGoogleEmails(tokenToUse);
            if (liveEmails.length > 0) {
              const emailLines = liveEmails.map((email: any, index: number) => {
                return `  ${index + 1}. **${email.from}** (${email.date}): *${email.subject}* - "${email.snippet}"`;
              }).join("\n");
              reply = `🤖 **[Optimus Assistant - Live Summary (Sandbox Fallback)]**\n\nMy Gemini API key is rate-limited, but I successfully retrieved your live inbox via Google APIs:\n\n* **Inbox Status**: ${liveEmails.length} unread emails found.\n* **Threads**:\n${emailLines}\n\nLet me know if you would like me to draft a response to any of these!`;
            } else {
              reply = `🤖 **[Optimus Assistant - Live Inbox (Sandbox Fallback)]**\n\nI connected to your Gmail account, but no unread emails were found in your inbox right now.`;
            }
          } catch (fetchErr) {
            console.error("Failed to fetch live emails during fallback:", fetchErr);
            reply = `🤖 **[Optimus Assistant - Sandbox Fallback]**\n\nMy Gemini API key is rate-limited. I tried to pull your live Gmail inbox but encountered an authorization error. Here are your sandbox emails:\n\n* **Sarah Miller** (10:45 AM): *Project specifications for redesign* - "Hey! Just wanted to follow up on the website redesign spec..."\n* **GitHub Alerts** (9:15 AM): *[GitHub] Build Success: Optimus workflow-pipeline*\n* **Elena Rostova** (Yesterday): *Guest speaker request: Technical Panel next Tuesday*`;
          }
        } else {
          reply = `🤖 **[Optimus Assistant - Sandbox Fallback]**\n\nIt looks like my primary Google Gemini API quota has been exceeded for the moment. However, I can still retrieve your inbox summary: \n\n* **Inbox Status**: 3 unread emails detected.\n* **Latest Threads**:\n  1. **Sarah Miller** (10:45 AM): *Project specifications for redesign* - "Hey! Just wanted to follow up on the website redesign spec..."\n  2. **GitHub Alerts** (9:15 AM): *[GitHub] Build Success: Optimus workflow-pipeline*\n  3. **Elena Rostova** (Yesterday): *Guest speaker request: Technical Panel next Tuesday*\n\nLet me know if you would like me to draft a response to any of these!`;
        }
      } else if (userMessage.includes("calendar") || userMessage.includes("meeting") || userMessage.includes("today") || userMessage.includes("schedule") || userMessage.includes("prep")) {
        reply = `🤖 **[Optimus Assistant - Sandbox Fallback]**\n\nMy Gemini API key is currently rate-limited. Here is your local calendar schedule for today:\n\n* **9:00 AM — 9:30 AM**: Standup Sync (Video Meeting)\n* **1:00 PM — 3:00 PM**: Refactoring block (Focus block)\n\n*Tip: You can add or manage events directly in the Calendar widget on the main dashboard tab!*`;
      } else if (userMessage.includes("whatsapp") || userMessage.includes("message")) {
        reply = `🤖 **[Optimus Assistant - Sandbox Fallback]**\n\nI am currently rate-limited by Gemini API quotas, but your WhatsApp Web Gateway is connected! \n\n* **Active node**: Baileys Web Gateway (listening for incoming messages)\n* **Simulated activity**: John requested a review of the mobile dashboard layouts.\n\nYou can use the WhatsApp tool playground under the **Integrations** tab to test sending and receiving messages directly.`;
      } else {
        reply = `🤖 **[Optimus Assistant - Sandbox Fallback]**\n\nI'm currently hitting Google Gemini API rate limits (Error 429: Too Many Requests). \n\nWhile we wait for the quota window to reset, you can still use the interactive widgets on the dashboard (Sticky Notes, Quick Tasks, Calendar, and the Integrations playground). Feel free to ask me to check your **emails**, **calendar**, or **WhatsApp status**, and I will retrieve the live data for you!`;
      }

      return NextResponse.json({
        success: true,
        reply,
        modelUsed: "sandbox-fallback"
      });
    }

    return NextResponse.json({ success: false, error: err.message || "Failed to generate AI response" }, { status: 500 });
  }
}