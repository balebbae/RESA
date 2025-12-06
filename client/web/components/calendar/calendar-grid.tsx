"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { ScheduledShift } from "@/types/schedule";
import type { ShiftTemplate } from "@/types/shift-template";
import type { Employee } from "@/types/employee";
import type { Role } from "@/types/role";
import { DayHeader } from "./day-header";
import { TimeColumn } from "./time-column";
import { TimeSlotCell } from "./time-slot-cell";
import { OverlayLayer } from "./overlay-layer";
import { CalendarClickMenu } from "./calendar-click-menu";
import { CurrentTimeIndicator } from "./current-time-indicator";
import { getAllHours, getWeekDates } from "@/lib/calendar/shift-utils";
import { getTimezoneAbbreviation } from "@/lib/time";
import {
  calculateClickPosition,
  type CalendarClickPosition,
} from "@/lib/calendar/click-to-time";
import { useRoles } from "@/hooks/use-roles";
import { useRestaurant } from "@/contexts/restaurant-context";
import { useShiftTemplateContext } from "@/contexts/shift-template-context";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { ShiftTemplateFormDialog } from "@/components/schedules/shift-template-form-dialog";

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
  confirmOptimisticShift?: (
    tempId: string | number,
    realShift: ScheduledShift
  ) => void;
  updateOptimisticShift?: (
    shiftId: string | number,
    shift: ScheduledShift
  ) => void;
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
  const { refetch: refetchShiftTemplates } = useShiftTemplateContext();

  // Create role lookup map for O(1) access
  const roleMap = useMemo(() => {
    const map = new Map<number, Role>();
    roles.forEach((role) => map.set(role.id, role));
    return map;
  }, [roles]);

  // State for click-to-create popover
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [clickData, setClickData] = useState<CalendarClickPosition | null>(
    null
  );
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);

  // Refs for calculating click position
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // State for column width (for current time indicator)
  const [columnWidth, setColumnWidth] = useState(0);

  // Measure column width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (gridRef.current) {
        const gridWidth = gridRef.current.offsetWidth;
        setColumnWidth(gridWidth / 7);
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Track if popover was just closed to prevent immediate re-open
  const justClosedRef = useRef(false);

  // Handle popover open state changes
  const handlePopoverOpenChange = (open: boolean) => {
    if (!open) {
      // Mark that we just closed the popover
      justClosedRef.current = true;
      // Reset the flag after a short delay
      setTimeout(() => {
        justClosedRef.current = false;
      }, 100);
    }
    setPopoverOpen(open);
  };

  // Handle click on empty calendar area
  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't trigger if clicking on overlay elements (shift templates)
    if ((e.target as HTMLElement).closest("[data-overlay]")) {
      return;
    }

    // Don't trigger if clicking inside a popover
    if ((e.target as HTMLElement).closest("[data-slot='popover-content']")) {
      return;
    }

    // Don't open new popover if we just closed one
    if (justClosedRef.current) {
      return;
    }

    // If popover is already open, close it
    if (popoverOpen) {
      setPopoverOpen(false);
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    const grid = gridRef.current;
    if (!scrollContainer || !grid) return;

    const gridRect = grid.getBoundingClientRect();
    const scrollTop = scrollContainer.scrollTop;

    const data = calculateClickPosition({
      clientX: e.clientX,
      clientY: e.clientY,
      gridRect,
      scrollTop,
      weekDates,
    });

    setClickData(data);
    setClickPosition({ x: e.clientX, y: e.clientY });
    setPopoverOpen(true);
  };

  // Handle "Create Shift" button click
  const handleCreateShift = () => {
    setPopoverOpen(false);
    setShiftDialogOpen(true);
  };

  // Handle "Create Event" button click (placeholder)
  const handleCreateEvent = () => {
    // No functionality yet
  };

  // Handle shift template creation success
  const handleShiftTemplateSuccess = () => {
    setShiftDialogOpen(false);
    setClickData(null);
    refetchShiftTemplates();
    onShiftCreated?.();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header row with day columns */}
      <div className="sticky top-0 bg-background border-b border-border z-30">
        <div className="flex">
          {/* Empty cell for time column header */}
          <div className="w-20 h-[30px] border-r border-border bg-sidebar flex-shrink-0 flex items-center justify-center text-xs text-muted-foreground font-medium">
            {getTimezoneAbbreviation()}
          </div>

          {/* Day headers */}
          <div className="flex-1 grid grid-cols-7">
            {weekDates.map((date, index) => (
              <DayHeader key={date} date={date} dayIndex={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable grid body */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-background scrollbar-hide"
      >
        {/* Relative container for overlay positioning */}
        <div className="flex relative">
          {/* Time column (sticky left) */}
          <div className="sticky left-0 w-20 bg-sidebar border-r border-border flex-shrink-0 z-20">
            <TimeColumn />
          </div>

          {/* Grid background layer - just borders */}
          <div
            ref={gridRef}
            className="flex-1 grid grid-cols-7 bg-background"
            onClick={handleGridClick}
          >
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

          {/* Current time indicator line */}
          <CurrentTimeIndicator
            weekDates={weekDates}
            columnWidth={columnWidth}
          />

          {/* Click-to-create popover */}
          {clickPosition && (
            <Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
              <PopoverAnchor
                className="fixed w-0 h-0"
                style={{ left: clickPosition.x, top: clickPosition.y }}
              />
              <PopoverContent
                side="right"
                align="start"
                sideOffset={8}
                className="w-48 p-2"
              >
                <CalendarClickMenu
                  onCreateShift={handleCreateShift}
                  onCreateEvent={handleCreateEvent}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Shift Template Form Dialog */}
      <ShiftTemplateFormDialog
        restaurantId={selectedRestaurantId}
        isOpen={shiftDialogOpen}
        onOpenChange={setShiftDialogOpen}
        onSuccess={handleShiftTemplateSuccess}
        initialDayOfWeek={clickData?.dayOfWeek}
        initialStartTime={clickData?.startTime}
        initialEndTime={clickData?.endTime}
      />
    </div>
  );
}
