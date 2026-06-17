"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDashboardContext } from "@/context/DashboardContext";
import { Mail, MessageSquare, Link2, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function IntegrationsPage() {
  const { user } = useAuth();
  const { connectedApps, setConnectedApps } = useDashboardContext();

  const [connectingAppId, setConnectingAppId] = useState<string | null>(null);
  const [gmailConnectedEmail, setGmailConnectedEmail] = useState<string | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem("gmail_user_email");
    if (savedEmail) {
      setGmailConnectedEmail(savedEmail);
    }
  }, []);



  const [waStatus, setWaStatus] = useState("disconnected");
  const [waPairingCode, setWaPairingCode] = useState("");
  const [waPhoneNumber, setWaPhoneNumber] = useState("");
  const [waLogs, setWaLogs] = useState<string[]>([]);
  const [waError, setWaError] = useState("");
  const [waLoading, setWaLoading] = useState(false);
  const [showWhatsAppConnect, setShowWhatsAppConnect] = useState(false);

  const [whatsappInputs, setWhatsappInputs] = useState({ phone: "", message: "" });
  const [gmailInputs, setGmailInputs] = useState({ to: "", subject: "", body: "" });
  const [gmailLogs, setGmailLogs] = useState<string[]>([]);
  const [gmailOutput, setGmailOutput] = useState<any>(null);
  const [executingTool, setExecutingTool] = useState(false);

  useEffect(() => {
    // Basic polling for WhatsApp status if dialog is open or connecting
    let interval: NodeJS.Timeout;
    const checkStatus = async () => {
      try {
        const queryParams = user?.id ? `?userId=${user.id}` : "";
        const res = await fetch(`/api/whatsapp/status${queryParams}`);
        const data = await res.json();
        if (data.success) {
          setWaStatus(data.status);
          setWaLogs(data.logs || []);
          if (data.pairingCode) {
            setWaPairingCode(data.pairingCode);
          }
        }
      } catch (e) {
        console.error("WhatsApp status poll error:", e);
      }
    };
    if (connectedApps["whatsapp"] || showWhatsAppConnect) {
      checkStatus();
      interval = setInterval(checkStatus, 5000);
    }
    return () => clearInterval(interval);
  }, [connectedApps, showWhatsAppConnect]);

  useEffect(() => {
    if (waStatus === "connected" && !connectedApps["whatsapp"]) {
      const updated = { ...connectedApps, whatsapp: true };
      setConnectedApps(updated);
      localStorage.setItem("connected_integrations", JSON.stringify(updated));
      setShowWhatsAppConnect(false);
      toast.success("WhatsApp Linked Successfully!");
    }
  }, [waStatus, connectedApps, setConnectedApps]);

  useEffect(() => {
    // Handle Gmail connection success from OAuth callback
    const searchParams = new URLSearchParams(window.location.search);
    const gmailStatus = searchParams.get("gmail_status");
    const gmailEmail = searchParams.get("gmail_email");
    
    if (gmailStatus === "success" && !connectedApps["gmail"]) {
      const updated = { ...connectedApps, gmail: true };
      setConnectedApps(updated);
      localStorage.setItem("connected_integrations", JSON.stringify(updated));
      if (gmailEmail) {
        setGmailConnectedEmail(gmailEmail);
        localStorage.setItem("gmail_user_email", gmailEmail);
      }
      toast.success("Gmail Authorized Successfully!");
      
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete("gmail_status");
      url.searchParams.delete("gmail_email");
      url.searchParams.delete("gmail_token");
      url.searchParams.delete("gmail_refresh_token");
      window.history.replaceState({}, "", url.toString());
    } else if (gmailStatus === "error") {
      toast.error("Failed to connect to Gmail.");
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete("gmail_status");
      url.searchParams.delete("gmail_error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [connectedApps, setConnectedApps]);

  const handleConnectApp = (id: string) => {
    if (id === "whatsapp") {
      setShowWhatsAppConnect(true);
      setWaPhoneNumber("");
      setWaPairingCode("");
      setWaError("");
      setWaStatus("disconnected");
      return;
    }

    setConnectingAppId(id);
    setTimeout(() => {
      const updated = { ...connectedApps, [id]: true };
      setConnectedApps(updated);
      localStorage.setItem("connected_integrations", JSON.stringify(updated));
      toast.success(`${id.charAt(0).toUpperCase() + id.slice(1)} linked successfully!`);
      setConnectingAppId(null);
    }, 1200);
  };

  const handleDisconnectApp = async (id: string) => {
    if (id === "whatsapp") {
      try {
        await fetch("/api/whatsapp/disconnect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id })
        });
      } catch (e) {
        // Ignore
      }
      setWaStatus("disconnected");
      setShowWhatsAppConnect(false);
      setWaPhoneNumber("");
      setWaPairingCode("");
    }
    const updated = { ...connectedApps, [id]: false };
    setConnectedApps(updated);
    localStorage.setItem("connected_integrations", JSON.stringify(updated));
    toast.error(`${id.charAt(0).toUpperCase() + id.slice(1)} disconnected.`);
  };

  const handleDisconnectGmail = () => {
    handleDisconnectApp("gmail");
    localStorage.removeItem("gmail_access_token");
    localStorage.removeItem("gmail_refresh_token");
    localStorage.removeItem("gmail_user_email");
    setGmailConnectedEmail(null);
  };



  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waPhoneNumber) {
      setWaError("Phone number is required");
      return;
    }
    setWaLoading(true);
    setWaError("");
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: waPhoneNumber, userId: user?.id })
      });
      const data = await res.json();
      if (data.success) {
        setWaPairingCode(data.pairingCode);
        setWaStatus("pairing");
        toast.info("Pairing code generated! Enter it in WhatsApp Link Devices.");
      } else {
        setWaError(data.error || "Failed to request pairing code");
        toast.error("Pairing request failed.");
      }
    } catch (err: any) {
      setWaError(err.message || "Failed to connect to the WhatsApp API gateway");
    } finally {
      setWaLoading(false);
    }
  };

  const runMcpTool = async (tool: any) => {
    setExecutingTool(true);
    setGmailLogs(prev => [...prev, `[MCP COMMAND] Invoking tool ${tool.name}...`]);

    if (tool.name.startsWith("whatsapp.")) {
      try {
        const response = await fetch("/api/whatsapp/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toolName: tool.name,
            inputs: whatsappInputs,
            userId: user?.id
          })
        });
        const data = await response.json();
        if (data.success) {
          setGmailLogs(prev => [
            ...prev,
            `[MCP RESPONSE] API Call Status: 200 OK (${data.output?.source || 'live'})`,
            `[MCP DATA] Executed successfully via WhatsApp Baileys Gateway.`
          ]);
          setGmailOutput(data.output);
          toast.success(`Executed ${tool.name} successfully`);
        } else {
          setGmailLogs(prev => [
            ...prev,
            `[MCP ERROR] Command execution failed: ${data.error || "Unknown error"}`
          ]);
          setGmailOutput({ error: data.error });
          toast.error(`Error running ${tool.name}`);
        }
      } catch (err: any) {
        setGmailLogs(prev => [
          ...prev,
          `[MCP ERROR] HTTP Connection failed: ${err.message}`
        ]);
        setGmailOutput({ error: err.message });
      } finally {
        setExecutingTool(false);
      }
      return;
    }
    
    setTimeout(() => {
      let result: any;
      if (tool.name === "gmail.send_message") {
        result = { success: true, message_id: `msg-${Math.floor(Math.random() * 10000)}` };
        setGmailLogs(prev => [
          ...prev,
          `[MCP RESPONSE] API Call Status: 200 OK`,
          `[MCP DATA] Sent message to ${gmailInputs.to || 'client@millermedia.com'} - ID: ${result.message_id}`
        ]);
      } else {
        result = { success: true };
        setGmailLogs(prev => [
          ...prev,
          `[MCP RESPONSE] Command completed successfully. Retrieved records.`
        ]);
      }
      setGmailOutput(result);
      setExecutingTool(false);
      toast.success(`Executed ${tool.name} successfully`);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-5">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">Active Integrations</h3>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">Manage connected application feeds and MCP communication tunnels.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent/10 text-accent border border-accent/20 rounded-xl text-xs font-bold shrink-0 self-start">
          {Object.values(connectedApps).filter(Boolean).length} Connected
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gmail Card */}
        <div className={`p-6 bg-white dark:bg-zinc-900/20 border rounded-3xl space-y-6 transition-all duration-200 col-span-1 md:col-span-2 lg:col-span-3 ${
          connectedApps["gmail"] ? "border-zinc-200 dark:border-zinc-900 glow-border" : "border-zinc-200 dark:border-zinc-900/50 opacity-60"
        }`}>
          <div className="flex items-start justify-between">
            <div className="p-3 bg-red-500/10 text-red-655 dark:text-red-400 border border-red-500/20 rounded-2xl">
              <Mail className="w-6 h-6" />
            </div>
            <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
              connectedApps["gmail"] 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20" 
                : "bg-zinc-100 dark:bg-zinc-950 text-zinc-450 dark:text-zinc-650 border-zinc-200 dark:border-zinc-900"
            }`}>
              {connectedApps["gmail"] ? "Connected" : "Inactive"}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Gmail Indexer</h4>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
              Scans emails, parses actions, and automates message drafting.
            </p>
          </div>

          {connectedApps["gmail"] ? (
            <div className="space-y-4 pt-2 border-t border-zinc-150 dark:border-zinc-900">
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Connected: <strong className="text-zinc-850 dark:text-zinc-300 font-semibold">{gmailConnectedEmail || "Active Account"}</strong></span>
                <button
                  onClick={handleDisconnectGmail}
                  className="text-red-500 hover:text-red-600 font-bold transition-all cursor-pointer bg-transparent border-none text-[10px]"
                >
                  Disconnect
                </button>
              </div>

            </div>
          ) : (
            <button
              onClick={() => {
                window.location.href = `/api/gmail/auth?state=${user?.id || "optimus_gmail_auth"}`;
              }}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/10 cursor-pointer border-none"
            >
              Connect Gmail Account
            </button>
          )}
        </div>

        {/* Slack Card */}
        <div className={`p-6 bg-white dark:bg-zinc-900/20 border rounded-3xl space-y-6 transition-all duration-200 ${
          connectedApps["slack"] ? "border-zinc-200 dark:border-zinc-900 glow-border" : "border-zinc-200 dark:border-zinc-900/50 opacity-60"
        }`}>
          <div className="flex items-start justify-between">
            <div className="p-3 bg-pink-500/10 text-pink-655 dark:text-pink-400 border border-pink-500/20 rounded-2xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
              connectedApps["slack"] 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20" 
                : "bg-zinc-100 dark:bg-zinc-955 text-zinc-450 dark:text-zinc-650 border-zinc-200 dark:border-zinc-900"
            }`}>
              {connectedApps["slack"] ? "Connected" : "Inactive"}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Slack Sync</h4>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
              Syncs chat channels, aggregates mentions, and alerts priorities.
            </p>
          </div>

          {connectedApps["slack"] ? (
            <div className="space-y-4 pt-2 border-t border-zinc-150 dark:border-zinc-900">
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Status: <strong className="text-emerald-600 dark:text-emerald-450 font-semibold">Live Sync Active</strong></span>
                <button
                  onClick={() => handleDisconnectApp("slack")}
                  className="text-red-500 hover:text-red-600 font-bold transition-all cursor-pointer bg-transparent border-none text-[10px]"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <button
              disabled={connectingAppId === "slack"}
              onClick={() => handleConnectApp("slack")}
              className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-500/10 cursor-pointer border-none disabled:opacity-50"
            >
              {connectingAppId === "slack" ? "Connecting..." : "Connect Slack Sync"}
            </button>
          )}
        </div>

        {/* WhatsApp Card */}
        <div className={`p-6 bg-white dark:bg-zinc-900/20 border rounded-3xl space-y-6 transition-all duration-200 ${
          connectedApps["whatsapp"] ? "border-zinc-200 dark:border-zinc-900 glow-border" : "border-zinc-200 dark:border-zinc-900/50 opacity-60"
        }`}>
          <div className="flex items-start justify-between">
            <div className="p-3 bg-emerald-500/10 text-emerald-655 dark:text-emerald-400 border border-emerald-500/20 rounded-2xl">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.012 2C6.485 2 2 6.485 2 12.012c0 1.91.536 3.693 1.464 5.215L2.08 21.92l4.832-1.378a9.96 9.96 0 0 0 5.1 1.39c5.528 0 10.013-4.485 10.013-10.012C22.025 6.485 17.54 2 12.012 2z" fill="currentColor"/>
              </svg>
            </div>
            <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
              connectedApps["whatsapp"] 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border-emerald-500/20" 
                : "bg-zinc-100 dark:bg-zinc-955 text-zinc-450 dark:text-zinc-655 border-zinc-200 dark:border-zinc-900"
            }`}>
              {connectedApps["whatsapp"] ? "Connected" : "Inactive"}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">WhatsApp Linker</h4>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
              Transcribes voice notes and digests group sprints.
            </p>
          </div>

          {connectedApps["whatsapp"] ? (
            <div className="space-y-4 pt-2 border-t border-zinc-150 dark:border-zinc-900">
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Status: <strong className="text-emerald-600 dark:text-emerald-450 font-semibold">{waStatus === "connected" ? "Live (Connected)" : "Linked Devices"}</strong></span>
                <button
                  onClick={() => handleDisconnectApp("whatsapp")}
                  className="text-red-500 hover:text-red-600 font-bold transition-all cursor-pointer bg-transparent border-none text-[10px]"
                >
                  Disconnect
                </button>
              </div>

              {/* Send Test Message Sub-panel */}
              <div className="space-y-2.5 pt-3 border-t border-dashed border-zinc-205 dark:border-zinc-800">
                <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block">Send Test Message</span>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Recipient Phone Number"
                    value={whatsappInputs.phone}
                    onChange={(e) => setWhatsappInputs(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg py-1 px-2.5 text-[9px] text-zinc-800 dark:text-white outline-none"
                  />
                  <textarea
                    placeholder="Message Text"
                    value={whatsappInputs.message}
                    onChange={(e) => setWhatsappInputs(prev => ({ ...prev, message: e.target.value }))}
                    rows={2}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg py-1 px-2.5 text-[9px] text-zinc-800 dark:text-white outline-none resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => runMcpTool({ name: "whatsapp.send_message" })}
                    disabled={executingTool || !whatsappInputs.phone || !whatsappInputs.message}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-bold cursor-pointer transition-all border-0 disabled:opacity-50"
                  >
                    {executingTool ? "Sending..." : "Send Test Message"}
                  </button>
                </div>
              </div>

              {/* Live System Logs Terminal */}
              {waLogs.length > 0 && (
                <div className="space-y-1 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                  <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-455 uppercase tracking-wider block">Live Node Logs</span>
                  <div className="bg-zinc-950 dark:bg-black rounded-lg p-2 font-mono text-[8.5px] text-zinc-400 overflow-y-auto max-h-24 space-y-1">
                    {waLogs.slice(-5).map((log, idx) => (
                      <div key={idx} className="leading-normal whitespace-pre-wrap">{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : showWhatsAppConnect ? (
            <div className="space-y-4 pt-2 border-t border-zinc-150 dark:border-zinc-900">
              <form onSubmit={handleWhatsAppSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +16503332026 (with country code)"
                    value={waPhoneNumber}
                    onChange={(e) => setWaPhoneNumber(e.target.value)}
                    disabled={waLoading || waStatus === "pairing"}
                    className="w-full bg-zinc-50 dark:bg-zinc-955 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 focus:border-indigo-500/50 rounded-lg py-1.5 px-2.5 text-[10px] text-zinc-800 dark:text-white outline-none"
                  />
                </div>

                {waError && (
                  <p className="text-[10px] text-red-500">{waError}</p>
                )}

                {waStatus === "pairing" && waPairingCode && (
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-2 text-center">
                    <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold block uppercase tracking-wide">WhatsApp Pairing Code</span>
                    <span className="text-lg font-mono font-extrabold tracking-widest text-zinc-900 dark:text-white block select-all bg-white dark:bg-zinc-955/80 dark:bg-zinc-950/80 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-900">{waPairingCode}</span>
                    <span className="text-[8.5px] text-zinc-550 dark:text-zinc-400 block leading-normal">
                      Open WhatsApp on your phone &rarr; Link a device &rarr; Link with phone number instead, and enter this code.
                    </span>

                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWhatsAppConnect(false)}
                    className="flex-1 py-2 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer border-0"
                  >
                    Cancel
                  </button>
                  {waStatus !== "pairing" && (
                    <button
                      type="submit"
                      disabled={waLoading || !waPhoneNumber}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer border-0 disabled:opacity-50"
                    >
                      {waLoading ? "Connecting..." : "Get Pairing Code"}
                    </button>
                  )}
                </div>
              </form>

              {waLogs.length > 0 && (
                <div className="space-y-1 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                  <span className="text-[9px] font-bold text-zinc-505 dark:text-zinc-455 uppercase tracking-wider block">Link Logs</span>
                  <div className="bg-zinc-950 dark:bg-black rounded-lg p-2 font-mono text-[8.5px] text-zinc-400 overflow-y-auto max-h-24 space-y-1">
                    {waLogs.map((log, idx) => (
                      <div key={idx} className="leading-normal whitespace-pre-wrap">{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleConnectApp("whatsapp")}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer border-none"
            >
              Connect WhatsApp Account
            </button>
          )}
        </div>

        {/* Outlook Card */}
        <div className={`p-6 bg-white dark:bg-zinc-900/20 border rounded-3xl space-y-6 transition-all duration-200 ${
          connectedApps["outlook"] ? "border-zinc-200 dark:border-zinc-900 glow-border" : "border-zinc-200 dark:border-zinc-900/50 opacity-60"
        }`}>
          <div className="flex items-start justify-between">
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-2xl">
              <Mail className="w-6 h-6" />
            </div>
            <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
              connectedApps["outlook"] 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20" 
                : "bg-zinc-100 dark:bg-zinc-955 text-zinc-450 dark:text-zinc-655 border-zinc-200 dark:border-zinc-900"
            }`}>
              {connectedApps["outlook"] ? "Connected" : "Inactive"}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Outlook Calendar</h4>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
              Bridges calendar meetings and secures focused time blocks.
            </p>
          </div>

          {connectedApps["outlook"] ? (
            <div className="space-y-4 pt-2 border-t border-zinc-150 dark:border-zinc-900">
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Status: <strong className="text-emerald-600 dark:text-emerald-450 font-semibold">Active</strong></span>
                <button
                  onClick={() => handleDisconnectApp("outlook")}
                  className="text-red-500 hover:text-red-600 font-bold transition-all cursor-pointer bg-transparent border-none text-[10px]"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <button
              disabled={connectingAppId === "outlook"}
              onClick={() => handleConnectApp("outlook")}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer border-none disabled:opacity-50"
            >
              {connectingAppId === "outlook" ? "Connecting..." : "Connect Outlook Calendar"}
            </button>
          )}
        </div>

        {/* Telegram Card */}
        <div className={`p-6 bg-white dark:bg-zinc-900/20 border rounded-3xl space-y-6 transition-all duration-200 ${
          connectedApps["telegram"] ? "border-zinc-200 dark:border-zinc-900 glow-border" : "border-zinc-200 dark:border-zinc-900/50 opacity-60"
        }`}>
          <div className="flex items-start justify-between">
            <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 rounded-2xl">
              <Link2 className="w-6 h-6" />
            </div>
            <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
              connectedApps["telegram"] 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20" 
                : "bg-zinc-100 dark:bg-zinc-955 text-zinc-450 dark:text-zinc-655 border-zinc-200 dark:border-zinc-900"
            }`}>
              {connectedApps["telegram"] ? "Connected" : "Inactive"}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Telegram Bridge</h4>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
              Delivers daily summaries and syncs cryptomarket channel trends.
            </p>
          </div>

          {connectedApps["telegram"] ? (
            <div className="space-y-4 pt-2 border-t border-zinc-150 dark:border-zinc-900">
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Status: <strong className="text-emerald-600 dark:text-emerald-450 font-semibold">Active</strong></span>
                <button
                  onClick={() => handleDisconnectApp("telegram")}
                  className="text-red-500 hover:text-red-600 font-bold transition-all cursor-pointer bg-transparent border-none text-[10px]"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <button
              disabled={connectingAppId === "telegram"}
              onClick={() => handleConnectApp("telegram")}
              className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10 cursor-pointer border-none disabled:opacity-50"
            >
              {connectingAppId === "telegram" ? "Connecting..." : "Connect Telegram Bridge"}
            </button>
          )}
        </div>

        {/* LinkedIn Card */}
        <div className={`p-6 bg-white dark:bg-zinc-900/20 border rounded-3xl space-y-6 transition-all duration-200 ${
          connectedApps["linkedin"] ? "border-zinc-200 dark:border-zinc-900 glow-border" : "border-zinc-200 dark:border-zinc-900/50 opacity-60"
        }`}>
          <div className="flex items-start justify-between">
            <div className="p-3 bg-blue-600/10 text-blue-650 dark:text-blue-400 border border-blue-650/20 rounded-2xl">
              <User className="w-6 h-6" />
            </div>
            <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
              connectedApps["linkedin"] 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20" 
                : "bg-zinc-100 dark:bg-zinc-955 text-zinc-450 dark:text-zinc-655 border-zinc-200 dark:border-zinc-900"
            }`}>
              {connectedApps["linkedin"] ? "Connected" : "Inactive"}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">LinkedIn Outreach</h4>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
              Inspects partnerships requests and drafts custom connection messages.
            </p>
          </div>

          {connectedApps["linkedin"] ? (
            <div className="space-y-4 pt-2 border-t border-zinc-150 dark:border-zinc-900">
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Status: <strong className="text-emerald-600 dark:text-emerald-450 font-semibold">Active</strong></span>
                <button
                  onClick={() => handleDisconnectApp("linkedin")}
                  className="text-red-500 hover:text-red-600 font-bold transition-all cursor-pointer bg-transparent border-none text-[10px]"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <button
              disabled={connectingAppId === "linkedin"}
              onClick={() => handleConnectApp("linkedin")}
              className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10 cursor-pointer border-none disabled:opacity-50"
            >
              {connectingAppId === "linkedin" ? "Connecting..." : "Connect LinkedIn Outreach"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
