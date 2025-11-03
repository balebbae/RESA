import type { ScheduledShift } from "../types/schedule";
import { DayHeader } from "./day-header";
import { TimeColumn } from "./time-column";
import { TimeSlotCell } from "./time-slot-cell";
import { getAllHours, getWeekDates } from "../utils/shift-utils";

interface CalendarGridProps {
  weekStartDate: string; // YYYY-MM-DD format (Sunday)
  shifts: ScheduledShift[];
  onShiftClick?: (shift: ScheduledShift) => void;
}

export function CalendarGrid({ weekStartDate, shifts, onShiftClick }: CalendarGridProps) {
  const weekDates = getWeekDates(weekStartDate);
  const hours = getAllHours();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header row with day columns */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
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
          <div className="sticky left-0 z-10 w-20 bg-sidebar border-r border-border flex-shrink-0">
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
