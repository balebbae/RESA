/**
 * @deprecated Use imports from "@/lib/time" instead
 * This file is kept for backward compatibility during migration.
 */

import {
  dateToISO,
  getWeekEndDate,
  hoursToTimeString,
} from "@/lib/time";

/**
 * @deprecated Use dateToISO from "@/lib/time"
 */
export function dateToISO8601(dateString: string): string {
  return dateToISO(dateString);
}

/**
 * @deprecated Use getWeekEndDate from "@/lib/time"
 */
export function calculateWeekEnd(startDate: string): string {
  return getWeekEndDate(startDate);
}

/**
 * @deprecated Use hoursToTimeString from "@/lib/time"
 */
export function hourToTime(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}
