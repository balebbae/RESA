"use client"

import type { Event } from "@/types/event"
import { calculateShiftHeight, parseTime } from "@/lib/calendar/shift-utils"
import { formatEventTimeRange } from "@/lib/calendar/event-utils"

// Google Calendar-style lavender/purple color palette
const EVENT_COLORS = {
  background: "#EDE9FE", // Light lavender (purple-100)
  border: "#8B5CF6", // Purple-500
  text: "#000000", // Black
  textSecondary: "#4B5563", // Gray-600
}

interface EventCardProps {
  event: Event
  onClick?: (event: Event) => void
  assignedEmployeeNames?: string[]
  /**
   * For handling overlapping events
   * width: percentage width (e.g., 50 for half width)
   * offset: percentage left offset
   */
  layoutProps?: {
    width: number
    offset: number
  }
}

export function EventCard({
  event,
  onClick,
  assignedEmployeeNames = [],
  layoutProps,
}: EventCardProps) {
  const height = calculateShiftHeight(event.start_time, event.end_time)
  
  // Calculate top offset based on absolute start time (hours * 60px)
  const startHour = parseTime(event.start_time)
  const topOffset = startHour * 60

  const width = layoutProps?.width ?? 100
  const offset = layoutProps?.offset ?? 0

  // Format time range for display
  const timeRange = formatEventTimeRange(event.start_time, event.end_time)

  // Calculate if we have enough space to show additional content
  const canShowEmployees = height >= 60 && assignedEmployeeNames.length > 0

  return (
    <div
      data-event-id={event.id}
      className="absolute px-2 py-1 rounded-md cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] z-10 border-l-4 overflow-hidden pointer-events-auto"
      style={{
        height: `${height}px`,
        top: `${topOffset}px`,
        left: `${offset}%`,
        width: `${width}%`,
        backgroundColor: EVENT_COLORS.background,
        borderLeftColor: EVENT_COLORS.border,
      }}
      onClick={(e) => {
        e.stopPropagation() // Prevent click from passing to grid
        onClick?.(event)
      }}
    >
      {/* Event Title */}
      <div
        className="text-xs font-semibold truncate leading-tight"
        style={{ color: EVENT_COLORS.text }}
      >
        {event.title}
      </div>

      {/* Time Range */}
      <div
        className="text-[11px] truncate leading-tight"
        style={{ color: EVENT_COLORS.textSecondary }}
      >
        {timeRange}
      </div>

      {/* Assigned Employees (if space allows and employees assigned) */}
      {canShowEmployees && (
        <div
          className="text-[10px] truncate mt-0.5 opacity-80"
          style={{ color: EVENT_COLORS.textSecondary }}
        >
          {assignedEmployeeNames.slice(0, 2).join(", ")}
          {assignedEmployeeNames.length > 2 &&
            ` +${assignedEmployeeNames.length - 2}`}
        </div>
      )}
    </div>
  )
}
