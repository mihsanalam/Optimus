"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, Mail, MessageSquare, Calendar, AlertCircle, CheckCircle2, Check,
  Clock, Plus, Zap, Bot, Send, Activity, ShieldAlert, CheckSquare,
  MoreVertical, X, Sparkles, Wand2, RefreshCw, ChevronRight, FileEdit
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useDashboardContext } from "@/context/DashboardContext";

interface Alert {
  id: string;
  title: string;
  description: string;
  source: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Active" | "Resolved" | "Snoozed";
  time: string;
  timestamp: Date;
}

export default function AlertsPage() {
  const { briefingData, getAppLabel } = useDashboardContext();
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Sync actual alerts from BriefingData instead of mock
  useEffect(() => {
    if (briefingData?.priorityItems) {
      const dynamicAlerts = briefingData.priorityItems.map((item: any, idx: number) => ({
        id: `alert-${idx}`,
        title: item.title || item.subject || "Action Required",
        description: item.snippet || item.summary || item.content || "Please review this item.",
        source: item.app || "system",
        priority: item.priority || "Medium",
        status: "Active" as const,
        time: item.time || "Today",
        timestamp: new Date()
      }));
      setAlerts(dynamicAlerts);
    }
  }, [briefingData]);

  const aiSuggestions = React.useMemo(() => {
    if (!briefingData?.priorityItems || briefingData.priorityItems.length === 0) {
      return [
        { title: "VIP Client Mentions", desc: "Alert me when a priority contact messages me." },
        { title: "Invoice Overdue", desc: "Check Gmail for 'Invoice Overdue' and create a task." },
        { title: "Meeting Follow-up", desc: "Notify me 10 mins after any calendar event ends." }
      ];
    }
    return briefingData.priorityItems.slice(0, 3).map((item: any) => ({
      title: `Track ${item.sender || 'updates'} from ${getAppLabel(item.app)}`,
      desc: `Create an alert when ${item.sender || 'this contact'} mentions "${item.title || 'important topics'}"`
    }));
  }, [briefingData, getAppLabel]);
  
  // Create Alert Form State
  const [newAlertName, setNewAlertName] = useState("");
  const [newAlertSource, setNewAlertSource] = useState("gmail");
  const [newAlertPriority, setNewAlertPriority] = useState("High");

  // Details Dialog AI State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");

  const stats = {
    active: alerts.filter(a => a.status === "Active").length,
    triggeredToday: alerts.filter(a => a.time.includes("AM") || a.time.includes("PM")).length,
    highPriority: alerts.filter(a => a.priority === "Critical" || a.priority === "High").length,
    resolved: alerts.filter(a => a.status === "Resolved").length
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertName) return toast.error("Please enter an alert name");
    
    // In a real app, this would trigger the Trigger.dev job setup
    toast.success("Trigger.dev background monitor job created successfully!");
    setIsCreateOpen(false);
    setNewAlertName("");
  };

  const getSourceIcon = (source: string) => {
    if (source.includes("gmail") || source.includes("email")) return <Mail className="w-5 h-5 text-red-500" />;
    if (source.includes("whatsapp")) return <MessageSquare className="w-5 h-5 text-emerald-500" />;
    if (source.includes("slack")) return <MessageSquare className="w-5 h-5 text-pink-500" />;
    if (source.includes("calendar")) return <Calendar className="w-5 h-5 text-blue-500" />;
    return <Bell className="w-5 h-5 text-indigo-500" />;
  };

  const getSourceColor = (source: string) => {
    if (source.includes("gmail") || source.includes("email")) return "bg-red-500/10 border-red-500/20";
    if (source.includes("whatsapp")) return "bg-emerald-500/10 border-emerald-500/20";
    if (source.includes("slack")) return "bg-pink-500/10 border-pink-500/20";
    if (source.includes("calendar")) return "bg-blue-500/10 border-blue-500/20";
    return "bg-indigo-500/10 border-indigo-500/20";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "Critical") return "bg-red-500/10 text-red-600 border-red-500/20";
    if (priority === "High") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    if (priority === "Medium") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    return "bg-zinc-500/10 text-zinc-600 border-zinc-500/20";
  };

  // AI Actions for Details Dialog
  const handleGenerateSummary = async () => {
    if (!selectedAlert) return;
    setIsAiLoading(true);
    setAiSuggestion("");
    try {
      const res = await fetch("/api/ai/quick-write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "alert-summary",
          prompt: `Alert Title: ${selectedAlert.title} | Source: ${selectedAlert.source} | Original Context: ${selectedAlert.description}`,
          tone: "professional"
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiSuggestion(data.text);
      } else {
        toast.error("Failed to analyze alert: " + data.error);
      }
    } catch (err: any) {
      toast.error("Error generating summary: " + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDraftReply = async () => {
    if (!selectedAlert) return;
    setIsAiLoading(true);
    setAiDraft("");
    try {
      const res = await fetch("/api/ai/quick-write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "alert-reply",
          prompt: `Alert Title: ${selectedAlert.title} | Source: ${selectedAlert.source} | Original Context: ${selectedAlert.description}`,
          tone: "professional"
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiDraft(data.text);
      } else {
        toast.error("Failed to draft reply: " + data.error);
      }
    } catch (err: any) {
      toast.error("Error drafting reply: " + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleMarkResolved = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "Resolved" } : a));
    toast.success("Alert marked as resolved.");
    if (selectedAlert) setSelectedAlert({ ...selectedAlert, status: "Resolved" });
  };

  const handleSendDraft = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: "Sending reply via MCP Tool...",
        success: "Reply sent successfully!",
        error: "Failed to send."
      }
    );
    setAiDraft("");
    handleMarkResolved(selectedAlert!.id);
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Active Alerts</h1>
          <p className="text-sm text-zinc-500 mt-1">Monitor your connected apps in real-time via Trigger.dev jobs.</p>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Create New Alert
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Alerts", value: stats.active, icon: <Activity className="w-5 h-5 text-indigo-500" />, bg: "bg-indigo-50" },
          { label: "Triggered Today", value: stats.triggeredToday, icon: <Zap className="w-5 h-5 text-purple-500" />, bg: "bg-purple-50" },
          { label: "High Priority", value: stats.highPriority, icon: <ShieldAlert className="w-5 h-5 text-red-500" />, bg: "bg-red-50" },
          { label: "Resolved", value: stats.resolved, icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-50" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-xl ${stat.bg} dark:bg-opacity-10 shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-black text-zinc-900 dark:text-white">{stat.value}</p>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Suggested Alerts */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">AI Suggested Alerts</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiSuggestions.map((sugg: { title: string; desc: string }, idx: number) => (
            <div key={idx} className="bg-white dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-colors group cursor-pointer" onClick={() => { setIsCreateOpen(true); setNewAlertName(sugg.title); }}>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{sugg.title}</h3>
              <p className="text-xs text-zinc-500 mt-1">{sugg.desc}</p>
              <div className="mt-3 flex justify-end">
                <span className="text-[10px] font-bold text-purple-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Set up <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Layout */}
      <div>
        <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white mb-6">Recent Alerts</h2>
        
        <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-4 md:ml-6 space-y-8 pb-10">
          {alerts.map((alert) => (
            <div key={alert.id} className="relative pl-8 md:pl-10 group">
              {/* Timeline Dot */}
              <div className={`absolute -left-2 top-2 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950 ${alert.status === "Resolved" ? "bg-zinc-300 dark:bg-zinc-700" : alert.priority === "Critical" ? "bg-red-500 animate-pulse" : "bg-indigo-500"}`} />
              
              <div 
                onClick={() => { setSelectedAlert(alert); setAiDraft(""); setAiSuggestion(""); }}
                className={`bg-white dark:bg-zinc-900 border rounded-2xl p-4 md:p-5 shadow-sm transition-all cursor-pointer hover:shadow-md
                ${alert.status === "Resolved" ? "border-zinc-200 dark:border-zinc-800 opacity-60" : "border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500"}
                `}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-2xl border shrink-0 h-fit ${getSourceColor(alert.source)}`}>
                      {getSourceIcon(alert.source)}
                    </div>
                    <div>
                      <h3 className={`text-base font-bold ${alert.status === "Resolved" ? "text-zinc-500 dark:text-zinc-400 line-through" : "text-zinc-900 dark:text-white"}`}>
                        {alert.title}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 line-clamp-2">
                        {alert.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {alert.time}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded capitalize">
                          {alert.source}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0 pt-2 sm:pt-0 pl-16 sm:pl-0">
                    {alert.status === "Active" ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMarkResolved(alert.id); }}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Resolve
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400 rounded-lg text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE NEW ALERT DIALOG */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-4 md:p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
              <h2 className="text-lg font-black text-zinc-900 dark:text-white">Create Background Alert</h2>
              <button onClick={() => setIsCreateOpen(false)} className="p-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateAlert} className="p-4 md:p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Alert Name</label>
                <input 
                  type="text" 
                  value={newAlertName}
                  onChange={(e) => setNewAlertName(e.target.value)}
                  placeholder="e.g. VIP Client Email" 
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Trigger Rule / Condition</label>
                <textarea 
                  placeholder="e.g. If sender is sarah@example.com AND subject contains 'Invoice'" 
                  rows={2}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 resize-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Connected App</label>
                  <select 
                    value={newAlertSource}
                    onChange={(e) => setNewAlertSource(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="gmail">Gmail</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="slack">Slack</option>
                    <option value="calendar">Google Calendar</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Priority Level</label>
                  <select 
                    value={newAlertPriority}
                    onChange={(e) => setNewAlertPriority(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Check Frequency</label>
                  <select className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500">
                    <option>Real-time (Webhook)</option>
                    <option>Every 5 minutes</option>
                    <option>Every hour</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Action when triggered</label>
                  <select className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500">
                    <option>Show on Dashboard</option>
                    <option>Send Push Notification</option>
                    <option>Draft AI Reply automatically</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-900">
                <button 
                  type="button" 
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition-colors"
                >
                  <Zap className="w-4 h-4" /> Save & Enable Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALERT DETAILS DIALOG (AI Features) */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 md:p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${getSourceColor(selectedAlert.source)}`}>
                  {getSourceIcon(selectedAlert.source)}
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900 dark:text-white leading-tight">{selectedAlert.title}</h2>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">Alert ID: {selectedAlert.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAlert(null)} className="p-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              
              <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Original Context</h3>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm text-zinc-800 dark:text-zinc-200">
                  {selectedAlert.description}
                </div>
              </div>

              {/* AI Features Toolbar */}
              {selectedAlert.status === "Active" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" /> AI Assistant Options
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleGenerateSummary} disabled={isAiLoading} className="px-3 py-2 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50">
                      <Wand2 className="w-3.5 h-3.5" /> Analyze & Summarize
                    </button>
                    <button onClick={handleDraftReply} disabled={isAiLoading} className="px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50">
                      <FileEdit className="w-3.5 h-3.5" /> Draft Quick Reply
                    </button>
                    <button className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors">
                      <CheckSquare className="w-3.5 h-3.5" /> Convert to Task
                    </button>
                  </div>
                </div>
              )}

              {isAiLoading && (
                <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <RefreshCw className="w-4 h-4 text-purple-500 animate-spin" />
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Optimus AI is processing...</span>
                </div>
              )}

              {aiSuggestion && (
                <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-2xl animate-fadeIn">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400">AI Analysis</span>
                  </div>
                  <div className="text-sm text-zinc-800 dark:text-zinc-300 prose prose-sm dark:prose-invert">
                    <ReactMarkdown>{aiSuggestion}</ReactMarkdown>
                  </div>
                </div>
              )}

              {aiDraft && (
                <div className="space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Drafted Reply</span>
                    </div>
                  </div>
                  <textarea 
                    value={aiDraft}
                    onChange={(e) => setAiDraft(e.target.value)}
                    rows={5}
                    className="w-full bg-white dark:bg-zinc-950 border border-indigo-200 dark:border-indigo-900/50 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none resize-none shadow-inner"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={handleSendDraft} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors">
                      <Send className="w-3.5 h-3.5" /> Send & Resolve
                    </button>
                  </div>
                </div>
              )}

            </div>

            <div className="p-4 md:p-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/30 flex justify-between items-center">
              {selectedAlert.status === "Active" ? (
                <>
                  <button onClick={() => { toast.success("Alert snoozed for 1 hour"); setSelectedAlert(null); }} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    Snooze
                  </button>
                  <button onClick={() => handleMarkResolved(selectedAlert.id)} className="px-5 py-2.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl text-sm font-bold shadow-md transition-colors">
                    Mark as Resolved
                  </button>
                </>
              ) : (
                <div className="w-full flex justify-center">
                  <span className="text-sm font-bold text-emerald-500 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> This alert has been resolved.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
