"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, Mail, CheckSquare, StickyNote, X } from "lucide-react";
import { searchAggregatedData } from "@/lib/unifiedSearch";
import { SearchResultItem } from "@/types/search";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function UnifiedSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Click outside to close
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1 && user?.id) {
        setLoading(true);
        const data = await searchAggregatedData(query, user.id);
        setResults(data.results);
        setLoading(false);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query, user?.id]);

  const getIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4 text-blue-500" />;
      case "task":
        return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      case "note":
        return <StickyNote className="w-4 h-4 text-amber-500" />;
      default:
        return <Search className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getLinkUrl = (item: SearchResultItem) => {
    switch (item.type) {
      case "email":
        return "/dashboard/emails"; // Adjust based on your actual routes
      case "task":
        return "/dashboard"; 
      case "note":
        return "/dashboard";
      default:
        return "#";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search emails, tasks, notes..."
          className="w-64 lg:w-80 h-9 pl-9 pr-8 rounded-full bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
        {loading && (
          <Loader2 className="absolute right-3 w-4 h-4 text-zinc-400 animate-spin" />
        )}
        {!loading && query && (
          <button 
            onClick={() => setQuery("")}
            className="absolute right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-12 left-0 w-[350px] max-h-[400px] overflow-y-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-2xl rounded-2xl z-50 animate-fadeIn">
          <div className="p-2">
            <h4 className="px-3 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Search Results
            </h4>
            <div className="flex flex-col gap-1">
              {results.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={getLinkUrl(item)}
                  onClick={() => setIsOpen(false)}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group"
                >
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg shrink-0 group-hover:bg-white dark:group-hover:bg-zinc-950 transition-colors">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                      {item.preview}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {isOpen && !loading && query.length > 1 && results.length === 0 && (
        <div className="absolute top-12 left-0 w-[350px] p-6 text-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-2xl rounded-2xl z-50">
          <p className="text-xs text-zinc-500">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
