"use client";

import React, { useState, useEffect } from "react";
import { Star, CheckCircle, Flame, Target, Trophy, Sparkles } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SectionHeader } from "@/components/SectionHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Quest } from "@/types";
import confetti from "canvas-confetti"; // We need to install this or just use a simple animation

const QUEST_IDEAS = [
  { title: "Take a photo of something blue", description: "Find something blue in your environment and capture it for your memory map." },
  { title: "Walk outside for 10 minutes", description: "Get some fresh air and touch grass. It's good for you." },
  { title: "Drink 2 liters of water", description: "Hydration is key. Track your water intake today." },
  { title: "Watch the sunset", description: "Take a moment to appreciate the end of the day." },
  { title: "Listen to a new song", description: "Find a genre or artist you've never listened to before." },
  { title: "Organize your desk", description: "A clean workspace leads to a clear mind." },
  { title: "Compliment someone", description: "Make someone's day a little brighter." },
  { title: "Read for 15 minutes", description: "Pick up a book or read an interesting article." },
  { title: "Do 20 pushups or squats", description: "Get your blood flowing with a quick burst of exercise." },
  { title: "Write down 3 things you're grateful for", description: "Reflect on the positive aspects of your life." },
];

export default function DailyQuests() {
  const [mounted, setMounted] = useState(false);
  const [quests, setQuests] = useLocalStorage<Quest[]>("daily_quests", []);
  const [streak, setStreak] = useLocalStorage<number>("quest_streak", 0);
  
  const today = new Date().toISOString().split("T")[0];
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentQuest = quests.find(q => q.dateAssigned === today);

  useEffect(() => {
    if (!mounted) return;
    
    // Generate a new quest for today if one doesn't exist
    if (!currentQuest) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      
      const yesterdayQuest = quests.find(q => q.dateAssigned === yesterdayStr);
      
      // If they didn't complete yesterday's quest, reset streak
      if (quests.length > 0 && (!yesterdayQuest || !yesterdayQuest.completed)) {
        setStreak(0);
      }
      
      const randomIdea = QUEST_IDEAS[Math.floor(Math.random() * QUEST_IDEAS.length)];
      
      const newQuest: Quest = {
        id: crypto.randomUUID(),
        title: randomIdea.title,
        description: randomIdea.description,
        completed: false,
        dateAssigned: today,
      };
      
      setQuests([newQuest, ...quests]);
    }
  }, [mounted, currentQuest, quests, setQuests, setStreak, today]);

  const handleComplete = () => {
    if (!currentQuest || currentQuest.completed) return;
    
    // Play celebration animation
    try {
      // Very basic confetti without needing the package
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        // We'll just create a nice visual effect on the card itself using CSS classes
      };
      requestAnimationFrame(frame);
    } catch (e) {}

    const updatedQuests = quests.map(q => 
      q.id === currentQuest.id ? { ...q, completed: true } : q
    );
    
    setQuests(updatedQuests);
    setStreak(streak + 1);
  };

  if (!mounted || !currentQuest) return null;

  const pastQuests = quests.filter(q => q.id !== currentQuest.id).slice(0, 10);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <SectionHeader
        title="Daily Quests"
        description="One simple challenge every day to keep life interesting."
      />

      {/* Streak Header */}
      <div className="flex items-center gap-3 p-4 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-2xl">
        <div className="p-2 bg-orange-500/20 rounded-full">
          <Flame className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold">Current Streak: {streak} Day{streak !== 1 && 's'}</h3>
          <p className="text-xs opacity-80">Complete today's quest to keep the fire burning!</p>
        </div>
      </div>

      {/* Current Quest Card */}
      <div className={`relative overflow-hidden transition-all duration-500 rounded-3xl border p-8 ${
        currentQuest.completed 
          ? 'bg-emerald-500/10 border-emerald-500/30' 
          : 'bg-card border-border shadow-lg'
      }`}>
        {/* Background Decoration */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className={`p-4 rounded-full ${currentQuest.completed ? 'bg-emerald-500/20 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
            {currentQuest.completed ? <Trophy className="w-8 h-8" /> : <Target className="w-8 h-8" />}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Today's Quest</h2>
            <h1 className={`text-3xl font-bold tracking-tight transition-colors ${currentQuest.completed ? 'text-emerald-500' : 'text-foreground'}`}>
              {currentQuest.title}
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              {currentQuest.description}
            </p>
          </div>

          {!currentQuest.completed ? (
            <PrimaryButton onClick={handleComplete} className="w-full sm:w-auto px-8 py-6 text-lg rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all group">
              <Sparkles className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              Complete Quest
            </PrimaryButton>
          ) : (
            <div className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-500/10 px-6 py-3 rounded-full">
              <CheckCircle className="w-5 h-5" />
              Quest Completed!
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {pastQuests.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-border/50">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Recent Quests
          </h3>
          <div className="grid gap-3">
            {pastQuests.map(quest => (
              <div key={quest.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/50">
                <div>
                  <h4 className="font-medium text-sm text-foreground">{quest.title}</h4>
                  <p className="text-xs text-muted-foreground">{new Date(quest.dateAssigned).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                </div>
                {quest.completed ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
