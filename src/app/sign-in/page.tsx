"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { insforge } from "@/lib/insforge";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Lock, Mail, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data, error } = await insforge.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message || "Invalid credentials. Please try again.");
      } else if (data) {
        setSuccessMsg("Signed in successfully! Redirecting...");
        await refreshUser();
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const redirectTo = `${window.location.origin}/`;
      const { data, error } = await insforge.auth.signInWithOAuth("google", {
        redirectTo,
      });

      if (error) {
        setErrorMsg(error.message || "Google sign-in failed.");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start Google sign-in.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-background bg-grid-pattern flex flex-col justify-center items-center p-4 transition-colors duration-200">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Home Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-xs font-semibold text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 group transition-colors"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Home
      </Link>

      {/* Main card container */}
      <div className="w-full max-w-md bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200 dark:border-zinc-850 rounded-3xl p-8 shadow-2xl relative glow-border animate-fadeIn transition-colors duration-200">
        {/* Title */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Welcome Back</h1>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1.5">
            Log in to manage your AI workflows
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-655 dark:text-red-300 font-medium leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-450 shrink-0 mt-2 animate-ping" />
            <div className="text-xs text-emerald-650 dark:text-emerald-300 font-medium leading-relaxed">{successMsg}</div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-zinc-400 dark:text-zinc-550" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 focus:border-indigo-500/50 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-405 dark:placeholder-zinc-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-505 dark:text-zinc-400">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-zinc-400 dark:text-zinc-550" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-955 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 focus:border-indigo-500/50 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-405 dark:placeholder-zinc-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-900" />
          <span className="px-4 text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-500">Or Continue With</span>
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-900" />
        </div>

        {/* OAuth Buttons */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-955/40 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-950/80 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer disabled:opacity-40"
        >
          {/* Simple Google SVG Icon */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.147 4.114-3.41 0-6.19-2.78-6.19-6.19s2.78-6.19 6.19-6.19c1.7 0 3.22.69 4.33 1.8l3.1-3.1C19.12 2.06 15.89 1 12.24 1 6.14 1 1.2 5.94 1.2 12s4.94 11 11.04 11c5.81 0 10.74-4.22 10.74-10.285 0-.585-.05-1.155-.15-1.715h-10.59z"
            />
          </svg>
          Google
        </button>

        {/* Toggle Auth Link */}
        <p className="text-center text-xs text-zinc-500 mt-8">
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  );
}
