import { NextResponse } from "next/server";
import { sendReplyTask } from "@/trigger/replies";

export async function POST(request: Request) {
  try {
    const { userId, app, text } = await request.json();

    if (!text || !app) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (app, text)" },
        { status: 400 }
      );
    }

    // Trigger the background job using trigger.dev
    const result = await sendReplyTask.trigger({
      userId: userId || "anonymous",
      app,
      text
    });

    return NextResponse.json({
      success: true,
      triggerId: result.id,
      message: `Reply task queued for ${app}`
    });
  } catch (err: any) {
    console.error("[Optimus Reply API] Error queuing reply task:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to trigger reply task" },
      { status: 500 }
    );
  }
}
