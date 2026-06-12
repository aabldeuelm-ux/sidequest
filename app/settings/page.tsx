"use client";

import React, { useEffect, useState } from "react";
import { Download, Upload, Trash2, Sun, Moon, Sparkles, ShieldAlert, Check } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { PrimaryButton } from "@/components/PrimaryButton";

export default function Settings() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [importStatus, setImportStatus] = useState("");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const currentTheme = localStorage.getItem("theme") || "dark";
      setTheme(currentTheme);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleToggleTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        memories: JSON.parse(localStorage.getItem("memories") || "[]"),
        sleep_records: JSON.parse(localStorage.getItem("sleep_records") || "[]"),
        grass_stats: JSON.parse(localStorage.getItem("grass_stats") || "{}"),
        decisions: JSON.parse(localStorage.getItem("decisions") || "[]"),
        time_capsules: JSON.parse(localStorage.getItem("time_capsules") || "[]"),
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute(
        "download",
        `sidequest_backup_${new Date().toISOString().split("T")[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      alert("Failed to export backup data.");
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus("Importing...");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Validation check
        if (
          parsed &&
          (parsed.memories !== undefined ||
            parsed.sleep_records !== undefined ||
            parsed.grass_stats !== undefined ||
            parsed.decisions !== undefined ||
            parsed.time_capsules !== undefined)
        ) {
          if (parsed.memories) localStorage.setItem("memories", JSON.stringify(parsed.memories));
          if (parsed.sleep_records) localStorage.setItem("sleep_records", JSON.stringify(parsed.sleep_records));
          if (parsed.grass_stats) localStorage.setItem("grass_stats", JSON.stringify(parsed.grass_stats));
          if (parsed.decisions) localStorage.setItem("decisions", JSON.stringify(parsed.decisions));
          if (parsed.time_capsules) localStorage.setItem("time_capsules", JSON.stringify(parsed.time_capsules));
          
          setImportStatus("Success");
          setTimeout(() => {
            alert("Backup imported successfully! Reloading view...");
            window.location.reload();
          }, 500);
        } else {
          throw new Error("Invalid structure");
        }
      } catch (err) {
        setImportStatus("Failed");
        alert("Could not import data. Please check if file is a valid SideQuest backup JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    const confirm1 = confirm("WARNING: This will permanently erase all your memories, habits, and saved items. Are you absolutely sure?");
    if (confirm1) {
      const confirm2 = confirm("Final confirmation: Type 'OK' or click confirm to execute full database reset. This cannot be undone.");
      if (confirm2) {
        localStorage.clear();
        alert("SideQuest has been reset to defaults. Reloading page...");
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <SectionHeader
        title="Settings"
        description="Configure your dashboard theme preferences, backup exports, and system settings."
      />

      <div className="space-y-6">
        {/* Theme select section */}
        <div className="p-6 bg-card border border-border rounded-xl space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Aesthetic Mode</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Toggle between dark and light UI surfaces.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleToggleTheme("dark")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                theme === "dark"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="w-4 h-4" />
              Dark Theme (Default)
            </button>

            <button
              onClick={() => handleToggleTheme("light")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                theme === "light"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="w-4 h-4" />
              Light Theme
            </button>
          </div>
        </div>

        {/* Data Backup section */}
        <div className="p-6 bg-card border border-border rounded-xl space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Backup & Migration</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Export all stored entries as a JSON file, or restore from an existing backup.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <PrimaryButton onClick={handleExportData} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export Backup JSON
            </PrimaryButton>

            <div className="flex-1 relative">
              <label className="flex items-center justify-center w-full px-4 py-2.5 bg-secondary text-secondary-foreground hover:bg-opacity-80 border border-border rounded-lg text-sm font-medium transition-all cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {importStatus || "Import Backup JSON"}
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Danger zone reset */}
        <div className="p-6 bg-card border border-red-500/20 rounded-xl space-y-4 bg-red-500/[0.02]">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-500">Danger Zone</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Wipe all items stored locally in your browser. This action is immediate and cannot be recovered.
              </p>
            </div>
          </div>

          <PrimaryButton variant="danger" onClick={handleClearAllData} className="w-full">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Local Data
          </PrimaryButton>
        </div>

        {/* About section */}
        <div className="p-6 border border-border bg-card rounded-xl text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-lg mx-auto">
            S
          </div>
          <h4 className="text-sm font-bold text-foreground">SideQuest Dashboard</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            A minimalist personal operating system combining habit streaking, sleep monitoring, memory grids, and decision randomness to manage your daily life.
          </p>
          <div className="text-[10px] text-muted-foreground/50 font-mono mt-4">
            Version 1.0.0 • No External Database API Needed
          </div>
        </div>
      </div>
    </div>
  );
}
