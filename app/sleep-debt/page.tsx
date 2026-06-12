"use client";

import React, { useState } from "react";
import { Plus, Moon, HelpCircle, Trash2, BatteryCharging, AlertCircle, Calendar, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { PrimaryButton } from "@/components/PrimaryButton";
import { formatDate } from "@/lib/utils";
import { SleepRecord } from "@/types";

export default function SleepDebt() {
  const [sleepRecords, setSleepRecords] = useLocalStorage<SleepRecord[]>("sleep_records", []);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [date, setDate] = useState("");

  React.useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
  }, []);
  const [hoursNeeded, setHoursNeeded] = useState(8);
  const [hoursSlept, setHoursSlept] = useState(7);
  const [error, setError] = useState("");

  const handleSaveSleep = (e: React.FormEvent) => {
    e.preventDefault();
    if (hoursNeeded <= 0 || hoursNeeded > 24) {
      setError("Hours needed must be between 1 and 24.");
      return;
    }
    if (hoursSlept < 0 || hoursSlept > 24) {
      setError("Hours slept must be between 0 and 24.");
      return;
    }
    setError("");

    // Check if entry already exists for this date, if so prompt or replace
    const existingIndex = sleepRecords.findIndex((r) => r.date === date);
    const newRecord: SleepRecord = {
      id: Math.random().toString(36).substring(2, 9),
      date,
      hoursNeeded,
      hoursSlept,
    };

    if (existingIndex > -1) {
      const updated = [...sleepRecords];
      updated[existingIndex] = newRecord;
      setSleepRecords(updated);
    } else {
      // Keep sorted by date
      const updated = [...sleepRecords, newRecord].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setSleepRecords(updated);
    }

    setIsModalOpen(false);
    // Reset date to today for next log
    setDate(new Date().toISOString().split("T")[0]);
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm("Delete this sleep log?")) {
      setSleepRecords(sleepRecords.filter((r) => r.id !== id));
    }
  };

  // Calculations
  const last7Records = sleepRecords.slice(-7);

  const totalDebt = last7Records.reduce((acc, curr) => {
    const diff = curr.hoursNeeded - curr.hoursSlept;
    return acc + (diff > 0 ? diff : 0);
  }, 0);

  const avgSlept =
    last7Records.length > 0
      ? last7Records.reduce((acc, curr) => acc + curr.hoursSlept, 0) / last7Records.length
      : 0;

  const avgNeeded =
    last7Records.length > 0
      ? last7Records.reduce((acc, curr) => acc + curr.hoursNeeded, 0) / last7Records.length
      : 8;

  // Personality Badge Calculation
  const avgDebtPerNight = last7Records.length > 0 ? totalDebt / last7Records.length : 0;

  let badgeTitle = "Sleep Curious";
  let badgeDesc = "Log sleep for 7 days to discover your sleep archetype.";
  let badgeColor = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

  if (sleepRecords.length > 0) {
    if (avgDebtPerNight <= 0.5) {
      badgeTitle = "Functional Human";
      badgeDesc = "You sleep well and operate at peak biological efficiency. Keep it up!";
      badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    } else if (avgDebtPerNight <= 2.0) {
      badgeTitle = "Caffeine Powered";
      badgeDesc = "Your energy levels are fueled by double-espressos. Try taking regular rests.";
      badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    } else {
      badgeTitle = "Medical Miracle";
      badgeDesc = "You are currently surviving on pure adrenaline and willpower. Seek sheets immediately.";
      badgeColor = "bg-red-500/10 text-red-400 border-red-500/20";
    }
  }

  const sleepScore = last7Records.length > 0 
    ? Math.round((last7Records.reduce((acc, curr) => acc + Math.min(curr.hoursSlept / curr.hoursNeeded, 1), 0) / last7Records.length) * 100)
    : 0;

  // Chart data preparation
  const chartData = last7Records.map(r => ({
    name: new Date(r.date).toLocaleDateString("en-US", { weekday: "short" }),
    slept: r.hoursSlept,
    needed: r.hoursNeeded,
    isDeficit: r.hoursSlept < r.hoursNeeded
  }));

  return (
    <div className="space-y-8 max-w-4xl">
      <SectionHeader
        title="Sleep Debt Tracker"
        description="Monitor how much sleep you owe your body to maintain peak focus."
        action={
          <PrimaryButton onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Log Sleep
          </PrimaryButton>
        }
      />

      {sleepRecords.length === 0 ? (
        <EmptyState
          icon={<Moon className="w-8 h-8 text-blue-500" />}
          title="No sleep data yet"
          description="Sleep debt accumulates when you get less sleep than your body requires. Log your first sleep session."
          action={
            <PrimaryButton onClick={() => setIsModalOpen(true)}>
              Log First Sleep
            </PrimaryButton>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Key metrics grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-card border border-border rounded-xl">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Accumulated Sleep Debt
              </h3>
              <p className="text-3xl font-bold text-foreground">
                {totalDebt.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">hours</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Total hours missed over your last {last7Records.length} logs.
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-xl">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Sleep Score
              </h3>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-black text-foreground">
                  {sleepScore}
                </p>
                <span className="text-sm font-medium text-muted-foreground mb-1">/ 100</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                Based on your last 7 days target vs actual.
              </p>
            </div>

            <div className={`p-6 border rounded-xl flex flex-col justify-between ${badgeColor}`}>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-xs uppercase tracking-wider font-semibold">
                    Sleep Archetype
                  </h3>
                  <BatteryCharging className="w-4 h-4" />
                </div>
                <h4 className="text-lg font-bold">{badgeTitle}</h4>
              </div>
              <p className="text-xs mt-3 opacity-90 leading-relaxed">{badgeDesc}</p>
            </div>
          </div>

          {/* SVG Sleep Chart */}
          <div className="p-6 bg-card border border-border rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-semibold text-foreground">Sleep Chart (Last 7 Logs)</h3>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-xs" />
                  Slept
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  Deficit
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0 border-t-2 border-dashed border-zinc-500" />
                  Target
                </span>
              </div>
            </div>
            
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888888' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888888' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <ReferenceLine y={avgNeeded} stroke="#71717a" strokeDasharray="3 3" />
                  <Bar dataKey="slept" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isDeficit ? '#ef4444' : '#3b82f6'} fillOpacity={entry.isDeficit ? 0.8 : 1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History log list */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Sleep Logs
            </h3>
            <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
              {sleepRecords
                .slice()
                .reverse()
                .map((record) => {
                  const debt = record.hoursNeeded - record.hoursSlept;
                  const isDebted = debt > 0;
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                          <Calendar className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {formatDate(record.date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Slept {record.hoursSlept} hrs / Needed {record.hoursNeeded} hrs
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${
                              isDebted
                                ? "bg-red-500/10 text-red-400"
                                : "bg-green-500/10 text-green-400"
                            }`}
                          >
                            {isDebted ? `+${debt.toFixed(1)} hrs Debt` : "No Debt"}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Log Sleep Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setError("");
        }}
        title="Log Sleep"
      >
        <form onSubmit={handleSaveSleep} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hours Needed
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="24"
                value={hoursNeeded}
                onChange={(e) => setHoursNeeded(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hours Slept
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={hoursSlept}
                onChange={(e) => setHoursSlept(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2 border-t border-border mt-6">
            <PrimaryButton
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setError("");
              }}
            >
              Cancel
            </PrimaryButton>
            <PrimaryButton type="submit">
              Save Log
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
