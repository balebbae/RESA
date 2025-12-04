"use client";

import { useMemo } from "react";
import type { ShiftTemplate } from "@/types/shift-template";
import type { ScheduledShift } from "@/types/schedule";
import { parseTime, getDayOfWeek } from "@/lib/calendar/shift-utils";

interface UseTemplateFilteringProps {
  date: string; // YYYY-MM-DD
  hour: number; // 0-23
  shiftTemplates: ShiftTemplate[];
  shifts: ScheduledShift[];
}

interface UseTemplateFilteringReturn {
  templatesInSlot: ShiftTemplate[]; // Templates overlapping this time slot
  shiftsInSlot: ScheduledShift[]; // Shifts starting in this hour
  shiftLayouts: Array<{ width: number; offset: number }>;
  dayOfWeek: number; // 0-6
}

/**
 * Custom hook for filtering templates and shifts for a specific time slot
 * Extracts filtering and layout calculation logic from TimeSlotCell
 * Uses useMemo for performance optimization
 */
export function useTemplateFiltering({
  date,
  hour,
  shiftTemplates,
  shifts,
}: UseTemplateFilteringProps): UseTemplateFilteringReturn {
  // Calculate day of week for this date (0 = Sunday, 6 = Saturday)
  const dayOfWeek = useMemo(() => getDayOfWeek(date), [date]);

  // Filter shift templates that match this day and hour
  const templatesInSlot = useMemo(() => {
    return shiftTemplates.filter((template) => {
      if (template.day_of_week !== dayOfWeek) return false;

      // Use parseTime for decimal precision to handle fractional hours (e.g., 17.5 for 5:30 PM)
      const startTimeDecimal = parseTime(template.start_time);
      const endTimeDecimal = parseTime(template.end_time);

      // Template shows in this hour if it overlaps with the hour range [hour, hour+1)
      return endTimeDecimal > hour && startTimeDecimal < hour + 1;
    });
  }, [shiftTemplates, dayOfWeek, hour]);

  // Filter shifts that start in this hour slot
  const shiftsInSlot = useMemo(() => {
    return shifts.filter((shift) => {
      // Defensive: Skip shifts with missing required fields
      if (!shift.start_time || !shift.shift_date) {
        console.warn('Shift missing required fields:', shift);
        return false;
      }

      const shiftHour = Math.floor(parseFloat(shift.start_time.split(":")[0]));
      // Normalize date comparison to handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM:SSZ" formats
      const shiftDateOnly = shift.shift_date.split("T")[0];
      return shiftDateOnly === date && shiftHour === hour;
    });
  }, [shifts, date, hour]);

  // Calculate layout for overlapping shifts
  const shiftLayouts = useMemo(() => {
    const shiftCount = shiftsInSlot.length;
    return shiftsInSlot.map((_, index) => ({
      width: shiftCount > 1 ? 100 / shiftCount : 100,
      offset: shiftCount > 1 ? (100 / shiftCount) * index : 0,
    }));
  }, [shiftsInSlot]);

  return {
    templatesInSlot,
    shiftsInSlot,
    shiftLayouts,
    dayOfWeek,
  };
}
