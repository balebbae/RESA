"use client";

import { useState, useEffect, useRef } from "react";
import type { ShiftTemplate } from "@/types/shift-template";
import type { ScheduledShift } from "@/types/schedule";
import type { Employee } from "@/types/employee";
import type { Role } from "@/types/role";
import { DayColumnOverlay } from "./day-column-overlay";

interface OverlayLayerProps {
  weekDates: string[];
  shiftTemplates: ShiftTemplate[];
  shifts: ScheduledShift[];
  employees: Employee[];
  scheduleId: number | null;
  weekStartDate: string;
  onShiftCreated?: () => void;
  addOptimisticShift?: (shift: ScheduledShift) => void;
  removeOptimisticShift?: (tempId: string | number) => void;
  confirmOptimisticShift?: (tempId: string | number, realShift: ScheduledShift) => void;
  updateOptimisticShift?: (shiftId: string | number, shift: ScheduledShift) => void;
  roles: Role[];
  roleMap: Map<number, Role>;
  rolesLoading: boolean;
}

const TIME_COLUMN_WIDTH = 80; // Must match w-20 in CalendarGrid
const TOTAL_HOURS = 24;
const PIXELS_PER_HOUR = 60;

/**
 * Overlay layer for all shift templates
 * Positioned absolutely over the calendar grid
 * Contains 7 DayColumnOverlay components (one per day)
 */
export function OverlayLayer({
  weekDates,
  shiftTemplates,
  shifts,
  employees,
  scheduleId,
  weekStartDate,
  onShiftCreated,
  addOptimisticShift,
  removeOptimisticShift,
  confirmOptimisticShift,
  updateOptimisticShift,
  roles,
  roleMap,
  rolesLoading,
}: OverlayLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnWidth, setColumnWidth] = useState(0);
  const [hoveredTemplateId, setHoveredTemplateId] = useState<number | null>(null);

  // Measure column width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setColumnWidth(containerWidth / 7);
      }
    };

    updateWidth();

    // Use ResizeObserver for more reliable resize detection
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Don't render until we have column width
  if (columnWidth === 0) {
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          left: `${TIME_COLUMN_WIDTH}px`,
          height: `${TOTAL_HOURS * PIXELS_PER_HOUR}px`,
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        left: `${TIME_COLUMN_WIDTH}px`,
        height: `${TOTAL_HOURS * PIXELS_PER_HOUR}px`,
      }}
    >
      {weekDates.map((date, index) => (
        <DayColumnOverlay
          key={date}
          date={date}
          dayIndex={index}
          columnWidth={columnWidth}
          shiftTemplates={shiftTemplates}
          shifts={shifts}
          employees={employees}
          scheduleId={scheduleId}
          weekStartDate={weekStartDate}
          onShiftCreated={onShiftCreated}
          hoveredTemplateId={hoveredTemplateId}
          onTemplateHover={setHoveredTemplateId}
          addOptimisticShift={addOptimisticShift}
          removeOptimisticShift={removeOptimisticShift}
          confirmOptimisticShift={confirmOptimisticShift}
          updateOptimisticShift={updateOptimisticShift}
          roles={roles}
          roleMap={roleMap}
          rolesLoading={rolesLoading}
        />
      ))}
    </div>
  );
}
