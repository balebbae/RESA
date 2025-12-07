"use client";

import { useState, useEffect, useRef } from "react";
import { normalizeDate } from "@/lib/time";

interface CurrentTimeIndicatorProps {
  weekDates: string[];
  columnWidth: number;
}

const TIME_COLUMN_WIDTH = 80; // Must match w-20 in CalendarGrid
const PIXELS_PER_HOUR = 60;

/**
 * Displays a red line across the calendar at the current time.
 * - Shows a time badge on the left (e.g., "8:16PM")
 * - Thick line segment on today's column
 * - Thin line across all other days
 * - Only visible when today is in the displayed week
 */
export function CurrentTimeIndicator({
  weekDates,
  columnWidth,
}: CurrentTimeIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Calculate today's index in the week (-1 if not visible)
  const todayYear = currentTime.getFullYear();
  const todayMonth = String(currentTime.getMonth() + 1).padStart(2, "0");
  const todayDay = String(currentTime.getDate()).padStart(2, "0");
  const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;
  
  const todayIndex = weekDates.findIndex(
    (date) => normalizeDate(date) === todayStr
  );

  // Don't render if today is not in the displayed week
  if (todayIndex === -1) {
    return null;
  }

  // Don't render until we have column width
  if (columnWidth === 0) {
    return null;
  }

  // Calculate vertical position based on current time
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const decimalHours = hours + minutes / 60;
  const topPosition = decimalHours * PIXELS_PER_HOUR;

  // Format time for badge (e.g., "8:16PM")
  const timeStr = currentTime
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(" ", "");

  // Calculate the total width of the grid (all 7 columns)
  const totalGridWidth = columnWidth * 7;

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 pointer-events-none z-[25]"
      style={{
        top: `${topPosition}px`,
        height: "0px",
      }}
    >
      {/* Time badge - positioned in the time column area */}
      <div
        className="absolute flex items-center justify-end pr-0 pt-0.5"
        style={{
          left: 0,
          width: `${TIME_COLUMN_WIDTH}px`,
          top: "-9px", // Center the badge vertically on the line
        }}
      >
        <span className="bg-[#f04843] text-white text-[11px] font-medium px-1.5 py-0.5 rounded leading-none z-50">
          {timeStr}
        </span>
      </div>

      {/* Horizontal line container - starts after time column */}
      <div
        className="absolute"
        style={{
          left: `${TIME_COLUMN_WIDTH}px`,
          width: `${totalGridWidth}px`,
          top: 0,
        }}
      >
        {/* Thin line spanning all columns */}
        <div
          className="absolute w-full bg-[#f04843]"
          style={{
            height: "1px",
            top: 0,
          }}
        />

        {/* Thick line segment for today's column */}
        <div
          className="absolute bg-[#f04843]"
          style={{
            height: "2px",
            top: "-0.5px", // Center the thick line on the thin line
            left: `${todayIndex * columnWidth}px`,
            width: `${columnWidth}px`,
          }}
        />
      </div>
    </div>
  );
}
