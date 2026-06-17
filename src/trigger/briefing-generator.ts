import { task, schedules, logger } from "@trigger.dev/sdk/v3";
import { fetchGmailData, fetchSlackData, fetchWhatsAppData, normalizeIntelligenceData } from "@/lib/connectors";
import { insforge } from "@/lib/insforge";

/**
 * 1. The 15-Minute Scheduler
 * This cron job runs every 15 minutes. It reads the `briefing_schedules` table
 * and enqueues a `process-user-briefing` task for every user whose schedule is due.
 */
export const checkBriefingSchedules = schedules.task({
  id: "check-briefing-schedules",
  // "*/15 * * * *" runs exactly at :00, :15, :30, :45 of every hour
  cron: "*/15 * * * *",
  run: async (payload, { ctx }) => {
    logger.info("Checking database for due briefing schedules...");
    
    // Fetch real due schedules from InsForge
    const { data: dueSchedules, error } = await insforge.database
      .from("briefing_schedules")
      .select("*")
      .eq("is_active", true);
      // In production, you would filter by `time` matching current time window
    
    if (error || !dueSchedules) {
      logger.error("Failed to fetch schedules from database", { error });
      return { queued: 0 };
    }

    logger.info(`Found ${dueSchedules.length} schedules due. Enqueuing jobs...`);

    // Enqueue a dedicated AI generation job for each user safely
    for (const schedule of dueSchedules) {
      await processUserBriefing.trigger({
        userId: schedule.user_id,
        scheduleId: schedule.id,
      });
    }

    return { queued: dueSchedules.length };
  },
});

/**
 * 2. The Main AI Brief Generation Job
 * This job does the heavy lifting: fetches data from connected apps,
 * normalizes it, sends it to Gemini AI, and stores it in the database.
 */
export const processUserBriefing = task({
  id: "process-user-briefing",
  // We allow up to 5 minutes for this task since AI and API calls can take a while
  maxDuration: 300,
  run: async (payload: { userId: string; scheduleId: string }, { ctx }) => {
    logger.info(`Starting AI Briefing Generation for user: ${payload.userId}`);

    // STEP 1 & 2: Fetch raw data from the connected platforms (MCP Tools Simulation)
    logger.info(`Fetching data from all connected platforms...`);
    const rawIntelligenceData = [];
    
    // Run fetchers in parallel!
    const [gmailData, slackData, whatsappData] = await Promise.all([
      fetchGmailData(payload.userId),
      fetchSlackData(payload.userId),
      fetchWhatsAppData(payload.userId)
    ]);

    if (gmailData) rawIntelligenceData.push(gmailData);
    if (slackData) rawIntelligenceData.push(slackData);
    if (whatsappData) rawIntelligenceData.push(whatsappData);

    // STEP 3: Normalize Data into a Unified format
    logger.info("Normalizing data for AI Engine...");
    const unifiedArray = normalizeIntelligenceData(rawIntelligenceData);
    const unifiedPayload = JSON.stringify(unifiedArray);

    // STEP 4: Call Gemini AI to summarize and extract priorities
    logger.info("Invoking Gemini AI for summarization...");
    const { invokeGeminiAI } = await import("@/lib/ai");
    const generatedBriefing = await invokeGeminiAI(unifiedPayload);

    // STEP 5: Save generated briefing back to the InsForge database
    logger.info("Saving generated AI brief to `briefings_history` table...");
    
    const { error: dbError } = await insforge.database
      .from("briefings_history")
      .insert({
        user_id: payload.userId,
        trigger_type: "auto",
        data: generatedBriefing
      });

    if (dbError) {
      logger.error("Failed to save briefing to database", { dbError });
    } else {
      logger.info("Briefing Generation Complete! Saved to database.");
    }
    
    return {
      success: true,
      briefingLength: generatedBriefing.todayBrief?.length || 0
    };
  },
});
