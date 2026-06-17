import { NextResponse } from "next/server";
import { whatsappManager } from "@/lib/whatsappManager";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || "default_user";
    await whatsappManager.disconnect(userId);
    return NextResponse.json({ success: true, status: "disconnected" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to disconnect" },
      { status: 500 }
    );
  }
}
