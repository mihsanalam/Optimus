"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function PricingPage() {
  return (
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
            onClick={() => toast.info("Checkout logic will be implemented here.")}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-650 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/15 cursor-pointer animate-fadeIn border-none"
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
}
