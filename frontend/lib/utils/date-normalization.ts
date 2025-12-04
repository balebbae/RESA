import type { ScheduledShift } from "@/types/schedule";

/**
 * Normalizes shift data from backend API responses to ensure consistent date/time formats
 *
 * Backend returns:
 * - shift_date as ISO 8601 timestamp: "2025-11-30T00:00:00Z"
 * - start_time/end_time as normalized strings: "HH:MM"
 *
 * Frontend expects:
 * - shift_date as YYYY-MM-DD: "2025-11-30"
 * - start_time/end_time as HH:MM: "14:30"
 *
 * @param shift - Raw shift data from backend (may have ISO timestamps)
 * @returns Normalized shift with YYYY-MM-DD date format
 */
export function normalizeShiftDates(shift: any): ScheduledShift {
  // Log input for debugging
  console.log('Normalizing shift dates - input:', {
    id: shift.id,
    shift_date: shift.shift_date,
    start_time: shift.start_time,
    end_time: shift.end_time,
    employee_id: shift.employee_id
  });

  const normalized = {
    ...shift,
    // Convert ISO 8601 timestamp to YYYY-MM-DD format by splitting on 'T'
    // If already in correct format (no 'T'), keeps original value
    shift_date: shift.shift_date?.split('T')[0] || shift.shift_date,
    // Time fields should already be in HH:MM format from backend normalization
    start_time: shift.start_time,
    end_time: shift.end_time,
  };

  console.log('Normalizing shift dates - output:', {
    id: normalized.id,
    shift_date: normalized.shift_date,
    start_time: normalized.start_time,
    end_time: normalized.end_time,
    employee_id: normalized.employee_id
  });

  return normalized;
}
