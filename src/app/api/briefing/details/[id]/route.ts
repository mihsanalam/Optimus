import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await insforge.database
      .from("generated_briefings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`[Briefing Detail API] Error fetching briefing details for ID ${id}:`, error);
      throw error;
    }

    if (!data) {
      return NextResponse.json({ success: false, error: "Briefing not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, briefing: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
