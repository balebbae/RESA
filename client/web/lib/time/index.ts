/**
 * Centralized time handling for RESA frontend.
 *
 * All time parsing, formatting, and validation should use these utilities
 * to ensure consistent behavior across the application.
 *
 * Time Format Conventions:
 * - TIME_FORMAT: "HH:MM" (24-hour format, e.g., "14:30")
 * - DATE_FORMAT: "YYYY-MM-DD" (ISO 8601 date, e.g., "2025-01-20")
 * - Full ISO: "YYYY-MM-DDTHH:MM:SSZ" (for API requests with timestamps)
 */

// ============ CONSTANTS ============

/** Standard time format for display and input: 24-hour "HH:MM" */
export const TIME_FORMAT = "HH:MM";

/** Standard date format for API and storage: "YYYY-MM-DD" */
export const DATE_FORMAT = "YYYY-MM-DD";

/** Suffix appended to dates for full ISO 8601 format */
export const ISO_DATE_SUFFIX = "T00:00:00Z";

// ============ PARSING ============

/**
 * Parse a time string to decimal hours.
 * Handles multiple input formats from the backend.
 *
 * @param timeStr - Time string in various formats:
 *   - "HH:MM" (e.g., "14:30")
 *   - "HH:MM:SS" (e.g., "14:30:00")
 *   - ISO format (e.g., "0000-01-01T14:30:00Z" - pq driver quirk)
 * @returns Decimal hours (e.g., 14.5 for 14:30)
 *
 * @example
 * parseTimeToHours("14:30") // Returns 14.5
 * parseTimeToHours("09:15") // Returns 9.25
 */
export function parseTimeToHours(timeStr: string): number {
  if (!timeStr) return 0;

  // Handle ISO format from backend (pq driver quirk)
  if (timeStr.includes("T")) {
    const timePart = timeStr.split("T")[1]?.split("Z")[0] || timeStr;
    const [hours, minutes] = timePart.split(":").map(Number);
    return hours + (minutes || 0) / 60;
  }

  // Handle HH:MM or HH:MM:SS format
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + (minutes || 0) / 60;
}

/**
 * Normalize a time string to HH:MM format.
 * Strips seconds and handles ISO format conversion.
 *
 * @param timeStr - Time string in various formats
 * @returns Normalized time string in "HH:MM" format
 *
 * @example
 * normalizeTime("14:30:00") // Returns "14:30"
 * normalizeTime("0000-01-01T14:30:00Z") // Returns "14:30"
 */
export function normalizeTime(timeStr: string): string {
  if (!timeStr) return "";

  // Already HH:MM
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;

  // HH:MM:SS -> HH:MM
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr.substring(0, 5);
  }

  // ISO format -> HH:MM
  if (timeStr.includes("T")) {
    const timePart = timeStr.split("T")[1]?.substring(0, 5);
    return timePart || timeStr;
  }

  return timeStr;
}

/**
 * Normalize a date string to YYYY-MM-DD format.
 * Strips time component from ISO timestamps.
 *
 * @param dateStr - Date string in various formats
 * @returns Normalized date string in "YYYY-MM-DD" format
 *
 * @example
 * normalizeDate("2025-01-20T00:00:00Z") // Returns "2025-01-20"
 * normalizeDate("2025-01-20") // Returns "2025-01-20"
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return "";

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  // ISO format -> YYYY-MM-DD
  if (dateStr.includes("T")) {
    return dateStr.split("T")[0];
  }

  return dateStr;
}

// ============ FORMATTING ============

/**
 * Format decimal hours to HH:MM string.
 *
 * @param hours - Decimal hours (e.g., 14.5)
 * @returns Formatted time string (e.g., "14:30")
 *
 * @example
 * hoursToTimeString(14.5) // Returns "14:30"
 * hoursToTimeString(9.25) // Returns "09:15"
 */
export function hoursToTimeString(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Format hour (0-23) for display with AM/PM.
 *
 * @param hour - Hour in 24-hour format (0-23)
 * @returns Formatted string with AM/PM
 *
 * @example
 * formatHourDisplay(0)  // Returns "12 AM"
 * formatHourDisplay(12) // Returns "12 PM"
 * formatHourDisplay(14) // Returns "2 PM"
 */
export function formatHourDisplay(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/**
 * Convert YYYY-MM-DD to full ISO 8601 format for API requests.
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns ISO 8601 timestamp string
 *
 * @example
 * dateToISO("2025-01-20") // Returns "2025-01-20T00:00:00Z"
 */
export function dateToISO(dateStr: string): string {
  if (!dateStr) return "";
  if (dateStr.includes("T")) return dateStr; // Already ISO
  return `${dateStr}${ISO_DATE_SUFFIX}`;
}

/**
 * Format a date for display.
 *
 * @param dateStr - Date string in YYYY-MM-DD or ISO format
 * @param format - Display format: "short" (Jan 20) or "long" (January 20, 2025)
 * @returns Formatted date string for display
 *
 * @example
 * formatDateDisplay("2025-01-20", "short") // Returns "Jan 20"
 * formatDateDisplay("2025-01-20", "long")  // Returns "January 20, 2025"
 */
export function formatDateDisplay(
  dateStr: string,
  format: "short" | "long" = "short"
): string {
  if (!dateStr) return "";

  const normalized = normalizeDate(dateStr);
  const date = new Date(normalized + "T00:00:00");

  if (format === "short") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a week range for display (e.g., "Jan 15 - 21, 2025").
 *
 * @param startDate - Week start date in YYYY-MM-DD format
 * @param endDate - Week end date in YYYY-MM-DD format
 * @returns Formatted week range string
 */
export function formatWeekRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return "";

  const start = new Date(normalizeDate(startDate) + "T00:00:00");
  const end = new Date(normalizeDate(endDate) + "T00:00:00");

  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }

  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

// ============ VALIDATION ============

/**
 * Validate time is in HH:MM format (24-hour).
 *
 * @param time - Time string to validate
 * @returns True if valid HH:MM format
 *
 * @example
 * isValidTimeFormat("14:30") // Returns true
 * isValidTimeFormat("2:30")  // Returns false (missing leading zero)
 * isValidTimeFormat("25:00") // Returns false (invalid hour)
 */
export function isValidTimeFormat(time: string): boolean {
  return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

/**
 * Validate time is on a specific minute boundary (e.g., 15-minute increments).
 *
 * @param time - Time string in HH:MM format
 * @param increment - Minute increment to check (default: 15)
 * @returns True if time is on the specified increment
 *
 * @example
 * isValidTimeIncrement("14:30", 15) // Returns true
 * isValidTimeIncrement("14:35", 15) // Returns false
 */
export function isValidTimeIncrement(
  time: string,
  increment: number = 15
): boolean {
  const parts = time.split(":");
  if (parts.length < 2) return false;
  const minutes = parseInt(parts[1], 10);
  return minutes % increment === 0;
}

/**
 * Validate end time is after start time.
 *
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns True if end time is after start time
 *
 * @example
 * isEndAfterStart("09:00", "17:00") // Returns true
 * isEndAfterStart("17:00", "09:00") // Returns false
 */
export function isEndAfterStart(startTime: string, endTime: string): boolean {
  return parseTimeToHours(endTime) > parseTimeToHours(startTime);
}

/**
 * Validate date is in YYYY-MM-DD format.
 *
 * @param date - Date string to validate
 * @returns True if valid YYYY-MM-DD format
 */
export function isValidDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// ============ CALENDAR UTILITIES ============

/**
 * Get day name abbreviation from day index.
 *
 * @param dayIndex - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns Three-letter day abbreviation
 *
 * @example
 * getDayName(0) // Returns "SUN"
 * getDayName(1) // Returns "MON"
 */
export function getDayName(dayIndex: number): string {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return days[dayIndex] || "";
}

/**
 * Get full day name from day index.
 *
 * @param dayIndex - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns Full day name
 */
export function getDayNameFull(dayIndex: number): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayIndex] || "";
}

/**
 * Get array of date strings for a week starting from given date.
 *
 * @param startDate - Week start date in YYYY-MM-DD format
 * @returns Array of 7 date strings in YYYY-MM-DD format
 *
 * @example
 * getWeekDates("2025-01-20") // Returns ["2025-01-20", "2025-01-21", ...]
 */
export function getWeekDates(startDate: string): string[] {
  const normalized = normalizeDate(startDate);
  const start = new Date(normalized + "T00:00:00");
  const dates: string[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
}

/**
 * Calculate the end date of a week given the start date.
 *
 * @param startDate - Week start date in YYYY-MM-DD format
 * @returns Week end date in YYYY-MM-DD format (start + 6 days)
 */
export function getWeekEndDate(startDate: string): string {
  const normalized = normalizeDate(startDate);
  const start = new Date(normalized + "T00:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end.toISOString().split("T")[0];
}

/**
 * Get the Sunday of the week containing the given date.
 *
 * @param date - Date object or undefined for current date
 * @returns YYYY-MM-DD string for the Sunday of that week
 */
export function getWeekStart(date?: Date): string {
  const d = date || new Date();
  const day = d.getDay(); // 0 = Sunday
  const diff = d.getDate() - day;
  const sunday = new Date(d);
  sunday.setDate(diff);
  return sunday.toISOString().split("T")[0];
}

/**
 * Navigate to next or previous week.
 *
 * @param currentWeekStart - Current week start in YYYY-MM-DD format
 * @param direction - "next" or "prev"
 * @returns New week start date in YYYY-MM-DD format
 */
export function navigateWeek(
  currentWeekStart: string,
  direction: "next" | "prev"
): string {
  const normalized = normalizeDate(currentWeekStart);
  const current = new Date(normalized + "T00:00:00");
  const offset = direction === "next" ? 7 : -7;
  current.setDate(current.getDate() + offset);
  return current.toISOString().split("T")[0];
}

/**
 * Check if a date is today.
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns True if the date is today
 */
export function isToday(dateStr: string): boolean {
  const normalized = normalizeDate(dateStr);
  const today = new Date().toISOString().split("T")[0];
  return normalized === today;
}

// ============ SHIFT/DURATION UTILITIES ============

/**
 * Calculate shift duration in hours.
 * Handles overnight shifts (end time before start time).
 *
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Duration in decimal hours
 *
 * @example
 * calculateDuration("09:00", "17:00") // Returns 8
 * calculateDuration("22:00", "06:00") // Returns 8 (overnight)
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = parseTimeToHours(startTime);
  let end = parseTimeToHours(endTime);

  // Handle overnight shifts
  if (end < start) {
    end += 24;
  }

  return end - start;
}

/**
 * Generate an array of all hours (0-23) for calendar grid.
 *
 * @returns Array of numbers from 0 to 23
 */
export function getAllHours(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

/**
 * Round decimal hours to the nearest 15-minute increment.
 *
 * @param decimalHours - Decimal hours (e.g., 14.33)
 * @returns Rounded decimal hours (e.g., 14.25)
 *
 * @example
 * roundToQuarterHour(14.33) // Returns 14.25 (2:15 PM)
 * roundToQuarterHour(14.4)  // Returns 14.5 (2:30 PM)
 * roundToQuarterHour(23.9)  // Returns 23.75 (capped)
 */
export function roundToQuarterHour(decimalHours: number): number {
  const rounded = Math.round(decimalHours * 4) / 4;
  return Math.max(0, Math.min(23.75, rounded));
}

// ============ TIMEZONE UTILITIES ============

/**
 * Get the current timezone abbreviation (e.g., "PST", "EST", "PDT").
 *
 * @returns Timezone abbreviation string
 *
 * @example
 * getTimezoneAbbreviation() // Returns "PST" (if in Pacific timezone)
 */
export function getTimezoneAbbreviation(): string {
  const date = new Date();
  const formatted = date.toLocaleTimeString("en-US", {
    timeZoneName: "short",
  });
  // Extract timezone abbreviation from format like "3:45:30 PM PST"
  const parts = formatted.split(" ");
  return parts[parts.length - 1] || "";
}
