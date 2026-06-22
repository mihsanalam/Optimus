"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDashboardContext } from "@/context/DashboardContext";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AiAgentPage() {
  const { user } = useAuth();
  const { chatMessages, setChatMessages, customApiKey, setCustomApiKey, briefingData } = useDashboardContext();

  const [agentPrompt, setAgentPrompt] = useState(
    "You are Optimus, an advanced workflow assistant. Summarize communications and schedule actions."
  );
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [writePrompt, setWritePrompt] = useState("");
  const [writeFormat, setWriteFormat] = useState("email");
  const [writeTone, setWriteTone] = useState("professional");
  const [writeResult, setWriteResult] = useState("");
  const [writeLoading, setWriteLoading] = useState(false);

  // Writing Style States
  const [styleSamples, setStyleSamples] = useState("");
  const [styleProfile, setStyleProfile] = useState("");
  const [styleLoading, setStyleLoading] = useState(false);
  const [useCustomStyle, setUseCustomStyle] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("optimus_gemini_api_key");
    if (savedKey) {
      setCustomApiKey(savedKey);
    }
    const savedStyle = localStorage.getItem("optimus_style_profile");
    if (savedStyle) {
      setStyleProfile(savedStyle);
    }
  }, [setCustomApiKey]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const action = searchParams.get("action");
      if (action === "draft_social") {
        const topic = searchParams.get("topic") || "";
        const platform = searchParams.get("platform") || "LinkedIn";
        setWritePrompt(topic);
        setWriteFormat("post");
        toast.success(`Pre-filled social media draft topic for ${platform}: "${topic}"`);
        
        // Clean parameters from URL
        const url = new URL(window.location.href);
        url.searchParams.delete("action");
        url.searchParams.delete("topic");
        url.searchParams.delete("platform");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

  const saveCustomApiKey = (key: string) => {
    setCustomApiKey(key);
    if (key.trim()) {
      localStorage.setItem("optimus_gemini_api_key", key);
      toast.success("Gemini API key saved successfully!");
    } else {
      localStorage.removeItem("optimus_gemini_api_key");
      toast.info("Gemini API key cleared.");
    }
  };

  const sendChatMessage = async (text: string, contextOverride?: string) => {
    if (!text.trim() && !contextOverride) return;

    const displayMessage = { role: "user" as const, content: text };
    setChatMessages((prev) => [...prev, displayMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const messagesToSend = [...chatMessages, { role: "user" as const, content: contextOverride || text }];
      
      let finalSystemInstruction = agentPrompt;
      if (useCustomStyle && styleProfile) {
        finalSystemInstruction += `\n\nCRITICAL INSTRUCTION: When asked to draft emails, posts, or content on behalf of the user, you MUST adopt their exact writing style below:\n"${styleProfile}"`;
      }

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesToSend,
          systemInstruction: finalSystemInstruction,
          customApiKey: customApiKey,
          gmailAccessToken: typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null,
          gmailRefreshToken: typeof window !== "undefined" ? localStorage.getItem("gmail_refresh_token") : null,
          calendarEvents: typeof window !== "undefined" ? JSON.parse(localStorage.getItem("optimus_calendar_events") || "[]") : [],
          userId: user?.id || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setChatMessages((prev) => [...prev, { role: "assistant", content: `⚠️ Error: ${data.error || "Failed to generate response."}` }]);
      }
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Connection error. Please check your network and API key settings." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleWhatsOnToday = async () => {
    const briefSummaries = briefingData?.todayBrief?.map((item: any) => `- [${item.app.toUpperCase()}] ${item.title}: ${item.summary}`).join("\n") || "No platform updates compiled today.";
    const priorityItemsCount = briefingData?.stats?.priorityCount || 0;
    
    const promptText = "What's on today?";
    const contextPrompt = `Analyze today's dashboard state and write a personalized, daily overview greeting for the operator. Be concise, highly professional, encouraging, and highlight key focus areas.
    
    Here is the live dashboard telemetry context:
    1. Daily Brief Updates:
    ${briefSummaries}
    
    2. Operational Metrics:
    - AI Priority Alerts Detected: ${priorityItemsCount}
    
    Format the response with clean headers and bullet points. Mention which platforms have updates.`;

    await sendChatMessage(promptText, contextPrompt);
  };

  const handleQuickWrite = async () => {
    if (!writePrompt.trim()) return;
    setWriteLoading(true);
    setWriteResult("");
    try {
      const res = await fetch("/api/ai/quick-write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: writeFormat,
          prompt: writePrompt,
          tone: writeTone,
          customApiKey: customApiKey,
          styleProfile: useCustomStyle ? styleProfile : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setWriteResult(data.text);
      } else {
        setWriteResult(`⚠️ Generation failed: ${data.error}`);
      }
    } catch (err) {
      setWriteResult("⚠️ Connection error generating copy.");
    } finally {
      setWriteLoading(false);
    }
  };

  const handleAnalyzeStyle = async () => {
    if (!styleSamples.trim()) return;
    setStyleLoading(true);
    try {
      const res = await fetch("/api/ai/analyze-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samples: styleSamples, customApiKey })
      });
      const data = await res.json();
      if (data.success) {
        setStyleProfile(data.styleProfile);
        localStorage.setItem("optimus_style_profile", data.styleProfile);
        toast.success("Writing style analyzed and saved successfully!");
        setStyleSamples(""); // Clear textarea on success
      } else {
        toast.error(`Analysis failed: ${data.error}`);
      }
    } catch (err) {
      toast.error("Connection error while analyzing style.");
    } finally {
      setStyleLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: AI Chat Panel */}
      <div className="lg:col-span-8 flex flex-col h-[650px] bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 glow-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-4 mb-4 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-505 bg-indigo-550 animate-pulse" />
              Optimus AI Assistant
            </h3>
            <p className="text-[10px] text-zinc-500">Ask anything or request a summary</p>
          </div>
          <button
            onClick={handleWhatsOnToday}
            disabled={chatLoading}
            className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-650 text-white rounded-xl text-xs font-bold active-scale transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            What's on today?
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${msg.role === "user" ? "bg-indigo-500 text-white rounded-tr-none" : "bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-200 rounded-tl-none"}`}>
                <p className="font-bold text-[10px] opacity-60 mb-1">{msg.role === "user" ? "YOU" : "OPTIMUS ASSISTANT"}</p>
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl rounded-tl-none">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(chatInput); }} className="flex gap-2 shrink-0">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask your assistant anything..."
            className="flex-1 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button type="submit" disabled={chatLoading || !chatInput.trim()} className="px-4 py-3 bg-indigo-500 hover:bg-indigo-650 text-white font-bold rounded-xl text-xs active-scale disabled:opacity-50 transition-colors cursor-pointer shrink-0">
            Send
          </button>
        </form>
      </div>

      {/* Right Column: Quick Write Tool & Settings */}
      <div className="lg:col-span-4 space-y-8">
        {/* Quick Write Tool */}
        <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-5 glow-border">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Quick Write Tool</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Generate posts, emails or ideas instantly</p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Format</label>
                <select value={writeFormat} onChange={(e) => setWriteFormat(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-2.5 text-xs text-zinc-800 dark:text-white outline-none cursor-pointer">
                  <option value="email">Email</option>
                  <option value="post">Social Post</option>
                  <option value="ideas">Action Ideas</option>
                  <option value="general">Draft Text</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Tone</label>
                <select value={writeTone} onChange={(e) => setWriteTone(e.target.value)} disabled={useCustomStyle} className={`w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-2.5 text-xs text-zinc-800 dark:text-white outline-none cursor-pointer ${useCustomStyle ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="creative">Creative</option>
                </select>
              </div>
            </div>
            {styleProfile && (
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="useCustomStyle" 
                  checked={useCustomStyle} 
                  onChange={(e) => setUseCustomStyle(e.target.checked)} 
                  className="w-3.5 h-3.5 text-indigo-500 rounded border-zinc-300 dark:border-zinc-700 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="useCustomStyle" className="text-[10px] text-zinc-700 dark:text-zinc-300 font-bold cursor-pointer">
                  Write in my voice (Custom Style Profile)
                </label>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Topic / Description</label>
              <textarea rows={3} value={writePrompt} onChange={(e) => setWritePrompt(e.target.value)} placeholder="What should we write about? E.g., 'follow up with Mihsan about deployment'..." className="w-full bg-zinc-50 dark:bg-zinc-955 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-all resize-none" />
            </div>
            <button onClick={handleQuickWrite} disabled={writeLoading || !writePrompt.trim()} className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold active-scale transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5">
              {writeLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating...</> : <><Sparkles className="w-3.5 h-3.5" />Generate Copy</>}
            </button>
            {writeResult && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Output</label>
                  <button onClick={() => { navigator.clipboard.writeText(writeResult); alert("Copied to clipboard!"); }} className="text-[9px] text-indigo-500 hover:underline font-bold cursor-pointer">Copy Copy</button>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs text-zinc-800 dark:text-zinc-300 font-sans whitespace-pre-wrap max-h-[150px] overflow-y-auto">{writeResult}</div>
              </div>
            )}
          </div>
        </div>

        {/* Voice Studio (Writing Style Learner) */}
        <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-4 glow-border">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Voice Studio</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Teach Optimus to write exactly like you</p>
          </div>
          
          <div className="space-y-3">
            {!styleProfile ? (
              <>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Writing Samples</label>
                  <textarea rows={4} value={styleSamples} onChange={(e) => setStyleSamples(e.target.value)} placeholder="Paste 2-3 of your best emails or posts here..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 text-[11px] text-zinc-800 dark:text-zinc-300 outline-none resize-none" />
                </div>
                <button onClick={handleAnalyzeStyle} disabled={styleLoading || !styleSamples.trim()} className="w-full py-2 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold active-scale transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5">
                  {styleLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analyzing...</> : "Analyze My Style"}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Active Style Profile</label>
                    <button onClick={() => { setStyleProfile(""); localStorage.removeItem("optimus_style_profile"); }} className="text-[9px] text-red-500 hover:underline cursor-pointer">Reset</button>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-[10px] text-emerald-800 dark:text-emerald-300 font-sans whitespace-pre-wrap">{styleProfile}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant Settings & System Prompt */}
        <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-4 glow-border">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Assistant Parameters</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Customize AI behaviour & API keys</p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">System Persona</label>
              <textarea rows={2} value={agentPrompt} onChange={(e) => setAgentPrompt(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-indigo-500 rounded-xl p-2.5 text-[11px] text-zinc-800 dark:text-zinc-350 outline-none resize-none font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Custom Gemini API Key</label>
              <input type="password" value={customApiKey} onChange={(e) => saveCustomApiKey(e.target.value)} placeholder="Enter Gemini API key override..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 focus:border-indigo-500 rounded-xl p-2.5 text-[11px] text-zinc-800 dark:text-zinc-300 outline-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
