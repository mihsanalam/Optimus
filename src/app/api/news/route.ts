import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic') || searchParams.get('category') || 'technology';
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'News API key not configured' }, { status: 500 });
    }

    // Map UI topics to highly specific boolean queries to filter out general/sports/politics noise
    let advancedQuery = "";
    if (topic === "artificial intelligence") {
      advancedQuery = '("AI" OR "Artificial Intelligence" OR "Machine Learning" OR "OpenAI") AND NOT (sports OR games OR celebrity OR general OR generic OR football OR basketball)';
    } else if (topic === "startups") {
      advancedQuery = '("startup" OR "venture capital" OR "founder" OR "SaaS" OR "tech company") AND NOT (sports OR games OR celebrity OR generic OR football OR basketball)';
    } else if (topic === "cybersecurity") {
      advancedQuery = '("cybersecurity" OR "infosec" OR "malware" OR "hacker" OR "data breach") AND NOT (sports OR games OR celebrity OR general OR football)';
    } else {
      // Default / Technology
      advancedQuery = '("tech" OR "software" OR "hardware" OR "developer" OR "Silicon Valley") AND NOT (sports OR games OR politics OR celebrity OR general OR generic OR football)';
    }

    const res = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(advancedQuery)}&language=en&sortBy=publishedAt&pageSize=12&apiKey=${apiKey}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch news data');
    }

    const data = await res.json();
    
    // map to match expected UI format
    const articles = data.articles.map((item: any) => ({
      title: item.title,
      link: item.url,
      pubDate: item.publishedAt,
      description: item.description,
      source: item.source.name,
      imageUrl: item.urlToImage
    })).filter((item: any) => item.title !== '[Removed]');

    return NextResponse.json({ success: true, articles });
  } catch (error) {
    console.error('News API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch news' }, { status: 500 });
  }
}
