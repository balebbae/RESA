"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth";
import { getApiBase } from "@/lib/api";
import type { Schedule, ScheduledShift } from "../types/schedule";

export interface UseScheduleReturn {
  schedule: Schedule | null;
  shifts: ScheduledShift[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch schedule and shifts for a given week
 * @param restaurantId - The restaurant ID
 * @param weekStartDate - The start of the week (Sunday) in YYYY-MM-DD format
 */
export function useSchedule(
  restaurantId: number | null,
  weekStartDate: string
): UseScheduleReturn {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [shifts, setShifts] = useState<ScheduledShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScheduleData = async () => {
    if (!restaurantId || !weekStartDate) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calculate week end date (6 days after start, Saturday)
      const weekEndDate = getWeekEndDate(weekStartDate);

      // Fetch schedules for this restaurant
      const schedulesResponse = await fetchWithAuth(
        `${getApiBase()}/restaurants/${restaurantId}/schedules`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!schedulesResponse.ok) {
        throw new Error("Failed to fetch schedules");
      }

      const schedulesData = await schedulesResponse.json();
      const schedules: Schedule[] = schedulesData || [];

      // Find schedule that matches this week
      const matchingSchedule = schedules.find(
        (s) => s.start_date === weekStartDate && s.end_date === weekEndDate
      );

      if (matchingSchedule) {
        setSchedule(matchingSchedule);

        // Fetch shifts for this schedule
        const shiftsResponse = await fetchWithAuth(
          `${getApiBase()}/restaurants/${restaurantId}/schedules/${
            matchingSchedule.id
          }/shifts`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!shiftsResponse.ok) {
          throw new Error("Failed to fetch shifts");
        }

        const shiftsData = await shiftsResponse.json();
        setShifts(shiftsData || []);
      } else {
        // No schedule exists for this week yet
        setSchedule(null);
        setShifts([]);
      }
    } catch (err) {
      console.error("Error fetching schedule data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setSchedule(null);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  }, [restaurantId, weekStartDate]);

  return {
    schedule,
    shifts,
    loading,
    error,
    refetch: fetchScheduleData,
  };
}

/**
 * Get the end date of a week (Saturday) given the start date (Sunday)
 */
function getWeekEndDate(startDate: string): string {
  const date = new Date(startDate + "T00:00:00");
  date.setDate(date.getDate() + 6);
  return formatDate(date);
}

/**
 * Format a Date object as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get the Sunday of the current week
 */
export function getCurrentWeekStart(): string {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  return formatDate(sunday);
}

/**
 * Navigate to previous or next week
 */
export function navigateWeek(currentWeekStart: string, direction: "prev" | "next"): string {
  const date = new Date(currentWeekStart + "T00:00:00");
  const offset = direction === "next" ? 7 : -7;
  date.setDate(date.getDate() + offset);
  return formatDate(date);
}
