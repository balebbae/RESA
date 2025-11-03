import { useDroppable } from "@dnd-kit/core";
import type { ScheduledShift, TimeSlotDropData } from "../types/schedule";
import { ShiftCard } from "../shifts/shift-card";

interface TimeSlotCellProps {
  date: string; // YYYY-MM-DD format
  hour: number; // 0-23
  shifts: ScheduledShift[]; // All shifts for this specific day/hour
  onShiftClick?: (shift: ScheduledShift) => void;
}

export function TimeSlotCell({ date, hour, shifts, onShiftClick }: TimeSlotCellProps) {
  // Make this cell droppable
  const dropData: TimeSlotDropData = {
    type: 'timeslot',
    date,
    hour,
  };

  const { isOver, setNodeRef } = useDroppable({
    id: `timeslot-${date}-${hour}`,
    data: dropData,
  });

  // Filter shifts that start in this hour slot
  const shiftsInSlot = shifts.filter((shift) => {
    const shiftHour = Math.floor(parseFloat(shift.start_time.split(":")[0]));
    return shift.shift_date === date && shiftHour === hour;
  });

  // Calculate layout for overlapping shifts
  const shiftCount = shiftsInSlot.length;
  const shiftLayouts = shiftsInSlot.map((_, index) => ({
    width: shiftCount > 1 ? 100 / shiftCount : 100,
    offset: shiftCount > 1 ? (100 / shiftCount) * index : 0,
  }));

  return (
    <div
      ref={setNodeRef}
      className={`relative h-[40px] border-b border-r border-border transition-colors ${
        isOver ? 'bg-blue-50 dark:bg-blue-950' : 'bg-background'
      }`}
      data-day={date}
      data-hour={hour}
    >
      {shiftsInSlot.map((shift, index) => (
        <ShiftCard
          key={shift.id}
          shift={shift}
          onClick={onShiftClick}
          layoutProps={shiftLayouts[index]}
        />
      ))}
    </div>
  );
}
