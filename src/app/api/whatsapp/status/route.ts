import { NextResponse } from "next/server";
import { whatsappManager } from "@/lib/whatsappManager";
import { insforge } from "@/lib/insforge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default_user";
    
    let session = whatsappManager.getSession(userId);
    
    // Auto-reconnect in the background if disconnected but credentials exist in database
    if (session.status === "disconnected") {
      try {
        const { data: dbUser } = await insforge.database
          .from("users")
          .select("whatsapp_credentials")
          .eq("id", userId)
          .maybeSingle();
          
        if (dbUser?.whatsapp_credentials) {
          // Trigger background reconnection
          whatsappManager.reconnect(userId);
          // Retrieve updated session status (will be "connecting")
          session = whatsappManager.getSession(userId);
        }
      } catch (dbErr) {
        console.error("[WhatsApp Status API] Error checking DB for reconnection:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      ...session
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve status" },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
