import { NextResponse } from "next/server";

const FEEDS = {
  ai: "https://techcrunch.com/category/artificial-intelligence/feed/",
  tech: "https://techcrunch.com/feed/",
  wired: "https://www.wired.com/feed/rss",
  hn: "https://news.ycombinator.com/rss"
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "ai";
    const feedUrl = FEEDS[category as keyof typeof FEEDS] || FEEDS.ai;
    
    const response = await fetch(feedUrl, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    
    // Parse items using Regex (lightweight, zero dependency, CORS-safe)
    const items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
      const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/);
      const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
      
      const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "Untitled Article";
      const link = linkMatch ? linkMatch[1].trim() : "#";
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : "";
      
      // Clean up HTML tags and limit length
      let description = descMatch 
        ? descMatch[1].replace(/<[^>]*>?/gm, "").replace(/<!\[CDATA\[|\]\]>/g, "").trim()
        : "";
      if (description.length > 180) {
        description = description.substring(0, 180) + "...";
      }
        
      items.push({
        title,
        link,
        pubDate,
        description,
        source: category === "hn" ? "Hacker News" : category === "wired" ? "Wired" : "TechCrunch"
      });
      
      if (items.length >= 10) break; // Limit to 10 articles
    }
    
    return NextResponse.json({ success: true, articles: items });
  } catch (err: any) {
    console.warn("[News RSS API] Feed fetch failed, using fallbacks:", err.message);
    const fallbacks = [
      {
        title: "Gemini 1.5 Pro Expands Context Window Capabilities",
        link: "https://techcrunch.com",
        pubDate: new Date().toUTCString(),
        description: "Google has announced significant updates to its Gemini model suite, boosting inference speeds and context parsing accuracy.",
        source: "TechCrunch"
      },
      {
        title: "Why Agents are the Future of Software Engineering",
        link: "https://news.ycombinator.com",
        pubDate: new Date().toUTCString(),
        description: "Discussion on the emergence of developer agents capable of parsing workspaces, executing commands, and self-correcting.",
        source: "Hacker News"
      },
      {
        title: "The Security Implications of LLMs in Production Tunnels",
        link: "https://wired.com",
        pubDate: new Date().toUTCString(),
        description: "Wired inspects how sandbox environments are becoming essential to safely run untrusted tool execution hooks.",
        source: "Wired"
      }
    ];
    return NextResponse.json({ success: true, articles: fallbacks, isFallback: true });
  }
}
