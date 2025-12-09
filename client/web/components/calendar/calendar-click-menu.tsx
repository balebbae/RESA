"use client"

import { Plus, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InlineEventForm } from "./inline-event-form"
import type { Employee } from "@/types/employee"

interface CalendarClickMenuProps {
  onCreateShift: () => void
  onCreateEvent: () => void
  // Props for inline event creation
  showEventForm?: boolean
  restaurantId?: number | null
  date?: string
  startTime?: string
  endTime?: string
  employees?: Employee[]
  onEventCreated?: () => void
  onEventFormCancel?: () => void
}

/**
 * Menu shown when clicking on an empty area of the calendar.
 * Provides options to create a shift or event at the clicked position.
 * When showEventForm is true, displays the inline event creation form instead.
 */
export function CalendarClickMenu({
  onCreateShift,
  onCreateEvent,
  showEventForm = false,
  restaurantId,
  date,
  startTime,
  endTime,
  employees = [],
  onEventCreated,
  onEventFormCancel,
}: CalendarClickMenuProps) {
  // If showing inline event form, render it instead of menu
  if (showEventForm && restaurantId && date && startTime && endTime) {
    return (
      <InlineEventForm
        restaurantId={restaurantId}
        date={date}
        startTime={startTime}
        endTime={endTime}
        employees={employees}
        onSuccess={onEventCreated || (() => {})}
        onCancel={onEventFormCancel || (() => {})}
      />
    )
  }

  // Default menu view
  return (
    <div className="flex flex-col">
      <Button
        variant="ghost"
        className="justify-start h-7"
        onClick={onCreateShift}
      >
        <Plus className="h-2 w-3" />
        Create Shift
      </Button>
      <Button
        variant="ghost"
        className="justify-start h-7"
        onClick={onCreateEvent}
      >
        <Calendar className="h-2 w-3" />
        Create Event
      </Button>
    </div>
  )
}
