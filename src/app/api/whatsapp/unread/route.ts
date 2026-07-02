import { NextResponse } from "next/server";
import { whatsappManager } from "@/lib/whatsappManager";
import { insforge } from "@/lib/insforge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default_user";

    // Try to fetch live messages from the WhatsApp session
    const result = await whatsappManager.executeTool(
      "whatsapp.fetch_recent_messages",
      {},
      userId
    );

    if (result && result.messages && result.messages.length > 0) {
      // Format messages as briefing items
      const items = result.messages.map((msg: any, idx: number) => ({
        id: msg.id || `wa_${idx}`,
        app: "whatsapp",
        title: msg.from || "Unknown",
        sender: msg.from || "Unknown",
        description: msg.body || "",
        snippet: msg.body || "",
        time: msg.time
          ? new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Now",
        timestamp: msg.time || new Date().toISOString(),
        isGroup: msg.isGroup || false,
        groupName: msg.groupName || null,
        phone: msg.phone || null,
        unread: true,
        source: result.source || "sandbox",
      }));

      return NextResponse.json({
        success: true,
        count: items.length,
        source: result.source,
        messages: items,
      });
    }

    // Return empty but successful
    return NextResponse.json({
      success: true,
      count: 0,
      source: "live",
      messages: [],
    });
  } catch (err: any) {
    console.error("[WhatsApp Unread API] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
