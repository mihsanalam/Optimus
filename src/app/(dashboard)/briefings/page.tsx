"use client";

import React, { useState } from "react";
import { useDashboardContext } from "@/context/DashboardContext";
import { RefreshCw, Calendar, FileText, Check, Star, Paperclip, Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function BriefingsPage() {
  const { user } = useAuth();
  const { briefingData, briefingLoading, refreshBriefing, getAppLabel } = useDashboardContext();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateNow = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to generate a briefing.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const res = await fetch("/api/briefings/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate briefing");
      }
      
      toast.success("Briefing generated successfully!");
      // Refresh context to pull the newly saved DB record
      await refreshBriefing();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate briefing");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Briefings Control Section */}
      <div className="flex flex-col gap-4 bg-white/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 backdrop-blur-md transition-all">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight sm:text-2xl flex items-center gap-2">
              Briefings <span className="text-yellow-500">✨</span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Generate smart, actionable briefings from your connected apps.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">Auto (Every Morning 8:00 AM)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-7 h-4 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-zinc-600 peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 bg-zinc-50/50 dark:bg-zinc-800/30 p-2 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 mt-2">
          <div className="flex items-center gap-2 flex-1 w-full overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 ml-2 whitespace-nowrap shrink-0">Preset:</span>
            <select className="bg-white dark:bg-zinc-900 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 outline-none cursor-pointer shrink-0">
              <option>Daily Briefing</option>
              <option>Last 6 Hours</option>
              <option>This Week</option>
            </select>
            
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1 shrink-0" />
            
            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 whitespace-nowrap shrink-0">Custom Range:</span>
            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 shrink-0">
              <Calendar className="w-3 h-3 text-zinc-400" />
              <input type="date" className="bg-transparent text-[10px] text-zinc-600 dark:text-zinc-300 border-none outline-none w-20 cursor-pointer" />
              <span className="text-zinc-400 text-[10px]">to</span>
              <Calendar className="w-3 h-3 text-zinc-400" />
              <input type="date" className="bg-transparent text-[10px] text-zinc-600 dark:text-zinc-300 border-none outline-none w-20 cursor-pointer" />
            </div>
          </div>
          
          <button
            onClick={handleGenerateNow}
            disabled={isGenerating || briefingLoading}
            className="inline-flex items-center justify-center gap-1.5 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-[10px] font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer disabled:opacity-50 border-none whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${(isGenerating || briefingLoading) ? "animate-spin" : ""}`} />
            Generate Now ⚡
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Brief Column */}
        <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 transition-colors duration-200 shadow-sm flex flex-col min-h-[350px]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <span className="text-purple-500"><FileText className="w-4 h-4" /></span>
              Today's Brief
            </h3>
            <span className="px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg text-[9px] font-bold border border-purple-500/20">
              AI Generated (Gemini)
            </span>
          </div>

          {briefingLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
              <p className="text-xs text-zinc-500">Compiling your brief...</p>
            </div>
          ) : !briefingData || briefingData.todayBrief.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center space-y-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">No briefs generated yet.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {briefingData.todayBrief.map((item: any, index: number) => (
                <div key={index} className="flex items-start justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                        {getAppLabel(item.app)}: {item.title || item.summary.split('.')[0]}
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{item.summary}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Items Column */}
        <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 transition-colors duration-200 shadow-sm flex flex-col min-h-[350px]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <span className="text-red-500"><Star className="w-4 h-4" /></span>
              Priority Items
            </h3>
          </div>

          {briefingLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-red-500 mb-2" />
            </div>
          ) : !briefingData || briefingData.priorityItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center space-y-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">No priority items detected.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {briefingData.priorityItems.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 rounded-full bg-red-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">{item.title}</p>
                      <p className="text-[9px] text-zinc-500 mt-0.5">
                        {getAppLabel(item.app)} • {item.time || "Today"}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-wider">
                    {item.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
