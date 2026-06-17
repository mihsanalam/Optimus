import { NextResponse } from "next/server";
import { whatsappManager } from "@/lib/whatsappManager";

export async function POST(request: Request) {
  try {
    const { phoneNumber, userId } = await request.json();
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    const code = await whatsappManager.connect(phoneNumber, userId || "default_user");
    return NextResponse.json({
      success: true,
      pairingCode: code,
      status: "pairing"
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to initiate connection" },
      { status: 500 }
    );
  }
}
