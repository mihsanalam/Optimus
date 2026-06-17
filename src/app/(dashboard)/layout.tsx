"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { DashboardProvider, useDashboardContext } from "@/context/DashboardContext";
import {
  LayoutDashboard,
  FileText,
  Bot,
  Sliders,
  Link2,
  Bell,
  Globe,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  CheckCircle2,
} from "lucide-react";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { alerts } = useDashboardContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeTab = pathname === "/dashboard" ? "dashboard" : pathname.split("/").pop();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, bgClass: "bg-teal-500/10 text-teal-600 border border-teal-500/20" },
    { id: "briefings", label: "Briefings", href: "/briefings", icon: <FileText className="w-5 h-5" />, bgClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" },
    { id: "ai-agent", label: "AI Agent", href: "/ai-agent", icon: <Bot className="w-5 h-5" />, bgClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20" },
    { id: "workspace", label: "Workspace", href: "/workspace", icon: <Sliders className="w-5 h-5" />, bgClass: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20" },
    { id: "integrations", label: "Integrations", href: "/integrations", icon: <Link2 className="w-5 h-5" />, bgClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" },
    { id: "alerts", label: "Alerts", href: "/alerts", icon: <Bell className="w-5 h-5" />, bgClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" },
    { id: "news-reader", label: "News Reader", href: "/news-reader", icon: <Globe className="w-5 h-5" />, bgClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20" },
    { id: "settings", label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" />, bgClass: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20" }
  ];

  const pricingItem = {
    id: "pricing", label: "Pricing Settings", href: "/pricing", icon: <CreditCard className="w-5 h-5" />, bgClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="h-screen w-full bg-background flex text-zinc-800 dark:text-zinc-150 overflow-hidden transition-colors duration-200">
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-20 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <aside className={`border-r border-zinc-200 dark:border-zinc-900 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-md flex flex-col justify-between transition-all duration-300 relative z-20 shrink-0 h-full overflow-y-auto ${isCollapsed ? "w-20" : "w-64"}`}>
        <div>
          <div className="flex h-20 items-center justify-between px-5 border-b border-zinc-200 dark:border-zinc-900/60">
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <img src="/logo.png" alt="Optimus Logo" className="w-8 h-8 rounded-xl object-cover border border-zinc-200 dark:border-zinc-850 shrink-0 shadow-md shadow-accent/10" />
              {!isCollapsed && (
                <div className="truncate">
                  <span className="text-base font-bold tracking-tight text-zinc-905 dark:text-white block">Optimus</span>
                  <span className="block text-[8px] tracking-wider text-accent dark:text-accent font-bold uppercase">AI Hub</span>
                </div>
              )}
            </Link>
            {!isCollapsed && (
              <button onClick={() => setIsCollapsed(true)} className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900 text-zinc-550 dark:text-zinc-450 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
          <nav className="p-4 space-y-2.5">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              const pendingAlerts = alerts.filter(a => a.status === "Pending").length;
              return (
                <Link key={item.id} href={item.href} className={`w-full flex items-center p-2 rounded-3xl transition-all duration-200 cursor-pointer relative mx-auto ${isCollapsed ? "justify-center max-w-[64px]" : "justify-start px-3"} ${isActive ? "bg-zinc-100/80 dark:bg-zinc-800/50 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50" : "bg-transparent border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/40"}`}>
                  <div className="flex items-center gap-3.5 min-w-0 w-full relative">
                    <div className={`p-2.5 rounded-2xl shrink-0 ${item.bgClass} relative z-10 transition-transform ${isActive ? "scale-105" : ""}`}>
                      {item.icon}
                      {item.id === "alerts" && pendingAlerts > 0 && (
                        <span className="absolute -left-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 shrink-0 z-20 shadow-sm">
                          {pendingAlerts}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <span className={`text-xs font-semibold tracking-wide truncate transition-colors ${isActive ? "text-zinc-900 dark:text-white" : "text-zinc-550 dark:text-zinc-400"}`}>{item.label}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-900/60 space-y-4">
          <Link href={pricingItem.href} className={`w-full flex items-center gap-3.5 p-3 rounded-2xl transition-all duration-200 cursor-pointer ${activeTab === pricingItem.id ? "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-md dark:shadow-lg" : "bg-transparent border border-transparent text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40"}`}>
            <div className={`p-2.5 rounded-xl shrink-0 ${pricingItem.bgClass}`}>
              {pricingItem.icon}
            </div>
            {!isCollapsed && <span className="text-xs font-semibold tracking-wide">{pricingItem.label}</span>}
          </Link>
          {isCollapsed && (
            <button onClick={() => setIsCollapsed(false)} className="w-full flex justify-center py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer">
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          {!isCollapsed && user && (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 block truncate">{user.profile?.name || user.email.split("@")[0]}</span>
                  <span className="text-[8px] text-zinc-550 dark:text-zinc-650 block truncate">{user.email}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 p-1.5 transition-colors cursor-pointer">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto relative z-10">
        <header className="h-20 border-b border-zinc-200 dark:border-zinc-900 px-8 flex items-center justify-between bg-white/40 dark:bg-zinc-950/20 backdrop-blur-sm relative z-10 transition-colors duration-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-zinc-200 dark:border-zinc-800 pr-4">
              <img src="/logo.png" alt="Optimus Logo" className="w-7 h-7 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800 shrink-0 shadow-sm" />
              <span className="font-extrabold text-[10px] tracking-widest bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent uppercase select-none">Optimus</span>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white capitalize">
                {activeTab?.replace("-", " ") || "Dashboard"}
              </h2>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/alerts" className="relative p-2 text-zinc-500 hover:text-zinc-905 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
              <Bell className="w-4 h-4" />
              {alerts.filter(a => a.status === "Pending").length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-zinc-950 shrink-0">
                  {alerts.filter(a => a.status === "Pending").length}
                </span>
              )}
            </Link>
            <ThemeToggle />
            {user ? (
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-zinc-605 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 px-3 py-1.5 rounded-xl">
                <span>InsForge Authed</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-450" />
              </div>
            ) : (
              <Link href="/sign-in" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10">Log In</Link>
            )}
          </div>
        </header>

        <div className="flex-1 p-8 relative z-10 max-w-7xl w-full mx-auto space-y-8 animate-fadeIn">
          {/* Guest Preview Alert banner */}
          {!user && (
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-955/15 dark:bg-indigo-950/15 border border-indigo-100 dark:border-indigo-900/25 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="text-xs text-zinc-600 dark:text-zinc-350">
                  You are viewing the dashboard in <span className="font-semibold text-zinc-900 dark:text-white">Preview Mode</span>. Sign up or log in to sync active workflows to your PostgreSQL table.
                </p>
              </div>
              <Link href="/sign-up" className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all shrink-0">Sign Up Now</Link>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
