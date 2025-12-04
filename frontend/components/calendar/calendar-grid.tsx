import { useMemo } from "react";
import type { ScheduledShift } from "@/types/schedule";
import type { ShiftTemplate } from "@/types/shift-template";
import type { Employee } from "@/types/employee";
import type { Role } from "@/types/role";
import { DayHeader } from "./day-header";
import { TimeColumn } from "./time-column";
import { TimeSlotCell } from "./time-slot-cell";
import { OverlayLayer } from "./overlay-layer";
import { getAllHours, getWeekDates } from "@/lib/calendar/shift-utils";
import { useRoles } from "@/hooks/use-roles";
import { useRestaurant } from "@/contexts/restaurant-context";

interface CalendarGridProps {
  weekStartDate: string; // YYYY-MM-DD format (Sunday)
  shifts: ScheduledShift[];
  onShiftClick?: (shift: ScheduledShift) => void;
  shiftTemplates: ShiftTemplate[];
  employees: Employee[];
  loadingTimeSlot?: string | null; // Format: "YYYY-MM-DD-HH"
  scheduleId?: number | null;
  onShiftCreated?: () => void;
  addOptimisticShift?: (shift: ScheduledShift) => void;
  removeOptimisticShift?: (tempId: string | number) => void;
  confirmOptimisticShift?: (tempId: string | number, realShift: ScheduledShift) => void;
  updateOptimisticShift?: (shiftId: string | number, shift: ScheduledShift) => void;
}

export function CalendarGrid({
  weekStartDate,
  shifts,
  shiftTemplates,
  employees,
  scheduleId,
  onShiftCreated,
  addOptimisticShift,
  removeOptimisticShift,
  confirmOptimisticShift,
  updateOptimisticShift,
}: CalendarGridProps) {
  const weekDates = getWeekDates(weekStartDate);
  const hours = getAllHours();

  // Fetch roles once at grid level
  const { selectedRestaurantId } = useRestaurant();
  const { roles, isLoading: rolesLoading } = useRoles(selectedRestaurantId);

  // Create role lookup map for O(1) access
  const roleMap = useMemo(() => {
    const map = new Map<number, Role>();
    roles.forEach((role) => map.set(role.id, role));
    return map;
  }, [roles]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header row with day columns */}
      <div className="sticky top-0 bg-background border-b border-border z-30">
        <div className="flex">
          {/* Empty cell for time column header */}
          <div className="w-20 h-[40px] border-r border-border bg-sidebar flex-shrink-0" />

          {/* Day headers */}
          <div className="flex-1 grid grid-cols-7">
            {weekDates.map((date, index) => (
              <DayHeader key={date} date={date} dayIndex={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable grid body */}
      <div className="flex-1 overflow-y-auto bg-background">
        {/* Relative container for overlay positioning */}
        <div className="flex relative">
          {/* Time column (sticky left) */}
          <div className="sticky left-0 w-20 bg-sidebar border-r border-border flex-shrink-0 z-20">
            <TimeColumn />
          </div>

          {/* Grid background layer - just borders */}
          <div className="flex-1 grid grid-cols-7 bg-background">
            {weekDates.map((date) => (
              <div key={date} className="flex flex-col bg-background">
                {hours.map((hour) => (
                  <TimeSlotCell
                    key={`${date}-${hour}`}
                    date={date}
                    hour={hour}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Overlay layer for shift templates */}
          <OverlayLayer
            weekDates={weekDates}
            shiftTemplates={shiftTemplates}
            shifts={shifts}
            employees={employees}
            scheduleId={scheduleId ?? null}
            weekStartDate={weekStartDate}
            onShiftCreated={onShiftCreated}
            addOptimisticShift={addOptimisticShift}
            removeOptimisticShift={removeOptimisticShift}
            confirmOptimisticShift={confirmOptimisticShift}
            updateOptimisticShift={updateOptimisticShift}
            roles={roles}
            roleMap={roleMap}
            rolesLoading={rolesLoading}
          />
        </div>
      </div>
    </div>
  );
}
