/**
 * Simple grid cell for the calendar background
 * Provides visual structure (borders) for the time grid
 * All event rendering is handled by the overlay layer
 */
interface TimeSlotCellProps {
  date: string; // YYYY-MM-DD format
  hour: number; // 0-23
}

export function TimeSlotCell({ date, hour }: TimeSlotCellProps) {
  // Check if this is Saturday (last day of week) to avoid double border
  const dateObj = new Date(date + "T00:00:00");
  const isSaturday = dateObj.getDay() === 6;

  return (
    <div
      className={`h-[60px] border-b bg-white ${!isSaturday ? "border-r" : ""}`}
      data-day={date}
      data-hour={hour}
    />
  );
}
