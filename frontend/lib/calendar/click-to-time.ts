/**
 * Utility for converting calendar click positions to date and time values.
 * This module provides reusable functions for calculating the date and time
 * based on where a user clicks on the calendar grid.
 */

import { hoursToTimeString, roundToQuarterHour } from "@/lib/time";

/**
 * Represents the calculated date and time from a calendar click.
 */
export interface CalendarClickPosition {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Day of week (0=Sunday, 1=Monday, ..., 6=Saturday) */
  dayOfWeek: number;
  /** Start time in HH:MM format (rounded to nearest 15 minutes) */
  startTime: string;
  /** End time in HH:MM format (startTime + 2 hours, capped at 23:45) */
  endTime: string;
}

/**
 * Parameters for calculating click position.
 */
export interface ClickPositionParams {
  /** Mouse X coordinate from click event */
  clientX: number;
  /** Mouse Y coordinate from click event */
  clientY: number;
  /** Bounding rect of the grid container (excluding time column) */
  gridRect: DOMRect;
  /** Current scroll position of the scroll container */
  scrollTop: number;
  /** Array of 7 date strings (YYYY-MM-DD) for the current week */
  weekDates: string[];
  /** Width of the time column in pixels (default: 80) */
  timeColumnWidth?: number;
  /** Pixels per hour in the grid (default: 60) */
  pixelsPerHour?: number;
}

/** Default width of the time column in pixels */
const DEFAULT_TIME_COLUMN_WIDTH = 80;

/** Default pixels per hour (each hour row is 60px tall) */
const DEFAULT_PIXELS_PER_HOUR = 60;

/** Default shift duration in hours */
const DEFAULT_SHIFT_DURATION = 2;

/** Maximum valid hour value (23:45) */
const MAX_HOUR = 23.75;

/**
 * Calculate the date and time from a click position on the calendar grid.
 *
 * @param params - Click position parameters
 * @returns Calculated calendar position with date, dayOfWeek, startTime, and endTime
 *
 * @example
 * const data = calculateClickPosition({
 *   clientX: 500,
 *   clientY: 400,
 *   gridRect: element.getBoundingClientRect(),
 *   scrollTop: container.scrollTop,
 *   weekDates: ["2025-01-19", "2025-01-20", ...],
 * });
 * // Returns: { date: "2025-01-21", dayOfWeek: 2, startTime: "09:30", endTime: "11:30" }
 */
export function calculateClickPosition(
  params: ClickPositionParams
): CalendarClickPosition {
  const {
    clientX,
    clientY,
    gridRect,
    scrollTop,
    weekDates,
    timeColumnWidth = DEFAULT_TIME_COLUMN_WIDTH,
    pixelsPerHour = DEFAULT_PIXELS_PER_HOUR,
  } = params;

  // Calculate relative X position (accounting for time column)
  const relativeX = clientX - gridRect.left - timeColumnWidth;

  // Calculate relative Y position (accounting for scroll)
  const relativeY = clientY - gridRect.top + scrollTop;

  // Calculate column width and day index
  const gridWidth = gridRect.width - timeColumnWidth;
  const columnWidth = gridWidth / 7;
  const dayIndex = Math.max(0, Math.min(6, Math.floor(relativeX / columnWidth)));

  // Calculate decimal hours from Y position
  const decimalHours = relativeY / pixelsPerHour;

  // Round to nearest 15 minutes
  const roundedStartHours = roundToQuarterHour(decimalHours);

  // Calculate end time (start + 2 hours, capped at 23:45)
  const endHours = Math.min(roundedStartHours + DEFAULT_SHIFT_DURATION, MAX_HOUR);

  // Convert to time strings
  const startTime = hoursToTimeString(roundedStartHours);
  const endTime = hoursToTimeString(endHours);

  return {
    date: weekDates[dayIndex],
    dayOfWeek: dayIndex,
    startTime,
    endTime,
  };
}

/**
 * Get the day of week from a date string.
 *
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 */
export function getDayOfWeekFromDate(dateStr: string): number {
  const date = new Date(dateStr + "T00:00:00");
  return date.getDay();
}
