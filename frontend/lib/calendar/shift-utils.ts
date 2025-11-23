import type { ScheduledShift } from "@/types/schedule";

/**
 * Parse a time string (HH:MM) to hour number
 * @param timeString - Time in "HH:MM" format (e.g., "09:00", "17:30")
 * @returns Hour as decimal number (e.g., 9, 17.5)
 */
export function parseTime(timeString: string): number {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours + minutes / 60;
}

/**
 * Calculate the duration of a shift in hours
 * @param startTime - Start time in "HH:MM" format
 * @param endTime - End time in "HH:MM" format
 * @returns Duration in hours (decimal)
 */
export function calculateShiftDuration(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  // Handle shifts that cross midnight
  if (end < start) {
    return 24 - start + end;
  }

  return end - start;
}

/**
 * Calculate the grid row position for a shift based on start time
 * Grid rows are 1-indexed (row 1 = 12 AM, row 2 = 1 AM, etc.)
 * @param startTime - Start time in "HH:MM" format
 * @returns Grid row number
 */
export function calculateGridRow(startTime: string): number {
  const hour = Math.floor(parseTime(startTime));
  return hour + 1; // Grid rows start at 1
}

/**
 * Calculate the height in pixels for a shift
 * @param startTime - Start time in "HH:MM" format
 * @param endTime - End time in "HH:MM" format
 * @param pixelsPerHour - Height of one hour in pixels (default: 40)
 * @returns Height in pixels
 */
export function calculateShiftHeight(
  startTime: string,
  endTime: string,
  pixelsPerHour: number = 40
): number {
  const duration = calculateShiftDuration(startTime, endTime);
  return duration * pixelsPerHour;
}

/**
 * Calculate the top offset in pixels for a shift within its hour slot
 * Used when a shift starts at a fractional hour (e.g., 9:30 AM)
 * @param startTime - Start time in "HH:MM" format
 * @param pixelsPerHour - Height of one hour in pixels (default: 40)
 * @returns Top offset in pixels
 */
export function calculateTopOffset(
  startTime: string,
  pixelsPerHour: number = 40
): number {
  const time = parseTime(startTime);
  const fractionalPart = time - Math.floor(time); // Get the minutes as a fraction
  return fractionalPart * pixelsPerHour;
}

/**
 * Get the day of week index from a date string
 * @param dateString - Date in "YYYY-MM-DD" format
 * @returns Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getDayOfWeek(dateString: string): number {
  const date = new Date(dateString + "T00:00:00");
  return date.getDay();
}

/**
 * Detect overlapping shifts within the same time slot
 * Returns an array of shift groups where each group contains overlapping shifts
 * @param shifts - Array of shifts for a specific day
 * @returns Array of shift groups (each group is an array of overlapping shifts)
 */
export function groupOverlappingShifts(shifts: ScheduledShift[]): ScheduledShift[][] {
  if (shifts.length === 0) return [];

  // Sort shifts by start time
  const sortedShifts = [...shifts].sort((a, b) => {
    return parseTime(a.start_time) - parseTime(b.start_time);
  });

  const groups: ScheduledShift[][] = [];
  let currentGroup: ScheduledShift[] = [sortedShifts[0]];

  for (let i = 1; i < sortedShifts.length; i++) {
    const currentShift = sortedShifts[i];
    const lastShiftInGroup = currentGroup[currentGroup.length - 1];

    // Check if current shift overlaps with any shift in the current group
    const overlaps = currentGroup.some((groupShift) => {
      return shiftsOverlap(groupShift, currentShift);
    });

    if (overlaps) {
      currentGroup.push(currentShift);
    } else {
      groups.push(currentGroup);
      currentGroup = [currentShift];
    }
  }

  groups.push(currentGroup);
  return groups;
}

/**
 * Check if two shifts overlap in time
 * @param shift1 - First shift
 * @param shift2 - Second shift
 * @returns true if shifts overlap
 */
export function shiftsOverlap(shift1: ScheduledShift, shift2: ScheduledShift): boolean {
  const start1 = parseTime(shift1.start_time);
  const end1 = parseTime(shift1.end_time);
  const start2 = parseTime(shift2.start_time);
  const end2 = parseTime(shift2.end_time);

  return start1 < end2 && start2 < end1;
}

/**
 * Format a date string to a readable format
 * @param dateString - Date in "YYYY-MM-DD" format
 * @param format - "short" (Nov 3) or "long" (November 3, 2025)
 * @returns Formatted date string
 */
export function formatDateDisplay(
  dateString: string,
  format: "short" | "long" = "short"
): string {
  const date = new Date(dateString + "T00:00:00");

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
 * Get day name abbreviation
 * @param dayIndex - Day of week (0-6)
 * @returns Day name (SUN, MON, etc.)
 */
export function getDayName(dayIndex: number): string {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return days[dayIndex];
}

/**
 * Generate an array of dates for a week
 * @param weekStartDate - Start date (Sunday) in "YYYY-MM-DD" format
 * @returns Array of 7 date strings
 */
export function getWeekDates(weekStartDate: string): string[] {
  const dates: string[] = [];
  const startDate = new Date(weekStartDate + "T00:00:00");

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(formatDate(date));
  }

  return dates;
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
 * Get array of all hours in a day (0-23)
 */
export function getAllHours(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

/**
 * Format hour number to display string
 * @param hour - Hour (0-23)
 * @returns Formatted string (12 AM, 1 AM, etc.)
 */
export function formatHourDisplay(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}
