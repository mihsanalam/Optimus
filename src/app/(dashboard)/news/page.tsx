"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, ExternalLink, Sparkles, Linkedin, Twitter, Copy } from "lucide-react";

export default function NewsPage() {
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
    <div className="flex flex-col h-full overflow-y-auto bg-black/40 text-white p-6">
      <div className="max-w-6xl w-full mx-auto space-y-8">
        
        <header className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              News Hub
            </h1>
            <p className="text-gray-400 mt-1">Real-time tech and AI news powered by NewsAPI.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => setTopic(t.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  topic === t.id 
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/50" 
                  : "bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, i) => (
              <ArticleCard key={i} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: any }) {
  const [summary, setSummary] = useState("");
  const [socialDraft, setSocialDraft] = useState<{ platform: string, text: string } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSocial, setLoadingSocial] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (summary) return; // already summarized
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
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden flex flex-col hover:border-gray-700 transition-colors">
      {article.imageUrl && (
        <div className="h-48 overflow-hidden bg-gray-800">
          <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-4">
          <a href={article.link} target="_blank" rel="noreferrer" className="font-semibold text-lg hover:text-blue-400 transition-colors line-clamp-2">
            {article.title}
          </a>
          <a href={article.link} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-gray-300">
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        
        <div className="flex items-center text-xs text-gray-500 mb-4 gap-2">
          <span className="bg-gray-800 px-2 py-1 rounded-md">{article.source}</span>
          <span>{new Date(article.pubDate).toLocaleDateString()}</span>
        </div>
        
        <p className="text-gray-400 text-sm line-clamp-3 mb-6 flex-1">
          {article.description}
        </p>

        {summary && (
          <div className="mb-4 bg-blue-900/10 border border-blue-900/30 p-4 rounded-xl text-sm text-blue-100">
            <div className="flex items-center gap-2 text-blue-400 mb-2 font-medium">
              <Sparkles className="w-4 h-4" />
              AI Summary
            </div>
            <div className="space-y-2 prose prose-invert prose-sm" dangerouslySetInnerHTML={{ __html: summary.replace(/\\n/g, '<br/>') }} />
          </div>
        )}

        {socialDraft && (
          <div className="mb-4 bg-emerald-900/10 border border-emerald-900/30 p-4 rounded-xl text-sm text-emerald-100 relative group">
            <div className="flex items-center gap-2 text-emerald-400 mb-2 font-medium">
              {socialDraft.platform === "linkedin" ? <Linkedin className="w-4 h-4" /> : <Twitter className="w-4 h-4" />}
              Generated {socialDraft.platform === "linkedin" ? "Post" : "Thread"}
            </div>
            <div className="whitespace-pre-wrap">{socialDraft.text}</div>
            <button 
              onClick={() => copyToClipboard(socialDraft.text)}
              className="absolute top-4 right-4 p-2 bg-emerald-900/40 rounded-lg text-emerald-300 hover:bg-emerald-800/60 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-800">
          <button
            onClick={handleSummarize}
            disabled={loadingSummary || !!summary}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors"
          >
            {loadingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-blue-400" />}
            {summary ? "Summarized" : "Summarize"}
          </button>
          
          <button
            onClick={() => handleSocial("linkedin")}
            disabled={loadingSocial === "linkedin"}
            className="flex items-center justify-center w-10 h-10 bg-[#0077b5]/10 hover:bg-[#0077b5]/20 text-[#0077b5] disabled:opacity-50 rounded-lg transition-colors"
            title="Generate LinkedIn Post"
          >
            {loadingSocial === "linkedin" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Linkedin className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => handleSocial("twitter")}
            disabled={loadingSocial === "twitter"}
            className="flex items-center justify-center w-10 h-10 bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50 rounded-lg transition-colors"
            title="Generate Twitter Thread"
          >
            {loadingSocial === "twitter" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Twitter className="w-4 h-4 text-[#1DA1F2]" />}
          </button>
        </div>
      </div>
    </div>
  );
}
