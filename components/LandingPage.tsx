"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { LifePassport } from "@/types";

interface LandingPageProps {
  onComplete: (passport: LifePassport) => void;
}

const VIBES = [
  "Chasing Sunsets",
  "Deep Focus",
  "Taking it Easy",
  "Night Owl",
  "Main Character Energy",
  "Just Vibing",
  "Grindset",
  "Wanderer",
];

export function LandingPage({ onComplete }: LandingPageProps) {
  const [name, setName] = useState("");
  const [vibe, setVibe] = useState(VIBES[0]);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setStep(1);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onComplete({
      name: name.trim(),
      vibe: vibe,
      joinedDate: new Date().toISOString(),
    });
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-foreground overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[10000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[7000ms]" />
      
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
        {step === 0 ? (
          <div className="animate-in fade-in zoom-in duration-1000 flex flex-col items-center text-center space-y-4">
            <Sparkles className="w-12 h-12 text-primary animate-pulse" />
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Hello there.
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              Let&apos;s make today count.
            </p>
          </div>
        ) : (
          <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-10 space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Your Life Passport</h1>
              <p className="text-muted-foreground">Who is the main character of this story?</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-card/50 backdrop-blur-xl p-8 rounded-3xl border border-border shadow-2xl">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  What do we call you?
                </label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name or Alias"
                  className="w-full px-4 py-4 bg-background border border-border rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Current Vibe
                </label>
                <div className="relative">
                  <select
                    value={vibe}
                    onChange={(e) => setVibe(e.target.value)}
                    className="w-full appearance-none px-4 py-4 bg-background border border-border rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-foreground cursor-pointer"
                  >
                    {VIBES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    ▼
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-foreground text-background rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                Begin Journey
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
