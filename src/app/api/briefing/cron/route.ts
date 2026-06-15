import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: Request) {
  return handleCron();
}

export async function POST(request: Request) {
  return handleCron();
}

async function handleCron() {
  try {
    const now = new Date();
    // 15-minute window from now
    const fifteenMinsLater = new Date(now.getTime() + 15 * 60 * 1000);

    // Fetch schedules that are due (next_run <= fifteenMinsLater)
    const { data: dueSchedules, error } = await insforge.database
      .from("briefing_schedules")
      .select("*")
      .lte("next_run", fifteenMinsLater.toISOString());

    if (error) {
      console.error("[Briefing Cron] DB query error:", error);
      throw error;
    }

    if (!dueSchedules || dueSchedules.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No schedules due in this 15-minute window.", 
        triggeredCount: 0 
      });
    }

    const processedIds: string[] = [];

    // Trigger processing logic for each due briefing schedule
    for (const schedule of dueSchedules) {
      try {
        // Resolve target API URL
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const host = process.env.VERCEL_URL || "localhost:3000";
        const processUrl = `${protocol}://${host}/api/briefing/process`;
        
        console.log(`[Briefing Cron] Triggering process for schedule ${schedule.id} at ${processUrl}`);
        
        // Execute background call
        fetch(processUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduleId: schedule.id })
        }).catch(err => {
          console.error(`[Briefing Cron] Async fetch error for ${schedule.id}:`, err);
        });

        processedIds.push(schedule.id);
      } catch (err) {
        console.error(`[Briefing Cron] Failed to enqueue schedule ${schedule.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Triggered ${processedIds.length} scheduled briefings.`,
      processedIds
    });

  } catch (err: any) {
    console.error("[Briefing Cron API] CRON job failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
