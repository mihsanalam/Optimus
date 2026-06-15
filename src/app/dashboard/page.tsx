"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { insforge } from "@/lib/insforge";
import ThemeToggle from "@/components/layout/ThemeToggle";
import QuickTasks from "@/components/widgets/QuickTasks";
import StickyNotes from "@/components/widgets/StickyNotes";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import WorldClock from "@/components/widgets/WorldClock";
import CalendarWidget from "@/components/widgets/CalendarWidget";
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
  Activity,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Mail,
  MessageSquare,
  Globe,
  Sliders,
  DollarSign,
  Loader2,
  Settings2,
  XCircle,
  Play,
  Terminal,
  Briefcase,
  Calendar,
  ArrowRight,
  Info,
  Send,
  Check
} from "lucide-react";
import { toast } from "sonner";

type TabId = "dashboard" | "ai-agent" | "briefing" | "integrations" | "alerts" | "settings" | "pricing" | "news-reader";

interface SidebarItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  bgClass: string;
}

const getAppLabel = (appId: string) => {
  switch (appId.toLowerCase()) {
    case "gmail": return "Gmail Indexer";
    case "whatsapp": return "WhatsApp Linker";
    case "slack": return "Slack Sync";
    case "outlook": return "Outlook Calendar";
    default: return appId.charAt(0).toUpperCase() + appId.slice(1);
  }
};

export function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [integrationsList, setIntegrationsList] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [connectedApps, setConnectedApps] = useState<Record<string, boolean>>({});

  // Dynamic Mock Gmail Inbox States
  const [mockGmailInbox, setMockGmailInbox] = useState<any[]>([]);
  const [newGmailSender, setNewGmailSender] = useState("");
  const [newGmailSubject, setNewGmailSubject] = useState("");
  const [newGmailBody, setNewGmailBody] = useState("");
  const [gmailConnectedEmail, setGmailConnectedEmail] = useState("");

  // Briefing States
  const [briefingData, setBriefingData] = useState<{
    stats: { importantCount: number; priorityCount: number; followUpsCount: number };
    todayBrief: Array<{ app: string; title: string; summary: string; time: string }>;
    priorityItems: Array<{ app: string; title: string; time: string; description: string; priority: string }>;
    source?: string;
  } | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [briefingError, setBriefingError] = useState("");

  // Parse active tab from query parameter on mount/change
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab as TabId);
    }
  }, [searchParams]);

  // AI Agent Parameters State
  const [agentPrompt, setAgentPrompt] = useState(
    "You are Optimus, an advanced workflow assistant. Summarize communications and schedule actions."
  );
  const [agentModel, setAgentModel] = useState("gpt-4o");

  // AI Chat & Quick Write States
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hello! I am Optimus, your workflow assistant. Ask me anything, or click 'What's on today?' to get a complete daily overview." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [customApiKey, setCustomApiKey] = useState("");

  const [writePrompt, setWritePrompt] = useState("");
  const [writeFormat, setWriteFormat] = useState("email");
  const [writeTone, setWriteTone] = useState("professional");
  const [writeResult, setWriteResult] = useState("");
  const [writeLoading, setWriteLoading] = useState(false);

  // Load API Key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("optimus_gemini_api_key");
    if (savedKey) {
      setCustomApiKey(savedKey);
    }
  }, []);

  const saveCustomApiKey = (key: string) => {
    setCustomApiKey(key);
    if (key.trim()) {
      localStorage.setItem("optimus_gemini_api_key", key);
      toast.success("Gemini API key saved successfully!");
    } else {
      localStorage.removeItem("optimus_gemini_api_key");
      toast.info("Gemini API key cleared.");
    }
  };

  // Integrations interactive states
  const [activeSettingsApp, setActiveSettingsApp] = useState<any | null>(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState<"tools" | "logs">("tools");
  const [connectingAppId, setConnectingAppId] = useState<string | null>(null);

  // Gmail Interactive Play States
  const [selectedGmailTool, setSelectedGmailTool] = useState<string>("gmail.list_messages");
  const [gmailInputs, setGmailInputs] = useState({ to: "", subject: "", body: "" });
  const [gmailLogs, setGmailLogs] = useState<string[]>([]);
  const [gmailOutput, setGmailOutput] = useState<any>(null);
  const [executingTool, setExecutingTool] = useState(false);

  // WhatsApp Interactive Connection & Tool States
  const [showWhatsAppConnect, setShowWhatsAppConnect] = useState(false);
  const [waPhoneNumber, setWaPhoneNumber] = useState("");
  const [waPairingCode, setWaPairingCode] = useState("");
  const [waLoading, setWaLoading] = useState(false);
  const [waError, setWaError] = useState("");
  const [waStatus, setWaStatus] = useState("disconnected");
  const [waLogs, setWaLogs] = useState<string[]>([]);
  const [whatsappInputs, setWhatsappInputs] = useState({
    phone: "",
    message: "",
    query: "",
    chat_name: "",
    group_id: ""
  });

  // Dynamic Alerts State
  const [alerts, setAlerts] = useState<Array<{ id: string; title: string; source: string; time: string; status: "Pending" | "Resolved"; priority: string }>>([
    { id: "alt-1", title: "Draft email to Slack partner", source: "Outlook Calendar", time: "8:30 AM", status: "Pending", priority: "High" },
    { id: "alt-2", title: "Review design changes request", source: "WhatsApp Linker", time: "9:15 AM", status: "Pending", priority: "Critical" }
  ]);

  // Topic search state for News Reader
  const [newsSearchQuery, setNewsSearchQuery] = useState("");

  const sendChatMessage = async (text: string, contextOverride?: string) => {
    if (!text.trim() && !contextOverride) return;

    const displayMessage = { role: "user" as const, content: text };
    setChatMessages((prev) => [...prev, displayMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const messagesToSend = [...chatMessages, { role: "user" as const, content: contextOverride || text }];
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesToSend,
          systemInstruction: agentPrompt,
          customApiKey: customApiKey,
          gmailAccessToken: typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null,
          gmailRefreshToken: typeof window !== "undefined" ? localStorage.getItem("gmail_refresh_token") : null,
          calendarEvents: typeof window !== "undefined" ? JSON.parse(localStorage.getItem("optimus_calendar_events") || "[]") : [],
          userId: user?.id || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setChatMessages((prev) => [...prev, { role: "assistant", content: `⚠️ Error: ${data.error || "Failed to generate response."}` }]);
      }
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Connection error. Please check your network and API key settings." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleWhatsOnToday = async () => {
    const briefSummaries = briefingData?.todayBrief?.map(item => `- [${item.app.toUpperCase()}] ${item.title}: ${item.summary}`).join("\n") || "No platform updates compiled today.";
    const priorityItemsCount = briefingData?.stats?.priorityCount || 0;
    
    const promptText = "What's on today?";
    const contextPrompt = `Analyze today's dashboard state and write a personalized, daily overview greeting for the operator. Be concise, highly professional, encouraging, and highlight key focus areas.
    
    Here is the live dashboard telemetry context:
    1. Daily Brief Updates:
    ${briefSummaries}
    
    2. Operational Metrics:
    - AI Priority Alerts Detected: ${priorityItemsCount}
    
    Format the response with clean headers and bullet points. Mention which platforms have updates.`;

    await sendChatMessage(promptText, contextPrompt);
  };

  const handleQuickWrite = async () => {
    if (!writePrompt.trim()) return;
    setWriteLoading(true);
    setWriteResult("");
    try {
      const res = await fetch("/api/ai/quick-write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: writeFormat,
          prompt: writePrompt,
          tone: writeTone,
          customApiKey: customApiKey
        })
      });
      const data = await res.json();
      if (data.success) {
        setWriteResult(data.text);
      } else {
        setWriteResult(`⚠️ Generation failed: ${data.error}`);
      }
    } catch (err) {
      setWriteResult("⚠️ Connection error generating copy.");
    } finally {
      setWriteLoading(false);
    }
  };

  // News Reader States
  const [newsCategory, setNewsCategory] = useState<string>("ai");
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [savedArticles, setSavedArticles] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [activeSummaries, setActiveSummaries] = useState<Record<string, string>>({});
  const [summarizingLink, setSummarizingLink] = useState<string | null>(null);

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
    if (activeTab === "news-reader") {
      fetchNewsFeed(newsCategory);
    }
  }, [activeTab, newsCategory]);

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
        alert("Article bookmarked successfully!");
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

  // Polling WhatsApp status if connect dialog is open
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/whatsapp/status");
        const data = await res.json();
        if (data.success) {
          setWaStatus(data.status);
          setWaLogs(data.logs || []);
          if (data.pairingCode) {
            setWaPairingCode(data.pairingCode);
          }
          if (data.status === "connected") {
            const updated = { ...connectedApps, whatsapp: true };
            setConnectedApps(updated);
            localStorage.setItem("connected_integrations", JSON.stringify(updated));
            toast.success("WhatsApp Node Connected!");
            setTimeout(() => {
              setShowWhatsAppConnect(false);
              setWaPairingCode("");
              setWaPhoneNumber("");
              setWaError("");
            }, 1500);
          }
        }
      } catch (err) {
        // Ignore
      }
    };

    if (showWhatsAppConnect) {
      checkStatus();
      interval = setInterval(checkStatus, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showWhatsAppConnect, connectedApps]);

  const handleConnectApp = (id: string) => {
    if (id === "whatsapp") {
      setShowWhatsAppConnect(true);
      setWaPhoneNumber("");
      setWaPairingCode("");
      setWaError("");
      setWaStatus("disconnected");
      return;
    }

    setConnectingAppId(id);
    setTimeout(() => {
      const updated = { ...connectedApps, [id]: true };
      setConnectedApps(updated);
      localStorage.setItem("connected_integrations", JSON.stringify(updated));
      toast.success(`${id.charAt(0).toUpperCase() + id.slice(1)} linked successfully!`);
      setConnectingAppId(null);
    }, 1200);
  };

  const handleDisconnectApp = async (id: string) => {
    if (id === "whatsapp") {
      try {
        await fetch("/api/whatsapp/disconnect", { method: "POST" });
      } catch (e) {
        // Ignore
      }
    }
    const updated = { ...connectedApps, [id]: false };
    setConnectedApps(updated);
    localStorage.setItem("connected_integrations", JSON.stringify(updated));
    toast.error(`${id.charAt(0).toUpperCase() + id.slice(1)} disconnected.`);
  };

  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waPhoneNumber) {
      setWaError("Phone number is required");
      return;
    }
    setWaLoading(true);
    setWaError("");
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: waPhoneNumber })
      });
      const data = await res.json();
      if (data.success) {
        setWaPairingCode(data.pairingCode);
        setWaStatus("pairing");
        toast.info("Pairing code generated! Enter it in WhatsApp Link Devices.");
      } else {
        setWaError(data.error || "Failed to request pairing code");
        toast.error("Pairing request failed.");
      }
    } catch (err: any) {
      setWaError(err.message || "Failed to connect to the WhatsApp API gateway");
    } finally {
      setWaLoading(false);
    }
  };

  // Mock Gmail inbox items
  const mockInbox = [
    { id: "msg-101", from: "Sarah Miller <sarah@millermedia.com>", subject: "Project specifications for redesign", snippet: "Hey! Just wanted to follow up on the website redesign spec. We need final feedback by Friday 3 PM...", date: "Today, 10:45 AM" },
    { id: "msg-102", from: "GitHub Alerts <noreply@github.com>", subject: "[GitHub] Build Success: Optimus workflow-pipeline", snippet: "All checks passed in build workflow. 12 steps executed successfully. Deploy target active.", date: "Today, 9:15 AM" },
    { id: "msg-103", from: "Elena Rostova <elena.r@techround.org>", subject: "Guest speaker request: Technical Panel next Tuesday", snippet: "Hi Mihsan, we'd love to have you speak about AI agent coding. Please let me know your availability...", date: "Yesterday, 4:30 PM" }
  ];

  const runMcpToolMock = async (tool: any) => {
    setExecutingTool(true);
    setGmailLogs(prev => [...prev, `[MCP COMMAND] Invoking tool ${tool.name}...`]);

    if (tool.name.startsWith("whatsapp.")) {
      try {
        const response = await fetch("/api/whatsapp/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toolName: tool.name,
            inputs: whatsappInputs
          })
        });
        const data = await response.json();
        if (data.success) {
          setGmailLogs(prev => [
            ...prev,
            `[MCP RESPONSE] API Call Status: 200 OK (${data.output?.source || 'live'})`,
            `[MCP DATA] Executed successfully via WhatsApp Baileys Gateway.`
          ]);
          setGmailOutput(data.output);
          toast.success(`Executed ${tool.name} successfully`);
        } else {
          setGmailLogs(prev => [
            ...prev,
            `[MCP ERROR] Command execution failed: ${data.error || "Unknown error"}`
          ]);
          setGmailOutput({ error: data.error });
          toast.error(`Error running ${tool.name}`);
        }
      } catch (err: any) {
        setGmailLogs(prev => [
          ...prev,
          `[MCP ERROR] HTTP Connection failed: ${err.message}`
        ]);
        setGmailOutput({ error: err.message });
      } finally {
        setExecutingTool(false);
      }
      return;
    }
    
    setTimeout(() => {
      let result: any;
      if (tool.name === "gmail.send_message") {
        result = { success: true, message_id: `msg-${Math.floor(Math.random() * 10000)}` };
        setGmailLogs(prev => [
          ...prev,
          `[MCP RESPONSE] API Call Status: 200 OK`,
          `[MCP DATA] Sent message to ${gmailInputs.to || 'client@millermedia.com'} - ID: ${result.message_id}`
        ]);
      } else if (tool.name === "gmail.get_message") {
        result = {
          id: "msg-101",
          headers: { Subject: "Project specifications for redesign" },
          body: "Sarah requested final feedback on website redesign by Friday."
        };
        setGmailLogs(prev => [
          ...prev,
          `[MCP RESPONSE] Successfully fetched content for message: msg-101`,
          `[MCP DATA] Subject: ${result.headers.Subject}`
        ]);
      } else {
        result = { success: true };
        setGmailLogs(prev => [
          ...prev,
          `[MCP RESPONSE] Command completed successfully. Retrieved records.`
        ]);
      }
      setGmailOutput(result);
      setExecutingTool(false);
      toast.success(`Executed ${tool.name} successfully`);
    }, 1000);
  };

  // Synchronize alerts with briefing data when it changes
  useEffect(() => {
    if (briefingData?.priorityItems) {
      const compiledAlerts = briefingData.priorityItems.map((item, idx) => ({
        id: `briefing-alt-${idx}`,
        title: item.title,
        source: getAppLabel(item.app),
        time: item.time || "Today",
        status: "Pending" as const,
        priority: item.priority
      }));
      if (compiledAlerts.length > 0) {
        setAlerts(compiledAlerts);
      }
    }
  }, [briefingData]);

  const handleResolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "Resolved" as const } : a));
    toast.success("Alert resolved successfully!");
  };



  // Sync state or raw database check
  useEffect(() => {
    if (!loading && !user) {
      // Allow viewing as guest preview with action banner
    }
  }, [user, loading]);

  // Load connected integrations state
  useEffect(() => {
    const loadState = () => {
      const saved = localStorage.getItem("connected_integrations");
      if (saved) {
        try {
          setConnectedApps(JSON.parse(saved));
        } catch (e) {
          // Ignore
        }
      } else {
        // Fallback defaults
        const defaults = { gmail: true, slack: true };
        setConnectedApps(defaults);
        localStorage.setItem("connected_integrations", JSON.stringify(defaults));
      }

      // Sync Gmail connected email state
      const savedEmail = localStorage.getItem("gmail_connected_email");
      if (savedEmail) {
        setGmailConnectedEmail(savedEmail);
      } else {
        setGmailConnectedEmail("mihsan.dev@gmail.com");
      }
    };
    loadState();
    window.addEventListener("storage", loadState);
    return () => window.removeEventListener("storage", loadState);
  }, []);

  // Dynamic Simulated Inbox Initializer
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mock_gmail_inbox");
      if (saved) {
        try {
          setMockGmailInbox(JSON.parse(saved));
        } catch (e) {}
      } else {
        const defaults = [
          { id: "msg-101", from: "Sarah Miller <sarah@millermedia.com>", subject: "Project specifications for redesign", snippet: "Hey! Just wanted to follow up on the website redesign spec. We need final feedback by Friday 3 PM...", date: "Today, 10:45 AM" },
          { id: "msg-102", from: "GitHub Alerts <noreply@github.com>", subject: "[GitHub] Build Success: Optimus workflow-pipeline", snippet: "All checks passed in build workflow. 12 steps executed successfully.", date: "Today, 9:15 AM" },
          { id: "msg-103", from: "Elena Rostova <elena.r@techround.org>", subject: "Guest speaker request: Technical Panel next Tuesday", snippet: "Hi Mihsan, we'd love to have you speak about AI agent coding. Please let me know your availability...", date: "Yesterday, 4:30 PM" }
        ];
        setMockGmailInbox(defaults);
        localStorage.setItem("mock_gmail_inbox", JSON.stringify(defaults));
      }
    }
  }, []);

  // Handle Gmail OAuth Query Parameters on redirect back
  useEffect(() => {
    const gmailStatus = searchParams.get("gmail_status");
    if (gmailStatus) {
      if (gmailStatus === "success") {
        const email = searchParams.get("gmail_email") || "mihsan.dev@gmail.com";
        const token = searchParams.get("gmail_token") || "";
        const updated = { ...connectedApps, gmail: true };
        setConnectedApps(updated);
        setGmailConnectedEmail(email);
        localStorage.setItem("connected_integrations", JSON.stringify(updated));
        localStorage.setItem("gmail_connected_email", email);
        localStorage.setItem("gmail_access_token", token);
        toast.success(`Successfully linked Gmail account: ${email}`);
      } else if (gmailStatus === "error") {
        const err = searchParams.get("gmail_error") || "Connection failed";
        toast.error(`Gmail Connection Failed: ${err}`);
      } else if (gmailStatus === "cancelled") {
        toast.info("Gmail Connection Cancelled.");
      }
      // Clean query parameters from URL but keep active tab
      const tab = searchParams.get("tab") || activeTab;
      const newUrl = window.location.pathname + (tab ? `?tab=${tab}` : "");
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [searchParams, connectedApps, activeTab]);

  const handleAddMockEmail = () => {
    if (!newGmailSender || !newGmailSubject || !newGmailBody) {
      toast.error("Please fill in all simulated email fields.");
      return;
    }
    const newMail = {
      id: `msg-${Date.now()}`,
      from: newGmailSender,
      subject: newGmailSubject,
      snippet: newGmailBody,
      date: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [newMail, ...mockGmailInbox];
    setMockGmailInbox(updated);
    localStorage.setItem("mock_gmail_inbox", JSON.stringify(updated));
    setNewGmailSender("");
    setNewGmailSubject("");
    setNewGmailBody("");
    toast.success("Simulated unread email added to inbox!");
    // Trigger re-generation immediately with the updated inbox
    setTimeout(() => refreshBriefingWithInbox(updated), 100);
  };

  const handleDeleteMockEmail = (id: string) => {
    const updated = mockGmailInbox.filter(item => item.id !== id);
    setMockGmailInbox(updated);
    localStorage.setItem("mock_gmail_inbox", JSON.stringify(updated));
    toast.info("Simulated email removed.");
    setTimeout(() => refreshBriefingWithInbox(updated), 100);
  };

  const handleDisconnectGmail = async () => {
    await handleDisconnectApp("gmail");
    localStorage.removeItem("gmail_connected_email");
    localStorage.removeItem("gmail_access_token");
    if (user?.id) {
      try {
        await insforge.database
          .from("users")
          .update({ gmail_credentials: null })
          .eq("id", user.id);
      } catch (e) {}
    }
  };

  const refreshBriefing = async () => {
    await refreshBriefingWithInbox(mockGmailInbox);
  };

  const refreshBriefingWithInbox = async (inbox: any[]) => {
    setBriefingLoading(true);
    setBriefingError("");
    try {
      const gmailAccessToken = typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null;
      const gmailRefreshToken = typeof window !== "undefined" ? localStorage.getItem("gmail_refresh_token") : null;
      const res = await fetch("/api/briefing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectedApps,
          customInbox: inbox,
          userId: user?.id || null,
          customApiKey: customApiKey,
          gmailAccessToken,
          gmailRefreshToken
        })
      });
      const data = await res.json();
      if (data.success) {
        setBriefingData(data);
      } else {
        setBriefingError("Failed to compile briefing from platforms.");
      }
    } catch (err) {
      setBriefingError("Failed to connect to briefing service.");
    } finally {
      setBriefingLoading(false);
    }
  };

  // Trigger briefing reload whenever connectedApps updates
  useEffect(() => {
    if (Object.keys(connectedApps).length > 0) {
      refreshBriefingWithInbox(mockGmailInbox);
    }
  }, [connectedApps, user]);

  const getAppIcon = (appId: string) => {
    switch (appId.toLowerCase()) {
      case "gmail":
        return (
          <div className="p-2.5 bg-red-500/10 text-red-655 dark:text-red-400 border border-red-500/20 rounded-xl shrink-0">
            <Mail className="w-5 h-5" />
          </div>
        );
      case "whatsapp":
        return (
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.012 2C6.485 2 2 6.485 2 12.012c0 1.91.536 3.693 1.464 5.215L2.08 21.92l4.832-1.378a9.96 9.96 0 0 0 5.1 1.39c5.528 0 10.013-4.485 10.013-10.012C22.025 6.485 17.54 2 12.012 2z" fill="currentColor"/>
            </svg>
          </div>
        );
      case "slack":
        return (
          <div className="p-2.5 bg-pink-500/10 text-pink-655 dark:text-pink-400 border border-pink-500/20 rounded-xl shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
        );
      case "outlook":
        return (
          <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl shrink-0">
            <Mail className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="p-2.5 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 rounded-xl shrink-0">
            <Globe className="w-5 h-5" />
          </div>
        );
    }
  };



  // Sidebar Menu Items
  const menuItems: SidebarItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      bgClass: "bg-accent/10 text-accent border border-accent/20"
    },
    {
      id: "ai-agent",
      label: "AI Agent",
      icon: <Bot className="w-5 h-5" />,
      bgClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
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
      id: "news-reader",
      label: "News Reader",
      icon: <Globe className="w-5 h-5" />,
      bgClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
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
    bgClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen w-full bg-background flex text-zinc-800 dark:text-zinc-150 overflow-hidden transition-colors duration-200">
      {/* Dynamic Background Blur */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-20 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* 1. COLLAPSIBLE SIDEBAR */}
      <aside
        className={`border-r border-zinc-200 dark:border-zinc-900 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-md flex flex-col justify-between transition-all duration-300 relative z-20 shrink-0 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Sidebar Header (Logo & App Name) */}
        <div>
          <div className="flex h-20 items-center justify-between px-5 border-b border-zinc-200 dark:border-zinc-900/60">
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <img
                src="/logo.png"
                alt="Optimus Logo"
                className="w-8 h-8 rounded-xl object-cover border border-zinc-200 dark:border-zinc-850 shrink-0 shadow-md shadow-accent/10"
              />
              {!isCollapsed && (
                <div className="truncate">
                  <span className="text-base font-bold tracking-tight text-zinc-905 dark:text-white block">Optimus</span>
                  <span className="block text-[8px] tracking-wider text-accent dark:text-accent font-bold uppercase">AI Hub</span>
                </div>
              )}
            </Link>

            {/* Collapse Toggle Button */}
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900 text-zinc-550 dark:text-zinc-450 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sidebar Menu Items */}
          <nav className="p-4 space-y-2.5">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              const pendingAlerts = alerts.filter(a => a.status === "Pending").length;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-md dark:shadow-lg"
                      : "bg-transparent border border-transparent text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 ${item.bgClass}`}>
                      {item.icon}
                    </div>
                    {!isCollapsed && (
                      <span className="text-xs font-semibold tracking-wide truncate">{item.label}</span>
                    )}
                  </div>
                  {item.id === "alerts" && pendingAlerts > 0 && (
                    <span className="bg-red-500 text-white text-[8px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white dark:border-zinc-950 shrink-0">
                      {pendingAlerts}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Area */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-900/60 space-y-4">
          {/* Pricing Settings Button */}
          <button
            onClick={() => setActiveTab(pricingItem.id)}
            className={`w-full flex items-center gap-3.5 p-3 rounded-2xl transition-all duration-200 cursor-pointer ${
              activeTab === pricingItem.id
                ? "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-md dark:shadow-lg"
                : "bg-transparent border border-transparent text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40"
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

          {/* Expand Button (when collapsed) */}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-full flex justify-center py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* User Signout Details */}
          {!isCollapsed && user && (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 block truncate">
                    {user.profile?.name || user.email.split("@")[0]}
                  </span>
                  <span className="text-[8px] text-zinc-550 dark:text-zinc-650 block truncate">{user.email}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTENT AREA */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        {/* Top Header of Main Workspace */}
        <header className="h-20 border-b border-zinc-200 dark:border-zinc-900 px-8 flex items-center justify-between bg-white/40 dark:bg-zinc-950/20 backdrop-blur-sm relative z-10 transition-colors duration-200">
          <div className="flex items-center gap-4">
            {/* Logo in Dashboard */}
            <div className="flex items-center gap-2 border-r border-zinc-200 dark:border-zinc-800 pr-4">
              <img
                src="/logo.png"
                alt="Optimus Logo"
                className="w-7 h-7 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800 shrink-0 shadow-sm"
              />
              <span className="font-extrabold text-[10px] tracking-widest bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent uppercase select-none">
                Optimus
              </span>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white capitalize">
                {activeTab.replace("-", " ")}
              </h2>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell with counting */}
            <button
              onClick={() => setActiveTab("alerts")}
              className="relative p-2 text-zinc-500 hover:text-zinc-905 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
              title="View Action Alerts"
            >
              <Bell className="w-4 h-4" />
              {alerts.filter(a => a.status === "Pending").length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-zinc-950 shrink-0">
                  {alerts.filter(a => a.status === "Pending").length}
                </span>
              )}
            </button>

            {/* Global Theme Toggle */}
            <ThemeToggle />

            {/* Session Indicator */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-zinc-605 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 px-3 py-1.5 rounded-xl">
                <span>InsForge Authed</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-450" />
              </div>
            ) : (
              <Link
                href="/sign-in"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
              >
                Log In
              </Link>
            )}
          </div>
        </header>

        {/* Tab Views Container */}
        <div className="flex-1 p-8 relative z-10 max-w-7xl w-full mx-auto space-y-8 animate-fadeIn">
          {/* Guest Preview Alert banner */}
          {!user && (
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-955/15 dark:bg-indigo-950/15 border border-indigo-100 dark:border-indigo-900/25 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <p className="text-xs text-zinc-600 dark:text-zinc-350">
                  You are viewing the dashboard in <span className="font-semibold text-zinc-900 dark:text-white">Preview Mode</span>. Sign up or log in to sync active workflows to your PostgreSQL table.
                </p>
              </div>
              <Link
                href="/sign-up"
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all shrink-0"
              >
                Sign Up Now
              </Link>
            </div>
          )}

          {/* VIEW: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Welcome Section */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 backdrop-blur-md transition-all">
                <div>
                  <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight sm:text-2xl">
                    Welcome back, {user?.profile?.name || user?.email?.split("@")[0] || "Operator"}!
                  </h1>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    Here is your automated intelligence briefing and priority agenda compiled across connected channels.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={refreshBriefing}
                    disabled={briefingLoading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer disabled:opacity-50 shrink-0 self-start md:self-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${briefingLoading ? "animate-spin" : ""}`} />
                    Refresh / Regenerate
                  </button>
                </div>
              </div>

              {/* Stats Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl space-y-4 glow-border transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-450">Important Count</span>
                    <div className="p-2 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20 rounded-xl">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                      {briefingLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                      ) : (
                        briefingData?.stats?.importantCount ?? 0
                      )}
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1">Requires review today</p>
                  </div>
                </div>

                <div className="p-6 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl space-y-4 glow-border transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-450">Priority Count</span>
                    <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-xl">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                      {briefingLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                      ) : (
                        briefingData?.stats?.priorityCount ?? 0
                      )}
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1">Identified by Optimus AI</p>
                  </div>
                </div>

                <div className="p-6 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl space-y-4 glow-border transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-450">Follow-ups Count</span>
                    <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 rounded-xl">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                      {briefingLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                      ) : (
                        briefingData?.stats?.followUpsCount ?? 0
                      )}
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1">Awaiting your response</p>
                  </div>
                </div>
              </div>

              {/* Primary Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Workspace Widgets (Spacious 2x2 grid) */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="border-b border-zinc-150 dark:border-zinc-800 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-accent" />
                        Workspace Widgets
                      </h3>
                      <p className="text-[10px] text-zinc-500 mt-1">Utility modules to keep your operational workflow synced.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CalendarWidget />
                    <QuickTasks />
                    <StickyNotes />
                    <WeatherWidget />
                    <WorldClock />
                  </div>
                </div>

                {/* Right Area: Connected Apps & Priority Items */}
                <div className="lg:col-span-4 space-y-8">
                  
                  {/* Connected Apps Card */}
                  <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-5 transition-all duration-200">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Connected Apps</h3>
                      <p className="text-[9px] text-zinc-550 dark:text-zinc-455 mt-0.5">Top 4 integrations status</p>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { id: "gmail", name: "Gmail" },
                        { id: "whatsapp", name: "WhatsApp" },
                        { id: "slack", name: "Slack" },
                        { id: "outlook", name: "Outlook" }
                      ].map((app) => {
                        const isConnected = connectedApps[app.id];
                        return (
                          <div key={app.id} className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-2xl">
                            <div className="flex items-center gap-3 min-w-0">
                              {getAppIcon(app.id)}
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-zinc-805 dark:text-zinc-200 block">{app.name}</span>
                                <span className={`text-[8px] font-bold ${isConnected ? "text-emerald-500" : "text-zinc-400 dark:text-zinc-600"}`}>
                                  {isConnected ? "✓ Connected" : "Disconnected"}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => setActiveTab("integrations")}
                              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-[10px] font-bold transition-all cursor-pointer shrink-0"
                            >
                              Manage
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priority Items Card */}
                  <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-5 transition-all duration-200">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Priority Items</h3>
                      <p className="text-[9px] text-zinc-550 dark:text-zinc-455 mt-0.5">Urgent actions detected by AI</p>
                    </div>

                    {briefingLoading ? (
                      <div className="py-6 flex justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-accent" />
                      </div>
                    ) : !briefingData || briefingData.priorityItems.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">No priority items detected.</p>
                    ) : (
                      <div className="space-y-4.5">
                        {briefingData.priorityItems.map((item, idx) => (
                          <div key={idx} className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 space-y-2.5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                {getAppIcon(item.app)}
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">{item.title}</h4>
                                  <span className="text-[8px] text-zinc-500 block">{item.time}</span>
                                </div>
                              </div>
                              <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                                item.priority === "Critical"
                                  ? "bg-red-500/10 text-red-655 dark:text-red-400 border-red-500/20"
                                  : item.priority === "High"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                  : "bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-500/20"
                              }`}>
                                {item.priority}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-350 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* VIEW: AI AGENT */}
          {activeTab === "ai-agent" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: AI Chat Panel */}
              <div className="lg:col-span-8 flex flex-col h-[650px] bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 glow-border">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-4 mb-4 shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-505 bg-indigo-550 animate-pulse" />
                      Optimus AI Assistant
                    </h3>
                    <p className="text-[10px] text-zinc-500">Ask anything or request a summary</p>
                  </div>
                  <button
                    onClick={handleWhatsOnToday}
                    disabled={chatLoading}
                    className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-650 text-white rounded-xl text-xs font-bold active-scale transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    What's on today?
                  </button>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-indigo-500 text-white rounded-tr-none"
                            : "bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-200 rounded-tl-none"
                        }`}
                      >
                        <p className="font-bold text-[10px] opacity-60 mb-1">
                          {msg.role === "user" ? "YOU" : "OPTIMUS ASSISTANT"}
                        </p>
                        <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl rounded-tl-none">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendChatMessage(chatInput);
                  }}
                  className="flex gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask your assistant anything..."
                    className="flex-1 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="px-4 py-3 bg-indigo-500 hover:bg-indigo-650 text-white font-bold rounded-xl text-xs active-scale disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                  >
                    Send
                  </button>
                </form>
              </div>

              {/* Right Column: Quick Write Tool & Settings */}
              <div className="lg:col-span-4 space-y-8">
                
                {/* Quick Write Tool */}
                <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-5 glow-border">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Quick Write Tool</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Generate posts, emails or ideas instantly</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Format</label>
                        <select
                          value={writeFormat}
                          onChange={(e) => setWriteFormat(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-2.5 text-xs text-zinc-800 dark:text-white outline-none cursor-pointer"
                        >
                          <option value="email">Email</option>
                          <option value="post">Social Post</option>
                          <option value="ideas">Action Ideas</option>
                          <option value="general">Draft Text</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Tone</label>
                        <select
                          value={writeTone}
                          onChange={(e) => setWriteTone(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-2.5 text-xs text-zinc-800 dark:text-white outline-none cursor-pointer"
                        >
                          <option value="professional">Professional</option>
                          <option value="casual">Casual</option>
                          <option value="creative">Creative</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Topic / Description</label>
                      <textarea
                        rows={3}
                        value={writePrompt}
                        onChange={(e) => setWritePrompt(e.target.value)}
                        placeholder="What should we write about? E.g., 'follow up with Mihsan about deployment'..."
                        className="w-full bg-zinc-50 dark:bg-zinc-955 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-all resize-none"
                      />
                    </div>

                    <button
                      onClick={handleQuickWrite}
                      disabled={writeLoading || !writePrompt.trim()}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold active-scale transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {writeLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Generate Copy
                        </>
                      )}
                    </button>

                    {writeResult && (
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Output</label>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(writeResult);
                              alert("Copied to clipboard!");
                            }}
                            className="text-[9px] text-indigo-500 hover:underline font-bold cursor-pointer"
                          >
                            Copy Copy
                          </button>
                        </div>
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs text-zinc-800 dark:text-zinc-300 font-sans whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                          {writeResult}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Assistant Settings & System Prompt */}
                <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-4 glow-border">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Assistant Parameters</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Customize AI behaviour & API keys</p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">System Persona</label>
                      <textarea
                        rows={2}
                        value={agentPrompt}
                        onChange={(e) => setAgentPrompt(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-indigo-500 rounded-xl p-2.5 text-[11px] text-zinc-800 dark:text-zinc-350 outline-none resize-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Custom Gemini API Key</label>
                      <input
                        type="password"
                        value={customApiKey}
                        onChange={(e) => saveCustomApiKey(e.target.value)}
                        placeholder="Enter Gemini API key override..."
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 focus:border-indigo-500 rounded-xl p-2.5 text-[11px] text-zinc-800 dark:text-zinc-300 outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* VIEW: NEWS READER */}
          {activeTab === "news-reader" && (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* If category is saved and empty */}
                  {newsCategory === "saved" && savedArticles.length === 0 && (
                    <div className="col-span-2 text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/20 dark:bg-zinc-900/10">
                      <p className="text-xs text-zinc-500 font-sans">No bookmarked articles yet. Save articles from the AI or Tech feeds to read them later!</p>
                    </div>
                  )}

                  {/* If regular category and empty */}
                  {newsCategory !== "saved" && newsArticles.length === 0 && (
                    <div className="col-span-2 text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/20 dark:bg-zinc-900/10">
                      <p className="text-xs text-zinc-500 font-sans">No feed items found. Try switching categories or verify connection.</p>
                    </div>
                  )}

                  {/* Render saved articles */}
                  {newsCategory === "saved"
                    ? savedArticles.map((art) => (
                        <div
                          key={art.id}
                          className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 flex flex-col justify-between glow-border hover:border-indigo-500/30 transition-all duration-200"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                art.source === "Hacker News"
                                  ? "bg-red-500/10 text-red-600 border-red-500/20"
                                  : art.source === "Wired"
                                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              }`}>
                                {art.source}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                {art.pub_date ? new Date(art.pub_date).toLocaleDateString() : ""}
                              </span>
                            </div>

                            <a
                              href={art.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-zinc-900 dark:text-white hover:text-indigo-500 dark:hover:text-indigo-400 line-clamp-2 block transition-colors leading-snug"
                            >
                              {art.title}
                            </a>

                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans line-clamp-3">
                              {art.description}
                            </p>

                            {/* Inline AI Summary Display */}
                            {activeSummaries[art.link] && (
                              <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-950 border border-indigo-500/20 rounded-xl space-y-2">
                                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide">AI Brief Summary</p>
                                <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">{activeSummaries[art.link]}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between border-t border-zinc-150 dark:border-zinc-850 pt-4 mt-5">
                            <button
                              onClick={() => handleUnsaveArticle(art.id)}
                              className="text-[10px] font-bold text-red-500 hover:text-red-650 flex items-center gap-1 cursor-pointer bg-transparent border-0"
                            >
                              Remove Bookmark
                            </button>
                            <button
                              onClick={() => handleSummarizeArticle(art)}
                              disabled={summarizingLink === art.link}
                              className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer bg-transparent border-0 disabled:opacity-50"
                            >
                              {summarizingLink === art.link ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Summarizing...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3" />
                                  {activeSummaries[art.link] ? "Hide Summary" : "AI Summarize"}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    : newsArticles.map((art, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 flex flex-col justify-between glow-border hover:border-indigo-500/30 transition-all duration-200"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                art.source === "Hacker News"
                                  ? "bg-red-500/10 text-red-605 border-red-500/20"
                                  : art.source === "Wired"
                                  ? "bg-blue-500/10 text-blue-605 border-blue-500/20"
                                  : "bg-emerald-500/10 text-emerald-605 border-emerald-500/20"
                              }`}>
                                {art.source}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                {art.pubDate ? new Date(art.pubDate).toLocaleDateString() : ""}
                              </span>
                            </div>

                            <a
                              href={art.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-zinc-900 dark:text-white hover:text-indigo-500 dark:hover:text-indigo-400 line-clamp-2 block transition-colors leading-snug"
                            >
                              {art.title}
                            </a>

                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans line-clamp-3">
                              {art.description}
                            </p>

                            {/* Inline AI Summary Display */}
                            {activeSummaries[art.link] && (
                              <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-950 border border-indigo-500/20 rounded-xl space-y-2">
                                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide">AI Brief Summary</p>
                                <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">{activeSummaries[art.link]}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between border-t border-zinc-150 dark:border-zinc-850 pt-4 mt-5">
                            <button
                              onClick={() => handleSaveArticle(art)}
                              className="text-[10px] font-bold text-zinc-500 hover:text-indigo-500 flex items-center gap-1 cursor-pointer bg-transparent border-0"
                            >
                              Save Article
                            </button>
                            <button
                              onClick={() => handleSummarizeArticle(art)}
                              disabled={summarizingLink === art.link}
                              className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer bg-transparent border-0 disabled:opacity-50"
                            >
                              {summarizingLink === art.link ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Summarizing...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3" />
                                  {activeSummaries[art.link] ? "Hide Summary" : "AI Summarize"}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                </div>
              )}
            </div>
          )}

                 {/* VIEW: BRIEFING */}
          {activeTab === "briefing" && (
            <div className="max-w-3xl space-y-6">
              <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-8 space-y-6 transition-colors duration-200">
                <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-900 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Today's AI Workspace Briefing</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {briefingData?.source === "gemini" ? "🤖 AI Generated Brief" : "Sandbox Fallback Compiler"} • Updated {briefingData?.todayBrief?.[0]?.time || "just now"}
                    </p>
                  </div>
                  <button
                    onClick={refreshBriefing}
                    disabled={briefingLoading}
                    className="p-2 border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${briefingLoading ? 'animate-spin' : ''}`} />
                    {briefingLoading ? "Compiling..." : "Refresh"}
                  </button>
                </div>

                {briefingLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 animate-pulse">Optimus AI is reading platform notifications and compiling briefing summaries...</p>
                  </div>
                ) : briefingError ? (
                  <div className="p-5 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/25 text-xs text-red-600 dark:text-red-400">
                    {briefingError}
                  </div>
                ) : !briefingData || briefingData.todayBrief.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="text-xs text-zinc-500 font-semibold">No active integrations connected to compile briefings.</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Connect Gmail, Slack, or WhatsApp in the Integrations tab.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900/60 space-y-4 font-sans">
                      {briefingData.todayBrief.map((item, index) => (
                        <div key={index} className="flex gap-3.5 items-start border-b border-zinc-150 dark:border-zinc-900/50 last:border-b-0 pb-4 last:pb-0">
                          {getAppIcon(item.app)}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center justify-between gap-2">
                              <span>{getAppLabel(item.app)}</span>
                              <span className="text-[9px] text-zinc-400 font-normal">{item.time}</span>
                            </h4>
                            <p className="text-zinc-650 dark:text-zinc-400 mt-1 leading-relaxed text-xs">{item.summary}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Show priority items compiled in briefing */}
                    {briefingData.priorityItems && briefingData.priorityItems.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-accent">Critical Action Items Detected</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {briefingData.priorityItems.map((item, idx) => (
                            <div key={idx} className="p-4 bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-2xl space-y-2 hover:border-accent/30 transition-colors">
                              <div className="flex items-center justify-between">
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase border ${
                                  item.priority === "Critical"
                                    ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                                    : item.priority === "High"
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-450 border-blue-500/20"
                                }`}>
                                  {item.priority}
                                </span>
                                <span className="text-[9px] text-zinc-400 font-medium">{item.time}</span>
                              </div>
                              <h5 className="text-xs font-bold text-zinc-900 dark:text-white truncate">{item.title}</h5>
                              <p className="text-[10px] text-zinc-550 dark:text-zinc-400 leading-relaxed">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: INTEGRATIONS */}
          {activeTab === "integrations" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-5">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Active Integrations</h3>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">Manage connected application feeds and MCP communication tunnels.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent/10 text-accent border border-accent/20 rounded-xl text-xs font-bold shrink-0 self-start">
                  {Object.values(connectedApps).filter(Boolean).length} Connected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Gmail Card */}
                <div className={`p-6 bg-white dark:bg-zinc-900/20 border rounded-3xl space-y-6 transition-all duration-200 col-span-1 md:col-span-2 lg:col-span-3 ${
                  connectedApps["gmail"] ? "border-zinc-200 dark:border-zinc-900 glow-border" : "border-zinc-200 dark:border-zinc-900/50 opacity-60"
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-red-500/10 text-red-655 dark:text-red-400 border border-red-500/20 rounded-2xl">
                      <Mail className="w-6 h-6" />
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
                      connectedApps["gmail"] 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20" 
                        : "bg-zinc-100 dark:bg-zinc-950 text-zinc-450 dark:text-zinc-650 border-zinc-200 dark:border-zinc-900"
                    }`}>
                      {connectedApps["gmail"] ? "Connected" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Gmail Indexer</h4>
                    <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
                      Scans emails, parses actions, and automates message drafting.
                    </p>
                  </div>

                  {connectedApps["gmail"] ? (
                    <div className="space-y-4 pt-2 border-t border-zinc-150 dark:border-zinc-900">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Connected: <strong className="text-zinc-850 dark:text-zinc-300 font-semibold">{gmailConnectedEmail || "mihsan.dev@gmail.com"}</strong></span>
                        <button
                          onClick={handleDisconnectGmail}
                          className="text-red-500 hover:text-red-600 font-bold transition-all cursor-pointer bg-transparent border-none text-[10px]"
                        >
                          Disconnect
                        </button>
                      </div>

                      {/* Simulated Inbox Manager */}
                      <div className="space-y-3 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider">Simulated Unread Inbox ({mockGmailInbox.length})</span>
                          <span className="text-[8px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded px-1.5 py-0.5 font-bold uppercase">Sandbox</span>
                        </div>

                        {/* List of Simulated Emails */}
                        {mockGmailInbox.length === 0 ? (
                          <p className="text-[10px] text-zinc-500 italic">No simulated unread emails.</p>
                        ) : (
                          <div className="max-h-36 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {mockGmailInbox.map((mail) => (
                              <div key={mail.id} className="p-2 bg-zinc-50 dark:bg-zinc-955/60 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 rounded-xl flex items-start justify-between gap-2">
                                <div className="min-w-0 space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-extrabold text-zinc-800 dark:text-zinc-200 truncate block max-w-[150px]">{mail.from.split("<")[0].trim()}</span>
                                    <span className="text-[8px] text-zinc-450 shrink-0">{mail.date.replace("Today, ", "")}</span>
                                  </div>
                                  <span className="text-[9px] font-semibold text-zinc-655 dark:text-zinc-300 truncate block">{mail.subject}</span>
                                  <span className="text-[8px] text-zinc-500 truncate block">{mail.snippet}</span>
                                </div>
                                <button
                                  onClick={() => handleDeleteMockEmail(mail.id)}
                                  className="text-zinc-400 hover:text-red-500 p-0.5 transition-colors cursor-pointer bg-transparent border-0 shrink-0"
                                  title="Delete simulated email"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Simulated Email Form */}
                        <div className="space-y-2 pt-2 border-t border-zinc-150 dark:border-zinc-850">
                          <input
                            type="text"
                            placeholder="Sender (e.g. Boss <boss@corp.com>)"
                            value={newGmailSender}
                            onChange={(e) => setNewGmailSender(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 focus:border-indigo-500/50 rounded-lg py-1.5 px-2.5 text-[10px] text-zinc-800 dark:text-white outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Subject (e.g. Urgent review needed)"
                            value={newGmailSubject}
                            onChange={(e) => setNewGmailSubject(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-955 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 focus:border-indigo-500/50 rounded-lg py-1.5 px-2.5 text-[10px] text-zinc-800 dark:text-white outline-none"
                          />
                          <textarea
                            placeholder="Email body content..."
                            rows={2}
                            value={newGmailBody}
                            onChange={(e) => setNewGmailBody(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-955 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 focus:border-indigo-500/50 rounded-lg py-1.5 px-2.5 text-[10px] text-zinc-800 dark:text-white outline-none resize-none"
                          />
                          <button
                            onClick={handleAddMockEmail}
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer border-0"
                          >
                            Add Unread Email
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        window.location.href = `/api/gmail/auth?state=${user?.id || "optimus_gmail_auth"}`;
                      }}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/10 cursor-pointer border-none"
                    >
                      Connect Gmail Account
                    </button>
                  )}
                </div>

                {/* Slack Card */}
                <div className={`p-6 bg-white dark:bg-zinc-900/20 border rounded-3xl space-y-6 transition-all duration-200 ${
                  connectedApps["slack"] ? "border-zinc-200 dark:border-zinc-900 glow-border" : "border-zinc-200 dark:border-zinc-900/50 opacity-60"
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-pink-500/10 text-pink-655 dark:text-pink-400 border border-pink-500/20 rounded-2xl">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
                      connectedApps["slack"] 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20" 
                        : "bg-zinc-100 dark:bg-zinc-955 text-zinc-450 dark:text-zinc-650 border-zinc-200 dark:border-zinc-900"
                    }`}>
                      {connectedApps["slack"] ? "Connected" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Slack Sync</h4>
                    <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
                      Syncs chat channels, aggregates mentions, and alerts priorities.
                    </p>
                  </div>

                  {connectedApps["slack"] ? (
                    <div className="space-y-4 pt-2 border-t border-zinc-150 dark:border-zinc-900">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Status: <strong className="text-emerald-600 dark:text-emerald-450 font-semibold">Live Sync Active</strong></span>
                        <button
                          onClick={() => handleDisconnectApp("slack")}
                          className="text-red-500 hover:text-red-600 font-bold transition-all cursor-pointer bg-transparent border-none text-[10px]"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      disabled={connectingAppId === "slack"}
                      onClick={() => handleConnectApp("slack")}
                      className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-500/10 cursor-pointer border-none disabled:opacity-50"
                    >
                      {connectingAppId === "slack" ? "Connecting..." : "Connect Slack Sync"}
                    </button>
                  )}
                </div>

                {/* WhatsApp Card */}
                <div className={`p-6 bg-white dark:bg-zinc-900/20 border rounded-3xl space-y-6 transition-all duration-200 ${
                  connectedApps["whatsapp"] ? "border-zinc-200 dark:border-zinc-900 glow-border" : "border-zinc-200 dark:border-zinc-900/50 opacity-60"
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-emerald-500/10 text-emerald-655 dark:text-emerald-400 border border-emerald-500/20 rounded-2xl">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.012 2C6.485 2 2 6.485 2 12.012c0 1.91.536 3.693 1.464 5.215L2.08 21.92l4.832-1.378a9.96 9.96 0 0 0 5.1 1.39c5.528 0 10.013-4.485 10.013-10.012C22.025 6.485 17.54 2 12.012 2z" fill="currentColor"/>
                      </svg>
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
                      connectedApps["whatsapp"] 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20" 
                        : "bg-zinc-100 dark:bg-zinc-955 text-zinc-450 dark:text-zinc-655 border-zinc-200 dark:border-zinc-900"
                    }`}>
                      {connectedApps["whatsapp"] ? "Connected" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">WhatsApp Linker</h4>
                    <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
                      Transcribes voice notes and digests group sprints.
                    </p>
                  </div>

                  {connectedApps["whatsapp"] ? (
                    <div className="space-y-4 pt-2 border-t border-zinc-150 dark:border-zinc-900">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Status: <strong className="text-emerald-600 dark:text-emerald-450 font-semibold">Live (Linked Devices)</strong></span>
                        <button
                          onClick={() => handleDisconnectApp("whatsapp")}
                          className="text-red-500 hover:text-red-600 font-bold transition-all cursor-pointer bg-transparent border-none text-[10px]"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : showWhatsAppConnect ? (
                    <div className="space-y-4 pt-2 border-t border-zinc-150 dark:border-zinc-900">
                      <form onSubmit={handleWhatsAppSubmit} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Phone Number</label>
                          <input
                            type="text"
                            placeholder="e.g. +16503332026 (with country code)"
                            value={waPhoneNumber}
                            onChange={(e) => setWaPhoneNumber(e.target.value)}
                            disabled={waLoading || waStatus === "pairing"}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 focus:border-indigo-500/50 rounded-lg py-1.5 px-2.5 text-[10px] text-zinc-800 dark:text-white outline-none"
                          />
                        </div>

                        {waError && (
                          <p className="text-[10px] text-red-500">{waError}</p>
                        )}

                        {waStatus === "pairing" && waPairingCode && (
                          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-2 text-center">
                            <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold block uppercase tracking-wide">WhatsApp Pairing Code</span>
                            <span className="text-lg font-mono font-extrabold tracking-widest text-zinc-900 dark:text-white block select-all bg-white dark:bg-zinc-955/80 dark:bg-zinc-950/80 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-900">{waPairingCode}</span>
                            <span className="text-[8.5px] text-zinc-550 dark:text-zinc-400 block leading-normal">
                              Open WhatsApp on your phone &rarr; Link a device &rarr; Link with phone number instead, and enter this code.
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowWhatsAppConnect(false)}
                            className="flex-1 py-2 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer border-0"
                          >
                            Cancel
                          </button>
                          {waStatus !== "pairing" && (
                            <button
                              type="submit"
                              disabled={waLoading || !waPhoneNumber}
                              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer border-0 disabled:opacity-50"
                            >
                              {waLoading ? "Connecting..." : "Get Pairing Code"}
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnectApp("whatsapp")}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer border-none"
                    >
                      Connect WhatsApp Account
                    </button>
                  )}
                </div>

                {/* Outlook Card */}
                <div className={`p-6 bg-white dark:bg-zinc-900/20 border rounded-3xl space-y-6 transition-all duration-200 ${
                  connectedApps["outlook"] ? "border-zinc-200 dark:border-zinc-900 glow-border" : "border-zinc-200 dark:border-zinc-900/50 opacity-60"
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-2xl">
                      <Mail className="w-6 h-6" />
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
                      connectedApps["outlook"] 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20" 
                        : "bg-zinc-100 dark:bg-zinc-955 text-zinc-450 dark:text-zinc-655 border-zinc-200 dark:border-zinc-900"
                    }`}>
                      {connectedApps["outlook"] ? "Connected" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Outlook Calendar</h4>
                    <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
                      Bridges calendar meetings and secures focused time blocks.
                    </p>
                  </div>

                  {connectedApps["outlook"] ? (
                    <div className="space-y-4 pt-2 border-t border-zinc-150 dark:border-zinc-900">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Status: <strong className="text-emerald-600 dark:text-emerald-450 font-semibold">Active</strong></span>
                        <button
                          onClick={() => handleDisconnectApp("outlook")}
                          className="text-red-500 hover:text-red-600 font-bold transition-all cursor-pointer bg-transparent border-none text-[10px]"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      disabled={connectingAppId === "outlook"}
                      onClick={() => handleConnectApp("outlook")}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer border-none disabled:opacity-50"
                    >
                      {connectingAppId === "outlook" ? "Connecting..." : "Connect Outlook Calendar"}
                    </button>
                  )}
                </div>

                {/* Telegram Card */}
                <div className={`p-6 bg-white dark:bg-zinc-900/20 border rounded-3xl space-y-6 transition-all duration-200 ${
                  connectedApps["telegram"] ? "border-zinc-200 dark:border-zinc-900 glow-border" : "border-zinc-200 dark:border-zinc-900/50 opacity-60"
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 rounded-2xl">
                      <Link2 className="w-6 h-6" />
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
                      connectedApps["telegram"] 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20" 
                        : "bg-zinc-100 dark:bg-zinc-955 text-zinc-450 dark:text-zinc-655 border-zinc-200 dark:border-zinc-900"
                    }`}>
                      {connectedApps["telegram"] ? "Connected" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Telegram Bridge</h4>
                    <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
                      Delivers daily summaries and syncs cryptomarket channel trends.
                    </p>
                  </div>

                  {connectedApps["telegram"] ? (
                    <div className="space-y-4 pt-2 border-t border-zinc-150 dark:border-zinc-900">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Status: <strong className="text-emerald-600 dark:text-emerald-450 font-semibold">Active</strong></span>
                        <button
                          onClick={() => handleDisconnectApp("telegram")}
                          className="text-red-500 hover:text-red-600 font-bold transition-all cursor-pointer bg-transparent border-none text-[10px]"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      disabled={connectingAppId === "telegram"}
                      onClick={() => handleConnectApp("telegram")}
                      className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10 cursor-pointer border-none disabled:opacity-50"
                    >
                      {connectingAppId === "telegram" ? "Connecting..." : "Connect Telegram Bridge"}
                    </button>
                  )}
                </div>

                {/* LinkedIn Card */}
                <div className={`p-6 bg-white dark:bg-zinc-900/20 border rounded-3xl space-y-6 transition-all duration-200 ${
                  connectedApps["linkedin"] ? "border-zinc-200 dark:border-zinc-900 glow-border" : "border-zinc-200 dark:border-zinc-900/50 opacity-60"
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-blue-600/10 text-blue-650 dark:text-blue-400 border border-blue-650/20 rounded-2xl">
                      <User className="w-6 h-6" />
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
                      connectedApps["linkedin"] 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20" 
                        : "bg-zinc-100 dark:bg-zinc-955 text-zinc-450 dark:text-zinc-655 border-zinc-200 dark:border-zinc-900"
                    }`}>
                      {connectedApps["linkedin"] ? "Connected" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">LinkedIn Outreach</h4>
                    <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
                      Inspects partnerships requests and drafts custom connection messages.
                    </p>
                  </div>

                  {connectedApps["linkedin"] ? (
                    <div className="space-y-4 pt-2 border-t border-zinc-150 dark:border-zinc-900">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Status: <strong className="text-emerald-600 dark:text-emerald-450 font-semibold">Active</strong></span>
                        <button
                          onClick={() => handleDisconnectApp("linkedin")}
                          className="text-red-500 hover:text-red-600 font-bold transition-all cursor-pointer bg-transparent border-none text-[10px]"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      disabled={connectingAppId === "linkedin"}
                      onClick={() => handleConnectApp("linkedin")}
                      className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10 cursor-pointer border-none disabled:opacity-50"
                    >
                      {connectingAppId === "linkedin" ? "Connecting..." : "Connect LinkedIn Outreach"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ALERTS */}
          {activeTab === "alerts" && (
            <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-6 transition-colors duration-200">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-900 pb-4">
                Smart Action Alerts History
              </h3>
              
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/30 flex items-center justify-between border-l-2 border-l-indigo-500">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">Draft email to Slack partner</span>
                      <span className="text-[9px] text-zinc-500">Spotted in Outlook email at 8:30 AM</span>
                    </div>
                  </div>
                  <span className="text-[8px] px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-indigo-600 dark:text-indigo-400 font-bold uppercase">Pending</span>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-955/30 dark:bg-zinc-950/30 flex items-center justify-between border-l-2 border-l-emerald-500">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">Review design changes request</span>
                      <span className="text-[9px] text-zinc-500">Sent in WhatsApp Group by Mihsan</span>
                    </div>
                  </div>
                  <span className="text-[8px] px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-emerald-600 dark:text-emerald-400 font-bold uppercase">Pending</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SETTINGS */}
          {activeTab === "settings" && (
            <div className="max-w-2xl bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-8 space-y-8 glow-border transition-colors duration-200">
              <h3 className="text-base font-bold text-zinc-905 dark:text-white border-b border-zinc-150 dark:border-zinc-900 pb-4">
                Account & Workspace Settings
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Mihsan's Workspace"
                      className="w-full bg-zinc-50 dark:bg-zinc-955 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 focus:border-indigo-500/50 rounded-xl py-3 px-4 text-xs text-zinc-800 dark:text-white outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                      Sync Frequency
                    </label>
                    <select className="w-full bg-zinc-50 dark:bg-zinc-955 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 focus:border-indigo-500/50 rounded-xl py-3 px-4 text-xs text-zinc-805 dark:text-white outline-none cursor-pointer">
                      <option>Every 15 Minutes</option>
                      <option>Hourly</option>
                      <option>Daily</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-505 dark:text-zinc-400 block">
                    Contact Email Notification
                  </label>
                  <input
                    type="email"
                    value={user?.email || "guest-preview@optimus-hub.io"}
                    disabled
                    className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-3 px-4 text-xs text-zinc-400 dark:text-zinc-500 outline-none cursor-not-allowed"
                  />
                </div>

                <button
                  onClick={() => alert("Settings saved successfully!")}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* VIEW: PRICING SETTINGS */}
          {activeTab === "pricing" && (
            <div className="max-w-4xl space-y-8">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-zinc-905 dark:text-white">Pricing Plans & Settings</h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-455 leading-relaxed">
                  Manage your subscription tier, billing methods, and usage limits.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Free Plan Card */}
                <div className="p-8 bg-white dark:bg-zinc-900/30 border border-indigo-500/30 rounded-3xl space-y-6 relative overflow-hidden glow-border transition-colors duration-200">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent pointer-events-none" />
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                      Active Plan
                    </span>
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-white mt-4">Developer Tier</h4>
                    <p className="text-xs text-zinc-550 dark:text-zinc-400">Perfect for exploring custom AI integrations.</p>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white flex items-baseline gap-1">
                      $0 <span className="text-xs font-normal text-zinc-500 dark:text-zinc-550">/ month</span>
                    </h3>
                  </div>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-900" />
                  <ul className="space-y-3 text-xs text-zinc-605 dark:text-zinc-350">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      5,000 executions per month
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      Up to 3 active app connections
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      Standard daily brief compiling
                    </li>
                  </ul>
                </div>

                {/* Pro Plan Card */}
                <div className="p-8 bg-white dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-900 rounded-3xl space-y-6 hover:border-zinc-350 dark:hover:border-zinc-800 transition-all glow-border transition-colors duration-200">
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                      Upgrade Option
                    </span>
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-white mt-4">Pro Operator</h4>
                    <p className="text-xs text-zinc-550 dark:text-zinc-400">For power users running full automation workflows.</p>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white flex items-baseline gap-1">
                      $19 <span className="text-xs font-normal text-zinc-500 dark:text-zinc-550">/ month</span>
                    </h3>
                  </div>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-900" />
                  <ul className="space-y-3 text-xs text-zinc-605 dark:text-zinc-350">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-650 dark:text-purple-400 shrink-0" />
                      Unlimited executions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-650 dark:text-purple-400 shrink-0" />
                      Unlimited active connections
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-650 dark:text-purple-400 shrink-0" />
                      Voice briefings & SMS dispatching
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-650 dark:text-purple-400 shrink-0" />
                      Priority API access
                    </li>
                  </ul>
                  <button
                    onClick={() => alert("Checkout redirection logic goes here")}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-650 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/15 cursor-pointer animate-fadeIn"
                  >
                    Upgrade Plan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs text-zinc-550 dark:text-zinc-400 font-semibold">Loading Dashboard Console...</span>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
