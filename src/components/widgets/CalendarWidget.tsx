"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar, CalendarDays, Clock, Video, FileText,
  ChevronLeft, ChevronRight, Loader2, Sparkles,
  Users, Plus, Trash2, X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type TabView = "today" | "week" | "prep";

interface CalendarEvent {
  id: string;
  summary: string;
  startISO: string;
  endISO: string;
  location?: string;
  attendees?: string[];
  isMeeting: boolean;
  meetingLink?: string;
}

const STORAGE_KEY = "optimus_calendar_events";

function loadStoredEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredEvents(events: CalendarEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export default function CalendarWidget() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabView>("today");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [prepLoading, setPrepLoading] = useState(false);
  const [prepBrief, setPrepBrief] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);

  // Add-form state
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newStartTime, setNewStartTime] = useState("10:00");
  const [newEndTime, setNewEndTime] = useState("11:00");
  const [newIsMeeting, setNewIsMeeting] = useState(false);
  const [newMeetingLink, setNewMeetingLink] = useState("");

  const fetchCalendarEvents = useCallback(async () => {
    setLoading(true);
    const gmailAccessToken = typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null;
    const gmailRefreshToken = typeof window !== "undefined" ? localStorage.getItem("gmail_refresh_token") : null;

    if (gmailAccessToken || gmailRefreshToken) {
      try {
        const queryParams = new URLSearchParams({
          userId: user?.id || "",
          gmailAccessToken: gmailAccessToken || "",
          gmailRefreshToken: gmailRefreshToken || ""
        });
        const res = await fetch(`/api/calendar?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success && data.isConnected) {
          const mapped = data.events.map((evt: any) => ({
            id: evt.id,
            summary: evt.summary,
            startISO: evt.start,
            endISO: evt.end,
            location: evt.location,
            attendees: evt.attendees,
            isMeeting: (evt.attendees && evt.attendees.length > 0) || evt.location?.toLowerCase().includes("zoom") || evt.location?.toLowerCase().includes("meet") || evt.summary?.toLowerCase().includes("sync") || evt.summary?.toLowerCase().includes("meeting"),
            meetingLink: evt.location?.startsWith("http") ? evt.location : undefined
          }));
          setEvents(mapped);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch Google Calendar events:", err);
      }
    }

    const stored = loadStoredEvents();
    setEvents(stored);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  const toDate = (iso: string) => new Date(iso);

  const formatTime = (iso: string) => {
    return toDate(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  const eventsForDate = useCallback((date: Date) => {
    return events.filter(e => isSameDay(toDate(e.startISO), date))
      .sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime());
  }, [events]);

  const todayEvents = eventsForDate(currentDate);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const startISO = new Date(`${newDate}T${newStartTime}:00`).toISOString();
    const endISO = new Date(`${newDate}T${newEndTime}:00`).toISOString();

    const gmailAccessToken = typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null;
    const gmailRefreshToken = typeof window !== "undefined" ? localStorage.getItem("gmail_refresh_token") : null;

    if (gmailAccessToken || gmailRefreshToken) {
      setLoading(true);
      try {
        const res = await fetch("/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id || null,
            gmailAccessToken,
            gmailRefreshToken,
            summary: newTitle.trim(),
            startISO,
            endISO,
            description: newIsMeeting ? `Meeting Link: ${newMeetingLink}` : undefined,
            location: newMeetingLink || undefined
          })
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Event added to Google Calendar");
          await fetchCalendarEvents();
          setNewTitle("");
          setNewIsMeeting(false);
          setNewMeetingLink("");
          setShowAddForm(false);
          return;
        } else {
          toast.error(`Google Calendar error: ${data.error}`);
        }
      } catch (err) {
        toast.error("Failed to sync event with Google Calendar");
      } finally {
        setLoading(false);
      }
    }

    const newEvent: CalendarEvent = {
      id: `evt-${Date.now()}`,
      summary: newTitle.trim(),
      startISO,
      endISO,
      isMeeting: newIsMeeting,
      meetingLink: newIsMeeting ? newMeetingLink : undefined,
    };

    const updated = [...events, newEvent];
    setEvents(updated);
    saveStoredEvents(updated);
    toast.success("Event added to local calendar");

    setNewTitle("");
    setNewIsMeeting(false);
    setNewMeetingLink("");
    setShowAddForm(false);
  };

  const handleDeleteEvent = async (id: string) => {
    const gmailAccessToken = typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null;
    const gmailRefreshToken = typeof window !== "undefined" ? localStorage.getItem("gmail_refresh_token") : null;

    if ((gmailAccessToken || gmailRefreshToken) && !id.startsWith("evt-")) {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          id,
          userId: user?.id || "",
          gmailAccessToken: gmailAccessToken || "",
          gmailRefreshToken: gmailRefreshToken || ""
        });
        const res = await fetch(`/api/calendar?${queryParams.toString()}`, {
          method: "DELETE"
        });
        const data = await res.json();
        if (data.success) {
          toast("Event removed from Google Calendar", { icon: "🗑️" });
          await fetchCalendarEvents();
          return;
        } else {
          toast.error(`Failed to delete event: ${data.error}`);
        }
      } catch (err) {
        toast.error("Failed to remove event from Google Calendar");
      } finally {
        setLoading(false);
      }
    }

    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    saveStoredEvents(updated);
    toast("Event removed from local calendar", { icon: "🗑️" });
  };

  const generatePrepBrief = async () => {
    setPrepLoading(true);
    const apiKey = localStorage.getItem("gemini_api_key") || "";
    const nextMtg = events
      .filter(e => e.isMeeting && new Date(e.startISO) > new Date())
      .sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime())[0];

    if (!nextMtg) {
      setPrepBrief("");
      setPrepLoading(false);
      return;
    }

    if (apiKey) {
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customApiKey: apiKey,
            systemInstruction: "You are Optimus, an AI meeting preparation assistant. Generate a concise, actionable meeting prep brief.",
            messages: [{
              role: "user",
              content: `Generate a brief meeting preparation summary for the following event:\n\nTitle: "${nextMtg.summary}"\nTime: ${formatTime(nextMtg.startISO)} — ${formatTime(nextMtg.endISO)}\nDate: ${new Date(nextMtg.startISO).toLocaleDateString()}\n${nextMtg.meetingLink ? `Link: ${nextMtg.meetingLink}` : ""}\n\nProvide 3-5 bullet points covering: key discussion points to prepare, potential decisions needed, and any context from the meeting title. Keep it professional and concise.`
            }]
          })
        });
        const data = await res.json();
        if (data.success && data.reply) {
          setPrepBrief(data.reply);
        } else {
          setPrepBrief(`📋 Meeting: ${nextMtg.summary}\n⏰ ${formatTime(nextMtg.startISO)} — ${formatTime(nextMtg.endISO)}\n\nAI prep requires a valid Gemini API key. Set it in Settings.`);
        }
      } catch {
        setPrepBrief(`📋 Meeting: ${nextMtg.summary}\n⏰ ${formatTime(nextMtg.startISO)} — ${formatTime(nextMtg.endISO)}\n\nFailed to generate AI brief. Check your API key.`);
      }
    } else {
      setPrepBrief(`📋 Meeting: ${nextMtg.summary}\n⏰ ${formatTime(nextMtg.startISO)} — ${formatTime(nextMtg.endISO)}\n\nTo enable AI-powered prep briefs, add your Gemini API key in Settings.`);
    }
    setPrepLoading(false);
  };

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };
  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const nextMeeting = events
    .filter(e => e.isMeeting && new Date(e.startISO) > new Date())
    .sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime())[0];

  return (
    <div className="glass-panel rounded-3xl flex flex-col h-[400px] transition-all glow-border col-span-1 md:col-span-2 overflow-hidden bg-white dark:bg-zinc-900/30">
      {/* Header and Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 p-4 shrink-0 bg-zinc-50/50 dark:bg-zinc-950/40">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-accent/10 text-accent rounded-xl">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Calendar</h3>
            <p className="text-[9px] text-zinc-550 dark:text-zinc-500">{events.length} event{events.length !== 1 ? "s" : ""} total</p>
          </div>
        </div>

        {/* Widget Tabs */}
        <div className="flex bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
          {(["today", "week", "prep"] as TabView[]).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "prep" && !prepBrief) generatePrepBrief();
              }}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                activeTab === tab
                  ? "bg-white dark:bg-zinc-800 text-accent shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {tab === "prep" && <Sparkles className="w-3 h-3" />}
              {tab === "today" ? "Today" : tab === "week" ? "Week" : "AI Prep"}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm z-10">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        )}

        {/* ═══ TODAY VIEW ═══ */}
        {activeTab === "today" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 pb-1">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                {isToday(currentDate) ? "Today's Events" : currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h4>
              <div className="flex gap-1">
                <button onClick={handlePrevDay} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={handleNextDay} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                <button onClick={() => setShowAddForm(f => !f)} className="p-1 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer" title="Add Event"><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Quick Add Form */}
            {showAddForm && (
              <form onSubmit={handleAddEvent} className="p-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2.5 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">New Event</span>
                  <button type="button" onClick={() => setShowAddForm(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
                <input
                  value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Event title..."
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-accent transition-colors"
                  required
                />
                <div className="grid grid-cols-3 gap-2">
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-1.5 text-[10px] text-zinc-900 dark:text-white focus:outline-none focus:border-accent" />
                  <input type="time" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-1.5 text-[10px] text-zinc-900 dark:text-white focus:outline-none focus:border-accent" />
                  <input type="time" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-1.5 text-[10px] text-zinc-900 dark:text-white focus:outline-none focus:border-accent" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={newIsMeeting} onChange={e => setNewIsMeeting(e.target.checked)} className="accent-accent w-3 h-3" />
                    <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">Meeting</span>
                  </label>
                  {newIsMeeting && (
                    <input value={newMeetingLink} onChange={e => setNewMeetingLink(e.target.value)} placeholder="Meet link (optional)" className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-[10px] text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-accent" />
                  )}
                </div>
                <button type="submit" disabled={!newTitle.trim()} className="w-full py-2 bg-accent hover:bg-accent/90 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50">
                  Add Event
                </button>
              </form>
            )}

            {/* Events List */}
            {todayEvents.length === 0 && !showAddForm ? (
              <div className="text-center py-8">
                <CalendarDays className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 font-semibold">No events scheduled</p>
                <p className="text-[10px] text-zinc-400 mt-1">Click + to add an event</p>
              </div>
            ) : (
              todayEvents.map(evt => (
                <div key={evt.id} className="group relative flex items-stretch gap-3 p-3 bg-zinc-50/80 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 hover:border-accent/30 rounded-2xl transition-all hover:shadow-md hover:shadow-accent/5">
                  <div className="flex flex-col items-center justify-center w-12 shrink-0 border-r border-zinc-200 dark:border-zinc-800/60 pr-3">
                    <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-200">{formatTime(evt.startISO)}</span>
                    <span className="text-[9px] text-zinc-500 mt-0.5">to</span>
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-450">{formatTime(evt.endISO)}</span>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-white truncate pr-4">{evt.summary}</h5>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {evt.isMeeting && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          <Video className="w-2.5 h-2.5" />Meeting
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 pl-2 border-l border-zinc-200 dark:border-zinc-800/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    {evt.isMeeting && evt.meetingLink && (
                      <a href={evt.meetingLink} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-accent hover:bg-accent/80 text-white rounded-lg shadow-sm transition-all" title="Join">
                        <Video className="w-3 h-3" />
                      </a>
                    )}
                    <button onClick={() => handleDeleteEvent(evt.id)} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer" title="Delete">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ═══ WEEK VIEW ═══ */}
        {activeTab === "week" && (
          <div className="h-full flex flex-col">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-3 px-1">Week at a Glance</h4>
            <div className="flex-1 grid grid-cols-7 gap-2 pb-2">
              {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                const date = new Date();
                date.setDate(date.getDate() - date.getDay() + dayOffset);
                const isCurrentDay = isToday(date);
                const dayEvents = eventsForDate(date);

                return (
                  <div key={dayOffset} className={`flex flex-col border rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    isCurrentDay
                      ? "border-accent/30 bg-accent/5 dark:bg-accent/5 shadow-sm shadow-accent/10"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40"
                  }`} onClick={() => { setCurrentDate(new Date(date)); setActiveTab("today"); }}>
                    <div className={`text-center py-2 border-b text-[10px] font-bold uppercase tracking-wider ${
                      isCurrentDay
                        ? "bg-accent/10 text-accent border-accent/20"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-500"
                    }`}>
                      {date.toLocaleDateString(undefined, { weekday: 'short' })}
                      <span className="block text-sm font-black mt-0.5 text-zinc-900 dark:text-white">{date.getDate()}</span>
                    </div>
                    <div className="flex-1 p-1.5 space-y-1">
                      {dayEvents.length > 0 ? (
                        dayEvents.slice(0, 3).map(evt => (
                          <div key={evt.id} className={`w-full h-1.5 rounded-full ${evt.isMeeting ? "bg-purple-400" : "bg-accent"} opacity-60`} title={evt.summary} />
                        ))
                      ) : (
                        <div className="w-full h-full min-h-[30px] flex items-center justify-center">
                          <span className="text-[8px] text-zinc-400">—</span>
                        </div>
                      )}
                      {dayEvents.length > 3 && (
                        <span className="text-[7px] text-zinc-500 font-bold text-center block">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ AI MEETING PREP ═══ */}
        {activeTab === "prep" && (
          <div className="h-full flex flex-col space-y-3">
            {nextMeeting ? (
              <>
                <div className="bg-gradient-to-br from-purple-500/10 to-accent/10 border border-purple-500/20 rounded-2xl p-4">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500 text-white uppercase tracking-wider mb-2 shadow-sm shadow-purple-500/30">
                    <Sparkles className="w-2.5 h-2.5" />
                    Upcoming Meeting
                  </span>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{nextMeeting.summary}</h4>
                  <p className="text-[10px] text-zinc-550 dark:text-zinc-450 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />{formatTime(nextMeeting.startISO)} — {formatTime(nextMeeting.endISO)}
                  </p>
                </div>
                <div className="flex-1 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3 border-b border-zinc-200 dark:border-zinc-800/50 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <h5 className="text-[11px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest">AI Context Brief</h5>
                    </div>
                    <button onClick={generatePrepBrief} className="text-[9px] text-accent font-bold hover:underline cursor-pointer">Refresh</button>
                  </div>
                  {prepLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                      <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                      <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest animate-pulse">Scanning context...</p>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">
                      {prepBrief || "Click the AI Prep tab to generate a brief."}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <FileText className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">No Upcoming Meetings</h4>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px]">Add a meeting event and AI prep briefs will be generated automatically.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
