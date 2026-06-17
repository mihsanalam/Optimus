"use client";

import React from "react";
import { Sliders } from "lucide-react";
import CalendarWidget from "@/components/widgets/CalendarWidget";
import QuickTasks from "@/components/widgets/QuickTasks";
import StickyNotes from "@/components/widgets/StickyNotes";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import WorldClock from "@/components/widgets/WorldClock";

export default function WorkspacePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-150 dark:border-zinc-800 pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-pink-500" />
            Operational Workspace
          </h3>
          <p className="text-xs text-zinc-500 mt-1">Utility modules to keep your operational workflow synced.</p>
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
  );
}
