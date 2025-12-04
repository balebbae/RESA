"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchWithAuth } from "@/lib/auth";
import { getApiBase } from "@/lib/api";
import type { Schedule, ScheduledShift } from "@/types/schedule";

export interface UseScheduleReturn {
  schedule: Schedule | null;
  shifts: ScheduledShift[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addOptimisticShift: (shift: ScheduledShift) => void;
  removeOptimisticShift: (tempId: string | number) => void;
  confirmOptimisticShift: (tempId: string | number, realShift: ScheduledShift) => void;
  updateOptimisticShift: (shiftId: string | number, updatedShift: ScheduledShift) => void;
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
  const [optimisticShifts, setOptimisticShifts] = useState<ScheduledShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Merge confirmed shifts with optimistic shifts
  const allShifts = useMemo(() => {
    return [...shifts, ...optimisticShifts];
  }, [shifts, optimisticShifts]);

  const fetchScheduleData = async () => {
    if (!restaurantId || !weekStartDate) {
      setLoading(false);
      return;
    }

    try {
      // Only show loading spinner on initial mount (when there's no data yet)
      // Don't show loading on refetch (when we already have data)
      if (shifts.length === 0 && !schedule) {
        setLoading(true);
      }
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
      const schedules: Schedule[] = Array.isArray(schedulesData)
        ? schedulesData
        : (schedulesData.data || []);

      // Find schedule that matches this week
      // Normalize dates to YYYY-MM-DD format for comparison (backend returns ISO 8601 with timestamps)
      const matchingSchedule = schedules.find(
        (s) => s.start_date.split('T')[0] === weekStartDate && s.end_date.split('T')[0] === weekEndDate
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
        setShifts(Array.isArray(shiftsData) ? shiftsData : (shiftsData.data || []));

        // Auto-populate shifts from shift templates (creates shifts with role pre-filled, employee null)
        try {
          const autoPopulateResponse = await fetchWithAuth(
            `${getApiBase()}/restaurants/${restaurantId}/schedules/${
              matchingSchedule.id
            }/auto-populate`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            }
          );

          if (autoPopulateResponse.ok) {
            const autoPopulateData = await autoPopulateResponse.json();
            console.log(
              `Auto-populated ${autoPopulateData.created_count || 0} shifts from templates`
            );

            // Refetch shifts to include newly created template shifts
            if (autoPopulateData.created_count > 0) {
              const updatedShiftsResponse = await fetchWithAuth(
                `${getApiBase()}/restaurants/${restaurantId}/schedules/${
                  matchingSchedule.id
                }/shifts`,
                {
                  method: "GET",
                  headers: { "Content-Type": "application/json" },
                }
              );

              if (updatedShiftsResponse.ok) {
                const updatedShiftsData = await updatedShiftsResponse.json();
                setShifts(
                  Array.isArray(updatedShiftsData)
                    ? updatedShiftsData
                    : updatedShiftsData.data || []
                );
              }
            }
          } else {
            // Log but don't fail - auto-populate is a nice-to-have feature
            console.warn("Auto-populate failed, continuing without it");
          }
        } catch (autoPopulateErr) {
          // Log but don't fail - auto-populate is a nice-to-have feature
          console.warn("Error auto-populating shifts:", autoPopulateErr);
        }
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

  // Clean up orphaned optimistic shifts after a timeout
  useEffect(() => {
    if (optimisticShifts.length === 0) return;

    // Clean up optimistic shifts older than 10 seconds (likely orphaned)
    const timeout = setTimeout(() => {
      const now = Date.now();
      setOptimisticShifts((prev) =>
        prev.filter((shift) => {
          // Extract timestamp from temp ID: "temp-1704067890-0.456"
          if (typeof shift.id === 'string' && shift.id.startsWith('temp-')) {
            const timestamp = parseInt(shift.id.split('-')[1]);
            const age = now - timestamp;
            if (age > 10000) { // 10 seconds
              console.warn('Removing orphaned optimistic shift:', shift);
              return false;
            }
          }
          return true;
        })
      );
    }, 10000); // Check every 10 seconds

    return () => clearTimeout(timeout);
  }, [optimisticShifts.length]);

  // Optimistic shift management methods
  const addOptimisticShift = (shift: ScheduledShift) => {
    setOptimisticShifts((prev) => [...prev, shift]);
  };

  const removeOptimisticShift = (tempId: string | number) => {
    // Remove from optimistic shifts first
    setOptimisticShifts((prev) =>
      prev.filter((s) => s.id !== tempId)
    );

    // Also remove from confirmed shifts (for unassignment of real shifts)
    setShifts((prev) =>
      prev.filter((s) => s.id !== tempId)
    );
  };

  const confirmOptimisticShift = (tempId: string | number, realShift: ScheduledShift) => {
    // Remove optimistic shift and add real shift to confirmed shifts
    setOptimisticShifts((prev) => prev.filter((s) => s.id !== tempId));
    setShifts((prev) => [...prev, realShift]);
  };

  const updateOptimisticShift = (shiftId: string | number, updatedShift: ScheduledShift) => {
    // Normalize date format in case backend sent ISO 8601 timestamp
    const normalizedShift = {
      ...updatedShift,
      shift_date: updatedShift.shift_date?.split('T')[0] || updatedShift.shift_date,
    };

    // Validate shift has required fields
    if (!normalizedShift.start_time || !normalizedShift.shift_date) {
      console.error('Shift validation failed - missing required fields:', {
        shiftId,
        start_time: normalizedShift.start_time,
        shift_date: normalizedShift.shift_date,
        employee_id: normalizedShift.employee_id,
        fullShift: normalizedShift
      });
      return; // Don't update state with incomplete data
    }

    console.log('Updating shift in state:', {
      shiftId,
      employee_id: normalizedShift.employee_id,
      shift_date: normalizedShift.shift_date,
    });

    // Update in confirmed shifts
    setShifts((prev) =>
      prev.map((s) => (s.id === shiftId ? normalizedShift : s))
    );

    // Update in optimistic shifts
    setOptimisticShifts((prev) =>
      prev.map((s) => (s.id === shiftId ? normalizedShift : s))
    );
  };

  return {
    schedule,
    shifts: allShifts, // Return merged shifts (confirmed + optimistic)
    loading,
    error,
    refetch: fetchScheduleData,
    addOptimisticShift,
    removeOptimisticShift,
    confirmOptimisticShift,
    updateOptimisticShift,
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
