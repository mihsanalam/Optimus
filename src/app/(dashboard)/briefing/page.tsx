"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  Plus,
  RefreshCw,
  Mail,
  MessageSquare,
  Loader2,
  Calendar,
  Clock,
  ChevronRight,
  Bot,
  CheckCircle2
} from "lucide-react";

export default function BriefingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [briefings, setBriefings] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [cronRunning, setCronRunning] = useState(false);
  
  // Create schedule state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: "",
    description: "",
    selectedApps: [] as string[],
    selectedCategories: [] as string[],
    scheduledTime: "08:30",
    frequency: "daily",
    priorityLevel: "High"
  });

  const [savingSchedule, setSavingSchedule] = useState(false);

  // Fetch briefings and schedules from DB
  const fetchData = async () => {
    setBriefingLoading(true);
    try {
      // 1. Fetch generated briefings list
      const resBriefings = await fetch("/api/briefing/list");
      const dataBriefings = await resBriefings.json();

      // 2. Fetch briefing schedules
      const resSchedules = await fetch("/api/briefing/schedules");
      const dataSchedules = await resSchedules.json();

      if (dataBriefings.success) {
        const fetchedBriefings = dataBriefings.briefings || [];
        setBriefings(fetchedBriefings);

        // AUTO-GENERATE if the DB is empty — so the page never shows blank
        if (fetchedBriefings.length === 0) {
          setBriefingLoading(true);
          try {
            const genRes = await fetch("/api/briefing/quick-generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user?.id || null,
                gmailAccessToken: typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null,
                gmailRefreshToken: typeof window !== "undefined" ? localStorage.getItem("gmail_refresh_token") : null
              })
            });
            const genData = await genRes.json();
            if (genData.success && genData.briefing) {
              setBriefings([genData.briefing]);
            }
          } catch (autoGenErr) {
            console.warn("[Briefing] Auto-generate failed:", autoGenErr);
          }
        }
      }
      if (dataSchedules.success) {
        setSchedules(dataSchedules.schedules);
      }
    } catch (err) {
      console.error("Error fetching briefing logs:", err);
    } finally {
      setBriefingLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Regenerate briefing now using quick-generate
  const runCronPoll = async () => {
    setCronRunning(true);
    try {
      const res = await fetch("/api/briefing/quick-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || null,
          gmailAccessToken: typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null,
          gmailRefreshToken: typeof window !== "undefined" ? localStorage.getItem("gmail_refresh_token") : null
        })
      });
      const data = await res.json();
      if (data.success && data.briefing) {
        setBriefings(prev => [data.briefing, ...prev]);
      } else {
        alert("Regenerate failed: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error regenerating briefing: " + err.message);
    } finally {
      setCronRunning(false);
    }
  };

  // Check app connection from localStorage
  const getAppConnectionStatus = (app: string) => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem("connected_integrations");
      if (saved) {
        const parsed = JSON.parse(saved);
        return !!parsed[app.toLowerCase()];
      }
    } catch (e) {}
    return app.toLowerCase() === "gmail" || app.toLowerCase() === "slack";
  };

  // Submit new schedule
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.name || newSchedule.selectedApps.length === 0 || newSchedule.selectedCategories.length === 0) {
      alert("Please fill in the name and select at least one app and category.");
      return;
    }

    setSavingSchedule(true);
    try {
      const res = await fetch("/api/briefing/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSchedule.name,
          description: newSchedule.description,
          selected_apps: newSchedule.selectedApps,
          selected_categories: newSchedule.selectedCategories,
          scheduled_time: newSchedule.scheduledTime,
          frequency: newSchedule.frequency,
          priority_level: newSchedule.priorityLevel,
          user_id: user?.id || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsCreateOpen(false);
        setNewSchedule({
          name: "",
          description: "",
          selectedApps: [],
          selectedCategories: [],
          scheduledTime: "08:30",
          frequency: "daily",
          priorityLevel: "High"
        });
        // Wait and refresh
        setTimeout(fetchData, 1000);
      } else {
        alert("Failed to save schedule: " + data.error);
      }
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSavingSchedule(false);
    }
  };

  // App logo mapping
  const renderAppIcon = (app: string) => {
    switch (app.toLowerCase()) {
      case "gmail":
        return <Mail className="w-3.5 h-3.5 text-red-500" />;
      case "whatsapp":
        return (
          <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        );
      case "slack":
        return (
          <svg className="w-3.5 h-3.5 text-pink-600 dark:text-pink-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.824a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.824 5.043a2.528 2.528 0 0 1 2.52-2.522 2.528 2.528 0 0 1 2.522 2.522v2.52h-2.522a2.528 2.528 0 0 1-2.52-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.782a2.528 2.528 0 0 1-2.522-2.522V8.824a2.528 2.528 0 0 1 2.522-2.52h5.042zm10.134 3.796a2.528 2.528 0 0 1 2.522-2.522 2.528 2.528 0 0 1 2.52 2.522v2.52h-2.52a2.528 2.528 0 0 1-2.522-2.52zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.042zm-3.781 10.134a2.528 2.528 0 0 1-2.52 2.522 2.528 2.528 0 0 1-2.522-2.522v-2.52h2.522a2.528 2.528 0 0 1 2.52 2.52zm0-1.262a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.522h5.043a2.528 2.528 0 0 1 2.522 2.522v5.043a2.528 2.528 0 0 1-2.522 2.52h-5.043z" />
          </svg>
        );
      case "outlook":
        return <Mail className="w-3.5 h-3.5 text-blue-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  // Top/Most Important Briefing Card
  const topBriefing = briefings[0] || null;

  // Aggregate category counts across latest briefings
  const getCategoryCountAndSummary = (categoryName: string) => {
    if (!topBriefing || !topBriefing.categories_data) {
      return { count: 0, summary: "No data available." };
    }
    const match = Object.keys(topBriefing.categories_data).find(
      (k) => k.toLowerCase() === categoryName.toLowerCase()
    );
    if (match && topBriefing.categories_data[match]) {
      return {
        count: topBriefing.categories_data[match].count || 0,
        summary: topBriefing.categories_data[match].summary || "No active notifications."
      };
    }
    return { count: 0, summary: "No notifications found." };
  };

  return (
    <div className="w-full space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Intelligence Briefing
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Daily digests generated from all your connected platforms.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={runCronPoll}
            disabled={cronRunning}
            className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full text-sm font-semibold transition-all text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 shadow-sm"
          >
            {cronRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Regenerate
          </button>
          
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-full text-sm font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Custom Briefing
          </button>
        </div>
      </div>

      {briefingLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#7c3aed]" />
          <p className="text-xs text-zinc-500">Compiling database summaries and schedules...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* COLUMN 1 - Left */}
          <div className="xl:col-span-5 space-y-6 flex flex-col">
            {/* TODAY'S BRIEFING */}
            {topBriefing ? (
              <div className="bg-[#f5f3ff] dark:bg-purple-950/20 border border-[#ede9fe] dark:border-purple-500/10 rounded-[2rem] p-7 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#7c3aed] dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
                    <div className="p-1.5 bg-[#7c3aed] text-white rounded-lg">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    Today's Briefing
                  </div>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {new Date(topBriefing.created_at).toLocaleDateString([], {month: 'short', day: 'numeric'})}, {new Date(topBriefing.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-snug">
                    {topBriefing.title}
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3 leading-relaxed">
                    {topBriefing.summary}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#f5f3ff] dark:bg-purple-950/20 border border-[#ede9fe] dark:border-purple-500/10 rounded-[2rem] p-7 text-center">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">No briefing available.</p>
              </div>
            )}

            {/* HIGHLIGHTS FEED */}
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-7 flex flex-col flex-1 min-h-[400px]">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-5">Highlights Feed</h3>
              <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                {(() => {
                  if (!topBriefing || !topBriefing.categories_data) return null;
                  const allItems: any[] = [];
                  const seenKeys = new Set<string>();
                  
                  // Extract items in priority order: Messages, Email, Mentions, Tasks, Follow-Ups
                  const order = ["Messages", "Email", "Mentions", "Tasks", "Follow-Ups"];
                  for (const catName of order) {
                    const cat = topBriefing.categories_data[catName];
                    if (cat && Array.isArray(cat.items)) {
                      for (const item of cat.items) {
                        const key = `${item.app || 'gmail'}-${item.sender || ''}-${item.title || item.subject || ''}`;
                        if (!seenKeys.has(key)) {
                          seenKeys.add(key);
                          allItems.push(item);
                        }
                      }
                    }
                  }
                  
                  const highlights = allItems.slice(0, 5);
                  if (highlights.length === 0) {
                    return <p className="text-sm text-zinc-500 text-center py-8">No highlights available for today.</p>;
                  }
                  
                  return highlights.map((item: any, idx: number) => {
                    const app = item.app || 'gmail';
                    const title = item.subject || item.title || item.name || "Highlight";
                    const sender = item.sender || item.author || item.source || app;
                    const snippet = item.snippet || item.content || item.summary || "";
                    const timeStr = item.time || item.timestamp || "Today";
                    
                    return (
                      <div key={idx} className="flex gap-4 group">
                        <div className="shrink-0 pt-0.5 relative">
                           <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 relative overflow-hidden">
                             {app === "whatsapp" ? (
                               <div className="w-full h-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                 </svg>
                               </div>
                             ) : app === "gmail" || app === "outlook" ? (
                               <div className="w-full h-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500">
                                 <Mail className="w-5 h-5" />
                               </div>
                             ) : (
                               <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(sender)}&background=random&color=random`} alt={sender} className="w-full h-full object-cover" />
                             )}
                           </div>
                           <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm">
                             {renderAppIcon(app)}
                           </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">{title}</h4>
                            <span className="text-xs font-medium text-zinc-500 shrink-0">{timeStr}</span>
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate mt-0.5">{sender}</p>
                          <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">{snippet}</p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* COLUMN 2 - Middle */}
          <div className="xl:col-span-4 space-y-6 flex flex-col">
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-7 flex-1">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category Analytics</h3>
              <p className="text-xs text-zinc-500 mb-6 mt-1">Explore sections in detail</p>
              
              <div className="space-y-4">
                {[
                  { key: "Email", icon: <Mail className="w-4 h-4 text-[#3b82f6]" />, bg: "bg-[#eff6ff] dark:bg-blue-900/10", border: "border-[#bfdbfe] dark:border-blue-800/30", text: "text-[#1e3a8a] dark:text-blue-100", highlight: "bg-blue-100 text-blue-700" },
                  { key: "Messages", icon: <MessageSquare className="w-4 h-4 text-[#10b981]" />, bg: "bg-[#ecfdf5] dark:bg-emerald-900/10", border: "border-[#a7f3d0] dark:border-emerald-800/30", text: "text-[#064e3b] dark:text-emerald-100", highlight: "bg-emerald-100 text-emerald-700" },
                  { key: "Mentions", icon: <Bot className="w-4 h-4 text-[#a855f7]" />, bg: "bg-[#f5f3ff] dark:bg-purple-900/10", border: "border-[#ddd6fe] dark:border-purple-800/30", text: "text-[#4c1d95] dark:text-purple-100", highlight: "bg-purple-100 text-purple-700" },
                  { key: "Tasks", icon: <CheckCircle2 className="w-4 h-4 text-[#f59e0b]" />, bg: "bg-[#fffbeb] dark:bg-amber-900/10", border: "border-[#fde68a] dark:border-amber-800/30", text: "text-[#78350f] dark:text-amber-100", highlight: "bg-amber-100 text-amber-700" },
                  { key: "Follow-Ups", icon: <RefreshCw className="w-4 h-4 text-[#ef4444]" />, bg: "bg-[#fef2f2] dark:bg-red-900/10", border: "border-[#fecaca] dark:border-red-800/30", text: "text-[#7f1d1d] dark:text-red-100", highlight: "bg-red-100 text-red-700" }
                ].map((catItem) => {
                  const data = getCategoryCountAndSummary(catItem.key);
                  const isClickable = topBriefing && data.count > 0;
                  
                  return (
                    <div
                      key={catItem.key}
                      onClick={() => {
                        if (isClickable) {
                          router.push(`/briefing/${topBriefing.id}?category=${catItem.key}`);
                        }
                      }}
                      className={`p-5 rounded-[1.25rem] border transition-all ${catItem.bg} ${catItem.border} ${isClickable ? "cursor-pointer hover:shadow-md" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-zinc-800/50 rounded-xl shadow-sm border border-black/5 dark:border-white/5">
                            {catItem.icon}
                          </div>
                          <span className={`font-bold text-sm ${catItem.text}`}>{catItem.key}</span>
                        </div>
                        {data.count > 0 && (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${catItem.highlight} bg-opacity-50`}>
                            {data.count}
                          </span>
                        )}
                      </div>
                      {data.count > 0 ? (
                        <p className={`text-xs opacity-90 line-clamp-2 leading-relaxed ${catItem.text}`}>{data.summary}</p>
                      ) : (
                        <p className={`text-xs opacity-60 ${catItem.text}`}>No updates</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* COLUMN 3 - Right */}
          <div className="xl:col-span-3 space-y-6 flex flex-col">
            {/* CUSTOM SCHEDULES */}
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-7">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Custom Schedules</h3>
                <button onClick={() => setIsCreateOpen(true)} className="text-[#7c3aed] hover:text-[#6d28d9] dark:text-purple-400 p-1">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-zinc-500 mb-5">Automated briefing timing</p>
              
              <div className="space-y-4">
                {schedules.length > 0 ? schedules.map((sched) => (
                  <div key={sched.id} className="p-4 rounded-[1.25rem] border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/30">
                    <div className="p-2.5 bg-pink-100 dark:bg-pink-900/20 text-pink-500 rounded-xl">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">{sched.name}</h4>
                      <p className="text-xs text-zinc-500 mt-1">{sched.frequency} @ {sched.scheduled_time}</p>
                    </div>
                  </div>
                )) : (
                  <div className="p-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center">
                    <p className="text-xs text-zinc-500">No custom schedules created yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* PAST BRIEFINGS */}
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-7 flex flex-col flex-1 min-h-[300px]">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-5">Past Briefings</h3>
              
              <div className="space-y-3 flex-1 overflow-y-auto">
                {briefings.length > 1 ? briefings.slice(1).map((b) => (
                  <Link key={b.id} href={`/briefing/${b.id}`} className="p-4 rounded-[1.25rem] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group hover:border-purple-300 dark:hover:border-purple-500/50 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all cursor-pointer bg-zinc-50 dark:bg-zinc-900/20">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 rounded-xl group-hover:text-purple-500 group-hover:border-purple-200">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">{b.title || "Daily Briefing"}</h4>
                        <p className="text-xs text-zinc-500 mt-1">{new Date(b.created_at).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-500 shrink-0" />
                  </Link>
                )) : (
                  <div className="p-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center">
                    <p className="text-xs text-zinc-500">No past briefings recorded.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM BRIEFING DIALOG */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 pb-4">
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                Schedule Custom Briefing
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white text-xs cursor-pointer font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-405 block">
                  Briefing Profile Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Operations Digest"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-pink-500/50 rounded-xl py-3 px-4 text-xs text-zinc-800 dark:text-white outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-405 block">
                  Primary Goal / Target Description
                </label>
                <textarea
                  rows={2}
                  placeholder="What should this briefing focus on? e.g. Track redesign feedback deadlines"
                  value={newSchedule.description}
                  onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-pink-500/50 rounded-xl p-3.5 text-xs text-zinc-800 dark:text-white outline-none resize-none"
                />
              </div>

              {/* Apps and Categories */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-405 block">
                    Source Platforms
                  </label>
                  <div className="space-y-2 bg-zinc-50 dark:bg-zinc-955 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-850">
                    {["Gmail", "WhatsApp", "Slack", "Outlook"].map((app) => {
                      const isConnected = getAppConnectionStatus(app);
                      return (
                        <label key={app} className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newSchedule.selectedApps.includes(app)}
                            onChange={(e) => {
                              const apps = e.target.checked
                                ? [...newSchedule.selectedApps, app]
                                : newSchedule.selectedApps.filter((a) => a !== app);
                              setNewSchedule({ ...newSchedule, selectedApps: apps });
                            }}
                            className="rounded border-zinc-300 text-pink-500 focus:ring-pink-500 w-4 h-4 cursor-pointer"
                          />
                          <span>{app}</span>
                          {!isConnected && (
                            <span className="text-[8px] uppercase tracking-wider text-amber-500 dark:text-amber-450 border border-amber-500/10 px-1 rounded">
                              Simulated
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-405 block">
                    Focus Categories
                  </label>
                  <div className="space-y-2 bg-zinc-50 dark:bg-zinc-955 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-850">
                    {["Email", "Messages", "Mentions", "Tasks", "Follow-ups"].map((cat) => (
                      <label key={cat} className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newSchedule.selectedCategories.includes(cat)}
                          onChange={(e) => {
                            const cats = e.target.checked
                              ? [...newSchedule.selectedCategories, cat]
                              : newSchedule.selectedCategories.filter((c) => c !== cat);
                            setNewSchedule({ ...newSchedule, selectedCategories: cats });
                          }}
                          className="rounded border-zinc-300 text-pink-500 focus:ring-pink-500 w-4 h-4 cursor-pointer"
                        />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Time, Frequency, Priority */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-405 block">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    value={newSchedule.scheduledTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, scheduledTime: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-pink-500/50 rounded-xl py-2.5 px-3 text-xs text-zinc-800 dark:text-white outline-none cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-405 block">
                    Frequency
                  </label>
                  <select
                    value={newSchedule.frequency}
                    onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-955 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-pink-500/50 rounded-xl py-2.5 px-3 text-xs text-zinc-800 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-405 block">
                    Priority Level
                  </label>
                  <select
                    value={newSchedule.priorityLevel}
                    onChange={(e) => setNewSchedule({ ...newSchedule, priorityLevel: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-955 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-pink-500/50 rounded-xl py-2.5 px-3 text-xs text-zinc-800 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSchedule}
                className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-500/10 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingSchedule && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Establish Custom Schedule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
