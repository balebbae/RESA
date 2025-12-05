"use client";

import { CalendarGrid } from "@/components/calendar/calendar-grid";
import type { ScheduledShift } from "@/types/schedule";
import type { Employee } from "@/types/employee";
import { useWeekNavigation } from "@/contexts/week-navigation-context";
import { useShiftTemplateContext } from "@/contexts/shift-template-context";
import { useSchedule } from "@/hooks/use-schedule";

interface WeeklyCalendarProps {
  restaurantId: number | null;
  employees: Employee[];
}

function WeeklyCalendarContent({ restaurantId, employees }: WeeklyCalendarProps) {
  const weekNav = useWeekNavigation();
  const { shiftTemplates } = useShiftTemplateContext();

  if (!weekNav) {
    throw new Error("WeeklyCalendarContent must be used within WeekNavigationProvider");
  }

  const { currentWeek } = weekNav;

  // Fetch schedule and shifts for current week
  const {
    schedule,
    shifts,
    loading,
    refetch,
    addOptimisticShift,
    removeOptimisticShift,
    confirmOptimisticShift,
    updateOptimisticShift,
  } = useSchedule(restaurantId, currentWeek);

  const handleShiftClick = (shift: ScheduledShift) => {
    console.log("Shift clicked:", shift);
    // TODO: Open shift edit dialog
  };

  return (
    <div className="flex flex-col h-full">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      ) : (
        <CalendarGrid
          weekStartDate={currentWeek}
          shifts={shifts}
          onShiftClick={handleShiftClick}
          shiftTemplates={shiftTemplates}
          employees={employees}
          scheduleId={schedule?.id || null}
          onShiftCreated={undefined} // No refetch needed with optimistic updates
          addOptimisticShift={addOptimisticShift}
          removeOptimisticShift={removeOptimisticShift}
          confirmOptimisticShift={confirmOptimisticShift}
          updateOptimisticShift={updateOptimisticShift}
        />
      )}
    </div>
  );
}

export function WeeklyCalendar(props: WeeklyCalendarProps) {
  return <WeeklyCalendarContent {...props} />;
}
