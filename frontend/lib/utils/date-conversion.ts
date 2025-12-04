/**
 * Converts YYYY-MM-DD date string to ISO 8601 timestamp
 * Backend expects: "2025-01-20T00:00:00Z"
 * Frontend has: "2025-01-20"
 */
export function dateToISO8601(dateString: string): string {
  return `${dateString}T00:00:00Z`;
}

/**
 * Calculates week end date (start + 6 days)
 */
export function calculateWeekEnd(startDate: string): string {
  const date = new Date(startDate + "T00:00:00Z");
  date.setDate(date.getDate() + 6);
  return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
}

/**
 * Formats hour number to HH:MM time string
 */
export function hourToTime(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}
