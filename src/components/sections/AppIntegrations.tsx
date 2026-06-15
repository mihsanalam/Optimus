"use client";

import React, { useState } from "react";
import { MessageCircle, Mail, MessageSquare, Briefcase, Calendar, Sparkles, CheckCircle2, Link2 } from "lucide-react";

interface IntegrationItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  themeColor: string;
  bgGlow: string;
  aiFeature: string;
  description: string;
  samplePrompt: string;
}

export default function AppIntegrations() {
  const [selectedAppId, setSelectedAppId] = useState("gmail");

  const integrations: IntegrationItem[] = [
    {
      id: "gmail",
      name: "Gmail Indexer",
      icon: <Mail className="w-6 h-6" />,
      themeColor: "text-red-655 dark:text-red-400 border-red-500/30",
      bgGlow: "from-red-500/10 to-transparent",
      aiFeature: "Intelligent Email Filtering & Action Outlines",
      description: "Scans incoming mail headers and newsletters. Extracts critical tasks, drafts standard auto-replies, and flags threads requiring manual input.",
      samplePrompt: "Extract task: 'Review marketing proposal before Friday meeting' and draft a response indicating it's on my schedule."
    },
    {
      id: "whatsapp",
      name: "WhatsApp Linker",
      icon: <MessageCircle className="w-6 h-6" />,
      themeColor: "text-emerald-655 dark:text-emerald-400 border-emerald-500/30",
      bgGlow: "from-emerald-500/10 to-transparent",
      aiFeature: "Voice Memo Summaries & Chat Digests",
      description: "Transcribes WhatsApp voice memos in the background. Creates brief, actionable bullet points from family, client, or team chat groups.",
      samplePrompt: "Voice Note: Transcribed and summarized. Key action: Pick up files from print shop at 4 PM."
    },
    {
      id: "slack",
      name: "Slack Webhook",
      icon: <MessageSquare className="w-6 h-6" />,
      themeColor: "text-pink-655 dark:text-pink-400 border-pink-500/30",
      bgGlow: "from-pink-500/10 to-transparent",
      aiFeature: "Multi-Channel Priority Logs",
      description: "Aggregates mentions across multiple Slack workspaces. Sorts threads by priority, ensuring you answer urgent blockages first.",
      samplePrompt: "Mention in #dev-ops: 'Deploy pipeline failing on staging'. Status: High Priority. Logged to Optimus Dashboard."
    },
    {
      id: "telegram",
      name: "Telegram Bridge",
      icon: <Link2 className="w-6 h-6" />,
      themeColor: "text-sky-655 dark:text-sky-400 border-sky-500/30",
      bgGlow: "from-sky-500/10 to-transparent",
      aiFeature: "Group Chat Trend Spotting",
      description: "Extracts key topics from busy Telegram channels and cryptomarkets/startup communities, compiling a daily PDF digest.",
      samplePrompt: "Summarized 450 messages: Main topic discussed was Next.js 15 breaking changes and Tailwind CSS v4 support."
    },
    {
      id: "linkedin",
      name: "LinkedIn Connector",
      icon: <Briefcase className="w-6 h-6" />,
      themeColor: "text-blue-655 dark:text-blue-400 border-blue-500/30",
      bgGlow: "from-blue-500/10 to-transparent",
      aiFeature: "Lead Nurturing & Message Drafter",
      description: "Scans connection requests and inbox messages. Recommends customized, high-converting outreach replies based on user background.",
      samplePrompt: "Draft connection reply to CTO of TechInc: Congratulate on recent funding and suggest scheduling a demo next Tuesday."
    },
    {
      id: "outlook",
      name: "Outlook Sync",
      icon: <Calendar className="w-6 h-6" />,
      themeColor: "text-indigo-655 dark:text-indigo-400 border-indigo-500/30",
      bgGlow: "from-indigo-500/10 to-transparent",
      aiFeature: "Smart Calendar Allocation",
      description: "Synchronizes task deadlines with Outlook Calendar schedules. Book block times dynamically to ensure focused workspace sessions.",
      samplePrompt: "Calendar Blocked: 2 Hours allocated for 'Refactor multi-tenant token storage' matching Optimus tasks."
    }
  ];

  const activeApp = integrations.find(item => item.id === selectedAppId) || integrations[0];

  return (
    <section id="integrations" className="py-24 bg-background transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-655 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Connected Workspaces
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Supported Communications Ecosystem
          </h2>
          <p className="text-sm sm:text-base text-zinc-550 dark:text-zinc-400 leading-relaxed">
            Optimus seamlessly bridges your preferred communication channels, converting chaotic, scattered streams into structured workspace briefings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Grid Selector */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            {integrations.map(app => {
              const isSelected = app.id === selectedAppId;
              return (
                 <button
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={`flex flex-col items-start gap-4 p-6 border rounded-3xl transition-all duration-300 text-left relative overflow-hidden cursor-pointer hover:-translate-y-0.5 ${
                    isSelected 
                      ? "border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/15 shadow-xl shadow-indigo-500/5 glow-border" 
                      : "border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/10 hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/10"
                  }`}
                >
                  {/* Selector Icon */}
                  <div className={`p-3 rounded-2xl border transition-all duration-500 ${isSelected ? "scale-105" : ""} ${app.themeColor} bg-zinc-50 dark:bg-zinc-900/50`}>
                    {app.icon}
                  </div>
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{app.name}</h4>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-555 font-semibold uppercase block mt-1">
                      {isSelected ? "Active Inspect" : "Inspect Integration"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Detail Pane */}
          <div className="lg:col-span-6">
            <div className="border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-gradient-to-tr dark:from-zinc-950/40 dark:to-zinc-900/20 rounded-3xl p-8 relative overflow-hidden shadow-2xl transition-colors duration-200">
              {/* Background gradient indicator */}
              <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl ${activeApp.bgGlow} blur-3xl pointer-events-none`} />

              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl border ${activeApp.themeColor} bg-zinc-50 dark:bg-zinc-900/80`}>
                    {activeApp.icon}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400">Capabilities</span>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{activeApp.name}</h3>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">AI Operations Core</span>
                  <h4 className="text-base font-bold text-indigo-600 dark:text-indigo-400">{activeApp.aiFeature}</h4>
                  <p className="text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed pt-1">
                    {activeApp.description}
                  </p>
                </div>

                <div className="h-px bg-zinc-200 dark:bg-zinc-900" />

                {/* Sample Prompt / Output widget */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-550 dark:text-zinc-400">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    SAMPLE AI RESULT OUTPUT
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900/80 font-mono text-xs text-indigo-700 dark:text-indigo-300/90 leading-relaxed">
                    {activeApp.samplePrompt}
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2">
                  <a
                    href="#demo"
                    className="inline-flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-[0.98]"
                  >
                    Test In Interactive Demo
                    <CheckCircle2 className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
