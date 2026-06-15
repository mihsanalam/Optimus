"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, Circle, Loader2, ListTodo } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  user_id: string | null;
  created_at: string;
}

export default function QuickTasks() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState("");

  const userId = user?.id || null;

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError("");
      const url = userId ? `/api/todos?userId=${userId}` : "/api/todos";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTodos(data.todos);
      } else {
        setError("Failed to load tasks");
      }
    } catch (err) {
      setError("Failed to connect to task manager");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [userId]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setAdding(true);
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, userId })
      });
      const data = await res.json();
      if (data.success) {
        setTodos((prev) => [data.data, ...prev]);
        setNewTitle("");
      } else {
        setError("Failed to create task");
      }
    } catch (err) {
      setError("Error adding task");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleTodo = async (id: string, currentCompleted: boolean) => {
    try {
      const res = await fetch("/api/todos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed: !currentCompleted })
      });
      const data = await res.json();
      if (data.success) {
        setTodos((prev) =>
          prev.map((todo) => (todo.id === id ? { ...todo, completed: !currentCompleted } : todo))
        );
      }
    } catch (err) {
      console.error("Failed to toggle todo status:", err);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      const res = await fetch(`/api/todos?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setTodos((prev) => prev.filter((todo) => todo.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete todo:", err);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 flex flex-col h-[400px] transition-all glow-border">
      <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-accent/10 text-accent rounded-xl">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Quick Tasks</h3>
            <p className="text-[9px] text-zinc-500">Workspace agenda & priorities</p>
          </div>
        </div>
        <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold px-2 py-0.5 rounded-full">
          {todos.filter((t) => !t.completed).length} pending
        </span>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:border-accent transition-colors"
        />
        <button
          type="submit"
          disabled={adding || !newTitle.trim()}
          className="p-2 bg-accent hover:bg-accent-hover text-white rounded-xl active-scale disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center shrink-0"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </form>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          </div>
        ) : error ? (
          <p className="text-[10px] text-red-500 text-center py-4">{error}</p>
        ) : todos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-405 dark:text-zinc-500 py-8">
            <CheckCircle2 className="w-6 h-6 mb-2 text-zinc-350 dark:text-zinc-700" />
            <p className="text-xs font-semibold">All clear!</p>
            <p className="text-[9px] mt-0.5">Nothing on your agenda today.</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 hover:border-zinc-200 dark:hover:border-zinc-800 transition-all group"
            >
              <button
                onClick={() => handleToggleTodo(todo.id, todo.completed)}
                className="flex items-center gap-2.5 text-left min-w-0"
              >
                {todo.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-zinc-400 dark:text-zinc-600 hover:text-accent shrink-0" />
                )}
                <span
                  className={`text-xs text-zinc-700 dark:text-zinc-300 truncate transition-all ${
                    todo.completed ? "line-through text-zinc-400 dark:text-zinc-600" : ""
                  }`}
                >
                  {todo.title}
                </span>
              </button>
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="p-1 text-zinc-400 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
