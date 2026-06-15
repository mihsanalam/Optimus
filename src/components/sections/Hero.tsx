"use client";

import React from "react";
import { Sparkles, ArrowRight, Play, CheckCircle, Zap, Shield, AppWindow, Mail, MessageCircle, MessageSquare, Link2, Briefcase, Calendar } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 lg:pt-40 lg:pb-36 bg-background bg-grid-pattern transition-colors duration-200">
      {/* Glow Effects */}
      <div className="absolute top-[10%] left-[50%] -translate-x-[50%] w-[50rem] h-[30rem] rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[5%] left-[25%] w-[25rem] h-[25rem] rounded-full bg-purple-500/10 dark:bg-purple-500/10 blur-[130px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Hero Left Content */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            {/* Feature Announcement Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-500/15 transition-all">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-600 dark:text-indigo-400" />
              Introducing Optimus AI 1.0
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
              Unify Your Apps. <br />
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Let AI Orchestrate Your Day.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-zinc-650 dark:text-zinc-400 max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Securely connect <span className="text-zinc-800 dark:text-zinc-200 font-semibold">Gmail, WhatsApp, Slack, Telegram, LinkedIn, and Outlook</span>. Get automated chat digests, context-aware reminders, and synchronized daily briefs crafted by artificial intelligence.
            </p>

            {/* Call To Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a
                href="#demo"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl text-sm font-bold shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02] hover:shadow-indigo-600/30 active:scale-[0.98]"
              >
                Connect Your Apps
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#features"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-85 hover:border-zinc-350 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-zinc-400 dark:fill-zinc-400 stroke-zinc-400 dark:stroke-zinc-400" />
                How It Works
              </a>
            </div>

            {/* Social Trust / Integration Icons */}
            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-900/60 max-w-xl mx-auto lg:mx-0">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-550 block mb-4">
                Securely Integrates with
              </span>
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 dark:text-red-400 text-xs font-bold hover:bg-red-500/10 transition-colors">
                  <Mail className="w-3.5 h-3.5" /> Gmail
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/10 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/5 border border-pink-500/10 text-pink-600 dark:text-pink-400 text-xs font-bold hover:bg-pink-500/10 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" /> Slack
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/5 border border-sky-500/10 text-sky-605 dark:text-sky-400 text-xs font-bold hover:bg-sky-500/10 transition-colors">
                  <Link2 className="w-3.5 h-3.5" /> Telegram
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-500/10 transition-colors">
                  <Briefcase className="w-3.5 h-3.5" /> LinkedIn
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-500/10 transition-colors">
                  <Calendar className="w-3.5 h-3.5" /> Outlook
                </div>
              </div>
            </div>
          </div>

          {/* Hero Right Media / Floating Dashboard Preview */}
          <div className="flex-1 w-full max-w-xl lg:max-w-none relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/15 dark:to-purple-500/15 blur-3xl pointer-events-none rounded-3xl group-hover:scale-105 transition-all duration-700" />
            
            {/* The Dashboard Mockup */}
            <div className="border border-zinc-200 dark:border-zinc-850/80 bg-white/80 dark:bg-zinc-900/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl relative glow-border hover:-translate-y-1 hover:shadow-indigo-500/5 transition-all duration-500">
              {/* Fake Window bar */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-900 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500/70 border border-red-650" />
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500/70 border border-amber-650" />
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/70 border border-emerald-650" />
                </div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-550 font-mono tracking-wider">optimus-dashboard.io</div>
                <div className="w-8" />
              </div>

              {/* Fake App Layout */}
              <div className="space-y-6">
                {/* Greeting Card */}
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/15 border border-indigo-100 dark:border-indigo-900/25 flex items-start gap-4 hover:bg-indigo-100/50 dark:hover:bg-indigo-950/25 transition-colors duration-300">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-5 h-5 animate-pulse text-indigo-650 dark:text-indigo-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zinc-905 dark:text-white">Daily Briefing Compiled</h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      "Good morning Mihsan. You have 3 urgent emails from Gmail, 1 Slack call at 11 AM, and a customer reminder from WhatsApp."
                    </p>
                  </div>
                </div>

                {/* Grid layout */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Status Item 1 */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-900 flex items-center gap-3.5 hover:border-pink-500/20 hover:bg-zinc-100 dark:hover:bg-zinc-950/50 transition-all duration-300">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400">
                      <MessageSquare className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block truncate">Slack Sync</span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-450 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Active
                      </span>
                    </div>
                  </div>

                  {/* Status Item 2 */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-900 flex items-center gap-3.5 hover:border-red-500/20 hover:bg-zinc-100 dark:hover:bg-zinc-950/50 transition-all duration-300">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-650 dark:text-red-400">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block truncate">Gmail Indexer</span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-450 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tasks Preview */}
                <div className="space-y-2.5">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-500 block">Smart Action Alerts</span>
                  
                  {/* Alert 1 */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/20 hover:bg-zinc-100 dark:hover:bg-zinc-950/45 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all flex items-center justify-between border-l-2 border-l-indigo-500">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-zinc-850 dark:text-zinc-200 block truncate">Draft email to Slack partner</span>
                        <span className="text-[9px] text-zinc-500 block">Spotted in Outlook email from 8:30 AM</span>
                      </div>
                    </div>
                    <span className="text-[8px] px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-indigo-600 dark:text-indigo-400 font-bold tracking-wide">Review</span>
                  </div>

                  {/* Alert 2 */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/20 hover:bg-zinc-100 dark:hover:bg-zinc-950/45 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all flex items-center justify-between border-l-2 border-l-emerald-500">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-zinc-850 dark:text-zinc-200 block truncate">Review design changes request</span>
                        <span className="text-[9px] text-zinc-500 block">Sent in WhatsApp Group by Mihsan</span>
                      </div>
                    </div>
                    <span className="text-[8px] px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-emerald-600 dark:text-emerald-400 font-bold tracking-wide">Review</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
