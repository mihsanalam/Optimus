import { NextResponse } from "next/server";
import { whatsappManager } from "@/lib/whatsappManager";
import { getValidGmailToken, createGmailDraft } from "@/lib/gmailHelper";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform, recipient, message, userId, gmailAccessToken, gmailRefreshToken } = body;
    if (!platform || !recipient || !message) {
      return NextResponse.json({ success: false, error: "Missing required parameters (platform, recipient, message)" }, { status: 400 });
    }

    const cleanPlatform = platform.toLowerCase();
    
    if (cleanPlatform === "whatsapp") {
      // Dispatch via live baileys socket manager if active
      console.log(`[Send API] Routing direct WhatsApp message to: ${recipient}`);
      const result = await whatsappManager.executeTool("whatsapp.send_message", {
        recipient_phone: recipient,
        message: message
      }, userId || "default_user");
      return NextResponse.json({ success: true, source: "live-whatsapp", result });
    } else if (cleanPlatform === "gmail") {
      let emailRecipient = recipient;
      if (!emailRecipient.includes("@")) {
        const lowerRecipient = emailRecipient.toLowerCase().trim();
        if (lowerRecipient.includes("sarah")) {
          emailRecipient = "sarah.miller@example.com";
        } else if (lowerRecipient.includes("john")) {
          emailRecipient = "john.qa@example.com";
        } else if (lowerRecipient.includes("mihsan")) {
          emailRecipient = "mihsan.alam@example.com";
        } else {
          emailRecipient = `${lowerRecipient.replace(/\s+/g, ".")}@example.com`;
        }
      }

      try {
        // Resolve Gmail credentials
        const { accessToken } = await getValidGmailToken({
          gmailAccessToken,
          gmailRefreshToken,
          userId
        });

        if (accessToken) {
          console.log(`[Send API] Creating real Gmail draft to: ${emailRecipient}`);
          
          // Parse Subject line from generated message if available
          let subject = "Workspace Update";
          let bodyContent = message;
          
          const subjectMatch = message.match(/^Subject:\s*(.+)$/m);
          if (subjectMatch) {
            subject = subjectMatch[1].trim();
            bodyContent = message.replace(/^Subject:\s*(.+)$/m, "").trim();
          }

          const success = await createGmailDraft(accessToken, emailRecipient, subject, bodyContent);
          if (success) {
            return NextResponse.json({
              success: true,
              source: "gmail",
              message: `Successfully saved email to ${emailRecipient} as a draft in your Gmail account.`
            });
          }
        }
      } catch (err: any) {
        console.warn("[Briefing Send API] Real Gmail draft dispatch failed, falling back to sandbox:", err);
      }

      // Return sandbox dispatch confirmation for Gmail
      return NextResponse.json({
        success: true,
        source: "sandbox",
        message: `[Sandbox Mode] Successfully saved simulated email draft to ${emailRecipient}.`,
        details: {
          recipient: emailRecipient,
          timestamp: new Date().toISOString(),
          preview: message.slice(0, 100) + (message.length > 100 ? "..." : "")
        }
      });
    }

    // Return beautiful sandbox dispatch confirmation
    return NextResponse.json({
      success: true,
      source: cleanPlatform,
      message: `[Sandbox Mode] Successfully dispatched via simulated ${platform} client.`,
      details: {
        recipient,
        timestamp: new Date().toISOString(),
        preview: message.slice(0, 100) + (message.length > 100 ? "..." : "")
      }
    });

  } catch (err: any) {
    console.error("[Briefing Send API] Error in dispatcher:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
