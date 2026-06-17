"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useDashboardContext } from "@/context/DashboardContext";
import { 
  RefreshCw, AlertCircle, Calendar, CheckCircle2, ChevronRight, 
  FileText, Check, Link2, Star, Loader2 
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user } = useAuth();
  const { briefingData, briefingLoading, refreshBriefing, connectedApps, getAppLabel, getAppIcon } = useDashboardContext();
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 backdrop-blur-md transition-all">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight sm:text-2xl">
            Welcome back, {user?.profile?.name || user?.email?.split("@")[0] || "Operator"}!
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            Here is your automated intelligence briefing and priority agenda compiled across connected channels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshBriefing()}
            disabled={briefingLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-2xl text-xs font-bold transition-all shadow-sm border border-zinc-200 dark:border-zinc-700 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${briefingLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => router.push("/briefings")}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer border-none shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            Open Full Briefing
          </button>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl flex items-center justify-between glow-border transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-purple-500/10 text-purple-600 rounded-full border border-purple-500/20 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Important</span>
              <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white leading-none mt-1">
                {briefingLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                ) : (
                  briefingData?.stats?.importantCount ?? 2
                )}
              </h3>
              <p className="text-[10px] text-purple-600 font-bold mt-1">1 high priority</p>
            </div>
          </div>
          <div className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shrink-0">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl flex items-center justify-between glow-border transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-blue-500/10 text-blue-600 rounded-full border border-blue-500/20 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Schedule</span>
              <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white leading-none mt-1">
                3
              </h3>
              <p className="text-[10px] text-blue-600 font-bold mt-1">1 event today</p>
            </div>
          </div>
          <div className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shrink-0">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl flex items-center justify-between glow-border transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Follow-ups</span>
              <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white leading-none mt-1">
                {briefingLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                ) : (
                  briefingData?.stats?.followUpsCount ?? 1
                )}
              </h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">1 due today</p>
            </div>
          </div>
          <div className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shrink-0">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Briefing */}
        <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-5 transition-all duration-200">
          <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-900/50 pb-4">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <span className="text-purple-500"><FileText className="w-4 h-4" /></span>
              Today's Brief
            </h3>
            <button className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-[10px] font-bold transition-all cursor-pointer">
              View all
            </button>
          </div>
          {briefingLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : !briefingData || briefingData.todayBrief.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">No briefs generated.</p>
              <button onClick={() => router.push("/integrations")} className="text-[10px] text-indigo-500 hover:text-indigo-600 font-bold border-none bg-transparent cursor-pointer">
                Connect apps to begin
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {briefingData.todayBrief.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                        {getAppLabel(item.app)}: {item.title || item.summary.split('.')[0]}
                      </h4>
                      <p className="text-[9px] text-zinc-500 mt-0.5 font-mono">{item.time}</p>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Middle Column: Connected Apps */}
        <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-5 transition-all duration-200">
          <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-900/50 pb-4">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <span className="text-blue-500"><Link2 className="w-4 h-4" /></span>
              Connected Apps
            </h3>
            <button onClick={() => router.push("/integrations")} className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-[10px] font-bold transition-all cursor-pointer border-none">
              Manage
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: "gmail", name: "Gmail" },
              { id: "whatsapp", name: "WhatsApp" },
              { id: "slack", name: "Slack" },
              { id: "outlook", name: "Outlook Calendar" }
            ].map((app) => {
              const isConnected = connectedApps[app.id];
              return (
                <div key={app.id} className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-2xl relative">
                  {isConnected && (
                    <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                    </div>
                  )}
                  <div className="mb-2">
                    {app.id === 'gmail' && <div className="p-2 bg-white rounded-xl shadow-sm"><img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-6 h-6" /></div>}
                    {app.id === 'whatsapp' && <div className="p-2 bg-white rounded-xl shadow-sm"><img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-6 h-6" /></div>}
                    {app.id === 'slack' && <div className="p-2 bg-white rounded-xl shadow-sm"><img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" alt="Slack" className="w-6 h-6" /></div>}
                    {app.id === 'outlook' && <div className="p-2 bg-white rounded-xl shadow-sm"><img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" alt="Outlook" className="w-6 h-6" /></div>}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-805 dark:text-zinc-200 block text-center truncate w-full">{app.name}</span>
                  <span className={`text-[8px] font-bold mt-1 ${isConnected ? "text-emerald-500" : "text-zinc-400 dark:text-zinc-600"}`}>
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Priority Items */}
        <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-5 transition-all duration-200">
          <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-900/50 pb-4">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <span className="text-amber-500"><Star className="w-4 h-4" /></span>
              Priority Items
            </h3>
            <button className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-[10px] font-bold transition-all cursor-pointer">
              View all
            </button>
          </div>

          {briefingLoading ? (
            <div className="py-6 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            </div>
          ) : !briefingData || briefingData.priorityItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">No priority items detected.</p>
              <button onClick={() => router.push("/integrations")} className="text-[10px] text-indigo-500 hover:text-indigo-600 font-bold border-none bg-transparent cursor-pointer">
                Connect apps to begin
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {briefingData.priorityItems.map((item: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shrink-0">
                    {item.app === 'gmail' ? <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-4 h-4" /> : getAppIcon(item.app)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="text-[11px] font-bold text-zinc-900 dark:text-white truncate">{item.title}</h4>
                        <p className="text-[9px] text-zinc-500 mt-0.5 line-clamp-2">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 flex-col items-end">
                        <div className="flex items-center gap-1.5">
                          {item.priority === 'High' || item.priority === 'Critical' ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          )}
                          <span className="text-[8px] text-zinc-400 font-mono whitespace-nowrap">{item.time}</span>
                        </div>
                        <span className="text-[8px] font-bold text-zinc-400">{getAppLabel(item.app)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
