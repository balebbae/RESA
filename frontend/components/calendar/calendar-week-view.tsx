"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import type { ScheduledShift, EmployeeDragData, TimeSlotDropData } from "@/types/schedule";
import type { Employee } from "@/types/employee";
import { generateEmployeeColors } from "@/components/resa/schedule/utils/employee-colors";
import { useWeekNavigation } from "@/contexts/week-navigation-context";
import { useScheduleDragDrop } from "@/contexts/schedule-drag-drop-context";
import { useShiftTemplateContext } from "@/contexts/shift-template-context";

interface WeeklyCalendarProps {
  restaurantId: number | null;
  employees: Employee[];
}

function WeeklyCalendarContent({ employees }: WeeklyCalendarProps) {
  const weekNav = useWeekNavigation();
  const { registerShiftCreationHandler, unregisterShiftCreationHandler } = useScheduleDragDrop();
  const { shiftTemplates, roles, roleColorMap } = useShiftTemplateContext();

  if (!weekNav) {
    throw new Error("WeeklyCalendarContent must be used within WeekNavigationProvider");
  }

  const { currentWeek } = weekNav;

  // State for shifts created via drag and drop
  const [shifts, setShifts] = useState<ScheduledShift[]>([]);

  // Generate employee colors map when employees change
  // This is used to get consistent colors for drag data
  useMemo(() => {
    return generateEmployeeColors(employees.map(emp => emp.id));
  }, [employees]);

  // Shift ID counter (for local shifts without backend)
  const [nextShiftId, setNextShiftId] = useState(1);

  // Create shift handler that will be called from layout's DndContext
  const handleCreateShift = useCallback((
    employeeData: EmployeeDragData,
    timeSlotData: TimeSlotDropData
  ) => {
    // Create a new shift with 2-hour default duration
    const startHour = timeSlotData.hour;
    const endHour = Math.min(startHour + 2, 23); // Default 2-hour shift, cap at 11 PM

    const startTime = `${String(startHour).padStart(2, '0')}:00`;
    const endTime = `${String(endHour).padStart(2, '0')}:00`;

    const newShift: ScheduledShift = {
      id: nextShiftId,
      schedule_id: 1, // Placeholder
      shift_template_id: null,
      role_id: 1, // Placeholder
      employee_id: employeeData.employeeId,
      shift_date: timeSlotData.date,
      start_time: startTime,
      end_time: endTime,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      employee_name: employeeData.employeeName,
      employee_color: employeeData.employeeColor,
    };

    setShifts(prev => [...prev, newShift]);
    setNextShiftId(prev => prev + 1);
  }, [nextShiftId]);

  // Register the shift creation handler with the drag-drop context
  useEffect(() => {
    registerShiftCreationHandler(handleCreateShift);

    return () => {
      unregisterShiftCreationHandler();
    };
  }, [registerShiftCreationHandler, unregisterShiftCreationHandler, handleCreateShift]);

  const handleShiftClick = (shift: ScheduledShift) => {
    console.log("Shift clicked:", shift);
    // TODO: Open shift details dialog
  };

  return (
    <div className="flex flex-col h-full">
      <CalendarGrid
        weekStartDate={currentWeek}
        shifts={shifts}
        onShiftClick={handleShiftClick}
        shiftTemplates={shiftTemplates}
        roles={roles}
        roleColorMap={roleColorMap}
      />
    </div>
  );
}

export function WeeklyCalendar(props: WeeklyCalendarProps) {
  return <WeeklyCalendarContent {...props} />;
}
