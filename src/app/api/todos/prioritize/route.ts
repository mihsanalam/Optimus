import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";
import { prioritizeTasksWithAI } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    let query = insforge.database.from("todos").select("id, title").eq("completed", false);
    
    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.is("user_id", null);
    }
    
    const { data: tasks, error } = await query;
    
    if (error) {
      console.error("[Todos Prioritize API] Error fetching tasks:", error);
      throw error;
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ success: true, message: "No pending tasks to prioritize." });
    }

    // Call the AI Service
    const prioritizedData = await prioritizeTasksWithAI(tasks);

    if (!prioritizedData || prioritizedData.length === 0) {
      return NextResponse.json({ success: false, error: "Failed to prioritize tasks via AI." }, { status: 500 });
    }

    // Update tasks in the database
    for (const item of prioritizedData) {
      await insforge.database
        .from("todos")
        .update({
          ai_priority_score: item.ai_priority_score,
          ai_priority_reason: item.ai_priority_reason
        })
        .eq("id", item.id);
    }

    return NextResponse.json({ success: true, message: "Tasks prioritized successfully." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
