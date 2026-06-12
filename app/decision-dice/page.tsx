"use client";

import React, { useState } from "react";
import { Plus, X, Dices, RotateCcw, Clock, Trash2, Sparkles, MessageCircle } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SectionHeader } from "@/components/SectionHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/utils";
import { Decision } from "@/types";

const DEFAULT_OPTIONS = ["Pizza", "Burger", "Shawarma"];

const COMMENTARIES = [
  "Entropy has spoken. Do not disobey the dice.",
  "An absolute classic. Your tastebuds or mind will thank you.",
  "No regrets. This is the timeline you chose.",
  "A solid, robust choice. Boldly move forward.",
  "The universe aligns perfectly with this decision.",
  "A delicious wrap of happiness. Great pick!",
  "A brave choice. Let destiny guide you.",
  "The dice approve. Execute without hesitation.",
];

export default function DecisionDice() {
  const [decisions, setDecisions] = useLocalStorage<Decision[]>("decisions", []);
  const [options, setOptions] = useState<string[]>(DEFAULT_OPTIONS);
  const [newOption, setNewOption] = useState("");

  // Animation states
  const [isRolling, setIsRolling] = useState(false);
  const [rolledIndex, setRolledIndex] = useState<number | null>(null);
  const [finalDecision, setFinalDecision] = useState<Decision | null>(null);

  const handleAddOption = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newOption.trim()) return;
    if (options.includes(newOption.trim())) return;
    setOptions([...options, newOption.trim()]);
    setNewOption("");
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleRollDice = () => {
    if (options.length < 2) return;

    setIsRolling(true);
    setFinalDecision(null);
    setRolledIndex(null);

    let counter = 0;
    const rollsCount = 15;
    const intervalTime = 80; // ms

    const interval = setInterval(() => {
      setRolledIndex(Math.floor(Math.random() * options.length));
      counter++;

      if (counter >= rollsCount) {
        clearInterval(interval);

        // Calculate final selection
        const finalIdx = Math.floor(Math.random() * options.length);
        const selected = options[finalIdx];
        
        // Pick commentary
        let commentary = COMMENTARIES[Math.floor(Math.random() * COMMENTARIES.length)];
        if (selected.toLowerCase() === "pizza") {
          commentary = "An absolute classic. Your tastebuds will thank you.";
        } else if (selected.toLowerCase() === "burger") {
          commentary = "A solid, robust choice. Go get that protein.";
        } else if (selected.toLowerCase() === "shawarma") {
          commentary = "A delicious wrap of happiness. Great pick!";
        }

        const decisionRecord: Decision = {
          id: Math.random().toString(36).substring(2, 9),
          options: [...options],
          selectedOption: selected,
          commentary,
          date: new Date().toISOString(),
        };

        setRolledIndex(finalIdx);
        setFinalDecision(decisionRecord);
        setDecisions([decisionRecord, ...decisions]);
        setIsRolling(false);
      }
    }, intervalTime);
  };

  const handleResetOptions = () => {
    setOptions(DEFAULT_OPTIONS);
    setFinalDecision(null);
    setRolledIndex(null);
  };

  const handleClearHistory = () => {
    if (confirm("Clear all decision history?")) {
      setDecisions([]);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <SectionHeader
        title="Decision Dice"
        description="Outsource trivial choices to entropy and escape the paralysis of analysis."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dice control board */}
        <div className="p-6 bg-card border border-border rounded-xl space-y-6">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Setup Options
          </h3>

          {/* Add Option Form */}
          <form onSubmit={handleAddOption} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Sushi, Movie, Workout"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              disabled={isRolling}
              className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <PrimaryButton type="submit" disabled={isRolling || !newOption.trim()}>
              <Plus className="w-4 h-4" />
            </PrimaryButton>
          </form>

          {/* Options Display */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">
              Options Pool
            </label>
            {options.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No options added yet. Add at least two.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {options.map((opt, idx) => {
                  const isHighlighted = rolledIndex === idx;
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                        isHighlighted
                          ? "bg-primary text-primary-foreground border-primary scale-105"
                          : "bg-muted text-foreground border-border"
                      }`}
                    >
                      {opt}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        disabled={isRolling}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <PrimaryButton
              onClick={handleRollDice}
              disabled={options.length < 2 || isRolling}
              className="flex-1"
            >
              <Dices className="w-4 h-4 mr-2" />
              {isRolling ? "Rolling..." : "Roll Decision"}
            </PrimaryButton>
            <PrimaryButton
              variant="secondary"
              onClick={handleResetOptions}
              disabled={isRolling}
            >
              <RotateCcw className="w-4 h-4" />
            </PrimaryButton>
          </div>
        </div>

        {/* Final Selection Result card */}
        <div className="p-6 bg-card border border-border rounded-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          {isRolling ? (
            <div className="space-y-4 py-8 animate-pulse">
              <Dices className="w-16 h-16 text-amber-500 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground font-medium">Consulting the oracle of dice...</p>
            </div>
          ) : finalDecision ? (
            <div className="space-y-6 py-4 animate-scale-up w-full">
              <div>
                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-2 py-1 rounded uppercase tracking-wider">
                  Oracle Decision
                </span>
                <h2 className="text-3xl font-bold text-foreground mt-4 tracking-tight">
                  {finalDecision.selectedOption}
                </h2>
              </div>

              <div className="p-4 bg-muted/40 border border-border rounded-lg max-w-sm mx-auto flex items-start gap-3 text-left">
                <MessageCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  &quot;{finalDecision.commentary}&quot;
                </p>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Saved to quest log.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-8 text-muted-foreground">
              <Dices className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm">Ready to roll.</p>
              <p className="text-xs max-w-[240px]">
                Add at least two options and hit &quot;Roll Decision&quot; to let destiny decide.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Decision history lists */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Decision Logs
            </h3>
          </div>
          {decisions.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Logs
            </button>
          )}
        </div>

        {decisions.length === 0 ? (
          <EmptyState
            title="No past decisions logged"
            description="All rolled decisions and commentaries will show up here as a timeline."
          />
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
            {decisions.map((dec) => (
              <div key={dec.id} className="p-4 hover:bg-muted/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{dec.selectedOption}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      from {dec.options.join(", ")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    &quot;{dec.commentary}&quot;
                  </p>
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0 font-mono">
                  {formatDate(dec.date)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
