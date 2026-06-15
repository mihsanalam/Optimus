"use client";

import React, { useState, useEffect } from "react";
import { Clock, Globe, Moon, Sun } from "lucide-react";

interface TimezoneClock {
  name: string;
  tz: string;
  label: string;
}

const TIMEZONES: TimezoneClock[] = [
  { name: "Local Time", tz: Intl.DateTimeFormat().resolvedOptions().timeZone, label: "Your location" },
  { name: "New York", tz: "America/New_York", label: "Eastern Standard Time" },
  { name: "London", tz: "Europe/London", label: "GMT / British Summer Time" },
  { name: "Dubai", tz: "Asia/Dubai", label: "Gulf Standard Time" },
  { name: "Tokyo", tz: "Asia/Tokyo", label: "Japan Standard Time" }
];

export default function WorldClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClock = (date: Date, tz: string) => {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true
      });
      return formatter.format(date);
    } catch (e) {
      return "--:--:-- --";
    }
  };

  const getHour = (date: Date, tz: string) => {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        hour12: false
      }).formatToParts(date);
      const hr = parts.find((p) => p.type === "hour");
      return hr ? parseInt(hr.value) : 12;
    } catch {
      return 12;
    }
  };

  const isDaytime = (hour: number) => {
    return hour >= 6 && hour < 18;
  };

  return (
    <div className="glass-panel rounded-3xl p-6 flex flex-col h-[400px] transition-all glow-border">
      <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-accent/10 text-accent rounded-xl">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">World Clocks</h3>
            <p className="text-[9px] text-zinc-500">Global team & client timezones</p>
          </div>
        </div>
      </div>

      {/* Clocks List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {!time ? (
          <div className="h-full flex items-center justify-center">
            <Globe className="w-5 h-5 animate-spin text-zinc-400" />
          </div>
        ) : (
          TIMEZONES.map((zone) => {
            const timeStr = formatClock(time, zone.tz);
            const hourVal = getHour(time, zone.tz);
            const isDay = isDaytime(hourVal);

            return (
              <div
                key={zone.name}
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 hover:border-zinc-200 dark:hover:border-zinc-805 transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 truncate">
                      {zone.name}
                    </span>
                    {isDay ? (
                      <span title="Daytime"><Sun className="w-3.5 h-3.5 text-amber-500" /></span>
                    ) : (
                      <span title="Nighttime"><Moon className="w-3.5 h-3.5 text-accent" /></span>
                    )}
                  </div>
                  <span className="text-[9px] text-zinc-405 dark:text-zinc-500 block truncate mt-0.5">
                    {zone.label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-zinc-900 dark:text-white font-mono tracking-tight">
                    {timeStr}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
