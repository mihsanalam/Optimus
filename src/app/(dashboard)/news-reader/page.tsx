"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDashboardContext } from "@/context/DashboardContext";
import { Globe, Loader2, Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function NewsReaderPage() {
  const { user } = useAuth();
  const { customApiKey } = useDashboardContext();

  const [newsCategory, setNewsCategory] = useState("tech");
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [savedArticles, setSavedArticles] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  const [activeSummaries, setActiveSummaries] = useState<Record<string, string>>({});
  const [summarizingLink, setSummarizingLink] = useState<string | null>(null);

  const [linkedinDrafts, setLinkedinDrafts] = useState<Record<string, string>>({});
  const [linkedinTones, setLinkedinTones] = useState<Record<string, string>>({});
  const [draftingLink, setDraftingLink] = useState<string | null>(null);

  const fetchNewsFeed = async (cat: string) => {
    setNewsLoading(true);
    try {
      if (cat === "saved") {
        const url = user?.id ? `/api/news/saved?userId=${user.id}` : "/api/news/saved";
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setSavedArticles(data.articles);
        }
      } else {
        const res = await fetch(`/api/news?category=${cat}`);
        const data = await res.json();
        if (data.success) {
          setNewsArticles(data.articles);
        }
      }
    } catch (err) {
      console.error("Error fetching news:", err);
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsFeed(newsCategory);
  }, [newsCategory]);

  const handleSaveArticle = async (article: any) => {
    try {
      const res = await fetch("/api/news/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          link: article.link,
          description: article.description,
          source: article.source,
          pubDate: article.pubDate || article.pub_date,
          userId: user?.id || null
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Article bookmarked successfully!");
        if (newsCategory === "saved") {
          fetchNewsFeed("saved");
        }
      }
    } catch (err) {
      console.error("Failed to save article:", err);
    }
  };

  const handleUnsaveArticle = async (id: string) => {
    try {
      const res = await fetch(`/api/news/saved?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setSavedArticles((prev) => prev.filter((art) => art.id !== id));
      }
    } catch (err) {
      console.error("Failed to unsave article:", err);
    }
  };

  const handleSummarizeArticle = async (article: any) => {
    const link = article.link;
    if (activeSummaries[link]) {
      setActiveSummaries((prev) => {
        const copy = { ...prev };
        delete copy[link];
        return copy;
      });
      return;
    }

    setSummarizingLink(link);
    try {
      const prompt = `Summarize this tech/AI article in 3 short, actionable, bulleted sentences:
      Title: ${article.title}
      Description: ${article.description || "No description provided."}`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          systemInstruction: "You are an executive assistant. Summarize technical articles concisely.",
          customApiKey: customApiKey
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveSummaries((prev) => ({ ...prev, [link]: data.reply }));
      } else {
        setActiveSummaries((prev) => ({ ...prev, [link]: `⚠️ AI generation error: ${data.error || "Failed to generate summary."}` }));
      }
    } catch (err) {
      setActiveSummaries((prev) => ({ ...prev, [link]: "⚠️ Connection error generating summary." }));
    } finally {
      setSummarizingLink(null);
    }
  };

  const handleGenerateLinkedinPost = async (art: any, toneOverride?: string) => {
    const title = art.title || "Latest Tech/AI update";
    const link = art.link || "";
    const description = art.description || art.content || "";
    const tone = toneOverride || linkedinTones[link] || "professional";

    setDraftingLink(link);
    try {
      const response = await fetch("/api/ai/quick-write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "post",
          prompt: `Write a LinkedIn post about this article:
Title: ${title}
Description: ${description}
Link: ${link}`,
          tone: tone,
          customApiKey: customApiKey
        })
      });
      const data = await response.json();
      if (data.success && data.text) {
        setLinkedinDrafts((prev) => ({ ...prev, [link]: data.text }));
        toast.success("LinkedIn post generated!");
      } else {
        toast.error(data.error || "Failed to generate post");
      }
    } catch (err: any) {
      console.error("[LinkedIn Draft] Error:", err);
      toast.error("Error generating draft post");
    } finally {
      setDraftingLink(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-5">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500" />
            RSS News Reader
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Zero setup feed reader tracking Tech and AI trends.</p>
        </div>
        
        {/* Category selectors */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "ai", label: "AI & Models" },
            { id: "tech", label: "General Tech" },
            { id: "wired", label: "Wired News" },
            { id: "hn", label: "Hacker News" },
            { id: "saved", label: "Saved Articles" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setNewsCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                newsCategory === cat.id
                  ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/15"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-805 text-zinc-600 dark:text-zinc-400 hover:border-zinc-305 dark:hover:border-zinc-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {newsLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs text-zinc-500 animate-pulse">Syncing latest feed blocks...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: RSS Feeds */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Empty states */}
              {newsCategory === "saved" && savedArticles.length === 0 && (
                <div className="col-span-2 text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/20 dark:bg-zinc-900/10">
                  <p className="text-xs text-zinc-550 font-sans">No bookmarked articles yet. Save articles from the AI or Tech feeds to read them later!</p>
                </div>
              )}

              {newsCategory !== "saved" && newsArticles.length === 0 && (
                <div className="col-span-2 text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/20 dark:bg-zinc-900/10">
                  <p className="text-xs text-zinc-550 font-sans">No feed items found. Try switching categories or verify connection.</p>
                </div>
              )}

              {/* Render articles */}
              {(newsCategory === "saved" ? savedArticles : newsArticles).map((art, idx) => (
                <div key={art.id || idx} className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 flex flex-col justify-between glow-border hover:border-indigo-500/30 transition-all duration-200">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        art.source === "Hacker News" ? "bg-red-500/10 text-red-655 border-red-500/20" :
                        art.source === "Wired" ? "bg-blue-500/10 text-blue-655 border-blue-500/20" :
                        "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      }`}>
                        {art.source}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {art.pubDate || art.pub_date ? new Date(art.pubDate || art.pub_date).toLocaleDateString() : ""}
                      </span>
                    </div>

                    <a href={art.link} target="_blank" rel="noreferrer" className="text-xs font-bold text-zinc-900 dark:text-white hover:text-indigo-500 dark:hover:text-indigo-400 line-clamp-2 block transition-colors leading-snug">
                      {art.title}
                    </a>

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans line-clamp-3">
                      {art.description}
                    </p>

                    {activeSummaries[art.link] && (
                      <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-950 border border-indigo-500/20 rounded-xl space-y-2">
                        <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide">AI Brief Summary</p>
                        <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">{activeSummaries[art.link]}</p>
                      </div>
                    )}

                    {linkedinDrafts[art.link] && (
                      <div className="mt-3 p-3.5 bg-indigo-50/20 dark:bg-zinc-955 border border-indigo-500/20 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wide">LinkedIn Generated Draft</p>
                          <div className="flex items-center gap-1.5">
                            <select value={linkedinTones[art.link] || "insightful"} onChange={(e) => { const newTone = e.target.value; setLinkedinTones(prev => ({ ...prev, [art.link]: newTone })); handleGenerateLinkedinPost(art, newTone); }} className="text-[9px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-0.5 outline-none font-sans text-zinc-700 dark:text-zinc-300">
                              <option value="insightful">Insightful</option>
                              <option value="professional">Professional</option>
                              <option value="bold">Bold & Direct</option>
                              <option value="casual">Casual & Conversational</option>
                            </select>
                            <button onClick={() => { navigator.clipboard.writeText(linkedinDrafts[art.link]); toast.success("Draft copied to clipboard!"); }} className="text-[9px] text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-bold">Copy</button>
                          </div>
                        </div>
                        <textarea value={linkedinDrafts[art.link]} onChange={(e) => setLinkedinDrafts(prev => ({ ...prev, [art.link]: e.target.value }))} className="w-full h-32 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-[10px] text-zinc-700 dark:text-zinc-300 outline-none resize-y font-sans" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-150 dark:border-zinc-850 pt-4 mt-5 gap-2 flex-wrap">
                    {newsCategory === "saved" ? (
                      <button onClick={() => handleUnsaveArticle(art.id)} className="text-[10px] font-bold text-red-500 hover:text-red-655 flex items-center gap-1 cursor-pointer bg-transparent border-0">Remove Bookmark</button>
                    ) : (
                      <button onClick={() => handleSaveArticle(art)} className="text-[10px] font-bold text-zinc-500 hover:text-indigo-500 flex items-center gap-1 cursor-pointer bg-transparent border-0">Save Article</button>
                    )}
                    <div className="flex gap-3">
                      <button onClick={() => handleGenerateLinkedinPost(art)} disabled={draftingLink === art.link} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-650 flex items-center gap-1 cursor-pointer bg-transparent border-0 disabled:opacity-50">
                        {draftingLink === art.link ? <><Loader2 className="w-3 h-3 animate-spin" /> Drafting...</> : <><Bot className="w-3 h-3" /> {linkedinDrafts[art.link] ? "Hide Draft" : "Make LinkedIn Post"}</>}
                      </button>
                      <button onClick={() => handleSummarizeArticle(art)} disabled={summarizingLink === art.link} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer bg-transparent border-0 disabled:opacity-50">
                        {summarizingLink === art.link ? <><Loader2 className="w-3 h-3 animate-spin" /> Summarizing...</> : <><Sparkles className="w-3 h-3" /> {activeSummaries[art.link] ? "Hide Summary" : "AI Summarize"}</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: LinkedIn Trending */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-150 dark:border-zinc-900 pb-3">
                <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">LinkedIn Trending</h4>
                  <p className="text-[10px] text-zinc-500">Real-time professional engagement index</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { title: "Agentic AI workflows surge in enterprise systems", desc: "AI orchestration and multi-agent coordination frameworks are taking over manual operations, boosting productivity by 40%.", stat: "Trending #1 in Tech • 12.4k shares", link: "https://example.com/linkedin-trending-1" },
                  { title: "Is local-first engineering the future of web dev?", desc: "Developers are shifting from heavy cloud-dependent architectures to client-side databases and local-first syncing engines.", stat: "Trending #2 in Development • 9.2k shares", link: "https://example.com/linkedin-trending-2" },
                  { title: "Next.js 15: Standardizing Server Actions at scale", desc: "Vercel's latest framework changes introduce new standards for data mutation and form submission safety guards.", stat: "Trending #3 in Frontend • 7.5k shares", link: "https://example.com/linkedin-trending-3" }
                ].map((trend, tIdx) => {
                  const mockArticle = { title: trend.title, description: trend.desc, link: trend.link, source: "LinkedIn Trending" };
                  return (
                    <div key={tIdx} className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-900 rounded-2xl hover:border-blue-500/20 transition-all duration-155 space-y-2">
                      <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 block tracking-wide uppercase">{trend.stat}</span>
                      <h5 className="text-[11px] font-bold text-zinc-900 dark:text-white leading-snug line-clamp-2">{trend.title}</h5>
                      <p className="text-[10px] text-zinc-500 leading-normal line-clamp-2">{trend.desc}</p>
                      
                      {linkedinDrafts[trend.link] && (
                        <div className="mt-2 p-2 bg-indigo-550/5 border border-indigo-500/15 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">LinkedIn Post Draft</span>
                            <button onClick={() => { navigator.clipboard.writeText(linkedinDrafts[trend.link]); toast.success("Draft copied!"); }} className="text-[8px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-bold">Copy</button>
                          </div>
                          <textarea value={linkedinDrafts[trend.link]} onChange={(e) => setLinkedinDrafts(prev => ({ ...prev, [trend.link]: e.target.value }))} className="w-full h-24 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded p-1.5 text-[9px] text-zinc-700 dark:text-zinc-300 outline-none resize-none font-sans" />
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-zinc-150 dark:border-zinc-900 pt-2 mt-2">
                        <button onClick={() => handleGenerateLinkedinPost(mockArticle)} disabled={draftingLink === trend.link} className="text-[9.5px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-transparent border-none disabled:opacity-50">
                          {draftingLink === trend.link ? <><Loader2 className="w-2.5 h-2.5 animate-spin" /> Drafting...</> : <><Bot className="w-2.5 h-2.5" /> {linkedinDrafts[trend.link] ? "Hide Draft" : "Make Post"}</>}
                        </button>
                        <button onClick={() => handleSummarizeArticle(mockArticle)} disabled={summarizingLink === trend.link} className="text-[9.5px] font-bold text-indigo-600 hover:text-indigo-750 dark:text-indigo-400 flex items-center gap-1 cursor-pointer bg-transparent border-none disabled:opacity-50">
                          {summarizingLink === trend.link ? <><Loader2 className="w-2.5 h-2.5 animate-spin" /> Summarizing...</> : <><Sparkles className="w-2.5 h-2.5" /> {activeSummaries[trend.link] ? "Hide Summary" : "AI Summarize"}</>}
                        </button>
                      </div>

                      {activeSummaries[trend.link] && (
                        <div className="p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded-lg text-[9.5px] text-zinc-650 dark:text-zinc-350 leading-relaxed whitespace-pre-wrap mt-2">
                          {activeSummaries[trend.link]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
