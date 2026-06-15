import { NextResponse } from "next/server";
import { whatsappManager } from "@/lib/whatsappManager";

export async function GET() {
  try {
    const session = whatsappManager.getSession();
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
