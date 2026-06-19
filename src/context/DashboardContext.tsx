"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Mail, MessageSquare, Calendar, Activity } from "lucide-react";
import { insforge } from "@/lib/insforge";
import { useAuth } from "@/context/AuthContext";

interface DashboardContextType {
  connectedApps: Record<string, boolean>;
  setConnectedApps: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  briefingData: any;
  setBriefingData: React.Dispatch<React.SetStateAction<any>>;
  briefingLoading: boolean;
  setBriefingLoading: React.Dispatch<React.SetStateAction<boolean>>;
  alerts: any[];
  setAlerts: React.Dispatch<React.SetStateAction<any[]>>;
  chatMessages: Array<{ role: "user" | "assistant"; content: string }>;
  setChatMessages: React.Dispatch<React.SetStateAction<Array<{ role: "user" | "assistant"; content: string }>>>;
  customApiKey: string;
  setCustomApiKey: React.Dispatch<React.SetStateAction<string>>;
  refreshBriefing: () => Promise<void>;
  getAppLabel: (app: string) => string;
  getAppIcon: (app: string) => React.ReactNode;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [connectedApps, setConnectedApps] = useState<Record<string, boolean>>({});
  const [briefingData, setBriefingData] = useState<any>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hello! I am Optimus, your workflow assistant. Ask me anything, or click 'What's on today?' to get a complete daily overview." }
  ]);
  const [customApiKey, setCustomApiKey] = useState("");

  // Load connected integrations state
  useEffect(() => {
    const loadState = () => {
      const saved = localStorage.getItem("connected_integrations");
      if (saved) {
        try {
          setConnectedApps(JSON.parse(saved));
        } catch (e) {}
      } else {
        const defaults = { gmail: true, slack: true };
        setConnectedApps(defaults);
        localStorage.setItem("connected_integrations", JSON.stringify(defaults));
      }
    };
    loadState();
  }, []);

  // No more mock data initialization.

  const refreshBriefing = async () => {
    setBriefingLoading(true);
    try {
      const hasAnyApp = Object.values(connectedApps).some(v => v);
      if (!hasAnyApp) {
        setBriefingData({ stats: { importantCount: 0, followUpsCount: 0 }, todayBrief: [], priorityItems: [] });
        return;
      }

      const res = await fetch("/api/briefing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectedApps,
          userId: user?.id || null,
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBriefingData(data);
      } else {
        throw new Error("Failed to generate briefing");
      }
    } catch (error) {
      console.warn("Error fetching briefing from API:", error);
      setBriefingData({ stats: { importantCount: 0, followUpsCount: 0 }, todayBrief: [], priorityItems: [] });
    } finally {
      setBriefingLoading(false);
    }
  };

  useEffect(() => {
    // Wait for auth to resolve so we have the userId for token lookups
    if (authLoading) return;
    
    // Initial fetch
    if (Object.keys(connectedApps).length > 0) {
      refreshBriefing();
    }
  }, [connectedApps, user?.id, authLoading]);

  const getAppLabel = (app: string) => {
    switch (app.toLowerCase()) {
      case "gmail": return "Gmail Indexer";
      case "whatsapp": return "WhatsApp Linker";
      case "slack": return "Slack Sync";
      case "outlook": return "Outlook Calendar";
      default: return app;
    }
  };

  const getAppIcon = (app: string) => {
    switch (app.toLowerCase()) {
      case "gmail": return <Mail className="w-4 h-4 text-red-500" />;
      case "whatsapp": return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case "slack": return <MessageSquare className="w-4 h-4 text-pink-500" />;
      case "outlook": return <Calendar className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        connectedApps,
        setConnectedApps,
        briefingData,
        setBriefingData,
        briefingLoading,
        setBriefingLoading,
        alerts,
        setAlerts,
        chatMessages,
        setChatMessages,
        customApiKey,
        setCustomApiKey,
        refreshBriefing,
        getAppLabel,
        getAppIcon
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return context;
}
