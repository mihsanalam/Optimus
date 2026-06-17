import { NextResponse } from "next/server";
import { fetchGmailData, fetchSlackData, fetchWhatsAppData, normalizeIntelligenceData } from "@/lib/connectors";
import { invokeGeminiAI } from "@/lib/ai";
import { insforge } from "@/lib/insforge";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }

    const rawIntelligenceData = [];
    
    // Fetch from connected platforms synchronously
    const [gmailData, slackData, whatsappData] = await Promise.all([
      fetchGmailData(userId),
      fetchSlackData(userId),
      fetchWhatsAppData(userId)
    ]);

    if (gmailData) rawIntelligenceData.push(gmailData);
    if (slackData) rawIntelligenceData.push(slackData);
    if (whatsappData) rawIntelligenceData.push(whatsappData);

    if (rawIntelligenceData.length === 0) {
      return NextResponse.json({ success: false, error: "No connected apps or no unread data found." }, { status: 400 });
    }

    // Normalize Data
    const unifiedArray = normalizeIntelligenceData(rawIntelligenceData);
    const unifiedPayload = JSON.stringify(unifiedArray);

    // Call Gemini AI
    const generatedBriefing = await invokeGeminiAI(unifiedPayload);

    // Save to InsForge Database
    const { error: dbError } = await insforge.database
      .from("briefings_history")
      .insert({
        user_id: userId,
        trigger_type: "manual",
        data: generatedBriefing
      });

    if (dbError) {
      console.error("[Manual Generation] Failed to save briefing to DB:", dbError);
    }

    return NextResponse.json({ success: true, data: generatedBriefing });
  } catch (error: any) {
    console.error("[Manual Generation] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Unknown error occurred" }, { status: 500 });
  }
}
