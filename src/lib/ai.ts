import { GoogleGenerativeAI } from "@google/generative-ai";

export async function invokeGeminiAI(unifiedPayload: string) {
  // Use the same API key as the existing chat module
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is required.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // We use gemini-2.5-flash as specified in your diagram and chat module
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const systemPrompt = `You are the Optimus AI Intelligence Engine. 
You will receive a JSON string containing recent, unread data from the user's connected apps (Gmail, Slack, WhatsApp, etc).
Your job is to analyze this data, summarize the most important points, and extract critical action items.

You MUST return the output as a strictly formatted JSON object with the exact following schema:
{
  "stats": {
    "importantCount": number,
    "followUpsCount": number
  },
  "todayBrief": [
    {
      "app": string (e.g. "gmail", "slack", "whatsapp"),
      "title": string (A short, 3-5 word summary),
      "summary": string (A 1-sentence explanation of what the user needs to know),
      "time": string (Must follow format exactly: "DD Month YYYY _ HH:MM AM/PM", e.g. "17 June 2026 _ 10:45 AM")
    }
  ],
  "priorityItems": [
    {
      "app": string,
      "title": string (Action-oriented, e.g. "Review Q3 Budget"),
      "priority": string (Must be exactly "Critical", "High", or "Medium"),
      "time": string (Must follow format exactly: "DD Month YYYY _ HH:MM AM/PM", e.g. "17 June 2026 _ 10:45 AM"),
      "description": string (A short 1-sentence explanation of why it is a priority and what to do)
    }
  ]
}

DO NOT wrap the response in markdown blocks like \`\`\`json. Return ONLY the raw JSON object.
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `DATA PAYLOAD:\n${unifiedPayload}` }] }],
      systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2 // Low temperature for consistent, analytical JSON formatting
      }
    });

    const responseText = result.response.text();
    // Parse the JSON safely
    const jsonOutput = JSON.parse(responseText.trim());
    return jsonOutput;
  } catch (error) {
    console.error("[AI Engine] Failed to invoke Gemini:", error);
    // Return a graceful fallback if Gemini fails or rate limits
    return {
      stats: { importantCount: 0, followUpsCount: 0 },
      todayBrief: [],
      priorityItems: []
    };
  }
}

export async function prioritizeTasksWithAI(tasks: any[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is required.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const systemPrompt = `You are the Optimus AI Task Prioritization Engine.
You will receive a JSON list of tasks.
Analyze each task's title and determine its Urgency and Impact.
Assign an ai_priority_score from 1 (lowest) to 10 (highest).
Assign a short 1-sentence ai_priority_reason explaining why.

You MUST return the output as a strictly formatted JSON array of objects:
[
  {
    "id": "task_id_here",
    "ai_priority_score": 8,
    "ai_priority_reason": "Explanation here"
  }
]
DO NOT wrap the response in markdown blocks like \`\`\`json. Return ONLY the raw JSON array.
`;

  let attempt = 0;
  while (attempt < 2) {
    try {
      const modelName = attempt === 0 ? "gemini-2.5-flash" : "gemini-2.5-pro";
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: JSON.stringify(tasks) }] }],
        systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });

      const responseText = result.response.text();
      return JSON.parse(responseText.trim());
    } catch (error: any) {
      console.error(`[AI Engine] Attempt ${attempt + 1} failed to prioritize tasks:`, error.message);
      attempt++;
      if (attempt >= 2) {
        return [];
      }
      // Wait for a second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return [];
}
