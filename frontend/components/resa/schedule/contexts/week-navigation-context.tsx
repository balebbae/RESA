"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { getCurrentWeekStart, navigateWeek } from "../hooks/use-schedule";

interface WeekNavigationContextType {
  currentWeek: string; // YYYY-MM-DD format (Sunday)
  goToNextWeek: () => void;
  goToPrevWeek: () => void;
  setWeek: (date: string) => void;
}

const WeekNavigationContext = createContext<WeekNavigationContextType | undefined>(undefined);

interface WeekNavigationProviderProps {
  children: ReactNode;
}

export function WeekNavigationProvider({ children }: WeekNavigationProviderProps) {
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekStart());

  const goToNextWeek = () => {
    setCurrentWeek((prev) => navigateWeek(prev, "next"));
  };

  const goToPrevWeek = () => {
    setCurrentWeek((prev) => navigateWeek(prev, "prev"));
  };

  const setWeek = (date: string) => {
    setCurrentWeek(date);
  };

  const value: WeekNavigationContextType = {
    currentWeek,
    goToNextWeek,
    goToPrevWeek,
    setWeek,
  };

  return (
    <WeekNavigationContext.Provider value={value}>
      {children}
    </WeekNavigationContext.Provider>
  );
}

/**
 * Hook to access week navigation context
 * Returns undefined if not within a WeekNavigationProvider
 */
export function useWeekNavigation() {
  return useContext(WeekNavigationContext);
}

/**
 * Format week range for display
 */
export function formatWeekRange(weekStartDate: string): string {
  const startDate = new Date(weekStartDate + "T00:00:00");
  const endDate = new Date(weekStartDate + "T00:00:00");
  endDate.setDate(endDate.getDate() + 6);

  const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
  const startDay = startDate.getDate();
  const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });
  const endDay = endDate.getDate();
  const year = endDate.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}
