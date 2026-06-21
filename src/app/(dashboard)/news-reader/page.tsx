"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, ExternalLink, Sparkles, Linkedin, Twitter, Copy, Globe } from "lucide-react";

export default function NewsReaderPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("artificial intelligence");
  
  const topics = [
    { id: "artificial intelligence", label: "AI" },
    { id: "technology", label: "Tech" },
    { id: "startups", label: "Startups" },
    { id: "cybersecurity", label: "Security" },
  ];

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/news?topic=${topic}`);
        const data = await res.json();
        if (data.success) {
          setArticles(data.articles);
        } else {
          toast.error("Failed to fetch news");
        }
      } catch (error) {
        toast.error("Error fetching news");
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [topic]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-5">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500" />
            News Hub
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Real-time tech and AI news powered by NewsAPI.</p>
        </div>
        
        {/* Category selectors */}
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setTopic(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                topic === t.id
                  ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/15"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-805 text-zinc-600 dark:text-zinc-400 hover:border-zinc-305 dark:hover:border-zinc-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs text-zinc-500 animate-pulse">Syncing latest feed blocks...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, i) => (
            <ArticleCard key={i} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArticleCard({ article }: { article: any }) {
  const [summary, setSummary] = useState("");
  const [socialDraft, setSocialDraft] = useState<{ platform: string, text: string } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSocial, setLoadingSocial] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (summary) {
      setSummary("");
      return;
    }
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: article.description || article.title })
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.text);
      } else {
        toast.error("Failed to generate summary");
      }
    } catch (e) {
      toast.error("Error generating summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSocial = async (platform: string) => {
    if (socialDraft?.platform === platform) {
      setSocialDraft(null);
      return;
    }
    setLoadingSocial(platform);
    try {
      const res = await fetch("/api/ai/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: article.description || article.title, platform })
      });
      const data = await res.json();
      if (data.success) {
        setSocialDraft({ platform, text: data.text });
        toast.success(`Generated ${platform === 'linkedin' ? 'LinkedIn post' : 'Twitter thread'}!`);
      } else {
        toast.error("Failed to generate post");
      }
    } catch (e) {
      toast.error("Error generating post");
    } finally {
      setLoadingSocial(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl flex flex-col hover:border-indigo-500/30 transition-all duration-200 overflow-hidden shadow-sm">
      {article.imageUrl && (
        <div className="h-40 overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
          <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
            {article.source}
          </span>
          <span className="text-[10px] text-zinc-400">
            {new Date(article.pubDate).toLocaleDateString()}
          </span>
        </div>

        <a href={article.link} target="_blank" rel="noreferrer" className="text-sm font-bold text-zinc-900 dark:text-white hover:text-indigo-500 transition-colors line-clamp-2 mb-2 leading-snug">
          {article.title}
        </a>
        
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans line-clamp-3 mb-4 flex-1">
          {article.description}
        </p>

        {summary && (
          <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-950 border border-indigo-500/20 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-500 uppercase tracking-wide">
              <Sparkles className="w-3 h-3" />
              AI Brief Summary
            </div>
            <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: summary.replace(/\\n/g, '<br/>') }} />
          </div>
        )}

        {socialDraft && (
          <div className="mb-4 p-3 bg-indigo-50/20 dark:bg-zinc-955 border border-indigo-500/20 rounded-xl space-y-2 relative group">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wide">
              {socialDraft.platform === "linkedin" ? <Linkedin className="w-3 h-3" /> : <Twitter className="w-3 h-3" />}
              Generated {socialDraft.platform === "linkedin" ? "Post" : "Thread"}
            </div>
            <div className="text-xs text-zinc-700 dark:text-zinc-300 font-sans whitespace-pre-wrap pb-6">{socialDraft.text}</div>
            <button 
              onClick={() => copyToClipboard(socialDraft.text)}
              className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-indigo-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md transition-colors"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-zinc-150 dark:border-zinc-900">
          <button
            onClick={handleSummarize}
            disabled={loadingSummary}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            {loadingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {summary ? "Hide Summary" : "AI Summarize"}
          </button>
          
          <button
            onClick={() => handleSocial("linkedin")}
            disabled={loadingSocial === "linkedin"}
            className="flex items-center justify-center w-8 h-8 bg-[#0077b5]/10 hover:bg-[#0077b5]/20 text-[#0077b5] border border-[#0077b5]/20 rounded-lg transition-colors disabled:opacity-50"
            title="Generate LinkedIn Post"
          >
            {loadingSocial === "linkedin" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Linkedin className="w-3.5 h-3.5" />}
          </button>
          
          <button
            onClick={() => handleSocial("twitter")}
            disabled={loadingSocial === "twitter"}
            className="flex items-center justify-center w-8 h-8 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] border border-[#1DA1F2]/20 rounded-lg transition-colors disabled:opacity-50"
            title="Generate Twitter Thread"
          >
            {loadingSocial === "twitter" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Twitter className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
