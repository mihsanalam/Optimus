"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { insforge } from "@/lib/insforge";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Lock, Mail, Sparkles, AlertCircle, RefreshCw, User, CheckCircle2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  
  // Registration Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Email Verification Code State
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [otp, setOtp] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setErrorMsg("Please fill in all details.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await insforge.auth.signUp({
        email,
        password,
        name,
      });

      if (error) {
        setErrorMsg(error.message || "Sign up failed. Please try again.");
      } else if (data) {
        if (data.requireEmailVerification) {
          setVerificationRequired(true);
        } else if (data.accessToken) {
          // Direct login (verification disabled on backend)
          await refreshUser();
          setVerificationSuccess(true);
          setTimeout(() => {
            router.push("/");
          }, 1500);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setErrorMsg("Please enter a valid 6-digit code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await insforge.auth.verifyEmail({
        email,
        otp,
      });

      if (error) {
        setErrorMsg(error.message || "Invalid or expired verification code.");
      } else if (data) {
        setVerificationSuccess(true);
        // Sync custom profile fields (like name) to auth metadata/profile
        if (name) {
          await insforge.auth.setProfile({ name });
        }
        await refreshUser();
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to verify email code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMsg("");
    try {
      const { data, error } = await insforge.auth.resendVerificationEmail({
        email,
      });
      if (error) {
        setErrorMsg(error.message || "Failed to resend verification code.");
      } else {
        alert("Verification code has been resent to your email.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while resending code.");
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
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Home Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-xs font-semibold text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 group transition-colors"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Home
      </Link>

      <div className="w-full max-w-md bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200 dark:border-zinc-850 rounded-3xl p-8 shadow-2xl relative glow-border animate-fadeIn transition-colors duration-200">
        
        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-655 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-700 dark:text-red-300 font-medium leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* View 1: Verification Success */}
        {verificationSuccess ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Verification Complete</h1>
            <p className="text-sm text-zinc-650 dark:text-zinc-400">
              Welcome, {name}! Your account is verified and ready. Redirecting to app...
            </p>
          </div>
        ) : verificationRequired ? (
          /* View 2: Verification OTP Prompt */
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Verify Your Email</h1>
              <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1.5 leading-relaxed">
                We've sent a 6-digit verification code to <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{email}</span>.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 focus:border-indigo-500/50 rounded-xl py-3 text-center text-lg font-bold tracking-widest text-zinc-900 dark:text-white placeholder-zinc-350 dark:placeholder-zinc-700 outline-none transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Verify Code"}
              </button>
            </form>

            <div className="text-center text-xs text-zinc-500">
              Didn't receive the code?{" "}
              <button
                onClick={handleResendOtp}
                className="text-indigo-650 dark:text-indigo-400 font-bold hover:underline bg-transparent border-none outline-none cursor-pointer"
              >
                Resend Code
              </button>
            </div>
          </div>
        ) : (
          /* View 3: Sign Up Form */
          <>
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-905 dark:text-white">Create Account</h1>
              <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1.5">
                Join Optimus today to automate your workflow
              </p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-zinc-400 dark:text-zinc-550" />
                  <input
                    type="text"
                    placeholder="Mihsan Alam"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 focus:border-indigo-500/50 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-405 dark:placeholder-zinc-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

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
                    className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 focus:border-indigo-500/50 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-zinc-400 dark:text-zinc-555" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-955 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 focus:border-indigo-500/50 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Sign Up"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-900" />
              <span className="px-4 text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-500">Or Register With</span>
              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-900" />
            </div>

            {/* OAuth Buttons */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-955/40 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-955/80 dark:hover:bg-zinc-950/80 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer disabled:opacity-40"
            >
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
              Already have an account?{" "}
              <Link href="/sign-in" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
