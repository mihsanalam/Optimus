"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Mail, Shield, Check, Lock, ChevronRight, Eye } from "lucide-react";

function OAuthMockContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const state = searchParams.get("state") || "optimus_gmail_auth";
  const redirectUri = searchParams.get("redirect_uri") || "";

  const [customEmail, setCustomEmail] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("mihsan.dev@gmail.com");
  const [showInput, setShowInput] = useState(false);

  const mockProfiles = [
    { name: "Mihsan Alam", email: "mihsan.dev@gmail.com", avatar: "MA" },
    { name: "Sarah Miller", email: "sarah.miller@millermedia.com", avatar: "SM" },
    { name: "Guest Developer", email: "guest.developer@gmail.com", avatar: "GD" }
  ];

  const handleAllow = () => {
    const finalEmail = showInput ? (customEmail || "custom.user@gmail.com") : selectedProfile;
    // Redirect back to our callback API
    const callbackUrl = `/api/gmail/callback?code=mock_code_${Math.random().toString(36).substring(7)}&email=${encodeURIComponent(finalEmail)}&state=${encodeURIComponent(state)}`;
    router.push(callbackUrl);
  };

  const handleCancel = () => {
    router.push("/dashboard?tab=integrations&gmail_status=cancelled");
  };

  return (
    <div className="min-h-screen w-full bg-[#fafafa] dark:bg-zinc-950 flex items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      {/* Glow backgrounds */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl shadow-xl overflow-hidden relative z-10 flex flex-col p-6 sm:p-8 space-y-6">
        
        {/* Google Branding Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white flex items-center gap-1">
              <span className="text-blue-500">G</span>
              <span className="text-red-500">o</span>
              <span className="text-yellow-500">o</span>
              <span className="text-blue-500">g</span>
              <span className="text-green-500">l</span>
              <span className="text-red-500">e</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-medium px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-950 uppercase tracking-wider">
              OAuth 2.0 Secure
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 font-bold text-xs">
            OP
          </div>
        </div>

        {/* Header Title */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Sign in with Google</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            to continue to <strong className="text-zinc-805 dark:text-zinc-300 font-semibold">Optimus AI Hub</strong>. Google will share your name, email address, profile picture, and the selected scopes.
          </p>
        </div>

        {/* Profile Selector */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Select a Google Account
          </label>
          
          <div className="space-y-2">
            {!showInput ? (
              <>
                {mockProfiles.map((p) => {
                  const isSelected = selectedProfile === p.email;
                  return (
                    <button
                      key={p.email}
                      onClick={() => setSelectedProfile(p.email)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                        isSelected
                          ? "bg-zinc-50 dark:bg-zinc-950 border-blue-500/50 dark:border-blue-500/40 shadow-sm"
                          : "bg-transparent border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">
                          {p.avatar}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-zinc-800 dark:text-white block">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-zinc-550 dark:text-zinc-400 block">
                            {p.email}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setShowInput(true)}
                  className="w-full text-center py-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 text-[10px] font-bold text-blue-500 hover:text-blue-600 hover:bg-blue-500/5 transition-all cursor-pointer bg-transparent"
                >
                  Use another account
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-450" />
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="Enter your Gmail address"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 focus:border-blue-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-800 dark:text-white outline-none"
                  />
                </div>
                <button
                  onClick={() => setShowInput(false)}
                  className="text-[10px] font-bold text-zinc-400 hover:text-zinc-650 cursor-pointer bg-transparent border-0"
                >
                  ← Back to default accounts
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Permissions Info */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-850 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[9px]">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            Optimus AI Requests Access To:
          </div>

          <ul className="space-y-2 text-[10px] text-zinc-605 dark:text-zinc-400">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
              <span>Read your unread emails and thread metadata (ReadOnly)</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
              <span>Compose draft responses for your approval</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
              <span>Send emails when explicitly approved in the dashboard</span>
            </li>
          </ul>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-850 flex items-center gap-2 text-[9px] text-zinc-400">
            <Lock className="w-3 h-3 text-emerald-500" />
            Your credentials are encrypted and stored locally.
          </div>
        </div>

        {/* Buttons Action */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 transition-all cursor-pointer bg-transparent"
          >
            Cancel
          </button>
          <button
            onClick={handleAllow}
            className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5"
          >
            Allow
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}

export default function GmailOAuthMockPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center dark:bg-zinc-950 text-xs text-zinc-400">Loading OAuth...</div>}>
      <OAuthMockContent />
    </Suspense>
  );
}
