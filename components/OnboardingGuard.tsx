"use client";

import React, { useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LifePassport } from "@/types";
import { LandingPage } from "@/components/LandingPage";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const [passport, setPassport] = useLocalStorage<LifePassport | null>("life_passport", null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  if (!passport) {
    return <LandingPage onComplete={setPassport} />;
  }

  return <>{children}</>;
}
