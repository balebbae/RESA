"use client";

/**
 * Visual highlight overlay for calendar time selection.
 * Shows a colored overlay when user double-clicks or drags to select a time range.
 */

interface SelectionHighlightProps {
  /** Day index (0-6, Sunday-Saturday) */
  dayIndex: number;
  /** Width of each day column in pixels */
  columnWidth: number;
  /** Start Y position in pixels (relative to grid top) */
  startY: number;
  /** End Y position in pixels (relative to grid top) */
  endY: number;
  /** Width of the time column in pixels */
  timeColumnWidth?: number;
}

const SELECTION_COLOR = "rgba(192, 238, 211, 0.4)";

export function SelectionHighlight({
  dayIndex,
  columnWidth,
  startY,
  endY,
  timeColumnWidth = 80,
}: SelectionHighlightProps) {
  // Calculate actual start/end (handle dragging upward)
  const actualStartY = Math.min(startY, endY);
  const actualEndY = Math.max(startY, endY);
  const height = actualEndY - actualStartY;

  // Don't render if height is too small
  if (height < 5) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        zIndex: 5,
        left: `${timeColumnWidth + dayIndex * columnWidth}px`,
        top: `${actualStartY}px`,
        width: `${columnWidth}px`,
        height: `${height}px`,
        backgroundColor: SELECTION_COLOR,
        boxSizing: "border-box",
      }}
    />
  );
}
