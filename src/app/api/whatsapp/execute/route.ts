import { NextResponse } from "next/server";
import { whatsappManager } from "@/lib/whatsappManager";

export async function POST(request: Request) {
  try {
    const { toolName, inputs } = await request.json();
    if (!toolName) {
      return NextResponse.json(
        { success: false, error: "Tool name is required" },
        { status: 400 }
      );
    }

    const output = await whatsappManager.executeTool(toolName, inputs);
    return NextResponse.json({
      success: true,
      output
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute tool" },
      { status: 500 }
    );
  }
}
