"use client"

import { AlertTriangle } from "lucide-react"
import type { ScheduledShift } from "@/types/schedule"

interface ScheduleWarningsProps {
  unassignedShifts: ScheduledShift[]
}

/**
 * Warning banner for unassigned shifts in the schedule
 * Displayed before sending schedule emails to alert the user
 */
export function ScheduleWarnings({ unassignedShifts }: ScheduleWarningsProps) {
  if (unassignedShifts.length === 0) {
    return null
  }

  return (
    <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
      <div className="flex items-center gap-2 text-yellow-800">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium">
          {unassignedShifts.length} unassigned shift
          {unassignedShifts.length !== 1 ? "s" : ""}
        </span>
      </div>
      <p className="mt-1 text-sm text-yellow-700">
        These shifts have no employee assigned and will not be included in the
        email notifications.
      </p>
    </div>
  )
}
