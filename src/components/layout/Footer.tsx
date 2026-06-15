"use client";

import React, { useState } from "react";
import { Send, Github, Twitter, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/80 backdrop-blur-md pt-20 pb-10 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Optimus Logo"
                className="w-9 h-9 rounded-xl object-cover border border-zinc-200 dark:border-zinc-850 shadow-md"
              />
              <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Optimus</span>
            </div>
            <p className="text-sm text-zinc-550 dark:text-zinc-400 max-w-sm leading-relaxed">
              Your personal AI assistant orchestrating background syncs, smart summaries, and proactive reminders for Gmail, Slack, WhatsApp, and more.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com/mihsanalam/Optimus" target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Product</h4>
            <ul className="space-y-2.5">
              <li><a href="#features" className="text-sm text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Core Features</a></li>
              <li><Link href="/integrations" className="text-sm text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">App Directory</Link></li>
              <li><a href="#demo" className="text-sm text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Interactive Demo</a></li>
              <li><a href="#" className="text-sm text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Platform Security</a></li>
            </ul>
          </div>

          {/* Developer Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Developers</h4>
            <ul className="space-y-2.5">
              <li><a href="https://github.com/mihsanalam/Optimus" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">GitHub Repository</a></li>
              <li><a href="#" className="text-sm text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">API Documentation</a></li>
              <li><a href="#" className="text-sm text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Webhook Guides</a></li>
              <li><a href="#" className="text-sm text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">System Status</a></li>
            </ul>
          </div>

          {/* Newsletter / Signup Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Stay Updated</h4>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
              Subscribe to get the latest feature updates and workflow recipes.
            </p>
            {subscribed ? (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                ✓ Thanks for subscribing!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter email..."
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-405 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-550 transition-all"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

        </div>

        <div className="h-px bg-zinc-200 dark:bg-zinc-900 mb-8" />

        {/* Bottom Credits */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500 dark:text-zinc-500">
          <p>© {new Date().getFullYear()} Optimus. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Security Disclosure</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
