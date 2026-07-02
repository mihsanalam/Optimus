import { logger, task, wait } from "@trigger.dev/sdk/v3";

export const sendReplyTask = task({
  id: "send-reply-job",
  maxDuration: 60, 
  run: async (payload: { userId: string, app: string, text: string }, { ctx }) => {
    logger.log(`Starting reply task for ${payload.app}...`, { payload });
    
    // Simulate sending the message to the respective platform
    await wait.for({ seconds: 1 });
    
    if (payload.app === "gmail") {
      logger.log(`Sent email reply: "${payload.text}"`);
    } else if (payload.app === "whatsapp") {
      logger.log(`Sent WhatsApp reply: "${payload.text}"`);
    } else {
      logger.log(`Sent reply via ${payload.app}: "${payload.text}"`);
    }

    return {
      success: true,
      app: payload.app,
      message: `Reply sent successfully via ${payload.app}`
    };
  }
});
