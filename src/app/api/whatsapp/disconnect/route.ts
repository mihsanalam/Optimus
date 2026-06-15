import { NextResponse } from "next/server";
import { whatsappManager } from "@/lib/whatsappManager";

export async function POST() {
  try {
    await whatsappManager.disconnect();
    return NextResponse.json({ success: true, status: "disconnected" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to disconnect" },
      { status: 500 }
    );
  }
}
