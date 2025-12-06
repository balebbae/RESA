/**
 * Utility functions for parsing and formatting time values
 */

/**
 * Parse time string to hour number
 * Handles multiple formats:
 * - "09:00" -> 9
 * - "0000-01-01T09:00:00Z" -> 9
 * - "09:00:00" -> 9
 */
export function parseTimeToHour(timeString: string): number {
  // Handle ISO timestamp format (e.g., "0000-01-01T09:00:00Z")
  if (timeString.includes('T')) {
    const timePart = timeString.split('T')[1]; // Get "09:00:00Z"
    const hourPart = timePart.split(':')[0]; // Get "09"
    return parseInt(hourPart, 10);
  }

  // Handle HH:MM or HH:MM:SS format
  const parts = timeString.split(':');
  return parseInt(parts[0], 10);
}

/**
 * Format time string to HH:MM format
 * Handles multiple input formats
 */
export function formatTimeToHHMM(timeString: string): string {
  // Handle ISO timestamp format
  if (timeString.includes('T')) {
    const timePart = timeString.split('T')[1]; // Get "09:00:00Z"
    const [hours, minutes] = timePart.split(':');
    return `${hours}:${minutes}`;
  }

  // Handle HH:MM:SS format
  if (timeString.split(':').length === 3) {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  }

  // Already in HH:MM format
  return timeString;
}
