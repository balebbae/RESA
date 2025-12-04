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
  return (
    <div
      className="h-[60px] border-b border-r bg-white"
      data-day={date}
      data-hour={hour}
    />
  );
}
