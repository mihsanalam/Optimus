import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: Request) {
  try {
    const { data, error } = await insforge.database
      .from("briefing_schedules")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("[Schedules API] Error fetching schedules:", error);
      throw error;
    }
    return NextResponse.json({ success: true, schedules: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      selected_apps = [], 
      selected_categories = [], 
      scheduled_time, 
      frequency, 
      priority_level, 
      user_id 
    } = body;
    
    if (!name || !scheduled_time || !frequency || !priority_level) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Calculate next_run time
    const [hours, minutes] = scheduled_time.split(":").map(Number);
    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);
    if (nextRun <= now) {
      // If the scheduled time is already passed today, set next run to tomorrow
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const newSchedule = {
      user_id: user_id || null,
      name,
      description: description || "",
      selected_apps,
      selected_categories,
      scheduled_time,
      frequency,
      priority_level,
      next_run: nextRun.toISOString()
    };

    // Make sure we use an array for database insertion, as per AGENTS.md rule
    const { data, error } = await insforge.database
      .from("briefing_schedules")
      .insert([newSchedule])
      .select();

    if (error) {
      console.error("[Schedules API] Error creating schedule:", error);
      throw error;
    }

    // Trigger the briefing compiler immediately for this schedule so the user sees an immediate brief!
    if (data && data.length > 0) {
      const newSched = data[0];
      try {
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const host = process.env.VERCEL_URL || "localhost:3000";
        fetch(`${protocol}://${host}/api/briefing/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduleId: newSched.id })
        }).catch(err => console.error("[Schedules API] Async compile trigger err:", err));
      } catch (triggerErr) {
        console.error("[Schedules API] Trigger processor error:", triggerErr);
      }
    }
    
    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
