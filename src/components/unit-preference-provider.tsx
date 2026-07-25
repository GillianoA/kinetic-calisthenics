"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { UnitPreference } from "@/lib/units";

const UnitPreferenceContext = createContext<UnitPreference>("metric");

export function UnitPreferenceProvider({
  preference,
  children,
}: {
  preference: UnitPreference;
  children: ReactNode;
}) {
  return (
    <UnitPreferenceContext.Provider value={preference}>
      {children}
    </UnitPreferenceContext.Provider>
  );
}

export function useUnitPreference() {
  return useContext(UnitPreferenceContext);
}
