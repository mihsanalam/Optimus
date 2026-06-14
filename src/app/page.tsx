"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Radio,
  ListTodo,
  Lightbulb,
  FileText,
  Bell,
  RefreshCw,
  Power,
  CheckCircle2,
  Circle,
  Sparkles,
  Plus,
  Trash2,
  ArrowRight,
  Check,
  Zap,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Sliders,
  Send
} from "lucide-react";

// Types
interface ConnectedApp {
  id: string;
  name: string;
  icon: string;
  status: "connected" | "disconnected";
  description: string;
}

interface Alert {
  id: string;
  app: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
}

interface Task {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "completed";
}

interface BrainstormIdea {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"home" | "apps" | "tasks" | "brainstorm" | "summarize">("home");
  
  // App Connection State
  const [apps, setApps] = useState<ConnectedApp[]>([
    { id: "github", name: "GitHub", icon: "Github", status: "connected", description: "Track pull requests, issues & repository webhooks" },
    { id: "slack", name: "Slack", icon: "Slack", status: "connected", description: "Send automated updates & daily workspace briefing alerts" },
    { id: "notion", name: "Notion", icon: "Notion", status: "connected", description: "Sync work logs, database updates, and personal wikis" },
    { id: "calendar", name: "Google Calendar", icon: "Calendar", status: "disconnected", description: "Fetch upcoming events, meetings, and schedules" },
    { id: "gmail", name: "Gmail", icon: "Gmail", status: "disconnected", description: "Retrieve daily newsletter digests and urgent emails" },
  ]);

  // Alerts State
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: "1", app: "github", title: "New PR in mihsanalam/Optimus", description: "Feature branch 'ai-dashboard-core' submitted by git-agent", time: "5m ago", unread: true },
    { id: "2", app: "slack", title: "Urgent: Workflow Blocked", description: "#optimus-alerts notified task 'Database Sync' failed validation", time: "45m ago", unread: true },
    { id: "3", app: "notion", title: "Workspace Schema Updated", description: "Document 'System Architecture v2' updated by Mihsan Alam", time: "2h ago", unread: false },
    { id: "4", app: "github", title: "Build Successful", description: "Production build deployed to Vercel in 1m 45s", time: "4h ago", unread: false },
  ]);

  // Tasks State
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Configure GitHub webhook triggers for Optimus dashboard", priority: "high", status: "todo" },
    { id: "2", title: "Build custom LLM router for summarizing meeting transcripts", priority: "medium", status: "todo" },
    { id: "3", title: "Refactor database migrations for Multi-tenant OAuth tokens", priority: "high", status: "completed" },
    { id: "4", title: "Design the glassmorphic dark-mode interface in Next.js", priority: "high", status: "completed" },
  ]);
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState<"high" | "medium" | "low">("medium");

  // Brainstorming State
  const [ideaTopic, setIdeaTopic] = useState("");
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<BrainstormIdea[]>([]);

  // Summarizer State
  const [summarizeText, setSummarizeText] = useState("");
  const [summarizeDepth, setSummarizeDepth] = useState<"short" | "medium" | "detailed">("medium");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryPoints, setSummaryPoints] = useState<string[]>([]);

  // App Toggler
  const toggleAppConnection = (id: string) => {
    setApps(prev => prev.map(app => {
      if (app.id === id) {
        const nextStatus = app.status === "connected" ? "disconnected" : "connected";
        // Create an alert on change
        if (nextStatus === "connected") {
          setAlerts(prevAlerts => [
            {
              id: Date.now().toString(),
              app: app.id,
              title: `${app.name} Connected`,
              description: `Successfully authenticated OAuth integration for ${app.name}.`,
              time: "Just now",
              unread: true
            },
            ...prevAlerts
          ]);
        } else {
          setAlerts(prevAlerts => [
            {
              id: Date.now().toString(),
              app: app.id,
              title: `${app.name} Disconnected`,
              description: `Revoked active access tokens for ${app.name}.`,
              time: "Just now",
              unread: true
            },
            ...prevAlerts
          ]);
        }
        return { ...app, status: nextStatus };
      }
      return app;
    }));
  };

  // Add Task
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTodoText.trim(),
      priority: newTodoPriority,
      status: "todo"
    };
    setTasks([newTask, ...tasks]);
    setNewTodoText("");
  };

  // Toggle Task Status
  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, status: task.status === "todo" ? "completed" : "todo" } : task
    ));
  };

  // Delete Task
  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  // Mark all Alerts as read
  const markAllAlertsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, unread: false })));
  };

  // Handle Brainstorming Mock
  const handleBrainstormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTopic.trim()) return;
    setIsBrainstorming(true);
    setGeneratedIdeas([]);

    setTimeout(() => {
      const topic = ideaTopic.toLowerCase();
      let ideas: BrainstormIdea[] = [];

      if (topic.includes("saas") || topic.includes("business") || topic.includes("startup")) {
        ideas = [
          { title: "Automated Lead Enrichment Engine", description: "Listen to Slack channel mentions, enrich lead profiles using Clearbit/LinkedIn API, and automatically create HubSpot deals.", impact: "high" },
          { title: "Micro-SaaS Subscriptions Health Checker", description: "Integrate Stripe with Notion. Output a daily summary highlighting high churn risks and new subscription milestones.", impact: "medium" },
          { title: "Automated Client Feedback Loop", description: "Trigger localized email surveys on completed Notion tasks, analyze sentiment using AI, and aggregate reports in Slack.", impact: "high" }
        ];
      } else if (topic.includes("content") || topic.includes("blog") || topic.includes("marketing") || topic.includes("social")) {
        ideas = [
          { title: "AI-Powered Cross-Post Orchestration", description: "Publish a technical article on Dev.to. Automatically generate customized threads for Twitter, LinkedIn, and summaries for newsletters.", impact: "high" },
          { title: "Trending Keyword Slack Monitor", description: "Parse Hacker News and Reddit daily for keywords related to your product. Generate and queue content outlines matching hot topics.", impact: "medium" },
          { title: "Interactive Portfolio Showcase Optimizer", description: "Use AI to analyze Google Lighthouse audits on your portfolio site and automatically suggest content updates to optimize SEO keywords.", impact: "high" }
        ];
      } else {
        ideas = [
          { title: `Automated ${ideaTopic} Dashboard`, description: "Build a customized API pipeline that aggregates all daily logs related to this topic into a cohesive dashboard view.", impact: "medium" },
          { title: `AI-Driven ${ideaTopic} Insight Engine`, description: "Periodically run sentiment analyses and predictive trend spotting on topics related to this query, generating Slack alerts.", impact: "high" },
          { title: `Unified ${ideaTopic} Workflows Hub`, description: "Connect all relevant tools used to manage this topic, automating status transitions and daily task scheduling.", impact: "high" }
        ];
      }

      setGeneratedIdeas(ideas);
      setIsBrainstorming(false);
    }, 1500);
  };

  // Handle Summarizer Mock
  const handleSummarizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summarizeText.trim()) return;
    setIsSummarizing(true);
    setSummaryPoints([]);

    setTimeout(() => {
      const points = [
        "Core Theme: Establishing automated, AI-driven pipelines to optimize developer workflows and personal productivity.",
        "System Integrations: Emphasizes modular API connections (GitHub, Notion, Slack) to sync data and prevent dashboard fragmentation.",
        "Performance Optimization: Leverages next-generation layouts, minimal JS payloads, and high-performance server components.",
        "Contextual Intelligence: The AI agent continuously reads developer environments and tailors daily alerts and briefings dynamically.",
      ];

      const sliceCount = summarizeDepth === "short" ? 2 : summarizeDepth === "medium" ? 3 : 4;
      setSummaryPoints(points.slice(0, sliceCount));
      setIsSummarizing(false);
    }, 1800);
  };

  // Helper for alert colors
  const getAppTheme = (appId: string) => {
    switch (appId) {
      case "github": return { bg: "bg-zinc-800/80 text-white", border: "border-zinc-700" };
      case "slack": return { bg: "bg-pink-500/10 text-pink-400 border-pink-500/20", border: "border-pink-500/30" };
      case "notion": return { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", border: "border-amber-500/30" };
      case "calendar": return { bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", border: "border-blue-500/30" };
      case "gmail": return { bg: "bg-red-500/10 text-red-400 border-red-500/20", border: "border-red-500/30" };
      default: return { bg: "bg-zinc-800 text-zinc-300", border: "border-zinc-700" };
    }
  };

  return (
    <div className="flex h-screen bg-[#030712] text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-indigo-900/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-purple-900/15 blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-80 border-r border-zinc-900 bg-zinc-950/40 backdrop-blur-xl flex flex-col z-10">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-8 border-b border-zinc-900/80 gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Optimus
            </h1>
            <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">
              AI Assistant Platform
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab("home")}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === "home"
                ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard Home
          </button>
          
          <button
            onClick={() => setActiveTab("apps")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === "apps"
                ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent"
            }`}
          >
            <span className="flex items-center gap-3.5">
              <Radio className="w-4 h-4" />
              Connected Apps
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
              {apps.filter(a => a.status === "connected").length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === "tasks"
                ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent"
            }`}
          >
            <span className="flex items-center gap-3.5">
              <ListTodo className="w-4 h-4" />
              Smart Task Board
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950/40 border border-indigo-900/50 text-indigo-300">
              {tasks.filter(t => t.status === "todo").length}
            </span>
          </button>

          <div className="pt-4 pb-2 px-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
              AI Brain Core
            </span>
          </div>

          <button
            onClick={() => setActiveTab("brainstorm")}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === "brainstorm"
                ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent"
            }`}
          >
            <Lightbulb className="w-4 h-4 text-purple-400" />
            Idea Generator
          </button>

          <button
            onClick={() => setActiveTab("summarize")}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === "summarize"
                ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent"
            }`}
          >
            <FileText className="w-4 h-4 text-teal-400" />
            Text Summarizer
          </button>
        </nav>

        {/* User Card */}
        <div className="p-6 border-t border-zinc-900 bg-zinc-950/60 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-purple-500/10">
            MA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-200 truncate">Mihsan Alam</p>
            <p className="text-[11px] text-zinc-500 truncate">mdmihsan2@gmail.com</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden z-10">
        {/* Top Header */}
        <header className="h-20 border-b border-zinc-900 bg-zinc-950/20 backdrop-blur-xl flex items-center justify-between px-10">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 capitalize">
              {activeTab === "home" && "System Control Dashboard"}
              {activeTab === "apps" && "Integration Store & OAuth Connections"}
              {activeTab === "tasks" && "AI-Assisted Task Planner"}
              {activeTab === "brainstorm" && "AI Brainstorming Module"}
              {activeTab === "summarize" && "Text & URL Synthesizer"}
            </h2>
            <p className="text-xs text-zinc-500">
              {activeTab === "home" && "Unified real-time feed and app health status"}
              {activeTab === "apps" && "Manage background tokens and connected workspaces"}
              {activeTab === "tasks" && "Organize your sprint with automated reminders"}
              {activeTab === "brainstorm" && "Generate creative SaaS models, content & code concepts"}
              {activeTab === "summarize" && "Extract key takeaways and briefs from long form articles"}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full" />
              <button className="p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70 transition-all">
                <Bell className="w-4 h-4" />
              </button>
            </div>
            <div className="h-6 w-px bg-zinc-800" />
            <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/15 transition-all active:scale-[0.98]">
              <Sparkles className="w-3.5 h-3.5" />
              Ask Optimus
            </button>
          </div>
        </header>

        {/* Tab Canvas */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8">
          
          {/* TAB 1: HOME */}
          {activeTab === "home" && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Daily Briefing Card */}
              <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/20 to-purple-950/25 p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      Daily Briefing Synthesized
                    </span>
                    <h3 className="text-2xl font-bold text-white">Good afternoon, Mihsan! ☀️</h3>
                    <p className="max-w-2xl text-sm text-zinc-400 leading-relaxed">
                      Your workspace is quiet right now. You have <strong className="text-zinc-200">{tasks.filter(t=>t.status==='todo').length} pending tasks</strong>, and <strong className="text-zinc-200">{apps.filter(a=>a.status==='connected').length} connected integrations</strong> actively streaming. 
                      Your local repository <code className="text-indigo-400 font-mono">Optimus</code> is synced with GitHub, and the latest deployment built successfully.
                    </p>
                  </div>
                  <button className="p-3 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 rounded-2xl transition-all shadow-md active:scale-95">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Upcoming events</span>
                      <span className="text-sm font-bold text-zinc-200">No meetings scheduled</span>
                    </div>
                  </div>
                  <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <ListTodo className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Remaining tasks</span>
                      <span className="text-sm font-bold text-zinc-200">{tasks.filter(t=>t.status==='todo').length} items to finish</span>
                    </div>
                  </div>
                  <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Integrations health</span>
                      <span className="text-sm font-bold text-zinc-200">All systems operating normally</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Feed and Status Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Stream: Real-Time Alerts */}
                <section className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Smart Alert Feed</h4>
                    </div>
                    <button 
                      onClick={markAllAlertsRead}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                    {alerts.map(alert => {
                      const theme = getAppTheme(alert.app);
                      return (
                        <div 
                          key={alert.id} 
                          className={`group relative border rounded-2xl p-5 bg-zinc-900/10 backdrop-blur-xl transition-all duration-300 hover:bg-zinc-900/30 ${
                            alert.unread ? "border-indigo-500/30 shadow-lg shadow-indigo-500/5" : "border-zinc-900"
                          }`}
                        >
                          {alert.unread && (
                            <span className="absolute top-5 right-5 w-2 h-2 rounded-full bg-indigo-500" />
                          )}
                          <div className="flex items-start gap-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border tracking-widest ${theme.bg}`}>
                              {alert.app}
                            </span>
                            <div className="flex-1 space-y-1">
                              <h5 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
                                {alert.title}
                              </h5>
                              <p className="text-xs text-zinc-400 leading-relaxed">
                                {alert.description}
                              </p>
                              <span className="text-[10px] text-zinc-600 font-medium block">
                                {alert.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Right Panel: Connections Summary */}
                <section className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Quick Integration Status</h4>
                    </div>
                    <button 
                      onClick={() => setActiveTab("apps")}
                      className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors flex items-center gap-1"
                    >
                      All apps
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-zinc-950/20 border border-zinc-900 rounded-3xl p-6 space-y-4">
                    {apps.map(app => {
                      const isConnected = app.status === "connected";
                      return (
                        <div key={app.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/20 border border-zinc-900/60 hover:border-zinc-800 transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black uppercase ${
                              isConnected ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                            }`}>
                              {app.name[0]}
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-zinc-300 block">{app.name}</span>
                              <span className="text-[10px] text-zinc-600 font-medium">{isConnected ? "Streaming updates" : "Idle"}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => toggleAppConnection(app.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isConnected 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20" 
                                : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/80"
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            {isConnected ? "Active" : "Connect"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>

              </div>
            </div>
          )}

          {/* TAB 2: CONNECTED APPS */}
          {activeTab === "apps" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="bg-zinc-950/20 border border-zinc-900 rounded-3xl p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">OAuth Integrations</h3>
                    <p className="text-sm text-zinc-500">Enable data sync pipelines and workflow webhooks securely</p>
                  </div>
                  <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl px-4 py-2 text-xs font-semibold text-indigo-300">
                    🔐 Auth state: Secured via AES-256 tokens
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {apps.map(app => {
                    const isConnected = app.status === "connected";
                    return (
                      <div 
                        key={app.id}
                        className={`group border rounded-3xl p-6 bg-zinc-900/10 backdrop-blur-xl transition-all duration-300 hover:bg-zinc-900/30 ${
                          isConnected ? "border-indigo-500/25 shadow-lg shadow-indigo-500/5" : "border-zinc-900"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black uppercase text-sm border ${
                                isConnected ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-zinc-900 text-zinc-500 border-zinc-800"
                              }`}>
                                {app.name[0]}
                              </div>
                              <div>
                                <h4 className="text-base font-bold text-zinc-200">{app.name}</h4>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                  isConnected ? "text-emerald-400" : "text-zinc-500"
                                }`}>
                                  {isConnected ? "Connected" : "Disconnected"}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed min-h-[36px]">
                              {app.description}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => toggleAppConnection(app.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                              isConnected
                                ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                                : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border border-transparent"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            {isConnected ? "Revoke Access" : "Connect Integration"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SMART TASK BOARD */}
          {activeTab === "tasks" && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-zinc-950/20 border border-zinc-900 rounded-2xl p-5">
                  <span className="text-xs font-semibold text-zinc-500 uppercase">Total Tasks</span>
                  <span className="text-3xl font-black text-white block mt-1">{tasks.length}</span>
                </div>
                <div className="bg-zinc-950/20 border border-zinc-900 rounded-2xl p-5">
                  <span className="text-xs font-semibold text-zinc-500 uppercase">Pending Review</span>
                  <span className="text-3xl font-black text-indigo-400 block mt-1">
                    {tasks.filter(t => t.status === "todo").length}
                  </span>
                </div>
                <div className="bg-zinc-950/20 border border-zinc-900 rounded-2xl p-5">
                  <span className="text-xs font-semibold text-zinc-500 uppercase">Completion Rate</span>
                  <span className="text-3xl font-black text-emerald-400 block mt-1">
                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "completed").length / tasks.length) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Task Creation & List */}
              <div className="bg-zinc-950/20 border border-zinc-900 rounded-3xl p-8 space-y-8">
                
                {/* Form */}
                <form onSubmit={addTask} className="flex flex-col md:flex-row gap-4 items-end md:items-center">
                  <div className="flex-1 w-full space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Add New Task</label>
                    <input
                      type="text"
                      placeholder="e.g. Integrate Notion pages hook or run data backups..."
                      value={newTodoText}
                      onChange={e => setNewTodoText(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="w-full md:w-48 space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Priority</label>
                    <select
                      value={newTodoPriority}
                      onChange={e => setNewTodoPriority(e.target.value as "high" | "medium" | "low")}
                      className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="high">🔴 High Priority</option>
                      <option value="medium">🟡 Medium Priority</option>
                      <option value="low">🔵 Low Priority</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/10 transition-all hover:shadow-indigo-600/20 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </button>
                </form>

                <div className="h-px bg-zinc-900" />

                {/* List */}
                <div className="space-y-4">
                  {tasks.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500">
                      No tasks logged yet. Create your first task above!
                    </div>
                  ) : (
                    tasks.map(task => {
                      const isCompleted = task.status === "completed";
                      return (
                        <div 
                          key={task.id}
                          className={`flex items-center justify-between p-4 border rounded-2xl transition-all duration-300 ${
                            isCompleted 
                              ? "bg-zinc-950/10 border-zinc-950 text-zinc-500" 
                              : "bg-zinc-900/20 border-zinc-900 text-zinc-200 hover:border-zinc-800 hover:bg-zinc-900/30"
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1 mr-4">
                            <button 
                              type="button" 
                              onClick={() => toggleTaskStatus(task.id)}
                              className="text-zinc-500 hover:text-indigo-400 transition-colors shrink-0"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>

                            <span className={`text-sm font-medium ${isCompleted ? "line-through text-zinc-600" : ""}`}>
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              task.priority === "high" 
                                ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                                : task.priority === "medium"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}>
                              {task.priority}
                            </span>

                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-2 text-zinc-600 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BRAINSTORMING */}
          {activeTab === "brainstorm" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="bg-zinc-950/20 border border-zinc-900 rounded-3xl p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    AI Concept Architect
                  </h3>
                  <p className="text-sm text-zinc-500">Provide a topic or keyword, and the AI will scaffold 3 structural micro-SaaS, code, or content ideas.</p>
                </div>

                <form onSubmit={handleBrainstormSubmit} className="flex gap-4">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next.js SaaS automation, personal metrics, email workflows..."
                    value={ideaTopic}
                    onChange={e => setIdeaTopic(e.target.value)}
                    className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isBrainstorming}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-purple-500/10 transition-all active:scale-95"
                  >
                    {isBrainstorming ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-4 h-4" />
                        Brainstorm
                      </>
                    )}
                  </button>
                </form>

                {generatedIdeas.length > 0 && (
                  <div className="space-y-6 pt-4 animate-fadeIn">
                    <div className="h-px bg-zinc-900" />
                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest">Architectural Outlines</h4>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {generatedIdeas.map((idea, index) => (
                        <div key={index} className="border border-purple-500/10 hover:border-purple-500/25 bg-purple-950/5 rounded-2xl p-6 transition-all space-y-3">
                          <div className="flex justify-between items-start">
                            <h5 className="text-base font-bold text-zinc-100">{idea.title}</h5>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              idea.impact === "high"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            }`}>
                              Impact: {idea.impact}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">{idea.description}</p>
                          
                          <button
                            onClick={() => {
                              // Transfer idea to Tasks
                              const newTask: Task = {
                                id: Date.now().toString(),
                                title: `Explore implementation: ${idea.title}`,
                                priority: idea.impact === "high" ? "high" : "medium",
                                status: "todo"
                              };
                              setTasks([newTask, ...tasks]);
                              alert(`"${idea.title}" added to your Smart Task Board!`);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors mt-2"
                          >
                            Add to Tasks
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SUMMARIZER */}
          {activeTab === "summarize" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="bg-zinc-950/20 border border-zinc-900 rounded-3xl p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-400" />
                    AI Text Synthesizer
                  </h3>
                  <p className="text-sm text-zinc-500">Paste long articles, documentation blocks, or code descriptions, and select summary depth.</p>
                </div>

                <form onSubmit={handleSummarizeSubmit} className="space-y-4">
                  <textarea
                    required
                    rows={6}
                    placeholder="Paste your long text or article summary here..."
                    value={summarizeText}
                    onChange={e => setSummarizeText(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all resize-none"
                  />

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1.5">
                      <button
                        type="button"
                        onClick={() => setSummarizeDepth("short")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          summarizeDepth === "short" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Short (2 points)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSummarizeDepth("medium")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          summarizeDepth === "medium" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Medium (3 points)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSummarizeDepth("detailed")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          summarizeDepth === "detailed" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Detailed (4 points)
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSummarizing}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-teal-500/10 transition-all active:scale-95"
                    >
                      {isSummarizing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Summarizing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Summarize
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {summaryPoints.length > 0 && (
                  <div className="space-y-6 pt-4 animate-fadeIn">
                    <div className="h-px bg-zinc-900" />
                    <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest">Synthesized Summary</h4>
                    
                    <div className="bg-teal-950/5 border border-teal-500/10 rounded-2xl p-6 space-y-4">
                      {summaryPoints.map((point, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-teal-500/20">
                            {index + 1}
                          </div>
                          <p className="text-sm text-zinc-300 leading-relaxed">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
