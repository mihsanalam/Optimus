"use client";

import React, { useState, useEffect } from "react";
import { useDashboardContext } from "@/context/DashboardContext";
import { Sparkles, Mail, MessageSquare, Calendar, Check, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AlertsPage() {
  const { briefingData, getAppLabel } = useDashboardContext();

  const [alerts, setAlerts] = useState<Array<{ id: string; title: string; source: string; time: string; status: "Pending" | "Resolved"; priority: string }>>([]);
  const [alertsFilter, setAlertsFilter] = useState<"all" | "pending" | "resolved">("all");
  const [alertsSearch, setAlertsSearch] = useState("");
  
  const [simAlertTitle, setSimAlertTitle] = useState("");
  const [simAlertSource, setSimAlertSource] = useState("gmail");
  const [simAlertPriority, setSimAlertPriority] = useState("High");

  // Synchronize alerts with briefing data when it changes
  useEffect(() => {
    if (briefingData?.priorityItems) {
      const compiledAlerts = briefingData.priorityItems.map((item: any, idx: number) => ({
        id: `briefing-alt-${idx}`,
        title: item.title,
        source: getAppLabel(item.app),
        time: item.time || "Today",
        status: "Pending" as const,
        priority: item.priority
      }));
      setAlerts(compiledAlerts);
    }
  }, [briefingData, getAppLabel]);

  const handleResolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "Resolved" as const } : a));
    toast.success("Alert resolved successfully!");
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.error("Alert dismissed.");
  };

  const handleSimulateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simAlertTitle.trim()) {
      toast.error("Please enter an alert title.");
      return;
    }
    const newAlert = {
      id: `sim-alt-${Date.now()}`,
      title: simAlertTitle,
      source: getAppLabel(simAlertSource),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Pending" as const,
      priority: simAlertPriority
    };
    setAlerts(prev => [newAlert, ...prev]);
    setSimAlertTitle("");
    toast.success("New Smart Action Alert injected successfully!");
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = 
      alertsFilter === "all" ||
      (alertsFilter === "pending" && alert.status === "Pending") ||
      (alertsFilter === "resolved" && alert.status === "Resolved");
    const matchesSearch = 
      alert.title.toLowerCase().includes(alertsSearch.toLowerCase()) ||
      alert.source.toLowerCase().includes(alertsSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Area: Smart Action Alerts Center (8 cols) */}
      <div className="lg:col-span-8 bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-6 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-150 dark:border-zinc-900 pb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              Smart Action Alerts Center
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1">
              Optimus scans connected communication channels to detect critical requirements and action items.
            </p>
          </div>
          {alerts.filter(a => a.status === "Pending").length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl text-[10px] font-bold self-start">
              {alerts.filter(a => a.status === "Pending").length} Pending Actions
            </span>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2">
            {(["all", "pending", "resolved"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setAlertsFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold border transition-all cursor-pointer capitalize ${
                  alertsFilter === f
                    ? "bg-indigo-650 dark:bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                    : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 text-zinc-605 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {f} Alerts
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search alerts by title or source..."
            value={alertsSearch}
            onChange={(e) => setAlertsSearch(e.target.value)}
            className="bg-zinc-50 dark:bg-zinc-955/60 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-zinc-805 dark:text-white outline-none focus:border-indigo-500/50 w-full md:max-w-xs transition-colors"
          />
        </div>

        {/* Dynamic Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl">
              <Sparkles className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2.5" />
              <p className="text-xs text-zinc-500 font-semibold">No alerts matching filter criteria.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isResolved = alert.status === "Resolved";
              const isCritical = alert.priority === "Critical";
              const isHigh = alert.priority === "High";

              return (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 border-l-4 ${
                    isResolved 
                      ? "bg-zinc-50/40 dark:bg-zinc-950/20 border-zinc-150 dark:border-zinc-900/60 border-l-emerald-500" 
                      : isCritical 
                      ? "bg-red-500/5 dark:bg-red-500/10 border-red-550/20 border-l-red-500" 
                      : isHigh 
                      ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-550/20 border-l-amber-500" 
                      : "bg-blue-500/5 dark:bg-blue-500/10 border-blue-550/20 border-l-blue-500"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Left icon resolver based on source */}
                    <div className="shrink-0">
                      {alert.source.toLowerCase().includes("gmail") ? (
                        <div className="p-2 bg-red-500/10 text-red-500 border border-red-500/10 rounded-xl">
                          <Mail className="w-4 h-4" />
                        </div>
                      ) : alert.source.toLowerCase().includes("whatsapp") ? (
                        <div className="p-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 rounded-xl">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      ) : alert.source.toLowerCase().includes("slack") ? (
                        <div className="p-2 bg-pink-500/10 text-pink-500 border border-pink-500/10 rounded-xl">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-2 bg-blue-500/10 text-blue-500 border border-blue-500/10 rounded-xl">
                          <Calendar className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className={`text-xs font-semibold block leading-snug truncate ${isResolved ? "text-zinc-450 dark:text-zinc-500 line-through" : "text-zinc-850 dark:text-zinc-100"}`}>
                        {alert.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-550">{alert.source} • {alert.time}</span>
                        {!isResolved && (
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${
                            isCritical 
                              ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/15" 
                              : isHigh 
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15" 
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-450 border-blue-500/15"
                          }`}>
                            {alert.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isResolved ? (
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-650 hover:text-white border border-indigo-550/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer border-none"
                      >
                        <Check className="w-3 h-3" />
                        Resolve
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 text-[10px] font-bold rounded-lg select-none">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-zinc-400 hover:border-red-500/20 border border-transparent rounded-lg transition-all cursor-pointer bg-transparent"
                      title="Dismiss notification"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area: AI Alert Simulator (4 cols) */}
      <div className="lg:col-span-4 bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-5 transition-colors duration-200 self-start">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            AI Alert Simulator
          </h3>
          <p className="text-[9px] text-zinc-550 dark:text-zinc-455 mt-0.5">
            Inject a mock notification to test background workflows and status counters.
          </p>
        </div>

        <form onSubmit={handleSimulateAlert} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Alert Action Title
            </label>
            <input
              type="text"
              placeholder="e.g. Schedule visual QA check"
              value={simAlertTitle}
              onChange={(e) => setSimAlertTitle(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 focus:border-indigo-500/50 rounded-xl py-2 px-3 text-xs text-zinc-800 dark:text-white outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Source App
              </label>
              <select
                value={simAlertSource}
                onChange={(e) => setSimAlertSource(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 focus:border-indigo-500/50 rounded-xl py-2 px-3 text-xs text-zinc-800 dark:text-white outline-none cursor-pointer"
              >
                <option value="gmail">Gmail Indexer</option>
                <option value="whatsapp">WhatsApp Linker</option>
                <option value="slack">Slack Sync</option>
                <option value="outlook">Outlook Calendar</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Priority
              </label>
              <select
                value={simAlertPriority}
                onChange={(e) => setSimAlertPriority(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 focus:border-indigo-500/50 rounded-xl py-2 px-3 text-xs text-zinc-800 dark:text-white outline-none cursor-pointer"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer border-none"
          >
            Trigger Simulation
          </button>
        </form>
      </div>
    </div>
  );
}
