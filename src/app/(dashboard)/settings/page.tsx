"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
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
          onClick={() => toast.success("Settings saved successfully!")}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border-none"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
