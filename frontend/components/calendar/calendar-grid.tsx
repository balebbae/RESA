import type { ScheduledShift } from "@/types/schedule";
import type { ShiftTemplate } from "@/types/shift-template";
import type { Role } from "@/types/role";
import { DayHeader } from "./day-header";
import { TimeColumn } from "./time-column";
import { TimeSlotCell } from "./time-slot-cell";
import { getAllHours, getWeekDates } from "@/lib/calendar/shift-utils";

interface CalendarGridProps {
  weekStartDate: string; // YYYY-MM-DD format (Sunday)
  shifts: ScheduledShift[];
  onShiftClick?: (shift: ScheduledShift) => void;
  shiftTemplates: ShiftTemplate[];
  roles: Role[];
  roleColorMap: Map<number, string>;
}

export function CalendarGrid({
  weekStartDate,
  shifts,
  onShiftClick,
  shiftTemplates,
  roles,
  roleColorMap
}: CalendarGridProps) {
  const weekDates = getWeekDates(weekStartDate);
  const hours = getAllHours();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header row with day columns */}
      <div className="sticky top-0 bg-background border-b border-border">
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
        <div className="flex">
          {/* Time column (sticky left) */}
          <div className="sticky left-0 w-20 bg-sidebar border-r border-border flex-shrink-0">
            <TimeColumn />
          </div>

          {/* Day columns */}
          <div className="flex-1 grid grid-cols-7 bg-background">
            {weekDates.map((date) => (
              <div key={date} className="flex flex-col bg-background">
                {hours.map((hour) => (
                  <TimeSlotCell
                    key={`${date}-${hour}`}
                    date={date}
                    hour={hour}
                    shifts={shifts}
                    onShiftClick={onShiftClick}
                    shiftTemplates={shiftTemplates}
                    roles={roles}
                    roleColorMap={roleColorMap}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
