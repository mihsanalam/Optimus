"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  Mail,
  MessageSquare,
  Loader2,
  Send,
  ArrowLeft,
  AlertCircle,
  Clock,
  RefreshCw,
  AtSign,
  X,
  CheckCircle2
} from "lucide-react";

export default function BriefingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  
  const { user } = useAuth();
  const [briefing, setBriefing] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [waMessages, setWaMessages] = useState<any[]>([]);
  const [waLoading, setWaLoading] = useState(false);

  // Compose/Reply States
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [recipient, setRecipient] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [mentionText, setMentionText] = useState("");
  const [targetPlatform, setTargetPlatform] = useState("gmail");
  const [draftContent, setDraftContent] = useState("");
  const [draftingLoading, setDraftingLoading] = useState(false);
  const [sendingLoading, setSendingLoading] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  // Fetch single briefing details
  useEffect(() => {
    const loadBriefing = async () => {
      try {
        const res = await fetch(`/api/briefing/details/${id}`);
        const data = await res.json();
        if (data.success) {
          setBriefing(data.briefing);
          const cats = Object.keys(data.briefing.categories_data || {});
          if (cats.length > 0) {
            const initialCat = cats.find(c => c.toLowerCase() === initialCategory.toLowerCase()) || cats[0];
            setActiveCategory(initialCat);
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
    if (id) loadBriefing();
  }, [id, initialCategory]);

  // Fetch WhatsApp unread messages when Messages tab is active
  useEffect(() => {
    if (activeCategory === "Messages") {
      setWaLoading(true);
      fetch(`/api/whatsapp/unread?userId=${user?.id || "default_user"}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.messages?.length > 0) {
            setWaMessages(data.messages);
          }
        })
        .catch(console.error)
        .finally(() => setWaLoading(false));
    }
  }, [activeCategory, user?.id]);

  const handleReplyClick = (item: any) => {
    setSelectedItem(item);
    setSendSuccessMessage("");
    setDraftContent("");
    setMentionText("");
    const isEmail = item.app === "gmail" || item.app === "outlook";
    setTargetPlatform(item.app || "gmail");
    if (isEmail) {
      // Extract email from "Name <email@example.com>" format
      const emailMatch = (item.sender || item.title || "").match(/<(.+@.+)>/);
      const rawEmail = emailMatch ? emailMatch[1] : (item.sender || "recipient@example.com");
      setRecipient(rawEmail.includes("@") ? rawEmail : "recipient@example.com");
      setReplySubject(`Re: ${item.subject || item.title || "Your message"}`);
    } else {
      const phone = item.phone || item.from || "+16505550199";
      setRecipient(phone);
      setReplySubject("");
    }
    setIsComposing(true);
  };

  const closeCompose = () => {
    setIsComposing(false);
    setDraftContent("");
    setMentionText("");
  };

  // Generate AI Draft Response
  const generateAIDraft = async () => {
    if (!selectedItem && !briefing) return;
    setDraftingLoading(true);
    setSendSuccessMessage("");
    const contextText = selectedItem
      ? `Platform: ${selectedItem.app?.toUpperCase()} | From: ${selectedItem.sender || selectedItem.title} | Subject: ${selectedItem.subject || selectedItem.title || "No Subject"} | Content: ${selectedItem.description || selectedItem.snippet}`
      : `Briefing: ${briefing.summary}`;
    try {
      const res = await fetch("/api/briefing/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: contextText, platform: targetPlatform })
      });
      const data = await res.json();
      if (data.success) setDraftContent(data.reply);
      else alert("Draft generation failed: " + data.error);
    } catch (err: any) {
      alert("Error generating draft: " + err.message);
    } finally {
      setDraftingLoading(false);
    }
  };

  // Submit send
  const handleSendDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const msgToSend = targetPlatform === "whatsapp" && mentionText
      ? `@${mentionText} ${draftContent}` : draftContent;
    if (!recipient || !msgToSend) {
      alert("Please specify a recipient and write/generate a message first.");
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
          message: msgToSend,
          userId: user?.id || null,
          gmailAccessToken: typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null,
          gmailRefreshToken: typeof window !== "undefined" ? localStorage.getItem("gmail_refresh_token") : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setSendSuccessMessage(data.message || `Sent via ${targetPlatform}!`);
        setDraftContent("");
        setMentionText("");
        
        // Remove the box corresponding to the item we just replied to
        if (selectedItem) {
          if (activeCategory === "Messages") {
            setWaMessages(prev => prev.filter(msg => msg !== selectedItem));
          }
          setBriefing((prev: any) => {
            if (!prev) return prev;
            const updatedCategories = { ...prev.categories_data };
            if (updatedCategories[activeCategory]) {
              const currentItems = updatedCategories[activeCategory].items || [];
              updatedCategories[activeCategory] = {
                ...updatedCategories[activeCategory],
                items: currentItems.filter((item: any) => item !== selectedItem),
                count: Math.max(0, (updatedCategories[activeCategory].count || 0) - 1)
              };
            }
            return {
              ...prev,
              categories_data: updatedCategories
            };
          });
        }

        setTimeout(() => { 
          setIsComposing(false); 
          setSendSuccessMessage("");
          setSelectedItem(null);
        }, 2500);
      } else {
        alert("Sending failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error dispatching: " + err.message);
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
        return <Mail className="w-4 h-4 text-blue-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Back button and breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/briefing"
          className="p-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-550 dark:text-zinc-400 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">Back to Briefings</span>
      </div>

      {pageLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#7c3aed]" />
          <p className="text-xs text-zinc-500">Decompressing communication logs...</p>
        </div>
      ) : !briefing ? (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 py-20">
          <div className="p-4 bg-zinc-100 dark:bg-zinc-905 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Briefing Not Found</h3>
          <p className="text-xs text-zinc-500 max-w-xs">We could not retrieve the briefing payload matching that identifier.</p>
          <Link href="/briefing" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700">
            Back to briefings
          </Link>
        </div>
      ) : (
        <div className="w-full space-y-6 animate-fadeIn">
          {/* BRIEFING BANNER */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl shrink-0">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                {/* Category count tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {Object.entries(briefing.categories_data || {}).map(([cat, val]: [string, any]) => {
                    const count = val?.count || 0;
                    if (count === 0) return null;
                    const colors: Record<string, string> = {
                      Email: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                      Messages: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
                      Mentions: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
                      Tasks: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                      "Follow-Ups": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                    };
                    return (
                      <span key={cat} className={`text-[11px] font-bold px-3 py-1 rounded-full ${colors[cat] || "bg-zinc-100 text-zinc-600"}`}>
                        {count} {cat}
                      </span>
                    );
                  })}
                </div>
                <h1 className="text-base md:text-lg font-extrabold text-zinc-900 dark:text-white leading-snug">{briefing.title}</h1>
                <p className="text-sm text-zinc-605 dark:text-zinc-400 mt-2 leading-relaxed">{briefing.summary}</p>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: CATEGORIES */}
            <div className="lg:col-span-3 space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3 pl-1">Categories</h3>
              {[
                { name: "Email", icon: <Mail className="w-4 h-4" />, active: "text-blue-600", activeBg: "bg-blue-50 dark:bg-blue-900/20", countBg: "bg-blue-100 text-blue-700", hover: "hover:bg-blue-50/60 dark:hover:bg-blue-900/10" },
                { name: "Messages", icon: <MessageSquare className="w-4 h-4" />, active: "text-emerald-600", activeBg: "bg-emerald-50 dark:bg-emerald-900/20", countBg: "bg-emerald-100 text-emerald-700", hover: "hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10" },
                { name: "Mentions", icon: <AtSign className="w-4 h-4" />, active: "text-purple-600", activeBg: "bg-purple-50 dark:bg-purple-900/20", countBg: "bg-purple-100 text-purple-700", hover: "hover:bg-purple-50/60 dark:hover:bg-purple-900/10" },
                { name: "Tasks", icon: <CheckCircle2 className="w-4 h-4" />, active: "text-amber-600", activeBg: "bg-amber-50 dark:bg-amber-900/20", countBg: "bg-amber-100 text-amber-700", hover: "hover:bg-amber-50/60 dark:hover:bg-amber-900/10" },
                { name: "Follow-Ups", icon: <RefreshCw className="w-4 h-4" />, active: "text-red-600", activeBg: "bg-red-50 dark:bg-red-900/20", countBg: "bg-red-100 text-red-700", hover: "hover:bg-red-50/60 dark:hover:bg-red-900/10" },
              ].map((cat) => {
                const catData = briefing?.categories_data?.[cat.name] || { count: 0 };
                const waCount = cat.name === "Messages" ? waMessages.length : 0;
                const totalCount = (catData.count || 0) + waCount;
                const isActive = activeCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => { setActiveCategory(cat.name); setIsComposing(false); }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer ${
                      isActive ? `${cat.activeBg} ${cat.active} shadow-sm` : `text-zinc-650 dark:text-zinc-400 ${cat.hover}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${isActive ? cat.active : "text-zinc-400"}`}>{cat.icon}</div>
                      <span className={`font-semibold text-sm ${isActive ? "text-zinc-900 dark:text-white" : ""}`}>{cat.name}</span>
                    </div>
                    {totalCount > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.countBg}`}>{totalCount}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* RIGHT: ITEMS + COMPOSE */}
            <div className="lg:col-span-9 space-y-4">
              {/* Category header */}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  activeCategory === "Email" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-500" :
                  activeCategory === "Messages" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500" :
                  activeCategory === "Mentions" ? "bg-purple-50 dark:bg-purple-900/20 text-purple-500" :
                  activeCategory === "Tasks" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-500" :
                  "bg-red-50 dark:bg-red-900/20 text-red-500"
                }`}>
                  {activeCategory === "Email" ? <Mail className="w-5 h-5" /> :
                   activeCategory === "Messages" ? <MessageSquare className="w-5 h-5" /> :
                   activeCategory === "Mentions" ? <AtSign className="w-5 h-5" /> :
                   activeCategory === "Tasks" ? <CheckCircle2 className="w-5 h-5" /> :
                   <RefreshCw className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white">{activeCategory || "Category"}</h2>
                  <p className="text-xs text-zinc-550">
                    {activeCategory === "Messages"
                      ? `${(briefing?.categories_data?.[activeCategory]?.count || 0) + waMessages.length} items`
                      : `${briefing?.categories_data?.[activeCategory]?.count || 0} items`}
                  </p>
                </div>
              </div>

              {/* COMPOSE MODAL (overlay style) */}
              {isComposing && selectedItem && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-lg relative animate-fadeIn">
                  <button onClick={closeCompose} className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <X className="w-5 h-5" />
                  </button>

                  {/* Email compose */}
                  {(targetPlatform === "gmail" || targetPlatform === "outlook") ? (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white">Compose Email Reply</h3>
                      {/* Replying to bar */}
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-650 dark:text-zinc-400">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">Replying to:</span>{" "}
                        {selectedItem.sender || selectedItem.title} — {selectedItem.subject || selectedItem.title}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 ml-1">To</label>
                        <input type="email" value={recipient} onChange={e => setRecipient(e.target.value)}
                          className="w-full p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-blue-400 transition-colors" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 ml-1">Subject</label>
                        <input type="text" value={replySubject} onChange={e => setReplySubject(e.target.value)}
                          className="w-full p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-blue-400 transition-colors" />
                      </div>
                      <div className="space-y-1 relative">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-zinc-500 ml-1">Message</label>
                          <button onClick={generateAIDraft} disabled={draftingLoading}
                            className="text-xs font-bold text-purple-650 dark:text-purple-400 flex items-center gap-1.5 hover:text-purple-800 cursor-pointer">
                            {draftingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            Draft with AI
                          </button>
                        </div>
                        <textarea rows={6}
                          placeholder="Write your reply, or click 'Draft with AI' to get a suggestion..."
                          value={draftContent} onChange={e => setDraftContent(e.target.value)}
                          className="w-full p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-blue-400 resize-none transition-colors" />
                      </div>
                      {sendSuccessMessage && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                          ✓ {sendSuccessMessage}
                        </div>
                      )}
                      <div className="flex justify-end pt-1">
                        <button onClick={handleSendDispatch} disabled={sendingLoading || !draftContent}
                          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-colors">
                          {sendingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Send Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* WhatsApp / Message compose */
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-500" /> Compose WhatsApp Reply
                      </h3>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-955 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-650 dark:text-zinc-400">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">Replying to:</span>{" "}
                        {selectedItem.sender || selectedItem.title}
                        {selectedItem.isGroup && <span className="ml-2 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Group</span>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 ml-1">To (phone / group ID)</label>
                        <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)}
                          className="w-full p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-emerald-400 transition-colors" />
                      </div>
                      {selectedItem.isGroup && (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-500 ml-1 flex items-center gap-1">
                            <AtSign className="w-3 h-3" /> Mention someone (optional)
                          </label>
                          <input type="text" placeholder="e.g. John" value={mentionText} onChange={e => setMentionText(e.target.value)}
                            className="w-full p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-emerald-400 transition-colors" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-zinc-500 ml-1">Message</label>
                          <button onClick={generateAIDraft} disabled={draftingLoading}
                            className="text-xs font-bold text-purple-650 dark:text-purple-400 flex items-center gap-1.5 hover:text-purple-800 cursor-pointer">
                            {draftingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            Draft with AI
                          </button>
                        </div>
                        <textarea rows={5}
                          placeholder="Write your WhatsApp message..."
                          value={draftContent} onChange={e => setDraftContent(e.target.value)}
                          className="w-full p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-emerald-400 resize-none transition-colors" />
                        {mentionText && draftContent && (
                          <p className="text-xs text-zinc-400 ml-1">Will send as: <span className="text-emerald-600 font-medium">@{mentionText} {draftContent.slice(0, 40)}...</span></p>
                        )}
                      </div>
                      {sendSuccessMessage && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                          ✓ {sendSuccessMessage}
                        </div>
                      )}
                      <div className="flex justify-end pt-1">
                        <button onClick={handleSendDispatch} disabled={sendingLoading || !draftContent}
                          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-colors">
                          {sendingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Send Message
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ITEMS LIST */}
              <div className="space-y-3">
                {/* WhatsApp messages shown under Messages tab */}
                {activeCategory === "Messages" && waLoading && (
                  <div className="flex items-center gap-2 p-4 text-xs text-zinc-500">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> Loading WhatsApp messages...
                  </div>
                )}
                {activeCategory === "Messages" && waMessages.map((msg: any, idx: number) => (
                  <div key={`wa_${idx}`} className={`p-5 bg-white dark:bg-zinc-900 border ${selectedItem === msg && isComposing ? "border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/10" : "border-zinc-200 dark:border-zinc-800"} rounded-2xl flex flex-col gap-3 transition-all shadow-sm`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
                          <MessageSquare className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-905 dark:text-white">{msg.sender || msg.title}</h4>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                            <span>WhatsApp</span>
                            {msg.isGroup && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">Group</span>}
                            <span className="text-[10px] text-zinc-400">• {msg.source === "live" ? "Live" : "Sandbox"}</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-zinc-500 shrink-0 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" /> {msg.time}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">{msg.description || msg.snippet}</p>
                    <div className="flex justify-end">
                      <button onClick={() => handleReplyClick({ ...msg, app: "whatsapp", sender: msg.sender || msg.title })}
                        className="px-4 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-900/30 cursor-pointer transition-colors shadow-sm">
                        <Send className="w-3 h-3" /> Reply
                      </button>
                    </div>
                  </div>
                ))}

                {/* Briefing category items */}
                {briefing?.categories_data?.[activeCategory]?.items?.length > 0 ? (
                  briefing.categories_data[activeCategory].items.map((item: any, idx: number) => {
                    const isEmail = item.app === "gmail" || item.app === "outlook";
                    const senderDisplay = item.sender || item.author || item.from || item.app;
                    const emailAddr = (() => {
                      const m = (item.sender || item.title || "").match(/<(.+@.+)>/);
                      return m ? m[1] : (item.email || "");
                    })();
                    return (
                      <div key={idx} className={`p-5 bg-white dark:bg-zinc-900 border ${selectedItem === item && isComposing ? "border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/10" : "border-zinc-200 dark:border-zinc-800"} rounded-2xl flex flex-col gap-3 transition-all shadow-sm`}>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${isEmail ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"}`}>
                              {isEmail ? <Mail className="w-4 h-4 text-red-500" /> : <MessageSquare className="w-4 h-4 text-blue-500" />}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">{item.subject || item.title}</h4>
                              <p className="text-xs text-zinc-500 mt-0.5">{senderDisplay}{emailAddr && ` <${emailAddr}>`}</p>
                            </div>
                          </div>
                          <span className="text-[11px] text-zinc-500 shrink-0 flex items-center gap-1 font-medium mt-0.5">
                            <Clock className="w-3 h-3" /> {item.time || "—"}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed line-clamp-2">{item.description || item.snippet || item.summary}</p>
                        <div className="flex justify-end">
                          <button onClick={() => handleReplyClick({ ...item, sender: senderDisplay, email: emailAddr })}
                            className="px-4 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold flex items-center gap-1.5 border border-blue-100 dark:border-blue-900/30 cursor-pointer transition-colors shadow-sm">
                            <Send className="w-3 h-3" /> Reply
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  activeCategory !== "Messages" && (
                    <div className="p-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-center">
                      <p className="text-sm text-zinc-500">No items available under this category.</p>
                    </div>
                  )
                )}

                {activeCategory === "Messages" && !waLoading && waMessages.length === 0 && (briefing?.categories_data?.["Messages"]?.items || []).length === 0 && (
                  <div className="p-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-center">
                    <p className="text-sm text-zinc-500">No WhatsApp messages found. Connect WhatsApp in Integrations to see live messages.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
