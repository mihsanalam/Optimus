"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import AppIntegrations from "@/components/sections/AppIntegrations";
import InteractiveDemo from "@/components/sections/InteractiveDemo";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-zinc-800 dark:text-zinc-100 overflow-x-hidden transition-colors duration-200">
      {/* Navigation Header */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Features Grid Section */}
      <Features />

      {/* App Integrations Tab Inspector */}
      <AppIntegrations />

      {/* Interactive Sandbox Playground */}
      <InteractiveDemo />

      {/* Grid-Style Footer */}
      <Footer />
    </div>
  );
}
