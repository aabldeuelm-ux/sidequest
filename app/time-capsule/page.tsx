"use client";

import React, { useState, useEffect } from "react";
import { Plus, Hourglass, Lock, Unlock, Mail, Trash2, Calendar, AlertCircle, Eye } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { PrimaryButton } from "@/components/PrimaryButton";
import { formatDate } from "@/lib/utils";
import { TimeCapsule } from "@/types";

export default function TimeCapsulePage() {
  const [capsules, setCapsules] = useLocalStorage<TimeCapsule[]>("time_capsules", []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Capsule compose states
  const [message, setMessage] = useState("");
  const [unlockDate, setUnlockDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [error, setError] = useState("");

  // Letter inspect states
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsule | null>(null);

  // Time calculations helper
  const [currentDateStr, setCurrentDateStr] = useState("");

  useEffect(() => {
    setCurrentDateStr(new Date().toISOString().split("T")[0]);
    // Set up timer to refresh date if open overnight, though split is fine
  }, []);

  const handleSaveCapsule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please write a message for your capsule.");
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(unlockDate);
    selected.setHours(0, 0, 0, 0);

    if (selected.getTime() <= today.getTime()) {
      setError("Unlock date must be in the future (tomorrow or later).");
      return;
    }
    setError("");

    const newCapsule: TimeCapsule = {
      id: Math.random().toString(36).substring(2, 9),
      message: message.trim(),
      unlockDate,
      createdAt: new Date().toISOString().split("T")[0],
      isOpened: false,
    };

    setCapsules([newCapsule, ...capsules]);
    setMessage("");
    // Reset date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setUnlockDate(tomorrow.toISOString().split("T")[0]);
    setIsModalOpen(false);
  };

  const handleDeleteCapsule = (id: string) => {
    if (confirm("Are you sure you want to delete this capsule? It will be lost forever.")) {
      setCapsules(capsules.filter((c) => c.id !== id));
      if (selectedCapsule?.id === id) {
        setSelectedCapsule(null);
      }
    }
  };

  const handleOpenCapsule = (capsule: TimeCapsule) => {
    if (capsule.unlockDate > currentDateStr) {
      // Still locked
      alert(`This time capsule is sealed until ${formatDate(capsule.unlockDate)}. Double access denied.`);
      return;
    }

    // Unlocked! Let's update state to marked as opened
    setSelectedCapsule(capsule);
    const updated = capsules.map((c) => (c.id === capsule.id ? { ...c, isOpened: true } : c));
    setCapsules(updated);
  };

  // Filter lists
  const lockedCapsules = capsules.filter((c) => c.unlockDate > currentDateStr);
  const unlockedCapsules = capsules.filter((c) => c.unlockDate <= currentDateStr);

  const getDaysRemainingText = (unlockDateStr: string) => {
    const diffTime = new Date(unlockDateStr).getTime() - new Date(currentDateStr).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "Unlocks tomorrow";
    return `Unlocks in ${diffDays} days`;
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <SectionHeader
        title="Time Capsule"
        description="Write letters to your future self, locked securely until your chosen release date."
        action={
          <PrimaryButton onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Write Letter
          </PrimaryButton>
        }
      />

      {capsules.length === 0 ? (
        <EmptyState
          icon={<Hourglass className="w-8 h-8 text-purple-500" />}
          title="No time capsules found"
          description="Send encouragement, predictions, or secrets to your future self. Click below to write your first letter."
          action={
            <PrimaryButton onClick={() => setIsModalOpen(true)}>
              Write First Letter
            </PrimaryButton>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Locked Capsules Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              Locked Capsules ({lockedCapsules.length})
            </h3>

            {lockedCapsules.length === 0 ? (
              <p className="text-xs text-muted-foreground italic pl-1">No locked capsules. Send a message to the future!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lockedCapsules.map((cap) => (
                  <div
                    key={cap.id}
                    className="p-5 bg-card border border-border rounded-xl shadow-sm hover:border-neutral-500 transition-all duration-300 relative group flex justify-between items-start"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                          Sealed
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {formatDate(cap.createdAt)}
                        </p>
                        <p className="text-xs font-semibold text-foreground mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Release: {formatDate(cap.unlockDate)}</span>
                        </p>
                      </div>
                      <p className="text-xs text-amber-500 font-medium font-mono mt-2">
                        {getDaysRemainingText(cap.unlockDate)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteCapsule(cap.id)}
                      className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-red-500 hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unlocked Capsules Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Unlock className="w-4 h-4" />
              Unlocked Capsules ({unlockedCapsules.length})
            </h3>

            {unlockedCapsules.length === 0 ? (
              <p className="text-xs text-muted-foreground italic pl-1">No capsules ready to unlock yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {unlockedCapsules.map((cap) => (
                  <div
                    key={cap.id}
                    className="p-5 bg-card border border-border rounded-xl shadow-sm hover:border-neutral-500 transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Unlock className="w-4 h-4 text-emerald-500" />
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              cap.isOpened
                                ? "bg-zinc-500/10 text-zinc-400"
                                : "bg-emerald-500/10 text-emerald-400 animate-pulse"
                            }`}
                          >
                            {cap.isOpened ? "Opened" : "Unread"}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteCapsule(cap.id)}
                          className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-red-500 hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Locked on: {formatDate(cap.createdAt)} • Unlocked on: {formatDate(cap.unlockDate)}
                      </p>
                    </div>

                    <PrimaryButton
                      onClick={() => handleOpenCapsule(cap)}
                      variant={cap.isOpened ? "secondary" : "primary"}
                      className="mt-4 w-full"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Read Letter
                    </PrimaryButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose Letter Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setError("");
          setMessage("");
        }}
        title="Write Letter to the Future"
      >
        <form onSubmit={handleSaveCapsule} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Unlock Date
            </label>
            <input
              type="date"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-[10px] text-muted-foreground">
              Select when you want this capsule to become viewable. Must be tomorrow or later.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Message to your future self
            </label>
            <textarea
              maxLength={600}
              rows={6}
              placeholder="Predictions, thoughts, current concerns, goals... What should your future self know?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed"
            />
            <div className="text-right text-[10px] text-muted-foreground font-mono">
              {message.length}/600 chars
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
                setMessage("");
              }}
            >
              Cancel
            </PrimaryButton>
            <PrimaryButton type="submit">
              Seal Capsule
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Inspect Letter Modal */}
      <Modal
        isOpen={!!selectedCapsule}
        onClose={() => setSelectedCapsule(null)}
        title={`Capsule Unlocked - ${selectedCapsule ? formatDate(selectedCapsule.unlockDate) : ""}`}
      >
        {selectedCapsule && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 border border-border rounded-xl leading-relaxed text-sm text-foreground whitespace-pre-wrap max-h-[40vh] overflow-y-auto">
              {selectedCapsule.message}
            </div>

            <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
              <p>Locked on: {formatDate(selectedCapsule.createdAt)}</p>
              <p>Opened on: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>

            <div className="flex justify-end pt-2">
              <PrimaryButton onClick={() => setSelectedCapsule(null)}>
                Done Reading
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
