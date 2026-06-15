import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: Request) {
  try {
    const { data, error } = await insforge.database
      .from("generated_briefings")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("[Briefings List API] Error fetching briefings:", error);
      throw error;
    }
    
    return NextResponse.json({ success: true, briefings: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
