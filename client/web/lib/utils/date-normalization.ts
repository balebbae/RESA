import type { ScheduledShift } from "@/types/schedule";
import { normalizeDate } from "@/lib/time";

/**
 * Normalizes shift data from backend API responses to ensure consistent date/time formats
 *
 * Backend returns:
 * - shift_date as ISO 8601 timestamp: "2025-11-30T00:00:00Z"
 * - start_time/end_time as normalized strings: "HH:MM:SS"
 *
 * Frontend expects:
 * - shift_date as YYYY-MM-DD: "2025-11-30"
 * - start_time/end_time as HH:MM: "14:30"
 *
 * @param shift - Raw shift data from backend (may have ISO timestamps)
 * @returns Normalized shift with YYYY-MM-DD date format
 */
export function normalizeShiftDates(shift: Record<string, unknown>): ScheduledShift {
  return {
    ...shift,
    // Use centralized normalizeDate function
    shift_date: normalizeDate(shift.shift_date as string),
    // Time fields should already be in HH:MM or HH:MM:SS format from backend
    start_time: shift.start_time as string,
    end_time: shift.end_time as string,
  } as ScheduledShift;
}
