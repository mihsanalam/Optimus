"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { insforge } from "@/lib/insforge";
import ThemeToggle from "@/components/layout/ThemeToggle";
import {
  LayoutDashboard,
  Bot,
  Sparkles,
  Link2,
  Bell,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Mail,
  MessageSquare,
  Loader2,
  Calendar,
  Clock,
  Eye,
  Send,
  Sliders,
  Play
} from "lucide-react";

type TabId = "dashboard" | "ai-agent" | "briefing" | "integrations" | "alerts" | "settings" | "pricing";

interface SidebarItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  bgClass: string;
}

export default function BriefingPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  // Sidebar Menu Items
  const menuItems: SidebarItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      bgClass: "bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20"
    },
    {
      id: "ai-agent",
      label: "AI Agent",
      icon: <Bot className="w-5 h-5" />,
      bgClass: "bg-purple-500/10 text-purple-650 dark:text-purple-400 border border-purple-500/20"
    },
    {
      id: "briefing",
      label: "Briefing",
      icon: <Sparkles className="w-5 h-5" />,
      bgClass: "bg-pink-500/10 text-pink-650 dark:text-pink-400 border border-pink-500/20"
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: <Link2 className="w-5 h-5" />,
      bgClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
    },
    {
      id: "alerts",
      label: "Alerts",
      icon: <Bell className="w-5 h-5" />,
      bgClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      bgClass: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-550/20"
    }
  ];

  const pricingItem: SidebarItem = {
    id: "pricing",
    label: "Pricing Settings",
    icon: <CreditCard className="w-5 h-5" />,
    bgClass: "bg-cyan-500/10 text-cyan-650 dark:text-cyan-400 border border-cyan-500/20"
  };

  const handleSidebarClick = (id: TabId) => {
    if (id === "briefing") return;
    if (id === "integrations") {
      router.push("/dashboard?tab=integrations");
    } else {
      router.push(`/dashboard?tab=${id}`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

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
        setBriefings(dataBriefings.briefings);
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

  // Trigger Cron simulation
  const runCronPoll = async () => {
    setCronRunning(true);
    try {
      const res = await fetch("/api/briefing/cron", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Cron executed successfully.");
        // Reload details
        setTimeout(fetchData, 2000);
      } else {
        alert("Cron execution failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error triggering cron: " + err.message);
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
        return <Mail className="w-4 h-4 text-red-500" />;
      case "whatsapp":
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case "slack":
        return <MessageSquare className="w-4 h-4 text-pink-500" />;
      case "outlook":
        return <Mail className="w-4 h-4 text-blue-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-zinc-400" />;
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
    <div className="min-h-screen w-full bg-background flex text-zinc-800 dark:text-zinc-150 overflow-hidden transition-colors duration-200">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-20 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* SIDEBAR */}
      <aside
        className={`border-r border-zinc-200 dark:border-zinc-900 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-md flex flex-col justify-between transition-all duration-300 relative z-20 shrink-0 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div>
          <div className="flex h-20 items-center justify-between px-5 border-b border-zinc-200 dark:border-zinc-900/60">
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <img
                src="/logo.png"
                alt="Optimus Logo"
                className="w-8 h-8 rounded-xl object-cover border border-zinc-200 dark:border-zinc-850 shrink-0 shadow-md shadow-indigo-500/10"
              />
              {!isCollapsed && (
                <div className="truncate">
                  <span className="text-base font-bold tracking-tight text-zinc-905 dark:text-white block">Optimus</span>
                  <span className="block text-[8px] tracking-wider text-indigo-605 dark:text-indigo-400 font-bold uppercase">AI Hub</span>
                </div>
              )}
            </Link>
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900 text-zinc-550 dark:text-zinc-450 hover:text-zinc-955 dark:hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          <nav className="p-4 space-y-2.5">
            {menuItems.map((item) => {
              const isActive = item.id === "briefing";
              return (
                <button
                  key={item.id}
                  onClick={() => handleSidebarClick(item.id)}
                  className={`w-full flex items-center gap-3.5 p-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-md dark:shadow-lg"
                      : "bg-transparent border border-transparent text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${item.bgClass}`}>
                    {item.icon}
                  </div>
                  {!isCollapsed && (
                    <span className="text-xs font-semibold tracking-wide">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-900/60 space-y-4">
          <button
            onClick={() => handleSidebarClick("pricing")}
            className={`w-full flex items-center gap-3.5 p-3 rounded-2xl transition-all duration-200 cursor-pointer ${
              false
                ? "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-md"
                : "bg-transparent border border-transparent text-zinc-550 dark:text-zinc-450 hover:text-zinc-905 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40"
            }`}
            title={isCollapsed ? pricingItem.label : undefined}
          >
            <div className={`p-2.5 rounded-xl shrink-0 ${pricingItem.bgClass}`}>
              {pricingItem.icon}
            </div>
            {!isCollapsed && (
              <span className="text-xs font-semibold tracking-wide">{pricingItem.label}</span>
            )}
          </button>

          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-full flex justify-center py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {!isCollapsed && user && (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 block truncate">
                    {user.profile?.name || user.email.split("@")[0]}
                  </span>
                  <span className="text-[8px] text-zinc-550 dark:text-zinc-550 block truncate">{user.email}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-zinc-400 hover:text-red-500 dark:text-zinc-550 dark:hover:text-red-400 p-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        {/* Header */}
        <header className="h-20 border-b border-zinc-200 dark:border-zinc-900 px-8 flex items-center justify-between bg-white/40 dark:bg-zinc-955/20 dark:bg-zinc-950/20 backdrop-blur-sm relative z-10 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white capitalize">
              Briefing Workspace
            </h2>
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-zinc-650 dark:text-zinc-405 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 px-3 py-1.5 rounded-xl">
              <span>System Active</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-450" />
            </div>
          </div>
        </header>

        {/* Content View */}
        <div className="flex-1 p-8 relative z-10 max-w-7xl w-full mx-auto space-y-8 animate-fadeIn pb-16">
          
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 backdrop-blur-md">
            <div>
              <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight sm:text-2xl">
                AI Orchestrated Briefings
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Synthesize messages, alerts, and calendar activities automatically in the background.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* Trigger Cron simulation button */}
              <button
                onClick={runCronPoll}
                disabled={cronRunning}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-105 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Manually simulate Trigger.dev 15m polling check"
              >
                {cronRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Trigger Cron Poll
              </button>
              
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-indigo-650 hover:from-pink-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-500/10 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Custom Briefing
              </button>
            </div>
          </div>

          {briefingLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
              <p className="text-xs text-zinc-500">Compiling database summaries and schedules...</p>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* TOP / HIGHLIGHTED DAILY BRIEFING */}
              {topBriefing ? (
                <div className="bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-zinc-950/20 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-zinc-950/30 border border-indigo-500/20 rounded-3xl p-8 space-y-6 glow-border relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-500/10 to-transparent pointer-events-none" />
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                        <Sparkles className="w-3 h-3 text-pink-500 shrink-0" />
                        Top Highlights
                      </span>
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
                        {topBriefing.title}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Generated {new Date(topBriefing.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span className="text-zinc-300">|</span>
                      <Link
                        href={`/briefing/${topBriefing.id}`}
                        className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed max-w-4xl">
                    {topBriefing.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-zinc-200 dark:border-indigo-950/40">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {Object.keys(topBriefing.categories_data || {}).map((cat, idx) => {
                        const items = topBriefing.categories_data[cat].items || [];
                        const app = items[0]?.app || "gmail";
                        return (
                          <div 
                            key={idx}
                            className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow"
                          >
                            {renderAppIcon(app)}
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-xs font-semibold text-zinc-500">
                      Aggregating {Object.keys(topBriefing.categories_data || {}).length} categories across connected platforms.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-white/40 dark:bg-zinc-900/10 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">No briefings compiled yet</h3>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 max-w-sm">
                    Connect apps and create a scheduled briefing. You can also trigger the Cron Poll manually to verify.
                  </p>
                </div>
              )}

              {/* GROUPED CATEGORIES GRID */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-550 dark:text-zinc-400 mb-5">
                  Briefings By Category Group
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { key: "Email", icon: <Mail className="w-5 h-5" />, color: "text-red-500 bg-red-500/10 border-red-500/20" },
                    { key: "Messages", icon: <MessageSquare className="w-5 h-5" />, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
                    { key: "Mentions", icon: <Sparkles className="w-5 h-5" />, color: "text-pink-500 bg-pink-500/10 border-pink-500/20" },
                    { key: "Tasks", icon: <CheckCircle2 className="w-5 h-5" />, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
                    { key: "Follow-ups", icon: <RefreshCw className="w-5 h-5" />, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" }
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
                        className={`p-6 bg-white dark:bg-zinc-900/25 border border-zinc-200 dark:border-zinc-900 rounded-3xl space-y-4 glow-border transition-all duration-200 ${
                          isClickable 
                            ? "hover:border-zinc-350 dark:hover:border-zinc-800 hover:shadow-lg dark:hover:shadow-2xl/40 cursor-pointer" 
                            : "opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`p-2.5 rounded-xl border ${catItem.color}`}>
                            {catItem.icon}
                          </div>
                          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                            data.count > 0 
                              ? "bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20" 
                              : "bg-zinc-100 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-900"
                          }`}>
                            {data.count} {data.count === 1 ? "Item" : "Items"}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white capitalize">{catItem.key}</h4>
                          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-2 leading-relaxed line-clamp-3">
                            {data.summary}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BACKGROUND RUNS LOGS & SCHEDULES */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Schedules Column */}
                <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-550 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-850 pb-4">
                    Active Briefing Schedules
                  </h3>

                  {schedules.length > 0 ? (
                    <div className="space-y-4">
                      {schedules.map((sched) => (
                        <div 
                          key={sched.id}
                          className="p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850/50 bg-zinc-50/50 dark:bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white">{sched.name}</h4>
                            <p className="text-[10px] text-zinc-500 leading-normal">{sched.description || "No description provided."}</p>
                            <div className="flex flex-wrap items-center gap-2 pt-2">
                              {sched.selected_apps.map((app: string) => (
                                <span key={app} className="text-[9px] font-semibold bg-zinc-105 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-lg uppercase">
                                  {app}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col items-end shrink-0 text-right space-y-1">
                            <span className="text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              {sched.frequency}
                            </span>
                            <span className="text-[10px] text-zinc-550 dark:text-zinc-400 flex items-center gap-1 mt-1.5">
                              <Clock className="w-3 h-3 text-zinc-400" />
                              {sched.scheduled_time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 text-center py-6">No scheduled briefings established.</p>
                  )}
                </div>

                {/* History Column */}
                <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-550 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-850 pb-4">
                    Background Briefing History
                  </h3>

                  {briefings.length > 0 ? (
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                      {briefings.map((b) => (
                        <div 
                          key={b.id}
                          className="p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850/50 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-zinc-905 dark:text-white truncate">{b.title}</h4>
                            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-zinc-400" />
                              {new Date(b.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Link
                            href={`/briefing/${b.id}`}
                            className="p-2 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all shrink-0 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-550 text-center py-6">No historical runs recorded.</p>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

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
                  <div className="space-y-2 bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-850">
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
                    className="w-full bg-zinc-50 dark:bg-zinc-955 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-pink-500/50 rounded-xl py-2.5 px-3 text-xs text-zinc-805 dark:text-white outline-none cursor-pointer"
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
                    className="w-full bg-zinc-50 dark:bg-zinc-955 dark:bg-zinc-955 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-pink-500/50 rounded-xl py-2.5 px-3 text-xs text-zinc-805 dark:text-white outline-none cursor-pointer"
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
                className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-indigo-650 hover:from-pink-650 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-500/10 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
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
