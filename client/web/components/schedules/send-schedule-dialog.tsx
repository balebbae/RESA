"use client"

import { useState, useMemo } from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useRestaurant } from "@/contexts/restaurant-context"
import { useWeekNavigation, formatWeekRange } from "@/contexts/week-navigation-context"
import { useSchedule } from "@/hooks/use-schedule"
import { useEvents } from "@/hooks/use-events"
import { useSendSchedule } from "@/hooks/use-send-schedule"
import { showSuccessToast, showErrorToast } from "@/lib/utils/toast-helpers"
import { getWeekDates, getWeekEndDate } from "@/lib/time"
import { ScheduleOverview } from "./schedule-overview"
import { ScheduleWarnings } from "./schedule-warnings"

interface SendScheduleDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Dialog for reviewing and sending schedule emails to employees
 * Shows schedule overview, warnings for unassigned shifts, and options
 */
export function SendScheduleDialog({
  isOpen,
  onOpenChange,
}: SendScheduleDialogProps) {
  const [includeEvents, setIncludeEvents] = useState(false)

  // Get context data
  const { selectedRestaurantId, selectedRestaurantName } = useRestaurant()
  const weekNavigation = useWeekNavigation()
  const currentWeek = weekNavigation?.currentWeek || ""

  // Fetch schedule and shifts
  const {
    schedule,
    shifts,
    loading: scheduleLoading,
    error: scheduleError,
  } = useSchedule(selectedRestaurantId, currentWeek)

  // Calculate week dates and end date
  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek])
  const weekEndDate = useMemo(() => getWeekEndDate(currentWeek), [currentWeek])

  // Fetch events for the week (only if includeEvents might be used)
  const { events, isLoading: eventsLoading } = useEvents(
    selectedRestaurantId,
    { startDate: currentWeek, endDate: weekEndDate }
  )

  // Send schedule hook
  const { sendSchedule, isSending, error: sendError, clearError } = useSendSchedule()

  // Calculate unassigned shifts
  const unassignedShifts = useMemo(
    () => shifts.filter((s) => s.employee_id === null),
    [shifts]
  )

  // Format week range for display
  const weekRangeDisplay = currentWeek ? formatWeekRange(currentWeek) : ""

  // Overall loading state
  const isLoading = scheduleLoading || eventsLoading

  // Handle send
  const handleSend = async () => {
    if (!selectedRestaurantId || !schedule?.id) {
      showErrorToast("No schedule selected")
      return
    }

    clearError()

    const result = await sendSchedule(
      selectedRestaurantId,
      schedule.id,
      includeEvents
    )

    if (result) {
      onOpenChange(false)

      if (result.failed > 0) {
        showSuccessToast(
          `Schedule sent to ${result.successful} of ${result.total_recipients} employees`
        )
      } else {
        showSuccessToast(
          `Schedule sent successfully to ${result.successful} employee${
            result.successful !== 1 ? "s" : ""
          }`
        )
      }
    }
  }

  // Handle dialog close
  const handleClose = () => {
    if (!isSending) {
      clearError()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Send Schedule</DialogTitle>
          <DialogDescription>
            {selectedRestaurantName
              ? `Review and send the schedule for ${selectedRestaurantName}`
              : "Review and send the schedule"}{" "}
            {weekRangeDisplay && `(${weekRangeDisplay})`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Loading schedule...
              </span>
            </div>
          )}

          {/* Error state */}
          {!isLoading && scheduleError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-center">
              <p className="text-sm text-destructive">{scheduleError}</p>
            </div>
          )}

          {/* No restaurant selected */}
          {!isLoading && !scheduleError && !selectedRestaurantId && (
            <div className="rounded-md border border-dashed border-muted-foreground/25 p-6 text-center">
              <p className="text-muted-foreground">
                Please select a restaurant first
              </p>
            </div>
          )}

          {/* No schedule for week */}
          {!isLoading &&
            !scheduleError &&
            selectedRestaurantId &&
            !schedule && (
              <div className="rounded-md border border-dashed border-muted-foreground/25 p-6 text-center">
                <p className="text-muted-foreground">
                  No schedule exists for this week
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create shifts in the calendar first
                </p>
              </div>
            )}

          {/* Schedule loaded successfully */}
          {!isLoading && !scheduleError && schedule && (
            <>
              {/* Schedule Overview */}
              <ScheduleOverview shifts={shifts} weekDates={weekDates} />

              {/* Unassigned shifts warning */}
              <ScheduleWarnings unassignedShifts={unassignedShifts} />

              {/* Include events option */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-events"
                  checked={includeEvents}
                  onCheckedChange={(checked) =>
                    setIncludeEvents(checked === true)
                  }
                />
                <Label htmlFor="include-events" className="cursor-pointer">
                  Include events in email
                  {events.length > 0 && (
                    <span className="ml-1 text-muted-foreground">
                      ({events.length} event{events.length !== 1 ? "s" : ""} this
                      week)
                    </span>
                  )}
                </Label>
              </div>

              {/* Send error */}
              {sendError && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{sendError}</p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || isLoading || !schedule}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Schedule"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
