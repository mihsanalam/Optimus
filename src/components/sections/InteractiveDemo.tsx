import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Power, 
  RefreshCw, 
  CheckCircle, 
  ListTodo, 
  Clock, 
  ArrowRight,
  Mail,
  MessageCircle,
  MessageSquare,
  Briefcase,
  Calendar,
  Link2
} from "lucide-react";

interface DemoApp {
  id: string;
  name: string;
  icon: React.ReactNode;
  themeColor: string;
  isConnected: boolean;
  sampleData: {
    label: string;
    rawText: string;
    summary: string;
    reminders: string[];
  };
}

export default function InteractiveDemo() {
  const [apps, setApps] = useState<DemoApp[]>([
    {
      id: "gmail",
      name: "Gmail",
      icon: <Mail className="w-5 h-5" />,
      themeColor: "text-red-655 dark:text-red-400 border-red-500/20 bg-red-500/5",
      isConnected: true,
      sampleData: {
        label: "Inbox: Client Project Scopes",
        rawText: "From: Sarah Miller <sarah@millermedia.com>\nSubject: Project specifications for redesign\nHey! Just wanted to follow up on the website redesign spec. We need the final feedback on the figma wireframes by Friday 3 PM so we can start coding. Also, could you send over the updated copy doc as soon as you can? Thanks!",
        summary: "Sarah Miller from Miller Media is requesting design feedback and copywriting updates for the website redesign project.",
        reminders: [
          "Submit final feedback on Figma wireframes (Deadline: Friday 3:00 PM)",
          "Send the updated copy document to Sarah as soon as possible"
        ]
      }
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: <MessageCircle className="w-5 h-5" />,
      themeColor: "text-emerald-650 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
      isConnected: false,
      sampleData: {
        label: "Group Chat: Dev & Launch Sprint",
        rawText: "Mihsan Alam: 'Hey team, I've pushed the main Next.js layout. Please review it.'\nJohn (QA): 'Looks great on desktop, but need to check mobile hamburger menu bug. I will fix it by tonight.'\nMihsan Alam: 'Awesome, let's target deployment check-in tomorrow at 9 AM.'",
        summary: "Mihsan pushed the Next.js core layout. John is debugging the mobile hamburger menu tonight. Team sync is planned for tomorrow morning.",
        reminders: [
          "Attend deployment team sync meeting (Tomorrow at 9:00 AM)",
          "Inspect John's mobile hamburger menu fix on staging"
        ]
      }
    },
    {
      id: "slack",
      name: "Slack",
      icon: <MessageSquare className="w-5 h-5" />,
      themeColor: "text-pink-650 dark:text-pink-400 border-pink-500/20 bg-pink-500/5",
      isConnected: true,
      sampleData: {
        label: "Mentions: #optimus-alerts",
        rawText: "[10:24 AM] system-bot: Alert! DB migration failed for workspace token table. User: 'mihsan_admin'. Please check database logs immediately.\n[10:30 AM] Lead Architect: 'I'll look into it around noon, let know if anyone else finds the root cause.'",
        summary: "A database migration failed for the workspace OAuth token table. The system architect will review the issue at noon.",
        reminders: [
          "Check database migration logs for token table errors",
          "Follow up with Lead Architect regarding database fix (Today at 12:00 PM)"
        ]
      }
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: <Link2 className="w-5 h-5" />,
      themeColor: "text-sky-655 dark:text-sky-400 border-sky-500/20 bg-sky-500/5",
      isConnected: false,
      sampleData: {
        label: "Inbox: Freelance Requests",
        rawText: "David K: 'Hey! Are you open to a new SaaS build next month? Need a fast developer for a stripe integration app. Let me know your rates. We can hop on a telegram call tomorrow at 5 PM if you're free.'",
        summary: "David K is inquiring about developer availability for a SaaS integration app and proposed a meeting tomorrow afternoon.",
        reminders: [
          "Reply to David K regarding freelance rates and availability",
          "Hop on Telegram alignment call with David K (Tomorrow at 5:00 PM)"
        ]
      }
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: <Briefcase className="w-5 h-5" />,
      themeColor: "text-blue-650 dark:text-blue-400 border-blue-500/20 bg-blue-500/5",
      isConnected: false,
      sampleData: {
        label: "Inbox: Partnership Invites",
        rawText: "Elena Rostova (TechRecruiter): 'Hi Mihsan! I saw your portfolio. We are hosting a technical roundtable panel next Tuesday at 6 PM. We would love to have you as a guest speaker to talk about AI agent development. Let me know if you are interested!'",
        summary: "Elena Rostova invited Mihsan to guest speak about AI agent coding at a technical panel next Tuesday.",
        reminders: [
          "Respond to Elena Rostova regarding the speaker invite",
          "Mark calendar: Tech Roundtable Panel Speaker (Next Tuesday at 6:00 PM)"
        ]
      }
    },
    {
      id: "outlook",
      name: "Outlook",
      icon: <Calendar className="w-5 h-5" />,
      themeColor: "text-indigo-650 dark:text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
      isConnected: false,
      sampleData: {
        label: "Inbox: Client Invoices",
        rawText: "From: accounting@acme.corp\nSubject: Invoice #2035 past due\nDear Contractor, this is a reminder that payment for Invoice #2035 of $2,500 is now past due. Please clear the pending balance by Monday June 18. Thank you.",
        summary: "Accounting at Acme Corp sent a past-due notice for Invoice #2035 ($2,500) with a payment deadline of Monday, June 18.",
        reminders: [
          "Submit payment/reconcile invoice #2035 (Deadline: Monday, June 18)"
        ]
      }
    }
  ]);

  const [activeAppId, setActiveAppId] = useState("gmail");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResult, setProcessedResult] = useState<{
    summary: string;
    reminders: string[];
  } | null>(null);

  // Sync with localStorage
  useEffect(() => {
    const loadState = () => {
      const saved = localStorage.getItem("connected_integrations");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setApps(prev => prev.map(app => ({
            ...app,
            isConnected: !!parsed[app.id]
          })));
        } catch (e) {
          // Ignore
        }
      }
    };
    loadState();
    window.addEventListener("storage", loadState);
    return () => window.removeEventListener("storage", loadState);
  }, []);

  const toggleConnection = (id: string) => {
    const saved = localStorage.getItem("connected_integrations");
    let parsed: Record<string, boolean> = {};
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch (e) {
        // Ignore
      }
    }
    const currentVal = !!parsed[id];
    const updated = { ...parsed, [id]: !currentVal };
    localStorage.setItem("connected_integrations", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));

    setApps(prev => prev.map(app => 
      app.id === id ? { ...app, isConnected: !app.isConnected } : app
    ));
    setProcessedResult(null);
  };

  const activeApp = apps.find(app => app.id === activeAppId) || apps[0];

  const handleProcess = () => {
    if (!activeApp.isConnected) return;
    setIsProcessing(true);
    setProcessedResult(null);
    
    setTimeout(() => {
      setProcessedResult({
        summary: activeApp.sampleData.summary,
        reminders: activeApp.sampleData.reminders
      });
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <section id="demo" className="py-24 bg-gradient-to-b from-background via-zinc-150/10 dark:via-[#040919] to-background transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-655 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Interactive Playground
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            See the AI Agent in Action
          </h2>
          <p className="text-sm sm:text-base text-zinc-550 dark:text-zinc-400 leading-relaxed">
            Connect mock applications, feed in raw notification feeds, and watch Optimus instantly synthesize summaries and schedule tasks.
          </p>
        </div>

        {/* Demo Area */}
        <div className="bg-white dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-8 shadow-2xl space-y-8 transition-colors duration-200">
          
          {/* Step 1: Connect / Disconnect Cards */}
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-500 block">
              Step 1: Toggle App Authentication Mock
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {apps.map(app => (
                <div
                  key={app.id}
                  className={`flex flex-col items-center justify-between p-4 border rounded-2xl transition-all duration-350 text-center hover:scale-[1.015] ${
                    app.isConnected
                      ? "border-indigo-500/30 bg-indigo-50 dark:bg-indigo-955/10 dark:bg-indigo-950/10 shadow-lg shadow-indigo-500/5 glow-border"
                      : "border-zinc-200 dark:border-zinc-900 bg-zinc-100/30 dark:bg-zinc-955/15 dark:bg-zinc-950/15 opacity-60 hover:opacity-85"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border mb-3 transition-transform duration-500 ${app.isConnected ? "scale-105" : ""} ${app.themeColor} bg-zinc-50 dark:bg-zinc-900/50`}>
                    {app.icon}
                  </div>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-3">{app.name}</span>
                  
                  <button
                    onClick={() => toggleConnection(app.id)}
                    className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
                      app.isConnected
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-850 hover:text-zinc-805 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Power className="w-2.5 h-2.5" />
                    {app.isConnected ? "Active" : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-zinc-200 dark:bg-zinc-900" />

          {/* Step 2: Playground Board */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Input Selection */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-500 block">
                Step 2: Choose Active Feed
              </span>

              {/* Selector Tabs */}
              <div className="flex flex-wrap gap-2">
                {apps.map(app => (
                  <button
                    key={app.id}
                    onClick={() => {
                      setActiveAppId(app.id);
                      setProcessedResult(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      app.id === activeAppId
                        ? "border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/15 text-indigo-650 dark:text-indigo-400"
                        : "border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/10 text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-800"
                    }`}
                  >
                    {app.name}
                  </button>
                ))}
              </div>

              {/* Raw Data Card */}
              <div className="bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 space-y-4 glow-border transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-350 uppercase tracking-wide">
                    {activeApp.sampleData.label}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    activeApp.isConnected 
                      ? "bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border border-emerald-500/20" 
                      : "bg-red-500/10 text-red-655 dark:text-red-400 border border-red-500/20"
                  }`}>
                    {activeApp.isConnected ? "Auth Enabled" : "Auth Required"}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900/60 font-mono text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed min-h-[140px] whitespace-pre-line">
                  {activeApp.sampleData.rawText}
                </div>

                <button
                  onClick={handleProcess}
                  disabled={isProcessing || !activeApp.isConnected}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/15 hover:shadow-indigo-600/25 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Optimus AI Summarizing...
                    </>
                  ) : !activeApp.isConnected ? (
                    "Authorize App Connection Above"
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Run AI Summarizer & Reminder
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: AI Output Details */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-500 block">
                Step 3: Synthesized Output
              </span>

              <div className="bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 min-h-[340px] flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-zinc-955/60 dark:bg-zinc-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10 animate-fadeIn">
                    <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Extracting action items...</span>
                  </div>
                )}

                {!processedResult && !isProcessing && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500 space-y-3">
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-400">Output Stream Empty</p>
                      <p className="text-xs text-zinc-550 dark:text-zinc-655 max-w-xs mt-1">Select an active connected app and click 'Run AI Summarizer' to view processed logs.</p>
                    </div>
                  </div>
                )}

                {processedResult && !isProcessing && (
                  <div className="space-y-6 animate-fadeIn flex-1">
                    {/* Summary Result */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">AI Summary Summary</span>
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed bg-white dark:bg-zinc-955/50 dark:bg-zinc-955/50 dark:bg-zinc-950/50 p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl">
                        {processedResult.summary}
                      </p>
                    </div>

                    {/* Reminders / Action Items */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-purple-650 dark:text-purple-400 uppercase tracking-widest">Smart Reminders & Schedules</span>
                      <div className="space-y-2.5">
                        {processedResult.reminders.map((reminder, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-955/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-xl">
                            <Clock className="w-4 h-4 text-purple-650 dark:text-purple-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-zinc-600 dark:text-zinc-350 leading-normal">{reminder}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {processedResult && !isProcessing && (
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-900 mt-6 flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5 text-[10px]">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Processed by Optimus Agent
                    </span>
                    
                    <a 
                      href="#features"
                      className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold flex items-center gap-1 transition-all"
                    >
                      See developer API
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
