"use client";

import React, { useState } from "react";
import { Menu, X, ArrowRight, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/layout/ThemeToggle";
import UnifiedSearchBar from "@/components/layout/UnifiedSearchBar";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-900 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Optimus Logo"
              className="w-9 h-9 rounded-xl object-cover border border-zinc-200 dark:border-zinc-850 shadow-md shadow-indigo-500/10 dark:shadow-indigo-500/5"
            />
            <div>
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Optimus</span>
              <span className="block text-[8px] tracking-wider text-indigo-600 dark:text-indigo-400 font-bold uppercase">AI Hub</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors link-underline">
              Features
            </a>
            <Link href="/integrations" className="text-sm font-medium text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors link-underline">
              Integrations
            </Link>
            <a href="#demo" className="text-sm font-medium text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors link-underline">
              Interactive Demo
            </a>
            <a href="https://github.com/mihsanalam/Optimus" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors link-underline">
              GitHub
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-5">
            <UnifiedSearchBar />
            <ThemeToggle />
            {loading ? (
              <div className="w-20 h-8 bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-xl" />
            ) : user ? (
              <div className="flex items-center gap-4">
                {/* User badge */}
                <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors">
                  {user.profile?.avatar_url ? (
                    <img
                      src={user.profile.avatar_url}
                      alt={user.profile.name || "User Avatar"}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <UserIcon className="w-3 h-3" />
                    </div>
                  )}
                  <span className="text-xs font-semibold text-zinc-805 dark:text-zinc-200">
                    {user.profile?.name || user.email.split("@")[0]}
                  </span>
                </Link>
                
                {/* Sign Out Button */}
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-550 hover:text-zinc-900 dark:text-zinc-455 dark:hover:text-white transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm font-semibold text-zinc-550 hover:text-zinc-900 dark:text-zinc-455 dark:hover:text-white transition-colors cursor-pointer relative group"
                >
                  Sign In
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
                </Link>
                <Link
                  href="/sign-up"
                  className="flex items-center gap-1.5 px-4.5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5 animate-fadeIn"
                >
                  Get Started
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Actions Container */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle className="p-2" />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-2 rounded-lg transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 px-6 py-6 space-y-4 animate-fadeIn transition-colors duration-200">
          <nav className="flex flex-col gap-4">
            <a
              href="#features"
              onClick={() => setIsOpen(false)}
              className="text-base font-medium text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Features
            </a>
            <Link
              href="/integrations"
              onClick={() => setIsOpen(false)}
              className="text-base font-medium text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Integrations
            </Link>
            <a
              href="#demo"
              onClick={() => setIsOpen(false)}
              className="text-base font-medium text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Interactive Demo
            </a>
            <a
              href="https://github.com/mihsanalam/Optimus"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="text-base font-medium text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              GitHub
            </a>
          </nav>
          <div className="h-px bg-zinc-200 dark:bg-zinc-900 my-4" />
          <div className="px-1 mb-4">
            <UnifiedSearchBar />
          </div>
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="w-full h-10 bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-xl" />
            ) : user ? (
              <>
                 <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 block text-left">
                      {user.profile?.name || user.email.split("@")[0]}
                    </span>
                    <span className="text-[10px] text-zinc-500 block text-left">
                      {user.email}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }}
                  className="w-full text-center py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-850 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-850 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer block"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white shadow-lg transition-colors cursor-pointer block"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
