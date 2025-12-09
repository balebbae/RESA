import type { Event } from "@/types/event"
import { parseTime } from "./shift-utils"

const PIXELS_PER_HOUR = 60

export interface EventPosition {
  event: Event
  startHour: number
  endHour: number
  top: number
  height: number
}

export interface EventColumnAssignment {
  event: Event
  column: number
  totalColumns: number
  position: EventPosition
}

/**
 * Calculate the position of an event in pixels
 */
export function calculateEventPosition(
  event: Event,
  pixelsPerHour: number = PIXELS_PER_HOUR
): EventPosition {
  const startHour = parseTime(event.start_time)
  const endHour = parseTime(event.end_time)
  // Handle midnight-crossing events
  const adjustedEndHour = endHour < startHour ? endHour + 24 : endHour
  const duration = adjustedEndHour - startHour

  return {
    event,
    startHour,
    endHour: adjustedEndHour,
    top: startHour * pixelsPerHour,
    height: duration * pixelsPerHour,
  }
}

/**
 * Filter events for a specific date
 */
export function filterEventsForDate(events: Event[], date: string): Event[] {
  return events.filter((e) => e.date === date)
}

/**
 * Check if two event positions overlap
 */
function eventsOverlap(pos1: EventPosition, pos2: EventPosition): boolean {
  return pos1.startHour < pos2.endHour && pos2.startHour < pos1.endHour
}

/**
 * Assign columns to overlapping events (Google Calendar style)
 * Events that overlap are placed side by side
 */
export function assignColumnsToEvents(
  events: Event[],
  pixelsPerHour: number = PIXELS_PER_HOUR
): EventColumnAssignment[] {
  if (events.length === 0) return []

  const positions = events.map((e) => calculateEventPosition(e, pixelsPerHour))

  // Sort by start time, then by duration (longer events first)
  const sortedPositions = [...positions].sort((a, b) => {
    if (a.startHour !== b.startHour) return a.startHour - b.startHour
    return b.endHour - b.startHour - (a.endHour - a.startHour)
  })

  const assignments: { position: EventPosition; column: number }[] = []
  const columnEnds: number[] = []

  for (const pos of sortedPositions) {
    // Find a column where this event can fit (column ends before this event starts)
    let column = columnEnds.findIndex((end) => end <= pos.startHour)

    if (column === -1) {
      // No existing column available, create a new one
      column = columnEnds.length
      columnEnds.push(pos.endHour)
    } else {
      // Update the end time for this column
      columnEnds[column] = pos.endHour
    }

    assignments.push({ position: pos, column })
  }

  // Calculate total columns for each event (based on overlapping events)
  const result: EventColumnAssignment[] = []

  for (const assignment of assignments) {
    // Find all events that overlap with this one
    const overlappingAssignments = assignments.filter(
      (a) =>
        eventsOverlap(a.position, assignment.position) ||
        a.position === assignment.position
    )

    const maxColumn = Math.max(...overlappingAssignments.map((a) => a.column))
    const totalColumns = maxColumn + 1

    result.push({
      event: assignment.position.event,
      column: assignment.column,
      totalColumns,
      position: assignment.position,
    })
  }

  return result
}

/**
 * Calculate CSS styles for an event based on column assignment
 */
export function calculateEventStyles(assignment: EventColumnAssignment): {
  top: string
  height: string
  left: string
  width: string
} {
  const widthPercent = 100 / assignment.totalColumns
  const leftPercent = assignment.column * widthPercent

  return {
    top: `${assignment.position.top}px`,
    height: `${assignment.position.height}px`,
    left: `${leftPercent}%`,
    width: `${widthPercent}%`,
  }
}

/**
 * Format time for display (e.g., "9:00 AM")
 */
export function formatEventTime(time: string): string {
  const [hoursStr, minutes] = time.split(":")
  const hours = parseInt(hoursStr)
  const ampm = hours >= 12 ? "PM" : "AM"
  const displayHour = hours % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

/**
 * Format time range for display (e.g., "9:00 AM - 10:30 AM")
 */
export function formatEventTimeRange(startTime: string, endTime: string): string {
  return `${formatEventTime(startTime)} - ${formatEventTime(endTime)}`
}
