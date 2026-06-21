"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { insforge } from "@/lib/insforge";
import { toast } from "sonner";
import {
  Briefcase,
  User,
  Clock,
  FileText,
  Send,
  DollarSign,
  TrendingUp,
  Plus,
  Trash2,
  FileDown,
  Sparkles,
  Share2,
  CheckCircle2,
  X,
  ExternalLink,
  PlusCircle,
  Loader2,
  Printer,
  Calendar,
  AlertCircle,
  ChevronRight,
  Edit,
  Mic,
  Play,
  Square
} from "lucide-react";
import { useVoice } from "@/hooks/use-voice";

// Types matching database schemas
interface Client {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  created_at?: string | null;
}

interface Project {
  id: string;
  client_id?: string | null;
  name: string;
  status: string;
  hourly_rate: number;
  billing_type?: string | null;
  fixed_price?: number | null;
  created_at?: string | null;
}

interface TimeLog {
  id: string;
  project_id?: string | null;
  description?: string | null;
  hours: number;
  logged_date: string;
  created_at?: string | null;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  client_id?: string | null;
  invoice_number: string;
  amount: number;
  status: string;
  issued_date: string;
  due_date: string;
  items: InvoiceItem[];
  created_at?: string | null;
}

interface Transaction {
  id: string;
  invoice_id?: string | null;
  type: string; // 'income' | 'expense'
  amount: number;
  category: string;
  description?: string | null;
  transaction_date: string;
  created_at?: string | null;
}

interface Outreach {
  id: string;
  name: string;
  url?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  owner_name?: string | null;
  category?: string | null;
  what_need?: string | null;
  status: string;
  notes?: string | null;
  created_at?: string | null;
}

export default function FreelanceCRMPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const renderModal = (modalNode: React.ReactNode) => {
    if (!mounted || typeof window === "undefined") return null;
    return createPortal(modalNode, document.body);
  };
  const [activeTab, setActiveTab] = useState<"overview" | "clients" | "time" | "invoices" | "outreach">("overview");

  // Loading States
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  // Core Lists
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [outreachList, setOutreachList] = useState<Outreach[]>([]);

  // Finance Goal Settings (Local/Mock configurable)
  const [mrrTarget, setMrrTarget] = useState(5000);

  // Form State / Modals
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [showInvoicePreviewModal, setShowInvoicePreviewModal] = useState<Invoice | null>(null);
  const [showSendInvoiceModal, setShowSendInvoiceModal] = useState<Invoice | null>(null);
  const [showPitchModal, setShowPitchModal] = useState<Outreach | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingOutreach, setEditingOutreach] = useState<Outreach | null>(null);
  const [outreachStatusFilter, setOutreachStatusFilter] = useState<string>("All");

  // Timer states
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerProjectId, setTimerProjectId] = useState("");
  const [timerDescription, setTimerDescription] = useState("");
  const [timerStartTime, setTimerStartTime] = useState<string | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [showStopTimerModal, setShowStopTimerModal] = useState(false);
  const [timerMode, setTimerMode] = useState<"stopwatch" | "countdown">("stopwatch");
  const [countdownDuration, setCountdownDuration] = useState(25);
  const [timerLimitSeconds, setTimerLimitSeconds] = useState<number | null>(null);
  const [voiceInputText, setVoiceInputText] = useState("");
  const [stopTimerForm, setStopTimerForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    description: ""
  });

  // Temporary forms state
  const [clientForm, setClientForm] = useState({ name: "", company: "", email: "", phone: "", notes: "" });
  const [projectForm, setProjectForm] = useState({ client_id: "", name: "", status: "Active", hourly_rate: 50, billing_type: "hourly", fixed_price: 0 });
  const [timeForm, setTimeForm] = useState({ project_id: "", description: "", hours: 1, logged_date: new Date().toISOString().split("T")[0] });
  const [transactionForm, setTransactionForm] = useState({ type: "income", amount: 0, category: "Project Payment", description: "", transaction_date: new Date().toISOString().split("T")[0], invoice_id: "" });
  const [outreachForm, setOutreachForm] = useState({ name: "", url: "", phone: "", email: "", website: "", owner_name: "", category: "", what_need: "", status: "Lead", notes: "" });
  const [invoiceForm, setInvoiceForm] = useState<{
    client_id: string;
    invoice_number: string;
    status: string;
    issued_date: string;
    due_date: string;
    items: InvoiceItem[];
  }>({
    client_id: "",
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    status: "Draft",
    issued_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    items: [{ description: "Development Services", quantity: 10, rate: 50, amount: 500 }]
  });

  // Invoice sending settings
  const [sendInvoiceForm, setSendInvoiceForm] = useState({ platform: "gmail", recipient: "" });

  // AI Pitch generated text
  const [aiPitchText, setAiPitchText] = useState("");

  // Audio tone helper
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Could not play sound:", e);
    }
  };

  const requestNotificationPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  };

  const handleAutoSaveTimerLog = async (projId: string, description: string, durationMinutes: number) => {
    const hours = Number((durationMinutes / 60).toFixed(2));
    if (hours <= 0) return;
    
    try {
      const newLog = {
        project_id: projId,
        description: description ? `${description} (Auto-logged)` : "Auto-logged session",
        hours: hours,
        logged_date: new Date().toISOString().split("T")[0],
        user_id: user?.id || null
      };

      if (user) {
        const { data, error } = await insforge.database.from("freelance_time_logs").insert([newLog]).select();
        if (error) throw error;
        setTimeLogs(prev => [data[0], ...prev]);
      } else {
        const createdLog = { ...newLog, id: `t_${Date.now()}`, created_at: new Date().toISOString() };
        setTimeLogs(prev => {
          const updated = [createdLog, ...prev];
          updateLocalStorage("timeLogs", updated);
          return updated;
        });
      }
      
      playNotificationSound();
      
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("Timer Completed!", {
          body: `Logged ${hours} hours for your project.`
        });
      } else {
        toast.success(`Timer Completed! Logged ${hours} hours automatically.`);
      }
      
      // Reset timer states
      setIsTimerRunning(false);
      setTimerProjectId("");
      setTimerDescription("");
      setTimerStartTime(null);
      setTimerElapsed(0);
      setTimerLimitSeconds(null);
      
      // Remove from localStorage
      localStorage.removeItem("optimus_timer_running");
      localStorage.removeItem("optimus_timer_project_id");
      localStorage.removeItem("optimus_timer_description");
      localStorage.removeItem("optimus_timer_start_time");
      localStorage.removeItem("optimus_timer_mode");
      localStorage.removeItem("optimus_timer_limit_seconds");
    } catch (err: any) {
      console.error("Auto-save time log failed:", err);
    }
  };

  // Load timer state from localStorage on mount
  useEffect(() => {
    const savedRunning = localStorage.getItem("optimus_timer_running");
    if (savedRunning === "true") {
      const savedProj = localStorage.getItem("optimus_timer_project_id") || "";
      const savedDesc = localStorage.getItem("optimus_timer_description") || "";
      const savedStart = localStorage.getItem("optimus_timer_start_time") || "";
      const savedMode = (localStorage.getItem("optimus_timer_mode") || "stopwatch") as "stopwatch" | "countdown";
      const savedLimit = localStorage.getItem("optimus_timer_limit_seconds");
      
      if (savedStart) {
        const diffSeconds = Math.floor((Date.now() - new Date(savedStart).getTime()) / 1000);
        
        if (savedMode === "countdown" && savedLimit) {
          const limitSecs = Number(savedLimit);
          if (diffSeconds >= limitSecs) {
            // It completed while the user was away! Auto-log it now.
            handleAutoSaveTimerLog(savedProj, savedDesc, limitSecs / 60);
          } else {
            setIsTimerRunning(true);
            setTimerProjectId(savedProj);
            setTimerDescription(savedDesc);
            setTimerStartTime(savedStart);
            setTimerMode("countdown");
            setTimerLimitSeconds(limitSecs);
            setTimerElapsed(limitSecs - diffSeconds);
          }
        } else {
          setIsTimerRunning(true);
          setTimerProjectId(savedProj);
          setTimerDescription(savedDesc);
          setTimerStartTime(savedStart);
          setTimerMode("stopwatch");
          setTimerElapsed(diffSeconds > 0 ? diffSeconds : 0);
        }
      }
    }
  }, []);

  // Update timer elapsed seconds every second if running
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerStartTime) {
      interval = setInterval(() => {
        const diffSeconds = Math.floor((Date.now() - new Date(timerStartTime).getTime()) / 1000);
        if (timerMode === "countdown" && timerLimitSeconds !== null) {
          const remaining = timerLimitSeconds - diffSeconds;
          if (remaining <= 0) {
            clearInterval(interval);
            handleAutoSaveTimerLog(timerProjectId, timerDescription, timerLimitSeconds / 60);
          } else {
            setTimerElapsed(remaining);
          }
        } else {
          setTimerElapsed(diffSeconds > 0 ? diffSeconds : 0);
        }
      }, 1000);
    } else {
      setTimerElapsed(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerStartTime, timerMode, timerLimitSeconds, timerProjectId, timerDescription]);

  const handleStartTimer = () => {
    if (!timerProjectId) return toast.error("Please select a project");
    const nowISO = new Date().toISOString();
    
    setIsTimerRunning(true);
    setTimerStartTime(nowISO);
    
    localStorage.setItem("optimus_timer_running", "true");
    localStorage.setItem("optimus_timer_project_id", timerProjectId);
    localStorage.setItem("optimus_timer_description", timerDescription);
    localStorage.setItem("optimus_timer_start_time", nowISO);
    localStorage.setItem("optimus_timer_mode", timerMode);
    
    if (timerMode === "countdown") {
      const limitSecs = countdownDuration * 60;
      setTimerLimitSeconds(limitSecs);
      setTimerElapsed(limitSecs);
      localStorage.setItem("optimus_timer_limit_seconds", String(limitSecs));
    } else {
      setTimerLimitSeconds(null);
      setTimerElapsed(0);
      localStorage.removeItem("optimus_timer_limit_seconds");
    }
    
    toast.success("Timer started!");
  };

  const formatElapsedTime = (totalSeconds: number) => {
    const secsVal = Math.max(0, totalSeconds);
    const hrs = Math.floor(secsVal / 3600);
    const mins = Math.floor((secsVal % 3600) / 60);
    const secs = secsVal % 60;
    
    const pad = (num: number) => num.toString().padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const formatTimeLogHours = (hoursVal: number) => {
    const totalMins = Math.round(hoursVal * 60);
    if (totalMins < 60) {
      return `${totalMins} min`;
    } else {
      const hrs = Number(hoursVal.toFixed(2));
      return `${hrs % 1 === 0 ? Math.floor(hrs) : hrs} hr${hrs > 1 ? 's' : ''}`;
    }
  };

  const handleStopTimerClick = () => {
    if (!timerStartTime) return;
    const start = new Date(timerStartTime);
    const end = new Date();
    
    const pad = (num: number) => num.toString().padStart(2, "0");
    const startStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const endStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
    const dateStr = start.toISOString().split("T")[0];
    
    setStopTimerForm({
      date: dateStr,
      startTime: startStr,
      endTime: endStr,
      description: timerDescription
    });
    
    setShowStopTimerModal(true);
  };

  const calculateHoursFromTimes = (dateStr: string, startStr: string, endStr: string) => {
    try {
      if (!startStr || !endStr) return 0;
      const startParts = startStr.split(":");
      const endParts = endStr.split(":");
      const startMins = Number(startParts[0]) * 60 + Number(startParts[1]);
      let endMins = Number(endParts[0]) * 60 + Number(endParts[1]);
      
      if (endMins < startMins) {
        // Assume next day
        endMins += 24 * 60;
      }
      
      const diff = endMins - startMins;
      return Number((diff / 60).toFixed(2));
    } catch {
      return 0;
    }
  };

  const handleSaveTimerLog = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const computedHours = calculateHoursFromTimes(stopTimerForm.date, stopTimerForm.startTime, stopTimerForm.endTime);
    if (computedHours <= 0) return toast.error("Ending time must be after starting time");
    
    try {
      const newLog = {
        project_id: timerProjectId,
        description: stopTimerForm.description || null,
        hours: computedHours,
        logged_date: stopTimerForm.date,
        user_id: user?.id || null
      };

      if (user) {
        const { data, error } = await insforge.database.from("freelance_time_logs").insert([newLog]).select();
        if (error) throw error;
        setTimeLogs([data[0], ...timeLogs]);
      } else {
        const createdLog = { ...newLog, id: `t_${Date.now()}`, created_at: new Date().toISOString() };
        const updated = [createdLog, ...timeLogs];
        setTimeLogs(updated);
        updateLocalStorage("timeLogs", updated);
      }
      
      toast.success(`Logged ${computedHours} hours successfully!`);
      
      // Stop and clear timer states
      setIsTimerRunning(false);
      setTimerProjectId("");
      setTimerDescription("");
      setTimerStartTime(null);
      setTimerElapsed(0);
      setTimerLimitSeconds(null);
      setShowStopTimerModal(false);
      
      // Remove from localStorage
      localStorage.removeItem("optimus_timer_running");
      localStorage.removeItem("optimus_timer_project_id");
      localStorage.removeItem("optimus_timer_description");
      localStorage.removeItem("optimus_timer_start_time");
      localStorage.removeItem("optimus_timer_mode");
      localStorage.removeItem("optimus_timer_limit_seconds");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Voice Hunt Lead parsing handler
  const handleVoiceHuntTranscript = async (text: string) => {
    toast.info("Gemini is parsing leads from your voice recording...");
    try {
      const res = await fetch("/api/freelance/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "parse_voice_leads", text })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to parse leads");
      }
      
      const parsedLeads = data.leads || [];
      if (parsedLeads.length === 0) {
        toast.info("No leads could be extracted from your speech. Try explaining more clearly.");
        return;
      }
      
      const newOutreaches = parsedLeads.map((lead: any) => ({
        name: lead.name || "Unknown Lead",
        url: lead.url || null,
        phone: lead.phone || null,
        email: lead.email || null,
        website: lead.website || null,
        owner_name: lead.owner_name || null,
        category: lead.category || null,
        what_need: lead.what_need || null,
        status: "Lead",
        notes: lead.notes || "Added via Voice Hunt",
        user_id: user?.id || null
      }));
      
      let addedLeads: Outreach[] = [];
      if (user) {
        const { data: dbData, error } = await insforge.database.from("freelance_outreach").insert(newOutreaches).select();
        if (error) throw error;
        addedLeads = dbData || [];
      } else {
        addedLeads = newOutreaches.map((l: any, idx: number) => ({
          ...l,
          id: `o_voice_${Date.now()}_${idx}`,
          created_at: new Date().toISOString()
        }));
      }
      
      const updatedList = [...addedLeads, ...outreachList];
      setOutreachList(updatedList);
      updateLocalStorage("outreach", updatedList);
      
      toast.success(`Successfully processed ${addedLeads.length} lead(s)!`);
      setVoiceInputText("");
      
      if (voiceHunter.speak) {
        voiceHunter.speak(`Added ${addedLeads.length} leads to your pipeline.`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Voice parsing failed: ${err.message}`);
    }
  };

  const voiceHunter = useVoice({
    onTranscript: async (text) => {
      setVoiceInputText(text);
      await handleVoiceHuntTranscript(text);
    }
  });

  // Seed default sandbox data if no tables are fetched
  const seedSandboxData = () => {
    const mockClients = [
      { id: "c1", name: "Aiden Vance", company: "Aether Labs", email: "aiden@aetherlabs.co", phone: "+1 (555) 019-2831", notes: "Prefers communication via Slack. Retainer project starting in July.", created_at: new Date().toISOString() },
      { id: "c2", name: "Sophia Martinez", company: "Pulse Media", email: "sophia@pulsemedia.io", phone: "+1 (555) 048-1192", notes: "Feedback round is usually fast. Weekly standups on Tuesday.", created_at: new Date().toISOString() }
    ];
    const mockProjects = [
      { id: "p1", client_id: "c1", name: "Next.js Core Refactor", status: "Active", hourly_rate: 85, created_at: new Date().toISOString() },
      { id: "p2", client_id: "c2", name: "E-Commerce Landing Page", status: "Active", hourly_rate: 65, created_at: new Date().toISOString() }
    ];
    const mockTime = [
      { id: "t1", project_id: "p1", description: "Configured API routing and database entities", hours: 6, logged_date: new Date().toISOString().split("T")[0] },
      { id: "t2", project_id: "p2", description: "Design layout iterations in CSS / Tailwind", hours: 4.5, logged_date: new Date().toISOString().split("T")[0] }
    ];
    const mockInvoices = [
      { id: "i1", client_id: "c1", invoice_number: "INV-1092", amount: 1530.00, status: "Paid", issued_date: "2026-06-01", due_date: "2026-06-15", items: [{ description: "Refactoring Services", quantity: 18, rate: 85, amount: 1530 }] },
      { id: "i2", client_id: "c2", invoice_number: "INV-1093", amount: 800.00, status: "Sent", issued_date: "2026-06-10", due_date: "2026-06-24", items: [{ description: "Landing Page Development", quantity: 10, rate: 80, amount: 800 }] }
    ];
    const mockTrans = [
      { id: "tr1", invoice_id: "i1", type: "income", amount: 1530, category: "Project Payment", description: "INV-1092 Settlement", transaction_date: "2026-06-05" },
      { id: "tr2", type: "expense", amount: 79, category: "Software Subscription", description: "Vercel Pro & domains", transaction_date: "2026-06-12" }
    ];
    const mockOutreach = [
      { id: "o1", name: "David Kross", url: "https://linkedin.com/in/david-kross", phone: "+1 (555) 918-0909", email: "david@aurorafintech.com", website: "https://aurorafintech.com", status: "Lead", notes: "Fintech scale-up looking for dedicated Next.js engineering resources." }
    ];

    setClients(mockClients);
    setProjects(mockProjects);
    setTimeLogs(mockTime);
    setInvoices(mockInvoices);
    setTransactions(mockTrans);
    setOutreachList(mockOutreach);

    // Save to local storage for persistent guest preview
    localStorage.setItem("optimus_clients", JSON.stringify(mockClients));
    localStorage.setItem("optimus_projects", JSON.stringify(mockProjects));
    localStorage.setItem("optimus_timeLogs", JSON.stringify(mockTime));
    localStorage.setItem("optimus_invoices", JSON.stringify(mockInvoices));
    localStorage.setItem("optimus_transactions", JSON.stringify(mockTrans));
    localStorage.setItem("optimus_outreach", JSON.stringify(mockOutreach));
  };

  // Fetch from database or localstorage
  const fetchData = async () => {
    setLoading(true);
    try {
      if (user) {
        // Authenticated client mode
        const [cRes, pRes, tRes, iRes, trRes, oRes] = await Promise.all([
          insforge.database.from("freelance_clients").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          insforge.database.from("freelance_projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          insforge.database.from("freelance_time_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          insforge.database.from("freelance_invoices").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          insforge.database.from("freelance_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          insforge.database.from("freelance_outreach").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
        ]);

        if (cRes.error) throw cRes.error;
        if (pRes.error) throw pRes.error;
        if (tRes.error) throw tRes.error;
        if (iRes.error) throw iRes.error;
        if (trRes.error) throw trRes.error;
        if (oRes.error) throw oRes.error;

        setClients(cRes.data || []);
        setProjects(pRes.data || []);
        setTimeLogs(tRes.data || []);
        setInvoices(iRes.data || []);
        setTransactions(trRes.data || []);
        setOutreachList(oRes.data || []);
      } else {
        // Preview mode loads from localStorage
        const localClients = localStorage.getItem("optimus_clients");
        const localProjects = localStorage.getItem("optimus_projects");
        const localTime = localStorage.getItem("optimus_timeLogs");
        const localInvoices = localStorage.getItem("optimus_invoices");
        const localTrans = localStorage.getItem("optimus_transactions");
        const localOutreach = localStorage.getItem("optimus_outreach");

        if (localClients) {
          setClients(JSON.parse(localClients));
          setProjects(localProjects ? JSON.parse(localProjects) : []);
          setTimeLogs(localTime ? JSON.parse(localTime) : []);
          setInvoices(localInvoices ? JSON.parse(localInvoices) : []);
          setTransactions(localTrans ? JSON.parse(localTrans) : []);
          setOutreachList(localOutreach ? JSON.parse(localOutreach) : []);
        } else {
          // Initialize defaults
          seedSandboxData();
        }
      }
    } catch (error: any) {
      console.error("Error fetching CRM data:", error);
      toast.error(`Database error: ${error.message}. Loaded offline sandbox.`);
      seedSandboxData();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Synchronize helper for sandbox mutations
  const updateLocalStorage = (key: string, data: any) => {
    if (!user) {
      localStorage.setItem(`optimus_${key}`, JSON.stringify(data));
    }
  };

  // CRUD handlers
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name) return toast.error("Client name is required");

    try {
      const newClient = {
        name: clientForm.name,
        company: clientForm.company || null,
        email: clientForm.email || null,
        phone: clientForm.phone || null,
        notes: clientForm.notes || null,
        user_id: user?.id || null
      };

      if (user) {
        const { data, error } = await insforge.database.from("freelance_clients").insert([newClient]).select();
        if (error) throw error;
        setClients([data[0], ...clients]);
      } else {
        const createdClient = { ...newClient, id: `c_${Date.now()}`, created_at: new Date().toISOString() };
        const updated = [createdClient, ...clients];
        setClients(updated);
        updateLocalStorage("clients", updated);
      }
      toast.success("Client added successfully");
      setShowClientModal(false);
      setClientForm({ name: "", company: "", email: "", phone: "", notes: "" });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name) return toast.error("Project name is required");

    try {
      const newProj = {
        name: projectForm.name,
        client_id: projectForm.client_id || null,
        status: projectForm.status,
        hourly_rate: projectForm.billing_type === "hourly" ? Number(projectForm.hourly_rate) : 0,
        billing_type: projectForm.billing_type || "hourly",
        fixed_price: projectForm.billing_type === "fixed" ? Number(projectForm.fixed_price) : 0,
        user_id: user?.id || null
      };

      if (user) {
        const { data, error } = await insforge.database.from("freelance_projects").insert([newProj]).select();
        if (error) throw error;
        setProjects([data[0], ...projects]);
      } else {
        const createdProj = { ...newProj, id: `p_${Date.now()}`, created_at: new Date().toISOString() };
        const updated = [createdProj, ...projects];
        setProjects(updated);
        updateLocalStorage("projects", updated);
      }
      toast.success("Project added successfully");
      setShowProjectModal(false);
      setProjectForm({ client_id: "", name: "", status: "Active", hourly_rate: 50, billing_type: "hourly", fixed_price: 0 });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddTimeLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeForm.project_id) return toast.error("Please select a project");

    try {
      const newLog = {
        project_id: timeForm.project_id,
        description: timeForm.description || null,
        hours: Number(timeForm.hours) || 0,
        logged_date: timeForm.logged_date,
        user_id: user?.id || null
      };

      if (user) {
        const { data, error } = await insforge.database.from("freelance_time_logs").insert([newLog]).select();
        if (error) throw error;
        setTimeLogs([data[0], ...timeLogs]);
      } else {
        const createdLog = { ...newLog, id: `t_${Date.now()}`, created_at: new Date().toISOString() };
        const updated = [createdLog, ...timeLogs];
        setTimeLogs(updated);
        updateLocalStorage("timeLogs", updated);
      }
      toast.success("Hours logged successfully");
      setShowTimeModal(false);
      setTimeForm({ project_id: "", description: "", hours: 1, logged_date: new Date().toISOString().split("T")[0] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.client_id) return toast.error("Please select a client");

    // Calculate total amount
    const totalAmount = invoiceForm.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.rate)), 0);

    try {
      if (editingInvoice) {
        // Edit mode
        const updatedInvoice = {
          ...editingInvoice,
          client_id: invoiceForm.client_id,
          invoice_number: invoiceForm.invoice_number,
          amount: totalAmount,
          status: invoiceForm.status,
          issued_date: invoiceForm.issued_date,
          due_date: invoiceForm.due_date,
          items: invoiceForm.items,
        };

        if (user) {
          const { error } = await insforge.database
            .from("freelance_invoices")
            .update(updatedInvoice)
            .eq("id", editingInvoice.id);
          if (error) throw error;
        }

        const updatedList = invoices.map(inv => inv.id === editingInvoice.id ? updatedInvoice : inv);
        setInvoices(updatedList);
        updateLocalStorage("invoices", updatedList);
        toast.success("Invoice updated successfully");
      } else {
        // Create mode
        const newInvoice = {
          client_id: invoiceForm.client_id,
          invoice_number: invoiceForm.invoice_number,
          amount: totalAmount,
          status: invoiceForm.status,
          issued_date: invoiceForm.issued_date,
          due_date: invoiceForm.due_date,
          items: invoiceForm.items,
          user_id: user?.id || null
        };

        let insertedInvoice: any;

        if (user) {
          const { data, error } = await insforge.database.from("freelance_invoices").insert([newInvoice]).select();
          if (error) throw error;
          insertedInvoice = data[0];
          setInvoices([insertedInvoice, ...invoices]);
        } else {
          insertedInvoice = { ...newInvoice, id: `i_${Date.now()}`, created_at: new Date().toISOString() };
          const updated = [insertedInvoice, ...invoices];
          setInvoices(updated);
          updateLocalStorage("invoices", updated);
        }

        // Proactively prompt to record this in Transactions if Status is Paid
        if (invoiceForm.status === "Paid") {
          const newTrans = {
            invoice_id: insertedInvoice.id,
            type: "income",
            amount: totalAmount,
            category: "Project Payment",
            description: `Invoice Settlement: ${invoiceForm.invoice_number}`,
            transaction_date: invoiceForm.issued_date,
            user_id: user?.id || null
          };
          if (user) {
            const { data } = await insforge.database.from("freelance_transactions").insert([newTrans]).select();
            if (data) setTransactions([data[0], ...transactions]);
          } else {
            const createdTrans = { ...newTrans, id: `tr_${Date.now()}`, created_at: new Date().toISOString() };
            const updatedTrans = [createdTrans, ...transactions];
            setTransactions(updatedTrans);
            updateLocalStorage("transactions", updatedTrans);
          }
        }

        toast.success("Invoice created successfully");
      }

      setShowInvoiceModal(false);
      setEditingInvoice(null);
      setInvoiceForm({
        client_id: "",
        invoice_number: `INV-${Date.now().toString().slice(-6)}`,
        status: "Draft",
        issued_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        items: [{ description: "Development Services", quantity: 10, rate: 50, amount: 500 }]
      });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionForm.amount) return toast.error("Please specify amount");

    try {
      const newTrans = {
        type: transactionForm.type,
        amount: Number(transactionForm.amount) || 0,
        category: transactionForm.category,
        description: transactionForm.description || null,
        transaction_date: transactionForm.transaction_date,
        invoice_id: transactionForm.invoice_id || null,
        user_id: user?.id || null
      };

      if (user) {
        const { data, error } = await insforge.database.from("freelance_transactions").insert([newTrans]).select();
        if (error) throw error;
        setTransactions([data[0], ...transactions]);
      } else {
        const createdTrans = { ...newTrans, id: `tr_${Date.now()}`, created_at: new Date().toISOString() };
        const updated = [createdTrans, ...transactions];
        setTransactions(updated);
        updateLocalStorage("transactions", updated);
      }
      toast.success("Transaction recorded");
      setShowTransactionModal(false);
      setTransactionForm({ type: "income", amount: 0, category: "Project Payment", description: "", transaction_date: new Date().toISOString().split("T")[0], invoice_id: "" });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outreachForm.name) return toast.error("Lead name is required");

    try {
      const newOutreach = {
        name: outreachForm.name,
        url: outreachForm.url || null,
        phone: outreachForm.phone || null,
        email: outreachForm.email || null,
        website: outreachForm.website || null,
        owner_name: outreachForm.owner_name || null,
        category: outreachForm.category || null,
        what_need: outreachForm.what_need || null,
        status: outreachForm.status,
        notes: outreachForm.notes || null,
        user_id: user?.id || null
      };

      if (editingOutreach) {
        // Edit mode
        if (user) {
          const { error } = await insforge.database
            .from("freelance_outreach")
            .update(newOutreach)
            .eq("id", editingOutreach.id);
          if (error) throw error;
        }

        const updatedList = outreachList.map(item =>
          item.id === editingOutreach.id ? { ...item, ...newOutreach } : item
        );
        setOutreachList(updatedList);
        updateLocalStorage("outreach", updatedList);
        toast.success("Outreach lead updated successfully");
      } else {
        // Create mode
        if (user) {
          const { data, error } = await insforge.database.from("freelance_outreach").insert([newOutreach]).select();
          if (error) throw error;
          setOutreachList([data[0], ...outreachList]);
        } else {
          const createdOut = { ...newOutreach, id: `o_${Date.now()}`, created_at: new Date().toISOString() };
          const updated = [createdOut, ...outreachList];
          setOutreachList(updated);
          updateLocalStorage("outreach", updated);
        }
        toast.success("Outreach lead added successfully");
      }

      setShowOutreachModal(false);
      setEditingOutreach(null);
      setOutreachForm({ name: "", url: "", phone: "", email: "", website: "", owner_name: "", category: "", what_need: "", status: "Lead", notes: "" });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Delete handles
  const handleDeleteItem = async (table: string, id: string, listSetter: any, currentList: any[], keyName: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      if (user) {
        const { error } = await insforge.database.from(table).delete().eq("id", id);
        if (error) throw error;
      }
      const updated = currentList.filter((item: any) => item.id !== id);
      listSetter(updated);
      updateLocalStorage(keyName, updated);
      toast.success("Record deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // AI summarizing Client Notes
  const summarizeNotesWithAI = async (clientId: string, currentNotes: string) => {
    if (!currentNotes) return toast.error("Notes text is empty");
    setAiLoading(true);
    try {
      const res = await fetch("/api/freelance/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "summarize_notes", notes: currentNotes })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate summary");
      }

      // Update Client Notes in DB/State
      const updatedNotes = currentNotes + "\n\n### 🤖 AI Summary & Tasks:\n" + data.summary;

      if (user) {
        const { error } = await insforge.database.from("freelance_clients").update({ notes: updatedNotes }).eq("id", clientId);
        if (error) throw error;
      }

      const updatedClients = clients.map(c => c.id === clientId ? { ...c, notes: updatedNotes } : c);
      setClients(updatedClients);
      updateLocalStorage("clients", updatedClients);
      
      // Update selected client view if active
      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient({ ...selectedClient, notes: updatedNotes });
      }

      toast.success("Notes summarized by Gemini!");
    } catch (err: any) {
      toast.error(`Gemini summary failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // AI outreach pitch writer
  const generateOutreachPitch = async (lead: Outreach) => {
    setAiLoading(true);
    setAiPitchText("");
    setShowPitchModal(lead);
    try {
      const res = await fetch("/api/freelance/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "draft_pitch", contact: lead })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to draft pitch");
      }
      setAiPitchText(data.pitch);
    } catch (err: any) {
      toast.error(`Gemini pitch creation failed: ${err.message}`);
      setAiPitchText("Failed to compile pitch. Please verify your Gemini connection.");
    } finally {
      setAiLoading(false);
    }
  };

  // Export Outreach to CSV
  const exportOutreachToCSV = () => {
    if (outreachList.length === 0) return toast.error("No outreach leads available to export.");
    const headers = ["Name", "LinkedIn/URL", "Phone", "Email", "Website", "Status", "Notes"];
    const rows = outreachList.map(item => [
      item.name || "",
      item.url || "",
      item.phone || "",
      item.email || "",
      item.website || "",
      item.status || "",
      (item.notes || "").replace(/\n/g, " ")
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(row => row.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Optimus_Freelance_Outreach_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded successfully!");
  };

  // Send Invoice Draft via Gmail/WhatsApp
  const triggerSendInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSendInvoiceModal) return;
    const clientRecord = clients.find(c => c.id === showSendInvoiceModal.client_id);
    const clientName = clientRecord?.name || "Client";

    const invoiceText = `Hello ${clientName},

This is invoice ${showSendInvoiceModal.invoice_number} from Optimus.
Total Amount Due: ৳${showSendInvoiceModal.amount.toFixed(2)}
Due Date: ${showSendInvoiceModal.due_date}

Itemized details:
${showSendInvoiceModal.items.map(item => `- ${item.description}: ${item.quantity} x ৳${item.rate} = ৳${item.amount}`).join("\n")}

Thank you for your business!`;

    const toastLoadingMsg = sendInvoiceForm.platform === "gmail" 
      ? `Drafting email to ${sendInvoiceForm.recipient}...`
      : `Sending WhatsApp message to ${sendInvoiceForm.recipient}...`;

    toast.promise(
      fetch("/api/briefing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: sendInvoiceForm.platform,
          recipient: sendInvoiceForm.recipient,
          message: sendInvoiceForm.platform === "gmail"
            ? `Subject: Invoice ${showSendInvoiceModal.invoice_number} | Optimus Work\n\n${invoiceText}`
            : invoiceText,
          userId: user?.id || null,
          gmailAccessToken: typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null,
          gmailRefreshToken: typeof window !== "undefined" ? localStorage.getItem("gmail_refresh_token") : null
        })
      }).then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Delivery failed");
        return json;
      }),
      {
        loading: toastLoadingMsg,
        success: (resData) => {
          // Update Invoice status to Sent
          const updatedInvoices = invoices.map(inv => inv.id === showSendInvoiceModal.id ? { ...inv, status: "Sent" } : inv);
          setInvoices(updatedInvoices);
          updateLocalStorage("invoices", updatedInvoices);

          // Update in DB if auth
          if (user) {
            insforge.database.from("freelance_invoices").update({ status: "Sent" }).eq("id", showSendInvoiceModal.id);
          }

          setShowSendInvoiceModal(null);
          return `Invoice successfully dispatched via ${sendInvoiceForm.platform}! ${resData.source === 'sandbox' || (resData.result && resData.result.source === 'sandbox') ? '(Sandbox Mode)' : ''}`;
        },
        error: (err) => `Failed to deliver invoice: ${err.message}`
      }
    );
  };

  // Financial calculations
  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const netEarnings = totalIncome - totalExpenses;
  const targetPercent = Math.min(100, Math.round((totalIncome / mrrTarget) * 100));
  
  const maxChartVal = Math.max(mrrTarget, totalIncome, netEarnings, 1);
  const targetBarHeight = Math.max(5, Math.round((mrrTarget / maxChartVal) * 100));
  const incomeBarHeight = Math.max(5, Math.round((totalIncome / maxChartVal) * 100));
  const netBarHeight = Math.max(5, Math.round((Math.max(0, netEarnings) / maxChartVal) * 100));

  // Time calculations
  const totalLoggedHours = timeLogs.reduce((sum, t) => sum + Number(t.hours), 0);
  const unpaidInvoicesTotal = invoices.filter(inv => inv.status !== "Paid").reduce((sum, i) => sum + Number(i.amount), 0);

  const filteredOutreachList = outreachList.filter((lead) => {
    if (outreachStatusFilter === "All") return true;
    return lead.status === outreachStatusFilter;
  });

  // Return project/client details
  const getProjectName = (projId?: string | null) => {
    if (!projId) return "Unassigned Project";
    const proj = projects.find(p => p.id === projId);
    if (!proj) return "Unassigned Project";
    const client = clients.find(c => c.id === proj.client_id);
    return client ? `${proj.name} (${client.name})` : proj.name;
  };

  const getClientName = (clientId?: string | null) => {
    if (!clientId) return "Unknown Client";
    return clients.find(c => c.id === clientId)?.name || "Unknown Client";
  };

  // Add Item line in Invoice draft
  const addInvoiceItemLine = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: "", quantity: 1, rate: 0, amount: 0 }]
    });
  };

  // Remove Item line in Invoice draft
  const removeInvoiceItemLine = (idx: number) => {
    const lines = [...invoiceForm.items];
    lines.splice(idx, 1);
    setInvoiceForm({ ...invoiceForm, items: lines });
  };

  // Update item details
  const updateInvoiceItemField = (idx: number, field: keyof InvoiceItem, value: any) => {
    const lines = [...invoiceForm.items];
    const item = { ...lines[idx] };
    if (field === "description") {
      item.description = value;
    } else {
      item[field] = Number(value) || 0;
      item.amount = item.quantity * item.rate;
    }
    lines[idx] = item;
    setInvoiceForm({ ...invoiceForm, items: lines });
  };

  return (
    <div className="space-y-6">
      {/* Top scaffolding Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 backdrop-blur-md transition-all">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-905 dark:text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-violet-500" />
            Freelance Operations & CRM
          </h2>
          <p className="text-xs text-zinc-505 dark:text-zinc-400 mt-1">
            Professional hub to track clients, billable hours, invoices, outreaches, and finances.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowClientModal(true)} className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 cursor-pointer flex items-center gap-1.5 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Client
          </button>
          <button onClick={() => setShowProjectModal(true)} className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 cursor-pointer flex items-center gap-1.5 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Project
          </button>
          <button onClick={() => setShowTimeModal(true)} className="px-4 py-2.5 bg-violet-650 hover:bg-violet-600 dark:bg-violet-500/20 dark:hover:bg-violet-500/30 text-violet-600 dark:text-violet-400 border border-violet-500/20 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all">
            <Clock className="w-3.5 h-3.5" /> Log Hours
          </button>
          <button onClick={() => setShowInvoiceModal(true)} className="px-4 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold border-none cursor-pointer flex items-center gap-1.5 shadow-md shadow-violet-500/10 transition-all">
            <Plus className="w-3.5 h-3.5" /> Create Invoice
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-900 gap-1 overflow-x-auto pb-px">
        {[
          { id: "overview", label: "Overview", icon: <TrendingUp className="w-4 h-4" /> },
          { id: "clients", label: "Clients & Projects", icon: <User className="w-4 h-4" /> },
          { id: "time", label: "Time Logs", icon: <Clock className="w-4 h-4" /> },
          { id: "invoices", label: "Invoices", icon: <FileText className="w-4 h-4" /> },
          { id: "outreach", label: "Outreach Leads", icon: <Send className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "border-violet-500 text-violet-605 dark:text-white bg-violet-500/5"
                : "border-transparent text-zinc-500 hover:text-zinc-905 dark:hover:text-zinc-200 hover:bg-zinc-100/30 dark:hover:bg-zinc-900/10"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab Views */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <p className="text-xs text-zinc-500">Retrieving freelance workspace data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Financial Dashboard Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Revenue widget card */}
                <div className="p-6 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl glow-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-4 h-4 font-bold text-emerald-500 flex items-center justify-center text-sm select-none">৳</span>
                      Revenue Goal Tracker
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-550 font-medium">Target MRR (৳):</span>
                      <input
                        type="number"
                        value={mrrTarget}
                        onChange={(e) => setMrrTarget(Number(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 rounded-lg text-xs font-bold text-center"
                      />
                    </div>
                  </div>
 
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-2xl">
                      <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wide">Gross Income</span>
                      <h4 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-450 mt-1">৳{totalIncome.toLocaleString()}</h4>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-2xl">
                      <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wide">Expenses</span>
                      <h4 className="text-2xl font-extrabold text-red-500 mt-1">৳{totalExpenses.toLocaleString()}</h4>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-2xl">
                      <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wide">Net Profit</span>
                      <h4 className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1">৳{netEarnings.toLocaleString()}</h4>
                    </div>
                  </div>

                  {/* Goal Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-550">Monthly Progress</span>
                      <span className="text-violet-500">{targetPercent}% reached</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-violet-500 to-emerald-505 bg-violet-500 h-full rounded-full transition-all duration-505" style={{ width: `${targetPercent}%` }} />
                    </div>
                  </div>

                  {/* SVG Chart Visualization */}
                  <div className="mt-6 pt-6 border-t border-zinc-150 dark:border-zinc-800/80">
                    <h4 className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">Financial Target Breakdown</h4>
                    <div className="flex items-end justify-around h-32 pt-4 px-2">
                      {/* Bar 1: Target MRR */}
                      <div className="flex flex-col items-center gap-2 group w-1/4">
                        <div className="text-[9px] font-bold text-zinc-450 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">৳{mrrTarget.toLocaleString()}</div>
                        <div className="w-8 bg-zinc-100 dark:bg-zinc-800/60 rounded-t-lg relative h-20 overflow-hidden shadow-inner">
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-zinc-400 dark:bg-zinc-600 rounded-t-lg transition-all duration-700" 
                            style={{ height: `${targetBarHeight}%` }}
                          />
                        </div>
                        <div className="text-[9px] font-extrabold uppercase tracking-wide text-zinc-400">Target</div>
                      </div>

                      {/* Bar 2: Gross Income */}
                      <div className="flex flex-col items-center gap-2 group w-1/4">
                        <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-450 group-hover:text-emerald-700 transition-colors">৳{totalIncome.toLocaleString()}</div>
                        <div className="w-8 bg-zinc-100 dark:bg-zinc-800/60 rounded-t-lg relative h-20 overflow-hidden shadow-inner">
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all duration-700" 
                            style={{ height: `${incomeBarHeight}%` }}
                          />
                        </div>
                        <div className="text-[9px] font-extrabold uppercase tracking-wide text-emerald-500">Gross</div>
                      </div>

                      {/* Bar 3: Net Profit */}
                      <div className="flex flex-col items-center gap-2 group w-1/4">
                        <div className="text-[9px] font-bold text-violet-600 dark:text-violet-405 group-hover:text-violet-755 transition-colors">৳{netEarnings.toLocaleString()}</div>
                        <div className="w-8 bg-zinc-100 dark:bg-zinc-800/60 rounded-t-lg relative h-20 overflow-hidden shadow-inner">
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-violet-500 to-indigo-500 rounded-t-lg transition-all duration-700" 
                            style={{ height: `${netBarHeight}%` }}
                          />
                        </div>
                        <div className="text-[9px] font-extrabold uppercase tracking-wide text-violet-500">Net Profit</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cash Flow Ledger Table */}
                <div className="p-6 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl">
                  <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 pb-4 mb-4">
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                      Financial Transaction Ledger
                    </h3>
                    <button onClick={() => setShowTransactionModal(true)} className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-[10px] font-bold border border-zinc-205 dark:border-zinc-700 cursor-pointer flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Record Ledger
                    </button>
                  </div>

                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400 text-xs">No transactions recorded. Click Record Ledger to start.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-zinc-100 dark:border-zinc-850 text-zinc-500 font-bold uppercase tracking-wider">
                            <th className="py-2.5">Date</th>
                            <th className="py-2.5">Category</th>
                            <th className="py-2.5">Description</th>
                            <th className="py-2.5">Type</th>
                            <th className="py-2.5 text-right">Amount</th>
                            <th className="py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.slice(0, 5).map((trans) => (
                            <tr key={trans.id} className="border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                              <td className="py-3 font-mono text-[10px] text-zinc-500">{trans.transaction_date}</td>
                              <td className="py-3 font-semibold text-zinc-800 dark:text-zinc-200">{trans.category}</td>
                              <td className="py-3 text-zinc-500 max-w-[200px] truncate">{trans.description || "-"}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${trans.type === "income" ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600" : "bg-red-100 dark:bg-red-500/10 text-red-500"}`}>
                                  {trans.type}
                                </span>
                              </td>
                              <td className={`py-3 text-right font-extrabold ${trans.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                                {trans.type === "income" ? "+" : "-"}৳{Number(trans.amount).toFixed(2)}
                              </td>
                              <td className="py-3 text-right">
                                <button onClick={() => handleDeleteItem("freelance_transactions", trans.id, setTransactions, transactions, "transactions")} className="text-zinc-400 hover:text-red-500 p-1 cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Side Column Widget Stats */}
              <div className="space-y-6">
                {/* Operations at a Glance */}
                <div className="p-6 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl">
                  <h3 className="text-xs font-bold text-zinc-905 dark:text-white uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-850 pb-3 mb-4">
                    Workspace Summary
                  </h3>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-550">Active Clients</span>
                      <span className="font-extrabold text-zinc-800 dark:text-white">{clients.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-550">Active Projects</span>
                      <span className="font-extrabold text-zinc-800 dark:text-white">{projects.filter(p => p.status === 'Active').length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-550">Hours Logged (Total)</span>
                      <span className="font-extrabold text-zinc-800 dark:text-white">{totalLoggedHours} hrs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-550">Unpaid Invoices Total</span>
                      <span className="font-extrabold text-orange-550 dark:text-orange-400">৳{unpaidInvoicesTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Outreach Leads Box */}
                <div className="p-6 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl">
                  <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 pb-3 mb-4">
                    <h3 className="text-xs font-bold text-zinc-905 dark:text-white uppercase tracking-wider">
                      Hot Outreach Leads
                    </h3>
                    <button onClick={() => setActiveTab("outreach")} className="text-[10px] text-violet-500 font-bold hover:underline cursor-pointer">
                      View Board
                    </button>
                  </div>

                  {outreachList.filter(o => o.status === "Lead" || o.status === "Contacted").length === 0 ? (
                    <div className="text-center py-6 text-zinc-400 text-xs">No active pipeline outreach.</div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      {outreachList.filter(o => o.status === "Lead" || o.status === "Contacted").slice(0, 3).map((lead) => (
                        <div key={lead.id} className="p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-zinc-800 dark:text-white">{lead.name}</p>
                            <span className="text-[9px] text-zinc-400 font-mono mt-0.5 block">{lead.website || lead.email || "No contact info"}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-605 dark:text-amber-400 rounded-lg text-[9px] font-bold uppercase">{lead.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLIENTS & PROJECTS */}
          {activeTab === "clients" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Clients Sidebar list */}
              <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-4 h-[calc(100vh-270px)] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 pb-3">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Client List
                  </h3>
                  <button onClick={() => setShowClientModal(true)} className="p-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-500 rounded-xl cursor-pointer">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {clients.length === 0 ? (
                  <div className="text-center py-10 text-zinc-450 text-xs">No clients added yet.</div>
                ) : (
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          selectedClient?.id === client.id
                            ? "bg-violet-500/10 border-violet-500 text-violet-605 dark:text-white"
                            : "bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/30 text-zinc-700 dark:text-zinc-350"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate">{client.name}</p>
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5">{client.company || "Independent"}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Client detailed view */}
              <div className="lg:col-span-2 space-y-6">
                {selectedClient ? (
                  <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-zinc-150 dark:border-zinc-850 pb-4">
                      <div>
                        <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">{selectedClient.name}</h3>
                        <p className="text-xs text-zinc-500 mt-1">{selectedClient.company || "Independent Client"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDeleteItem("freelance_clients", selectedClient.id, setClients, clients, "clients").then(() => setSelectedClient(null))} className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold cursor-pointer transition-all">
                          Delete Client
                        </button>
                      </div>
                    </div>

                    {/* Metadata grids */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-2">
                        <p className="font-bold text-zinc-500">Contact Details</p>
                        <p className="text-zinc-800 dark:text-zinc-200"><span className="font-semibold text-zinc-450">Email:</span> {selectedClient.email || "N/A"}</p>
                        <p className="text-zinc-800 dark:text-zinc-200"><span className="font-semibold text-zinc-450">Phone:</span> {selectedClient.phone || "N/A"}</p>
                      </div>

                      <div className="p-4 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-2">
                        <p className="font-bold text-zinc-500">Projects</p>
                        {projects.filter(p => p.client_id === selectedClient.id).length === 0 ? (
                          <p className="text-zinc-400 italic">No projects assigned.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {projects.filter(p => p.client_id === selectedClient.id).map(proj => (
                              <div key={proj.id} className="flex justify-between items-center text-zinc-800 dark:text-zinc-250">
                                <span>{proj.name}</span>
                                <span className="font-mono font-bold text-[10px] px-2 py-0.5 bg-violet-500/10 text-violet-500 rounded-lg">
                                  {proj.billing_type === "fixed" ? `৳${proj.fixed_price} (Fixed)` : `৳${proj.hourly_rate}/hr`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        <button onClick={() => { setProjectForm({ ...projectForm, client_id: selectedClient.id }); setShowProjectModal(true); }} className="text-[10px] text-violet-500 font-bold hover:underline flex items-center gap-1 mt-2">
                          <Plus className="w-3 h-3" /> Add Project
                        </button>
                      </div>
                    </div>

                    {/* Client notes and AI Compiler */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                          Private Client Notes
                        </h4>
                        <button
                          onClick={() => summarizeNotesWithAI(selectedClient.id, selectedClient.notes || "")}
                          disabled={aiLoading}
                          className="px-3.5 py-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-505 dark:text-violet-400 border border-violet-500/20 rounded-xl text-[10px] font-bold cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          {aiLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          Summarize notes (Gemini AI)
                        </button>
                      </div>

                      <textarea
                        value={selectedClient.notes || ""}
                        onChange={(e) => {
                          const updatedVal = e.target.value;
                          const updatedList = clients.map(c => c.id === selectedClient.id ? { ...c, notes: updatedVal } : c);
                          setClients(updatedList);
                          setSelectedClient({ ...selectedClient, notes: updatedVal });
                          updateLocalStorage("clients", updatedList);
                          // Proactively trigger debounced updates to DB in production
                          if (user) {
                            insforge.database.from("freelance_clients").update({ notes: updatedVal }).eq("id", selectedClient.id);
                          }
                        }}
                        placeholder="Log client calls, meeting transcripts, project goals, feedback reviews..."
                        className="w-full h-48 p-4 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-violet-500 font-sans leading-relaxed resize-y"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full bg-white/40 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-3">
                    <User className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
                    <p className="text-xs text-zinc-500 max-w-sm">
                      Select a client from the left pane to view contact details, projects, custom notes, and trigger AI note summaries.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TIME TRACKER */}
          {activeTab === "time" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Session Timer & Manual Log */}
              <div className="space-y-6">
                {/* Live Project Session Timer */}
                <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 pb-3">
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Clock className={`w-4 h-4 text-violet-500 ${isTimerRunning ? 'animate-spin' : ''}`} />
                      Live Session Timer
                    </h3>
                    {isTimerRunning && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                      </span>
                    )}
                  </div>

                  {!isTimerRunning ? (
                    <div className="space-y-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-zinc-500">Project *</label>
                        <select
                          value={timerProjectId}
                          onChange={(e) => setTimerProjectId(e.target.value)}
                          className="w-full p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 rounded-xl"
                        >
                          <option value="">Select a project...</option>
                          {projects.map(proj => (
                            <option key={proj.id} value={proj.id}>{getProjectName(proj.id)}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-zinc-500">Task Details / Note</label>
                        <input
                          type="text"
                          value={timerDescription}
                          onChange={(e) => setTimerDescription(e.target.value)}
                          placeholder="E.g., Configured routing..."
                          className="w-full p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-zinc-500 block">Timer Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setTimerMode("stopwatch")}
                            className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                              timerMode === "stopwatch"
                                ? "bg-violet-500/10 border-violet-500 text-violet-505 dark:text-violet-400"
                                : "bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100"
                            }`}
                          >
                            Stopwatch
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTimerMode("countdown");
                              requestNotificationPermission();
                            }}
                            className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                              timerMode === "countdown"
                                ? "bg-violet-500/10 border-violet-500 text-violet-505 dark:text-violet-400"
                                : "bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100"
                            }`}
                          >
                            Countdown Clock
                          </button>
                        </div>
                      </div>

                      {timerMode === "countdown" && (
                        <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-2xl">
                          <label className="font-bold text-zinc-500 block">Duration (minutes)</label>
                          <div className="flex items-center gap-2">
                            {[15, 25, 30, 45, 60].map(mins => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => setCountdownDuration(mins)}
                                className={`py-1 px-2.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                  countdownDuration === mins
                                    ? "bg-violet-500 text-white border-violet-500"
                                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50"
                                }`}
                              >
                                {mins}m
                              </button>
                            ))}
                            <input
                              type="number"
                              min="1"
                              max="1440"
                              value={countdownDuration}
                              onChange={(e) => setCountdownDuration(Math.max(1, Number(e.target.value) || 1))}
                              className="w-16 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-center font-bold text-[10px]"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleStartTimer}
                        className="w-full py-3 bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-600 hover:to-indigo-750 text-white rounded-xl font-bold cursor-pointer transition-all border-none shadow-md shadow-violet-500/10"
                      >
                        Start Session
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                        Tracking: {getProjectName(timerProjectId)}
                      </p>
                      {timerDescription && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                          "{timerDescription}"
                        </p>
                      )}
                      
                      <div className="py-6">
                        <div className="text-4xl font-black font-mono tracking-wider text-zinc-900 dark:text-white select-none">
                          {formatElapsedTime(timerElapsed)}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-450 mt-1 block">
                          {timerMode === "countdown" ? "Remaining Time" : "Elapsed Time"}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleStopTimerClick}
                          className="flex-1 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl font-bold cursor-pointer transition-all border-none"
                        >
                          Stop & Log Time
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Are you sure you want to cancel the timer session without saving?")) {
                              setIsTimerRunning(false);
                              setTimerProjectId("");
                              setTimerDescription("");
                              setTimerStartTime(null);
                              setTimerElapsed(0);
                              setTimerLimitSeconds(null);
                              localStorage.removeItem("optimus_timer_running");
                              localStorage.removeItem("optimus_timer_project_id");
                              localStorage.removeItem("optimus_timer_description");
                              localStorage.removeItem("optimus_timer_start_time");
                              localStorage.removeItem("optimus_timer_mode");
                              localStorage.removeItem("optimus_timer_limit_seconds");
                              toast.info("Timer session cancelled.");
                            }
                          }}
                          className="py-3 px-4 bg-zinc-100 hover:bg-zinc-205 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold cursor-pointer transition-all border border-zinc-200 dark:border-zinc-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form to log hours directly */}
                <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 space-y-4">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-850 pb-3">
                    Log Working Hours
                  </h3>
                <form onSubmit={handleAddTimeLog} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-500">Project *</label>
                    <select
                      value={timeForm.project_id}
                      onChange={(e) => setTimeForm({ ...timeForm, project_id: e.target.value })}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 rounded-xl"
                      required
                    >
                      <option value="">Select a project...</option>
                      {projects.map(proj => (
                        <option key={proj.id} value={proj.id}>{getProjectName(proj.id)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-500">Working Hours *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={timeForm.hours}
                      onChange={(e) => setTimeForm({ ...timeForm, hours: Number(e.target.value) || 1 })}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 rounded-xl font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-500">Work Date</label>
                    <input
                      type="date"
                      value={timeForm.logged_date}
                      onChange={(e) => setTimeForm({ ...timeForm, logged_date: e.target.value })}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-500">Task Details</label>
                    <textarea
                      value={timeForm.description}
                      onChange={(e) => setTimeForm({ ...timeForm, description: e.target.value })}
                      placeholder="Describe what tasks were completed..."
                      className="w-full h-24 p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 rounded-xl"
                    />
                  </div>

                  <button type="submit" className="w-full py-3 bg-violet-650 hover:bg-violet-600 dark:bg-violet-550 dark:hover:bg-violet-500 text-white rounded-xl font-bold cursor-pointer transition-all border-none">
                    Log Hours to Database
                  </button>
                </form>
              </div>
            </div>

              {/* Time logs history */}
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6">
                <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 pb-3 mb-4">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Recent Time Log Ledger
                  </h3>
                  <span className="text-[10px] font-bold text-violet-500 bg-violet-500/10 px-3 py-1 rounded-xl">Total logged: {totalLoggedHours} hrs</span>
                </div>

                {timeLogs.length === 0 ? (
                  <div className="text-center py-12 text-zinc-450 text-xs">No hours logged yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-850 text-zinc-500 font-bold uppercase tracking-wider">
                          <th className="py-2.5">Date</th>
                          <th className="py-2.5">Project</th>
                          <th className="py-2.5">Details</th>
                          <th className="py-2.5 text-right">Hours</th>
                          <th className="py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timeLogs.map((log) => (
                          <tr key={log.id} className="border-b border-zinc-105 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                            <td className="py-3 font-mono text-[10px] text-zinc-500">{log.logged_date}</td>
                            <td className="py-3 font-semibold text-zinc-800 dark:text-zinc-200">{getProjectName(log.project_id)}</td>
                            <td className="py-3 text-zinc-500 max-w-[250px] truncate">{log.description || "-"}</td>
                            <td className="py-3 text-right font-extrabold text-zinc-900 dark:text-white">{log.hours} hrs</td>
                            <td className="py-3 text-right">
                              <button onClick={() => handleDeleteItem("freelance_time_logs", log.id, setTimeLogs, timeLogs, "timeLogs")} className="text-zinc-400 hover:text-red-500 p-1 cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: INVOICES */}
          {activeTab === "invoices" && (
            <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6">
              <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 pb-3 mb-4">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Invoices
                </h3>
                <button onClick={() => setShowInvoiceModal(true)} className="px-3.5 py-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-500 rounded-xl text-xs font-bold cursor-pointer border border-violet-500/20 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> New Invoice
                </button>
              </div>

              {invoices.length === 0 ? (
                <div className="text-center py-12 text-zinc-450 text-xs">No invoices generated. Click New Invoice to start.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-850 text-zinc-500 font-bold uppercase tracking-wider">
                        <th className="py-2.5">Invoice #</th>
                        <th className="py-2.5">Client</th>
                        <th className="py-2.5">Issued Date</th>
                        <th className="py-2.5">Due Date</th>
                        <th className="py-2.5">Amount</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                          <td className="py-3.5 font-bold text-zinc-800 dark:text-zinc-200">{inv.invoice_number}</td>
                          <td className="py-3.5 text-zinc-600 dark:text-zinc-350">{getClientName(inv.client_id)}</td>
                          <td className="py-3.5 font-mono text-[10px] text-zinc-500">{inv.issued_date}</td>
                          <td className="py-3.5 font-mono text-[10px] text-zinc-500">{inv.due_date}</td>
                          <td className="py-3.5 font-bold">৳{Number(inv.amount).toFixed(2)}</td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              inv.status === "Paid" ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600" :
                              inv.status === "Sent" ? "bg-blue-105 dark:bg-blue-500/10 text-blue-600" :
                              "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingInvoice(inv);
                                  setInvoiceForm({
                                    client_id: inv.client_id || "",
                                    invoice_number: inv.invoice_number,
                                    status: inv.status,
                                    issued_date: inv.issued_date,
                                    due_date: inv.due_date,
                                    items: inv.items || []
                                  });
                                  setShowInvoiceModal(true);
                                }}
                                className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-650 dark:text-zinc-300 rounded-lg cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                                title="Edit Invoice"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => setShowInvoicePreviewModal(inv)}
                                className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-650 dark:text-zinc-300 rounded-lg cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                                title="View PDF & Print"
                              >
                                <Printer className="w-3.5 h-3.5" /> PDF
                              </button>
                              <button
                                onClick={() => {
                                  const clientRec = clients.find(c => c.id === inv.client_id);
                                  setSendInvoiceForm({
                                    platform: "gmail",
                                    recipient: clientRec?.email || clientRec?.phone || ""
                                  });
                                  setShowSendInvoiceModal(inv);
                                }}
                                className="p-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-500 rounded-lg cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                                title="Dispatch Invoice"
                              >
                                <Send className="w-3.5 h-3.5" /> Dispatch
                              </button>
                              <button
                                onClick={() => handleDeleteItem("freelance_invoices", inv.id, setInvoices, invoices, "invoices")}
                                className="text-zinc-400 hover:text-red-500 p-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: OUTREACH LEADS */}
          {activeTab === "outreach" && (
            <div className="bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6">
              <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 pb-3 mb-4">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Outreach Pipeline Leads
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={exportOutreachToCSV} className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold border border-zinc-205 dark:border-zinc-700 cursor-pointer flex items-center gap-1.5 transition-colors">
                    <FileDown className="w-3.5 h-3.5" /> Export CSV
                  </button>
                  <button onClick={() => {
                    setEditingOutreach(null);
                    setOutreachForm({ name: "", url: "", phone: "", email: "", website: "", owner_name: "", category: "", what_need: "", status: "Lead", notes: "" });
                    setShowOutreachModal(true);
                  }} className="px-3.5 py-2 bg-violet-650 hover:bg-violet-600 dark:bg-violet-550 dark:hover:bg-violet-550 text-white rounded-xl text-xs font-bold border-none cursor-pointer flex items-center gap-1.5 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add Lead
                  </button>
                </div>
              </div>

              {/* AI Hunter Panel */}
              <div className="mb-6 p-5 bg-gradient-to-br from-violet-500/5 to-indigo-500/5 dark:from-violet-500/10 dark:to-indigo-500/10 border border-violet-500/15 dark:border-violet-500/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">AI Client Hunter (Voice or Text)</h4>
                </div>
                <p className="text-[11px] text-zinc-550 dark:text-zinc-450 mb-3 font-medium">
                  Speak or paste contact information for one or multiple leads (e.g. name, email, website, LinkedIn URL, phone, and notes). Optimus AI will automatically parse and organize them.
                </p>
                <div className="flex flex-col gap-3">
                  <textarea
                    value={voiceInputText}
                    onChange={(e) => setVoiceInputText(e.target.value)}
                    placeholder="E.g., David Connor from Cyberdyne Systems, website is cyberdyne.co, email is david@cyberdyne.co. He is looking for a Next.js developer."
                    className="w-full h-20 p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-150 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all resize-none text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (voiceHunter.state === "listening") {
                          voiceHunter.toggle();
                        } else {
                          voiceHunter.toggle();
                          toast.info("Listening... Speak lead details now.");
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all ${
                        voiceHunter.state === "listening"
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      {voiceHunter.state === "listening" ? "Listening (Click to Stop)" : "Record Speech"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (!voiceInputText.trim()) return toast.error("Please enter or record lead details first");
                        handleVoiceHuntTranscript(voiceInputText);
                      }}
                      disabled={aiLoading}
                      className="px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold border-none cursor-pointer flex items-center gap-1.5 shadow-md shadow-violet-500/10 transition-all disabled:opacity-50"
                    >
                      {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      AI Extract & Add Leads
                    </button>

                    {voiceInputText && (
                      <button
                        type="button"
                        onClick={() => setVoiceInputText("")}
                        className="text-[10px] font-bold text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 ml-auto cursor-pointer"
                      >
                        Clear Text
                      </button>
                    )}
                  </div>
                  {voiceHunter.interim && (
                    <div className="text-[10px] text-zinc-450 italic bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-850">
                      Hearing: "{voiceHunter.interim}"
                    </div>
                  )}
                </div>
              </div>

              {outreachList.length === 0 ? (
                <div className="text-center py-12 text-zinc-450 text-xs">No outreach leads registered. Add one to build your client pipeline.</div>
              ) : (
                <>
                  {/* Status Filters */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mr-2">Filter Status:</span>
                    {["All", "Lead", "Contacted", "Follow Up", "Proposal Sent", "Converted", "Rejected"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setOutreachStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition-all cursor-pointer border ${
                          outreachStatusFilter === status
                            ? "bg-violet-500 text-white border-violet-500 shadow-md shadow-violet-500/10"
                            : "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950/40 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        {status === "Converted" ? "Converted / Client" : status}
                      </button>
                    ))}
                  </div>

                  {filteredOutreachList.length === 0 ? (
                    <div className="text-center py-12 text-zinc-450 text-xs">
                      No leads found with status "{outreachStatusFilter === "Converted" ? "Converted / Client" : outreachStatusFilter}".
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-zinc-100 dark:border-zinc-850 text-zinc-500 font-bold uppercase tracking-wider">
                            <th className="py-2.5">Name</th>
                            <th className="py-2.5">Company/URL</th>
                            <th className="py-2.5">Owner Name</th>
                            <th className="py-2.5">Category</th>
                            <th className="py-2.5">What Need</th>
                            <th className="py-2.5">Contact</th>
                            <th className="py-2.5">Website</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOutreachList.map((lead) => (
                            <tr key={lead.id} className="border-b border-zinc-100 dark:border-zinc-855 hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                              <td className="py-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                                {lead.name}
                                {lead.notes && (
                                  <p className="text-[9px] font-normal text-zinc-400 dark:text-zinc-500 mt-0.5 max-w-[150px] truncate" title={lead.notes}>
                                    {lead.notes}
                                  </p>
                                )}
                              </td>
                              <td className="py-3.5 text-zinc-500">
                                {lead.url ? (
                                  <a href={lead.url} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline flex items-center gap-0.5">
                                    Profile <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                              <td className="py-3.5 text-zinc-700 dark:text-zinc-300 font-medium">{lead.owner_name || "N/A"}</td>
                              <td className="py-3.5">
                                {lead.category ? (
                                  <span className="px-2 py-0.5 bg-violet-50 dark:bg-violet-950/40 text-violet-650 dark:text-violet-400 rounded-lg text-[10px] font-semibold border border-violet-100 dark:border-violet-900/40">
                                    {lead.category}
                                  </span>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                              <td className="py-3.5 text-rose-600 dark:text-rose-400 font-semibold max-w-[150px] truncate" title={lead.what_need || ""}>
                                {lead.what_need || "N/A"}
                              </td>
                              <td className="py-3.5 text-zinc-600 dark:text-zinc-350">
                                {lead.email && <div className="truncate max-w-[140px]" title={lead.email}>{lead.email}</div>}
                                {lead.phone && <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">{lead.phone}</div>}
                                {!lead.email && !lead.phone && "N/A"}
                              </td>
                              <td className="py-3.5 text-zinc-500">
                                {lead.website ? (
                                  <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5 text-zinc-750 dark:text-zinc-300">
                                    {lead.website.replace(/^https?:\/\/(www\.)?/, "")} <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                              <td className="py-3.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  lead.status === "Converted" ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600" :
                                  lead.status === "Proposal Sent" ? "bg-blue-100 dark:bg-blue-500/10 text-blue-600" :
                                  lead.status === "Contacted" ? "bg-orange-100 dark:bg-orange-500/10 text-orange-500" :
                                  lead.status === "Follow Up" ? "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600" :
                                  lead.status === "Rejected" ? "bg-rose-105 dark:bg-rose-500/10 text-red-500" :
                                  "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                }`}>
                                  {lead.status}
                                </span>
                              </td>
                              <td className="py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingOutreach(lead);
                                      setOutreachForm({
                                        name: lead.name || "",
                                        url: lead.url || "",
                                        phone: lead.phone || "",
                                        email: lead.email || "",
                                        website: lead.website || "",
                                        owner_name: lead.owner_name || "",
                                        category: lead.category || "",
                                        what_need: lead.what_need || "",
                                        status: lead.status || "Lead",
                                        notes: lead.notes || ""
                                      });
                                      setShowOutreachModal(true);
                                    }}
                                    className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                                    title="Edit Lead"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => generateOutreachPitch(lead)}
                                    className="px-2.5 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-500 rounded-xl cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                                  >
                                    <Sparkles className="w-3 h-3" /> Pitch Draft
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem("freelance_outreach", lead.id, setOutreachList, outreachList, "outreach")}
                                    className="text-zinc-400 hover:text-red-500 p-1.5 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALS & OVERLAYS */}
      {/* ======================================================== */}

      {/* 1. Client Modal */}
      {showClientModal && renderModal(
        <div className="fixed inset-0 z-[999] bg-zinc-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 relative animate-fadeIn shadow-2xl text-zinc-800 dark:text-zinc-100">
            <button onClick={() => setShowClientModal(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-violet-500" /> Add New Client
            </h3>
            <form onSubmit={handleAddClient} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  placeholder="e.g. Sarah Connor"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Company Name</label>
                <input
                  type="text"
                  value={clientForm.company}
                  onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                  placeholder="e.g. Cyberdyne Systems"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  placeholder="e.g. sarah@cyberdyne.co"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  placeholder="e.g. +1 (555) 918-2029"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Private Notes / Briefing Context</label>
                <textarea
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                  placeholder="Goals, preferences, notes..."
                  className="w-full h-24 p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all resize-none"
                />
              </div>
              <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold border-none shadow-md shadow-violet-500/10 cursor-pointer transition-all">
                Save Client Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Project Modal */}
      {showProjectModal && renderModal(
        <div className="fixed inset-0 z-[999] bg-zinc-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 relative animate-fadeIn shadow-2xl text-zinc-800 dark:text-zinc-100">
            <button onClick={() => setShowProjectModal(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-violet-500" /> Add New Project
            </h3>
            <form onSubmit={handleAddProject} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Assign Client *</label>
                <select
                  value={projectForm.client_id}
                  onChange={(e) => setProjectForm({ ...projectForm, client_id: e.target.value })}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  required
                >
                  <option value="" className="text-zinc-400 dark:text-zinc-650 bg-white dark:bg-zinc-900">Select client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-900">{c.name} {c.company ? `(${c.company})` : ""}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="e.g. Next.js SaaS MVP"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-655 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Billing Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProjectForm({ ...projectForm, billing_type: "hourly" })}
                    className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                      projectForm.billing_type === "hourly"
                        ? "bg-violet-500/10 border-violet-500 text-violet-500"
                        : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-855 text-zinc-500"
                    }`}
                  >
                    Hourly Rate
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectForm({ ...projectForm, billing_type: "fixed" })}
                    className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                      projectForm.billing_type === "fixed"
                        ? "bg-violet-500/10 border-violet-500 text-violet-500"
                        : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-855 text-zinc-500"
                    }`}
                  >
                    Fixed Price
                  </button>
                </div>
              </div>

              {projectForm.billing_type === "hourly" ? (
                <div className="space-y-1.5">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Hourly Rate (৳) *</label>
                  <input
                    type="number"
                    required
                    value={projectForm.hourly_rate}
                    onChange={(e) => setProjectForm({ ...projectForm, hourly_rate: Number(e.target.value) || 0 })}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all font-bold"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Fixed Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={projectForm.fixed_price}
                    onChange={(e) => setProjectForm({ ...projectForm, fixed_price: Number(e.target.value) || 0 })}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all font-bold"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Initial Project Status</label>
                <select
                  value={projectForm.status}
                  onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                >
                  <option value="Active" className="bg-white dark:bg-zinc-900">Active</option>
                  <option value="On Hold" className="bg-white dark:bg-zinc-900">On Hold</option>
                  <option value="Completed" className="bg-white dark:bg-zinc-900">Completed</option>
                </select>
              </div>

              <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold border-none shadow-md shadow-violet-500/10 cursor-pointer transition-all">
                Create Project
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Log Time Modal */}
      {showTimeModal && renderModal(
        <div className="fixed inset-0 z-[999] bg-zinc-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 relative animate-fadeIn shadow-2xl text-zinc-800 dark:text-zinc-100">
            <button onClick={() => setShowTimeModal(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-extrabold text-zinc-905 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-500" /> Log Working Hours
            </h3>
            <form onSubmit={handleAddTimeLog} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Project *</label>
                <select
                  value={timeForm.project_id}
                  onChange={(e) => setTimeForm({ ...timeForm, project_id: e.target.value })}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  required
                >
                  <option value="" className="bg-white dark:bg-zinc-900">Select project...</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id} className="bg-white dark:bg-zinc-900">{getProjectName(proj.id)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Hours worked *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={timeForm.hours}
                  onChange={(e) => setTimeForm({ ...timeForm, hours: Number(e.target.value) || 1 })}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Work Date</label>
                <input
                  type="date"
                  value={timeForm.logged_date}
                  onChange={(e) => setTimeForm({ ...timeForm, logged_date: e.target.value })}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Tasks Completed</label>
                <textarea
                  value={timeForm.description}
                  onChange={(e) => setTimeForm({ ...timeForm, description: e.target.value })}
                  placeholder="What was completed..."
                  className="w-full h-24 p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all resize-none"
                />
              </div>

              <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold border-none shadow-md shadow-violet-500/10 cursor-pointer transition-all">
                Log Hours
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3b. Complete Session / Stop Timer Modal */}
      {showStopTimerModal && renderModal(
        <div className="fixed inset-0 z-[999] bg-zinc-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 relative animate-fadeIn shadow-2xl text-zinc-800 dark:text-zinc-100">
            <button onClick={() => setShowStopTimerModal(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-extrabold text-zinc-905 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-505 animate-pulse" /> Complete Session & Log
            </h3>
            <form onSubmit={handleSaveTimerLog} className="space-y-4 text-xs">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-xl mb-2 text-[11px] text-zinc-500">
                <span className="font-bold text-zinc-700 dark:text-zinc-350 block">Project:</span>
                <span className="text-xs font-extrabold text-violet-500">{getProjectName(timerProjectId)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={stopTimerForm.startTime}
                    onChange={(e) => setStopTimerForm({ ...stopTimerForm, startTime: e.target.value })}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={stopTimerForm.endTime}
                    onChange={(e) => setStopTimerForm({ ...stopTimerForm, endTime: e.target.value })}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Work Date</label>
                <input
                  type="date"
                  required
                  value={stopTimerForm.date}
                  onChange={(e) => setStopTimerForm({ ...stopTimerForm, date: e.target.value })}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Tasks Completed</label>
                <textarea
                  value={stopTimerForm.description}
                  onChange={(e) => setStopTimerForm({ ...stopTimerForm, description: e.target.value })}
                  placeholder="Describe your session tasks..."
                  className="w-full h-24 p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="text-[11px] font-bold text-zinc-450 dark:text-zinc-400 text-right bg-violet-500/5 p-2.5 rounded-lg border border-violet-500/10">
                Calculated Time: <span className="text-violet-505 dark:text-violet-400">{calculateHoursFromTimes(stopTimerForm.date, stopTimerForm.startTime, stopTimerForm.endTime)} hours</span>
              </div>

              <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold border-none shadow-md shadow-violet-500/10 cursor-pointer transition-all">
                Save & Log Session
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Create Invoice Modal */}
      {showInvoiceModal && renderModal(
        <div className="fixed inset-0 z-[999] bg-zinc-950/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-3xl p-6 relative animate-fadeIn shadow-2xl my-8 text-zinc-800 dark:text-zinc-100">
            <button onClick={() => setShowInvoiceModal(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-500" /> {editingInvoice ? "Edit Invoice" : "Create Itemized Invoice"}
            </h3>
            <form onSubmit={handleAddInvoice} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Client *</label>
                  <select
                    value={invoiceForm.client_id}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, client_id: e.target.value })}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                    required
                  >
                    <option value="" className="bg-white dark:bg-zinc-900">Select client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-900">{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.invoice_number}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-855 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Issued Date</label>
                  <input
                    type="date"
                    value={invoiceForm.issued_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, issued_date: e.target.value })}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Items Table inside Invoice creator */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-2">
                  <h4 className="font-bold text-zinc-550 dark:text-zinc-450 uppercase tracking-wide">Line Items</h4>
                  <button type="button" onClick={addInvoiceItemLine} className="px-2.5 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-500 rounded-lg font-bold flex items-center gap-1 cursor-pointer border-none">
                    <Plus className="w-3.5 h-3.5" /> Add Line Item
                  </button>
                </div>

                <div className="space-y-2">
                  {invoiceForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Description..."
                        required
                        value={item.description}
                        onChange={(e) => updateInvoiceItemField(idx, "description", e.target.value)}
                        className="flex-1 p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateInvoiceItemField(idx, "quantity", e.target.value)}
                        className="w-16 p-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-855 rounded-xl text-center font-bold text-zinc-800 dark:text-zinc-100 focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                      />
                      <input
                        type="number"
                        placeholder="Rate"
                        required
                        min="0"
                        value={item.rate}
                        onChange={(e) => updateInvoiceItemField(idx, "rate", e.target.value)}
                        className="w-20 p-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-855 rounded-xl text-center font-bold text-zinc-800 dark:text-zinc-100 focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                      />
                      <div className="w-20 text-right font-bold text-zinc-700 dark:text-zinc-300 pr-2">
                        ৳{(item.quantity * item.rate).toFixed(2)}
                      </div>
                      {invoiceForm.items.length > 1 && (
                        <button type="button" onClick={() => removeInvoiceItemLine(idx)} className="text-zinc-400 hover:text-red-500 p-1 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40 p-4 border border-zinc-150 dark:border-zinc-800 rounded-2xl">
                <span className="font-bold text-zinc-550 dark:text-zinc-400 uppercase">Total Amount</span>
                <span className="text-lg font-extrabold text-violet-550 dark:text-violet-405">
                  ৳{invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0).toFixed(2)}
                </span>
              </div>

              {/* Submit / Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Status</label>
                  <select
                    value={invoiceForm.status}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  >
                    <option value="Draft" className="bg-white dark:bg-zinc-900">Draft</option>
                    <option value="Sent" className="bg-white dark:bg-zinc-900">Sent</option>
                    <option value="Paid" className="bg-white dark:bg-zinc-900">Paid</option>
                  </select>
                </div>
                <button type="submit" className="h-11 mt-6 bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl font-bold cursor-pointer border-none shadow-md shadow-violet-500/10 transition-all">
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Outreach lead modal */}
      {showOutreachModal && renderModal(
        <div className="fixed inset-0 z-[999] bg-zinc-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-3xl p-6 relative animate-fadeIn shadow-2xl text-zinc-800 dark:text-zinc-100 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowOutreachModal(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-violet-500" /> {editingOutreach ? "Edit Outreach Lead" : "Add Outreach Lead"}
            </h3>
            <form onSubmit={handleAddOutreach} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Lead Name *</label>
                  <input
                    type="text"
                    required
                    value={outreachForm.name}
                    onChange={(e) => setOutreachForm({ ...outreachForm, name: e.target.value })}
                    placeholder="e.g. John Miller or Miller Media"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">LinkedIn / Profile URL</label>
                  <input
                    type="text"
                    value={outreachForm.url}
                    onChange={(e) => setOutreachForm({ ...outreachForm, url: e.target.value })}
                    placeholder="e.g. https://linkedin.com/in/john-miller"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-855 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={outreachForm.email}
                    onChange={(e) => setOutreachForm({ ...outreachForm, email: e.target.value })}
                    placeholder="e.g. john@millermedia.io"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-855 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={outreachForm.phone}
                    onChange={(e) => setOutreachForm({ ...outreachForm, phone: e.target.value })}
                    placeholder="e.g. +1 (555) 101-3829"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-855 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Website</label>
                  <input
                    type="text"
                    value={outreachForm.website}
                    onChange={(e) => setOutreachForm({ ...outreachForm, website: e.target.value })}
                    placeholder="e.g. millermedia.io"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-855 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={outreachForm.owner_name}
                    onChange={(e) => setOutreachForm({ ...outreachForm, owner_name: e.target.value })}
                    placeholder="e.g. John Miller (CEO)"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-855 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Category</label>
                  <input
                    type="text"
                    value={outreachForm.category}
                    onChange={(e) => setOutreachForm({ ...outreachForm, category: e.target.value })}
                    placeholder="e.g. E-Commerce, Fintech, Health"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-855 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Lead Status</label>
                  <select
                    value={outreachForm.status}
                    onChange={(e) => setOutreachForm({ ...outreachForm, status: e.target.value })}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-95 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  >
                    <option value="Lead" className="bg-white dark:bg-zinc-900">Lead</option>
                    <option value="Contacted" className="bg-white dark:bg-zinc-900">Contacted</option>
                    <option value="Follow Up" className="bg-white dark:bg-zinc-900">Follow Up</option>
                    <option value="Proposal Sent" className="bg-white dark:bg-zinc-900">Proposal Sent</option>
                    <option value="Converted" className="bg-white dark:bg-zinc-900">Converted / Client</option>
                    <option value="Rejected" className="bg-white dark:bg-zinc-900">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">What Need / Requirements</label>
                <input
                  type="text"
                  value={outreachForm.what_need}
                  onChange={(e) => setOutreachForm({ ...outreachForm, what_need: e.target.value })}
                  placeholder="e.g. Website redesign, SEO auditing, React Native development"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-855 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Context/Notes</label>
                <textarea
                  value={outreachForm.notes}
                  onChange={(e) => setOutreachForm({ ...outreachForm, notes: e.target.value })}
                  placeholder="Pain points, lead source, personal notes..."
                  className="w-full h-20 p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-205 border-zinc-200 dark:border-zinc-855 border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-655 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all resize-none"
                />
              </div>

              <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold border-none shadow-md shadow-violet-500/10 cursor-pointer transition-all">
                {editingOutreach ? "Update Lead Details" : "Add Lead to Directory"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. Transaction / Ledger Modal */}
      {showTransactionModal && renderModal(
        <div className="fixed inset-0 z-[999] bg-zinc-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 relative animate-fadeIn shadow-2xl text-zinc-800 dark:text-zinc-100">
            <button onClick={() => setShowTransactionModal(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-violet-500" /> Record Financial Ledger
            </h3>
            <form onSubmit={handleAddTransaction} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Type *</label>
                <select
                  value={transactionForm.type}
                  onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  required
                >
                  <option value="income" className="bg-white dark:bg-zinc-900">Income (Payment In)</option>
                  <option value="expense" className="bg-white dark:bg-zinc-900">Expense (Payment Out)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Amount (৳) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: Number(e.target.value) || 0 })}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-855 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all font-bold text-base"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Category *</label>
                <select
                  value={transactionForm.category}
                  onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-855 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  required
                >
                  {transactionForm.type === "income" ? (
                    <>
                      <option value="Project Payment" className="bg-white dark:bg-zinc-900">Project Payment</option>
                      <option value="Retainer Fee" className="bg-white dark:bg-zinc-900">Retainer Fee</option>
                      <option value="Consulting Fee" className="bg-white dark:bg-zinc-900">Consulting Fee</option>
                      <option value="Other Income" className="bg-white dark:bg-zinc-900">Other Income</option>
                    </>
                  ) : (
                    <>
                      <option value="Software Subscription" className="bg-white dark:bg-zinc-900">Software Subscription</option>
                      <option value="Hardware / Office" className="bg-white dark:bg-zinc-900">Hardware / Office</option>
                      <option value="Advertising / Marketing" className="bg-white dark:bg-zinc-900">Advertising / Marketing</option>
                      <option value="Taxes" className="bg-white dark:bg-zinc-900">Taxes</option>
                      <option value="Travel / Client Entertainment" className="bg-white dark:bg-zinc-900">Travel / Client Entertainment</option>
                      <option value="Other Expense" className="bg-white dark:bg-zinc-900">Other Expense</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Description</label>
                <input
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                  placeholder="e.g. Vercel subscription, Aiden payout..."
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Transaction Date</label>
                <input
                  type="date"
                  value={transactionForm.transaction_date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, transaction_date: e.target.value })}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                />
              </div>

              <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl font-bold cursor-pointer border-none shadow-md shadow-violet-500/10 transition-all">
                Record Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. Printable PDF Preview Modal */}
      {showInvoicePreviewModal && renderModal(
        <div className="fixed inset-0 z-[999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-3xl p-6 relative animate-fadeIn shadow-2xl my-8 flex flex-col h-[85vh] text-zinc-800 dark:text-zinc-105">
            <button onClick={() => setShowInvoicePreviewModal(null)} className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer z-20">
              <X className="w-4 h-4" />
            </button>
            
            {/* Modal Actions */}
            <div className="flex items-center gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-4 mb-4">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                PDF Invoice Viewer
              </h3>
              <button 
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-500 rounded-xl text-[10px] font-bold cursor-pointer flex items-center gap-1.5 ml-auto border-none transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
              </button>
            </div>

            {/* Print Area */}
            <div id="print-area" className="flex-1 bg-white text-zinc-900 p-8 rounded-2xl border border-zinc-150 overflow-y-auto shadow-inner">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-zinc-900">INVOICE</h1>
                  <p className="text-xs text-zinc-500 mt-1 font-mono">{showInvoicePreviewModal.invoice_number}</p>
                </div>
                <div className="text-right">
                  <h4 className="font-extrabold text-sm text-zinc-900">Optimus Workspace</h4>
                  <p className="text-[10px] text-zinc-550">Billing Department</p>
                  <p className="text-[10px] text-zinc-400">admin@optimus.ai</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 border-b border-zinc-105 pb-6 text-xs">
                <div>
                  <p className="font-bold text-zinc-400 uppercase tracking-wider text-[9px] mb-1">Billed To:</p>
                  <p className="font-extrabold text-zinc-900">{getClientName(showInvoicePreviewModal.client_id)}</p>
                  {clients.find(c => c.id === showInvoicePreviewModal.client_id)?.company && (
                    <p className="text-zinc-500">{clients.find(c => c.id === showInvoicePreviewModal.client_id)?.company}</p>
                  )}
                  {clients.find(c => c.id === showInvoicePreviewModal.client_id)?.email && (
                    <p className="text-zinc-500 mt-0.5">{clients.find(c => c.id === showInvoicePreviewModal.client_id)?.email}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-zinc-400 uppercase tracking-wider text-[9px] mb-1">Invoice Details:</p>
                  <p className="text-zinc-800"><span className="font-semibold text-zinc-450">Issued Date:</span> {showInvoicePreviewModal.issued_date}</p>
                  <p className="text-zinc-800 mt-0.5"><span className="font-semibold text-zinc-450">Due Date:</span> {showInvoicePreviewModal.due_date}</p>
                  <p className="text-zinc-800 mt-0.5"><span className="font-semibold text-zinc-450">Status:</span> {showInvoicePreviewModal.status}</p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left text-xs mb-8">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-400 font-bold uppercase tracking-wider text-[9px]">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-center">Quantity</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {showInvoicePreviewModal.items.map((item, index) => (
                    <tr key={index} className="border-b border-zinc-100 font-medium">
                      <td className="py-3 text-zinc-800 font-semibold">{item.description}</td>
                      <td className="py-3 text-center text-zinc-500">{item.quantity}</td>
                      <td className="py-3 text-right text-zinc-500">৳{Number(item.rate).toFixed(2)}</td>
                      <td className="py-3 text-right font-extrabold text-zinc-900">৳{Number(item.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end text-xs">
                <div className="w-64 space-y-2 border-t border-zinc-200 pt-4">
                  <div className="flex justify-between font-medium text-zinc-500">
                    <span>Subtotal</span>
                    <span>৳{Number(showInvoicePreviewModal.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-zinc-500">
                    <span>Tax (0.00%)</span>
                    <span>৳0.00</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm text-zinc-900 pt-2 border-t border-zinc-100">
                    <span>Total Due</span>
                    <span>৳{Number(showInvoicePreviewModal.amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Invoice footer message */}
              <div className="mt-12 text-center border-t border-zinc-100 pt-6 text-[10px] text-zinc-400">
                Thank you for your business. Payment is requested on or before the due date.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Send Invoice Overlay Modal */}
      {showSendInvoiceModal && renderModal(
        <div className="fixed inset-0 z-[999] bg-zinc-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 relative animate-fadeIn shadow-2xl text-zinc-800 dark:text-zinc-100">
            <button onClick={() => setShowSendInvoiceModal(null)} className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-violet-500" /> Dispatch Invoice {showSendInvoiceModal.invoice_number}
            </h3>
            <form onSubmit={triggerSendInvoice} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Choose Delivery Channel</label>
                <select
                  value={sendInvoiceForm.platform}
                  onChange={(e) => {
                    const nextPlatform = e.target.value;
                    const clientRec = clients.find(c => c.id === showSendInvoiceModal.client_id);
                    setSendInvoiceForm({
                      platform: nextPlatform,
                      recipient: nextPlatform === "gmail" ? (clientRec?.email || "") : (clientRec?.phone || "")
                    });
                  }}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                >
                  <option value="gmail" className="bg-white dark:bg-zinc-900">Gmail Address (Google OAuth)</option>
                  <option value="whatsapp" className="bg-white dark:bg-zinc-900">WhatsApp Message (Baileys Connected Session)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">
                  {sendInvoiceForm.platform === "gmail" ? "Recipient Email" : "Recipient Phone Number"}
                </label>
                <input
                  type="text"
                  required
                  value={sendInvoiceForm.recipient}
                  onChange={(e) => setSendInvoiceForm({ ...sendInvoiceForm, recipient: e.target.value })}
                  placeholder={sendInvoiceForm.platform === "gmail" ? "client@company.com" : "+15551234567"}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 rounded-xl focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                />
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-800 rounded-xl text-[10px] text-zinc-550 dark:text-zinc-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                <p>
                  Dispatched invoices will automatically trigger a real transmission using your connected credentials (if authenticated) or execute in sandboxed preview simulation mode.
                </p>
              </div>

              <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl font-bold cursor-pointer border-none shadow-md shadow-violet-500/10 transition-all">
                Dispatch Invoice Now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 9. AI Pitch Modal */}
      {showPitchModal && renderModal(
        <div className="fixed inset-0 z-[999] bg-zinc-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-xl rounded-3xl p-6 relative animate-fadeIn shadow-2xl max-h-[85vh] flex flex-col text-zinc-800 dark:text-zinc-100">
            <button onClick={() => setShowPitchModal(null)} className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer z-10">
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-sm font-extrabold text-zinc-905 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" /> AI Personalized Outreach Pitch
            </h3>

            {aiLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Gemini is researching website context and drafting your pitch...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-h-0">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-850 dark:text-zinc-200">Pitching Lead:</span> {showPitchModal.name} {showPitchModal.website ? `(${showPitchModal.website})` : ""}
                </div>

                <textarea
                  readOnly
                  value={aiPitchText}
                  className="flex-1 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs text-zinc-800 dark:text-zinc-200 font-mono focus:outline-none resize-none leading-relaxed min-h-[300px]"
                />

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiPitchText);
                      toast.success("Pitch copied to clipboard!");
                    }}
                    className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-850 dark:text-zinc-200 rounded-xl text-xs font-bold border border-zinc-205 dark:border-zinc-700 cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    Copy Pitch
                  </button>
                  {showPitchModal.email && (
                    <button
                      onClick={() => {
                        const gmailAccessToken = typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null;
                        const gmailRefreshToken = typeof window !== "undefined" ? localStorage.getItem("gmail_refresh_token") : null;
                        
                        toast.promise(
                          fetch("/api/briefing/send", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              platform: "gmail",
                              recipient: showPitchModal.email,
                              message: aiPitchText,
                              userId: user?.id || null,
                              gmailAccessToken,
                              gmailRefreshToken
                            })
                          }).then(async (res) => {
                            const json = await res.json();
                            if (!res.ok || !json.success) throw new Error(json.error || "Failed to queue draft");
                            return json;
                          }),
                          {
                            loading: `Creating email draft to ${showPitchModal.email}...`,
                            success: (resData) => {
                              // Update Lead status to Contacted
                              const updatedList = outreachList.map(item => item.id === showPitchModal.id ? { ...item, status: "Contacted" } : item);
                              setOutreachList(updatedList);
                              updateLocalStorage("outreach", updatedList);
                              if (user) {
                                insforge.database.from("freelance_outreach").update({ status: "Contacted" }).eq("id", showPitchModal.id);
                              }
                              setShowPitchModal(null);
                              return `Outreach draft successfully queued in your Gmail! ${resData.source === 'gmail' ? '' : '(Sandbox Mode)'}`;
                            },
                            error: (err) => `Failed to draft outreach: ${err.message}`
                          }
                        );
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold border-none cursor-pointer flex items-center gap-1.5 shadow-md shadow-violet-500/10 transition-all ml-auto"
                    >
                      <Send className="w-3.5 h-3.5" /> Save to Gmail Drafts
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
