"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Moon,
  Dices,
  Hourglass,
  Calendar,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { StatCard } from "@/components/StatCard";
import { SectionHeader } from "@/components/SectionHeader";
import { Memory, SleepRecord, Decision, TimeCapsule, LifePassport } from "@/types";
import { useIndexedDB } from "@/hooks/useIndexedDB";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);

  // Read data models
  const [passport] = useLocalStorage<LifePassport | null>("life_passport", null);
  const [memories] = useIndexedDB<Memory[]>("memories-idb", []);
  const [sleepRecords] = useLocalStorage<SleepRecord[]>("sleep_records", []);
  const [decisions] = useLocalStorage<Decision[]>("decisions", []);
  const [timeCapsules] = useLocalStorage<TimeCapsule[]>("time_capsules", []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate Metrics
  const totalMemoriesCount = memories.length;

  // Calculate accumulated Sleep Debt
  // Sleep Debt = Needed - Slept. Let's calculate sum for last 7 records
  const recentSleepRecords = sleepRecords.slice(-7);
  const totalSleepDebt = recentSleepRecords.reduce((acc, curr) => {
    const debt = curr.hoursNeeded - curr.hoursSlept;
    return acc + (debt > 0 ? debt : 0);
  }, 0);

  const decisionsMadeCount = decisions.length;

  // Active time capsules: locked capsules whose unlockDate is in the future
  const currentDateStr = new Date().toISOString().split("T")[0];
  const activeTimeCapsulesCount = timeCapsules.filter(
    (tc) => !tc.isOpened && tc.unlockDate > currentDateStr
  ).length;

  // Dynamic Daily Summary logic
  let dailySummary = "Welcome to SideQuest. Your day is yours to define.";
  if (totalSleepDebt > 5) {
    dailySummary = "You're sleep deprived. It might be a good day to take it easy.";
  } else if (activeTimeCapsulesCount > 0) {
    dailySummary = "Your future self has messages waiting for you in the time capsule.";
  } else if (decisionsMadeCount > 5) {
    dailySummary = "Today seems unusually responsible. You've made a lot of decisions.";
  } else if (totalMemoriesCount > 0) {
    dailySummary = "You've captured some beautiful memories. Keep writing your story.";
  }

  // Get current date string
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // Dynamic Time Greeting
  const hour = new Date().getHours();
  let timeGreeting = "Evening";
  if (hour < 5) timeGreeting = "Up late";
  else if (hour < 12) timeGreeting = "Morning";
  else if (hour < 18) timeGreeting = "Hey";

  const greetingName = passport?.name || "Captain";

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mb-1">
            <Calendar className="w-4 h-4" />
            <span>{todayFormatted}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {timeGreeting}, {greetingName}
          </h1>
        </div>
      </div>

      {/* Daily Summary Card */}
      <div className="p-6 bg-card border border-border rounded-2xl relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
          Daily Summary
        </h2>
        <p className="text-lg md:text-xl font-medium text-foreground tracking-tight leading-relaxed max-w-2xl">
          "{dailySummary}"
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/memory-map" className="block focus:outline-none">
          <StatCard
            title="Total Memories"
            value={totalMemoriesCount}
            description="Captured moments"
            icon={<ImageIcon className="w-5 h-5 text-indigo-500" />}
            onClick={() => {}}
          />
        </Link>

        <Link href="/sleep-debt" className="block focus:outline-none">
          <StatCard
            title="Sleep Debt"
            value={`${totalSleepDebt.toFixed(1)} hrs`}
            description="Accumulated (7-day window)"
            icon={<Moon className="w-5 h-5 text-blue-500" />}
            onClick={() => {}}
          />
        </Link>

        <Link href="/decision-dice" className="block focus:outline-none">
          <StatCard
            title="Decisions Made"
            value={decisionsMadeCount}
            description="Dice rolls recorded"
            icon={<Dices className="w-5 h-5 text-amber-500" />}
            onClick={() => {}}
          />
        </Link>

        <Link href="/time-capsule" className="block focus:outline-none">
          <StatCard
            title="Active Capsules"
            value={activeTimeCapsulesCount}
            description="Locked letters to your future self"
            icon={<Hourglass className="w-5 h-5 text-purple-500" />}
            onClick={() => {}}
          />
        </Link>
      </div>

      {/* Quick Access List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Quests
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              href: "/decision-dice",
              title: "Roll the Dice",
              desc: "Let entropy decide your next meal or activity.",
              color: "border-amber-500/20 hover:border-amber-500/40 bg-amber-500/5",
            },
            {
              href: "/memory-map",
              title: "Add a Memory",
              desc: "Snap a quick memory or snapshot of today.",
              color: "border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/5",
            },
            {
              href: "/time-capsule",
              title: "Lock a Message",
              desc: "Write a message for your future self.",
              color: "border-purple-500/20 hover:border-purple-500/40 bg-purple-500/5",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 group ${item.color}`}
            >
              <div>
                <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
