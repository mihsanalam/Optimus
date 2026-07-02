"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, Trash2, Loader2, Sparkles, Mail, MessageSquare, Briefcase, ChevronRight, Activity, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useDashboardContext } from "@/context/DashboardContext";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function AIAgentPage() {
  const { briefingData } = useDashboardContext();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic quick suggestions based on email and tasks context
  const quickSuggestions: string[] = React.useMemo(() => {
    if (!briefingData?.priorityItems || briefingData.priorityItems.length === 0) {
      return [
        "What are my meetings for today?",
        "Check my recent emails.",
        "Summarize my WhatsApp messages?",
        "Check my schedule for tomorrow."
      ];
    }
    
    const suggestions = briefingData.priorityItems.slice(0, 4).map((item: any) => {
      if (item.app === "gmail") {
        return `Draft a reply to ${item.sender || 'this email'} about "${item.title}"?`;
      } else if (item.app === "whatsapp") {
        return `Summarize WhatsApp messages from ${item.sender || 'recent chats'}?`;
      } else if (item.app === "calendar") {
        return `Review event: ${item.title}?`;
      }
      return `Handle task: ${item.title}?`;
    });
    
    return Array.from(new Set<string>(suggestions)).slice(0, 4);
  }, [briefingData]);

  // Load history from localStorage (valid for 1 day)
  useEffect(() => {
    const saved = localStorage.getItem("ai_agent_history");
    const savedDate = localStorage.getItem("ai_agent_history_date");
    const today = new Date().toDateString();
    
    if (saved && savedDate === today) {
      setMessages(JSON.parse(saved));
    } else {
      localStorage.removeItem("ai_agent_history");
      localStorage.removeItem("ai_agent_history_date");
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("ai_agent_history", JSON.stringify(messages));
      localStorage.setItem("ai_agent_history_date", new Date().toDateString());
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const startNewChat = () => {
    setMessages([]);
    localStorage.removeItem("ai_agent_history");
    localStorage.removeItem("ai_agent_history_date");
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const payloadMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      // Gather local context items (deduplicated)
      const localContext: any[] = [];
      const seenKeys = new Set<string>();
      if (briefingData?.priorityItems) {
        for (const item of briefingData.priorityItems) {
          const key = `${item.app || ''}-${item.title || ''}-${item.description || ''}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            localContext.push(item);
          }
        }
      }
      if (briefingData?.todayBrief) {
        for (const item of briefingData.todayBrief) {
          const key = `${item.app || ''}-${item.title || ''}-${item.summary || ''}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            localContext.push({
              app: item.app,
              title: item.title,
              description: item.summary,
              time: item.time
            });
          }
        }
      }

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          systemInstruction: "You are Optimus Intelligent Agent. Format your responses with markdown. Provide helpful data formatting.",
          gmailAccessToken: typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null,
          gmailRefreshToken: typeof window !== "undefined" ? localStorage.getItem("gmail_refresh_token") : null,
          localContext: localContext
        })
      });
      const data = await res.json();
      
      if (data.success) {
        const aiMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: aiMessageId, role: "assistant", content: "", isStreaming: true }]);
        
        let currentText = "";
        const fullText = data.reply;
        const chunkSize = 4;
        
        for (let i = 0; i < fullText.length; i += chunkSize) {
          currentText += fullText.slice(i, i + chunkSize);
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, content: currentText } : msg
          ));
          await new Promise(r => setTimeout(r, 10)); // tiny streaming delay
        }
        
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
        ));

      } else {
        alert("Failed to get AI response: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting AI agent.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderReferences = (content: string) => {
    const refs = [];
    if (content.toLowerCase().includes("gmail") || content.toLowerCase().includes("email")) {
      refs.push(
        <div key="gmail" className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md text-[10px] font-bold text-blue-600 dark:text-blue-400">
          <Mail className="w-3 h-3 text-red-500" /> Gmail
        </div>
      );
    }
    if (content.toLowerCase().includes("whatsapp") || content.toLowerCase().includes("message")) {
      refs.push(
        <div key="whatsapp" className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-md text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          <MessageSquare className="w-3 h-3 text-emerald-500" /> WhatsApp
        </div>
      );
    }
    if (content.toLowerCase().includes("calendar") || content.toLowerCase().includes("schedule")) {
      refs.push(
        <div key="calendar" className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-md text-[10px] font-bold text-yellow-600 dark:text-yellow-400">
          <Briefcase className="w-3 h-3 text-yellow-500" /> Calendar
        </div>
      );
    }

    if (refs.length === 0) return null;
    
    return (
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ref:</span>
        {refs}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] relative">
      {/* HEADER ACTION */}
      <div className="absolute top-0 right-0 z-20">
        <button 
          onClick={startNewChat}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-xs font-bold transition-colors shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
          New Chat
        </button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto pb-32 pt-2 scrollbar-none">
        {messages.length === 0 ? (
          <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn pt-8">
            {/* Recent Summary Card */}
            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">Recent Summary</h2>
                  <p className="text-xs text-zinc-500">Latest updates from your connected apps</p>
                </div>
              </div>
              
              <ul className="space-y-4">
                {briefingData?.priorityItems && briefingData.priorityItems.length > 0 ? (
                  briefingData.priorityItems.slice(0, 3).map((item: any, idx: number) => (
                    <li key={idx} className="flex gap-4">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.app === 'gmail' ? 'bg-red-500' : item.app === 'whatsapp' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">
                        <strong className="text-zinc-900 dark:text-white capitalize">{item.app}:</strong> {item.title || item.subject || "New notification"} - {item.snippet || item.summary || "Requires attention."}
                      </p>
                    </li>
                  ))
                ) : (
                  <li className="flex gap-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No active alerts or updates right now. All caught up!
                    </p>
                  </li>
                )}
              </ul>
            </div>

            {/* Quick Suggestions */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4 pl-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickSuggestions.map((sugg, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(sugg)}
                    className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-left hover:border-purple-300 dark:hover:border-purple-500/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors group shadow-sm flex justify-between items-center"
                  >
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-purple-700 dark:group-hover:text-purple-400">
                      {sugg}
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-purple-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2 ml-4">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">Optimus Intelligent Agent</span>
                    <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Connected to Gmail & WhatsApp</span>
                    </div>
                  </div>
                )}
                
                <div className={`
                  relative max-w-[85%] px-6 py-5
                  ${msg.role === "user" 
                    ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-[2rem] rounded-tr-sm shadow-md" 
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-[2rem] rounded-tl-sm shadow-sm"
                  }
                `}>
                  {msg.role === "user" ? (
                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert prose-zinc max-w-none 
                      prose-p:leading-relaxed prose-p:my-2 
                      prose-headings:font-bold prose-headings:my-4 
                      prose-a:text-purple-600 dark:prose-a:text-purple-400
                      prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md
                      prose-pre:bg-zinc-950 prose-pre:text-zinc-100 prose-pre:p-4 prose-pre:rounded-xl">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {msg.role === "assistant" && !msg.isStreaming && renderReferences(msg.content)}
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-purple-500 animate-pulse rounded" />
                  )}
                </div>

                {/* Post-Message Quick Actions */}
                {msg.role === "assistant" && !msg.isStreaming && (
                  <div className="mt-3 flex flex-wrap gap-2 ml-4">
                    {quickSuggestions.slice(0, 3).map((sugg, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(sugg)}
                        className="px-4 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 rounded-full text-xs font-bold transition-colors shadow-sm"
                      >
                        {sugg}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && !messages.find(m => m.isStreaming) && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2 ml-4">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">Optimus Intelligent Agent</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-6 py-4 rounded-[2rem] rounded-tl-sm shadow-sm flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  <span className="text-xs font-medium text-zinc-500">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* FIXED INPUT BOX */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-10 pb-6 px-4">
        <div className="max-w-4xl mx-auto relative group">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full p-2 shadow-lg shadow-black/5 group-focus-within:border-purple-400 dark:group-focus-within:border-purple-600 transition-colors"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI Agent to check alerts, draft emails, or search chat logs..."
              className="flex-1 bg-transparent px-4 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:hover:bg-purple-500 shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
