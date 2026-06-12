"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Image as ImageIcon,
  Moon,
  Dices,
  Hourglass,
  Settings,
  User,
  Edit2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LifePassport } from "@/types";
import { Modal } from "@/components/Modal";
import { PrimaryButton } from "@/components/PrimaryButton";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/memory-map", label: "Memory Map", icon: ImageIcon },
  { href: "/sleep-debt", label: "Sleep Debt", icon: Moon },
  { href: "/decision-dice", label: "Decision Dice", icon: Dices },
  { href: "/time-capsule", label: "Time Capsule", icon: Hourglass },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  const [passport, setPassport] = useLocalStorage<LifePassport | null>("life_passport", null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editVibe, setEditVibe] = useState("");

  const handleOpenEdit = () => {
    if (passport) {
      setEditName(passport.name);
      setEditVibe(passport.vibe);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passport && editName.trim()) {
      setPassport({
        ...passport,
        name: editName.trim(),
        vibe: editVibe.trim()
      });
      setIsEditModalOpen(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem("life_passport");
    window.location.reload();
  };

  return (
    <>
      {/* Desktop Navigation Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-card border-r border-border p-6 z-30">
        <div className="flex items-center gap-3 mb-8 px-2">
          {passport ? (
            <div 
              onClick={handleOpenEdit}
              className="flex items-center gap-3 px-2 py-2 -mx-2 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors group w-full relative"
              title="Edit Profile"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-sm font-bold tracking-tight text-foreground truncate">
                  {passport.name}
                </span>
                <span className="text-xs font-medium text-primary truncate">
                  {passport.vibe}
                </span>
              </div>
              <Edit2 className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute right-2" />
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-lg">
                S
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                SideQuest
              </span>
            </>
          )}
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-secondary text-secondary-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-foreground" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4 px-2">
          <p className="text-xs text-muted-foreground font-medium">SideQuest v1.0.0</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Your Life Operating System</p>
        </div>
      </aside>

      {/* Mobile Navigation Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-md border-t border-border flex items-center justify-around px-2 z-40 pb-safe">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-all duration-200",
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5.5 h-5.5 mb-1", isActive ? "text-foreground" : "text-muted-foreground")} />
              <span className="truncate max-w-[64px]">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Life Passport">
        <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
              Name / Alias
            </label>
            <input
              type="text"
              required
              maxLength={30}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
              Current Vibe
            </label>
            <input
              type="text"
              required
              maxLength={30}
              value={editVibe}
              onChange={(e) => setEditVibe(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
            />
          </div>
          <div className="flex justify-between items-center gap-2.5 pt-4 mt-2 border-t border-border">
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-semibold text-red-500 hover:text-red-400 flex items-center gap-1.5 transition-colors px-2 py-2 rounded-md hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
            <div className="flex gap-2.5">
              <PrimaryButton type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </PrimaryButton>
              <PrimaryButton type="submit">
                Save Changes
              </PrimaryButton>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
