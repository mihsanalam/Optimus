"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
  Mail,
  MessageSquare,
  Loader2,
  Calendar,
  Send,
  Sliders,
  Play,
  ArrowLeft,
  ShieldCheck,
  Edit2,
  AlertCircle
} from "lucide-react";

type TabId = "dashboard" | "ai-agent" | "briefing" | "integrations" | "alerts" | "settings" | "pricing";

interface SidebarItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  bgClass: string;
}

export default function BriefingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  
  const { user, loading, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [briefing, setBriefing] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("");

  // Action Console States
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [recipient, setRecipient] = useState("");
  const [targetPlatform, setTargetPlatform] = useState("gmail");
  const [userInstructions, setUserInstructions] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftingLoading, setDraftingLoading] = useState(false);
  const [sendingLoading, setSendingLoading] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState("");

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
      bgClass: "bg-purple-500/10 text-purple-655 dark:text-purple-400 border border-purple-500/20"
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
      bgClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-405 border border-emerald-500/20"
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
      bgClass: "bg-zinc-500/10 text-zinc-650 dark:text-zinc-400 border border-zinc-550/20"
    }
  ];

  const pricingItem: SidebarItem = {
    id: "pricing",
    label: "Pricing Settings",
    icon: <CreditCard className="w-5 h-5" />,
    bgClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
  };

  const handleSidebarClick = (id: TabId) => {
    if (id === "briefing") {
      router.push("/briefing");
    } else if (id === "integrations") {
      router.push("/dashboard?tab=integrations");
    } else {
      router.push(`/dashboard?tab=${id}`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  // Fetch single briefing details
  useEffect(() => {
    const loadBriefing = async () => {
      try {
        const res = await fetch(`/api/briefing/details/${id}`);
        const data = await res.json();
        if (data.success) {
          setBriefing(data.briefing);
          
          // Set initial active category based on query parameters or first category found
          const cats = Object.keys(data.briefing.categories_data || {});
          if (cats.length > 0) {
            const initialCat = cats.find(c => c.toLowerCase() === initialCategory.toLowerCase()) || cats[0];
            setActiveCategory(initialCat);
            
            // Set the first item of this category as active context
            const items = data.briefing.categories_data[initialCat]?.items || [];
            if (items.length > 0) {
              selectActiveItem(items[0]);
            }
          }
        } else {
          console.error("Failed to load briefing details:", data.error);
        }
      } catch (err) {
        console.error("Error fetching briefing detail:", err);
      } finally {
        setPageLoading(false);
      }
    };

    if (id) {
      loadBriefing();
    }
  }, [id, initialCategory]);

  const selectActiveItem = (item: any) => {
    setSelectedItem(item);
    setSendSuccessMessage("");
    // Autofill recipient based on app type
    if (item.app === "gmail" || item.app === "outlook") {
      setTargetPlatform(item.app);
      // Try to parse out email address
      const emailMatch = item.title.match(/<(.+@.+)>/);
      setRecipient(emailMatch ? emailMatch[1] : "partner@example.com");
    } else {
      setTargetPlatform(item.app);
      setRecipient("+16505550199");
    }
  };

  // Generate AI Draft Response
  const generateAIDraft = async () => {
    if (!selectedItem && !briefing) return;
    setDraftingLoading(true);
    setSendSuccessMessage("");
    
    const contextText = selectedItem 
      ? `Platform: ${selectedItem.app.toUpperCase()} | Heading: ${selectedItem.title} | Details: ${selectedItem.description}`
      : `Briefing Summary Context: ${briefing.summary}`;

    try {
      const res = await fetch("/api/briefing/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: contextText,
          platform: targetPlatform,
          userInstructions: userInstructions
        })
      });

      const data = await res.json();
      if (data.success) {
        setDraftContent(data.reply);
      } else {
        alert("Draft generation failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error generating draft: " + err.message);
    } finally {
      setDraftingLoading(false);
    }
  };

  // Submit send action
  const handleSendDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !draftContent) {
      alert("Please specify a recipient and generate/write draft content first.");
      return;
    }

    setSendingLoading(true);
    try {
      const res = await fetch("/api/briefing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: targetPlatform,
          recipient,
          message: draftContent,
          userId: user?.id || null,
          gmailAccessToken: typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null,
          gmailRefreshToken: typeof window !== "undefined" ? localStorage.getItem("gmail_refresh_token") : null
        })
      });

      const data = await res.json();
      if (data.success) {
        setSendSuccessMessage(data.message || `Message dispatched via ${targetPlatform} successfully!`);
        setDraftContent("");
        setUserInstructions("");
      } else {
        alert("Sending failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error dispatching message: " + err.message);
    } finally {
      setSendingLoading(false);
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
        return <Mail className="w-4 h-4 text-blue-505" />;
      default:
        return <Sparkles className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex text-zinc-800 dark:text-zinc-150 overflow-hidden transition-colors duration-200">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-20 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* SIDEBAR */}
      <aside
        className={`border-r border-zinc-200 dark:border-zinc-900 bg-white/95 dark:bg-zinc-955/90 dark:bg-zinc-950/90 backdrop-blur-md flex flex-col justify-between transition-all duration-300 relative z-20 shrink-0 ${
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
                  <span className="block text-[8px] tracking-wider text-indigo-606 dark:text-indigo-400 font-bold uppercase">AI Hub</span>
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

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        <header className="h-20 border-b border-zinc-200 dark:border-zinc-900 px-8 flex items-center justify-between bg-white/40 dark:bg-zinc-950/20 backdrop-blur-sm relative z-10">
          <div className="flex items-center gap-3">
            <Link
              href="/briefing"
              className="p-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-550 dark:text-zinc-400 rounded-xl transition-all mr-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white capitalize">
              Briefing Analysis & Reply Console
            </h2>
          </div>
          <ThemeToggle />
        </header>

        {pageLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
            <p className="text-xs text-zinc-500">Decompressing communication logs...</p>
          </div>
        ) : !briefing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="p-4 bg-zinc-100 dark:bg-zinc-905 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Briefing Not Found</h3>
            <p className="text-xs text-zinc-500 max-w-xs">We could not retrieve the briefing payload matching that identifier.</p>
            <Link href="/briefing" className="px-5 py-2.5 bg-indigo-650 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700">
              Back to briefings
            </Link>
          </div>
        ) : (
          <div className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8 pb-16 animate-fadeIn">
            
            {/* BRIEFING BANNER */}
            <div className="bg-white/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 md:p-8 backdrop-blur-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-pink-500 uppercase tracking-widest bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20">
                    Compiled briefing
                  </span>
                  <h1 className="text-lg md:text-xl font-extrabold text-zinc-905 dark:text-white mt-2">
                    {briefing.title}
                  </h1>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 px-3.5 py-1.5 rounded-xl font-medium">
                  {new Date(briefing.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-xs md:text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed">
                {briefing.summary}
              </p>
            </div>

            {/* TWO-COLUMN DETAILS & ACTIONS WORKSPACE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT COLUMN: CATEGORIES & ITEMS (Lg: col-span-7) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Category selectors */}
                <div className="flex overflow-x-auto gap-2.5 pb-2 scrollbar-none border-b border-zinc-200 dark:border-zinc-900">
                  {Object.keys(briefing.categories_data || {}).map((catName) => {
                    const isActive = activeCategory === catName;
                    const catData = briefing.categories_data[catName];
                    return (
                      <button
                        key={catName}
                        onClick={() => {
                          setActiveCategory(catName);
                          // Select the first item of this category
                          const items = catData.items || [];
                          if (items.length > 0) {
                            selectActiveItem(items[0]);
                          } else {
                            setSelectedItem(null);
                          }
                        }}
                        className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? "bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-zinc-900 shadow-md"
                            : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 text-zinc-550 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-900/60"
                        }`}
                      >
                        {catName} ({catData.count || 0})
                      </button>
                    );
                  })}
                </div>

                {/* List items in active category */}
                <div className="space-y-4">
                  {briefing.categories_data[activeCategory]?.items && briefing.categories_data[activeCategory].items.length > 0 ? (
                    briefing.categories_data[activeCategory].items.map((item: any, idx: number) => {
                      const isSelected = selectedItem === item;
                      return (
                        <div
                          key={idx}
                          onClick={() => selectActiveItem(item)}
                          className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-indigo-500/5 border-indigo-500/40 dark:border-indigo-500/50 shadow-md shadow-indigo-500/5"
                              : "bg-white dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-800"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm shrink-0">
                                {renderAppIcon(item.app)}
                              </div>
                              <span className="text-xs font-bold text-zinc-900 dark:text-white capitalize">
                                {item.app}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                              {item.time}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white mt-3.5">
                            {item.title}
                          </h4>
                          
                          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1.5 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-zinc-500 text-center py-10">No items available under this category.</p>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: ACTION CONSOLE / AI DRAFTING (Lg: col-span-5) */}
              <div className="lg:col-span-5">
                <div className="bg-white dark:bg-zinc-900/20 border border-zinc-205 dark:border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-6 glow-border relative z-10 sticky top-6">
                  
                  <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 pb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                      <Bot className="w-4 h-4 text-indigo-500" />
                      AI Action Console
                    </h3>
                    {selectedItem && (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded">
                        Context Set
                      </span>
                    )}
                  </div>

                  {/* Context Preview box */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl text-[11px] leading-relaxed text-zinc-605 dark:text-zinc-400 space-y-1">
                    <span className="font-bold text-zinc-900 dark:text-zinc-300 block uppercase tracking-wide text-[8px]">
                      Selected Context
                    </span>
                    {selectedItem ? (
                      <>
                        <span className="font-bold text-zinc-800 dark:text-white">{selectedItem.title}</span>
                        <p className="line-clamp-2 mt-0.5">{selectedItem.description}</p>
                      </>
                    ) : (
                      <p>No item selected. Context defaults to the overall daily briefing summary.</p>
                    )}
                  </div>

                  {/* Send Form */}
                  <form onSubmit={handleSendDispatch} className="space-y-4">
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          Platform
                        </label>
                        <select
                          value={targetPlatform}
                          onChange={(e) => setTargetPlatform(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-indigo-550/50 rounded-xl py-2.5 px-3.5 text-xs text-zinc-805 dark:text-white outline-none cursor-pointer capitalize"
                        >
                          <option value="gmail">Gmail</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="slack">Slack</option>
                          <option value="outlook">Outlook</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          Recipient
                        </label>
                        <input
                          type="text"
                          required
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          placeholder="Email or phone"
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 focus:border-indigo-500/50 rounded-xl py-2.5 px-3.5 text-xs text-zinc-800 dark:text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                        AI Instructions (Tone, Details, etc.)
                      </label>
                      <textarea
                        rows={2}
                        value={userInstructions}
                        onChange={(e) => setUserInstructions(e.target.value)}
                        placeholder="e.g. Schedule a meeting for next Tuesday, keep it polite and concise."
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-indigo-500/50 rounded-xl p-3.5 text-xs text-zinc-800 dark:text-white outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={generateAIDraft}
                      disabled={draftingLoading}
                      className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {draftingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                      Generate AI Draft
                    </button>

                    {/* Previews and Draft edits */}
                    {draftContent && (
                      <div className="space-y-2 pt-2 animate-slideUp">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                          <Edit2 className="w-3 h-3 text-indigo-505" />
                          Review / Edit Message Draft
                        </label>
                        <textarea
                          rows={6}
                          value={draftContent}
                          onChange={(e) => setDraftContent(e.target.value)}
                          className="w-full bg-indigo-50/10 dark:bg-indigo-950/10 border border-indigo-500/20 rounded-xl p-3.5 text-xs text-zinc-850 dark:text-white focus:border-indigo-500/50 outline-none resize-none font-sans leading-relaxed"
                        />
                      </div>
                    )}

                    {draftContent && (
                      <button
                        type="submit"
                        disabled={sendingLoading}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-705 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {sendingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Send AI Compiled Message
                      </button>
                    )}

                    {/* Success notification */}
                    {sendSuccessMessage && (
                      <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-start gap-2.5 animate-fadeIn">
                        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                        <div>
                          <span className="font-bold">Dispatch Success</span>
                          <p className="mt-0.5">{sendSuccessMessage}</p>
                        </div>
                      </div>
                    )}

                  </form>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
