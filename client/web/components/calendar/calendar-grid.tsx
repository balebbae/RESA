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
// Note: calculateClickPosition no longer used - using inline calculations instead
import { useRoles } from "@/hooks/use-roles";
import { useRestaurant } from "@/contexts/restaurant-context";
import { useShiftTemplateContext } from "@/contexts/shift-template-context";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { ShiftTemplateFormDialog } from "@/components/schedules/shift-template-form-dialog";
import { SelectionHighlight } from "./selection-highlight";
import { hoursToTimeString, roundToQuarterHour } from "@/lib/time";

/** Constants for calendar grid calculations */
const PIXELS_PER_HOUR = 60;
const TIME_COLUMN_WIDTH = 80;
const MIN_SELECTION_PIXELS = 15; // Minimum 15 minutes
const MAX_GRID_HEIGHT = 24 * PIXELS_PER_HOUR; // 1440px for 24 hours
const DEFAULT_SHIFT_DURATION_PIXELS = 2 * PIXELS_PER_HOUR; // 2 hours = 120px

/** Selection state for completed selections (double-click or drag) */
interface SelectionState {
  type: "double-click" | "drag";
  dayIndex: number;
  date: string;
  startY: number;
  endY: number;
  startTime: string;
  endTime: string;
}

/** Drag state during active drag operation */
interface DragState {
  isDragging: boolean;
  startY: number;
  currentY: number;
  dayIndex: number;
  date: string;
}

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
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);

  // State for time selection (double-click or drag)
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

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
      // Clear selection when popover closes
      setSelection(null);
    }
    setPopoverOpen(open);
  };

  /**
   * Convert pixel Y position to time string (HH:MM format)
   */
  const pixelsToTime = (y: number): string => {
    const hours = roundToQuarterHour(y / PIXELS_PER_HOUR);
    return hoursToTimeString(Math.min(hours, 23.75));
  };

  /**
   * Snap Y position to 15-minute increments (15px)
   */
  const snapToGrid = (y: number): number => {
    return Math.round(y / MIN_SELECTION_PIXELS) * MIN_SELECTION_PIXELS;
  };

  /**
   * Calculate day index from X position
   */
  const getDayIndexFromX = (clientX: number, gridRect: DOMRect): number => {
    const relativeX = clientX - gridRect.left;
    const dayIndex = Math.floor(relativeX / columnWidth);
    return Math.max(0, Math.min(6, dayIndex));
  };

  /**
   * Handle double-click on calendar grid - creates 2-hour selection
   */
  const handleGridDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't trigger if clicking on overlay elements (shift templates)
    if ((e.target as HTMLElement).closest("[data-overlay]")) {
      return;
    }

    // Don't trigger if clicking inside a popover
    if ((e.target as HTMLElement).closest("[data-slot='popover-content']")) {
      return;
    }

    const grid = gridRef.current;
    if (!grid) return;

    const gridRect = grid.getBoundingClientRect();

    // Calculate position - gridRect.top already accounts for scroll position
    const relativeY = e.clientY - gridRect.top;
    const startY = snapToGrid(relativeY);
    const endY = Math.min(startY + DEFAULT_SHIFT_DURATION_PIXELS, MAX_GRID_HEIGHT);

    const dayIndex = getDayIndexFromX(e.clientX, gridRect);

    // Calculate times
    const startTime = pixelsToTime(startY);
    const endTime = pixelsToTime(endY);

    setSelection({
      type: "double-click",
      dayIndex,
      date: weekDates[dayIndex],
      startY,
      endY,
      startTime,
      endTime,
    });

    setClickPosition({ x: e.clientX, y: e.clientY });
    setPopoverOpen(true);
  };

  /**
   * Handle mouse down on calendar grid - start drag selection
   */
  const handleGridMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't start drag on overlay elements
    if ((e.target as HTMLElement).closest("[data-overlay]")) {
      return;
    }

    // Don't start drag inside a popover
    if ((e.target as HTMLElement).closest("[data-slot='popover-content']")) {
      return;
    }

    // Don't start if popover is open
    if (popoverOpen) {
      return;
    }

    const grid = gridRef.current;
    if (!grid) return;

    const gridRect = grid.getBoundingClientRect();

    // Calculate position - gridRect.top already accounts for scroll position
    const relativeY = e.clientY - gridRect.top;
    const snappedY = snapToGrid(relativeY);
    const dayIndex = getDayIndexFromX(e.clientX, gridRect);

    // Clear any existing selection and start drag
    setSelection(null);
    setDragState({
      isDragging: true,
      startY: snappedY,
      currentY: snappedY,
      dayIndex,
      date: weekDates[dayIndex],
    });
  };

  /**
   * Handle mouse move on calendar grid - update drag selection
   */
  const handleGridMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState?.isDragging) return;

    const grid = gridRef.current;
    if (!grid) return;

    const gridRect = grid.getBoundingClientRect();

    // Calculate Y position and clamp to grid bounds
    // gridRect.top already accounts for scroll position
    const relativeY = e.clientY - gridRect.top;
    const clampedY = Math.max(0, Math.min(MAX_GRID_HEIGHT, relativeY));
    const snappedY = snapToGrid(clampedY);

    setDragState((prev) =>
      prev ? { ...prev, currentY: snappedY } : null
    );
  };

  /**
   * Handle mouse up on calendar grid - complete drag selection
   */
  const handleGridMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState?.isDragging) return;

    const { startY, currentY, dayIndex, date } = dragState;

    // Calculate actual start/end (handle dragging upward)
    const actualStartY = Math.min(startY, currentY);
    const actualEndY = Math.max(startY, currentY);

    // Clear drag state
    setDragState(null);

    // Minimum selection: 15px (15 minutes)
    if (actualEndY - actualStartY < MIN_SELECTION_PIXELS) {
      return;
    }

    // Calculate times
    const startTime = pixelsToTime(actualStartY);
    const endTime = pixelsToTime(actualEndY);

    setSelection({
      type: "drag",
      dayIndex,
      date,
      startY: actualStartY,
      endY: actualEndY,
      startTime,
      endTime,
    });

    setClickPosition({ x: e.clientX, y: e.clientY });
    setPopoverOpen(true);
  };

  // Handle mouse up outside the grid (global listener)
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragState?.isDragging) {
        setDragState(null);
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [dragState?.isDragging]);

  // Handle Escape key to clear selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelection(null);
        setPopoverOpen(false);
        setDragState(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    setSelection(null);
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
            className={`flex-1 grid grid-cols-7 bg-background ${
              dragState?.isDragging ? "select-none" : ""
            }`}
            onDoubleClick={handleGridDoubleClick}
            onMouseDown={handleGridMouseDown}
            onMouseMove={handleGridMouseMove}
            onMouseUp={handleGridMouseUp}
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

          {/* Selection highlight overlay */}
          {(selection || dragState?.isDragging) && (
            <SelectionHighlight
              dayIndex={selection?.dayIndex ?? dragState?.dayIndex ?? 0}
              columnWidth={columnWidth}
              startY={
                selection?.startY ??
                Math.min(dragState?.startY ?? 0, dragState?.currentY ?? 0)
              }
              endY={
                selection?.endY ??
                Math.max(dragState?.startY ?? 0, dragState?.currentY ?? 0)
              }
              timeColumnWidth={TIME_COLUMN_WIDTH}
            />
          )}

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
        initialDayOfWeek={selection?.dayIndex}
        initialStartTime={selection?.startTime}
        initialEndTime={selection?.endTime}
      />
    </div>
  );
}
