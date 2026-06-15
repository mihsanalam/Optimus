"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, FileText, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NoteItem {
  id: string;
  content: string;
  color: string;
  position_x: number;
  position_y: number;
  user_id: string | null;
  created_at: string;
}

const NOTE_COLORS = [
  { name: "yellow", bg: "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-900/50" },
  { name: "indigo", bg: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-900/50" },
  { name: "green", bg: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900/50" },
  { name: "rose", bg: "bg-rose-100 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-900/50" },
  { name: "teal", bg: "bg-teal-100 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 border-teal-200 dark:border-teal-900/50" }
];

export default function StickyNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const userId = user?.id || null;

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError("");
      const url = userId ? `/api/sticky-notes?userId=${userId}` : "/api/sticky-notes";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setNotes(data.notes);
      } else {
        setError("Failed to load notes");
      }
    } catch (err) {
      setError("Failed to connect to database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  const handleAddNote = async () => {
    try {
      setAdding(true);
      const res = await fetch("/api/sticky-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Write a note...",
          color: "yellow",
          userId
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotes((prev) => [...prev, data.data]);
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const res = await fetch(`/api/sticky-notes?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setNotes((prev) => prev.filter((note) => note.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleUpdateNote = (id: string, updates: Partial<NoteItem>) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, ...updates } : note))
    );
  };

  return (
    <div className="glass-panel rounded-3xl p-6 flex flex-col h-[400px] transition-all glow-border">
      <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-accent/10 text-accent rounded-xl">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Sticky Notes</h3>
            <p className="text-[9px] text-zinc-550 dark:text-zinc-500">Persistent scratch pad & thoughts</p>
          </div>
        </div>
        <button
          onClick={handleAddNote}
          disabled={adding}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer active-scale disabled:opacity-50 shrink-0"
        >
          {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Add Note
        </button>
      </div>

      {/* Grid container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          </div>
        ) : error ? (
          <p className="text-[10px] text-red-500 text-center py-4">{error}</p>
        ) : notes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500 py-8">
            <FileText className="w-6 h-6 mb-2 text-zinc-350 dark:text-zinc-700" />
            <p className="text-xs font-semibold">No notes yet</p>
            <p className="text-[9px] mt-0.5">Click "Add Note" to create a scratch pad.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onDelete={handleDeleteNote}
                onUpdate={handleUpdateNote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface NoteCardProps {
  note: NoteItem;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<NoteItem>) => void;
}

function NoteCard({ note, onDelete, onUpdate }: NoteCardProps) {
  const [content, setContent] = useState(note.content);
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeColor = NOTE_COLORS.find((c) => c.name === note.color) || NOTE_COLORS[0];

  // Save changes automatically after user stops typing (800ms debounce)
  const saveNoteContent = async (text: string) => {
    try {
      setIsSaving(true);
      await fetch("/api/sticky-notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id, content: text })
      });
    } catch (err) {
      console.error("Failed to auto-save note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    onUpdate(note.id, { content: text });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveNoteContent(text);
    }, 800);
  };

  const handleColorChange = async (colorName: string) => {
    try {
      onUpdate(note.id, { color: colorName });
      await fetch("/api/sticky-notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id, color: colorName })
      });
    } catch (err) {
      console.error("Failed to update note color:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`p-4 rounded-2xl border flex flex-col h-[160px] relative transition-all shadow-sm ${activeColor.bg}`}>
      {/* Note Edit Area */}
      <textarea
        value={content}
        onChange={handleContentChange}
        className="flex-1 bg-transparent resize-none outline-none text-xs leading-relaxed focus:outline-none placeholder-zinc-400 font-medium"
        placeholder="Write something..."
      />

      {/* Note Action Toolbar */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5">
        {/* Colors Selection list */}
        <div className="flex gap-1">
          {NOTE_COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => handleColorChange(c.name)}
              className={`w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 transition-transform hover:scale-125 cursor-pointer ${
                c.name === "yellow"
                  ? "bg-amber-300"
                  : c.name === "indigo"
                  ? "bg-indigo-400"
                  : c.name === "green"
                  ? "bg-emerald-400"
                  : c.name === "rose"
                  ? "bg-rose-400"
                  : "bg-teal-400"
              } ${note.color === c.name ? "ring-2 ring-accent ring-offset-1" : ""}`}
              title={`Switch to ${c.name}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-[8px] opacity-60 font-semibold uppercase tracking-wider flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 animate-pulse" />
              Saving...
            </span>
          )}
          <button
            onClick={() => onDelete(note.id)}
            className="p-1 text-black/40 dark:text-white/40 hover:text-red-650 dark:hover:text-red-400 transition-colors cursor-pointer"
            title="Delete note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
