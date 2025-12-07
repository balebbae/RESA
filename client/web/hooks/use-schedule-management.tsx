"use client";

import { useState, useCallback } from "react";
import { createSchedule } from "@/lib/api/schedules";
import { createScheduledShift, updateScheduledShift } from "@/lib/api/shifts";
import { calculateWeekEnd, dateToISO8601 } from "@/lib/utils/date-conversion";
import { getApiBase } from "@/lib/api";
import { fetchWithAuth } from "@/lib/auth";
import { normalizeShiftDates } from "@/lib/utils/date-normalization";
import type { Schedule, CreateScheduledShiftPayload, ScheduledShift } from "@/types/schedule";

interface UseScheduleManagementProps {
  restaurantId: number | null;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useScheduleManagement({
  restaurantId,
  onSuccess,
  onError,
}: UseScheduleManagementProps) {
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
  const [isCreatingShift, setIsCreatingShift] = useState(false);
  const [isUnassigningShift, setIsUnassigningShift] = useState(false);

  /**
   * Creates a schedule for the given week
   */
  const createScheduleForWeek = useCallback(
    async (weekStartDate: string): Promise<Schedule> => {
      if (!restaurantId) {
        throw new Error("Restaurant ID is required");
      }

      setIsCreatingSchedule(true);

      try {
        const endDate = calculateWeekEnd(weekStartDate);
        const schedule = await createSchedule(restaurantId, {
          start_date: weekStartDate,
          end_date: endDate,
        });

        return schedule;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        if (onError) onError(err);
        throw err;
      } finally {
        setIsCreatingSchedule(false);
      }
    },
    [restaurantId, onError]
  );

  /**
   * Creates a scheduled shift, checking for existing schedule first to prevent duplicates
   */
  const createShift = useCallback(
    async (
      scheduleId: number | null,
      weekStartDate: string,
      payload: CreateScheduledShiftPayload
    ) => {
      if (!restaurantId) {
        throw new Error("Restaurant ID is required");
      }

      setIsCreatingShift(true);

      try {
        let finalScheduleId = scheduleId;

        // If no scheduleId provided, check database for existing schedule
        if (!finalScheduleId) {
          const weekEndDate = calculateWeekEnd(weekStartDate);

          // Fetch all schedules to find existing one for this week
          const response = await fetchWithAuth(
            `${getApiBase()}/restaurants/${restaurantId}/schedules`
          );

          if (response.ok) {
            const schedulesData = await response.json();
            const schedules = Array.isArray(schedulesData)
              ? schedulesData
              : (schedulesData.data || []);

            // Look for existing schedule for this week
            const existingSchedule = schedules.find((s: Schedule) => {
              // Normalize dates to YYYY-MM-DD format (strip time component if present)
              const scheduleStart = s.start_date.split('T')[0];
              const scheduleEnd = s.end_date.split('T')[0];
              return scheduleStart === weekStartDate && scheduleEnd === weekEndDate;
            });

            if (existingSchedule) {
              // Use existing schedule instead of creating new one
              finalScheduleId = existingSchedule.id;
            } else {
              // Only create new schedule if none exists
              const newSchedule = await createScheduleForWeek(weekStartDate);
              finalScheduleId = newSchedule.id;
            }
          } else {
            // Fallback: create new schedule if fetch fails
            const newSchedule = await createScheduleForWeek(weekStartDate);
            finalScheduleId = newSchedule.id;
          }
        }

        // Validate schedule ID before creating shift
        if (!finalScheduleId || typeof finalScheduleId !== 'number' || isNaN(finalScheduleId)) {
          throw new Error(`Invalid schedule ID: ${finalScheduleId}`);
        }

        // Convert date to ISO 8601 format if it's not already
        const isoPayload = {
          ...payload,
          shift_date: payload.shift_date.includes("T")
            ? payload.shift_date
            : dateToISO8601(payload.shift_date),
        };

        // Create the shift with validated schedule ID
        const shift = await createScheduledShift(
          restaurantId,
          finalScheduleId,
          isoPayload
        );

        if (onSuccess) onSuccess();
        return shift;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        if (onError) onError(err);
        throw err;
      } finally {
        setIsCreatingShift(false);
      }
    },
    [restaurantId, createScheduleForWeek, onSuccess, onError]
  );

  /**
   * Updates a scheduled shift
   */
  const updateShift = useCallback(
    async (
      scheduleId: number,
      shiftId: number,
      payload: Partial<CreateScheduledShiftPayload>
    ) => {
      if (!restaurantId) {
        throw new Error("Restaurant ID is required");
      }

      setIsCreatingShift(true);

      try {
        const shift = await updateScheduledShift(
          restaurantId,
          scheduleId,
          shiftId,
          payload
        );

        if (onSuccess) onSuccess();
        return shift;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        if (onError) onError(err);
        throw err;
      } finally {
        setIsCreatingShift(false);
      }
    },
    [restaurantId, onSuccess, onError]
  );

  /**
   * Unassigns an employee from a scheduled shift
   * Returns the updated shift with employee_id set to null
   */
  const unassignShift = useCallback(
    async (scheduleId: number, shiftId: number): Promise<ScheduledShift> => {
      if (!restaurantId) {
        throw new Error("Restaurant ID is required");
      }

      setIsUnassigningShift(true);

      try {
        const response = await fetchWithAuth(
          `${getApiBase()}/restaurants/${restaurantId}/schedules/${scheduleId}/shifts/${shiftId}/assign`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to unassign shift");
        }

        const result = await response.json();
        const rawShift = result.data;

        // Log raw response for debugging
        console.log('Unassignment API response (raw):', rawShift);

        // Normalize date formats (ISO 8601 -> YYYY-MM-DD)
        const normalizedShift = normalizeShiftDates(rawShift);

        console.log('Unassignment API response (normalized):', normalizedShift);

        if (onSuccess) onSuccess();
        return normalizedShift;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        if (onError) onError(err);
        throw err;
      } finally {
        setIsUnassigningShift(false);
      }
    },
    [restaurantId, onSuccess, onError]
  );

  return {
    createScheduleForWeek,
    createShift,
    updateShift,
    unassignShift,
    isCreatingSchedule,
    isCreatingShift,
    isUnassigningShift,
    isLoading: isCreatingSchedule || isCreatingShift || isUnassigningShift,
  };
}
