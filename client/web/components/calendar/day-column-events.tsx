"use client"

import { useMemo } from "react"
import type { Event } from "@/types/event"
import { EventCard } from "./event-card"
import {
  filterEventsForDate,
  assignColumnsToEvents,
  calculateEventStyles,
} from "@/lib/calendar/event-utils"

interface DayColumnEventsProps {
  date: string
  dayIndex: number
  columnWidth: number
  events: Event[]
  onEventClick?: (event: Event) => void
}

/**
 * Renders event cards for a single day column
 * Handles overlap detection and column assignment
 */
export function DayColumnEvents({
  date,
  dayIndex,
  columnWidth,
  events,
  onEventClick,
}: DayColumnEventsProps) {
  // Filter events for this specific date
  const eventsForDay = useMemo(
    () => filterEventsForDate(events, date),
    [events, date]
  )

  // Calculate column assignments for overlapping events
  const columnAssignments = useMemo(
    () => assignColumnsToEvents(eventsForDay),
    [eventsForDay]
  )

  if (columnAssignments.length === 0) {
    return null
  }

  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none"
      style={{
        left: `${dayIndex * columnWidth}px`,
        width: `${columnWidth}px`,
      }}
    >
      {columnAssignments.map((assignment) => {
        const styles = calculateEventStyles(assignment)

        return (
          <EventCard
            key={assignment.event.id}
            event={assignment.event}
            onClick={onEventClick}
            assignedEmployeeNames={assignment.event.employees?.map(
              (e) => e.full_name
            )}
            layoutProps={{
              width: parseFloat(styles.width),
              offset: parseFloat(styles.left),
            }}
          />
        )
      })}
    </div>
  )
}
