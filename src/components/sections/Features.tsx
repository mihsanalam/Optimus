"use client";

import React from "react";
import { 
  Layers, 
  Sparkles, 
  BellRing, 
  ShieldCheck, 
  MailCheck, 
  Zap 
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  colorClass: string;
}

function FeatureCard({ icon, title, description, colorClass }: FeatureCardProps) {
  return (
    <div className="group border border-zinc-200 dark:border-zinc-900/80 bg-white dark:bg-zinc-950/15 backdrop-blur-md rounded-3xl p-8 hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/15 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 relative overflow-hidden glow-border">
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-bl from-indigo-500/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl" />
      <div className="space-y-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-105 ${colorClass}`}>
          {icon}
        </div>
        <h4 className="text-lg font-bold text-zinc-850 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors duration-300">{title}</h4>
        <p className="text-sm text-zinc-550 dark:text-zinc-455 leading-relaxed group-hover:text-zinc-700 dark:group-hover:text-zinc-350 transition-colors duration-300">{description}</p>
      </div>
    </div>
  );
}

export default function Features() {
  const featuresList = [
    {
      icon: <Layers className="w-5 h-5" />,
      title: "Omni-App Connection",
      description: "Securely link Gmail, WhatsApp, Slack, Telegram, LinkedIn, and Outlook accounts to orchestrate all messages in one centralized database.",
      colorClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 group-hover:bg-indigo-500/20",
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Contextual AI Summaries",
      description: "Convert cluttered Slack threads, massive chat backlogs, and multi-page email loops into succinct, readable summaries with bullet points.",
      colorClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 group-hover:bg-purple-500/20",
    },
    {
      icon: <BellRing className="w-5 h-5" />,
      title: "Predictive Reminders",
      description: "Our agent detects critical dates and commitments in your communications. It automatically logs them as reminders or schedules tasks for you.",
      colorClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 group-hover:bg-teal-500/20",
    },
    {
      icon: <MailCheck className="w-5 h-5" />,
      title: "Daily Morning Briefs",
      description: "Wake up to a synthesized overview of your schedules, urgent notifications, and upcoming deadlines, gathered across all connected platforms.",
      colorClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 group-hover:bg-amber-500/20",
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: "Secure Encryption Gateways",
      description: "Your session keys and credentials are safe. We use end-to-end OAuth protocols and AES-256 databases, meaning your private messages remain private.",
      colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/20",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Custom Workflows Automation",
      description: "Set up triggers like 'If client mentions billing on WhatsApp, notify my Slack channel and create an Outlook draft' in seconds.",
      colorClass: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 group-hover:bg-pink-500/20",
    },
  ];

  return (
    <section id="features" className="py-24 border-y border-zinc-200 dark:border-zinc-900/60 bg-gradient-to-b from-background via-zinc-100/20 dark:via-[#050b18] to-background transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-650 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Intelligent Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-905 dark:text-white tracking-tight">
            How Optimus Elevates Your Workflow
          </h2>
          <p className="text-sm sm:text-base text-zinc-550 dark:text-zinc-400 leading-relaxed">
            Stop switching between tabs to check notifications. Let Optimus aggregate your channels, synthesize messages, and organize your schedule.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuresList.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>

      </div>
    </section>
  );
}
