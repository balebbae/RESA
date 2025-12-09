"use client"

import { useMemo } from "react"
import { Clock, User } from "lucide-react"
import type { ScheduledShift } from "@/types/schedule"
import {
  normalizeDate,
  normalizeTime,
  getDayNameFull,
  formatDateDisplay,
} from "@/lib/time"

interface ScheduleOverviewProps {
  shifts: ScheduledShift[]
  weekDates: string[]
}

/**
 * Format time to 12-hour format with AM/PM
 */
function formatTime12Hour(time: string): string {
  const normalized = normalizeTime(time)
  const [hours, minutes] = normalized.split(":").map(Number)

  if (isNaN(hours) || isNaN(minutes)) return time

  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12

  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
}

/**
 * Schedule overview displaying shifts grouped by day
 * Shows employee name, role (with color), and time for each shift
 */
export function ScheduleOverview({ shifts, weekDates }: ScheduleOverviewProps) {
  // Group shifts by date
  const shiftsByDate = useMemo(() => {
    const grouped: Record<string, ScheduledShift[]> = {}

    // Initialize all week dates
    weekDates.forEach((date) => {
      grouped[date] = []
    })

    // Group shifts by normalized date
    shifts.forEach((shift) => {
      const dateKey = normalizeDate(shift.shift_date)
      if (grouped[dateKey]) {
        grouped[dateKey].push(shift)
      }
    })

    // Sort shifts within each day by start time
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => {
        const aTime = normalizeTime(a.start_time)
        const bTime = normalizeTime(b.start_time)
        return aTime.localeCompare(bTime)
      })
    })

    return grouped
  }, [shifts, weekDates])

  // Calculate stats
  const totalShifts = shifts.length
  const assignedShifts = shifts.filter((s) => s.employee_id !== null).length

  if (totalShifts === 0) {
    return (
      <div className="rounded-md border border-dashed border-muted-foreground/25 p-6 text-center">
        <p className="text-muted-foreground">No shifts scheduled for this week</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Summary stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {totalShifts} shift{totalShifts !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <User className="h-4 w-4" />
          {assignedShifts} assigned
        </span>
      </div>

      {/* Shifts grouped by day */}
      <div className="max-h-[300px] space-y-2 overflow-y-auto pr-2">
        {weekDates.map((date) => {
          const dayShifts = shiftsByDate[date] || []
          const dateObj = new Date(date + "T00:00:00")
          const dayIndex = dateObj.getDay()
          const dayName = getDayNameFull(dayIndex)
          const dateDisplay = formatDateDisplay(date, "short")

          return (
            <div key={date} className="rounded-md border bg-muted/30 p-3">
              {/* Day header */}
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">
                  {dayName}, {dateDisplay}
                </span>
                <span className="text-sm text-muted-foreground">
                  {dayShifts.length} shift{dayShifts.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Shifts for this day */}
              {dayShifts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No shifts
                </p>
              ) : (
                <div className="space-y-1.5">
                  {dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      {/* Role color indicator */}
                      <div
                        className="h-3 w-3 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: shift.role_color || "#6B7280" }}
                      />

                      {/* Employee name or unassigned */}
                      <span
                        className={
                          shift.employee_name
                            ? "font-medium"
                            : "italic text-muted-foreground"
                        }
                      >
                        {shift.employee_name || "Unassigned"}
                      </span>

                      {/* Role name */}
                      <span className="text-muted-foreground">
                        - {shift.role_name}
                      </span>

                      {/* Time range */}
                      <span className="ml-auto text-muted-foreground">
                        {formatTime12Hour(shift.start_time)} -{" "}
                        {formatTime12Hour(shift.end_time)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
