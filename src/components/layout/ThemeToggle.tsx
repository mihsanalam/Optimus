"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2.5 rounded-xl border border-zinc-250/50 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 hover:text-accent dark:hover:text-accent hover:border-accent/30 dark:hover:border-accent/30 transition-all duration-200 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] ${className}`}
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {theme === "dark" ? (
          <Sun className="w-5 h-5 transition-transform duration-355 rotate-0 scale-100 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 transition-transform duration-355 rotate-0 scale-100 text-accent" />
        )}
      </div>
    </button>
  );
}
